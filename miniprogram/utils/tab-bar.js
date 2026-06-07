const TAB_INDEX = {
  '/pages/home/index': 0,
  '/pages/diagnose/index': 1,
  '/pages/detect/index': 2,
  '/pages/community/index': 3,
  '/pages/profile/index': 4
}

function setTabSelected(pagePath) {
  if (typeof getCurrentPages !== 'function') return
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  if (page && typeof page.getTabBar === 'function' && page.getTabBar()) {
    page.getTabBar().setData({ selected: TAB_INDEX[pagePath] ?? 0 })
  }
}

module.exports = { setTabSelected }
