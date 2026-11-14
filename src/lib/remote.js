const CODES = new Set([
  'Space',
  'Enter',
  'NumpadEnter',
  'MediaPlayPause',
  'MediaPlay',
  'MediaPause',
  'VolumeUp',
  'VolumeDown',
  'AudioVolumeUp',
  'AudioVolumeDown',
  'Camera',
])

const KEYS = new Set([
  ' ',
  'Enter',
  'MediaPlayPause',
  'MediaPlay',
  'MediaPause',
  'Play',
  'Pause',
  'VolumeUp',
  'VolumeDown',
  'AudioVolumeUp',
  'AudioVolumeDown',
  'Camera',
])

// Shutter remotes commonly emit Enter, Space, media play/pause, volume, or Camera.
const KEY_CODES = new Set([13, 27, 32, 174, 175, 179])

export function isRemoteEvent(event) {
  if (!event) return false
  if (CODES.has(event.code)) return true
  if (KEYS.has(event.key)) return true
  return KEY_CODES.has(event.keyCode)
}

export function shouldPreventRemoteDefault(event) {
  const code = event?.code
  return code === 'Space'
    || code === 'Enter'
    || code === 'NumpadEnter'
    || code === 'MediaPlayPause'
    || code === 'MediaPlay'
    || code === 'MediaPause'
    || event?.key === ' '
    || event?.key === 'Enter'
}
