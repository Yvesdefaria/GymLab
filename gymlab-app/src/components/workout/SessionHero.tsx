// Cabecera de la sesión: anillo de progreso, volumen acumulado y reloj en vivo.
import { useTranslation } from 'react-i18next'
import { ElapsedClock } from '@/components/workout/ElapsedClock'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { applyUnits, formatUnits, type Units } from '@/domain/settings'

interface SessionHeroProps {
  pct: number
  totalVolume: number
  units: Units
  startedAt: string | null
}

export const SessionHero = ({ pct, totalVolume, units, startedAt }: SessionHeroProps) => {
  const { t } = useTranslation()
  return (
    <div className="panel-hero flex items-center gap-4 rounded-2xl p-4">
      <ProgressRing value={pct} label={t('session.progresoSesion')} />
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="kicker">{t('session.volumen')}</p>
          <p className="stat-value mt-0.5 text-2xl">
            {Math.round(applyUnits(totalVolume, units)).toLocaleString()}{' '}
            {formatUnits(units)}
          </p>
        </div>
        <div>
          <p className="kicker">{t('session.tiempo')}</p>
          <ElapsedClock startedAt={startedAt} />
        </div>
      </div>
    </div>
  )
}