import { useContext } from 'react'
import { UnitPrefsContext, type UnitPrefsContextValue } from '../context/unitPrefsContext.ts'

export function useUnitPrefs(): UnitPrefsContextValue {
  const ctx = useContext(UnitPrefsContext)
  if (!ctx) throw new Error('useUnitPrefs must be used within UnitPrefsProvider')
  return ctx
}
