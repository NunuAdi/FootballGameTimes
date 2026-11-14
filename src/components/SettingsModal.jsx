import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { COPY } from '../lib/hebrew.js'
import { EXTRA_OPTIONS, MATCH_LENGTHS } from '../lib/settings.js'

export default function SettingsModal({ settings, durationLocked, onChange, onClose }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
        className="max-h-full w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-900/95 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.45)] backdrop-blur"
      >
        <div className="mb-3 flex items-center justify-between">
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

        <fieldset className="mb-3">
          <legend className="mb-2 text-sm font-bold text-slate-300">{COPY.duration}</legend>
          <div className="grid grid-cols-3 gap-2">
            {MATCH_LENGTHS.map((minutes) => (
              <Choice
                key={minutes}
                active={settings.matchMinutes === minutes}
                onClick={() => onChange({ matchMinutes: minutes })}
              >
                {minutes} דק׳
              </Choice>
            ))}
          </div>
          {durationLocked && (
            <p className="mt-2 text-xs font-semibold text-amber-300">{COPY.nextMatch}</p>
          )}
        </fieldset>

        <fieldset className="mb-3">
          <legend className="mb-2 text-sm font-bold text-slate-300">{COPY.extraSetting}</legend>
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

        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-2">
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
          <span className="mb-2 flex items-center justify-between text-sm font-bold text-slate-300">
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
            className="h-11 w-full accent-cyan-400"
          />
          <span className="mt-1 flex justify-between text-xs font-semibold text-slate-400">
            <span>{COPY.quiet}</span>
            <span>{COPY.loud}</span>
          </span>
        </label>
      </motion.div>
    </motion.div>
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
