let ctx = null
let keepAliveInstalled = false
let preloaded = false

const bufferCache = {}

const SOUND_FILES = {
  pencil: '/sounds/pencil.mp3',
}

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return ctx
}

function installKeepAlive() {
  if (keepAliveInstalled) return
  keepAliveInstalled = true
  const resume = () => {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume()
    }
  }
  document.addEventListener('pointerdown', resume, { capture: true, passive: true })
  document.addEventListener('touchstart', resume, { capture: true, passive: true })
}

async function preloadAll() {
  if (preloaded) return
  preloaded = true
  const ac = ensureCtx()
  const entries = Object.entries(SOUND_FILES)
  await Promise.all(entries.map(async ([name, url]) => {
    try {
      const res = await fetch(url)
      if (!res.ok) return
      const arr = await res.arrayBuffer()
      bufferCache[name] = await ac.decodeAudioData(arr)
    } catch { /* file missing — skip silently */ }
  }))
}

function playBuffer(name) {
  const buffer = bufferCache[name]
  if (!buffer) return
  const ac = ensureCtx()
  const source = ac.createBufferSource()
  source.buffer = buffer
  source.connect(ac.destination)
  source.start()
}

let inited = false

export function useSound() {
  if (!inited) {
    inited = true
    ensureCtx()
    installKeepAlive()
    preloadAll()
  }

  function play(name) {
    if (!preloaded) {
      preloadAll()
      return
    }
    try {
      playBuffer(name)
    } catch (e) {
      console.warn('[useSound]', name, e)
    }
  }

  return { play }
}
