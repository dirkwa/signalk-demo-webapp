import { useState, useEffect } from 'react'
import { useServer } from '../context/ServerContext.tsx'
import { useSkFetch } from '../hooks/useSkFetch.ts'
import { CardShell } from '../components/CardShell.tsx'
import type { CardStatus } from '../components/StatusBadge.tsx'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  const text = { saving: 'Saving...', saved: 'Saved', error: 'Error' }[status]
  const color = status === 'error' ? 'text-red-500' : 'text-gray-400'
  return <span className={`text-xs ${color}`}>{text}</span>
}

export function AppDataCard() {
  const { v1Base, isAuthenticated } = useServer()
  const skFetch = useSkFetch()

  const globalUrl = `${v1Base}/applicationData/global/demo-webapp/1.0.0/sharedNote`
  const userUrl = `${v1Base}/applicationData/user/demo-webapp/1.0.0/privateNote`

  const [globalNote, setGlobalNote] = useState('')
  const [userNote, setUserNote] = useState('')
  const [globalSave, setGlobalSave] = useState<SaveStatus>('idle')
  const [userSave, setUserSave] = useState<SaveStatus>('idle')

  useEffect(() => {
    // GET /signalk/v1/applicationData/global/demo-webapp/1.0.0/sharedNote
    skFetch(globalUrl)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          if (typeof data === 'string') setGlobalNote(data)
        }
      })
      .catch(() => {})
  }, [globalUrl])

  useEffect(() => {
    if (!isAuthenticated) return
    // GET /signalk/v1/applicationData/user/demo-webapp/1.0.0/privateNote
    skFetch(userUrl)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json()
          if (typeof data === 'string') setUserNote(data)
        }
      })
      .catch(() => {})
  }, [userUrl, isAuthenticated])

  async function saveGlobal() {
    setGlobalSave('saving')
    try {
      // POST /signalk/v1/applicationData/global/demo-webapp/1.0.0/sharedNote
      const res = await skFetch(globalUrl, {
        method: 'POST',
        body: JSON.stringify(globalNote),
      })
      setGlobalSave(res.ok ? 'saved' : 'error')
    } catch {
      setGlobalSave('error')
    }
  }

  async function saveUser() {
    setUserSave('saving')
    try {
      // POST /signalk/v1/applicationData/user/demo-webapp/1.0.0/privateNote
      const res = await skFetch(userUrl, {
        method: 'POST',
        body: JSON.stringify(userNote),
      })
      setUserSave(res.ok ? 'saved' : 'error')
    } catch {
      setUserSave('error')
    }
  }

  const status: CardStatus = isAuthenticated ? 'ok' : 'ok'

  return (
    <CardShell
      title="Application Data"
      sourceFile="src/cards/AppDataCard.tsx"
      apiPaths={[
        'GET/POST /signalk/v1/applicationData/global/...',
        'GET/POST /signalk/v1/applicationData/user/...',
      ]}
      status={status}
    >
      <div data-testid="appdata-card" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Global scope</h3>
            <SaveIndicator status={globalSave} />
          </div>
          <code className="block text-xs text-gray-400 break-all">
            {globalUrl.replace(v1Base, '')}
          </code>
          <textarea
            value={globalNote}
            onChange={(e) => setGlobalNote(e.target.value)}
            onBlur={saveGlobal}
            placeholder="Shared note (visible to all users)"
            rows={3}
            className="w-full rounded border border-gray-300 p-2 text-sm"
          />
        </div>

        <div className="relative space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">User scope</h3>
            <SaveIndicator status={userSave} />
          </div>
          <code className="block text-xs text-gray-400 break-all">
            {userUrl.replace(v1Base, '')}
          </code>
          <textarea
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            onBlur={saveUser}
            placeholder="Private note (your user only)"
            rows={3}
            className="w-full rounded border border-gray-300 p-2 text-sm"
            disabled={!isAuthenticated}
          />
          {!isAuthenticated && (
            <div className="absolute inset-0 flex items-center justify-center rounded bg-gray-100/80">
              <span className="text-sm text-gray-500">Login required</span>
            </div>
          )}
        </div>
      </div>
    </CardShell>
  )
}
