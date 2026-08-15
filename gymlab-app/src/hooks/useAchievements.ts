// Hook reactivo de logros: vigila workouts/PRs/series en Dexie y, cuando se
// desbloquea un logro nuevo (sesión completada, PR, racha...), lo persiste en
// meta.unlockedAchievements y lo devuelve para mostrarlo en el modal una vez.
import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { metaRepo, prRepo, workoutRepo, workoutSetRepo } from '@/data/repositories'
import { checkAchievements, type Achievement } from '@/domain/achievements'
import { calcStreak } from '@/domain/streak'
import { localDateOf } from '@/domain/dates'

export const UNLOCKED_ACHIEVEMENTS_KEY = 'unlockedAchievements'

// Guardar una sesión escribe workouts, series y PRs en una ráfaga de
// mutaciones Dexie; evaluamos tras un debounce para no mostrar el modal con
// una lista parcial ni escribir meta en cada escritura intermedia.
const EVALUATION_DEBOUNCE_MS = 600

export const useAchievements = () => {
  const [unlocked, setUnlocked] = useState<Achievement[]>([])

  // useLiveQuery devuelve undefined hasta la primera lectura; no evaluamos
  // logros hasta que TODAS las consultas (incluida meta) han cargado, para no
  // mostrar el modal antes de conocer los IDs ya desbloqueados.
  const workoutsRaw = useLiveQuery(() => workoutRepo.getAll(), [])
  const prsRaw = useLiveQuery(() => prRepo.getAll(), [])
  const setsRaw = useLiveQuery(() => workoutSetRepo.getAll(), [])
  const savedIdsRaw = useLiveQuery(
    () => metaRepo.getJson<string[]>(UNLOCKED_ACHIEVEMENTS_KEY, []),
    []
  )

  const ready =
    workoutsRaw !== undefined && prsRaw !== undefined && setsRaw !== undefined && savedIdsRaw !== undefined

  const workouts = workoutsRaw ?? []
  const prs = prsRaw ?? []
  const sets = setsRaw ?? []
  const savedIds = savedIdsRaw ?? []

  // Racha histórica más larga, necesaria para los logros de racha.
  const streak = calcStreak(workouts.map(localDateOf))

  // Firma con primitivas (no objetos): el efecto solo corre cuando cambia de
  // verdad algún dato que afecta a los logros, evitando loops de re-render.
  const signature = [
    ready,
    workouts.length,
    prs.length,
    sets.length,
    streak.longestStreak,
    savedIds.length,
    savedIds.join(','),
  ].join('|')

  useEffect(() => {
    if (!ready) return
    const timer = window.setTimeout(() => {
      const earned = checkAchievements(workouts, streak, prs, sets)
      const fresh = earned.filter((a) => !savedIds.includes(a.id))
      if (fresh.length === 0) return
      // Persistir ANTES de mostrar garantiza "solo una vez" aunque se recargue.
      const merged = [...new Set([...savedIds, ...fresh.map((a) => a.id)])]
      void metaRepo.setJson(UNLOCKED_ACHIEVEMENTS_KEY, merged)
      // Acumula en vez de sustituir: si ya hay logros en pantalla, los combina.
      setUnlocked((prev) => [...prev, ...fresh.filter((a) => !prev.some((p) => p.id === a.id))])
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, EVALUATION_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const dismiss = () => setUnlocked([])

  return { achievements: unlocked, dismiss }
}
