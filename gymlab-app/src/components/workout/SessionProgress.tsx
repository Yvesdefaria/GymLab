// F132.2/B2 — línea de progreso + stat row de la sesión activa.
// Reemplaza el panel héroe con anillo; el héroe pasa a ser el ejercicio actual.
import { useTranslation } from 'react-i18next'
import { applyUnits, formatUnits, type Units } from '@/domain/settings'

type Props = {
  pct: number
  totalVolume: number
  bodyweightReps?: number
  units: Units
  completedSets: number
  totalSets: number
  completedExercises: number
  exerciseCount: number
}

export const SessionProgress = ({
  pct,
  totalVolume,
  bodyweightReps = 0,
  units,
  completedSets,
  totalSets,
  completedExercises,
  exerciseCount,
}: Props) => {
  const { t } = useTranslation()
  const safePct = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0))

  return (
    <div>
      <div
        className="h-0.5 bg-border/40"
        role="progressbar"
        aria-valuenow={safePct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('session.progresoSesion')}
      >
        <div
          className="h-0.5 bg-gradient-to-r from-gold to-gold-bright transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${safePct}%` }}
        />
      </div>
      <div className="grid grid-cols-3 divide-x divide-border/40 border-b border-border/40 py-2 text-center">
        <div className="px-2">
          <span className="block text-[8px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t('session.volumen')}
          </span>
          <span className="mt-0.5 block font-display text-lg font-light tabular-nums text-fg">
            {Math.round(applyUnits(totalVolume, units)).toLocaleString()}{' '}
            <small className="font-sans text-[9px] text-muted">{formatUnits(units)}</small>
          </span>
          {bodyweightReps > 0 && (
            <span className="mt-0.5 block text-[8px] text-muted">
              {t('session.repsPesoCorporal' as never, { count: bodyweightReps })}
            </span>
          )}
        </div>
        <div className="px-2">
          <span className="block text-[8px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t('session.series')}
          </span>
          <span className="mt-0.5 block font-display text-lg font-light tabular-nums text-fg">
            {completedSets}/{totalSets}
          </span>
        </div>
        <div className="px-2">
          <span className="block text-[8px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t('session.ejercicios')}
          </span>
          <span className="mt-0.5 block font-display text-lg font-light tabular-nums text-fg">
            {completedExercises}/{exerciseCount}
          </span>
        </div>
      </div>
    </div>
  )
}
