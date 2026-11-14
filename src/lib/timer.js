export const MATCH_DURATION_MS = 7 * 60 * 1000
export const MATCH_SECONDS = MATCH_DURATION_MS / 1000
const MIN_DURATION_MS = 60 * 1000
const MAX_DURATION_MS = 30 * 60 * 1000

export function createInitialState(durationMs = MATCH_DURATION_MS) {
  const safeDuration = clamp(durationMs, MIN_DURATION_MS, MAX_DURATION_MS)
  return {
    isRunning: false,
    baseElapsedMs: 0,
    startedAt: null,
    lastDisplaySecond: Math.round(safeDuration / 1000),
    announced: [],
    ended: false,
    durationMs: safeDuration,
  }
}

/** Wall-clock math: background throttling cannot drift the match. */
export function getElapsedMs(state, now) {
  const limit = state.durationMs ?? MATCH_DURATION_MS
  const base = clamp(state.baseElapsedMs, 0, limit)
  if (!state.isRunning || state.startedAt == null) return base
  const delta = now - state.startedAt
  if (!Number.isFinite(delta) || delta < 0) return base
  return Math.min(limit, base + delta)
}

export function getRemainingMs(state, now) {
  return Math.max(0, (state.durationMs ?? MATCH_DURATION_MS) - getElapsedMs(state, now))
}

export function getDisplaySeconds(remainingMs) {
  if (remainingMs <= 0) return 0
  return Math.ceil(remainingMs / 1000)
}

export function formatClock(displaySeconds) {
  const safe = Math.max(0, Math.floor(displaySeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function startTimer(state, now) {
  if (state.ended || state.isRunning) return state
  if (getRemainingMs(state, now) <= 0) return finishMatch(state)
  return { ...state, isRunning: true, startedAt: now }
}

export function pauseTimer(state, now) {
  if (!state.isRunning) return state
  const baseElapsedMs = getElapsedMs(state, now)
  const ended = baseElapsedMs >= state.durationMs
  return {
    ...state,
    isRunning: false,
    startedAt: null,
    baseElapsedMs,
    ended: state.ended || ended,
    lastDisplaySecond: getDisplaySeconds(state.durationMs - baseElapsedMs),
  }
}

export function toggleTimer(state, now) {
  return state.isRunning ? pauseTimer(state, now) : startTimer(state, now)
}

export function finishMatch(state) {
  return {
    ...state,
    isRunning: false,
    startedAt: null,
    baseElapsedMs: state.durationMs,
    lastDisplaySecond: 0,
    ended: true,
  }
}

/**
 * Add extra time to the allowance. A running clock keeps running from the same
 * timestamp; a paused or finished clock stays paused with the new remaining time.
 */
export function addMatchTime(state, now, extraMs) {
  const extra = Number.isFinite(extraMs) ? Math.max(0, extraMs) : 0
  const elapsed = getElapsedMs(state, now)
  const durationMs = clamp(state.durationMs + extra, MIN_DURATION_MS, MAX_DURATION_MS)
  const stillRunning = state.isRunning && !state.ended && elapsed < state.durationMs
  const displaySeconds = getDisplaySeconds(durationMs - elapsed)
  return {
    ...state,
    durationMs,
    isRunning: stillRunning,
    startedAt: stillRunning ? state.startedAt : null,
    baseElapsedMs: stillRunning ? state.baseElapsedMs : elapsed,
    lastDisplaySecond: isCueSecond(displaySeconds) ? displaySeconds + 1 : displaySeconds,
    ended: false,
    announced: state.announced.filter((mark) => mark > displaySeconds),
  }
}

/**
 * Move the clock to an exact remaining time and pause.
 * The match length stays when the target fits. A longer target raises the
 * length (up to the 30-minute ceiling) so the requested time is what shows.
 * Landing on a cue second arms the next tick, same as extra time.
 */
export function jumpToRemaining(state, remainingMs) {
  if (!Number.isFinite(remainingMs)) return state
  const requestedMs = clamp(Math.round(remainingMs / 1000), 0, MAX_DURATION_MS / 1000) * 1000
  const currentDuration = state.durationMs ?? MATCH_DURATION_MS
  const durationMs = requestedMs > currentDuration
    ? clamp(requestedMs, MIN_DURATION_MS, MAX_DURATION_MS)
    : currentDuration
  const baseElapsedMs = durationMs - Math.min(requestedMs, durationMs)
  const displaySeconds = getDisplaySeconds(durationMs - baseElapsedMs)
  const ended = displaySeconds === 0
  return {
    ...state,
    durationMs,
    isRunning: false,
    startedAt: null,
    baseElapsedMs,
    lastDisplaySecond: ended ? 0 : (isCueSecond(displaySeconds) ? displaySeconds + 1 : displaySeconds),
    ended,
    announced: state.announced.filter((mark) => mark > displaySeconds),
  }
}

/**
 * Cue when the displayed second falls from `prev` to `curr`.
 * A jump speaks only the latest relevant cue so stacked alerts stay intelligible.
 */
export function nextCue(prev, curr) {
  if (!Number.isInteger(prev) || !Number.isInteger(curr) || curr === prev) return null
  if (curr > prev) return null
  if (curr === 0) return { type: 'end' }
  if (curr <= 10) return { type: 'count', second: curr }
  if (prev > 30 && curr <= 30) return { type: 'thirty' }
  if (prev > 60 && curr <= 60) return { type: 'minute' }
  return null
}

export function cueAlreadyPlayed(announced, cue) {
  if (!cue) return true
  if (cue.type === 'minute') return announced.includes(60)
  if (cue.type === 'thirty') return announced.includes(30)
  if (cue.type === 'count') return announced.includes(cue.second)
  if (cue.type === 'end') return announced.includes(0)
  return true
}

export function markCue(announced, cue) {
  const next = new Set(announced)
  if (cue.type === 'minute') next.add(60)
  if (cue.type === 'thirty') {
    next.add(60)
    next.add(30)
  }
  if (cue.type === 'count') {
    next.add(60)
    next.add(30)
    for (let second = cue.second; second <= 10; second += 1) next.add(second)
  }
  if (cue.type === 'end') {
    next.add(60)
    next.add(30)
    next.add(0)
    for (let second = 1; second <= 10; second += 1) next.add(second)
  }
  return [...next]
}

export function sanitizeState(raw) {
  const initial = createInitialState()
  if (!raw || typeof raw !== 'object') return initial

  let durationMs = Number(raw.durationMs)
  if (!Number.isFinite(durationMs)) durationMs = MATCH_DURATION_MS
  durationMs = clamp(durationMs, MIN_DURATION_MS, MAX_DURATION_MS)

  let baseElapsedMs = Number(raw.baseElapsedMs)
  if (!Number.isFinite(baseElapsedMs)) baseElapsedMs = 0
  baseElapsedMs = clamp(baseElapsedMs, 0, durationMs)

  let startedAt = raw.startedAt == null ? null : Number(raw.startedAt)
  if (!Number.isFinite(startedAt)) startedAt = null

  const durationSeconds = Math.round(durationMs / 1000)
  let lastDisplaySecond = Number(raw.lastDisplaySecond)
  if (!Number.isInteger(lastDisplaySecond)) {
    lastDisplaySecond = getDisplaySeconds(durationMs - baseElapsedMs)
  }
  lastDisplaySecond = clamp(lastDisplaySecond, 0, durationSeconds)

  const announced = Array.isArray(raw.announced)
    ? [...new Set(raw.announced.filter((value) => Number.isInteger(value) && value >= 0 && value <= 3600))]
    : []

  const ended = Boolean(raw.ended) || baseElapsedMs >= durationMs
  const isRunning = Boolean(raw.isRunning) && !ended && startedAt != null

  return {
    isRunning,
    baseElapsedMs,
    startedAt: isRunning ? startedAt : null,
    lastDisplaySecond,
    announced,
    ended,
    durationMs,
  }
}

/** If the phone was locked while running, finish the match without losing the cue boundary. */
export function reconcileState(state, now) {
  if (!state.isRunning) return state
  if (getElapsedMs(state, now) < state.durationMs) return state
  return {
    ...finishMatch(state),
    lastDisplaySecond: state.lastDisplaySecond,
  }
}

function isCueSecond(seconds) {
  return seconds === 60 || seconds === 30 || (seconds >= 1 && seconds <= 10)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
