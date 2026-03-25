import { useState, useEffect } from 'react'
import { useSkStream } from '../hooks/useSkStream.ts'
import { useUnitPrefs } from '../context/UnitPrefsContext.tsx'
import { CardShell } from '../components/CardShell.tsx'
import { RawJson } from '../components/RawJson.tsx'
import { SK_PATHS } from '../lib/skPaths.ts'
import { convertSpeed, convertDepth, formatValue } from '../lib/units.ts'
import type { CardStatus } from '../components/StatusBadge.tsx'

interface NavValues {
  [key: string]: unknown
}

export function LiveDataCard() {
  const { units } = useUnitPrefs()
  const stream = useSkStream()
  const [subscribed, setSubscribed] = useState(false)
  const [values, setValues] = useState<NavValues>({})

  const statusMap: Record<string, CardStatus> = {
    open: 'ok',
    connecting: 'ok',
    closed: 'error',
    error: 'error',
  }

  useEffect(() => {
    if (!stream.lastDelta?.updates) return
    for (const update of stream.lastDelta.updates) {
      if (!update.values) continue
      for (const { path, value } of update.values) {
        setValues((prev) => ({ ...prev, [path]: value }))
      }
    }
  }, [stream.lastDelta])

  function handleToggle() {
    if (subscribed) {
      stream.unsubscribe(Object.values(SK_PATHS))
      stream.disconnect()
      setSubscribed(false)
    } else {
      stream.connect()
      stream.subscribe(
        Object.values(SK_PATHS).map((path) => ({ path, period: 1000 })),
      )
      setSubscribed(true)
    }
  }

  function displaySpeed(): string {
    const raw = values[SK_PATHS.speedOverGround]
    if (typeof raw !== 'number') return '—'
    return `${formatValue(convertSpeed(raw, units.speed))} ${units.speed}`
  }

  function displayDepth(): string {
    const raw = values[SK_PATHS.depthBelowKeel]
    if (typeof raw !== 'number') return '—'
    return `${formatValue(convertDepth(raw, units.depth))} ${units.depth}`
  }

  function displayPosition(): string {
    const raw = values[SK_PATHS.position] as { latitude?: number; longitude?: number } | undefined
    if (!raw?.latitude || !raw?.longitude) return '—'
    return `${raw.latitude.toFixed(5)}, ${raw.longitude.toFixed(5)}`
  }

  function displayCog(): string {
    const raw = values[SK_PATHS.courseOverGroundTrue]
    if (typeof raw !== 'number') return '—'
    return `${formatValue(raw * (180 / Math.PI), 1)}°`
  }

  const cardStatus: CardStatus = subscribed
    ? statusMap[stream.status] ?? 'error'
    : 'ok'

  return (
    <CardShell
      title="Live Data"
      sourceFile="src/cards/LiveDataCard.tsx"
      apiPaths={['WS /signalk/v1/stream']}
      status={cardStatus}
    >
      <div data-testid="livedata-card" className="space-y-3">
        <button
          onClick={handleToggle}
          className={`rounded px-3 py-1.5 text-sm text-white ${
            subscribed ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {subscribed ? 'Unsubscribe' : 'Subscribe'}
        </button>

        {subscribed && (
          <p className="text-xs text-gray-400">
            Stream: {stream.status}
            {stream.status === 'closed' && ` (reconnect #${stream.retryCount})`}
          </p>
        )}

        {stream.hello && (
          <p className="text-xs text-gray-400">
            Server: {stream.hello.name} v{stream.hello.version} — roles: {stream.hello.roles?.join(', ')}
          </p>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-gray-500">Speed</dt>
          <dd className="font-mono text-gray-900">{displaySpeed()}</dd>

          <dt className="text-gray-500">Depth</dt>
          <dd className="font-mono text-gray-900">{displayDepth()}</dd>

          <dt className="text-gray-500">Position</dt>
          <dd className="font-mono text-gray-900">{displayPosition()}</dd>

          <dt className="text-gray-500">COG</dt>
          <dd className="font-mono text-gray-900">{displayCog()}</dd>
        </dl>

        <RawJson data={stream.lastDelta} />
      </div>
    </CardShell>
  )
}
