const COLLECTIONS = [
  'users', 'admins', 'banners', 'diseases', 'news', 'posts', 'comments',
  'detect_records', 'diagnose_records', 'chat_sessions', 'chat_messages',
  'favorites', 'feedbacks'
]

async function ensureCollections(db) {
  const created = []
  for (const name of COLLECTIONS) {
    try {
      if (typeof db.createCollection === 'function') {
        await db.createCollection(name)
        created.push(name)
      }
    } catch (e) {
      const msg = (e.message || '') + (e.errMsg || '')
      if (!msg.includes('exist') && !msg.includes('已存在') && !msg.includes('ResourceExist')) {
        // 部分环境不支持 createCollection，忽略
      }
    }
  }
  return created
}

module.exports = { COLLECTIONS, ensureCollections }
