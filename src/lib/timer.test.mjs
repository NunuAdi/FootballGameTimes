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
  jumpToRemaining,
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

function cuesWhileFalling(state) {
  const heard = []
  let current = state
  for (let second = current.lastDisplaySecond - 1; second >= 0; second -= 1) {
    const cue = nextCue(current.lastDisplaySecond, second)
    if (cue && !cueAlreadyPlayed(current.announced, cue)) {
      heard.push(cue.type === 'count' ? cue.second : cue.type)
      current = { ...current, lastDisplaySecond: second, announced: markCue(current.announced, cue) }
    } else {
      current = { ...current, lastDisplaySecond: second }
    }
  }
  return heard
}

test('jumping to 1:20 pauses a 7-minute match at 01:20 and re-arms every cue', () => {
  const running = {
    ...createInitialState(),
    isRunning: true,
    startedAt: 4_000,
    baseElapsedMs: 200_000,
    lastDisplaySecond: 25,
    announced: [60, 30, 10, 9, 0],
  }
  const jumped = jumpToRemaining(running, 80_000)
  assert.equal(running.isRunning, true)
  assert.equal(jumped.isRunning, false)
  assert.equal(jumped.startedAt, null)
  assert.equal(jumped.ended, false)
  assert.equal(jumped.durationMs, MATCH_DURATION_MS)
  assert.equal(jumped.baseElapsedMs, MATCH_DURATION_MS - 80_000)
  assert.equal(formatClock(getDisplaySeconds(getRemainingMs(jumped, 9_000))), '01:20')
  assert.ok(jumped.lastDisplaySecond > 60)
  assert.equal(jumped.announced.includes(60), false)
  assert.equal(jumped.announced.includes(30), false)
  assert.equal(startTimer(jumped, 10_000).isRunning, true)
  assert.equal(jumpToRemaining({ ...finishMatch(createInitialState()), announced: [0, 60] }, 80_000).ended, false)
  assert.deepEqual(cuesWhileFalling(jumped), ['minute', 'thirty', 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 'end'])
})

test('landing on 30, 10, or 0 arms the threshold or ends the match', () => {
  const atThirty = jumpToRemaining({ ...createInitialState(), announced: [60, 30, 10] }, 30_000)
  assert.equal(formatClock(getDisplaySeconds(getRemainingMs(atThirty, 0))), '00:30')
  assert.equal(atThirty.lastDisplaySecond, 31)
  assert.equal(atThirty.ended, false)
  assert.equal(atThirty.announced.includes(60), true)
  assert.equal(atThirty.announced.includes(30), false)
  assert.deepEqual(nextCue(atThirty.lastDisplaySecond, 30), { type: 'thirty' })

  const atTen = jumpToRemaining(createInitialState(), 10_000)
  assert.equal(atTen.lastDisplaySecond, 11)
  assert.equal(atTen.isRunning, false)
  assert.deepEqual(nextCue(atTen.lastDisplaySecond, 10), { type: 'count', second: 10 })

  const ended = jumpToRemaining(finishMatch(createInitialState()), 0)
  assert.equal(ended.ended, true)
  assert.equal(ended.isRunning, false)
  assert.equal(ended.startedAt, null)
  assert.equal(ended.lastDisplaySecond, 0)
  assert.equal(formatClock(getDisplaySeconds(getRemainingMs(ended, 50))), '00:00')
  assert.equal(startTimer(ended, 50), ended)
  assert.equal(jumpToRemaining(createInitialState(), -5_000).ended, true)
})

test('a jump longer than the match shows that exact time, and a huge jump stops at 30 minutes', () => {
  const raised = jumpToRemaining(createInitialState(60_000), 80_000)
  assert.equal(raised.durationMs, 80_000)
  assert.equal(raised.baseElapsedMs, 0)
  assert.equal(raised.ended, false)
  assert.equal(formatClock(getDisplaySeconds(getRemainingMs(raised, 1))), '01:20')
  assert.ok(raised.lastDisplaySecond > 60)

  const capped = jumpToRemaining(createInitialState(), 50 * 60 * 1000)
  assert.equal(capped.durationMs, 30 * 60 * 1000)
  assert.equal(formatClock(getDisplaySeconds(getRemainingMs(capped, 0))), '30:00')

  const fresh = createInitialState()
  assert.equal(jumpToRemaining(fresh, Number.NaN), fresh)
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
