import { useState, useEffect } from 'react'
import { useServer } from '../context/ServerContext.tsx'
import { useSkFetch } from '../hooks/useSkFetch.ts'
import { CardShell } from '../components/CardShell.tsx'
import { RawJson } from '../components/RawJson.tsx'
import type { CardStatus } from '../components/StatusBadge.tsx'

interface GeoJsonPoint {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: { name?: string; description?: string }
}

interface GeoJsonRoute {
  type: 'Feature'
  geometry: { type: 'LineString'; coordinates: [number, number][] }
  properties: { name?: string; description?: string }
}

export function ResourcesCard() {
  const { v2Base, hasV2, isAuthenticated } = useServer()
  const skFetch = useSkFetch()

  const [waypoints, setWaypoints] = useState<Record<string, GeoJsonPoint>>({})
  const [routes, setRoutes] = useState<Record<string, GeoJsonRoute>>({})
  const [wpName, setWpName] = useState('')
  const [wpLat, setWpLat] = useState('')
  const [wpLon, setWpLon] = useState('')
  const [wpDesc, setWpDesc] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<unknown>(null)

  async function loadWaypoints() {
    try {
      // GET /signalk/v2/api/resources/waypoints
      const res = await skFetch(`${v2Base}/resources/waypoints`)
      if (res.ok) {
        const data = await res.json() as Record<string, GeoJsonPoint>
        setWaypoints(data)
        setRawData(data)
      }
    } catch {
      setError('Failed to load waypoints')
    }
  }

  async function loadRoutes() {
    try {
      // GET /signalk/v2/api/resources/routes
      const res = await skFetch(`${v2Base}/resources/routes`)
      if (res.ok) {
        const data = await res.json() as Record<string, GeoJsonRoute>
        setRoutes(data)
      }
    } catch {
      setError('Failed to load routes')
    }
  }

  useEffect(() => {
    if (!hasV2) return
    loadWaypoints()
    loadRoutes()
  }, [hasV2])

  async function addWaypoint() {
    const lat = parseFloat(wpLat)
    const lon = parseFloat(wpLon)
    if (!wpName || isNaN(lat) || isNaN(lon)) return

    const uuid = crypto.randomUUID()
    const feature: GeoJsonPoint = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: { name: wpName, description: wpDesc || undefined },
    }

    // PUT /signalk/v2/api/resources/waypoints/{uuid}
    // Body: GeoJSON Feature with Point geometry
    await skFetch(`${v2Base}/resources/waypoints/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(feature),
    })

    setWpName('')
    setWpLat('')
    setWpLon('')
    setWpDesc('')
    loadWaypoints()
  }

  async function deleteWaypoint(uuid: string) {
    // DELETE /signalk/v2/api/resources/waypoints/{uuid}
    await skFetch(`${v2Base}/resources/waypoints/${uuid}`, { method: 'DELETE' })
    loadWaypoints()
  }

  const cardStatus: CardStatus = !hasV2
    ? 'unavailable'
    : error
      ? 'error'
      : 'ok'

  return (
    <CardShell
      title="Resources"
      sourceFile="src/cards/ResourcesCard.tsx"
      apiPaths={[
        'GET/PUT/DELETE /signalk/v2/api/resources/waypoints',
        'GET /signalk/v2/api/resources/routes',
      ]}
      status={cardStatus}
    >
      <div data-testid="resources-card" className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700">Waypoints</h3>

          {Object.keys(waypoints).length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-1">Name</th>
                  <th className="pb-1">Lat</th>
                  <th className="pb-1">Lon</th>
                  <th className="pb-1"></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(waypoints).map(([uuid, wp]) => (
                  <tr key={uuid} className="border-b border-gray-100">
                    <td className="py-1 text-gray-700">{wp.properties?.name ?? '—'}</td>
                    <td className="py-1 font-mono text-gray-600">{wp.geometry.coordinates[1]?.toFixed(5)}</td>
                    <td className="py-1 font-mono text-gray-600">{wp.geometry.coordinates[0]?.toFixed(5)}</td>
                    <td className="py-1">
                      <button
                        onClick={() => deleteWaypoint(uuid)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-gray-400">No waypoints</p>
          )}

          {isAuthenticated && (
            <div className="mt-2 flex flex-wrap gap-1">
              <input
                type="text"
                placeholder="Name"
                value={wpName}
                onChange={(e) => setWpName(e.target.value)}
                className="w-24 rounded border border-gray-300 px-1.5 py-1 text-xs"
              />
              <input
                type="text"
                placeholder="Lat"
                value={wpLat}
                onChange={(e) => setWpLat(e.target.value)}
                className="w-20 rounded border border-gray-300 px-1.5 py-1 text-xs"
              />
              <input
                type="text"
                placeholder="Lon"
                value={wpLon}
                onChange={(e) => setWpLon(e.target.value)}
                className="w-20 rounded border border-gray-300 px-1.5 py-1 text-xs"
              />
              <input
                type="text"
                placeholder="Description"
                value={wpDesc}
                onChange={(e) => setWpDesc(e.target.value)}
                className="w-28 rounded border border-gray-300 px-1.5 py-1 text-xs"
              />
              <button
                onClick={addWaypoint}
                className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700">Routes (read-only)</h3>
          {Object.keys(routes).length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-1">Name</th>
                  <th className="pb-1">Points</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(routes).map(([id, route]) => (
                  <tr key={id} className="border-b border-gray-100">
                    <td className="py-1 text-gray-700">{route.properties?.name ?? '—'}</td>
                    <td className="py-1 font-mono text-gray-600">{route.geometry.coordinates.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-gray-400">No routes</p>
          )}
        </div>

        <RawJson data={rawData} />
      </div>
    </CardShell>
  )
}
