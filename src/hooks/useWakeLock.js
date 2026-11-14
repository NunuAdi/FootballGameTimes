import { useEffect, useState } from 'react'
import { getWakeLockStatus, setWakeLockWanted, subscribeWakeLock } from '../lib/wakeLock.js'

export function useWakeLock(active) {
  const [status, setStatus] = useState(getWakeLockStatus)

  useEffect(() => subscribeWakeLock(setStatus), [])

  useEffect(() => {
    setWakeLockWanted(active)
  }, [active])

  return status
}
