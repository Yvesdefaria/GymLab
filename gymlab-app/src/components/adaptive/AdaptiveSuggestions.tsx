// Sugerencias adaptativas: muestra sugerencias de peso/volumen según progreso.
import { useTranslation } from 'react-i18next'
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { AdaptiveSuggestion } from '@/domain/adaptiveRoutine'

interface AdaptiveSuggestionsProps {
  suggestions: AdaptiveSuggestion[]
}

const iconMap = {
  increase: TrendingUp,
  decrease: TrendingDown,
  maintain: Minus,
}

const colorMap = {
  increase: 'text-green-400',
  decrease: 'text-red-400',
  maintain: 'text-muted',
}

export const AdaptiveSuggestions = ({ suggestions }: AdaptiveSuggestionsProps) => {
  const { t } = useTranslation()

  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-accent" aria-hidden />
        <p className="text-[0.65rem] font-semibold text-fg">{t('adaptive.title')}</p>
      </div>
      {suggestions.map((s) => {
        const Icon = iconMap[s.reason]
        return (
          <div key={s.exerciseId} className="flex items-center gap-2 rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2">
            <Icon className={`size-4 ${colorMap[s.reason]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[0.6rem] font-medium text-fg truncate">Ejercicio #{s.exerciseId}</p>
              <p className="text-[0.55rem] text-muted">{s.reasonText}</p>
            </div>
            {s.suggestedWeightKg > 0 && (
              <span className="text-[0.6rem] font-bold text-fg">{s.suggestedWeightKg}kg × {s.suggestedReps}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
