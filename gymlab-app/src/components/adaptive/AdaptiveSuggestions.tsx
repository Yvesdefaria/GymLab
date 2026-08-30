// Sugerencias adaptativas: muestra sugerencias de peso/volumen según progreso.
import { useTranslation } from 'react-i18next'
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { formatWeight } from '@/domain/settings'
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
  const { settings } = useSettings()

  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-accent" aria-hidden />
        <p className="text-sm font-semibold text-fg">{t('adaptive.title')}</p>
      </div>
      {suggestions.map((s) => {
        const Icon = iconMap[s.reason]
        return (
          <div key={s.exerciseId} className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-border/30 bg-bg-elevated/30 px-4 py-3">
            <Icon className={`size-5 shrink-0 ${colorMap[s.reason]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-fg truncate">Ejercicio #{s.exerciseId}</p>
              <p className="text-xs text-muted">{s.reasonText}</p>
            </div>
            {s.suggestedWeightKg > 0 && (
              <span className="text-sm font-bold text-fg">{formatWeight(s.suggestedWeightKg, settings.units)} × {s.suggestedReps}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
