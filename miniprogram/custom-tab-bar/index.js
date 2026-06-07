Component({
  data: {
    selected: 0,
    hidden: false,
    safeBottom: 0,
    list: [
      { pagePath: '/pages/home/index', text: '首页', emoji: '🏡' },
      { pagePath: '/pages/diagnose/index', text: '诊断', emoji: '🩺' },
      { pagePath: '/pages/detect/index', text: '识别', emoji: '🔍', center: true },
      { pagePath: '/pages/community/index', text: '社区', emoji: '🌾' },
      { pagePath: '/pages/profile/index', text: '我的', emoji: '👤' }
    ]
  },
  lifetimes: {
    attached() {
      const sys = wx.getSystemInfoSync()
      const safeBottom = sys.safeArea ? (sys.screenHeight - sys.safeArea.bottom) : 0
      this.setData({ safeBottom })
    }
  },
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const item = this.data.list[index]
      wx.switchTab({ url: item.pagePath })
      this.setData({ selected: index })
    }
  }
})
