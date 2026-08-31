// Sugerencias adaptativas: muestra sugerencias de peso/volumen según progreso.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { localizeExercise } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'
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
  const { t, i18n } = useTranslation()
  const { settings } = useSettings()
  const { exercises } = useExerciseCatalog()
  const lang = i18n.language as AppLanguage

  // Resuelve el nombre localizado por exerciseId (fallback al id si no está en el catálogo).
  const nameFor = useMemo(() => {
    const map = new Map<number, string>()
    for (const ex of exercises) map.set(ex.id, localizeExercise(ex, lang).name)
    return map
  }, [exercises, lang])

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
              <p className="text-sm font-medium text-fg truncate">{nameFor.get(s.exerciseId) ?? `Ejercicio #${s.exerciseId}`}</p>
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
