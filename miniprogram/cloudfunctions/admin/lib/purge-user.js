const BATCH = 20

async function removeByOpenid(db, collection, openid) {
  let removed = 0
  while (true) {
    const res = await db.collection(collection).where({ openid }).limit(BATCH).get()
    if (!res.data.length) break
    for (const doc of res.data) {
      await db.collection(collection).doc(doc._id).remove()
      removed += 1
    }
    if (res.data.length < BATCH) break
  }
  return removed
}

async function findUsers(db, { nickname, openidSuffix }) {
  if (nickname) {
    const exact = await db.collection('users').where({ nickname }).get()
    if (exact.data.length) return exact.data
  }

  if (nickname || openidSuffix) {
    const suffix = (openidSuffix || (nickname.startsWith('农友') ? nickname.slice(2) : nickname)).toLowerCase()
    const all = await db.collection('users').limit(100).get()
    return all.data.filter(u => {
      if (!u.openid && !u.nickname) return false
      const nickMatch = u.nickname && (
        u.nickname === nickname
        || u.nickname.toLowerCase() === (nickname || '').toLowerCase()
        || (suffix && u.nickname.toLowerCase() === `农友${suffix}`)
      )
      const openidMatch = suffix && u.openid && u.openid.toLowerCase().endsWith(suffix)
      return nickMatch || openidMatch
    })
  }

  return []
}

async function purgeUserHistory(db, query = {}) {
  const nickname = query.nickname || ''
  const openidSuffix = query.openidSuffix || (nickname.startsWith('农友') ? nickname.slice(2) : '')

  const users = await findUsers(db, { nickname, openidSuffix })
  if (!users.length) {
    return {
      ok: false,
      message: `未找到用户：${nickname || openidSuffix}`,
      users: []
    }
  }

  const summary = []
  for (const user of users) {
    const detectRemoved = await removeByOpenid(db, 'detect_records', user.openid)
    const diagnoseRemoved = await removeByOpenid(db, 'diagnose_records', user.openid)
    summary.push({
      openid: user.openid,
      nickname: user.nickname,
      detectRemoved,
      diagnoseRemoved
    })
  }

  return {
    ok: true,
    message: '用户诊断历史已删除',
    users: summary
  }
}

module.exports = { purgeUserHistory }
