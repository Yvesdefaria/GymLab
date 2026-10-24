// Insight del journal como fila hairline: sin tarjeta, con el icono como acento.
import { BatteryLow, Moon, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { JournalInsight } from '@/domain/journalInsights'

type Props = {
  insight: JournalInsight
}

const INSIGHT_CONFIG = {
  buenSueno: { icon: Moon, iconClass: 'text-success' },
  malSueno: { icon: Moon, iconClass: 'text-danger' },
  altaEnergia: { icon: Zap, iconClass: 'text-success' },
  bajaEnergia: { icon: BatteryLow, iconClass: 'text-danger' },
} as const

export const JournalInsightCard = ({ insight }: Props) => {
  const { t } = useTranslation()
  const config = INSIGHT_CONFIG[insight.key]
  const Icon = config.icon

  return (
    <div className="mt-5 flex items-start gap-3 border-t border-border/40 pt-3.5">
      <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-fg/5 ${config.iconClass}`}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-fg">
        {t(`journalInsights.${insight.key}`, insight.params ?? {})}
      </p>
    </div>
  )
}
