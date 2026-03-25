import { useUnitPrefs } from '../context/UnitPrefsContext.tsx'
import { CardShell } from '../components/CardShell.tsx'
import type { SpeedUnit, DepthUnit, TemperatureUnit } from '../lib/units.ts'

const SPEED_OPTIONS: SpeedUnit[] = ['kn', 'mph', 'm/s', 'km/h']
const DEPTH_OPTIONS: DepthUnit[] = ['m', 'ft', 'fm']
const TEMP_OPTIONS: TemperatureUnit[] = ['C', 'F', 'K']

export function UnitPrefsCard() {
  const { units, setSpeed, setDepth, setTemperature, saving } = useUnitPrefs()

  return (
    <CardShell
      title="Unit Preferences"
      sourceFile="src/cards/UnitPrefsCard.tsx"
      apiPaths={[
        'GET /signalk/v1/applicationData/global/demo-webapp/1.0.0/units',
        'POST /signalk/v1/applicationData/global/demo-webapp/1.0.0/units',
      ]}
      status="ok"
    >
      <div data-testid="unitprefs-card" className="space-y-3">
        <div className="space-y-2">
          <label className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Speed</span>
            <select
              value={units.speed}
              onChange={(e) => setSpeed(e.target.value as SpeedUnit)}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {SPEED_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>

          <label className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Depth</span>
            <select
              value={units.depth}
              onChange={(e) => setDepth(e.target.value as DepthUnit)}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {DEPTH_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>

          <label className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Temperature</span>
            <select
              value={units.temperature}
              onChange={(e) => setTemperature(e.target.value as TemperatureUnit)}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {TEMP_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
        </div>

        {saving && <p className="text-xs text-gray-400">Saving...</p>}
      </div>
    </CardShell>
  )
}
