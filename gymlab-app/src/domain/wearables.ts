// Wearables: interfaces para sincronización con dispositivos (Apple Watch, Garmin, Fitbit).

export type WearableDevice = 'apple_watch' | 'garmin' | 'fitbit' | 'otro'

export interface WearableData {
  device: WearableDevice
  date: string
  heartRateAvg: number | null
  heartRateMax: number | null
  steps: number | null
  sleepHours: number | null
  caloriesBurned: number | null
}

// Dispositivos disponibles (placeholder — se expandirá con HealthKit/Google Fit).
export const WEARABLE_DEVICES: { id: WearableDevice; label: string; available: boolean }[] = [
  { id: 'apple_watch', label: 'Apple Watch', available: false },
  { id: 'garmin', label: 'Garmin', available: false },
  { id: 'fitbit', label: 'Fitbit', available: false },
  { id: 'otro', label: 'Otro', available: false },
]
