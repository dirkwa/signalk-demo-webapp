import type { Plugin, ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { WebSocketServer } from 'ws'

const SELF = 'vessels.urn:mrn:signalk:uuid:c0de0001-0001-4000-8000-000000000001'

const MOCK_TOKEN_PAYLOAD = {
  id: 'admin',
  sub: 'admin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 86400,
  roles: ['admin'],
}

function makeJwt(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    ...MOCK_TOKEN_PAYLOAD,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  }))
  return `${header}.${payload}.mock-signature`
}

// In-memory applicationData store
const appDataStore: Record<string, unknown> = {}

// In-memory waypoints store
const waypointsStore: Record<string, unknown> = {}

// In-memory notifications
const notificationsStore: Record<string, unknown> = {
  'demo-alarm-1': {
    id: 'demo-alarm-1',
    state: 'warn',
    method: ['visual'],
    message: 'Mock low battery warning',
    status: {
      silenced: false,
      acknowledged: false,
      canSilence: true,
      canAcknowledge: true,
      canClear: true,
    },
  },
}

const mockRoutes: Record<string, unknown> = {
  'route-1': {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [24.9384, 60.1699],
        [24.9500, 60.1750],
        [24.9650, 60.1800],
      ],
    },
    properties: {
      name: 'Helsinki Harbor Tour',
      description: 'Demo route',
    },
  },
}

// Simulated nav values (cycle slowly)
let tick = 0
function getNavValues() {
  tick++
  const speed = 2 + Math.sin(tick * 0.05) * 2 // 0-4 m/s
  const depth = 30 + Math.sin(tick * 0.03) * 20 // 10-50 m
  const lat = 60.1699 + Math.sin(tick * 0.01) * 0.001
  const lon = 24.9384 + Math.cos(tick * 0.01) * 0.001
  const cog = ((tick * 0.5) % 360) * (Math.PI / 180) // radians
  return { speed, depth, lat, lon, cog }
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => resolve(body))
  })
}

export function signalkMockPlugin(): Plugin {
  return {
    name: 'signalk-mock-server',
    configureServer(server: ViteDevServer) {
      // WebSocket server for /signalk/v1/stream
      let wss: WebSocketServer | null = null

      server.httpServer?.on('listening', () => {
        wss = new WebSocketServer({ noServer: true })

        server.httpServer?.on('upgrade', (req, socket, head) => {
          if (req.url?.startsWith('/signalk/v1/stream')) {
            wss!.handleUpgrade(req, socket, head, (ws) => {
              wss!.emit('connection', ws, req)
            })
          }
        })

        wss.on('connection', (ws) => {
          // Send hello message
          ws.send(JSON.stringify({
            name: 'SignalK Mock Server',
            version: '0.0.0',
            self: SELF,
            roles: ['master', 'main'],
            timestamp: new Date().toISOString(),
          }))

          // Send deltas every 1s
          const interval = setInterval(() => {
            const nav = getNavValues()
            const delta = {
              context: SELF,
              updates: [{
                timestamp: new Date().toISOString(),
                values: [
                  { path: 'navigation.speedOverGround', value: nav.speed },
                  { path: 'environment.depth.belowKeel', value: nav.depth },
                  { path: 'navigation.position', value: { latitude: nav.lat, longitude: nav.lon } },
                  { path: 'navigation.courseOverGroundTrue', value: nav.cog },
                ],
              }],
            }
            ws.send(JSON.stringify(delta))
          }, 1000)

          ws.on('close', () => clearInterval(interval))
        })
      })

      // REST routes
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''

        // GET /signalk — discovery
        if (url === '/signalk' && req.method === 'GET') {
          return json(res, 200, {
            endpoints: {
              v1: {
                version: '2.0.0',
                'signalk-http': 'http://localhost:3000/signalk/v1/api/',
                'signalk-ws': 'ws://localhost:3000/signalk/v1/stream',
              },
              v2: {
                version: '2.0.0',
                'signalk-http': 'http://localhost:3000/signalk/v2/api/',
              },
            },
            server: {
              id: 'signalk-server-node',
              version: '0.0.0-mock',
            },
          })
        }

        // GET /signalk/v1/api/self
        if (url === '/signalk/v1/api/self' && req.method === 'GET') {
          return json(res, 200, SELF)
        }

        // POST /signalk/v1/auth/login
        if (url === '/signalk/v1/auth/login' && req.method === 'POST') {
          readBody(req).then((body) => {
            const { username, password } = JSON.parse(body)
            if (username === 'admin' && password === 'admin') {
              json(res, 200, { token: makeJwt(), timeToLive: 86400000 })
            } else {
              json(res, 401, { message: 'Invalid credentials' })
            }
          })
          return
        }

        // PUT /signalk/v1/auth/logout
        if (url === '/signalk/v1/auth/logout' && req.method === 'PUT') {
          return json(res, 200, 'Logout OK')
        }

        // GET /signalk/v1/auth/validate
        if (url === '/signalk/v1/auth/validate' && req.method === 'GET') {
          return json(res, 200, { valid: true })
        }

        // GET /skServer/loginStatus — session status check
        if (url === '/skServer/loginStatus' && req.method === 'GET') {
          const authHeader = req.headers.authorization
          const isLoggedIn = authHeader?.startsWith('Bearer ')
          return json(res, 200, {
            status: isLoggedIn ? 'loggedIn' : 'notLoggedIn',
            readOnlyAccess: false,
            authenticationRequired: true,
            allowNewUserRegistration: true,
            allowDeviceAccessRequests: true,
            ...(isLoggedIn ? { userLevel: 'admin', username: 'admin' } : {}),
          })
        }

        // GET /signalk/v1/vessels/self/notifications
        if (url === '/signalk/v1/vessels/self/notifications' && req.method === 'GET') {
          return json(res, 200, notificationsStore)
        }

        // applicationData routes
        if (url.startsWith('/signalk/v1/applicationData/')) {
          const path = url.replace('/signalk/v1/applicationData/', '')
          if (req.method === 'GET') {
            return json(res, 200, appDataStore[path] ?? {})
          }
          if (req.method === 'POST') {
            readBody(req).then((body) => {
              appDataStore[path] = JSON.parse(body)
              json(res, 200, { statusCode: 200 })
            })
            return
          }
        }

        // v2 notifications
        if (url === '/signalk/v2/api/notifications' && req.method === 'GET') {
          return json(res, 200, notificationsStore)
        }

        if (url.match(/^\/signalk\/v2\/api\/notifications\/[^/]+\/acknowledge$/) && req.method === 'POST') {
          const id = url.split('/')[5]
          const n = notificationsStore[id] as Record<string, unknown> | undefined
          if (n) {
            (n.status as Record<string, unknown>).acknowledged = true
          }
          return json(res, 200, { statusCode: 200 })
        }

        if (url.match(/^\/signalk\/v2\/api\/notifications\/[^/]+\/silence$/) && req.method === 'POST') {
          const id = url.split('/')[5]
          const n = notificationsStore[id] as Record<string, unknown> | undefined
          if (n) {
            (n.status as Record<string, unknown>).silenced = true
          }
          return json(res, 200, { statusCode: 200 })
        }

        if (url.match(/^\/signalk\/v2\/api\/notifications\/[^/]+\/clear$/) && req.method === 'POST') {
          const id = url.split('/')[5]
          delete notificationsStore[id]
          return json(res, 200, { statusCode: 200 })
        }

        // v2 resources — waypoints
        if (url === '/signalk/v2/api/resources/waypoints' && req.method === 'GET') {
          return json(res, 200, waypointsStore)
        }

        if (url.match(/^\/signalk\/v2\/api\/resources\/waypoints\/[^/]+$/) && req.method === 'PUT') {
          const id = url.split('/').pop()!
          readBody(req).then((body) => {
            waypointsStore[id] = JSON.parse(body)
            json(res, 200, { statusCode: 200 })
          })
          return
        }

        if (url.match(/^\/signalk\/v2\/api\/resources\/waypoints\/[^/]+$/) && req.method === 'DELETE') {
          const id = url.split('/').pop()!
          delete waypointsStore[id]
          return json(res, 200, { statusCode: 200 })
        }

        // v2 resources — routes (read-only)
        if (url === '/signalk/v2/api/resources/routes' && req.method === 'GET') {
          return json(res, 200, mockRoutes)
        }

        next()
      })
    },
  }
}
