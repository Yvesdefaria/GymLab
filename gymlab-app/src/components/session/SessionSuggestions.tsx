// Sugerencias inteligentes en sesión: overlay contextual al final de cada serie.
// Con acciones de un toque (aplicar peso, añadir calentamiento) cuando el motor las ofrece.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Clock, AlertTriangle, Flame, X } from 'lucide-react'
import {
  generateSuggestions,
  type ActiveSetInput,
  type SessionSuggestion,
  type CompletedSet,
  type SuggestionAction,
} from '@/domain/sessionSuggestions'
import { prefersReducedMotion } from '@/lib/animations'
import anime from 'animejs'
import { useEffect, useRef } from 'react'

interface SessionSuggestionsProps {
  completedSets: CompletedSet[]
  // e1RM conocido por ejercicio (del historial de PRs) para decidir el calentamiento.
  knownE1RM?: Record<number, number>
  // Series de la sesión activa (para ver warmups y pesos pendientes).
  activeSets?: ActiveSetInput[]
  onApplyWeight?: (exerciseId: number, amountKg: number) => void
  onAddWarmup?: (exerciseId: number, warmupWeightKg: number) => void
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
  increase: 'text-success',
  decrease: 'text-danger',
  rest: 'text-warning',
  switch: 'text-accent',
  warning: 'text-warning',
  warmup: 'text-warning',
}

const bgMap: Record<SessionSuggestion['type'], string> = {
  increase: 'border-success/40 bg-success/10',
  decrease: 'border-danger/40 bg-danger/10',
  rest: 'border-warning/40 bg-warning/10',
  switch: 'border-accent/40 bg-accent/10',
  warning: 'border-warning/40 bg-warning/10',
  warmup: 'border-warning/40 bg-warning/10',
}

export const SessionSuggestions = ({
  completedSets,
  knownE1RM,
  activeSets,
  onApplyWeight,
  onAddWarmup,
}: SessionSuggestionsProps) => {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(
    () => generateSuggestions(completedSets, { knownE1RM, activeSets }),
    [completedSets, knownE1RM, activeSets]
  )

  const visible = suggestions.filter((s) => !dismissed.has(s.id) && !applied.has(s.id))

  // Traduce el mensaje según la clave del motor de sugerencias.
  const messageFor = (s: SessionSuggestion): string => {
    switch (s.messageKey) {
      case 'suggestions.increaseWeight':
        return t('suggestions.increaseWeight', s.data)
      case 'suggestions.decreaseWeight':
        return t('suggestions.decreaseWeight', s.data)
      case 'suggestions.restMore':
        return t('suggestions.restMore', s.data)
      case 'suggestions.warmupHighWeight':
        return t('suggestions.warmupHighWeight', s.data)
      default:
        return t('suggestions.performanceDrop')
    }
  }

  // Ejecuta la acción de un toque y marca la sugerencia como aplicada (sin doble-aplicar).
  const handleAction = (s: SessionSuggestion, action: SuggestionAction) => {
    if (applied.has(s.id)) return
    if (action.kind === 'applyWeight') onApplyWeight?.(s.exerciseId, action.amountKg)
    if (action.kind === 'addWarmupSet') onAddWarmup?.(s.exerciseId, action.warmupWeightKg)
    setApplied((prev) => new Set([...prev, s.id]))
  }

  const actionLabel = (action: SuggestionAction): string | null => {
    if (action.kind === 'applyWeight') {
      const amount = Math.abs(action.amountKg)
      return action.amountKg > 0
        ? t('suggestions.applyIncrease', { amount })
        : t('suggestions.applyDecrease', { amount })
    }
    return t('suggestions.addWarmupSetLabel')
  }

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
            <div className="min-w-0 flex-1">
              <p className="text-[0.65rem] text-fg">{messageFor(s)}</p>
              {s.action && (
                <button
                  onClick={() => handleAction(s, s.action!)}
                  className="mt-1 w-fit rounded-lg border border-accent/40 bg-accent/10 px-2 py-1 text-[0.62rem] font-medium text-accent active:scale-95"
                >
                  {actionLabel(s.action)}
                </button>
              )}
            </div>
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