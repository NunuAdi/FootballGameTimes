import { useEffect, useRef } from 'react'
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

    function fire() {
      const timestamp = Date.now()
      if (timestamp - last < REPEAT_GUARD_MS) return
      last = timestamp
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
      if (!enabledRef.current) return
      event.preventDefault()
      fire()
    }

    window.addEventListener('keydown', onKeyDown, OPTIONS)
    window.addEventListener('keyup', onKeyUp, OPTIONS)
    window.addEventListener('keypress', onKeyPress, OPTIONS)
    document.addEventListener('keydown', onKeyDown, OPTIONS)
    document.addEventListener('keyup', onKeyUp, OPTIONS)

    const session = navigator.mediaSession
    const mediaActions = ['play', 'pause', 'previoustrack', 'nexttrack', 'stop']
    if (session?.setActionHandler) {
      try {
        session.setActionHandler('play', onMedia)
        session.setActionHandler('pause', onMedia)
        session.setActionHandler('stop', onMedia)
        session.setActionHandler('previoustrack', onMedia)
        session.setActionHandler('nexttrack', onMedia)
        if ('setActionHandler' in session) {
          try { session.setActionHandler('togglePlayState', onMedia) } catch { /* not in the spec */ }
        }
        session.playbackState = 'paused'
        if (window.MediaMetadata) {
          session.metadata = new window.MediaMetadata({
            title: 'שעון משחק',
            artist: 'כדורגל',
          })
        }
      } catch {
        // iOS Safari may throw until a user gesture has occurred.
      }
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown, OPTIONS)
      window.removeEventListener('keyup', onKeyUp, OPTIONS)
      window.removeEventListener('keypress', onKeyPress, OPTIONS)
      document.removeEventListener('keydown', onKeyDown, OPTIONS)
      document.removeEventListener('keyup', onKeyUp, OPTIONS)
      if (session?.setActionHandler) {
        for (const action of mediaActions) {
          try { session.setActionHandler(action, null) } catch { /* already cleared */ }
        }
        try { session.setActionHandler('togglePlayState', null) } catch { /* unsupported */ }
      }
    }
  }, [])
}
