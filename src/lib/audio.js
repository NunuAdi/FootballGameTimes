import { COPY, SECOND_WORDS, SPEECH_RATE } from './hebrew.js'

const BUZZER_SECONDS = 3
let context = null
let output = null
let unlocked = false
let speakTimer = 0
let stopBuzzer = null
const timeouts = new Set()
const audioSettings = {
  speechEnabled: true,
  volume: 1,
}

export function configureAudio({ speechEnabled, volume } = {}) {
  if (typeof speechEnabled === 'boolean') audioSettings.speechEnabled = speechEnabled
  if (typeof volume === 'number' && Number.isFinite(volume)) {
    audioSettings.volume = Math.min(1, Math.max(0, volume))
    if (output) output.gain.value = audioSettings.volume
  }
}

export function isAudioUnlocked() {
  return unlocked
}

function getAudioContext() {
  if (!context) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    context = new AudioCtx()
  }
  return context
}

function resumeContext() {
  const audio = getAudioContext()
  if (audio.state === 'suspended') audio.resume().catch(() => {})
  return audio
}

function outputNode(audio) {
  if (!output) {
    output = audio.createGain()
    output.gain.value = audioSettings.volume
    output.connect(audio.destination)
  }
  return output
}

function hebrewVoice() {
  const voices = window.speechSynthesis?.getVoices?.() ?? []
  return voices.find((voice) => voice.lang?.toLowerCase() === 'he-il')
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith('he'))
    || null
}

function clearSpeakTimer() {
  window.clearTimeout(speakTimer)
  speakTimer = 0
}

export function stopMatchAudio() {
  for (const id of timeouts) window.clearTimeout(id)
  timeouts.clear()
  clearSpeakTimer()
  window.speechSynthesis?.cancel()
  stopBuzzer?.()
  stopBuzzer = null
}

function later(fn, ms) {
  const id = window.setTimeout(() => {
    timeouts.delete(id)
    fn()
  }, ms)
  timeouts.add(id)
}

export function speak(text, rate = SPEECH_RATE) {
  const synth = window.speechSynthesis
  if (!audioSettings.speechEnabled || !synth || !text) return
  clearSpeakTimer()
  synth.resume()
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'he-IL'
  utterance.rate = rate
  utterance.pitch = 1
  utterance.volume = 1
  const voice = hebrewVoice()
  if (voice) utterance.voice = voice
  // iOS drops an utterance spoken in the same turn as cancel().
  speakTimer = window.setTimeout(() => {
    synth.resume()
    synth.speak(utterance)
  }, 60)
}

function envelope(audio, gain, when, attack, duration, peak) {
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(peak, when + attack)
  gain.gain.setValueAtTime(peak, when + Math.max(attack, duration - 0.06))
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  gain.connect(outputNode(audio))
}

function playWhistleBurst(audio, when) {
  const master = audio.createGain()
  envelope(audio, master, when, 0.012, 0.24, 0.85)
  const layers = [
    [1, 'sine', 0.72],
    [1.5, 'triangle', 0.16],
    [2, 'triangle', 0.12],
  ]
  for (const [mult, type, amount] of layers) {
    const osc = audio.createOscillator()
    const mod = audio.createOscillator()
    const modGain = audio.createGain()
    const gain = audio.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(3150 * mult, when)
    osc.frequency.linearRampToValueAtTime(3450 * mult, when + 0.08)
    osc.frequency.linearRampToValueAtTime(3000 * mult, when + 0.22)
    mod.type = 'sine'
    mod.frequency.setValueAtTime(28, when)
    modGain.gain.setValueAtTime(140, when)
    mod.connect(modGain)
    modGain.connect(osc.frequency)
    gain.gain.value = amount
    osc.connect(gain)
    gain.connect(master)
    osc.start(when)
    mod.start(when)
    osc.stop(when + 0.26)
    mod.stop(when + 0.26)
  }
}

function playDoubleWhistle() {
  const audio = resumeContext()
  const when = audio.currentTime + 0.01
  playWhistleBurst(audio, when)
  playWhistleBurst(audio, when + 0.34)
}

function playShortBeep() {
  const audio = resumeContext()
  const when = audio.currentTime + 0.01
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(988, when)
  envelope(audio, gain, when, 0.008, 0.16, 0.45)
  osc.connect(gain)
  osc.start(when)
  osc.stop(when + 0.18)
}

function playTick() {
  const audio = resumeContext()
  const when = audio.currentTime + 0.005
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(1760, when)
  envelope(audio, gain, when, 0.004, 0.045, 0.4)
  osc.connect(gain)
  osc.start(when)
  osc.stop(when + 0.06)
}

function distortionCurve(amount) {
  const samples = 1024
  const curve = new Float32Array(samples)
  const deg = Math.PI / 180
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1
    curve[i] = ((3 + amount) * x * 28 * deg) / (Math.PI + amount * Math.abs(x))
  }
  return curve
}

function playBuzzer() {
  const audio = resumeContext()
  const when = audio.currentTime + 0.01
  const duration = BUZZER_SECONDS
  const horn = audio.createGain()
  const shaper = audio.createWaveShaper()
  const compressor = audio.createDynamicsCompressor()
  shaper.curve = distortionCurve(55)
  shaper.oversample = '4x'
  compressor.threshold.setValueAtTime(-6, when)
  compressor.knee.setValueAtTime(4, when)
  compressor.ratio.setValueAtTime(4, when)
  compressor.attack.setValueAtTime(0.002, when)
  compressor.release.setValueAtTime(0.2, when)
  // Sharp attack, then a fade that stays audible until the full 3 seconds.
  horn.gain.setValueAtTime(0.0001, when)
  horn.gain.exponentialRampToValueAtTime(1, when + 0.012)
  horn.gain.setValueAtTime(1, when + 0.7)
  horn.gain.exponentialRampToValueAtTime(0.42, when + 1.8)
  horn.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  horn.connect(shaper)
  shaper.connect(compressor)
  compressor.connect(outputNode(audio))

  const partials = [
    ['square', 150, 0.7],
    ['sawtooth', 150, 0.22],
    ['sawtooth', 300, 0.55],
    ['square', 300, 0.28],
  ]
  const oscillators = partials.map(([type, freq, amount]) => {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, when)
    osc.frequency.linearRampToValueAtTime(freq * 0.975, when + duration)
    gain.gain.setValueAtTime(amount, when)
    osc.connect(gain)
    gain.connect(horn)
    osc.start(when)
    osc.stop(when + duration + 0.02)
    return osc
  })

  const noiseLength = Math.floor(audio.sampleRate * duration)
  const noiseBuffer = audio.createBuffer(1, noiseLength, audio.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  for (let i = 0; i < noiseLength; i += 1) data[i] = Math.random() * 2 - 1
  const noise = audio.createBufferSource()
  const filter = audio.createBiquadFilter()
  const noiseGain = audio.createGain()
  noise.buffer = noiseBuffer
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(300, when)
  filter.Q.setValueAtTime(0.8, when)
  noiseGain.gain.setValueAtTime(0.07, when)
  noise.connect(filter)
  filter.connect(noiseGain)
  noiseGain.connect(horn)
  noise.start(when)
  noise.stop(when + duration)

  stopBuzzer = () => {
    const at = audio.currentTime
    horn.gain.cancelScheduledValues(at)
    horn.gain.setValueAtTime(Math.max(horn.gain.value, 0.0001), at)
    horn.gain.exponentialRampToValueAtTime(0.0001, at + 0.04)
    for (const osc of oscillators) {
      try { osc.stop(at + 0.05) } catch { /* already stopped */ }
    }
    try { noise.stop(at + 0.05) } catch { /* already stopped */ }
    stopBuzzer = null
  }

  navigator.vibrate?.([180, 70, 180, 70, 420])
}

export function unlockAudio({ primeSpeech = true } = {}) {
  const audio = getAudioContext()
  unlocked = true
  const resumed = audio.resume()
  resumed.then(() => playTick()).catch(() => {})
  if (primeSpeech) speak(COPY.readySpeech)
  if (window.speechSynthesis) {
    window.speechSynthesis.addEventListener('voiceschanged', () => hebrewVoice(), { once: true })
  }
  return resumed
}

export function playMatchCue(cue) {
  if (!unlocked || !cue) return false
  resumeContext()
  if (cue.type === 'minute') {
    playDoubleWhistle()
    later(() => speak(COPY.minute, SPEECH_RATE), 700)
  } else if (cue.type === 'thirty') {
    playShortBeep()
    later(() => speak(COPY.thirty, SPEECH_RATE), 220)
  } else if (cue.type === 'count') {
    playTick()
    speak(SECOND_WORDS[cue.second], SPEECH_RATE)
  } else if (cue.type === 'end') {
    stopMatchAudio()
    playBuzzer()
  }
  return true
}
