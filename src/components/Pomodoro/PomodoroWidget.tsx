import { useEffect, useRef, useState } from 'react'
import { WidgetCard } from '../common/WidgetCard'
import { usePomodoro } from './usePomodoro'
import { ChimePlayer } from './ChimePlayer'
import { ensureNotificationPermission, sendNotification } from '../../lib/notifications'
import { loadJson, saveJson } from '../../lib/storage'

export function PomodoroWidget() {
  const { state, formatted, start, pause, reset, switchMode } = usePomodoro()
  const settingsKey = 'pomodoro_settings_v1'
  const restored = loadJson<{ chimeEnabled: boolean; notifyEnabled: boolean; volume: number }>(settingsKey)
  const [chimeEnabled, setChimeEnabled] = useState(restored?.chimeEnabled ?? true)
  const [notifyEnabled, setNotifyEnabled] = useState(restored?.notifyEnabled ?? false)
  const [volume, setVolume] = useState(restored?.volume ?? 0.5)
  const playerRef = useRef<ChimePlayer | null>(null)
  const lastChimedMinuteRef = useRef<number>(0)

  useEffect(() => {
    if (!playerRef.current) playerRef.current = new ChimePlayer()
    playerRef.current.setVolume(volume)
  }, [volume])

  useEffect(() => {
    saveJson(settingsKey, { chimeEnabled, notifyEnabled, volume })
  }, [chimeEnabled, notifyEnabled, volume])

  useEffect(() => {
    if (!chimeEnabled) return
    if (!state.isRunning || !state.startTimestampMs) return
    const elapsedMinutes = Math.floor((Date.now() - state.startTimestampMs) / 60000)
    if (elapsedMinutes > 0 && elapsedMinutes % 5 === 0 && elapsedMinutes !== lastChimedMinuteRef.current) {
      lastChimedMinuteRef.current = elapsedMinutes
      playerRef.current?.beep(180, 880)
    }
  })

  useEffect(() => {
    if (!notifyEnabled) return
    // Session start notification
    if (state.isRunning && state.startTimestampMs && state.remainingMs > 0) {
      const title = state.mode === 'work' ? 'Work session started' : 'Break started'
      sendNotification(title, { body: 'Timer is running.' })
    }
  }, [notifyEnabled, state.isRunning, state.startTimestampMs, state.mode, state.remainingMs])

  useEffect(() => {
    if (!notifyEnabled) return
    // Session end notification
    if (state.isRunning && state.endTimestampMs && state.remainingMs === 0) {
      const title = state.mode === 'work' ? 'Work complete' : 'Break complete'
      sendNotification(title, { body: 'Session finished.' })
    }
  }, [notifyEnabled, state.isRunning, state.endTimestampMs, state.remainingMs, state.mode])

  const isWork = state.mode === 'work'

  // Keyboard shortcuts: Space (start/pause), R (reset), C (toggle chime)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA|SELECT/)) return
      if (e.code === 'Space') {
        e.preventDefault()
        state.isRunning ? pause() : start()
      } else if (e.key.toLowerCase() === 'r') {
        reset()
      } else if (e.key.toLowerCase() === 'c') {
        setChimeEnabled((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.isRunning, pause, start, reset])

  return (
    <WidgetCard title="Pomodoro">
      <div className="pomodoro__placeholder">
        <div className="muted" aria-live="polite">{isWork ? 'Work' : 'Break'}</div>
        <div className="pomodoro__time" aria-live="polite">{formatted}</div>
        <div className="pomodoro__controls">
          {state.isRunning ? (
            <button onClick={pause}>Pause</button>
          ) : (
            <button onClick={start}>Start</button>
          )}
          <button onClick={reset}>Reset</button>
          <button onClick={() => switchMode(isWork ? 'break' : 'work')}>
            Switch to {isWork ? 'Break' : 'Work'}
          </button>
        </div>
        <div className="pomodoro__controls">
          <label>
            <input
              type="checkbox"
              checked={chimeEnabled}
              onChange={(e) => setChimeEnabled(e.target.checked)}
            />
            5-min chime
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Chime volume"
          />
        </div>
        <div className="pomodoro__controls">
          <label>
            <input
              type="checkbox"
              checked={notifyEnabled}
              onChange={async (e) => {
                const next = e.target.checked
                if (next) {
                  const perm = await ensureNotificationPermission()
                  if (perm === 'granted') setNotifyEnabled(true)
                  else setNotifyEnabled(false)
                } else {
                  setNotifyEnabled(false)
                }
              }}
            />
            Notifications
          </label>
        </div>
      </div>
    </WidgetCard>
  )
}


