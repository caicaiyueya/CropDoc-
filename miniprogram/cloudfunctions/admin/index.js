const cloud = require('./lib/cloud')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function ok(data) { return { code: 200, message: 'success', data } }
function fail(msg, code = 500) { return { code, message: msg, data: null } }

async function handleRequest(payload) {
  const { action, data = {}, token } = payload

  if (action === 'login') {
    const res = await db.collection('admins').where({ username: data.username, password: data.password }).limit(1).get()
    if (!res.data.length) return fail('用户名或密码错误', 401)
    const admin = res.data[0]
    const adminToken = Buffer.from(`${admin._id}:${admin.username}`).toString('base64')
    return ok({ token: adminToken, admin: { id: admin._id, username: admin.username, nickname: admin.nickname } })
  }

  if (!token) return fail('未登录', 401)
  const decoded = Buffer.from(token, 'base64').toString()
  const adminId = decoded.split(':')[0]
  const adminRes = await db.collection('admins').doc(adminId).get().catch(() => null)
  if (!adminRes || !adminRes.data) return fail('令牌无效', 401)

  switch (action) {
      case 'dashboard': return await dashboard()
      case 'listBanners': return ok((await db.collection('banners').orderBy('sortOrder', 'asc').get()).data)
      case 'saveBanner': return await saveDoc('banners', data)
      case 'deleteBanner': return await deleteDoc('banners', data.id)
      case 'listNews': return ok((await db.collection('news').orderBy('publishTime', 'desc').get()).data)
      case 'saveNews': return await saveDoc('news', data)
      case 'deleteNews': return await deleteDoc('news', data.id)
      case 'listDiseases': return ok((await db.collection('diseases').get()).data)
      case 'saveDisease': return await saveDoc('diseases', data)
      case 'deleteDisease': return await deleteDoc('diseases', data.id)
      case 'listPosts': return ok((await db.collection('posts').where({ status: data.status || 'pending' }).orderBy('createdAt', 'desc').get()).data)
      case 'auditPost': return await auditPost(data)
      case 'deletePost': return await deleteDoc('posts', data.id)
      case 'listUsers': return ok((await db.collection('users').orderBy('createdAt', 'desc').get()).data)
      case 'updateUserStatus': return await updateUserStatus(data)
      default: return fail('未知操作')
  }
}

exports.main = async (event) => {
  try {
    let payload = event
    if (event.body) {
      payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body
    }
    const result = await handleRequest(payload)
    if (event.httpMethod) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: JSON.stringify(result)
      }
    }
    return result
  } catch (e) {
    const err = fail(e.message)
    if (event.httpMethod) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(err) }
    }
    return err
  }
}

async function dashboard() {
  const [users, detects, pending, news] = await Promise.all([
    db.collection('users').count(),
    db.collection('detect_records').count(),
    db.collection('posts').where({ status: 'pending' }).count(),
    db.collection('news').count()
  ])
  return ok({
    userCount: users.total,
    todayDetectCount: detects.total,
    pendingPostCount: pending.total,
    newsCount: news.total
  })
}

async function saveDoc(col, data) {
  const { _id, ...rest } = data
  if (_id) {
    await db.collection(col).doc(_id).update({ data: rest })
    return ok({ _id })
  }
  rest.createdAt = db.serverDate()
  const res = await db.collection(col).add({ data: rest })
  return ok({ _id: res._id })
}

async function deleteDoc(col, id) {
  await db.collection(col).doc(id).remove()
  return ok()
}

async function auditPost({ id, status, pinned }) {
  const update = { status }
  if (pinned !== undefined) update.pinned = pinned
  await db.collection('posts').doc(id).update({ data: update })
  return ok()
}

async function updateUserStatus({ id, status }) {
  await db.collection('users').doc(id).update({ data: { status } })
  return ok()
}
