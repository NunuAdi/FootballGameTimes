let wanted = false
let sentinel = null
let pending = null
let status = 'off'
let listening = false
const listeners = new Set()

function emit(next) {
  status = next
  for (const listener of listeners) listener(status)
}

function bindVisibility() {
  if (listening || typeof document === 'undefined') return
  listening = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wanted) acquireWakeLock()
  })
}

export function getWakeLockStatus() {
  return status
}

export function subscribeWakeLock(listener) {
  listeners.add(listener)
  listener(status)
  return () => listeners.delete(listener)
}

export function setWakeLockWanted(next) {
  bindVisibility()
  wanted = Boolean(next)
  if (!wanted) {
    const current = sentinel
    sentinel = null
    pending = null
    current?.release().catch(() => {})
    emit('off')
    return
  }
  acquireWakeLock()
}

function acquireWakeLock() {
  if (!wanted || sentinel || pending) return pending
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    emit('unsupported')
    return Promise.resolve()
  }

  pending = navigator.wakeLock.request('screen').then((lock) => {
    pending = null
    if (!wanted) {
      lock.release().catch(() => {})
      return
    }
    sentinel = lock
    emit('on')
    lock.addEventListener('release', () => {
      if (sentinel === lock) sentinel = null
      if (!wanted) return
      if (document.visibilityState !== 'visible') {
        emit('off')
        return
      }
      window.setTimeout(() => {
        if (wanted && !sentinel) acquireWakeLock()
      }, 250)
    })
  }).catch(() => {
    pending = null
    if (wanted) emit('denied')
  })

  return pending
}
