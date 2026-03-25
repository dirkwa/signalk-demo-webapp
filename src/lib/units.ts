export type SpeedUnit = 'kn' | 'mph' | 'm/s' | 'km/h'
export type DepthUnit = 'm' | 'ft' | 'fm'
export type TemperatureUnit = 'C' | 'F' | 'K'

export interface UnitPreferences {
  speed: SpeedUnit
  depth: DepthUnit
  temperature: TemperatureUnit
}

export const DEFAULT_UNITS: UnitPreferences = {
  speed: 'kn',
  depth: 'm',
  temperature: 'C',
}

// Speed: SK stores m/s
export function msToKn(ms: number): number { return ms * 1.94384 }
export function msToMph(ms: number): number { return ms * 2.23694 }
export function msToKmh(ms: number): number { return ms * 3.6 }

export function convertSpeed(ms: number, unit: SpeedUnit): number {
  switch (unit) {
    case 'kn': return msToKn(ms)
    case 'mph': return msToMph(ms)
    case 'km/h': return msToKmh(ms)
    case 'm/s': return ms
  }
}

// Depth: SK stores meters
export function mToFt(m: number): number { return m * 3.28084 }
export function mToFm(m: number): number { return m * 0.546807 }

export function convertDepth(m: number, unit: DepthUnit): number {
  switch (unit) {
    case 'm': return m
    case 'ft': return mToFt(m)
    case 'fm': return mToFm(m)
  }
}

// Temperature: SK stores Kelvin
export function kToC(k: number): number { return k - 273.15 }
export function kToF(k: number): number { return (k - 273.15) * 9 / 5 + 32 }

export function convertTemperature(k: number, unit: TemperatureUnit): number {
  switch (unit) {
    case 'K': return k
    case 'C': return kToC(k)
    case 'F': return kToF(k)
  }
}

export function formatValue(value: number, decimals: number = 1): string {
  return value.toFixed(decimals)
}
