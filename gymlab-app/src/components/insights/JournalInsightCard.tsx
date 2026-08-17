// Tarjeta de insight del journal: muestra la correlación sueño/energía vs rendimiento.
import { Moon, Zap, BatteryLow } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { JournalInsight } from '@/domain/journalInsights'

type Props = {
  insight: JournalInsight
}

// Mapea cada tipo de insight a su icono y estilo visual.
const INSIGHT_CONFIG = {
  buenSueno: { icon: Moon, borderClass: 'border-success/40 bg-success/10', iconClass: 'text-success' },
  malSueno: { icon: Moon, borderClass: 'border-danger/40 bg-danger/10', iconClass: 'text-danger' },
  altaEnergia: { icon: Zap, borderClass: 'border-success/40 bg-success/10', iconClass: 'text-success' },
  bajaEnergia: { icon: BatteryLow, borderClass: 'border-danger/40 bg-danger/10', iconClass: 'text-danger' },
} as const

export const JournalInsightCard = ({ insight }: Props) => {
  const { t } = useTranslation()
  const config = INSIGHT_CONFIG[insight.key]
  const Icon = config.icon

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${config.borderClass}`}>
      <Icon className={`mt-0.5 size-5 shrink-0 ${config.iconClass}`} aria-hidden />
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-fg">
        {t(`journalInsights.${insight.key}`, insight.params ?? {})}
      </p>
    </div>
  )
}
