const CODES = new Set([
  'Space',
  'Enter',
  'NumpadEnter',
  'MediaPlayPause',
  'MediaPlay',
  'MediaPause',
  'MediaStop',
  'MediaTrackNext',
  'MediaTrackPrevious',
  'VolumeUp',
  'VolumeDown',
  'AudioVolumeUp',
  'AudioVolumeDown',
  'VolumeMute',
  'AudioVolumeMute',
  'Camera',
  'BrowserBack',
  'Unidentified',
  'Go',
  'Select',
])

const KEYS = new Set([
  ' ',
  'Enter',
  'MediaPlayPause',
  'MediaPlay',
  'MediaPause',
  'MediaStop',
  'Play',
  'Pause',
  'VolumeUp',
  'VolumeDown',
  'AudioVolumeUp',
  'AudioVolumeDown',
  'VolumeMute',
  'AudioVolumeMute',
  'Camera',
  'Unidentified',
  'Go',
  'Select',
])

// Shutter remotes commonly emit Enter, Space, media play/pause, volume, or Camera.
const KEY_CODES = new Set([13, 27, 32, 173, 174, 175, 176, 177, 178, 179])

export function isRemoteEvent(event) {
  if (!event) return false
  if (CODES.has(event.code)) return true
  if (KEYS.has(event.key)) return true
  if (KEY_CODES.has(event.keyCode)) return true
  // Cheap selfie shutters often arrive as an empty or unidentified HID click.
  if (!event.key && !event.code) return true
  if (event.key === 'Unidentified' || event.code === 'Unidentified') return true
  return isShutterCatch(event)
}

export function isShutterCatch(event) {
  const target = event?.target
  if (!target || typeof target.closest !== 'function') return false
  if (!target.closest('[data-testid="shutter-catch"]')) return false
  if (event.metaKey || event.ctrlKey || event.altKey) return false
  const key = event.key
  if (key === 'Tab' || key === 'Escape' || key === 'Shift') return false
  return true
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

export const MEDIA_SESSION_ACTIONS = [
  'play',
  'pause',
  'stop',
  'previoustrack',
  'nexttrack',
  'seekbackward',
  'seekforward',
]
