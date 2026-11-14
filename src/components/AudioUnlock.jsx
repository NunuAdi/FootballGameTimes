import { motion } from 'framer-motion'
import { Bluetooth, Volume2 } from 'lucide-react'
import { COPY } from '../lib/hebrew.js'

export default function AudioUnlock({ label, onUnlock }) {
  return (
    <motion.button
      type="button"
      data-testid="unlock"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      onClick={onUnlock}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_center,rgba(0,245,212,0.16),#020617_62%)] px-6 text-center text-white"
    >
      <span className="grid h-24 w-24 place-items-center rounded-full border border-cyan-300/40 bg-cyan-400/10 text-cyan-300 shadow-[0_0_40px_rgba(0,245,212,0.25)]">
        <Volume2 className="h-12 w-12" strokeWidth={2.2} />
      </span>
      <span className="text-[clamp(2.15rem,7.5vw,3.5rem)] font-black leading-[1.05]">
        {label.includes(' / ') ? (
          <>
            <span className="block">הפעל סאונד /</span>
            <span className="block">התחל</span>
          </>
        ) : (
          label
        )}
      </span>
      <span className="max-w-xs text-lg font-medium leading-snug text-slate-300">
        {COPY.unlockHint}
      </span>
      <span className="inline-flex items-center gap-2 text-base font-semibold text-cyan-200">
        <Bluetooth className="h-5 w-5" aria-hidden="true" />
        {COPY.remoteHint}
      </span>
    </motion.button>
  )
}
