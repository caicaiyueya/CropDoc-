function toSummary(content, len = 80) {
  if (!content) return ''
  const plain = String(content).replace(/\s+/g, ' ').trim()
  return plain.length > len ? plain.slice(0, len) + '…' : plain
}

function pickCover(post) {
  if (!post) return ''
  if (post.coverUrl) return post.coverUrl
  if (post.images) {
    const first = String(post.images).split(',')[0].trim()
    if (first) return first
  }
  return ''
}

function formatContentBlocks(content) {
  if (!content) return []
  return String(content).split('\n').map(line => {
    const text = line.trim()
    if (!text) return { type: 'blank' }
    if (/^【.+】$/.test(text)) return { type: 'heading', text }
    if (/^[·•\-]\s/.test(text) || /^\d+[.、]/.test(text)) return { type: 'list', text }
    return { type: 'text', text }
  }).filter(item => item.type !== 'blank')
}

module.exports = { toSummary, pickCover, formatContentBlocks }
