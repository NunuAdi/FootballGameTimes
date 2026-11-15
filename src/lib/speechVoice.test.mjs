import assert from 'node:assert/strict'
import test from 'node:test'
import { isAppleMobile, IOS_SPEECH_RATE, SPEECH_PITCH, speechTune } from './hebrew.js'
import { selectHebrewMaleVoice } from './speechVoice.js'

test('a named male Hebrew voice wins over the iOS female default', () => {
  const carmit = { name: 'Carmit', lang: 'he-IL', voiceURI: 'com.apple.voice.compact.he-IL.Carmit' }
  const asaf = { name: 'Microsoft Asaf Online', lang: 'he-IL', voiceURI: 'Microsoft Asaf Online - Hebrew (Israel)' }
  const picked = selectHebrewMaleVoice([
    { name: 'Samantha', lang: 'en-US' },
    carmit,
    asaf,
  ])
  assert.equal(picked, asaf)
})

test('Google male Hebrew voices are chosen ahead of female ones', () => {
  const female = { name: 'Google עברית', lang: 'he-IL', voiceURI: 'he-IL-Wavenet-A' }
  const male = { name: 'Google עברית', lang: 'he-IL', voiceURI: 'he-IL-Wavenet-B' }
  assert.equal(selectHebrewMaleVoice([female, male]), male)
})

test('Carmit is used when iOS exposes no male Hebrew voice', () => {
  const carmit = { name: 'Carmit', lang: 'he-IL', voiceURI: 'com.apple.voice.compact.he-IL.Carmit' }
  assert.equal(selectHebrewMaleVoice([
    { name: 'Siri', lang: 'en-US' },
    carmit,
  ]), carmit)
})

test('an Enhanced Hebrew voice beats the compact Carmit default', () => {
  const compact = { name: 'Carmit', lang: 'he-IL', voiceURI: 'com.apple.voice.compact.he-IL.Carmit' }
  const enhanced = { name: 'Carmit (Enhanced)', lang: 'he-IL', voiceURI: 'com.apple.ttsbundle.siri_Carmit_he-IL_enhanced' }
  assert.equal(selectHebrewMaleVoice([compact, enhanced]), enhanced)
})

test('an unlabeled Hebrew voice is preferred to a female one', () => {
  const plain = { name: 'Hebrew', lang: 'he_IL', voiceURI: 'he-local' }
  const carmit = { name: 'Carmit', lang: 'he-IL' }
  assert.equal(selectHebrewMaleVoice([carmit, plain]), plain)
})

test('no Hebrew voice returns null', () => {
  assert.equal(selectHebrewMaleVoice([{ name: 'Alex', lang: 'en-US' }]), null)
  assert.equal(selectHebrewMaleVoice([]), null)
})

test('speech stays a little slower and deeper, and iOS uses 0.88', () => {
  const tune = speechTune()
  assert.equal(tune.pitch, SPEECH_PITCH)
  assert.equal(tune.pitch, 0.95)
  assert.equal(tune.rate, isAppleMobile() ? IOS_SPEECH_RATE : 0.85)
  assert.equal(IOS_SPEECH_RATE, 0.88)
})
