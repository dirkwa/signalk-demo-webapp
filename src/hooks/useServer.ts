import { useContext } from 'react'
import { ServerContext, type ServerContextValue } from '../context/serverContext.ts'

export function useServer(): ServerContextValue {
  const ctx = useContext(ServerContext)
  if (!ctx) throw new Error('useServer must be used within ServerProvider')
  return ctx
}
