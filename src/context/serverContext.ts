import { createContext } from 'react'

export interface ServerContextValue {
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

export const ServerContext = createContext<ServerContextValue | null>(null)
