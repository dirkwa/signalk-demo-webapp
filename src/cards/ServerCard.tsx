import { useState, useEffect } from 'react'
import { useServer } from '../context/ServerContext.tsx'
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
  const [urlInput, setUrlInput] = useState(baseUrl)
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [selfId, setSelfId] = useState<string | null>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<CardStatus>('ok')

  async function fetchServerInfo() {
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

      // GET /signalk/v1/self — vessel UUID
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
  }

  useEffect(() => {
    fetchServerInfo()
  }, [baseUrl])

  function handleUrlSubmit() {
    const trimmed = urlInput.replace(/\/+$/, '')
    if (trimmed !== baseUrl) {
      setBaseUrl(trimmed)
    }
  }

  return (
    <CardShell
      title="Server"
      sourceFile="src/cards/ServerCard.tsx"
      apiPaths={['GET /signalk', 'GET /signalk/v1/api/self']}
      status={status}
    >
      <div data-testid="server-card" className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={handleUrlSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
            placeholder="http://localhost:3000"
          />
          <button
            onClick={fetchServerInfo}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            Connect
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {serverInfo && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-gray-500">Server</dt>
            <dd className="text-gray-900">{serverInfo.server.id}</dd>

            <dt className="text-gray-500">Version</dt>
            <dd className="text-gray-900">{serverInfo.server.version}</dd>

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

        <RawJson data={serverInfo} />
      </div>
    </CardShell>
  )
}
