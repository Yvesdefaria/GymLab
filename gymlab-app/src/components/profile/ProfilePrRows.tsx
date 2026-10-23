// Filas de «Mejores marcas»: ejercicio, fecha, peso, reps y 1RM estimado.
// El punto de color es categoría muscular (marca pequeña), no estado.
import { useTranslation } from 'react-i18next'
import { useDataColors } from '@/hooks/useDataColors'
import { muscleColor } from '@/components/stats/muscleColors'
import { parseLocalDate } from '@/domain/dates'
import { formatWeight, type Units } from '@/domain/settings'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { Exercise, PRRecord } from '@/domain/types'

type ProfilePrRowsProps = {
  prs: PRRecord[]
  nameById: Map<number, string>
  exerciseById: ReadonlyMap<number, Exercise>
  units: Units
  limit?: number
}

export const ProfilePrRows = ({
  prs,
  nameById,
  exerciseById,
  units,
  limit = 3,
}: ProfilePrRowsProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const colors = useDataColors()
  if (prs.length === 0) return null

  return (
    <div className="divide-y divide-border/30">
      {prs.slice(0, limit).map((pr) => {
        const exercise = exerciseById.get(pr.exerciseId)
        const color = exercise ? muscleColor(exercise.muscleGroup, colors) : colors.rest
        const date = formatDate(parseLocalDate(pr.date), lang, { day: 'numeric', month: 'short' })
        return (
          <div key={pr.exerciseId} className="flex min-h-11 items-center gap-2 py-2">
            <i
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: color }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-fg">
                {nameById.get(pr.exerciseId) ?? t('perfil.ejercicio', { id: pr.exerciseId })}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {date} · {t('perfil.repsCorto', { count: pr.reps })}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm tabular-nums text-fg">{formatWeight(pr.weightKg, units)}</p>
              <p className="mt-0.5 text-[10px] text-muted">
                {formatWeight(pr.estimated1RM, units)} e1RM
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
