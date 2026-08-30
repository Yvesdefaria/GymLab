// Tarjeta «Mejores marcas» del perfil: top 10 PRs con nombre de ejercicio, peso/reps y 1RM estimado.
import { useTranslation } from 'react-i18next'
import { formatWeight } from '@/domain/settings'
import type { Units } from '@/domain/settings'
import type { PRRecord } from '@/domain/types'

export const PrListCard = ({
  prs,
  nameById,
  units,
}: {
  prs: PRRecord[]
  nameById: Map<number, string>
  units: Units
}) => {
  const { t } = useTranslation()
  return (
    <div className="panel-light rounded-2xl p-4">
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
        {t('perfil.mejoresMarcas')}
      </h2>
      {prs.length > 0 ? (
        <div className="space-y-2">
          {prs.slice(0, 10).map((pr) => (
            <div
              key={pr.exerciseId}
              className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0"
            >
              <span className="min-w-0 truncate text-sm text-fg">
                {nameById.get(pr.exerciseId) ?? t('perfil.ejercicio', { id: pr.exerciseId })}
              </span>
              <span className="shrink-0 text-xs text-muted">
                {t('perfil.prDetalle', {
                  peso: formatWeight(pr.weightKg, units),
                  reps: pr.reps,
                  e1rm: formatWeight(pr.estimated1RM, units),
                })}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">{t('perfil.sinPrs')}</p>
      )}
    </div>
  )
}