// Periodización visual: vista de calendario con mesociclos y progreso.
import { useTranslation } from 'react-i18next'
import { Calendar, TrendingUp } from 'lucide-react'
import { getCurrentWeek, getMesocycleProgress, type PeriodizationPlan, type MesocycleType } from '@/domain/periodization'

const mesocycleColor: Record<MesocycleType, string> = {
  volumen: 'bg-blue-400',
  hipertrofia: 'bg-accent',
  fuerza: 'bg-orange-400',
  deload: 'bg-green-400',
  potencia: 'bg-red-400',
}

interface PeriodizationViewProps {
  plan: PeriodizationPlan
  currentDate?: string
}

export const PeriodizationView = ({ plan, currentDate }: PeriodizationViewProps) => {
  const { t } = useTranslation()
  const now = currentDate ?? new Date().toISOString()
  const currentWeek = getCurrentWeek(plan, now)
  const progress = getMesocycleProgress(plan.mesocycles, currentWeek)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="size-4 text-accent" aria-hidden />
        <p className="kicker">{plan.name}</p>
        <span className="ml-auto text-[0.55rem] text-muted">
          {t('periodization.week')} {currentWeek}/{plan.totalWeeks}
        </span>
      </div>

      {/* Barra de progreso general */}
      <div className="h-1.5 w-full rounded-full bg-border/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${(currentWeek / plan.totalWeeks) * 100}%` }}
        />
      </div>

      {/* Mesociclos */}
      <div className="flex gap-1">
        {progress.map(({ mesocycle, progress: pct }) => {
          const widthPct = (mesocycle.weeks / plan.totalWeeks) * 100
          const isCurrent = pct > 0 && pct < 1

          return (
            <div
              key={mesocycle.id}
              className="flex flex-col items-center"
              style={{ width: `${widthPct}%` }}
            >
              {/* Bloque */}
              <div className={`w-full rounded-lg px-1 py-1.5 text-center transition-colors ${
                isCurrent ? `${mesocycleColor[mesocycle.type]} text-bg` : 'bg-bg-elevated/50 text-muted'
              }`}>
                <p className="text-[0.5rem] font-semibold truncate">
                  {mesocycle.type === 'volumen' ? t('periodization.type.volumen') : mesocycle.type === 'hipertrofia' ? t('periodization.type.hipertrofia') : mesocycle.type === 'fuerza' ? t('periodization.type.fuerza') : mesocycle.type === 'deload' ? t('periodization.type.deload') : t('periodization.type.potencia')}
                </p>
                <p className="text-[0.4rem] opacity-70">{mesocycle.weeks}w</p>
              </div>

              {/* Progreso interno */}
              <div className="mt-1 h-1 w-full rounded-full bg-border/30 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${mesocycleColor[mesocycle.type]}`}
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Info del mesociclo actual */}
      {progress.find((p) => p.progress > 0 && p.progress < 1) && (
        <div className="flex items-center gap-2 rounded-lg bg-bg-elevated/30 px-3 py-2">
          <TrendingUp className="size-3.5 text-accent" aria-hidden />
          <p className="text-[0.6rem] text-muted">
            {t('periodization.current')}: {progress.find((p) => p.progress > 0 && p.progress < 1)
              ?.mesocycle.type === 'volumen' ? t('periodization.type.volumen')
              : progress.find((p) => p.progress > 0 && p.progress < 1)
                ?.mesocycle.type === 'hipertrofia' ? t('periodization.type.hipertrofia')
                : progress.find((p) => p.progress > 0 && p.progress < 1)
                  ?.mesocycle.type === 'fuerza' ? t('periodization.type.fuerza')
                  : progress.find((p) => p.progress > 0 && p.progress < 1)
                    ?.mesocycle.type === 'deload' ? t('periodization.type.deload')
                    : t('periodization.type.potencia')
            }
          </p>
        </div>
      )}
    </div>
  )
}
