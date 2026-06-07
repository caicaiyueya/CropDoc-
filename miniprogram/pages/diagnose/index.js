const { callApi } = require('../../utils/request')
const { setTabSelected } = require('../../utils/tab-bar')
const { goBackToHome } = require('../../utils/nav')

let msgSeq = 0

function formatDiagnoseResult(r) {
  if (!r) return '诊断完成，如需更多帮助请继续提问。'
  return [
    '【智能诊断结果】',
    `发病原因：${r.cause || '—'}`,
    `传播方式：${r.spread || '—'}`,
    `推荐措施：${r.treatment || '—'}`,
    `药剂建议：${r.pesticide || '—'}`,
    `预防措施：${r.prevention || '—'}`,
    '',
    '如需进一步咨询，请继续输入问题。'
  ].join('\n')
}

function createMessage(role, content) {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return {
    id: `msg_${++msgSeq}`,
    role,
    content,
    time: `${h}:${m}`,
    sent: role === 'user' ? false : undefined
  }
}

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140,
    safeBottom: 0,
    keyboardHeight: 0,
    messages: [],
    input: '',
    canSend: false,
    sessionId: null,
    scrollId: '',
    thinking: false,
    lastProcessedDetectId: '',
    userAvatar: ''
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    const statusBarHeight = sys.statusBarHeight || 44
    const safeBottom = sys.safeArea ? (sys.screenHeight - sys.safeArea.bottom) : 0
    this.setData({
      statusBarHeight,
      headerMinHeight: statusBarHeight + 96,
      safeBottom
    })

    if (options.detectId) {
      getApp().globalData.pendingDetectId = options.detectId
    }

    this._keyboardHandler = res => {
      this.setData({ keyboardHeight: res.height || 0 })
    }
    wx.onKeyboardHeightChange(this._keyboardHandler)
  },
  onUnload() {
    if (this._keyboardHandler) {
      wx.offKeyboardHeightChange(this._keyboardHandler)
    }
    this.showTabBar()
  },
  onShow() {
    setTabSelected('/pages/diagnose/index')
    this.hideTabBar()

    const user = getApp().globalData.user || {}
    this.setData({ userAvatar: user.avatar || '' })

    const detectId = getApp().globalData.pendingDetectId
    if (detectId && detectId !== this.data.lastProcessedDetectId) {
      getApp().globalData.pendingDetectId = null
      this.startAutoDiagnose(detectId)
    }
  },
  onHide() {
    this.showTabBar()
  },
  hideTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ hidden: true })
    }
  },
  showTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ hidden: false })
    }
  },
  goBack() {
    goBackToHome()
  },
  onVoiceTap() {
    wx.showModal({
      title: '语音输入暂不可用',
      content: '「微信同声传译」插件通常仅支持企业/组织等非个人主体小程序，个人主体在插件管理中往往搜不到。\n\n当前请使用下方输入框文字提问。若您是企业主体，可到公众平台「设置 → 第三方设置 → 插件管理」搜索「同声传译」，或直接添加 AppID：wx069ba97219f66d99。',
      showCancel: false,
      confirmText: '知道了'
    })
  },
  onInput(e) {
    const val = e.detail.value
    this.setData({ input: val, canSend: !!val.trim() })
  },
  scrollToBottom(target) {
    this.setData({ scrollId: target || 'msg-thinking' })
  },
  async startAutoDiagnose(detectId) {
    this.setData({ thinking: true, lastProcessedDetectId: detectId })
    this.scrollToBottom('msg-thinking')
    try {
      const result = await callApi('diagnose', { detectId })
      const messages = this.data.messages.concat([
        createMessage('assistant', formatDiagnoseResult(result))
      ])
      this.setData({ messages })
      this.scrollToBottom(`msg-${messages.length - 1}`)
    } catch (e) {
      wx.showToast({ title: '自动诊断失败', icon: 'none' })
    } finally {
      this.setData({ thinking: false })
    }
  },
  async send() {
    const msg = this.data.input.trim()
    if (!msg || !this.data.canSend || this.data.thinking) return

    const userMsg = createMessage('user', msg)
    const messages = this.data.messages.concat([userMsg])
    const userIndex = messages.length - 1

    this.setData({
      messages,
      input: '',
      canSend: false,
      thinking: true
    })
    this.scrollToBottom(`msg-${userIndex}`)

    try {
      const data = await callApi('chatSend', { sessionId: this.data.sessionId, message: msg })
      messages[userIndex].sent = true
      const next = messages.concat([createMessage('assistant', data.reply)])
      this.setData({
        sessionId: data.sessionId,
        messages: next,
        thinking: false
      })
      this.scrollToBottom(`msg-${next.length - 1}`)
    } catch (e) {
      this.setData({ thinking: false })
      wx.showToast({ title: '发送失败', icon: 'none' })
    }
  }
})
