import { createInitialState, reconcileState, sanitizeState } from './timer.js'

export const STORAGE_KEY = 'fgt-match-v1'

export function loadState(now = Date.now()) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    return reconcileState(sanitizeState(JSON.parse(raw)), now)
  } catch {
    return createInitialState()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private mode or a full disk should not stop the clock.
  }
}
