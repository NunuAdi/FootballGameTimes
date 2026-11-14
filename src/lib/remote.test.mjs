import assert from 'node:assert/strict'
import test from 'node:test'
import { isRemoteEvent, shouldPreventRemoteDefault } from './remote.js'

test('bluetooth shutter keys and keyboard aliases toggle the clock', () => {
  assert.equal(isRemoteEvent({ code: 'Space', key: ' ' }), true)
  assert.equal(isRemoteEvent({ code: 'Enter', key: 'Enter' }), true)
  assert.equal(isRemoteEvent({ code: 'MediaPlayPause', key: 'MediaPlayPause' }), true)
  assert.equal(isRemoteEvent({ code: '', key: '', keyCode: 179 }), true)
  assert.equal(isRemoteEvent({ code: 'VolumeUp', key: 'VolumeUp' }), true)
  assert.equal(isRemoteEvent({ code: 'Camera', key: 'Camera', keyCode: 27 }), true)
  assert.equal(isRemoteEvent({ code: 'KeyA', key: 'a', keyCode: 65 }), false)
  assert.equal(shouldPreventRemoteDefault({ code: 'Space', key: ' ' }), true)
  assert.equal(shouldPreventRemoteDefault({ code: 'VolumeUp', key: 'VolumeUp' }), false)
})
