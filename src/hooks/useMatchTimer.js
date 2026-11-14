import { useCallback, useEffect, useRef, useState } from 'react'
import { isAudioUnlocked, playMatchCue, stopMatchAudio, unlockAudio } from '../lib/audio.js'
import { loadState, saveState } from '../lib/storage.js'
import {
  addMatchTime,
  createInitialState,
  cueAlreadyPlayed,
  finishMatch,
  formatClock,
  getDisplaySeconds,
  getRemainingMs,
  markCue,
  nextCue,
  startTimer,
  toggleTimer,
} from '../lib/timer.js'

function buildInitial(matchMinutes) {
  const timestamp = Date.now()
  const loaded = loadState(timestamp)
  const preferred = matchMinutes * 60 * 1000
  const pristine = !loaded.isRunning && !loaded.ended && loaded.baseElapsedMs === 0
  return { state: pristine ? createInitialState(preferred) : loaded, now: timestamp }
}

export function useMatchTimer(matchMinutes) {
  const [{ state, now }, setSnapshot] = useState(() => buildInitial(matchMinutes))
  const minutesRef = useRef(matchMinutes)
  const stateRef = useRef(state)
  const pendingRef = useRef(null)
  const alarmTimer = useRef(0)
  const [alarm, setAlarm] = useState(false)

  const commit = useCallback((next, timestamp = Date.now()) => {
    stateRef.current = next
    setSnapshot({ state: next, now: timestamp })
    saveState(next)
  }, [])

  const triggerAlarm = useCallback(() => {
    setAlarm(true)
    window.clearTimeout(alarmTimer.current)
    alarmTimer.current = window.setTimeout(() => setAlarm(false), 3000)
  }, [])

  const applyCue = useCallback((current, cue) => {
    if (!cue || cueAlreadyPlayed(current.announced, cue)) return current.announced
    if (!isAudioUnlocked()) {
      pendingRef.current = cue
      return current.announced
    }
    pendingRef.current = null
    playMatchCue(cue)
    if (cue.type === 'end') triggerAlarm()
    return markCue(current.announced, cue)
  }, [triggerAlarm])

  const tick = useCallback((timestamp) => {
    const current = stateRef.current
    const displaySeconds = getDisplaySeconds(getRemainingMs(current, timestamp))
    if (displaySeconds === current.lastDisplaySecond) return

    let next = { ...current, lastDisplaySecond: displaySeconds }
    if (displaySeconds === 0) next = finishMatch(next)
    const cue = nextCue(current.lastDisplaySecond, displaySeconds)
    next = { ...next, announced: applyCue(current, cue) }
    commit(next, timestamp)
  }, [applyCue, commit])

  useEffect(() => {
    const onShow = () => tick(Date.now())
    const onHide = () => saveState(stateRef.current)
    document.addEventListener('visibilitychange', onShow)
    window.addEventListener('pageshow', onShow)
    window.addEventListener('pagehide', onHide)
    tick(Date.now())
    return () => {
      document.removeEventListener('visibilitychange', onShow)
      window.removeEventListener('pageshow', onShow)
      window.removeEventListener('pagehide', onHide)
      window.clearTimeout(alarmTimer.current)
    }
  }, [tick])

  useEffect(() => {
    if (!state.isRunning) return undefined
    const id = window.setInterval(() => tick(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [state.isRunning, tick])

  useEffect(() => {
    minutesRef.current = matchMinutes
    const current = stateRef.current
    const nextDuration = matchMinutes * 60 * 1000
    if (current.isRunning || current.ended || current.baseElapsedMs > 0) return
    if (current.durationMs === nextDuration) return
    commit(createInitialState(nextDuration), Date.now())
  }, [matchMinutes, commit])

  const toggle = useCallback(() => {
    const timestamp = Date.now()
    const next = toggleTimer(stateRef.current, timestamp)
    if (next === stateRef.current) return stateRef.current
    if (next.isRunning !== stateRef.current.isRunning) navigator.vibrate?.(12)
    commit(next, timestamp)
    return next
  }, [commit])

  const reset = useCallback(() => {
    stopMatchAudio()
    pendingRef.current = null
    window.clearTimeout(alarmTimer.current)
    setAlarm(false)
    navigator.vibrate?.(35)
    commit(createInitialState(minutesRef.current * 60 * 1000), Date.now())
  }, [commit])

  const addExtra = useCallback((extraMs) => {
    const timestamp = Date.now()
    stopMatchAudio()
    pendingRef.current = null
    window.clearTimeout(alarmTimer.current)
    setAlarm(false)
    const next = addMatchTime(stateRef.current, timestamp, extraMs)
    navigator.vibrate?.(18)
    commit(next, timestamp)
    tick(timestamp)
  }, [commit, tick])

  const activate = useCallback(() => {
    const pending = pendingRef.current
    unlockAudio({ primeSpeech: !pending })
    let current = stateRef.current
    if (pending && playMatchCue(pending)) {
      pendingRef.current = null
      let next = { ...current, announced: markCue(current.announced, pending) }
      if (pending.type === 'end') {
        next = { ...finishMatch(next), announced: next.announced }
        triggerAlarm()
      }
      commit(next, Date.now())
      current = stateRef.current
    }
    if (!current.ended && !current.isRunning) {
      const timestamp = Date.now()
      const next = startTimer(current, timestamp)
      if (next !== current) {
        navigator.vibrate?.(12)
        commit(next, timestamp)
        current = next
      }
    }
    return current
  }, [commit, triggerAlarm])

  const displaySeconds = getDisplaySeconds(getRemainingMs(state, now))

  return {
    clockText: formatClock(displaySeconds),
    displaySeconds,
    isRunning: state.isRunning,
    ended: state.ended,
    alarm,
    durationMs: state.durationMs,
    pristine: !state.isRunning && !state.ended && state.baseElapsedMs === 0,
    toggle,
    reset,
    activate,
    addExtra,
  }
}
