export const MATCH_LENGTHS = [5, 7, 10]
export const MIN_MATCH_SECONDS = 60
export const MAX_MATCH_SECONDS = 30 * 60

export const EXTRA_OPTIONS = [
  { seconds: 30, label: '30 שנ׳' },
  { seconds: 60, label: 'דקה' },
  { seconds: 120, label: '2 דקות' },
]

export const DEFAULT_SETTINGS = {
  matchSeconds: 7 * 60,
  extraSeconds: 60,
  speechEnabled: true,
  volume: 1,
}

export const SETTINGS_KEY = 'fgt-settings-v1'

function clampMatchSeconds(total) {
  return Math.min(MAX_MATCH_SECONDS, Math.max(MIN_MATCH_SECONDS, Math.round(total)))
}

export function matchSecondsFrom(raw) {
  const direct = Number(raw?.matchSeconds)
  if (Number.isFinite(direct)) return clampMatchSeconds(direct)
  if (MATCH_LENGTHS.includes(raw?.matchMinutes)) return raw.matchMinutes * 60
  return DEFAULT_SETTINGS.matchSeconds
}

/** Minutes and seconds fields become a match length between 1:00 and 30:00. */
export function parseMatchDuration(minutesText, secondsText) {
  const minutes = Number(String(minutesText ?? '').replace(/\D/g, '')) || 0
  let seconds = Number(String(secondsText ?? '').replace(/\D/g, '')) || 0
  if (seconds > 59) seconds = 59
  return clampMatchSeconds(minutes * 60 + seconds)
}

export function sanitizeSettings(raw) {
  const matchSeconds = matchSecondsFrom(raw)
  const extraSeconds = EXTRA_OPTIONS.some((option) => option.seconds === raw?.extraSeconds)
    ? raw.extraSeconds
    : DEFAULT_SETTINGS.extraSeconds
  const speechEnabled = raw?.speechEnabled !== false
  let volume = Number(raw?.volume)
  if (!Number.isFinite(volume)) volume = DEFAULT_SETTINGS.volume
  volume = Math.min(1, Math.max(0, volume))
  return { matchSeconds, extraSeconds, speechEnabled, volume }
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return sanitizeSettings(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitizeSettings(settings)))
  } catch {
    // The match clock still runs if storage is blocked.
  }
}

export function extraButtonLabel(seconds) {
  if (seconds === 60) return '+1 דקה'
  if (seconds === 120) return '+2 דקות'
  if (seconds === 30) return '+30 שנ׳'
  return `+${seconds} שנ׳`
}

export function matchTitle(durationMs) {
  const minutes = durationMs / 60000
  if (Number.isInteger(minutes)) return `משחק ${minutes} דקות`
  const totalSeconds = Math.round(durationMs / 1000)
  const wholeMinutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `משחק ${wholeMinutes}:${String(seconds).padStart(2, '0')}`
}
