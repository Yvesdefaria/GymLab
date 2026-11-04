// Agrupación de volumen por músculo (F137): un primario por ejercicio y sinérgicos con factor.
// No reemplaza a `MuscleGroup` (catálogo, filtros y rutinas): solo decide a qué grupo de
// volumen atribuir cada serie.
import type { Exercise, MuscleGroup, MuscleZone } from './types'
import { inferZones } from './muscleZoneInference'
import { isCompoundExercise } from './exercisePattern'

export const VOLUME_GROUPS = [
  'cuadriceps',
  'isquios',
  'gemelos',
  'gluteo',
  'pecho',
  'espalda',
  'hombro',
  'biceps',
  'triceps',
  'abdomen',
  'trapecios',
  'antebrazo',
] as const

export type VolumeGroup = (typeof VOLUME_GROUPS)[number]

// Conteo fraccional (Pelland et al. 2024/2025): una serie sinérgica vale media directa.
export const SYNERGIST_FACTOR = 0.5

export type VolumeAlertRule = 'always' | 'only-if-trained' | 'never'

export interface VolumeTarget {
  min: number
  max: number
  alert: VolumeAlertRule
}

// Bandas semanales en series DIRECTAS (la tabla del usuario, 2026-11-04).
export const VOLUME_TARGETS: Record<VolumeGroup, VolumeTarget> = {
  cuadriceps: { min: 12, max: 16, alert: 'always' },
  isquios: { min: 12, max: 16, alert: 'always' },
  gemelos: { min: 6, max: 10, alert: 'always' },
  gluteo: { min: 8, max: 12, alert: 'always' },
  pecho: { min: 12, max: 16, alert: 'always' },
  espalda: { min: 14, max: 18, alert: 'always' },
  hombro: { min: 10, max: 14, alert: 'always' },
  biceps: { min: 8, max: 12, alert: 'always' },
  triceps: { min: 8, max: 12, alert: 'always' },
  abdomen: { min: 8, max: 12, alert: 'always' },
  trapecios: { min: 4, max: 8, alert: 'only-if-trained' },
  antebrazo: { min: 0, max: 6, alert: 'never' },
}

export const volumeTarget = (group: VolumeGroup): VolumeTarget => VOLUME_TARGETS[group]

// Zona -> grupo de volumen. `null` = zona sin banda propia (anterior, abductores/aductor).
const ZONE_TO_GROUP: Record<MuscleZone, VolumeGroup | null> = {
  'pecho:superior': 'pecho',
  'pecho:medio': 'pecho',
  'pecho:inferior': 'pecho',
  'espalda:dorsal': 'espalda',
  'espalda:lumbar': 'espalda',
  'espalda:romboides': 'espalda',
  'biceps:larga': 'biceps',
  'biceps:corta': 'biceps',
  'biceps:braquial': 'biceps',
  'triceps:larga': 'triceps',
  'triceps:lateral': 'triceps',
  'triceps:medial': 'triceps',
  'hombro:anterior': null,
  'hombro:lateral': 'hombro',
  'hombro:posterior': 'hombro',
  'pierna:cuadriceps': 'cuadriceps',
  'pierna:femoral': 'isquios',
  'pierna:gemelo': 'gemelos',
  'pierna:abductor': null,
  'pierna:aductor': null,
  'gluteo:mayor': 'gluteo',
  'gluteo:medio': 'gluteo',
  'abdomen:superior': 'abdomen',
  'abdomen:inferior': 'abdomen',
  'abdomen:oblicuos': 'abdomen',
  'trapecios:superior': 'trapecios',
  'trapecios:medio': 'trapecios',
  'trapecios:inferior': 'trapecios',
  'antebrazo:flexor': 'antebrazo',
  'antebrazo:extensor': 'antebrazo',
}

// El catálogo clasifica el peso muerto como espalda; para volumen es un hinge de isquios.
// Press militar y elevación frontal son hombro anterior: sin banda (excluidos, no «sin datos»).
// La patada de glúteo suele venir catalogada como pierna.
const PRIMARY_OVERRIDES: { re: RegExp; group: VolumeGroup | null }[] = [
  { re: /\b(press militar|press de hombros?|overhead press|shoulder press|arnold press|elevaci[oó]n frontal)\b/i, group: null },
  { re: /\b(peso muerto|deadlift)\b/i, group: 'isquios' },
  { re: /\b(patada de gl[uú]teo|hip thrust|puente)\b/i, group: 'gluteo' },
]

// Grupos que se mapean 1:1. `pierna` sin zona queda sin datos: no se puede saber
// cuádriceps vs isquios. `hombro` sin zona cae a hombro (los presses ya están overrideados).
const FALLBACK: Record<MuscleGroup, VolumeGroup | null> = {
  pecho: 'pecho',
  espalda: 'espalda',
  biceps: 'biceps',
  triceps: 'triceps',
  hombro: 'hombro',
  pierna: null,
  gluteo: 'gluteo',
  abdomen: 'abdomen',
  trapecios: 'trapecios',
  antebrazo: 'antebrazo',
}

export type VolumeExercise = Pick<Exercise, 'muscleGroup' | 'name'> &
  Partial<Pick<Exercise, 'slug' | 'externalId' | 'muscleZones'>>

// Tres estados: atribuido a una banda, excluido por diseño (sin banda) o sin datos.
export type VolumeAttribution =
  | { kind: 'group'; group: VolumeGroup }
  | { kind: 'excluded' }
  | { kind: 'unknown' }

const haystackOf = (ex: VolumeExercise): string =>
  `${ex.name} ${ex.slug ?? ''} ${ex.externalId ?? ''}`.toLowerCase()

export const attributeVolume = (ex: VolumeExercise): VolumeAttribution => {
  const haystack = haystackOf(ex)
  for (const rule of PRIMARY_OVERRIDES) {
    if (!rule.re.test(haystack)) continue
    return rule.group ? { kind: 'group', group: rule.group } : { kind: 'excluded' }
  }
  // Zonas inferidas cuando el ejercicio no trae zonas cargadas (seed base).
  const zones = ex.muscleZones?.length
    ? ex.muscleZones
    : inferZones({
        name: ex.name,
        slug: ex.slug ?? '',
        externalId: ex.externalId,
        muscleGroup: ex.muscleGroup,
      })
  for (const zone of zones) {
    const group = ZONE_TO_GROUP[zone]
    if (group) return { kind: 'group', group }
  }
  // Zonas conocidas pero sin banda (anterior, abductores/aductor): exclusión de diseño.
  if (zones.length > 0) return { kind: 'excluded' }
  const fallback = FALLBACK[ex.muscleGroup]
  return fallback ? { kind: 'group', group: fallback } : { kind: 'unknown' }
}

// Compatibilidad: el grupo primario o `null` (excluido o sin datos).
export const volumeGroupOf = (ex: VolumeExercise): VolumeGroup | null => {
  const attribution = attributeVolume(ex)
  return attribution.kind === 'group' ? attribution.group : null
}

export interface Synergist {
  group: VolumeGroup
  factor: number
}

// Sinérgicos de un compuesto. Los aislamientos no reparten volumen.
// Peso muerto: el convencional suma cuádriceps y antebrazo; el rumano no.
export const synergistsOf = (ex: VolumeExercise): Synergist[] => {
  if (!isCompoundExercise(ex.muscleGroup, ex.name)) return []
  const primary = volumeGroupOf(ex)
  const haystack = haystackOf(ex)
  const groups = new Set<VolumeGroup>()
  const add = (candidates: readonly VolumeGroup[]) => {
    for (const group of candidates) {
      if (group !== primary) groups.add(group)
    }
  }

  if (/\b(peso muerto|deadlift)\b/i.test(haystack)) {
    add(
      /\b(rumano|romanian|rdl)\b/i.test(haystack)
        ? ['gluteo', 'espalda']
        : ['gluteo', 'espalda', 'cuadriceps', 'antebrazo'],
    )
  } else {
    if (/\b(banca|bench|pecho|chest|fondos|dip|flexion)/i.test(haystack)) add(['triceps'])
    if (/\b(remo|row|jal[oó]n|pulldown|dominada|pull.?up|chin.?up)/i.test(haystack)) add(['biceps'])
    if (/\b(sentadilla|squat|prensa|leg.?press|hack|zancada|lunge|b[uú]lgara)/i.test(haystack)) add(['gluteo'])
    if (/\b(press militar|press de hombros?|overhead press|shoulder press)\b/i.test(haystack)) add(['triceps'])
  }

  return [...groups].map((group) => ({ group, factor: SYNERGIST_FACTOR }))
}
