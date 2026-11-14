import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { COPY } from '../lib/hebrew.js'
import { EXTRA_OPTIONS, MATCH_LENGTHS, parseMatchDuration } from '../lib/settings.js'

export default function SettingsModal({ settings, onChange, onClose }) {
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')

  useEffect(() => {
    const total = settings.matchSeconds
    setMinutes(String(Math.floor(total / 60)))
    setSeconds(String(total % 60).padStart(2, '0'))
  }, [settings.matchSeconds])

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function saveDuration(event) {
    event.preventDefault()
    onChange({ matchSeconds: parseMatchDuration(minutes, seconds) })
  }

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-end bg-slate-950/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={COPY.settings}
        data-testid="settings-dialog"
        initial={{ y: 28, opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={(event) => event.stopPropagation()}
        className="max-h-full w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-900/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.45)] backdrop-blur"
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xl font-black">{COPY.settings}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={COPY.close}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <fieldset className="mb-2">
          <legend className="mb-1.5 text-sm font-bold text-slate-300">{COPY.duration}</legend>
          <div className="grid grid-cols-3 gap-2">
            {MATCH_LENGTHS.map((length) => (
              <Choice
                key={length}
                active={settings.matchSeconds === length * 60}
                onClick={() => onChange({ matchSeconds: length * 60 })}
              >
                {length} דק׳
              </Choice>
            ))}
          </div>
          <form className="mt-2" dir="ltr" onSubmit={saveDuration}>
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <DurationField
                label={COPY.durationMinutes}
                value={minutes}
                max={30}
                onChange={setMinutes}
              />
              <span className="flex h-11 items-center text-xl font-black text-slate-300" aria-hidden="true">:</span>
              <DurationField
                label={COPY.durationSeconds}
                value={seconds}
                max={59}
                onChange={setSeconds}
              />
            </div>
            <button
              type="submit"
              data-testid="save-duration"
              className="mt-2 h-11 w-full rounded-xl bg-cyan-400 text-sm font-black text-slate-950"
            >
              {COPY.saveDuration}
            </button>
          </form>
        </fieldset>

        <fieldset className="mb-2">
          <legend className="mb-1.5 text-sm font-bold text-slate-300">{COPY.extraSetting}</legend>
          <div className="grid grid-cols-3 gap-2">
            {EXTRA_OPTIONS.map((option) => (
              <Choice
                key={option.seconds}
                active={settings.extraSeconds === option.seconds}
                onClick={() => onChange({ extraSeconds: option.seconds })}
              >
                {option.label}
              </Choice>
            ))}
          </div>
        </fieldset>

        <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-1.5">
          <span className="text-sm font-bold">{COPY.voice}</span>
          <button
            type="button"
            aria-pressed={settings.speechEnabled}
            onClick={() => onChange({ speechEnabled: !settings.speechEnabled })}
            className={`h-11 min-w-24 rounded-full px-4 text-sm font-black ${settings.speechEnabled ? 'bg-cyan-400 text-slate-950' : 'bg-white/10 text-slate-200'}`}
          >
            {settings.speechEnabled ? COPY.voiceOn : COPY.voiceOff}
          </button>
        </div>

        <label className="block">
          <span className="mb-1 flex items-center justify-between text-sm font-bold text-slate-300">
            <span>{COPY.buzzerVolume}</span>
            <span className="tabular-nums text-cyan-200">{Math.round(settings.volume * 100)}%</span>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(settings.volume * 100)}
            aria-label={COPY.buzzerVolume}
            onChange={(event) => onChange({ volume: Number(event.target.value) / 100 })}
            className="h-10 w-full accent-cyan-400"
          />
          <span className="flex justify-between text-xs font-semibold text-slate-400">
            <span>{COPY.quiet}</span>
            <span>{COPY.loud}</span>
          </span>
        </label>
      </motion.div>
    </motion.div>
  )
}

function DurationField({ label, value, max, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, 2)
          if (digits === '') {
            onChange('')
            return
          }
          onChange(String(Math.min(max, Number(digits))))
        }}
        inputMode="numeric"
        enterKeyHint="done"
        autoComplete="off"
        dir="ltr"
        aria-label={label}
        className="h-11 w-full rounded-xl bg-white/10 text-center text-base font-black tabular-nums outline-none focus:ring-2 focus:ring-cyan-300"
      />
    </label>
  )
}

function Choice({ active, children, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-11 rounded-xl text-sm font-black ${active ? 'bg-cyan-400 text-slate-950' : 'bg-white/10 text-white'}`}
    >
      {children}
    </button>
  )
}
