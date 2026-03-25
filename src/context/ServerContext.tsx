import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'

interface ServerContextValue {
  baseUrl: string
  setBaseUrl: (url: string) => void
  v1Base: string
  v2Base: string
  wsBase: string
  token: string | null
  setToken: (token: string | null) => void
  isAuthenticated: boolean
  hasV1: boolean
  hasV2: boolean
  setEndpoints: (endpoints: { hasV1: boolean; hasV2: boolean }) => void
}

const ServerContext = createContext<ServerContextValue | null>(null)

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

export function useServer(): ServerContextValue {
  const ctx = useContext(ServerContext)
  if (!ctx) throw new Error('useServer must be used within ServerProvider')
  return ctx
}
