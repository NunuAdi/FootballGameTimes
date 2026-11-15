const MALE_HINTS = ['male', 'man', 'asaf', 'avri', 'avner', 'wavenet-b', 'wavenet-d']
const FEMALE_HINTS = ['female', 'woman', 'siri female', 'carmit', 'hila', 'wavenet-a', 'wavenet-c']
const QUALITY_HINTS = ['premium', 'enhanced', 'neural', 'wavenet', 'studio', 'siri']

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

function isQualityVoice(voice) {
  const text = voiceText(voice)
  if (text.includes('compact')) return false
  return QUALITY_HINTS.some((hint) => text.includes(hint))
}

function qualityRank(voice) {
  const text = voiceText(voice)
  let rank = 0
  if (isLabeledMale(voice)) rank += 8
  if (isQualityVoice(voice)) rank += 5
  if (text.includes('premium')) rank += 2
  if (text.includes('enhanced')) rank += 2
  if (text.includes('compact')) rank -= 3
  if (!isLabeledFemale(voice)) rank += 1
  return rank
}

/** Prefer a male or Enhanced/Premium Hebrew voice over the compact Carmit default. */
export function selectHebrewMaleVoice(voices) {
  const hebrew = (voices || []).filter(isHebrewVoice)
  if (!hebrew.length) return null
  return hebrew.find(isLabeledMale)
    || hebrew.find(isQualityVoice)
    || hebrew.find((voice) => !isLabeledFemale(voice))
    || [...hebrew].sort((left, right) => qualityRank(right) - qualityRank(left))[0]
}
