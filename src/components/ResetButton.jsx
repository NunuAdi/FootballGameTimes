import { RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { COPY } from '../lib/hebrew.js'

const HOLD_MS = 1500
const RADIUS = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ResetButton({ onReset }) {
  const [progress, setProgress] = useState(0)
  const frame = useRef(0)
  const started = useRef(0)

  function stop() {
    cancelAnimationFrame(frame.current)
    setProgress(0)
  }

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    started.current = performance.now()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    navigator.vibrate?.(8)
    cancelAnimationFrame(frame.current)

    const loop = () => {
      const value = Math.min(1, (performance.now() - started.current) / HOLD_MS)
      setProgress(value)
      if (value >= 1) {
        cancelAnimationFrame(frame.current)
        setProgress(0)
        onReset()
        return
      }
      frame.current = requestAnimationFrame(loop)
    }

    frame.current = requestAnimationFrame(loop)
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        data-testid="reset"
        aria-label={COPY.resetAria}
        title={COPY.resetAria}
        onPointerDown={onPointerDown}
        onPointerUp={stop}
        onPointerCancel={stop}
        onContextMenu={(event) => event.preventDefault()}
        className="relative grid h-14 w-14 touch-none place-items-center rounded-full border border-white/15 bg-white/10 text-slate-100 shadow-[0_0_0_1px_rgba(0,245,212,0.08)]"
      >
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
          <circle cx="28" cy="28" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="3" />
          <circle
            cx="28"
            cy="28"
            r={RADIUS}
            fill="none"
            stroke="#00f5d4"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <RotateCcw className="relative h-5 w-5" strokeWidth={2.4} />
      </button>
      <span className="text-[11px] font-semibold text-slate-400">{COPY.reset}</span>
    </div>
  )
}
