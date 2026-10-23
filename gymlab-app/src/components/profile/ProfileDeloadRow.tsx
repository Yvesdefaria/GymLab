// Fila de recuperación: switch de deload + score combinado en una sola línea.
// Sin las barras de señales de la tarjeta vieja; el detalle queda en el InfoTip.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InfoTip } from '@/components/ui/InfoTip'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useLiveList } from '@/hooks/useLiveList'
import { activeProgramRepo, workoutSetRepo } from '@/data/repositories'
import { calcDeloadScore, DELOAD_REDUCTION_PCT, deloadUntilDate, isDeloadActive } from '@/domain/deload'
import { addLocalDays, localDateOf, toLocalDateStr } from '@/domain/dates'
import { deloadStatusKey } from '@/domain/profile'
import { ProfileSection } from '@/components/profile/ProfileSection'
import type { Workout } from '@/domain/types'

export const ProfileDeloadRow = ({ workouts }: { workouts: Workout[] }) => {
  const { t } = useTranslation()
  const { program } = useActiveProgram()
  // El score solo mira series de los últimos 16 días; no hace falta clonar la tabla entera.
  const recentIds = useMemo(() => {
    const cutoff = addLocalDays(toLocalDateStr(), -16)
    return workouts.filter((workout) => localDateOf(workout) > cutoff).map((workout) => workout.id)
  }, [workouts])
  const sets = useLiveList(() => workoutSetRepo.getByWorkoutIds(recentIds), [recentIds])
  const [busy, setBusy] = useState(false)

  const score = useMemo(
    () => (program ? calcDeloadScore(workouts, sets, program) : null),
    [workouts, sets, program],
  )
  const deloadActive = program ? isDeloadActive(program.deloadActive, program.deloadUntil) : false

  const handleToggle = async () => {
    if (!program) return
    setBusy(true)
    try {
      await activeProgramRepo.setDeload(!deloadActive, !deloadActive ? deloadUntilDate() : null)
    } finally {
      setBusy(false)
    }
  }

  // Sin entrenos o sin programa no hay señal que mostrar; el empty state ya cubre el resto.
  if (workouts.length === 0 || !program || !score) return null

  return (
    <ProfileSection title={t('perfil.recuperacion')}>
      <div className="flex min-h-11 items-center justify-between gap-3 py-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="min-w-0">
            <p className="truncate text-sm text-fg">{t('home.semanaDeDeload')}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted">
              {t('perfil.deloadLinea', {
                score: score.overall,
                estado: t(deloadStatusKey(score.overall)),
              })}
            </p>
          </div>
          <InfoTip id="deload" values={{ pct: DELOAD_REDUCTION_PCT }} />
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={deloadActive}
          aria-label={t('home.activarSemanaDeload')}
          onClick={() => void handleToggle()}
          disabled={busy}
          className={`relative inline-flex h-11 w-14 shrink-0 items-center rounded-full border transition-colors disabled:opacity-60 ${
            deloadActive ? 'border-cta bg-cta/30' : 'border-border bg-bg'
          }`}
        >
          <span
            className={`inline-block size-6 rounded-full bg-cta shadow transition-transform ${
              deloadActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </ProfileSection>
  )
}
