import { useEffect, useState } from 'react'

const THRESHOLD = 78
const SLIP = 14
const MAX_PULL = 128

export function usePullReload(enabled = true) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    let startY = 0
    let pulling = false
    let armed = false
    let current = 0

    function inPullZone(target) {
      const node = target instanceof Element ? target : target?.parentElement
      if (!node) return false
      if (node.closest?.('[data-testid="main-button"]')) return false
      if (node.closest?.('[data-testid="extra-time"]')) return false
      if (node.closest?.('[data-testid="settings-dialog"]')) return false
      if (node.closest?.('[data-testid="settings"]')) return false
      if (node.closest?.('[data-testid="reset"]')) return false
      return Boolean(node.closest?.('[data-testid="clock-region"]'))
    }

    function onStart(event) {
      if (event.touches.length !== 1) return
      if (!inPullZone(event.target)) return
      startY = event.touches[0].clientY
      pulling = startY <= 108
      armed = false
      current = 0
    }

    function onMove(event) {
      if (!pulling) return
      const delta = event.touches[0].clientY - startY
      if (delta < SLIP) {
        current = 0
        setOffset(0)
        return
      }
      event.preventDefault()
      armed = true
      current = Math.min(MAX_PULL, (delta - SLIP) * 0.62)
      setOffset(current)
    }

    function onEnd() {
      if (!pulling) return
      pulling = false
      const shouldReload = armed && current >= THRESHOLD
      armed = false
      current = 0
      setOffset(0)
      if (shouldReload) window.location.reload()
    }

    const moveOptions = { capture: true, passive: false }
    window.addEventListener('touchstart', onStart, { capture: true, passive: true })
    window.addEventListener('touchmove', onMove, moveOptions)
    window.addEventListener('touchend', onEnd, { capture: true })
    window.addEventListener('touchcancel', onEnd, { capture: true })
    return () => {
      window.removeEventListener('touchstart', onStart, { capture: true })
      window.removeEventListener('touchmove', onMove, moveOptions)
      window.removeEventListener('touchend', onEnd, { capture: true })
      window.removeEventListener('touchcancel', onEnd, { capture: true })
    }
  }, [enabled])

  return offset
}
