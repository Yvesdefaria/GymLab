// Periodización visual: vista de calendario con mesociclos, progreso y detalle al tocar.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, ChevronDown } from 'lucide-react'
import { getCurrentWeek, getMesocycleProgress, type PeriodizationPlan, type MesocycleType } from '@/domain/periodization'

const mesocycleColor: Record<MesocycleType, string> = {
  volumen: 'bg-blue-400',
  hipertrofia: 'bg-accent',
  fuerza: 'bg-orange-400',
  deload: 'bg-green-400',
  potencia: 'bg-red-400',
}

const mesocycleTextColor: Record<MesocycleType, string> = {
  volumen: 'text-blue-400',
  hipertrofia: 'text-accent',
  fuerza: 'text-orange-400',
  deload: 'text-green-400',
  potencia: 'text-red-400',
}

interface PeriodizationViewProps {
  plan: PeriodizationPlan
  currentDate?: string
}

export const PeriodizationView = ({ plan, currentDate }: PeriodizationViewProps) => {
  const { t } = useTranslation()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const now = currentDate ?? new Date().toISOString()
  const currentWeek = getCurrentWeek(plan, now)
  const progress = getMesocycleProgress(plan.mesocycles, currentWeek)

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calendar className="size-5 text-accent" aria-hidden />
        <p className="text-sm font-bold text-fg">{plan.name}</p>
        <span className="ml-auto text-xs text-muted">
          {t('periodization.week')} {currentWeek}/{plan.totalWeeks}
        </span>
      </div>

      {/* Barra de progreso general */}
      <div className="h-2 w-full rounded-full bg-border/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${(currentWeek / plan.totalWeeks) * 100}%` }}
        />
      </div>

      {/* Lista de mesociclos */}
      <div className="flex flex-col gap-2">
        {progress.map(({ mesocycle, progress: pct }) => {
          const isCurrent = pct > 0 && pct < 1
          const isExpanded = expandedId === mesocycle.id
          const weeksDone = Math.round(pct * mesocycle.weeks)

          return (
            <div key={mesocycle.id}>
              {/* Bloque principal — touch target mínimo 44px */}
              <button
                onClick={() => toggle(mesocycle.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors min-h-[44px] ${
                  isCurrent
                    ? `${mesocycleColor[mesocycle.type]} bg-opacity-15 border border-current/20`
                    : 'bg-bg-elevated/30 border border-border/20'
                }`}
              >
                {/* Indicador de color */}
                <div className={`size-3 rounded-full shrink-0 ${mesocycleColor[mesocycle.type]}`} />

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isCurrent ? mesocycleTextColor[mesocycle.type] : 'text-fg'}`}>
                    {mesocycle.name}
                  </p>
                  <p className="text-xs text-muted">
                    {t(`periodization.type.${mesocycle.type}` as any)} · {mesocycle.weeks}w
                  </p>
                </div>

                {/* Progreso */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-medium text-muted">
                    {weeksDone}/{mesocycle.weeks}
                  </span>
                  <ChevronDown
                    className={`size-4 text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </div>
              </button>

              {/* Panel expandido */}
              {isExpanded && (
                <div className="mt-1 rounded-xl border border-border/20 bg-bg-elevated/20 px-3 py-3">
                  {/* Barra de progreso del mesociclo */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-muted mb-1">
                      <span>{t('periodization.progress')}</span>
                      <span>{Math.round(pct * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-border/30 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${mesocycleColor[mesocycle.type]}`}
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Detalle */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted">{t('periodization.totalWeeks')}</p>
                      <p className="font-medium text-fg">{mesocycle.weeks}</p>
                    </div>
                    <div>
                      <p className="text-muted">{t('periodization.status')}</p>
                      <p className={`font-medium ${isCurrent ? mesocycleTextColor[mesocycle.type] : pct >= 1 ? 'text-green-400' : 'text-muted'}`}>
                        {pct >= 1 ? t('periodization.completed') : isCurrent ? t('periodization.inProgress') : t('periodization.pending')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
