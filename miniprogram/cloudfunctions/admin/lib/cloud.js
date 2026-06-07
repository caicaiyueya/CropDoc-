const path = require('path')

function loadWxServerSdk() {
  try {
    return require('wx-server-sdk')
  } catch (e) {
    return require(path.join(__dirname, '..', 'node_modules', 'wx-server-sdk'))
  }
}

module.exports = loadWxServerSdk()
