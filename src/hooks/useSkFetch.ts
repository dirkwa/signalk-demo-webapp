import { useCallback } from 'react'
import { useServer } from '../context/ServerContext.tsx'
import { debug } from '../lib/debug.ts'

export function useSkFetch() {
  const { token } = useServer()

  return useCallback(async function skFetch(
    url: string,
    options?: RequestInit,
  ): Promise<Response> {
    debug('fetch', options?.method ?? 'GET', url)
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    }
    return fetch(url, { ...options, headers })
  }, [token])
}
