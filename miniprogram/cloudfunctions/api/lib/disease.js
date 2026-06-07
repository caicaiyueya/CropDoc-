const classMap = require('../disease-class-map.json')

function getCrops() {
  return classMap.crops
}

function resolve(diseaseKey) {
  const info = classMap.classes[diseaseKey]
  if (!info) {
    return { diseaseKey, crop: '', cropCn: '', diseaseCn: diseaseKey, healthy: false }
  }
  return {
    diseaseKey,
    crop: info.crop,
    cropCn: info.cropCn,
    diseaseCn: info.diseaseCn,
    healthy: info.healthy
  }
}

function levelOf(confidence) {
  if (confidence < 0.5) return '轻度'
  if (confidence < 0.8) return '中度'
  return '重度'
}

function mockPredict(crop) {
  const keys = Object.keys(classMap.classes)
  if (crop) {
    const matched = keys.filter(k => k.startsWith(crop + '__') && !k.includes('healthy'))
    if (matched.length) return { disease_key: matched[0], confidence: 0.76 }
  }
  return { disease_key: 'Wheat__yellow_rust', confidence: 0.75 }
}

module.exports = { getCrops, resolve, levelOf, mockPredict }
