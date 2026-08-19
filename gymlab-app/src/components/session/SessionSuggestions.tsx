// Sugerencias inteligentes en sesión: overlay contextual al final de cada serie.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Clock, AlertTriangle, X } from 'lucide-react'
import { generateSuggestions, type SessionSuggestion, type CompletedSet } from '@/domain/sessionSuggestions'
import { prefersReducedMotion } from '@/lib/animations'
import anime from 'animejs'
import { useEffect, useRef } from 'react'

interface SessionSuggestionsProps {
  completedSets: CompletedSet[]
}

const iconMap: Record<SessionSuggestion['type'], typeof TrendingUp> = {
  increase: TrendingUp,
  decrease: TrendingDown,
  rest: Clock,
  switch: TrendingUp,
  warning: AlertTriangle,
}

const colorMap: Record<SessionSuggestion['type'], string> = {
  increase: 'text-success',
  decrease: 'text-danger',
  rest: 'text-warning',
  switch: 'text-accent',
  warning: 'text-warning',
}

const bgMap: Record<SessionSuggestion['type'], string> = {
  increase: 'border-success/40 bg-success/10',
  decrease: 'border-danger/40 bg-danger/10',
  rest: 'border-warning/40 bg-warning/10',
  switch: 'border-accent/40 bg-accent/10',
  warning: 'border-warning/40 bg-warning/10',
}

export const SessionSuggestions = ({ completedSets }: SessionSuggestionsProps) => {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(
    () => generateSuggestions(completedSets),
    [completedSets]
  )

  const visible = suggestions.filter((s) => !dismissed.has(s.id))

  // Animación de entrada.
  useEffect(() => {
    if (visible.length === 0 || !containerRef.current || prefersReducedMotion()) return
    anime({
      targets: containerRef.current.children,
      opacity: [0, 1],
      translateY: [8, 0],
      duration: 250,
      delay: anime.stagger(50),
      easing: 'easeOutCubic',
    })
  }, [visible.length])

  if (visible.length === 0) return null

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]))
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {visible.map((s) => {
        const Icon = iconMap[s.type]
        return (
          <div
            key={s.id}
            className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${bgMap[s.type]}`}
          >
            <Icon className={`mt-0.5 size-3.5 shrink-0 ${colorMap[s.type]}`} aria-hidden />
            <p className="flex-1 text-[0.65rem] text-fg">
              {s.messageKey === 'suggestions.increaseWeight'
                ? t('suggestions.increaseWeight', s.data)
                : s.messageKey === 'suggestions.decreaseWeight'
                  ? t('suggestions.decreaseWeight', s.data)
                  : s.messageKey === 'suggestions.restMore'
                    ? t('suggestions.restMore', s.data)
                    : t('suggestions.performanceDrop')}
            </p>
            <button
              onClick={() => dismiss(s.id)}
              className="shrink-0 text-muted"
              aria-label="Dismiss"
            >
              <X className="size-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
