import { motion } from 'framer-motion'
import { CircleStop, Pause, Play, Settings } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import AudioUnlock from './components/AudioUnlock.jsx'
import ResetButton from './components/ResetButton.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import { useMatchTimer } from './hooks/useMatchTimer.js'
import { useRemoteTrigger } from './hooks/useRemoteTrigger.js'
import { useWakeLock } from './hooks/useWakeLock.js'
import { configureAudio, loadAudioUnlocked } from './lib/audio.js'
import { COPY, getStatusLabel } from './lib/hebrew.js'
import { extraButtonLabel, loadSettings, matchTitle, sanitizeSettings, saveSettings } from './lib/settings.js'
import { setWakeLockWanted } from './lib/wakeLock.js'

export default function App() {
  const [settings, setSettings] = useState(() => {
    const initial = loadSettings()
    configureAudio(initial)
    return initial
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const match = useMatchTimer(settings.matchSeconds)
  const wakeStatus = useWakeLock(match.isRunning)
  const [audioReady, setAudioReady] = useState(() => loadAudioUnlocked())
  const actionLock = useRef(0)
  const extraLock = useRef(0)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function updateSettings(patch) {
    setSettings((current) => {
      const next = sanitizeSettings({ ...current, ...patch })
      saveSettings(next)
      configureAudio(next)
      return next
    })
  }

  function runAction(action) {
    const timestamp = Date.now()
    if (timestamp - actionLock.current < 280) return
    actionLock.current = timestamp
    action()
  }

  useEffect(() => {
    document.title = match.ended
      ? `00:00 · ${COPY.finished}`
      : `${match.clockText} · ${COPY.shortTitle}`
  }, [match.clockText, match.ended])

  function onUnlock() {
    runAction(() => {
      const next = match.activate()
      setAudioReady(true)
      setWakeLockWanted(Boolean(next.isRunning))
    })
  }

  function onToggle() {
    if (!audioReady || match.ended || settingsOpen) return
    match.armAudio()
    runAction(() => {
      const next = match.toggle()
      setWakeLockWanted(Boolean(next.isRunning))
    })
  }

  function onExtra() {
    const timestamp = Date.now()
    if (timestamp - extraLock.current < 400) return
    extraLock.current = timestamp
    if (audioReady) match.armAudio({ flush: false })
    match.addExtra(settings.extraSeconds * 1000)
  }

  function onSurfaceGesture(event) {
    if (!audioReady) return
    const element = event.target instanceof Element ? event.target : event.target?.parentElement
    const inSettings = Boolean(
      element?.closest?.('[data-testid="settings-dialog"]')
      || element?.querySelector?.('[data-testid="settings-dialog"]'),
    )
    const skipFlush = Boolean(element?.closest?.('[data-testid="extra-time"]') || inSettings)
    match.armAudio({ flush: !skipFlush })
  }

  useRemoteTrigger(() => {
    if (!audioReady) {
      onUnlock()
      return
    }
    match.armAudio()
    onToggle()
  }, !settingsOpen)

  const status = getStatusLabel({
    ...match,
    durationSeconds: match.durationMs / 1000,
  })
  const showWakeWarning = match.isRunning && (wakeStatus === 'denied' || wakeStatus === 'unsupported')

  return (
    <div
      dir="rtl"
      onPointerDownCapture={onSurfaceGesture}
      onClickCapture={onSurfaceGesture}
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-950 text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,245,212,0.16),transparent_56%)]" />
      {match.alarm && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-0 bg-red-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: reduceMotion ? 0.9 : [0, 0.96, 0.18, 0.96, 0.16, 0.92, 0] }}
          transition={{ duration: 3, ease: 'linear' }}
        />
      )}

      <section className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-start justify-between gap-2 px-3 pt-[max(0.55rem,env(safe-area-inset-top))] ps-14">
          <div className="min-w-0 pt-1">
            <p className="text-[clamp(0.75rem,2dvh,0.95rem)] font-bold tracking-wide text-cyan-300">{COPY.league}</p>
            <h1 className="text-[clamp(0.95rem,2.5dvh,1.15rem)] font-medium text-slate-100">{matchTitle(match.durationMs)}</h1>
          </div>
          <ResetButton onReset={match.reset} />
        </header>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-1">
          <motion.p
            data-testid="clock"
            role="timer"
            dir="ltr"
            aria-label={`${COPY.timeLeft} ${match.clockText}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`clock-digits font-black tabular-nums leading-none ${clockClass(match)}`}
          >
            {match.clockText}
          </motion.p>
          <span className={`mt-[clamp(0.35rem,1.2dvh,0.8rem)] h-1 w-16 rounded-full ${barClass(match)}`} />
          <p data-testid="status" className="mt-[clamp(0.25rem,1dvh,0.55rem)] text-[clamp(0.95rem,2.4dvh,1.25rem)] font-bold text-slate-100">
            {status}
          </p>
          {showWakeWarning && (
            <p className="mt-1 max-w-[18rem] text-center text-[clamp(0.7rem,1.8dvh,0.85rem)] font-semibold leading-snug text-amber-300">
              {wakeStatus === 'unsupported' ? COPY.wakeUnsupported : COPY.wakeDenied}
            </p>
          )}
        </div>
      </section>

      <motion.button
        type="button"
        data-testid="extra-time"
        onClick={onExtra}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="relative z-10 flex h-12 shrink-0 items-center justify-center gap-2 border-y border-cyan-200/40 bg-cyan-400 text-slate-950"
      >
        <span className="text-[clamp(1.15rem,4.6vw,1.55rem)] font-black leading-none">{extraButtonLabel(settings.extraSeconds)}</span>
        <span className="text-sm font-bold">{COPY.extraAction}</span>
      </motion.button>

      <motion.button
        type="button"
        data-testid="main-button"
        aria-pressed={match.isRunning}
        disabled={match.ended}
        onClick={onToggle}
        whileTap={match.ended || !audioReady ? undefined : { scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className={`relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.25rem,1.2dvh,0.8rem)] px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center font-black disabled:opacity-100 ${buttonClass(match)}`}
      >
        <ActionIcon isRunning={match.isRunning} ended={match.ended} alarm={match.alarm} />
        <span className="max-w-[10em] text-balance text-[clamp(1.4rem,5.6vw,2.7rem)] leading-none">
          {match.ended && COPY.ended}
          {!match.ended && match.isRunning && (
            <>
              <span className="block">{COPY.pauseLine1}</span>
              <span className="mt-1 block text-[0.86em]">{COPY.pauseLine2}</span>
            </>
          )}
          {!match.ended && !match.isRunning && COPY.start}
        </span>
      </motion.button>

      <button
        type="button"
        data-testid="settings"
        aria-label={COPY.settings}
        onClick={() => setSettingsOpen(true)}
        className="absolute z-50 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-slate-950/85 text-slate-200 start-[max(0.6rem,env(safe-area-inset-inline-start))] top-[max(0.5rem,env(safe-area-inset-top))]"
      >
        <Settings className="h-5 w-5" strokeWidth={2.2} />
      </button>

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onChange={updateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {!audioReady && (
        <AudioUnlock
          label={match.isRunning || match.ended ? 'הפעל סאונד' : COPY.unlock}
          onUnlock={onUnlock}
        />
      )}
    </div>
  )
}

function ActionIcon({ isRunning, ended, alarm }) {
  const className = 'h-[clamp(2.4rem,7dvh,4.5rem)] w-[clamp(2.4rem,7dvh,4.5rem)]'
  const stroke = alarm ? 2.1 : 2.25
  if (ended) return <CircleStop className={className} strokeWidth={1.8} aria-hidden="true" />
  if (isRunning) return <Pause className={className} strokeWidth={stroke} aria-hidden="true" />
  return <Play className={className} strokeWidth={stroke} aria-hidden="true" />
}

function clockClass(match) {
  if (match.alarm) return 'text-white'
  if (match.ended || match.displaySeconds === 0) return 'text-red-500'
  if (match.displaySeconds <= 10) return 'text-red-500 critical-flash'
  if (match.displaySeconds <= 60) return 'text-yellow-300'
  return 'text-white clock-healthy'
}

function barClass(match) {
  if (match.alarm || match.ended || match.displaySeconds === 0) return 'bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.9)]'
  if (match.displaySeconds <= 10) return 'bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.9)]'
  if (match.displaySeconds <= 60) return 'bg-yellow-300 shadow-[0_0_16px_rgba(253,224,71,0.8)]'
  return 'bg-cyan-400 shadow-[0_0_16px_rgba(0,245,212,0.85)]'
}

function buttonClass(match) {
  if (match.alarm) return 'bg-transparent text-white'
  if (match.ended) return 'bg-slate-900 text-slate-300'
  if (match.isRunning) return 'bg-gradient-to-b from-amber-400 via-amber-500 to-red-600 text-slate-950'
  return 'bg-emerald-500 text-slate-950'
}
