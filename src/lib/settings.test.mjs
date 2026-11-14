import assert from 'node:assert/strict'
import test from 'node:test'
import { extraButtonLabel, matchTitle, sanitizeSettings } from './settings.js'

test('settings fall back to a 7-minute match and one minute of extra time', () => {
  assert.deepEqual(sanitizeSettings(null), {
    matchMinutes: 7,
    extraSeconds: 60,
    speechEnabled: true,
    volume: 1,
  })
  const custom = sanitizeSettings({
    matchMinutes: 10,
    extraSeconds: 30,
    speechEnabled: false,
    volume: 0.4,
  })
  assert.equal(custom.matchMinutes, 10)
  assert.equal(custom.extraSeconds, 30)
  assert.equal(custom.speechEnabled, false)
  assert.equal(custom.volume, 0.4)
  assert.equal(sanitizeSettings({ matchMinutes: 12, volume: 4 }).matchMinutes, 7)
  assert.equal(sanitizeSettings({ volume: -2 }).volume, 0)
})

test('extra-time and match labels stay short on a phone', () => {
  assert.equal(extraButtonLabel(60), '+1 דקה')
  assert.equal(extraButtonLabel(120), '+2 דקות')
  assert.equal(matchTitle(7 * 60 * 1000), 'משחק 7 דקות')
  assert.equal(matchTitle(10 * 60 * 1000), 'משחק 10 דקות')
  assert.equal(matchTitle(7.5 * 60 * 1000), 'משחק 7:30')
})
