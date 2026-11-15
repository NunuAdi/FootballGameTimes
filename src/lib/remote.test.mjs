import assert from 'node:assert/strict'
import test from 'node:test'
import { isRemoteEvent, isVolumeEvent, MEDIA_SESSION_ACTIONS, shouldPreventRemoteDefault } from './remote.js'

test('bluetooth shutter keys and keyboard aliases toggle the clock', () => {
  assert.equal(isRemoteEvent({ code: 'Space', key: ' ' }), true)
  assert.equal(isRemoteEvent({ code: 'Enter', key: 'Enter' }), true)
  assert.equal(isRemoteEvent({ code: 'MediaPlayPause', key: 'MediaPlayPause' }), true)
  assert.equal(isRemoteEvent({ code: '', key: '', keyCode: 179 }), true)
  assert.equal(isRemoteEvent({ code: 'VolumeUp', key: 'VolumeUp' }), true)
  assert.equal(isRemoteEvent({ code: 'AudioVolumeUp', key: 'AudioVolumeUp' }), true)
  assert.equal(isRemoteEvent({ code: 'AudioVolumeDown', key: 'AudioVolumeDown' }), true)
  assert.equal(isRemoteEvent({ code: '', key: '', keyCode: 175 }), true)
  assert.equal(isRemoteEvent({ code: '', key: '', keyCode: 174 }), true)
  assert.equal(isRemoteEvent({ code: 'Camera', key: 'Camera', keyCode: 27 }), true)
  assert.equal(isRemoteEvent({ code: 'VolumeMute', key: 'AudioVolumeMute' }), true)
  assert.equal(isRemoteEvent({ code: 'MediaTrackNext', key: 'MediaTrackNext' }), true)
  assert.equal(isRemoteEvent({ code: 'Unidentified', key: 'Unidentified' }), true)
  assert.equal(isRemoteEvent({ code: '', key: '' }), true)
  assert.equal(isRemoteEvent({ code: 'KeyA', key: 'a', keyCode: 65 }), false)
  assert.equal(isVolumeEvent({ code: 'AudioVolumeDown', key: 'AudioVolumeDown' }), true)
  assert.equal(isVolumeEvent({ code: '', key: '', keyCode: 175 }), true)
  assert.equal(isVolumeEvent({ code: 'Space', key: ' ' }), false)
  assert.equal(shouldPreventRemoteDefault({ code: 'Space', key: ' ' }), true)
  assert.equal(shouldPreventRemoteDefault({ code: 'AudioVolumeUp', key: 'AudioVolumeUp' }), true)
  assert.equal(shouldPreventRemoteDefault({ code: 'VolumeDown', key: 'VolumeDown' }), true)
  assert.equal(shouldPreventRemoteDefault({ code: '', key: '', keyCode: 174 }), true)
  assert.equal(shouldPreventRemoteDefault({ code: 'KeyA', key: 'a', keyCode: 65 }), false)
})

test('media session actions cover play, pause, stop, and track skips', () => {
  assert.deepEqual(MEDIA_SESSION_ACTIONS, [
    'play',
    'pause',
    'stop',
    'previoustrack',
    'nexttrack',
    'seekbackward',
    'seekforward',
  ])
})
