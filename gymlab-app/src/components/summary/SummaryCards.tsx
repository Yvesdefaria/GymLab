// Fila horizontal de tarjetas KPI compartida (SwipeRow de StatCard) sobre el resumen de entrenamiento.
import type { LucideIcon } from 'lucide-react'
import { StatCard } from '@/components/stats/StatCard'
import { SwipeRow } from '@/components/ui/SwipeRow'

export type SummaryCardSpec = {
  icon: LucideIcon
  label: string
  value: string
  tone?: 'default' | 'success' | 'accent' | 'cta'
  hint?: string
}

// Renderiza las tarjetas de métricas con scroll lateral; los llamadores construyen las especificaciones.
export const SummaryCards = ({ cards }: { cards: SummaryCardSpec[] }) => (
  <SwipeRow className="flex gap-3">
    {cards.map((c) => (
      <StatCard
        key={c.label}
        icon={c.icon}
        label={c.label}
        value={c.value}
        tone={c.tone}
        hint={c.hint}
        className="min-w-[140px] flex-shrink-0"
      />
    ))}
  </SwipeRow>
)