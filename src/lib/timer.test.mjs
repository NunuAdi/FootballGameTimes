import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MATCH_DURATION_MS,
  addMatchTime,
  createInitialState,
  cueAlreadyPlayed,
  finishMatch,
  formatClock,
  getDisplaySeconds,
  getElapsedMs,
  getRemainingMs,
  markCue,
  nextCue,
  pauseTimer,
  reconcileState,
  sanitizeState,
  startTimer,
  toggleTimer,
} from './timer.js'

test('a fresh match is 07:00 and does not drift while running', () => {
  const started = { ...createInitialState(), isRunning: true, startedAt: 1_000 }
  assert.equal(formatClock(getDisplaySeconds(getRemainingMs(started, 1_000))), '07:00')
  assert.equal(getElapsedMs(started, 1_000 + 360_000), 360_000)
  assert.equal(formatClock(getDisplaySeconds(getRemainingMs(started, 1_000 + 360_000))), '01:00')
  assert.equal(getDisplaySeconds(getRemainingMs(started, 1_000 + 359_000)), 61)
  assert.equal(getElapsedMs(started, 1_000 + 999_999), MATCH_DURATION_MS)
  assert.equal(getElapsedMs(started, 0), 0)
})

test('pause freezes elapsed time and the next start continues from it', () => {
  const running = { ...createInitialState(), isRunning: true, startedAt: 10_000 }
  const paused = pauseTimer(running, 15_000)
  assert.equal(paused.isRunning, false)
  assert.equal(paused.baseElapsedMs, 5_000)
  assert.equal(paused.startedAt, null)
  const resumed = startTimer(paused, 20_000)
  assert.equal(getElapsedMs(resumed, 22_000), 7_000)
  assert.equal(pauseTimer(paused, 30_000), paused)
})

test('thresholds match six minutes, thirty seconds, the final ten, and full time', () => {
  assert.deepEqual(nextCue(61, 60), { type: 'minute' })
  assert.equal(nextCue(60, 59), null)
  assert.deepEqual(nextCue(31, 30), { type: 'thirty' })
  assert.equal(nextCue(30, 29), null)
  assert.deepEqual(nextCue(11, 10), { type: 'count', second: 10 })
  assert.deepEqual(nextCue(2, 1), { type: 'count', second: 1 })
  assert.deepEqual(nextCue(1, 0), { type: 'end' })
  assert.deepEqual(nextCue(90, 25), { type: 'thirty' })
  assert.deepEqual(nextCue(90, 8), { type: 'count', second: 8 })
  assert.deepEqual(nextCue(90, 0), { type: 'end' })
  assert.equal(nextCue(40, 35), null)
  assert.equal(nextCue(10, 40), null)
})

test('a cue is announced once and skipped seconds are marked', () => {
  const marked = markCue([], { type: 'count', second: 8 })
  assert.equal(cueAlreadyPlayed(marked, { type: 'count', second: 8 }), true)
  assert.equal(cueAlreadyPlayed(marked, { type: 'count', second: 10 }), true)
  assert.equal(cueAlreadyPlayed(marked, { type: 'minute' }), true)
  assert.equal(cueAlreadyPlayed(markCue([], { type: 'end' }), { type: 'end' }), true)
})

test('an ended or already running match cannot be started again', () => {
  const ended = finishMatch(createInitialState())
  assert.equal(startTimer(ended, 5), ended)
  assert.equal(toggleTimer(ended, 5), ended)
  const running = startTimer(createInitialState(), 5)
  assert.equal(startTimer(running, 9), running)
})

test('corrupt storage is clamped and a backgrounded finish keeps the cue boundary', () => {
  const clean = sanitizeState({
    isRunning: true,
    baseElapsedMs: -50,
    startedAt: 1_000,
    lastDisplaySecond: 900,
    announced: [60, 'no', 30],
    ended: false,
  })
  assert.equal(clean.baseElapsedMs, 0)
  assert.equal(clean.lastDisplaySecond, 420)
  assert.deepEqual(clean.announced, [60, 30])

  const away = reconcileState({
    ...createInitialState(),
    isRunning: true,
    startedAt: 0,
    lastDisplaySecond: 12,
  }, MATCH_DURATION_MS + 5_000)
  assert.equal(away.ended, true)
  assert.equal(away.isRunning, false)
  assert.equal(away.lastDisplaySecond, 12)
  assert.equal(formatClock(0), '00:00')
  assert.equal(formatClock(9), '00:09')
  assert.equal(formatClock(600), '10:00')
})

test('extra time extends a running match without restarting it', () => {
  const running = {
    ...createInitialState(),
    isRunning: true,
    startedAt: 0,
    announced: [60, 30],
    lastDisplaySecond: 20,
  }
  const extended = addMatchTime(running, 400_000, 60_000)
  assert.equal(extended.isRunning, true)
  assert.equal(extended.startedAt, 0)
  assert.equal(extended.ended, false)
  assert.equal(getDisplaySeconds(getRemainingMs(extended, 400_000)), 80)
  assert.equal(extended.announced.includes(60), false)
  assert.equal(getElapsedMs(extended, 405_000), 405_000)
})

test('extra time after the horn leaves a paused minute and can start again', () => {
  const ended = finishMatch(createInitialState())
  const golden = addMatchTime(ended, 9_000, 60_000)
  assert.equal(golden.ended, false)
  assert.equal(golden.isRunning, false)
  assert.equal(getDisplaySeconds(getRemainingMs(golden, 9_000)), 60)
  assert.equal(golden.lastDisplaySecond, 61)
  assert.equal(startTimer(golden, 10_000).isRunning, true)
})
