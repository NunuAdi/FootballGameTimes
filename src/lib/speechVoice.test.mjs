import assert from 'node:assert/strict'
import test from 'node:test'
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
  const carmit = { name: 'Carmit', lang: 'he-IL' }
  assert.equal(selectHebrewMaleVoice([
    { name: 'Siri', lang: 'en-US' },
    carmit,
  ]), carmit)
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
