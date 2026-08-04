export type Units = 'kg' | 'lb'

export type PreloadWeightMode = 'exact' | 'plus_kg' | 'plus_pct'

export interface AppSettings {
  units: Units

  preloadLast: boolean
  preloadSetCount: number
  preloadWeightMode: PreloadWeightMode
  preloadWeightValue: number

  autoStartRest: boolean
  restSound: boolean
  restVibrate: boolean
  keepScreenAwake: boolean
  confirmLeaveSession: boolean

  showRpe: boolean
  showRir: boolean
  warmupSets: boolean
  warmupPercents: number[]

  undoDurationSec: number
  showInstallPrompt: boolean
  homeShowTodayFocus: boolean
  showWeightHint: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  units: 'kg',

  preloadLast: true,
  preloadSetCount: 0,
  preloadWeightMode: 'exact',
  preloadWeightValue: 0,

  autoStartRest: true,
  restSound: true,
  restVibrate: false,
  keepScreenAwake: false,
  confirmLeaveSession: true,

  showRpe: false,
  showRir: false,
  warmupSets: false,
  warmupPercents: [50, 70, 90],

  undoDurationSec: 5,
  showInstallPrompt: true,
  homeShowTodayFocus: true,
  showWeightHint: false,
}

export const SETTINGS_META_KEY = 'settings'

export const applyUnits = (kg: number, units: Units): number =>
  units === 'lb' ? kg * 2.20462 : kg

export const formatUnits = (units: Units): string => (units === 'lb' ? 'lb' : 'kg')

export const formatWeight = (kg: number, units: Units): string =>
  `${Math.round(applyUnits(kg, units) * 10) / 10} ${formatUnits(units)}`

export const parseWeightToKg = (value: number, units: Units): number =>
  units === 'lb' ? value / 2.20462 : value
