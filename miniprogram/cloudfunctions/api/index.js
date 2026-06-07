const cloud = require('./lib/cloud')
const { callAiService, setRuntimeContext, resolveHttpBaseUrl, SETUP_HINT } = require('./lib/container')
const diseaseLib = require('./lib/disease')
const deepseek = require('./lib/deepseek')
const { getAiConfigSummary, getDetectConfigSummary, getLlmApiKey, getCloudRunService, getInferenceMode, isMockDetect, isMockAi } = require('./lib/env')
const huggingface = require('./lib/huggingface')
const { ensureCollections } = require('./lib/db')
const { getStandardImageUrl } = require('./lib/standard-images')

function ok(data) { return { code: 200, message: 'success', data } }
function fail(message, code = 500) { return { code, message, data: null } }

function parseContainerResponse(res, actionLabel) {
  if (!res) throw new Error(`${actionLabel}：云托管无响应`)
  const statusCode = res.statusCode || res.status || 0
  let body = res.data
  if (Buffer.isBuffer(body)) body = body.toString('utf8')
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch (e) { /* keep raw string */ }
  }
  if (statusCode >= 400) {
    const detail = body?.detail
      || body?.message
      || (body?.code ? `${body.code}: ${body.message || ''}` : '')
      || (typeof body === 'string' ? body : JSON.stringify(body))
    throw new Error(`${actionLabel}(${statusCode}): ${detail}`)
  }
  return body
}

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const QUICK_MENUS = [
  { icon: '📷', name: '病虫害识别', path: '/pages/detect/index' },
  { iconType: 'chat', name: 'AI问诊', path: '/pages/diagnose/index' },
  { icon: '👨‍🌾', name: '农友交流', path: '/pages/community/index' },
  { icon: '📋', name: '诊断记录', path: '/pages/profile/history' }
]

exports.main = async (event, context) => {
  setRuntimeContext(context)
  const { action, data = {} } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    switch (action) {
      case 'setup': return await setup()
      case 'login': return await login(openid)
      case 'home': return await home()
      case 'crops': return ok(diseaseLib.getCrops())
      case 'detect': return await detect(openid, data)
      case 'detectConfig': return detectConfig()
      case 'detectHealth': return await detectHealth()
      case 'aiHealth': return await aiHealth()
      case 'configStatus': return configStatus()
      case 'diagnose': return await diagnose(openid, data)
      case 'chatSend': return await chatSend(openid, data)
      case 'getProfile': return await getProfile(openid)
      case 'updateProfile': return await updateProfile(openid, data)
      case 'feedback': return await feedback(openid, data)
      case 'detectHistory': return await detectHistory(openid)
      case 'listFavorites': return await listFavorites(openid)
      case 'listPosts': return await listPosts(data)
      case 'getPost': return await getPost(openid, data)
      case 'createPost': return await createPost(openid, data)
      case 'addComment': return await addComment(openid, data)
      case 'toggleFavorite': return await toggleFavorite(openid, data)
      case 'getDisease': return await getDisease(data)
      case 'getNews': return await getNews(data)
      case 'listNews': return await listNews(data)
      default: return fail('未知操作: ' + action, 400)
    }
  } catch (e) {
    console.error(e)
    return fail(e.message || '服务器错误')
  }
}

async function setup() {
  await ensureCollections(db)
  return ok({ message: '数据库集合已就绪，请在云开发控制台确认集合已创建' })
}

async function login(openid) {
  await ensureCollections(db)
  const users = db.collection('users')
  const found = await users.where({ openid }).limit(1).get()
  let user
  if (found.data.length === 0) {
    user = {
      openid,
      nickname: '农友' + openid.slice(-4),
      avatar: '',
      phone: '',
      status: 'active',
      createdAt: db.serverDate()
    }
    const addRes = await users.add({ data: user })
    user._id = addRes._id
  } else {
    user = found.data[0]
  }
  return ok({ user })
}

async function home() {
  await ensureCollections(db)
  const [banners, news, postsRes] = await Promise.all([
    db.collection('banners').where({ enabled: true }).orderBy('sortOrder', 'asc').get(),
    db.collection('news').where({ status: 'published' }).orderBy('publishTime', 'desc').limit(5).get(),
    db.collection('posts').where({ status: 'approved' }).orderBy('createdAt', 'desc').limit(30).get()
  ])
  const sciencePosts = postsRes.data
    .filter(p => p.postType === 'science')
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    .slice(0, 10)
  return ok({
    banners: banners.data,
    quickMenus: QUICK_MENUS,
    sciencePosts,
    latestNews: news.data
  })
}

async function predictImage(fileID, crop, clientAi) {
  if (clientAi && clientAi.disease_key) {
    return {
      disease_key: clientAi.disease_key,
      confidence: clientAi.confidence,
      mock: clientAi.mock === true,
      model: clientAi.model
    }
  }

  if (isMockDetect()) {
    const mock = diseaseLib.mockPredict(crop)
    return { ...mock, mock: true }
  }

  const mode = getInferenceMode()

  if (mode === 'hf_api') {
    const result = await huggingface.predictImage(fileID, crop, process.env.HF_API_TOKEN)
    return { ...result, mock: false }
  }

  if (mode !== 'cloud_run') {
    throw new Error(`不支持的识别模式: ${mode}`)
  }

  const urlRes = await cloud.getTempFileURL({ fileList: [fileID] })
  const fileItem = urlRes.fileList && urlRes.fileList[0]
  const imageUrl = fileItem && fileItem.tempFileURL
  if (!imageUrl) {
    const errMsg = fileItem && fileItem.errMsg ? fileItem.errMsg : '无法获取图片临时访问地址'
    throw new Error(errMsg)
  }

  const res = await callAiService({
    path: '/predict',
    method: 'POST',
    data: { image_url: imageUrl, crop },
    timeout: 55000
  })
  const body = parseContainerResponse(res, '识别服务')
  if (!body?.disease_key) {
    throw new Error(body?.detail || body?.message || '识别服务返回异常')
  }
  return { ...body, mock: body.mock === true }
}

function detectConfig() {
  const summary = getDetectConfigSummary()
  const httpBase = resolveHttpBaseUrl()
  return ok({
    ...summary,
    httpBaseConfigured: !!httpBase,
    httpBasePreview: httpBase ? httpBase.replace(/^https?:\/\//, '').slice(0, 40) : '',
    setupHint: httpBase ? '' : SETUP_HINT
  })
}

async function detectHealth() {
  const config = getDetectConfigSummary()
  if (config.mockDetect) {
    return ok({
      ...config,
      mode: 'mock',
      message: 'MOCK_DETECT=true，当前为云函数内模拟识别',
      hint: '将 cloud-config.js 中 MOCK_DETECT 设为 false 并重新上传 api 云函数'
    })
  }

  const mode = getInferenceMode()
  if (mode === 'hf_api') {
    return ok({
      ...config,
      mode: 'hf_api',
      model: process.env.HF_MODEL_ID || 'Arko007/nfnet-f1-plant-disease',
      tokenConfigured: !!process.env.HF_API_TOKEN
    })
  }

  const res = await callAiService({ path: '/health', method: 'GET' })
  const health = parseContainerResponse(res, '健康检查')
  return ok({
    ...config,
    mode: 'cloud_run',
    service: getCloudRunService(),
    health
  })
}

async function detect(openid, { crop, fileID, clientAi }) {
  const ai = await predictImage(fileID, crop, clientAi)
  const resolved = diseaseLib.resolve(ai.disease_key)
  const confidence = ai.confidence || 0.75
  const level = diseaseLib.levelOf(confidence)

  const record = {
    openid,
    crop: resolved.crop,
    cropCn: resolved.cropCn,
    imageFileID: fileID,
    diseaseKey: ai.disease_key,
    diseaseName: resolved.diseaseCn,
    diseaseCn: resolved.diseaseCn,
    confidence,
    level,
    healthy: resolved.healthy,
    createdAt: db.serverDate()
  }
  const addRes = await db.collection('detect_records').add({ data: record })

  const official = await db.collection('diseases').where({ diseaseKey: ai.disease_key }).limit(1).get()
  const officialDisease = official.data[0] || null
  const standardImageUrl = (officialDisease && officialDisease.standardImageUrl)
    || getStandardImageUrl(ai.disease_key)
    || ''

  return ok({
    ...resolved,
    confidence,
    level,
    detectId: addRes._id,
    userImage: fileID,
    standardImageUrl,
    officialDisease,
    inferenceMock: ai.mock === true,
    inferenceModel: ai.mock ? 'mock' : (ai.model || 'Arko007/nfnet-f1-plant-disease')
  })
}

function configStatus() {
  return ok({
    detect: getDetectConfigSummary(),
    ai: getAiConfigSummary(),
    hint: '若 mockDetect/mockAi 为 true，请确认已上传 lib/cloud-config.js 并重新部署 api 云函数（所有文件）'
  })
}

async function aiHealth() {
  const summary = getAiConfigSummary()
  if (summary.mockAi) {
    return ok({
      ...summary,
      mode: 'mock',
      message: 'MOCK_AI=true，当前为模拟问诊',
      hint: '将 llm-config.js 或云控制台 MOCK_AI 设为 false'
    })
  }
  if (!summary.apiKeyConfigured) {
    return fail('未配置 DEEPSEEK_API_KEY，请编辑 lib/cloud-config.js 后重新上传 api 云函数', 500)
  }

  try {
    const reply = await deepseek.chat([
      { role: 'user', content: '请只回复：连通成功' }
    ], getLlmApiKey())
    return ok({
      ...summary,
      mode: 'llm',
      connected: true,
      sample: String(reply).slice(0, 120)
    })
  } catch (e) {
    return fail(`大模型连通失败: ${e.message}`, 500)
  }
}

async function diagnose(openid, { detectId }) {
  const rec = await db.collection('detect_records').doc(detectId).get()
  const detect = rec.data
  if (!detect || detect.openid !== openid) return fail('识别记录不存在', 404)

  const apiKey = getLlmApiKey()
  const result = await deepseek.autoDiagnose(
    detect.cropCn,
    detect.diseaseName,
    detect.confidence,
    apiKey
  )

  await db.collection('diagnose_records').add({
    data: {
      openid,
      detectId,
      result,
      aiMock: !!result._mock,
      createdAt: db.serverDate()
    }
  })
  if (result._mock) delete result._mock
  return ok(result)
}

async function chatSend(openid, { sessionId, message }) {
  let sid = sessionId
  if (!sid) {
    const addRes = await db.collection('chat_sessions').add({
      data: {
        openid,
        title: message.length > 20 ? message.substring(0, 20) : message,
        createdAt: db.serverDate()
      }
    })
    sid = addRes._id
  }

  await db.collection('chat_messages').add({
    data: { sessionId: sid, role: 'user', content: message, createdAt: db.serverDate() }
  })

  const history = await db.collection('chat_messages').where({ sessionId: sid }).orderBy('createdAt', 'asc').get()
  const messages = [{ role: 'system', content: '你是云农智诊农业助手，请用简洁专业的语言回答农户问题，并声明建议仅供参考。' }]
  history.data.forEach(m => messages.push({ role: m.role, content: m.content }))

  const apiKey = getLlmApiKey()
  const reply = await deepseek.chat(messages, apiKey)

  await db.collection('chat_messages').add({
    data: { sessionId: sid, role: 'assistant', content: reply, createdAt: db.serverDate() }
  })

  return ok({ sessionId: sid, reply })
}

async function getProfile(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get()
  return ok(res.data[0] || {})
}

async function updateProfile(openid, data) {
  const res = await db.collection('users').where({ openid }).limit(1).get()
  if (!res.data.length) return fail('用户不存在', 404)
  const update = {}
  if (data.nickname) update.nickname = data.nickname
  if (data.avatar) update.avatar = data.avatar
  if (data.phone) update.phone = data.phone
  await db.collection('users').doc(res.data[0]._id).update({ data: update })
  return ok(await getProfile(openid).then(r => r.data))
}

async function feedback(openid, { content, contact }) {
  await db.collection('feedbacks').add({
    data: { openid, content, contact: contact || '', createdAt: db.serverDate() }
  })
  return ok()
}

async function detectHistory(openid) {
  const res = await db.collection('detect_records').where({ openid }).orderBy('createdAt', 'desc').limit(50).get()
  return ok({ records: res.data })
}

async function listFavorites(openid) {
  const res = await db.collection('favorites').where({ openid }).orderBy('createdAt', 'desc').get()
  const list = await Promise.all(res.data.map(async item => {
    let title = ''
    if (item.targetType === 'post') {
      try {
        const post = await db.collection('posts').doc(item.targetId).get()
        title = post.data.title || ''
      } catch (e) { /* post may have been removed */ }
    } else if (item.targetType === 'disease') {
      try {
        const disease = await db.collection('diseases').doc(item.targetId).get()
        title = disease.data.nameCn || ''
      } catch (e) { /* disease may have been removed */ }
    }
    return { ...item, title }
  }))
  return ok(list)
}

async function listPosts({ page = 0, size = 20 } = {}) {
  const res = await db.collection('posts')
    .where({ status: 'approved' })
    .orderBy('createdAt', 'desc')
    .skip(page * size)
    .limit(size)
    .get()
  res.data.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
  const posts = await enrichPosts(res.data)
  return ok({ records: posts })
}

async function getPost(openid, { postId }) {
  const post = await db.collection('posts').doc(postId).get()
  const enriched = (await enrichPosts([post.data]))[0]
  const comments = await db.collection('comments').where({ postId }).orderBy('createdAt', 'asc').get()
  const commentList = await Promise.all(comments.data.map(async c => {
    const u = await db.collection('users').where({ openid: c.openid }).limit(1).get()
    return { ...c, nickname: u.data[0] ? u.data[0].nickname : '农友' }
  }))
  let favorited = false
  if (openid) {
    const fav = await db.collection('favorites').where({ openid, targetType: 'post', targetId: postId }).count()
    favorited = fav.total > 0
  }
  return ok({ ...enriched, comments: commentList, favorited })
}

async function createPost(openid, data) {
  const addRes = await db.collection('posts').add({
    data: {
      openid,
      title: data.title,
      content: data.content,
      images: data.images || '',
      postType: data.postType || 'discussion',
      diseaseId: data.diseaseId || '',
      status: 'pending',
      pinned: false,
      likeCount: 0,
      createdAt: db.serverDate()
    }
  })
  return ok({ _id: addRes._id, status: 'pending' })
}

async function addComment(openid, { postId, content }) {
  await db.collection('comments').add({
    data: { postId, openid, content, createdAt: db.serverDate() }
  })
  return ok()
}

async function toggleFavorite(openid, { targetType, targetId }) {
  const found = await db.collection('favorites').where({ openid, targetType, targetId }).limit(1).get()
  if (found.data.length) {
    await db.collection('favorites').doc(found.data[0]._id).remove()
    return ok(null)
  }
  await db.collection('favorites').add({
    data: { openid, targetType, targetId, createdAt: db.serverDate() }
  })
  return ok({ favorited: true })
}

async function getDisease({ id }) {
  const res = await db.collection('diseases').doc(id).get()
  return ok(res.data)
}

async function getNews({ id }) {
  const res = await db.collection('news').doc(id).get()
  return ok(res.data)
}

async function listNews({ page = 1, pageSize = 10 } = {}) {
  const skip = Math.max(0, (page - 1) * pageSize)
  const res = await db.collection('news')
    .where({ status: 'published' })
    .orderBy('publishTime', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()
  return ok(res.data)
}

async function enrichPosts(posts) {
  return Promise.all(posts.map(async p => {
    if (p.openid === 'official_yunnong' || p.openid === 'system') {
      return { ...p, nickname: '云农智诊官方', isOfficial: true }
    }
    const u = await db.collection('users').where({ openid: p.openid }).limit(1).get()
    const nickname = u.data[0] ? u.data[0].nickname : '农友'
    return { ...p, nickname, isOfficial: u.data[0]?.role === 'official' }
  }))
}
