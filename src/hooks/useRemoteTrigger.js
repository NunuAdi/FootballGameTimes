import { useEffect, useRef } from 'react'
import { isRemoteEvent, shouldPreventRemoteDefault } from '../lib/remote.js'

const REPEAT_GUARD_MS = 300

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

    function onKeyDown(event) {
      if (!enabledRef.current || event.repeat || !isRemoteEvent(event)) return
      sawDown = true
      if (shouldPreventRemoteDefault(event)) event.preventDefault()
      const timestamp = Date.now()
      if (timestamp - last < REPEAT_GUARD_MS) return
      last = timestamp
      handlerRef.current()
    }

    function onKeyUp(event) {
      if (!enabledRef.current || !isRemoteEvent(event)) return
      if (sawDown) {
        sawDown = false
        return
      }
      if (shouldPreventRemoteDefault(event)) event.preventDefault()
      const timestamp = Date.now()
      if (timestamp - last < REPEAT_GUARD_MS) return
      last = timestamp
      handlerRef.current()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])
}
