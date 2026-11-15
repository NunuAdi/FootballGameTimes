import assert from 'node:assert/strict'
import test from 'node:test'

class FakeAudio {
  constructor(src) {
    this.src = src
    this.paused = true
    this.currentTime = 0
    this.volume = 1
    this.preload = 'auto'
    this.playsInline = false
    FakeAudio.instances.push(this)
  }

  load() {}

  play() {
    this.paused = false
    return Promise.resolve()
  }

  pause() {
    this.paused = true
  }

  setAttribute() {}
}

FakeAudio.instances = []
globalThis.Audio = FakeAudio
globalThis.window = globalThis

const audio = await import('./audio.js')

function clip(name) {
  return FakeAudio.instances.find((node) => String(node.src).includes(name))
}

test('preload creates the three recorded Hebrew cue files', () => {
  audio.preloadCueAudio()
  assert.equal(FakeAudio.instances.length, 3)
  assert.ok(clip('one-minute.mp3'))
  assert.ok(clip('thirty-seconds.mp3'))
  assert.ok(clip('countdown-end.mp3'))
})

test('first unlock plays then immediately pauses every clip at the start', () => {
  audio.unlockAudio()
  for (const node of FakeAudio.instances) {
    assert.equal(node.paused, true)
    assert.equal(node.currentTime, 0)
  }
})

test('minute and thirty cues play the matching files and 00:00 does not start a horn', () => {
  assert.equal(audio.playMatchCue({ type: 'minute' }), true)
  assert.equal(clip('one-minute.mp3').paused, false)
  assert.equal(clip('thirty-seconds.mp3').paused, true)

  assert.equal(audio.playMatchCue({ type: 'thirty' }), true)
  assert.equal(clip('thirty-seconds.mp3').paused, false)
  assert.equal(clip('one-minute.mp3').paused, true)

  assert.equal(audio.playMatchCue({ type: 'end' }), true)
  assert.equal(clip('countdown-end.mp3').paused, true)
})

test('countdown-end pauses, seeks, resumes, and resets with the clock', () => {
  audio.stopMatchAudio()
  audio.syncCountdownAudio(8_000, true)
  const countdown = clip('countdown-end.mp3')
  assert.equal(countdown.paused, false)
  assert.equal(countdown.currentTime, 2)

  audio.syncCountdownAudio(8_000, false)
  assert.equal(countdown.paused, true)
  assert.equal(countdown.currentTime, 2)

  audio.syncCountdownAudio(5_000, true)
  assert.equal(countdown.paused, false)
  assert.equal(countdown.currentTime, 5)

  audio.syncCountdownAudio(0, false)
  assert.equal(countdown.paused, false)

  audio.stopMatchAudio()
  assert.equal(countdown.paused, true)
  assert.equal(countdown.currentTime, 0)

  audio.syncCountdownAudio(20_000, true)
  assert.equal(countdown.paused, true)
  assert.equal(countdown.currentTime, 0)
})
