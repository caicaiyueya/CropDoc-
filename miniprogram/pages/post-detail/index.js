const { callApi } = require('../../utils/request')
const { goBackToHome } = require('../../utils/nav')
const { pickCover, formatContentBlocks } = require('../../utils/post-content')

Page({
  data: {
    statusBarHeight: 44,
    headerMinHeight: 140,
    safeBottom: 0,
    inputBarHeight: 140,
    post: null,
    contentBlocks: [],
    comments: [],
    comment: '',
    canSend: false,
    postId: null
  },
  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    const statusBarHeight = sys.statusBarHeight || 44
    const safeBottom = sys.safeArea ? (sys.screenHeight - sys.safeArea.bottom) : 0
    this.setData({
      statusBarHeight,
      headerMinHeight: statusBarHeight + 96,
      safeBottom,
      inputBarHeight: 120 + safeBottom,
      postId: options.id
    })
    this.load(options.id)
  },
  goBack() {
    goBackToHome()
  },
  async load(id) {
    const data = await callApi('getPost', { postId: id })
    const myOpenid = getApp().globalData.user?.openid || ''
    const comments = (data.comments || []).map(item => ({
      ...item,
      isSelf: item.openid === myOpenid
    }))
    this.setData({
      post: {
        ...data,
        coverUrl: pickCover(data)
      },
      contentBlocks: formatContentBlocks(data.content),
      comments
    })
  },
  onCommentInput(e) {
    const val = e.detail.value
    this.setData({ comment: val, canSend: !!val.trim() })
  },
  async submitComment() {
    const content = this.data.comment.trim()
    if (!content || !this.data.canSend) return
    await callApi('addComment', { postId: this.data.postId, content })
    this.setData({ comment: '', canSend: false })
    this.load(this.data.postId)
  },
  async toggleFavorite() {
    await callApi('toggleFavorite', { targetType: 'post', targetId: this.data.postId })
    this.load(this.data.postId)
  }
})
