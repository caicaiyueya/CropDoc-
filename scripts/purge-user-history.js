/**
 * 一次性脚本：清除指定用户诊断历史（本地执行，需 admin-web/.env.local 中的 API Key）
 * 用法：node scripts/purge-user-history.js 农友aF40
 */
const fs = require('fs')
const path = require('path')
const tcb = require(path.join(__dirname, '../miniprogram/cloudfunctions/api/node_modules/@cloudbase/node-sdk'))

function readApiKey() {
  const envPath = path.join(__dirname, '../admin-web/.env.local')
  const text = fs.readFileSync(envPath, 'utf8')
  const m = text.match(/VITE_CLOUD_API_KEY=(.+)/)
  if (!m) throw new Error('未找到 VITE_CLOUD_API_KEY')
  return m[1].trim()
}

async function removeByOpenid(db, collection, openid) {
  let removed = 0
  while (true) {
    const res = await db.collection(collection).where({ openid }).limit(20).get()
    if (!res.data.length) break
    for (const doc of res.data) {
      await db.collection(collection).doc(doc._id).remove()
      removed += 1
    }
    if (res.data.length < 20) break
  }
  return removed
}

async function findUsers(db, nickname, openidSuffix) {
  if (nickname) {
    const exact = await db.collection('users').where({ nickname }).get()
    if (exact.data.length) return exact.data
  }
  const suffix = (openidSuffix || (nickname && nickname.startsWith('农友') ? nickname.slice(2) : nickname || '')).toLowerCase()
  const all = await db.collection('users').limit(100).get()
  return all.data.filter(u => {
    const nickMatch = u.nickname && (
      u.nickname === nickname
      || (nickname && u.nickname.toLowerCase() === nickname.toLowerCase())
      || (suffix && u.nickname.toLowerCase() === `农友${suffix}`)
    )
    const openidMatch = suffix && u.openid && u.openid.toLowerCase().endsWith(suffix)
    return nickMatch || openidMatch
  })
}

async function main() {
  const nickname = process.argv[2] || '农友AF40'
  const openidSuffix = process.argv[3] || (nickname.startsWith('农友') ? nickname.slice(2) : '')

  const app = tcb.init({
    env: 'cloud1-d1gkunv290a5dc6f4',
    accessKey: readApiKey()
  })
  const db = app.database()

  const users = await findUsers(db, nickname, openidSuffix)
  if (!users.length) {
    console.error('未找到用户:', nickname, openidSuffix)
    process.exit(1)
  }

  for (const user of users) {
    const detectRemoved = await removeByOpenid(db, 'detect_records', user.openid)
    const diagnoseRemoved = await removeByOpenid(db, 'diagnose_records', user.openid)
    console.log(JSON.stringify({
      nickname: user.nickname,
      openid: user.openid,
      detectRemoved,
      diagnoseRemoved
    }, null, 2))
  }
}

main().catch(err => {
  console.error(err.message || err)
  process.exit(1)
})
