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
      // 集合已存在或非 createCollection 环境，忽略
    }
  }
  return created
}

module.exports = { COLLECTIONS, ensureCollections }
