// Inferencia heurística de zonas musculares a partir del nombre/slug/externalId.
// Solo asigna zonas dentro del grupo principal del ejercicio para no contaminar
// otros grupos; devuelve [] si no hay suficiente señal. Los ejercicios curados
// llevan zonas manuales y no dependen de esta heurística.
import type { Exercise, MuscleZone } from './types'
import { muscleZonesOfGroup } from './catalog'

// Pares de pistas (regex) -> zona. Escaneadas en orden sobre name+slug+externalId
// en minúsculas. Solo se aceptan zonas del grupo del ejercicio.
const ZONE_RULES: { re: RegExp; zone: MuscleZone }[] = [
  { re: /\b(quad|cuadric|extensi[oó]n de pierna?s?|leg[-_ ]?extension)\b/i, zone: 'pierna:cuadriceps' },
  { re: /\b(hamstring|femoral|leg curl|isquio|isquiotibial|curl de femoral|curl femoral|good morning|rumano|romaniano)\b/i, zone: 'pierna:femoral' },
  { re: /\b(calf|gemelo|gemelos|talon|talo[oó]n)\b/i, zone: 'pierna:gemelo' },
  { re: /\b(abductor|abduccion)\b/i, zone: 'pierna:abductor' },
  { re: /\b(adductor|aductor|aduccion)\b/i, zone: 'pierna:aductor' },
  { re: /\b(incline|inclinado)\b/i, zone: 'pecho:superior' },
  { re: /\b(decline|declinado)\b/i, zone: 'pecho:inferior' },
  { re: /\b(pullover|pull over|apertura)\b/i, zone: 'pecho:medio' },
  { re: /\b(glute|hip thrust|puente|bridge|cadera)\b/i, zone: 'gluteo:mayor' },
  { re: /\b(dorsal|lat pulldown|jal[oó]n|pull down|dominada|chin.?up|remo)\b/i, zone: 'espalda:dorsal' },
]

export const inferZones = (
  ex: Pick<Exercise, 'name' | 'slug' | 'externalId' | 'muscleGroup'>
): MuscleZone[] => {
  const haystack = `${ex.name} ${ex.slug} ${ex.externalId ?? ''}`.toLowerCase()
  const valid = new Set<MuscleZone>(muscleZonesOfGroup(ex.muscleGroup))
  const found = new Set<MuscleZone>()
  for (const { re, zone } of ZONE_RULES) {
    if (!valid.has(zone)) continue
    if (re.test(haystack)) found.add(zone)
  }
  // Orden canónico por definición del grupo.
  const order = muscleZonesOfGroup(ex.muscleGroup)
  return order.filter((z) => found.has(z))
}
