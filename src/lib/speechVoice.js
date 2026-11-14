const MALE_HINTS = ['male', 'man', 'asaf', 'avri', 'avner', 'wavenet-b', 'wavenet-d']
const FEMALE_HINTS = ['female', 'woman', 'siri', 'carmit', 'hila', 'wavenet-a', 'wavenet-c']

function voiceText(voice) {
  return `${voice?.name || ''} ${voice?.voiceURI || ''} ${voice?.gender || ''}`.toLowerCase()
}

export function isHebrewVoice(voice) {
  return (voice?.lang || '').toLowerCase().replace('_', '-').includes('he')
}

function isLabeledFemale(voice) {
  const text = voiceText(voice)
  return FEMALE_HINTS.some((hint) => text.includes(hint))
}

function isLabeledMale(voice) {
  const text = voiceText(voice)
  if (isLabeledFemale(voice)) return false
  return MALE_HINTS.some((hint) => text.includes(hint))
}

/** Prefer a male Hebrew voice. Any other Hebrew voice is the fallback. */
export function selectHebrewMaleVoice(voices) {
  const hebrew = (voices || []).filter(isHebrewVoice)
  if (!hebrew.length) return null
  return hebrew.find(isLabeledMale)
    || hebrew.find((voice) => !isLabeledFemale(voice))
    || hebrew[0]
}
