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

const VOLUME_CODES = new Set([
  'VolumeUp',
  'VolumeDown',
  'AudioVolumeUp',
  'AudioVolumeDown',
  'VolumeMute',
  'AudioVolumeMute',
])

const VOLUME_KEY_CODES = new Set([173, 174, 175])

export function isVolumeEvent(event) {
  if (!event) return false
  if (VOLUME_CODES.has(event.code) || VOLUME_CODES.has(event.key)) return true
  return VOLUME_KEY_CODES.has(event.keyCode)
}

export function shouldPreventRemoteDefault(event) {
  if (!isRemoteEvent(event)) return false
  // Volume and shutter keys must not also change the system volume or activate a focused button.
  return true
}
