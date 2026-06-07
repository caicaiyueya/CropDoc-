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
      case 'purgeUserHistory': return await purgeUserHistoryAction(data)
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

function buildTrend(current, previous) {
  if (!previous) {
    return { text: current ? '新增长' : '—', dir: current ? 'up' : 'flat' }
  }
  const pct = Math.round(((current - previous) / previous) * 100)
  return {
    text: `${pct >= 0 ? '+' : ''}${pct}%`,
    dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat'
  }
}

async function dashboard() {
  const _ = db.command
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const thisWeek = _.gte(weekStart)
  const prevWeek = _.and(_.gte(prevWeekStart), _.lt(weekStart))

  const [
    users, detects, pending, news,
    usersThisWeek, usersPrevWeek,
    detectsThisWeek, detectsPrevWeek
  ] = await Promise.all([
    db.collection('users').count(),
    db.collection('detect_records').count(),
    db.collection('posts').where({ status: 'pending' }).count(),
    db.collection('news').count(),
    db.collection('users').where({ createdAt: thisWeek }).count(),
    db.collection('users').where({ createdAt: prevWeek }).count(),
    db.collection('detect_records').where({ createdAt: thisWeek }).count(),
    db.collection('detect_records').where({ createdAt: prevWeek }).count()
  ])

  return ok({
    userCount: users.total,
    detectCount: detects.total,
    todayDetectCount: detects.total,
    pendingPostCount: pending.total,
    newsCount: news.total,
    trends: {
      users: buildTrend(usersThisWeek.total, usersPrevWeek.total),
      detects: buildTrend(detectsThisWeek.total, detectsPrevWeek.total)
    }
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

async function purgeUserHistoryAction(data = {}) {
  const { purgeUserHistory } = require('./lib/purge-user')
  const result = await purgeUserHistory(db, data)
  if (!result.ok) return fail(result.message, 404)
  return ok(result)
}
