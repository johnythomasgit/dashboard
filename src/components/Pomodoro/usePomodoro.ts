import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadJson, saveJson } from '../../lib/storage'

export type PomodoroMode = 'work' | 'break'

export interface PomodoroConfig {
  workMinutes: number
  breakMinutes: number
  autoStartNext: boolean
}

export interface PomodoroState {
  mode: PomodoroMode
  isRunning: boolean
  startTimestampMs: number | null
  endTimestampMs: number | null
  remainingMs: number
}

const MS_IN_MINUTE = 60_000
const TICK_MS = 250

const STORAGE_KEY = 'pomodoro_state_v1'

export function usePomodoro(initial?: Partial<PomodoroConfig>) {
  const config: PomodoroConfig = useMemo(() => ({
    workMinutes: initial?.workMinutes ?? 25,
    breakMinutes: initial?.breakMinutes ?? 5,
    autoStartNext: initial?.autoStartNext ?? true,
  }), [initial?.workMinutes, initial?.breakMinutes, initial?.autoStartNext])

  const [state, setState] = useState<PomodoroState>(() => {
    const restored = loadJson<PomodoroState>(STORAGE_KEY)
    if (restored) {
      // Recompute remaining if running
      if (restored.isRunning && restored.endTimestampMs) {
        const remaining = Math.max(0, restored.endTimestampMs - Date.now())
        return { ...restored, remainingMs: remaining }
      }
      return restored
    }
    return {
      mode: 'work',
      isRunning: false,
      startTimestampMs: null,
      endTimestampMs: null,
      remainingMs: config.workMinutes * MS_IN_MINUTE,
    }
  })

  const intervalRef = useRef<number | null>(null)

  const durationForMode = useCallback((mode: PomodoroMode) => {
    return (mode === 'work' ? config.workMinutes : config.breakMinutes) * MS_IN_MINUTE
  }, [config.workMinutes, config.breakMinutes])

  const clearTick = useCallback(() => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const computeRemaining = useCallback((endMs: number | null) => {
    if (!endMs) return 0
    const now = Date.now()
    return Math.max(0, endMs - now)
  }, [])

  const start = useCallback(() => {
    setState((prev) => {
      const now = Date.now()
      const targetEnd = now + (prev.remainingMs > 0 ? prev.remainingMs : durationForMode(prev.mode))
      return {
        ...prev,
        isRunning: true,
        startTimestampMs: now,
        endTimestampMs: targetEnd,
      }
    })
  }, [durationForMode])

  const pause = useCallback(() => {
    setState((prev) => {
      const remaining = computeRemaining(prev.endTimestampMs)
      return {
        ...prev,
        isRunning: false,
        startTimestampMs: null,
        endTimestampMs: null,
        remainingMs: remaining,
      }
    })
  }, [computeRemaining])

  const reset = useCallback(() => {
    setState(() => ({
      mode: 'work',
      isRunning: false,
      startTimestampMs: null,
      endTimestampMs: null,
      remainingMs: durationForMode('work'),
    }))
  }, [durationForMode])

  const switchMode = useCallback((nextMode: PomodoroMode) => {
    setState(() => {
      const now = Date.now()
      const end = now + durationForMode(nextMode)
      return {
        mode: nextMode,
        isRunning: true,
        startTimestampMs: now,
        endTimestampMs: end,
        remainingMs: durationForMode(nextMode),
      }
    })
  }, [durationForMode])

  useEffect(() => {
    saveJson(STORAGE_KEY, state)
  }, [state])

  useEffect(() => {
    clearTick()
    if (!state.isRunning || !state.endTimestampMs) return
    intervalRef.current = window.setInterval(() => {
      setState((prev) => {
        const remaining = computeRemaining(prev.endTimestampMs)
        if (remaining <= 0) {
          if (prev.mode === 'work') {
            if (config.autoStartNext) {
              const now = Date.now()
              return {
                mode: 'break',
                isRunning: true,
                startTimestampMs: now,
                endTimestampMs: now + durationForMode('break'),
                remainingMs: durationForMode('break'),
              }
            } else {
              return {
                mode: 'break',
                isRunning: false,
                startTimestampMs: null,
                endTimestampMs: null,
                remainingMs: durationForMode('break'),
              }
            }
          } else {
            if (config.autoStartNext) {
              const now = Date.now()
              return {
                mode: 'work',
                isRunning: true,
                startTimestampMs: now,
                endTimestampMs: now + durationForMode('work'),
                remainingMs: durationForMode('work'),
              }
            } else {
              return {
                mode: 'work',
                isRunning: false,
                startTimestampMs: null,
                endTimestampMs: null,
                remainingMs: durationForMode('work'),
              }
            }
          }
        }
        return { ...prev, remainingMs: remaining }
      })
    }, TICK_MS)
    return clearTick
  }, [state.isRunning, state.endTimestampMs, clearTick, computeRemaining, durationForMode, config.autoStartNext])

  const setWorkMinutes = useCallback((minutes: number) => {
    setState((prev) => {
      const ms = Math.max(1, Math.round(minutes)) * MS_IN_MINUTE
      if (prev.mode === 'work' && !prev.isRunning) {
        return { ...prev, remainingMs: ms }
      }
      return prev
    })
  }, [])

  const setBreakMinutes = useCallback((minutes: number) => {
    setState((prev) => {
      const ms = Math.max(1, Math.round(minutes)) * MS_IN_MINUTE
      if (prev.mode === 'break' && !prev.isRunning) {
        return { ...prev, remainingMs: ms }
      }
      return prev
    })
  }, [])

  const formatted = useMemo(() => formatTime(state.remainingMs), [state.remainingMs])

  return {
    state,
    formatted,
    start,
    pause,
    reset,
    switchMode,
    setWorkMinutes,
    setBreakMinutes,
  }
}

function formatTime(totalMs: number): string {
  const totalSeconds = Math.ceil(totalMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return `${mm}:${ss}`
}


