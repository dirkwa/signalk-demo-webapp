import { useState, useMemo, type ReactNode } from 'react'
import { ServerContext, type ServerContextValue } from './serverContext.ts'

function deriveWsBase(baseUrl: string): string {
  const url = new URL(baseUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${url.origin}/signalk/v1/stream`
}

export function ServerProvider({ children }: { children: ReactNode }) {
  const [baseUrl, setBaseUrl] = useState(() => window.location.origin)
  const [token, setToken] = useState<string | null>(null)
  const [endpoints, setEndpoints] = useState({ hasV1: false, hasV2: false })

  const value = useMemo<ServerContextValue>(() => ({
    baseUrl,
    setBaseUrl,
    v1Base: `${baseUrl}/signalk/v1`,
    v2Base: `${baseUrl}/signalk/v2/api`,
    wsBase: deriveWsBase(baseUrl),
    token,
    setToken,
    isAuthenticated: token !== null,
    hasV1: endpoints.hasV1,
    hasV2: endpoints.hasV2,
    setEndpoints,
  }), [baseUrl, token, endpoints])

  return (
    <ServerContext value={value}>
      {children}
    </ServerContext>
  )
}
