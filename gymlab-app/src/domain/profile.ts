// Reglas de composición del perfil: qué secciones existen con los datos actuales,
// la primera sesión registrada, la próxima insignia de racha y los días activos
// de la tira de 30 días. Todo puro para poder testearlo sin Dexie ni React.
import { localDateOf } from './dates'
import { buildThirtyDayGrid, nextStreakBadge } from './streak'

export type ProfileSections = {
  hero: boolean
  stats: boolean
  prs: boolean
  history: boolean
  chapas: boolean
}

// El héroe, la fila de stats y el historial solo existen si hay al menos un entreno.
// Marcas y chapas se ocultan por separado cuando están vacías.
export const profileSections = (input: {
  workoutsCount: number
  prsCount: number
  chapasCount: number
}): ProfileSections => ({
  hero: input.workoutsCount > 0,
  stats: input.workoutsCount > 0,
  prs: input.prsCount > 0,
  history: input.workoutsCount > 0,
  chapas: input.chapasCount > 0,
})

type WorkoutDate = { localDate?: string; startedAt: string }

// Fecha local del entreno más antiguo; null si todavía no hay sesiones.
export const firstWorkoutDate = (workouts: readonly WorkoutDate[]): string | null => {
  let first: string | null = null
  for (const workout of workouts) {
    const date = localDateOf(workout)
    if (first === null || date < first) first = date
  }
  return first
}

export type StreakBadge = {
  key: 'perfil.insignia4' | 'perfil.insignia8' | 'perfil.insignia16'
  remaining: number
}

// Próxima insignia de racha (4, 8 o 16 semanas) con las semanas que faltan.
export const streakBadge = (currentStreak: number): StreakBadge | null => {
  const next = nextStreakBadge(currentStreak)
  if (!next) return null
  const key =
    next.target === 16
      ? 'perfil.insignia16'
      : next.target === 8
        ? 'perfil.insignia8'
        : 'perfil.insignia4'
  return { key, remaining: next.remaining }
}

// Días entrenados dentro de la ventana de 30 días que termina hoy.
export const countActiveDays = (
  trained: readonly string[] | ReadonlySet<string>,
  today?: string,
): number => {
  const dates = trained instanceof Set ? trained : [...trained]
  return buildThirtyDayGrid(dates, today).filter((cell) => cell.trained).length
}

export type DeloadStatusKey =
  | 'perfil.deloadEstadoBajo'
  | 'perfil.deloadEstadoMedio'
  | 'perfil.deloadEstadoAlto'

// Estado corto del score de deload para la fila del perfil (mismos umbrales que el copy largo).
export const deloadStatusKey = (score: number): DeloadStatusKey =>
  score >= 60
    ? 'perfil.deloadEstadoAlto'
    : score >= 40
      ? 'perfil.deloadEstadoMedio'
      : 'perfil.deloadEstadoBajo'
