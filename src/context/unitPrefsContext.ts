import { createContext } from 'react'
import type { SpeedUnit, DepthUnit, TemperatureUnit, UnitPreferences } from '../lib/units.ts'

export interface UnitPrefsContextValue {
  units: UnitPreferences
  setSpeed: (unit: SpeedUnit) => void
  setDepth: (unit: DepthUnit) => void
  setTemperature: (unit: TemperatureUnit) => void
  saving: boolean
}

export const UnitPrefsContext = createContext<UnitPrefsContextValue | null>(null)
