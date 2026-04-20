import { BUG_CHAR_POOL } from '../stores/exam'

/**
 * 在字符串中随机挑若干个"普通汉字位置"替换成方块字符。
 * - 跳过 ASCII / 数字 / 标点 / 空白，仅替换 CJK 字符
 * - 同一次调用内位置不重复
 * - 被替换字符用 <span class="glitch-char">▓</span> 包裹，便于 CSS 定制
 *
 * @param {string} text
 * @param {number} count  期望替换的字符数（会被字符总数上限夹断）
 * @returns {string} HTML 片段（调用方需用 v-html 渲染）
 */
export function glitchText(text, count) {
  if (!text || count <= 0) return text

  const positions = collectCjkPositions(text)
  if (positions.length === 0) return text

  const n = Math.min(count, positions.length)
  const picked = new Set(pickRandom(positions, n))
  return buildGlitchHtml(text, picked)
}

/**
 * 把 count 个替换位置分散到多段文本里（按字符数加权随机），返回每段的 HTML。
 * 用于"注意事项"这种多条独立段落整体 glitch 的场景——避免每段都被打上。
 *
 * @param {string[]} texts
 * @param {number} count
 * @returns {string[]} 与 texts 等长的 HTML 数组
 */
export function glitchDistributed(texts, count) {
  // 建立全局位置表：[{ seg, local }]
  const globalPositions = []
  texts.forEach((t, seg) => {
    collectCjkPositions(t).forEach(local => globalPositions.push({ seg, local }))
  })
  if (globalPositions.length === 0 || count <= 0) {
    return texts.map(t => escapeAll(t))
  }
  const n = Math.min(count, globalPositions.length)
  const pickedIdx = pickRandom(
    Array.from({ length: globalPositions.length }, (_, i) => i),
    n
  )
  // 按 seg 归桶
  const perSeg = texts.map(() => new Set())
  pickedIdx.forEach(i => {
    const p = globalPositions[i]
    perSeg[p.seg].add(p.local)
  })
  return texts.map((t, i) => buildGlitchHtml(t, perSeg[i]))
}

// ─────── helpers ───────

function collectCjkPositions(text) {
  const out = []
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0x4e00 && code <= 0x9fff) out.push(i)
  }
  return out
}

function pickRandom(arr, n) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

function buildGlitchHtml(text, pickedSet) {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    if (pickedSet.has(i)) {
      const ch = BUG_CHAR_POOL[Math.floor(Math.random() * BUG_CHAR_POOL.length)]
      out += `<span class="glitch-char">${ch}</span>`
    } else {
      out += escapeChar(text[i])
    }
  }
  return out
}

function escapeAll(s) {
  let o = ''
  for (const c of s) o += escapeChar(c)
  return o
}

function escapeChar(ch) {
  switch (ch) {
    case '&': return '&amp;'
    case '<': return '&lt;'
    case '>': return '&gt;'
    case '"': return '&quot;'
    case "'": return '&#39;'
    default: return ch
  }
}
