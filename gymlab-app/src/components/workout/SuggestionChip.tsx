// Chip compacto de sugerencia en vivo dentro del bloque de ejercicio (F98.2).
// Sustituye al antiguo overlay de página: una sugerencia por bloque con acción de un
// toque (aplicar peso / añadir calentamiento) y descarte local. El mensaje se localiza
// desde la clave del motor; el descarte usa clave i18n (antes `aria-label="Dismiss"`).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Clock, AlertTriangle, Flame, X } from 'lucide-react'
import type { SessionSuggestion, SuggestionAction } from '@/domain/sessionSuggestions'
import type { AppLanguage } from '@/domain/onboarding'
import { formatNumber } from '@/lib/intl'

type SuggestionChipProps = {
  suggestion: SessionSuggestion
  onApply?: (exerciseId: number, amountKg: number) => void
  onWarmup?: (exerciseId: number, warmupWeightKg: number) => void
}

const iconMap: Record<SessionSuggestion['type'], typeof TrendingUp> = {
  increase: TrendingUp,
  decrease: TrendingDown,
  rest: Clock,
  switch: TrendingUp,
  warning: AlertTriangle,
  warmup: Flame,
}

const colorMap: Record<SessionSuggestion['type'], string> = {
  increase: 'border-success/40 bg-success/10 text-success',
  decrease: 'border-danger/40 bg-danger/10 text-danger',
  rest: 'border-warning/40 bg-warning/10 text-warning',
  switch: 'border-accent/40 bg-accent/10 text-accent',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  warmup: 'border-warning/40 bg-warning/10 text-warning',
}

export const SuggestionChip = ({ suggestion, onApply, onWarmup }: SuggestionChipProps) => {
  const { t, i18n } = useTranslation()
  const [dismissed, setDismissed] = useState(false)
  const [applied, setApplied] = useState(false)

  if (dismissed || applied) return null

  const Icon = iconMap[suggestion.type]

  // El importe del ajuste de peso se redondea a medio kilo en el dominio, así que tiene
  // decimales: se formatean según el idioma (2.5 → «2,5» en es-ES, «2.5» en en-GB).
  // La localización vive acá y no en el dominio, que es puro y no conoce el idioma.
  const lang = i18n.language as AppLanguage
  const rawAmount = suggestion.data?.amount
  const localizedData =
    typeof rawAmount === 'number'
      ? { ...suggestion.data, amount: formatNumber(rawAmount, lang) }
      : suggestion.data

  // Traduce el mensaje según la clave que emite el motor.
  const message = (() => {
    switch (suggestion.messageKey) {
      case 'suggestions.increaseWeight':
        return t('suggestions.increaseWeight', localizedData)
      case 'suggestions.decreaseWeight':
        return t('suggestions.decreaseWeight', localizedData)
      case 'suggestions.restMore':
        return t('suggestions.restMore', localizedData)
      case 'suggestions.warmupHighWeight':
        return t('suggestions.warmupHighWeight', localizedData)
      default:
        return t('suggestions.performanceDrop')
    }
  })()

  const action = suggestion.action
  const actionLabel = (a: SuggestionAction): string => {
    if (a.kind === 'applyWeight') {
      const amount = formatNumber(Math.abs(a.amountKg), lang)
      return a.amountKg > 0
        ? t('suggestions.applyIncrease', { amount })
        : t('suggestions.applyDecrease', { amount })
    }
    return t('suggestions.addWarmupSetLabel')
  }

  // Marca la acción como aplicada para no repetirla mientras el motor siga emitiéndola.
  const handleAction = () => {
    if (!action || applied) return
    if (action.kind === 'applyWeight') onApply?.(suggestion.exerciseId, action.amountKg)
    if (action.kind === 'addWarmupSet') onWarmup?.(suggestion.exerciseId, action.warmupWeightKg)
    setApplied(true)
  }

  return (
    <div
      role="status"
      className={`mt-1.5 flex items-center gap-2 rounded-xl border px-2.5 py-1 ${colorMap[suggestion.type]}`}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 text-[0.65rem] text-fg">{message}</p>
      {action && (
        <button
          type="button"
          onClick={handleAction}
          className="flex min-h-[44px] shrink-0 items-center rounded-lg border border-accent/40 bg-accent/10 px-2 text-[0.62rem] font-medium text-accent active:scale-95"
        >
          {actionLabel(action)}
        </button>
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t('workout.descartarSugerencia')}
        className="relative flex size-6 shrink-0 items-center justify-center text-muted after:absolute after:-inset-2.5 after:content-['']"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  )
}
