import { useState, useEffect, useRef, useCallback } from 'react'
import { useServer } from '../hooks/useServer.ts'
import { useSkFetch } from '../hooks/useSkFetch.ts'
import { CardShell } from '../components/CardShell.tsx'

interface JwtPayload {
  sub?: string
  exp?: number
  iat?: number
  roles?: string[]
  id?: string
}

interface LoginStatus {
  status: 'loggedIn' | 'notLoggedIn'
  readOnlyAccess: boolean
  authenticationRequired: boolean
  allowNewUserRegistration: boolean
  allowDeviceAccessRequests: boolean
  userLevel?: string
  username?: string
  noUsers?: boolean
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

function formatTimestamp(epoch: number): string {
  return new Date(epoch * 1000).toLocaleString()
}

export function AuthCard() {
  const { baseUrl, v1Base, setToken, isAuthenticated } = useServer()
  const skFetch = useSkFetch()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<unknown>(null)
  const [decoded, setDecoded] = useState<JwtPayload | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [loginStatus, setLoginStatus] = useState<LoginStatus | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const checkLoginStatus = useCallback(async () => {
    try {
      // GET /skServer/loginStatus — check if browser already has a session
      // Response: { status: "loggedIn"|"notLoggedIn", readOnlyAccess, authenticationRequired,
      //             userLevel, username, allowNewUserRegistration, allowDeviceAccessRequests }
      const res = await skFetch(`${baseUrl}/skServer/loginStatus`)
      if (res.ok) {
        const data = await res.json() as LoginStatus
        setLoginStatus(data)
      }
    } catch {
      // server might not have this endpoint
    }
  }, [baseUrl, skFetch])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- check session on mount
    checkLoginStatus()
  }, [checkLoginStatus])

  useEffect(() => {
    clearInterval(timerRef.current)
    if (!decoded?.exp) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting countdown
      setSecondsLeft(null)
      return
    }
    function tick() {
      setSecondsLeft(Math.max(0, Math.floor(decoded!.exp! - Date.now() / 1000)))
    }
    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => clearInterval(timerRef.current)
  }, [decoded])

  async function handleLogin() {
    setError(null)
    try {
      // POST /signalk/v1/auth/login
      // Body: { "username": "admin", "password": "xxx" }
      // Response: { "token": "eyJ...", "timeToLive": 86400000 }
      const res = await skFetch(`${v1Base}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })

      const data: unknown = await res.json()
      setResponse(data)

      if (res.status === 401) {
        setError('Invalid credentials')
        return
      }
      if (res.status === 403) {
        setError('Account disabled or no permission')
        return
      }
      if (!res.ok) {
        setError(`HTTP ${res.status}`)
        return
      }

      const body = data as { token: string; timeToLive?: number }
      setToken(body.token)
      setDecoded(decodeJwt(body.token))
      checkLoginStatus()
    } catch {
      setError('Server unreachable')
    }
  }

  async function handleLogout() {
    try {
      // PUT /signalk/v1/auth/logout
      // Response: "Logout OK"
      await skFetch(`${v1Base}/auth/logout`, { method: 'PUT' })
    } catch {
      // logout best-effort
    }
    setToken(null)
    setDecoded(null)
    setResponse(null)
    setError(null)
    checkLoginStatus()
  }

  return (
    <CardShell
      title="Authentication"
      sourceFile="src/cards/AuthCard.tsx"
      apiPaths={[
        'GET /skServer/loginStatus',
        'POST /signalk/v1/auth/login',
        'PUT /signalk/v1/auth/logout',
      ]}
      status="ok"
    >
      <div data-testid="auth-card" className="space-y-3">
        {loginStatus && (
          <div className="rounded bg-gray-50 p-2 text-sm">
            <p className="mb-1 text-xs font-medium text-gray-500">
              GET /skServer/loginStatus
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
              <dt className="text-gray-500">Session</dt>
              <dd className={loginStatus.status === 'loggedIn' ? 'text-green-600' : 'text-gray-600'}>
                {loginStatus.status}
              </dd>

              {loginStatus.username && (
                <>
                  <dt className="text-gray-500">User</dt>
                  <dd className="text-gray-900">{loginStatus.username}</dd>
                </>
              )}

              {loginStatus.userLevel && (
                <>
                  <dt className="text-gray-500">Level</dt>
                  <dd className="text-gray-900">{loginStatus.userLevel}</dd>
                </>
              )}

              <dt className="text-gray-500">Auth required</dt>
              <dd className="text-gray-600">{loginStatus.authenticationRequired ? 'yes' : 'no'}</dd>

              <dt className="text-gray-500">Read-only access</dt>
              <dd className="text-gray-600">{loginStatus.readOnlyAccess ? 'yes' : 'no'}</dd>
            </dl>
          </div>
        )}

        {!isAuthenticated ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <button
              onClick={handleLogin}
              className="w-full rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              Login
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {decoded && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-gray-500">User</dt>
                <dd className="text-gray-900">{decoded.id ?? decoded.sub ?? '—'}</dd>

                <dt className="text-gray-500">Issued</dt>
                <dd className="text-gray-900">
                  {decoded.iat ? formatTimestamp(decoded.iat) : '—'}
                </dd>

                <dt className="text-gray-500">Expires</dt>
                <dd className="text-gray-900">
                  {decoded.exp ? formatTimestamp(decoded.exp) : '—'}
                </dd>

                {secondsLeft !== null && (
                  <>
                    <dt className="text-gray-500">TTL</dt>
                    <dd className="text-gray-900 font-mono">
                      {Math.floor(secondsLeft / 3600)}h {Math.floor((secondsLeft % 3600) / 60)}m {secondsLeft % 60}s
                    </dd>
                  </>
                )}

                {decoded.roles && (
                  <>
                    <dt className="text-gray-500">Roles</dt>
                    <dd className="text-gray-900">{decoded.roles.join(', ')}</dd>
                  </>
                )}
              </dl>
            )}

            <button
              onClick={handleLogout}
              className="w-full rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {response !== null && (
          <div>
            <p className="mb-1 text-xs text-gray-500">Login response:</p>
            <pre className="max-h-48 overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </CardShell>
  )
}
