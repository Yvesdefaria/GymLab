// Datos corporales derivados del perfil para precargar calculadoras (dominio puro, sin Dexie).
import type { BodyWeightEntry } from './types'

// Peso más reciente por fecha local; tolera filas desordenadas y listas vacías.
export const latestWeightKg = (
  entries: readonly Pick<BodyWeightEntry, 'localDate' | 'weightKg'>[],
): number | null => {
  let latest: Pick<BodyWeightEntry, 'localDate' | 'weightKg'> | null = null
  for (const entry of entries) {
    if (!Number.isFinite(entry.weightKg) || entry.weightKg <= 0) continue
    if (!latest || entry.localDate >= latest.localDate) latest = entry
  }
  return latest ? latest.weightKg : null
}
