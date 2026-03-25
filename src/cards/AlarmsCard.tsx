import { useState, useEffect } from 'react'
import { useServer } from '../context/ServerContext.tsx'
import { useSkFetch } from '../hooks/useSkFetch.ts'
import { useSkStream } from '../hooks/useSkStream.ts'
import { CardShell } from '../components/CardShell.tsx'
import { RawJson } from '../components/RawJson.tsx'
import type { CardStatus } from '../components/StatusBadge.tsx'

type AlarmState = 'emergency' | 'alarm' | 'warn' | 'alert' | 'normal'

interface Notification {
  id: string
  state: AlarmState
  method: string[]
  message: string
  status: {
    silenced: boolean
    acknowledged: boolean
    canSilence: boolean
    canAcknowledge: boolean
    canClear: boolean
  }
}

const SEVERITY_ORDER: AlarmState[] = ['emergency', 'alarm', 'warn', 'alert', 'normal']

const SEVERITY_COLORS: Record<AlarmState, string> = {
  emergency: 'bg-red-600 text-white',
  alarm: 'bg-orange-500 text-white',
  warn: 'bg-yellow-400 text-yellow-900',
  alert: 'bg-blue-500 text-white',
  normal: 'bg-green-500 text-white',
}

export function AlarmsCard() {
  const { v2Base, hasV2 } = useServer()
  const skFetch = useSkFetch()
  const stream = useSkStream()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [error, setError] = useState<string | null>(null)

  async function loadNotifications() {
    try {
      // GET /signalk/v2/api/notifications
      const res = await skFetch(`${v2Base}/notifications`)
      if (res.ok) {
        const data = await res.json() as Record<string, Notification>
        setNotifications(Object.values(data))
        setError(null)
      } else if (res.status === 404) {
        setError(null)
      } else {
        setError(`HTTP ${res.status}`)
      }
    } catch {
      setError('Failed to load notifications')
    }
  }

  useEffect(() => {
    if (!hasV2) return
    loadNotifications()

    stream.connect()
    stream.subscribe([{ path: 'notifications.*', period: 1000 }])

    return () => stream.disconnect()
  }, [hasV2])

  useEffect(() => {
    if (!stream.lastDelta?.updates) return
    loadNotifications()
  }, [stream.lastDelta])

  async function handleAction(id: string, action: 'acknowledge' | 'silence' | 'clear') {
    // POST /signalk/v2/api/notifications/:id/{action}
    await skFetch(`${v2Base}/notifications/${id}/${action}`, { method: 'POST' })
    loadNotifications()
  }

  const sorted = [...notifications].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.state) - SEVERITY_ORDER.indexOf(b.state),
  )

  const cardStatus: CardStatus = !hasV2 ? 'unavailable' : error ? 'error' : 'ok'

  return (
    <CardShell
      title="Alarms & Notifications"
      sourceFile="src/cards/AlarmsCard.tsx"
      apiPaths={[
        'WS /signalk/v1/stream (notifications.*)',
        'GET /signalk/v2/api/notifications',
        'POST .../notifications/:id/acknowledge',
      ]}
      status={cardStatus}
    >
      <div data-testid="alarms-card" className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {sorted.length === 0 && !error && (
          <p className="text-sm text-gray-400">No active notifications</p>
        )}

        <ul className="space-y-2">
          {sorted.map((n) => (
            <li key={n.id} className="rounded border border-gray-200 p-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_COLORS[n.state]}`}>
                  {n.state}
                </span>
                <span className="flex-1 text-gray-700">{n.message}</span>
              </div>
              <div className="mt-1 flex gap-1">
                {n.status.canAcknowledge && !n.status.acknowledged && (
                  <button
                    onClick={() => handleAction(n.id, 'acknowledge')}
                    className="rounded bg-gray-200 px-2 py-0.5 text-xs hover:bg-gray-300"
                  >
                    Acknowledge
                  </button>
                )}
                {n.status.canSilence && !n.status.silenced && (
                  <button
                    onClick={() => handleAction(n.id, 'silence')}
                    className="rounded bg-gray-200 px-2 py-0.5 text-xs hover:bg-gray-300"
                  >
                    Silence
                  </button>
                )}
                {n.status.canClear && (
                  <button
                    onClick={() => handleAction(n.id, 'clear')}
                    className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 hover:bg-red-200"
                  >
                    Clear
                  </button>
                )}
                {n.status.acknowledged && (
                  <span className="text-xs text-gray-400">acknowledged</span>
                )}
                {n.status.silenced && (
                  <span className="text-xs text-gray-400">silenced</span>
                )}
              </div>
            </li>
          ))}
        </ul>

        <RawJson data={stream.lastDelta} />
      </div>
    </CardShell>
  )
}
