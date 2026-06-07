/**
 * 内置标准病害图（小程序本地资源，无需云存储）
 * key 与模型 disease_key 一致
 */
const STANDARD_IMAGES = {
  Corn__common_rust: '/assets/images/diseases/Corn__common_rust.jpg'
}

function getStandardImageUrl(diseaseKey) {
  return STANDARD_IMAGES[diseaseKey] || ''
}

module.exports = { STANDARD_IMAGES, getStandardImageUrl }
