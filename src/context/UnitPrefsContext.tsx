import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { useServer } from '../hooks/useServer.ts'
import { useSkFetch } from '../hooks/useSkFetch.ts'
import { UnitPrefsContext } from './unitPrefsContext.ts'
import { DEFAULT_UNITS, type UnitPreferences, type SpeedUnit, type DepthUnit, type TemperatureUnit } from '../lib/units.ts'
import { debug } from '../lib/debug.ts'

const APP_DATA_PATH = 'global/demo-webapp/1.0.0/units'

export function UnitPrefsProvider({ children }: { children: ReactNode }) {
  const { v1Base } = useServer()
  const skFetch = useSkFetch()
  const [units, setUnits] = useState<UnitPreferences>(DEFAULT_UNITS)
  const [saving, setSaving] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const url = `${v1Base}/applicationData/${APP_DATA_PATH}`

  useEffect(() => {
    // GET /signalk/v1/applicationData/global/demo-webapp/1.0.0/units
    skFetch(url)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json() as Partial<UnitPreferences>
          if (data.speed || data.depth || data.temperature) {
            setUnits({ ...DEFAULT_UNITS, ...data })
          }
        }
      })
      .catch(() => {
        debug('failed to load unit preferences')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  const persistUnits = useCallback((newUnits: UnitPreferences) => {
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setSaving(true)
      // POST /signalk/v1/applicationData/global/demo-webapp/1.0.0/units
      skFetch(url, {
        method: 'POST',
        body: JSON.stringify(newUnits),
      })
        .then(() => debug('unit preferences saved'))
        .catch(() => debug('failed to save unit preferences'))
        .finally(() => setSaving(false))
    }, 500)
  }, [url, skFetch])

  const setSpeed = useCallback((speed: SpeedUnit) => {
    setUnits((prev) => {
      const next = { ...prev, speed }
      persistUnits(next)
      return next
    })
  }, [persistUnits])

  const setDepth = useCallback((depth: DepthUnit) => {
    setUnits((prev) => {
      const next = { ...prev, depth }
      persistUnits(next)
      return next
    })
  }, [persistUnits])

  const setTemperature = useCallback((temperature: TemperatureUnit) => {
    setUnits((prev) => {
      const next = { ...prev, temperature }
      persistUnits(next)
      return next
    })
  }, [persistUnits])

  const value = useMemo(() => ({
    units,
    setSpeed,
    setDepth,
    setTemperature,
    saving,
  }), [units, setSpeed, setDepth, setTemperature, saving])

  return (
    <UnitPrefsContext value={value}>
      {children}
    </UnitPrefsContext>
  )
}
