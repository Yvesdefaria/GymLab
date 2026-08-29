// "Seguir esta rutina": selector de días de la semana + guardado del programa activo.
// Autocontenido: estado weekdays (con precarga), toggle y persistencia en activeProgramRepo.
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BookmarkPlus, Check } from 'lucide-react'
import { activeProgramRepo } from '@/data/repositories'
import { toLocalDateStr } from '@/domain/dates'
import type { Routine } from '@/domain/types'

// Días de la semana con su inicial (v: valor JS Date.getDay(), k: clave i18n de la etiqueta corta).
const WEEKDAY_OPTS = [
  { v: 1, k: 'rutinas.detalle.dia.lunes' },
  { v: 2, k: 'rutinas.detalle.dia.martes' },
  { v: 3, k: 'rutinas.detalle.dia.miercoles' },
  { v: 4, k: 'rutinas.detalle.dia.jueves' },
  { v: 5, k: 'rutinas.detalle.dia.viernes' },
  { v: 6, k: 'rutinas.detalle.dia.sabado' },
  { v: 0, k: 'rutinas.detalle.dia.domingo' },
] as const

// Días por defecto sugeridos según cuántos entrenos a la semana tenga la rutina.
const DEFAULT_WEEKDAYS: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 0],
}

interface RoutineFollowCardProps {
  routine: Routine
  isActiveRoutine: boolean
  // Días del programa activo si esta rutina ya se sigue (para precargarlos en el selector).
  initialWeekdays: number[]
}

export const RoutineFollowCard = ({ routine, isActiveRoutine, initialWeekdays }: RoutineFollowCardProps) => {
  const { t } = useTranslation()
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5])
  const [following, setFollowing] = useState(false)

  // Precarga los días: los del programa activo si coincide, si no los sugeridos.
  const prefilled = useRef(false)
  useEffect(() => {
    if (prefilled.current) return
    prefilled.current = true
    setWeekdays(
      initialWeekdays.length > 0 ? [...initialWeekdays] : (DEFAULT_WEEKDAYS[routine.daysCount] ?? [1])
    )
  }, [initialWeekdays, routine.daysCount])

  // Marca/desmarca un día de la semana manteniendo el orden ascendente.
  const toggleWd = (v: number) => {
    setWeekdays((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v].sort((a, b) => a - b)
    )
  }

  // Activa/actualiza el programa: requiere elegir tantos días como sesiones semanales.
  const handleFollow = async () => {
    if (weekdays.length < routine.daysCount) return
    setFollowing(true)
    await activeProgramRepo.set({
      routineId: routine.id,
      startDate: toLocalDateStr(),
      weekdays,
      createdAt: new Date().toISOString(),
    })
    setFollowing(false)
  }

  return (
    <div className="panel-light rounded-2xl p-4">
      <p className="mb-2 kicker">{t('rutinas.detalle.seguirProgramaDias')}</p>
      <div className="flex flex-wrap gap-2">
        {WEEKDAY_OPTS.map((w) => (
          <button
            key={w.v}
            type="button"
            onClick={() => toggleWd(w.v)}
            aria-pressed={weekdays.includes(w.v)}
            className={`flex size-11 items-center justify-center rounded-xl border text-sm font-medium ${
              weekdays.includes(w.v)
                ? 'border-cta bg-cta/20 text-accent-soft'
                : 'border-border text-muted'
            }`}
          >
            {t(w.k)}
          </button>
        ))}
      </div>
      {weekdays.length < routine.daysCount && (
        <p role="status" className="mt-2 text-xs text-muted">
          {t('rutinas.detalle.seleccionaDias', { count: routine.daysCount })}
        </p>
      )}
      <button
        type="button"
        onClick={handleFollow}
        disabled={following || weekdays.length < routine.daysCount}
        className={`mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-sm disabled:opacity-50 ${
          isActiveRoutine
            ? 'border border-cta bg-cta/20 text-accent-soft'
            : 'border border-gold/50 text-accent-soft'
        }`}
      >
        {isActiveRoutine ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <BookmarkPlus className="size-4" aria-hidden />
        )}
        {following
          ? t('rutinas.guardando')
          : isActiveRoutine
            ? t('rutinas.detalle.activaActualizarDias')
            : t('rutinas.detalle.seguirRutina')}
      </button>
    </div>
  )
}