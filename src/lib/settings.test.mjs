import assert from 'node:assert/strict'
import test from 'node:test'
import { extraButtonLabel, matchTitle, parseMatchDuration, sanitizeSettings } from './settings.js'

test('settings fall back to a 7-minute match and one minute of extra time', () => {
  assert.deepEqual(sanitizeSettings(null), {
    matchSeconds: 420,
    extraSeconds: 60,
    speechEnabled: true,
    volume: 1,
  })
  const custom = sanitizeSettings({
    matchSeconds: 8 * 60 + 15,
    extraSeconds: 30,
    speechEnabled: false,
    volume: 0.4,
  })
  assert.equal(custom.matchSeconds, 495)
  assert.equal(custom.extraSeconds, 30)
  assert.equal(custom.speechEnabled, false)
  assert.equal(custom.volume, 0.4)
  assert.equal(sanitizeSettings({ matchMinutes: 10 }).matchSeconds, 600)
  assert.equal(sanitizeSettings({ matchMinutes: 12, volume: 4 }).matchSeconds, 420)
  assert.equal(sanitizeSettings({ matchSeconds: 20 }).matchSeconds, 60)
  assert.equal(sanitizeSettings({ matchSeconds: 40 * 60 }).matchSeconds, 1800)
  assert.equal(sanitizeSettings({ volume: -2 }).volume, 0)
})

test('a typed match length keeps minutes and seconds inside 1:00 to 30:00', () => {
  assert.equal(parseMatchDuration('4', '30'), 4 * 60 + 30)
  assert.equal(parseMatchDuration('8', '15'), 8 * 60 + 15)
  assert.equal(parseMatchDuration('0', '45'), 60)
  assert.equal(parseMatchDuration('30', '45'), 30 * 60)
  assert.equal(parseMatchDuration('', ''), 60)
})

test('extra-time and match labels stay short on a phone', () => {
  assert.equal(extraButtonLabel(60), '+1 דקה')
  assert.equal(extraButtonLabel(120), '+2 דקות')
  assert.equal(matchTitle(7 * 60 * 1000), 'משחק 7 דקות')
  assert.equal(matchTitle(10 * 60 * 1000), 'משחק 10 דקות')
  assert.equal(matchTitle(7.5 * 60 * 1000), 'משחק 7:30')
})
