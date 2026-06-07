const cloud = require('./lib/cloud')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async () => {
  const today = new Date().toISOString().slice(0, 10)
  await db.collection('news').add({
    data: {
      title: `【定时抓取】${today} 农业生产提醒`,
      content: '今日请关注田间湿度与病虫害监测，合理安排农事活动。',
      source: '系统自动抓取',
      status: 'draft',
      publishTime: db.serverDate(),
      createdAt: db.serverDate()
    }
  })
  return { ok: true }
}
