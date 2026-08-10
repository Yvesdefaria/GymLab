// Tipos y valores por defecto de la configuración de la app, más utilidades de conversión de unidades (kg/lb).
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

  showLoadSuggestion: boolean
  loadProgressionPct: number

  undoDurationSec: number
  showInstallPrompt: boolean
  homeShowTodayFocus: boolean
  showWeightHint: boolean

  // Disposición del hub «Más»: rejilla de iconos (grip) o lista con descripción (list).
  hubLayout: 'grip' | 'list'
}

// Valores por defecto aplicados la primera vez que se abre la app.
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

  showLoadSuggestion: true,
  loadProgressionPct: 2.5,

  undoDurationSec: 5,
  showInstallPrompt: true,
  homeShowTodayFocus: true,
  showWeightHint: false,

  hubLayout: 'grip',
}

export const SETTINGS_META_KEY = 'settings'

// Convierte un peso interno en kg a la unidad mostrada al usuario.
export const applyUnits = (kg: number, units: Units): number =>
  units === 'lb' ? kg * 2.20462 : kg

export const formatUnits = (units: Units): string => (units === 'lb' ? 'lb' : 'kg')

// Formatea un peso para mostrarlo redondeado a 1 decimal con su unidad.
export const formatWeight = (kg: number, units: Units): string =>
  `${Math.round(applyUnits(kg, units) * 10) / 10} ${formatUnits(units)}`

// Convierte un valor introducido por el usuario (en su unidad) a kg internos.
export const parseWeightToKg = (value: number, units: Units): number =>
  units === 'lb' ? value / 2.20462 : value
