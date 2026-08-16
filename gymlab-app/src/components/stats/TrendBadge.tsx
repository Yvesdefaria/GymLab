// TrendBadge: badge contextual que muestra tendencia con color adaptativo.
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Props = {
  value: number
  label: string
  tone?: 'positive' | 'neutral' | 'alert'
}

const toneStyles: Record<NonNullable<Props['tone']>, string> = {
  positive: 'border-success/30 bg-success/10 text-success',
  neutral: 'border-border/30 bg-bg-elevated/50 text-muted',
  alert: 'border-danger/30 bg-danger/10 text-danger',
}

const TrendIcon = ({ tone }: { tone: Props['tone'] }) => {
  if (tone === 'positive') return <TrendingUp className="size-3" />
  if (tone === 'alert') return <TrendingDown className="size-3" />
  return <Minus className="size-3" />
}

export const TrendBadge = ({ value, label, tone = 'neutral' }: Props) => {
  const autoTone: Props['tone'] = value > 0 ? 'positive' : value < 0 ? 'alert' : 'neutral'
  const resolvedTone = tone === 'neutral' && value !== 0 ? autoTone : tone

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${toneStyles[resolvedTone]}`}
    >
      <TrendIcon tone={resolvedTone} />
      <span>
        {value > 0 ? '+' : ''}{Math.round(value)}% {label}
      </span>
    </div>
  )
}
