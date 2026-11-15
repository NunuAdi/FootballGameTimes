import { useEffect, useRef } from 'react'
import { holdMediaSession, setMediaRemoteHandler } from '../lib/audio.js'
import { COPY } from '../lib/hebrew.js'
import { isRemoteEvent, shouldPreventRemoteDefault } from '../lib/remote.js'

const REPEAT_GUARD_MS = 300
const OPTIONS = { capture: true, passive: false }

export function useRemoteTrigger(handler, enabled = true) {
  const handlerRef = useRef(handler)
  const enabledRef = useRef(enabled)

  useEffect(() => {
    handlerRef.current = handler
    enabledRef.current = enabled
  })

  useEffect(() => {
    let last = 0
    let sawDown = false
    const catcher = document.createElement('input')
    catcher.type = 'text'
    catcher.inputMode = 'none'
    catcher.readOnly = true
    catcher.autocomplete = 'off'
    catcher.setAttribute('data-testid', 'shutter-catch')
    catcher.setAttribute('aria-label', COPY.shutterAria)
    catcher.setAttribute('aria-hidden', 'true')
    catcher.tabIndex = 0
    catcher.style.cssText = 'position:fixed;inset:auto 0 -8px 0;height:1px;width:1px;opacity:0;border:0;padding:0;pointer-events:none'

    function inSettings() {
      return Boolean(document.activeElement?.closest?.('[data-testid="settings-dialog"]'))
    }

    function keepFocus() {
      if (!enabledRef.current || inSettings()) return
      if (document.activeElement === catcher) return
      try { catcher.focus({ preventScroll: true }) } catch { catcher.focus() }
    }

    function fire() {
      if (!enabledRef.current) return
      const timestamp = Date.now()
      if (timestamp - last < REPEAT_GUARD_MS) return
      last = timestamp
      holdMediaSession()
      handlerRef.current()
      window.setTimeout(keepFocus, 40)
    }

    function capture(event) {
      if (!isRemoteEvent(event)) return false
      if (shouldPreventRemoteDefault(event)) {
        event.preventDefault()
        event.stopPropagation()
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation()
      }
      return true
    }

    function onKeyDown(event) {
      if (event.repeat) return
      if (!capture(event)) return
      sawDown = true
      fire()
    }

    function onKeyUp(event) {
      if (!capture(event)) return
      if (sawDown) {
        sawDown = false
        return
      }
      fire()
    }

    function onKeyPress(event) {
      capture(event)
    }

    setMediaRemoteHandler(fire)
    document.body.appendChild(catcher)
    keepFocus()
    window.addEventListener('keydown', onKeyDown, OPTIONS)
    window.addEventListener('keyup', onKeyUp, OPTIONS)
    window.addEventListener('keypress', onKeyPress, OPTIONS)
    catcher.addEventListener('keydown', onKeyDown)
    catcher.addEventListener('keyup', onKeyUp)
    document.addEventListener('visibilitychange', keepFocus)
    window.addEventListener('focus', keepFocus)
    window.addEventListener('pointerup', keepFocus)
    const focusTimer = window.setInterval(() => {
      if (enabledRef.current) keepFocus()
    }, 1200)

    return () => {
      window.clearInterval(focusTimer)
      window.removeEventListener('keydown', onKeyDown, OPTIONS)
      window.removeEventListener('keyup', onKeyUp, OPTIONS)
      window.removeEventListener('keypress', onKeyPress, OPTIONS)
      catcher.removeEventListener('keydown', onKeyDown)
      catcher.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('visibilitychange', keepFocus)
      window.removeEventListener('focus', keepFocus)
      window.removeEventListener('pointerup', keepFocus)
      catcher.remove()
    }
  }, [])
}
