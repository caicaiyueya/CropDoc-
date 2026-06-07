const cloud = require('./lib/cloud')
const { ensureCollections } = require('./lib/db')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const OFFICIAL_OPENID = 'official_yunnong'

const OFFICIAL_SCIENCE_POSTS = [
  {
    title: '【科普】小麦锈病：识别特征与防治方案',
    content: '小麦锈病是小麦三大病害之一，包括条锈、叶锈和秆锈。\n\n【典型症状】\n叶片正面出现黄色或橙黄色粉状孢子堆，用手擦拭后留下黄粉；严重时叶片早枯，影响灌浆。\n\n【高发条件】\n春季气温回升、湿度偏大、密植田块易流行。\n\n【防治建议】\n1. 选用抗病品种，合理密植；\n2. 发病初期选用三唑酮、戊唑醇、丙环唑等药剂喷雾；\n3. 连防 1～2 次，间隔 7～10 天；\n4. 收获后清除病残体，减少越冬菌源。',
    postType: 'science',
    status: 'approved',
    pinned: true,
    likeCount: 128,
    coverUrl: '/assets/images/science/wheat-rust.jpg',
    images: '/assets/images/science/wheat-rust.jpg'
  },
  {
    title: '【科普】水稻叶瘟病：梭形病斑怎么认',
    content: '水稻叶瘟病由稻瘟病菌引起，可在叶片、穗颈等部位发病。\n\n【典型症状】\n叶片病斑呈梭形或长条形，中央灰白色，边缘褐色，外有黄色晕圈；潮湿时病斑背面可见灰绿色霉层。\n\n【易混淆】\n与胡麻斑病相比，叶瘟斑边缘更整齐、扩展更快。\n\n【防治要点】\n· 选用抗病品种，避免偏施氮肥；\n· 分蘖末期至破口期加强巡田；\n· 发病田块及时喷施三环唑、稻瘟灵、春雷霉素；\n· 浅水勤灌，降低田间湿度。',
    postType: 'science',
    status: 'approved',
    pinned: true,
    likeCount: 96,
    coverUrl: '/assets/images/science/rice-blast.jpg',
    images: '/assets/images/science/rice-blast.jpg'
  },
  {
    title: '【科普】玉米大斑病：大斑小斑要分清',
    content: '玉米大斑病多在抽雄前后进入高发期，高温高湿有利于扩展。\n\n【典型症状】\n叶片上出现大型梭形或长条形灰褐色病斑，长度可达 10～30 厘米，严重时病斑连片，叶片枯死。\n\n【与小斑病区别】\n大斑病斑更大、颜色更深；小斑病斑较小、数量更多。\n\n【综合防治】\n1. 轮作倒茬，清除上一年病残体；\n2. 增施磷钾肥，提高抗病性；\n3. 发病初期喷施苯醚甲环唑、嘧菌酯等；\n4. 低洼地块注意排水，改善通风。',
    postType: 'science',
    status: 'approved',
    pinned: false,
    likeCount: 74,
    coverUrl: '/assets/images/science/corn-blight.jpg',
    images: '/assets/images/science/corn-blight.jpg'
  },
  {
    title: '【科普】白粉虱危害：叶背小虫要早防',
    content: '白粉虱是辣椒、番茄、黄瓜等蔬菜上的常见害虫，也是多种病毒病的传播媒介。\n\n【危害症状】\n成虫和若虫群集叶背吸食汁液，导致叶片卷曲、褪绿、出现银白色斑纹；分泌蜜露诱发煤污病，并传播病毒。\n\n【识别要点】\n体长约 1 毫米，白色似粉，受惊后飞起呈“白烟”。\n\n【防治策略】\n· 悬挂黄色粘虫板诱杀；\n· 保护瓢虫、草蛉等天敌；\n· 轮换使用吡虫啉、噻虫嗪、螺虫乙酯等；\n· 注意统防统治，避免偏施氮肥。',
    postType: 'science',
    status: 'approved',
    pinned: false,
    likeCount: 61,
    coverUrl: '/assets/images/science/whitefly.jpg',
    images: '/assets/images/science/whitefly.jpg'
  },
  {
    title: '【科普】番茄晚疫病：阴雨天要警惕',
    content: '番茄晚疫病在低温高湿条件下暴发流行，保护地栽培需格外注意。\n\n【典型症状】\n叶片出现水浸状暗绿色大斑，湿度大时叶背有白色霉层；茎部出现黑褐色条斑；果实出现褐色硬斑。\n\n【流行规律】\n连续阴雨、通风不良、夜温偏低时易大流行。\n\n【防治措施】\n1. 选用抗病品种，控制棚内湿度；\n2. 发现中心病株立即拔除；\n3. 发病前或初期喷施烯酰吗啉、霜脲氰、氟吡菌胺；\n4. 注意药剂轮换，防止抗药性产生。',
    postType: 'science',
    status: 'approved',
    pinned: false,
    likeCount: 88,
    coverUrl: '/assets/images/science/tomato-blight.jpg',
    images: '/assets/images/science/tomato-blight.jpg'
  },
  {
    title: '【科普】葡萄霜霉病：叶背白霜是信号',
    content: '葡萄霜霉病是葡萄重要真菌病害，多雨季节危害严重。\n\n【典型症状】\n嫩叶正面出现淡黄色油浸状小斑，叶背对应位置产生白色霜状霉层；严重时叶片焦枯脱落，影响树势和品质。\n\n【管理建议】\n· 合理修剪，改善通风透光；\n· 避免棚架过密和地面长期积水；\n· 萌芽至果实着色期预防用药；\n· 可选用波尔多液、代森锰锌、烯酰吗啉等保护性/治疗性药剂交替使用。',
    postType: 'science',
    status: 'approved',
    pinned: false,
    likeCount: 52,
    coverUrl: '/assets/images/science/grape-mildew.jpg',
    images: '/assets/images/science/grape-mildew.jpg'
  }
]

const OFFICIAL_NEWS = [
  {
    newsKey: 'wheat_scab',
    title: '麦区进入赤霉病防控关键期',
    summary: '冬麦区小麦陆续抽穗扬花，多雨天气下赤霉病风险升高，需及时开展药剂预防。',
    content: '当前江淮、江汉等冬麦区小麦进入抽穗扬花期，这是赤霉病防控的关键窗口。农业专家提醒：建议在齐穗期开展第一次药剂防治，选用戊唑醇、氰烯菌酯等药剂，7～10 天后视天气情况再防一次。同时注意开沟排水，降低田间湿度，减少病菌侵染机会。',
    source: '农业资讯',
    status: 'published',
    coverUrl: '/assets/images/news/wheat-scab.jpg',
    imageUrl: '/assets/images/news/wheat-scab.jpg'
  },
  {
    newsKey: 'rice_pest',
    title: '南方稻区病虫害监测预警发布',
    summary: '水稻分蘖至拔节期，纹枯病、稻飞虱等进入高发期，请加强田间调查。',
    content: '当前南方稻区已进入分蘖至拔节期，纹枯病、稻飞虱、二化螟等病虫害进入高发期。各地应加强田间调查，掌握虫口密度；对达到防治指标田块，及时开展统防统治，优先选用低毒高效药剂，注意轮换用药，保护天敌。',
    source: '农业资讯',
    status: 'published',
    coverUrl: '/assets/images/news/rice-paddy.jpg',
    imageUrl: '/assets/images/news/rice-paddy.jpg'
  },
  {
    newsKey: 'wheat_harvest',
    title: '夏粮收购全面开启，优质麦价稳中有升',
    summary: '主产区粮食收购企业陆续开仓，优质强筋小麦收购价较往年略有上涨。',
    content: '随着主产区小麦陆续收获，各地粮食收购企业已全面开仓收粮。今年优质强筋小麦因品质稳定、需求旺盛，收购价格稳中有升。建议农户做好晾晒除杂，按质论价出售，同时关注当地收购政策与最低收购价执行范围。',
    source: '农业资讯',
    status: 'published',
    coverUrl: '/assets/images/news/wheat-harvest.jpg',
    imageUrl: '/assets/images/news/wheat-harvest.jpg'
  },
  {
    newsKey: 'green_control',
    title: '生物防治与授粉服务受关注',
    summary: '多地推广以虫治虫、以蜂助农，配合生物农药实现减药增效。',
    content: '今年多地农业农村部门加大生物防治推广力度，示范保护利用蜜蜂、瓢虫等有益生物，配合性诱剂、杀虫灯和生物农药等综合措施。实践表明，合理组合绿色防控可显著降低化学农药使用量，提高农产品质量安全水平，欢迎农户向当地农技站咨询适用方案。',
    source: '农业资讯',
    status: 'published',
    coverUrl: '/assets/images/news/green-control.jpg',
    imageUrl: '/assets/images/news/green-control.jpg'
  },
  {
    newsKey: 'weather_rain',
    title: '南方多阵雨，需防范湿渍害与病害扩展',
    summary: '未来一周南方多雷阵雨，低洼田块应清沟沥水，设施大棚注意通风降湿。',
    content: '据最新农业气象专报，未来一周南方多阵雨或雷阵雨，局部有大雨。建议低洼田块及时清沟沥水，防范湿渍害；设施大棚注意通风降湿，预防番茄、黄瓜等作物病害流行。春玉米、春大豆产区需关注强对流天气对倒伏的影响。',
    source: '农业资讯',
    status: 'published',
    coverUrl: '/assets/images/news/rain-field.jpg',
    imageUrl: '/assets/images/news/rain-field.jpg'
  }
]

const LEGACY_NEWS_TITLES = {
  wheat_scab: ['近期小麦赤霉病高发，请农户做好预防'],
  rice_pest: ['夏季水稻病虫害预警'],
  wheat_harvest: ['夏粮收购启动，优质小麦价格稳中有升'],
  green_control: ['绿色防控技术推广，减少化学农药使用'],
  weather_rain: ['气象部门发布农业气象服务专报']
}

const LEGACY_SCIENCE_TITLES = {
  '【科普】白粉虱危害：叶背小虫要早防': ['【科普】辣椒白粉虱：黄色小虫危害大']
}

const MEDIA_VERSION = 2

async function ensureOfficialUser() {
  const found = await db.collection('users').where({ openid: OFFICIAL_OPENID }).count()
  if (found.total === 0) {
    await db.collection('users').add({
      data: {
        openid: OFFICIAL_OPENID,
        nickname: '云农智诊官方',
        avatar: '',
        role: 'official',
        createdAt: db.serverDate()
      }
    })
    return 'official user created'
  }
  return 'official user exists'
}

async function seedOfficialScience() {
  let added = 0
  for (const p of OFFICIAL_SCIENCE_POSTS) {
    const doc = await findScienceDoc(p)
    if (!doc) {
      await db.collection('posts').add({
        data: {
          openid: OFFICIAL_OPENID,
          ...p,
          mediaVersion: MEDIA_VERSION,
          createdAt: db.serverDate()
        }
      })
      added++
    }
  }
  return `science posts added: ${added}`
}

async function findNewsDoc(newsKey) {
  const byKey = await db.collection('news').where({ newsKey }).limit(1).get()
  if (byKey.data[0]) return byKey.data[0]
  const legacyTitles = LEGACY_NEWS_TITLES[newsKey] || []
  for (const title of legacyTitles) {
    const found = await db.collection('news').where({ title }).limit(1).get()
    if (found.data[0]) return found.data[0]
  }
  const current = OFFICIAL_NEWS.find(item => item.newsKey === newsKey)
  if (current) {
    const found = await db.collection('news').where({ title: current.title }).limit(1).get()
    if (found.data[0]) return found.data[0]
  }
  return null
}

async function findScienceDoc(post) {
  const found = await db.collection('posts').where({ title: post.title }).limit(1).get()
  if (found.data[0]) return found.data[0]
  const legacyTitles = LEGACY_SCIENCE_TITLES[post.title] || []
  for (const title of legacyTitles) {
    const legacy = await db.collection('posts').where({ title }).limit(1).get()
    if (legacy.data[0]) return legacy.data[0]
  }
  return null
}

async function seedOfficialNews() {
  let added = 0
  for (const n of OFFICIAL_NEWS) {
    const doc = await findNewsDoc(n.newsKey)
    if (!doc) {
      await db.collection('news').add({
        data: {
          ...n,
          publishTime: db.serverDate(),
          createdAt: db.serverDate()
        }
      })
      added++
    }
  }
  return `news added: ${added}`
}

async function patchOfficialMedia() {
  let patched = 0

  for (const p of OFFICIAL_SCIENCE_POSTS) {
    const doc = await findScienceDoc(p)
    if (!doc) continue
    const needUpdate = doc.mediaVersion !== MEDIA_VERSION
      || doc.coverUrl !== p.coverUrl
      || doc.images !== p.images
      || doc.title !== p.title
      || doc.content !== p.content
    if (!needUpdate) continue
    await db.collection('posts').doc(doc._id).update({
      data: {
        title: p.title,
        content: p.content,
        coverUrl: p.coverUrl,
        images: p.images,
        mediaVersion: MEDIA_VERSION
      }
    })
    patched++
  }

  for (const n of OFFICIAL_NEWS) {
    const doc = await findNewsDoc(n.newsKey)
    if (!doc) continue
    const needUpdate = doc.mediaVersion !== MEDIA_VERSION
      || doc.coverUrl !== n.coverUrl
      || doc.imageUrl !== n.imageUrl
      || doc.title !== n.title
      || doc.summary !== n.summary
      || doc.content !== n.content
    if (!needUpdate) continue
    await db.collection('news').doc(doc._id).update({
      data: {
        newsKey: n.newsKey,
        title: n.title,
        summary: n.summary,
        content: n.content,
        coverUrl: n.coverUrl,
        imageUrl: n.imageUrl,
        mediaVersion: MEDIA_VERSION
      }
    })
    patched++
  }

  return `media patched: ${patched}`
}

exports.main = async () => {
  const results = []

  const created = await ensureCollections(db)
  if (created.length) results.push('collections: ' + created.join(', '))

  try {
    results.push(await ensureOfficialUser())
  } catch (e) { results.push('official user skip: ' + e.message) }

  try {
    results.push(await seedOfficialScience())
  } catch (e) { results.push('official science skip: ' + e.message) }

  try {
    results.push(await patchOfficialMedia())
  } catch (e) { results.push('media patch skip: ' + e.message) }

  try {
    const adminCount = await db.collection('admins').count()
    if (adminCount.total === 0) {
      await db.collection('admins').add({
        data: { username: 'admin', password: 'admin123', nickname: '系统管理员', createdAt: db.serverDate() }
      })
      results.push('admins seeded')
    }
  } catch (e) { results.push('admins skip: ' + e.message) }

  try {
    const bannerCount = await db.collection('banners').count()
    if (bannerCount.total === 0) {
      await db.collection('banners').add({ data: { title: '小麦锈病高发，请及时防治', tag: '常见病害', imageUrl: '', sortOrder: 1, enabled: true, createdAt: db.serverDate() } })
      await db.collection('banners').add({ data: { title: '夏季病虫害预警信息汇总', tag: '农业资讯', imageUrl: '', sortOrder: 2, enabled: true, createdAt: db.serverDate() } })
      await db.collection('banners').add({ data: { title: '科学施肥，助力增产增收', tag: '种植技巧', imageUrl: '', sortOrder: 3, enabled: true, createdAt: db.serverDate() } })
      results.push('banners seeded')
    }
  } catch (e) { results.push('banners skip: ' + e.message) }

  try {
    const diseaseCount = await db.collection('diseases').count()
    if (diseaseCount.total === 0) {
      const diseases = [
        { diseaseKey: 'Wheat__yellow_rust', crop: 'Wheat', cropCn: '小麦', nameCn: '小麦黄锈病', description: '小麦黄锈病是常见病害', symptoms: '叶片出现黄色锈状孢子堆', treatment: '及时喷施三唑酮等药剂', recommend: true },
        { diseaseKey: 'Rice__leaf_blast', crop: 'Rice', cropCn: '水稻', nameCn: '水稻叶瘟病', description: '水稻叶瘟病需及时防治', symptoms: '叶片出现梭形病斑', treatment: '加强田间管理，合理施肥', recommend: true },
        { diseaseKey: 'Corn__northern_leaf_blight', crop: 'Corn', cropCn: '玉米', nameCn: '玉米大斑病', description: '玉米大斑病高发期需预警', symptoms: '叶片出现大型梭形斑', treatment: '清除病残体，药剂防治', recommend: true },
        { diseaseKey: 'Chili__whitefly', crop: 'Chili', cropCn: '辣椒', nameCn: '蚜虫/白粉虱危害', description: '虫害需综合防治', symptoms: '叶片卷曲、发黄', treatment: '黄板诱杀，药剂防治', recommend: true }
      ]
      for (const d of diseases) {
        await db.collection('diseases').add({ data: { ...d, source: 'official', createdAt: db.serverDate() } })
      }
      results.push('diseases seeded')
    }
  } catch (e) { results.push('diseases skip: ' + e.message) }

  try {
    results.push(await seedOfficialNews())
  } catch (e) { results.push('news skip: ' + e.message) }

  try {
    const hasExp = await db.collection('posts').where({ postType: 'experience' }).count()
    if (hasExp.total === 0) {
      await db.collection('posts').add({
        data: {
          openid: OFFICIAL_OPENID,
          title: '小麦锈病防治经验分享',
          content: '发现锈病要及时清除病叶，喷施三唑酮，效果较好。欢迎农友在评论区交流本地防治经验。',
          postType: 'experience',
          status: 'approved',
          pinned: false,
          likeCount: 36,
          images: '',
          createdAt: db.serverDate()
        }
      })
      results.push('experience posts seeded')
    }
  } catch (e) { results.push('experience posts skip: ' + e.message) }

  return { code: 200, message: '初始化完成', data: results }
}
