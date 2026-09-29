// Logros del sistema: definición y evaluación de condiciones (dominio puro).
// Los IDs son constantes del código (no input de usuario) y se persisten
// en meta.unlockedAchievements; cada logro solo se muestra una vez.
// La evaluación (checkAchievements) camina el mapa declarativo
// ACHIEVEMENT_PROGRESS (achievementProgress.ts): fuente única de
// current/target/completed, sin literales de condición duplicados.
import { progressForAll, type AchievementStats } from './achievementProgress'

// Rareza de cada logro → metal de la chapa (bronce < plata < oro < platino),
// estilo medalla ingame de BO2. Orden visual creciente por dificultad.
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Achievement {
  id: string
  titleKey: string
  descriptionKey: string
  icon: string
  // Los logros de pasos (F109.1) no tienen texto de condición: su progreso
  // vive en la barra de /logros, así que la clave queda opcional.
  conditionKey?: string
}

// Mapa id → metal de la chapa medalla. Escala por dificultad del objetivo:
// hitos fáciles en bronce, acumulación media en plata, logros largos en oro
// y los más extremos (500 sesiones, 1 año) en platino.
export const ACHIEVEMENT_TIERS: Record<string, AchievementTier> = {
  'primer-paso': 'bronze',
  inaugural: 'bronze',
  'primer-reto': 'bronze',
  'racha-4': 'bronze',
  'primera-marca': 'bronze',
  'primera-cardio': 'bronze',
  'volumen-semanal': 'silver',
  'sesiones-50': 'silver',
  'consistencia-4s': 'silver',
  'pr-10kg': 'silver',
  'ejercicios-100': 'gold',
  'racha-8': 'gold',
  'racha-16': 'gold',
  'guias-completas': 'gold',
  'sesiones-500': 'platinum',
  'primer-ano': 'platinum',
  // Logros de pasos (F109.1): misma escala metal por dificultad.
  'primeros-pasos': 'bronze',
  'diez-mil-dia': 'bronze',
  'racha-7-dias': 'silver',
  'cincuenta-mil-semana': 'silver',
  'racha-30-dias': 'gold',
  'doscientos-mil-mes': 'gold',
  maraton: 'gold',
  'millon-total': 'platinum',
  // Medallas de familias nuevas (F109.2): misma escala metal por dificultad.
  'nutricion-primera': 'bronze',
  'nutricion-semana': 'silver',
  'nutricion-proteina': 'silver',
  'nutricion-30-dias': 'gold',
  'cuerpo-primer-peso': 'bronze',
  'cuerpo-30-pesos': 'silver',
  'cuerpo-10-fotos': 'gold',
  'entreno-5-dias': 'silver',
  'entreno-90min': 'silver',
  'entreno-12-semanas': 'gold',
  'cardio-60min': 'silver',
  'pasos-50km': 'silver',
}

export interface AchievementCountsState {
  counts: Record<string, number>
  snapshot: string[]
}

// Contador «veces conseguido» de las chapas: incrementa +1 cada logro que
// pasa de no estando en el snapshot previo a estarlo en la evaluación actual
// (transición no-cumplido → cumplido). El snapshot se actualiza a earnedIds
// para no inflar el contador en evaluaciones repetidas del mismo estado.
export const nextAchievementCounts = (
  prev: AchievementCountsState,
  earnedIds: string[]
): AchievementCountsState => {
  const counts = { ...prev.counts }
  for (const id of earnedIds) {
    if (!prev.snapshot.includes(id)) {
      counts[id] = (counts[id] ?? 0) + 1
    }
  }
  return { counts, snapshot: [...earnedIds] }
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'primer-paso',
    titleKey: 'achievements.items.primerPaso.title',
    descriptionKey: 'achievements.items.primerPaso.desc',
    icon: 'Footprints',
    conditionKey: 'achievements.items.primerPaso.condition',
  },
  {
    id: 'inaugural',
    titleKey: 'achievements.items.inaugural.title',
    descriptionKey: 'achievements.items.inaugural.desc',
    icon: 'Trophy',
    conditionKey: 'achievements.items.inaugural.condition',
  },
  {
    id: 'primer-reto',
    titleKey: 'achievements.items.primerReto.title',
    descriptionKey: 'achievements.items.primerReto.desc',
    icon: 'Trophy',
    conditionKey: 'achievements.items.primerReto.condition',
  },
  {
    id: 'racha-4',
    titleKey: 'achievements.items.racha4.title',
    descriptionKey: 'achievements.items.racha4.desc',
    icon: 'Flame',
    conditionKey: 'achievements.items.racha4.condition',
  },
  {
    id: 'racha-8',
    titleKey: 'achievements.items.racha8.title',
    descriptionKey: 'achievements.items.racha8.desc',
    icon: 'Crown',
    conditionKey: 'achievements.items.racha8.condition',
  },
  {
    id: 'primera-marca',
    titleKey: 'achievements.items.primeraMarca.title',
    descriptionKey: 'achievements.items.primeraMarca.desc',
    icon: 'Target',
    conditionKey: 'achievements.items.primeraMarca.condition',
  },
  {
    id: 'volumen-semanal',
    titleKey: 'achievements.items.volumenSemanal.title',
    descriptionKey: 'achievements.items.volumenSemanal.desc',
    icon: 'BarChart3',
    conditionKey: 'achievements.items.volumenSemanal.condition',
  },
  {
    id: 'sesiones-50',
    titleKey: 'achievements.items.sesiones50.title',
    descriptionKey: 'achievements.items.sesiones50.desc',
    icon: 'CalendarCheck',
    conditionKey: 'achievements.items.sesiones50.condition',
  },
  {
    id: 'consistencia-4s',
    titleKey: 'achievements.items.constancia4s.title',
    descriptionKey: 'achievements.items.constancia4s.desc',
    icon: 'Repeat',
    conditionKey: 'achievements.items.constancia4s.condition',
  },
  {
    id: 'primera-cardio',
    titleKey: 'achievements.items.primeraCardio.title',
    descriptionKey: 'achievements.items.primeraCardio.desc',
    icon: 'Heart',
    conditionKey: 'achievements.items.primeraCardio.condition',
  },
  {
    id: 'ejercicios-100',
    titleKey: 'achievements.items.ejercicios100.title',
    descriptionKey: 'achievements.items.ejercicios100.desc',
    icon: 'Shuffle',
    conditionKey: 'achievements.items.ejercicios100.condition',
  },
  {
    id: 'racha-16',
    titleKey: 'achievements.items.racha16.title',
    descriptionKey: 'achievements.items.racha16.desc',
    icon: 'Crown',
    conditionKey: 'achievements.items.racha16.condition',
  },
  {
    id: 'pr-10kg',
    titleKey: 'achievements.items.pr10kg.title',
    descriptionKey: 'achievements.items.pr10kg.desc',
    icon: 'TrendingUp',
    conditionKey: 'achievements.items.pr10kg.condition',
  },
  {
    id: 'guias-completas',
    titleKey: 'achievements.items.guiasCompletas.title',
    descriptionKey: 'achievements.items.guiasCompletas.desc',
    icon: 'BookOpen',
    conditionKey: 'achievements.items.guiasCompletas.condition',
  },
  {
    id: 'sesiones-500',
    titleKey: 'achievements.items.sesiones500.title',
    descriptionKey: 'achievements.items.sesiones500.desc',
    icon: 'Medal',
    conditionKey: 'achievements.items.sesiones500.condition',
  },
  {
    id: 'primer-ano',
    titleKey: 'achievements.items.primerAno.title',
    descriptionKey: 'achievements.items.primerAno.desc',
    icon: 'Calendar',
    conditionKey: 'achievements.items.primerAno.condition',
  },
  // Logros de pasos (F109.1): unificados al sistema de medallas — mismos
  // tier, progreso, persistencia y celebración que el resto.
  { id: 'primeros-pasos', titleKey: 'steps.achievements.primerosPasos.name', descriptionKey: 'steps.achievements.primerosPasos.desc', icon: 'Footprints' },
  { id: 'diez-mil-dia', titleKey: 'steps.achievements.diezMilDia.name', descriptionKey: 'steps.achievements.diezMilDia.desc', icon: 'Target' },
  { id: 'racha-7-dias', titleKey: 'steps.achievements.racha7Dias.name', descriptionKey: 'steps.achievements.racha7Dias.desc', icon: 'Flame' },
  { id: 'racha-30-dias', titleKey: 'steps.achievements.racha30Dias.name', descriptionKey: 'steps.achievements.racha30Dias.desc', icon: 'Crown' },
  { id: 'cincuenta-mil-semana', titleKey: 'steps.achievements.cincuentaMilSemana.name', descriptionKey: 'steps.achievements.cincuentaMilSemana.desc', icon: 'TrendingUp' },
  { id: 'doscientos-mil-mes', titleKey: 'steps.achievements.doscientosMilMes.name', descriptionKey: 'steps.achievements.doscientosMilMes.desc', icon: 'CalendarRange' },
  { id: 'millon-total', titleKey: 'steps.achievements.millonTotal.name', descriptionKey: 'steps.achievements.millonTotal.desc', icon: 'Medal' },
  { id: 'maraton', titleKey: 'steps.achievements.maraton.name', descriptionKey: 'steps.achievements.maraton.desc', icon: 'Mountain' },
  // Medallas de familias nuevas (F109.2): nutrición, cuerpo, entreno, cardio y
  // pasos; su progreso vive en la barra de /logros (sin condición textual).
  { id: 'nutricion-primera', titleKey: 'achievements.items.nutricionPrimera.title', descriptionKey: 'achievements.items.nutricionPrimera.desc', icon: 'Utensils' },
  { id: 'nutricion-semana', titleKey: 'achievements.items.nutricionSemana.title', descriptionKey: 'achievements.items.nutricionSemana.desc', icon: 'CalendarDays' },
  { id: 'nutricion-proteina', titleKey: 'achievements.items.nutricionProteina.title', descriptionKey: 'achievements.items.nutricionProteina.desc', icon: 'Beef' },
  { id: 'nutricion-30-dias', titleKey: 'achievements.items.nutricion30Dias.title', descriptionKey: 'achievements.items.nutricion30Dias.desc', icon: 'Salad' },
  { id: 'cuerpo-primer-peso', titleKey: 'achievements.items.cuerpoPrimerPeso.title', descriptionKey: 'achievements.items.cuerpoPrimerPeso.desc', icon: 'Scale' },
  { id: 'cuerpo-30-pesos', titleKey: 'achievements.items.cuerpo30Pesos.title', descriptionKey: 'achievements.items.cuerpo30Pesos.desc', icon: 'CalendarCheck' },
  { id: 'cuerpo-10-fotos', titleKey: 'achievements.items.cuerpo10Fotos.title', descriptionKey: 'achievements.items.cuerpo10Fotos.desc', icon: 'Camera' },
  { id: 'entreno-5-dias', titleKey: 'achievements.items.entreno5Dias.title', descriptionKey: 'achievements.items.entreno5Dias.desc', icon: 'Flame' },
  { id: 'entreno-90min', titleKey: 'achievements.items.entreno90Min.title', descriptionKey: 'achievements.items.entreno90Min.desc', icon: 'Timer' },
  { id: 'entreno-12-semanas', titleKey: 'achievements.items.entreno12Semanas.title', descriptionKey: 'achievements.items.entreno12Semanas.desc', icon: 'Repeat' },
  { id: 'cardio-60min', titleKey: 'achievements.items.cardio60Min.title', descriptionKey: 'achievements.items.cardio60Min.desc', icon: 'HeartPulse' },
  { id: 'pasos-50km', titleKey: 'achievements.items.pasos50Km.title', descriptionKey: 'achievements.items.pasos50Km.desc', icon: 'Route' },
]

// Ids de pasos (F109.1): la UI que agrupa por origen los usa desde acá.
export const STEP_ACHIEVEMENT_IDS = [
  'primeros-pasos',
  'diez-mil-dia',
  'racha-7-dias',
  'racha-30-dias',
  'cincuenta-mil-semana',
  'doscientos-mil-mes',
  'millon-total',
  'maraton',
] as const

// Re-export de las variantes de chapa (F95.1) desde el módulo de dominio de
// logros: la concesión vive en su propio archivo para respetar el cap de
// ~200 líneas, pero el API público se mantiene junto a nextAchievementCounts.
export {
  ACHIEVEMENT_VARIANTS,
  grantedCollectibles,
  latestCollectible,
  latestVariants,
  mergeCollectibles,
  type Collectible,
} from './achievementCollectibles'

const byId = new Map(ACHIEVEMENTS.map((a) => [a.id, a]))

export const getAchievement = (id: string): Achievement | undefined => byId.get(id)

// Devuelve los ids de logros cuyo objetivo ya se cumple con el stats bag
// actual. Camina ACHIEVEMENT_PROGRESS: completed depende solo de
// current/target del mapa (guias-completas queda sin conceder mientras la
// señal de guías completadas sea 0). El orden del resultado es el de
// inserción del mapa (dificultad creciente), estable entre llamadas.
export const checkAchievements = (stats: AchievementStats): string[] =>
  Object.values(progressForAll(stats))
    .filter((p) => p.completed)
    .map((p) => p.id)
