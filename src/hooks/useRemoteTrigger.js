import { useEffect, useRef } from 'react'
import { isRemoteEvent, shouldPreventRemoteDefault } from '../lib/remote.js'
import { holdMediaSession } from '../lib/audio.js'

const REPEAT_GUARD_MS = 300
const OPTIONS = { capture: true, passive: false }
const MEDIA_ACTIONS = [
  'play',
  'pause',
  'stop',
  'previoustrack',
  'nexttrack',
  'seekbackward',
  'seekforward',
  'seekto',
]

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

    function fire() {
      const timestamp = Date.now()
      if (timestamp - last < REPEAT_GUARD_MS) return
      last = timestamp
      holdMediaSession()
      handlerRef.current()
    }

    function capture(event) {
      if (!enabledRef.current || !isRemoteEvent(event)) return false
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

    function onMedia(event) {
      if (event?.preventDefault) event.preventDefault()
      if (event?.stopPropagation) event.stopPropagation()
      if (!enabledRef.current) return
      fire()
    }

    function bindSession() {
      const session = navigator.mediaSession
      if (!session?.setActionHandler) return
      holdMediaSession()
      for (const action of MEDIA_ACTIONS) {
        try { session.setActionHandler(action, onMedia) } catch { /* unsupported action */ }
      }
      for (const extra of ['togglePlayState', 'toggleplay']) {
        try { session.setActionHandler(extra, onMedia) } catch { /* not in the spec */ }
      }
    }

    window.addEventListener('keydown', onKeyDown, OPTIONS)
    window.addEventListener('keyup', onKeyUp, OPTIONS)
    window.addEventListener('keypress', onKeyPress, OPTIONS)
    document.addEventListener('keydown', onKeyDown, OPTIONS)
    document.addEventListener('keyup', onKeyUp, OPTIONS)
    bindSession()

    return () => {
      window.removeEventListener('keydown', onKeyDown, OPTIONS)
      window.removeEventListener('keyup', onKeyUp, OPTIONS)
      window.removeEventListener('keypress', onKeyPress, OPTIONS)
      document.removeEventListener('keydown', onKeyDown, OPTIONS)
      document.removeEventListener('keyup', onKeyUp, OPTIONS)
      const session = navigator.mediaSession
      if (!session?.setActionHandler) return
      for (const action of MEDIA_ACTIONS) {
        try { session.setActionHandler(action, null) } catch { /* already cleared */ }
      }
      for (const extra of ['togglePlayState', 'toggleplay']) {
        try { session.setActionHandler(extra, null) } catch { /* unsupported */ }
      }
    }
  }, [])
}
