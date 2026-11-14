export const MATCH_SECONDS = 7 * 60
export const SPEECH_RATE = 0.85
export const SPEECH_PITCH = 0.95

export const COPY = {
  appTitle: 'שעון משחק 7 דקות',
  shortTitle: 'שעון משחק',
  league: 'כדורגל',
  match: 'משחק 7 דקות',
  start: 'התחל משחק',
  pauseLine1: 'השהה שעון /',
  pauseLine2: 'כדור עף',
  ended: 'המשחק נגמר',
  unlock: 'הפעל סאונד / התחל',
  unlockHint: 'לחצו פעם אחת כדי לאפשר צפירה וקריאות בעברית במגרש',
  remoteHint: 'שלט בלוטות׳, מקש רווח או Enter מפעילים ועוצרים',
  minute: 'דקה לסיום המשחק',
  thirty: 'חצי דקה לסיום',
  settings: 'הגדרות',
  close: 'סגירה',
  duration: 'משך משחק',
  durationMinutes: 'דקות',
  durationSeconds: 'שניות',
  saveDuration: 'שמור',
  extraSetting: 'זמן הארכה',
  voice: 'קריאות קוליות',
  voiceOn: 'פעיל',
  voiceOff: 'כבוי',
  buzzerVolume: 'עוצמת צפירה',
  quiet: 'חלש',
  loud: 'חזק',
  extraAction: 'הארכה',
  readySpeech: 'מוכן',
  reset: 'איפוס',
  resetAria: 'איפוס השעון. לחצו לחיצה ארוכה של שנייה וחצי',
  ready: 'מוכן למשחק',
  paused: 'מושהה',
  running: 'השעון רץ',
  finalMinute: 'דקה אחרונה',
  countdown: 'ספירה לאחור',
  finished: 'המשחק נגמר',
  wakeUnsupported: 'הדפדפן לא נועל את המסך — בטלו כיבוי אוטומטי',
  wakeDenied: 'אשרו נעילת מסך כדי שהטלפון לא יכבה',
  timeLeft: 'זמן שנותר',
}

/** Feminine Hebrew cardinals — שניות is feminine. */
export const SECOND_WORDS = {
  10: 'עשר',
  9: 'תשע',
  8: 'שמונה',
  7: 'שבע',
  6: 'שש',
  5: 'חמש',
  4: 'ארבע',
  3: 'שלוש',
  2: 'שתיים',
  1: 'אחת',
}

export function getStatusLabel({ ended, isRunning, displaySeconds, durationSeconds = MATCH_SECONDS }) {
  if (ended || displaySeconds === 0) return COPY.finished
  if (displaySeconds <= 10) return COPY.countdown
  if (displaySeconds <= 60) return COPY.finalMinute
  if (isRunning) return COPY.running
  if (displaySeconds < durationSeconds) return COPY.paused
  return COPY.ready
}
