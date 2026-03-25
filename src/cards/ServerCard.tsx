import { useState, useEffect, useCallback } from 'react'
import { useServer } from '../hooks/useServer.ts'
import { useSkFetch } from '../hooks/useSkFetch.ts'
import { CardShell } from '../components/CardShell.tsx'
import { RawJson } from '../components/RawJson.tsx'
import type { CardStatus } from '../components/StatusBadge.tsx'

interface ServerInfo {
  endpoints: Record<string, unknown>
  server: { id: string; version: string }
}

export function ServerCard() {
  const { baseUrl, setBaseUrl, setEndpoints } = useServer()
  const skFetch = useSkFetch()
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [selfId, setSelfId] = useState<string | null>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<CardStatus>('ok')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState(baseUrl)

  const fetchServerInfo = useCallback(async function fetchServerInfo() {
    setError(null)
    try {
      // GET /signalk — server discovery endpoint
      // Response: { endpoints: { v1: {...}, v2: {...} }, server: { id, version } }
      const t0 = performance.now()
      const res = await skFetch(`${baseUrl}/signalk`)
      const ms = performance.now() - t0
      setLatency(Math.round(ms))

      if (!res.ok) {
        setStatus('error')
        setError(`HTTP ${res.status}`)
        return
      }

      const data: ServerInfo = await res.json()
      setServerInfo(data)

      const hasV1 = 'v1' in (data.endpoints ?? {})
      const hasV2 = 'v2' in (data.endpoints ?? {})
      setEndpoints({ hasV1, hasV2 })

      // GET /signalk/v1/api/self — vessel UUID
      // Response: "vessels.urn:mrn:imo:mmsi:123456789"
      if (hasV1) {
        const selfRes = await skFetch(`${baseUrl}/signalk/v1/api/self`)
        if (selfRes.ok) {
          const id: string = await selfRes.json()
          setSelfId(id)
        }
      }

      setStatus('ok')
    } catch {
      setStatus('error')
      setError('Server unreachable')
    }
  }, [baseUrl, skFetch, setEndpoints])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount/URL change
    fetchServerInfo()
  }, [fetchServerInfo])

  function handleUrlSubmit() {
    const trimmed = urlInput.replace(/\/+$/, '')
    if (trimmed !== baseUrl) {
      setBaseUrl(trimmed)
    }
    setShowUrlInput(false)
  }

  return (
    <CardShell
      title="Server"
      sourceFile="src/cards/ServerCard.tsx"
      apiPaths={['GET /signalk', 'GET /signalk/v1/api/self']}
      status={status}
    >
      <div data-testid="server-card" className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {serverInfo && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-gray-500">Server</dt>
            <dd className="text-gray-900">{serverInfo.server.id}</dd>

            <dt className="text-gray-500">Version</dt>
            <dd className="text-gray-900">{serverInfo.server.version}</dd>

            <dt className="text-gray-500">Connected to</dt>
            <dd className="text-gray-900 break-all">{baseUrl}</dd>

            {selfId && (
              <>
                <dt className="text-gray-500">Self</dt>
                <dd className="text-gray-900 break-all">{selfId}</dd>
              </>
            )}

            <dt className="text-gray-500">Latency</dt>
            <dd className="text-gray-900">{latency !== null ? `${latency} ms` : '—'}</dd>

            <dt className="text-gray-500">API v1</dt>
            <dd>{serverInfo.endpoints?.v1 ? '✓' : '—'}</dd>

            <dt className="text-gray-500">API v2</dt>
            <dd>{serverInfo.endpoints?.v2 ? '✓' : '—'}</dd>
          </dl>
        )}

        {showUrlInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onBlur={handleUrlSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="http://localhost:3000"
              autoFocus
            />
            <button
              onClick={handleUrlSubmit}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              Connect
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setUrlInput(baseUrl); setShowUrlInput(true) }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Connect to a different server...
          </button>
        )}

        <RawJson data={serverInfo} />
      </div>
    </CardShell>
  )
}
