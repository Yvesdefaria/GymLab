// Periodización visual: vista de calendario con mesociclos, progreso y detalle al tocar.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, ChevronDown, Info } from 'lucide-react'
import { getCurrentWeek, getMesocycleProgress, type PeriodizationPlan, type MesocycleType } from '@/domain/periodization'

// Colores de borde por tipo (legibles sobre fondo oscuro).
const mesocycleBorder: Record<MesocycleType, string> = {
  volumen: 'border-l-blue-400',
  hipertrofia: 'border-l-accent',
  fuerza: 'border-l-orange-400',
  deload: 'border-l-green-400',
  potencia: 'border-l-red-400',
}

const mesocycleDot: Record<MesocycleType, string> = {
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const now = currentDate ?? new Date().toISOString()
  const currentWeek = getCurrentWeek(plan, now)
  const progress = getMesocycleProgress(plan.mesocycles, currentWeek)

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calendar className="size-5 text-accent" aria-hidden />
        <p className="text-base font-bold text-fg">{plan.name}</p>
        <span className="ml-auto text-sm text-muted">
          {t('periodization.week')} {currentWeek}/{plan.totalWeeks}
        </span>
      </div>

      {/* Descripción breve */}
      <div className="flex items-start gap-2 rounded-xl border border-border/20 bg-bg-elevated/20 px-3 py-2.5">
        <Info className="size-4 text-accent shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs text-muted leading-relaxed">
          {t('periodization.description')}
        </p>
      </div>

      {/* Barra de progreso general */}
      <div className="h-2.5 w-full rounded-full bg-border/30 overflow-hidden">
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
              {/* Bloque principal */}
              <button
                onClick={() => toggle(mesocycle.id)}
                className={`flex w-full items-center gap-3 rounded-xl border-l-4 px-3 py-3 text-left transition-colors min-h-[48px] ${
                  mesocycleBorder[mesocycle.type]
                } ${
                  isCurrent ? 'bg-bg-elevated/50' : 'bg-bg-elevated/20'
                } border border-border/15`}
              >
                {/* Dot de estado */}
                <div className={`size-2.5 rounded-full shrink-0 ${mesocycleDot[mesocycle.type]} ${!isCurrent && pct < 1 ? 'opacity-40' : ''}`} />

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-fg' : 'text-muted'}`}>
                    {mesocycle.name}
                  </p>
                  <p className="text-xs text-muted">
                    {t(`periodization.type.${mesocycle.type}` as any)} · {mesocycle.weeks} {t('periodization.weeksShort')}
                  </p>
                </div>

                {/* Progreso */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-medium ${isCurrent ? 'text-accent' : 'text-muted'}`}>
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
                <div className="mt-1 ml-2 rounded-xl border border-border/15 bg-bg-elevated/15 px-3 py-3">
                  {/* Barra de progreso del mesociclo */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted mb-1">
                      <span>{t('periodization.progress')}</span>
                      <span className="font-medium text-fg">{Math.round(pct * 100)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-border/30 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${mesocycleDot[mesocycle.type]}`}
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Detalle */}
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted mb-0.5">{t('periodization.totalWeeks')}</p>
                      <p className="font-semibold text-fg">{mesocycle.weeks}</p>
                    </div>
                    <div>
                      <p className="text-muted mb-0.5">{t('periodization.elapsed')}</p>
                      <p className="font-semibold text-fg">{weeksDone}</p>
                    </div>
                    <div>
                      <p className="text-muted mb-0.5">{t('periodization.status')}</p>
                      <p className={`font-semibold ${pct >= 1 ? 'text-green-400' : isCurrent ? 'text-accent' : 'text-muted'}`}>
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
