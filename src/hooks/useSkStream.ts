import { useRef, useState, useCallback, useEffect } from 'react'
import { useServer } from '../context/ServerContext.tsx'
import { debug } from '../lib/debug.ts'

export type StreamStatus = 'connecting' | 'open' | 'closed' | 'error'

export interface DeltaMessage {
  context?: string
  updates?: Array<{
    source?: Record<string, unknown>
    $source?: string
    timestamp?: string
    values?: Array<{ path: string; value: unknown }>
  }>
  // WS hello fields
  name?: string
  version?: string
  self?: string
  roles?: string[]
}

interface SubscribeEntry {
  path: string
  period?: number
}

export function useSkStream() {
  const { wsBase, token } = useServer()
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const subsRef = useRef<SubscribeEntry[]>([])
  const [lastDelta, setLastDelta] = useState<DeltaMessage | null>(null)
  const [status, setStatus] = useState<StreamStatus>('closed')
  const [hello, setHello] = useState<DeltaMessage | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const url = token ? `${wsBase}?token=${token}` : wsBase
    debug('ws connecting', url)
    setStatus('connecting')

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      debug('ws open')
      setStatus('open')
      retryRef.current = 0
      if (subsRef.current.length > 0) {
        const msg = JSON.stringify({
          context: 'vessels.self',
          subscribe: subsRef.current,
        })
        ws.send(msg)
        debug('ws subscribe', msg)
      }
    }

    ws.onmessage = (event) => {
      const data: DeltaMessage = JSON.parse(event.data as string)
      if (data.name && data.roles) {
        setHello(data)
      }
      if (data.updates) {
        setLastDelta(data)
      }
    }

    ws.onclose = () => {
      debug('ws closed')
      setStatus('closed')
      const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30000)
      retryRef.current++
      debug('ws reconnect in', delay, 'ms')
      retryTimerRef.current = setTimeout(connect, delay)
    }

    ws.onerror = () => {
      debug('ws error')
      setStatus('error')
    }
  }, [wsBase, token])

  const disconnect = useCallback(() => {
    clearTimeout(retryTimerRef.current)
    retryRef.current = 0
    wsRef.current?.close()
    wsRef.current = null
    setStatus('closed')
  }, [])

  const subscribe = useCallback((paths: SubscribeEntry[]) => {
    subsRef.current = paths
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      const msg = JSON.stringify({
        context: 'vessels.self',
        subscribe: paths,
      })
      ws.send(msg)
      debug('ws subscribe', msg)
    }
  }, [])

  const unsubscribe = useCallback((paths: string[]) => {
    subsRef.current = subsRef.current.filter(
      (s) => !paths.includes(s.path),
    )
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      const msg = JSON.stringify({
        context: 'vessels.self',
        unsubscribe: paths.map((path) => ({ path })),
      })
      ws.send(msg)
      debug('ws unsubscribe', msg)
    }
  }, [])

  useEffect(() => {
    return () => {
      clearTimeout(retryTimerRef.current)
      wsRef.current?.close()
    }
  }, [])

  return {
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    lastDelta,
    hello,
    status,
    retryCount: retryRef.current,
  }
}
