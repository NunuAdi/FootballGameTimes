const BASE = import.meta.env?.BASE_URL || '/'
const COUNTDOWN_MS = 10_000
const CLIP_FILES = {
  minute: 'sounds/one-minute.mp3',
  thirty: 'sounds/thirty-seconds.mp3',
  countdown: 'sounds/countdown-end.mp3',
}

export const AUDIO_UNLOCK_KEY = 'fgt-audio-unlocked'

const clips = {}
let unlocked = false
const audioSettings = {
  speechEnabled: true,
  volume: 1,
}

function clipUrl(file) {
  return `${BASE}${file}`
}

function makeClip(file) {
  if (typeof Audio === 'undefined') return null
  const node = new Audio(clipUrl(file))
  node.preload = 'auto'
  node.playsInline = true
  node.setAttribute('playsinline', '')
  node.volume = audioSettings.volume
  try { node.load() } catch { /* older Safari */ }
  return node
}

export function preloadCueAudio() {
  if (typeof Audio === 'undefined') return
  for (const [key, file] of Object.entries(CLIP_FILES)) {
    if (!clips[key]) clips[key] = makeClip(file)
  }
}

function applyVolume() {
  for (const node of Object.values(clips)) {
    if (node) node.volume = audioSettings.speechEnabled ? audioSettings.volume : 0
  }
}

export function configureAudio({ speechEnabled, volume } = {}) {
  if (typeof speechEnabled === 'boolean') audioSettings.speechEnabled = speechEnabled
  if (typeof volume === 'number' && Number.isFinite(volume)) {
    audioSettings.volume = Math.min(1, Math.max(0, volume))
  }
  applyVolume()
  if (!audioSettings.speechEnabled) {
    for (const node of Object.values(clips)) node?.pause()
  }
}

export function isAudioUnlocked() {
  return unlocked
}

export function loadAudioUnlocked() {
  try {
    return localStorage.getItem(AUDIO_UNLOCK_KEY) === 'true'
  } catch {
    return false
  }
}

function persistAudioUnlocked() {
  try {
    localStorage.setItem(AUDIO_UNLOCK_KEY, 'true')
  } catch {
    // Private mode can block storage; this visit still unlocks.
  }
}

function rewind(node) {
  if (!node) return
  node.pause()
  try { node.currentTime = 0 } catch { /* not seekable yet */ }
}

function seek(node, seconds) {
  if (!node) return
  try { node.currentTime = Math.max(0, seconds) } catch { /* not seekable yet */ }
}

function playClip(key) {
  const node = clips[key]
  if (!node || !unlocked || !audioSettings.speechEnabled) return false
  for (const [name, clip] of Object.entries(clips)) {
    if (name !== key) rewind(clip)
  }
  rewind(node)
  node.volume = audioSettings.volume
  const attempt = node.play()
  if (attempt?.catch) attempt.catch(() => {})
  return true
}

function unlockClip(node) {
  if (!node) return
  const volume = audioSettings.speechEnabled ? audioSettings.volume : 0
  node.volume = 0
  const attempt = node.play()
  node.pause()
  try { node.currentTime = 0 } catch { /* not seekable yet */ }
  node.volume = volume
  if (attempt?.catch) attempt.catch(() => {})
}

export function unlockAudio() {
  preloadCueAudio()
  persistAudioUnlocked()
  if (unlocked) return Promise.resolve()
  unlocked = true
  for (const node of Object.values(clips)) unlockClip(node)
  return Promise.resolve()
}

export function resumeAudioForGesture() {
  return unlockAudio()
}

export function stopMatchAudio() {
  for (const node of Object.values(clips)) rewind(node)
}

export function syncCountdownAudio(remainingMs, running) {
  preloadCueAudio()
  const node = clips.countdown
  if (!node) return
  if (remainingMs > COUNTDOWN_MS) {
    rewind(node)
    return
  }
  if (!unlocked || !audioSettings.speechEnabled) {
    node.pause()
    return
  }
  if (remainingMs <= 0) return
  if (running) {
    node.volume = audioSettings.volume
    if (node.paused) {
      seek(node, (COUNTDOWN_MS - remainingMs) / 1000)
      const attempt = node.play()
      if (attempt?.catch) attempt.catch(() => {})
    }
    return
  }
  seek(node, (COUNTDOWN_MS - remainingMs) / 1000)
  node.pause()
}

export function playMatchCue(cue) {
  if (!unlocked || !cue) return false
  preloadCueAudio()
  if (!audioSettings.speechEnabled) return true
  if (cue.type === 'minute') return playClip('minute')
  if (cue.type === 'thirty') return playClip('thirty')
  if (cue.type === 'countdown') return true
  if (cue.type === 'end') return true
  return true
}

if (typeof window !== 'undefined') preloadCueAudio()
