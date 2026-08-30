// Bloque «técnica» de la ficha: pasos numerados con tip/warning (animados en cadena al
// entrar) o las instrucciones de fallback cuando no hay pasos detallados.
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Dumbbell, Lightbulb } from 'lucide-react'
import { staggerSlide } from '@/lib/animations'
import type { ExerciseStep } from '@/domain/types'

export const ExerciseTechniqueCard = ({
  steps,
  fallback,
}: {
  steps: ExerciseStep[]
  fallback: string
}) => {
  const { t } = useTranslation()
  // Referencias a los pasos de técnica para animarlos en cadena al entrar.
  const stepRefs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    const els = stepRefs.current.filter((el): el is HTMLLIElement => el !== null)
    if (els.length > 0) staggerSlide(els, 'up', { staggerDelay: 60 })
  }, [steps])

  return (
    <div className="panel-light rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Dumbbell className="size-5 text-accent" />
        <span className="font-display text-sm font-semibold text-accent">{t('ejercicios.detalle.tecnica')}</span>
      </div>
      {steps.length > 0 ? (
        <ol className="space-y-4">
          {steps.map((s) => (
            <li
              key={s.step}
              ref={(el) => {
                stepRefs.current[s.step - 1] = el
              }}
              className="flex gap-3"
            >
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-cta/15 text-xs font-bold text-cta">
                {s.step}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-fg">{s.instruction}</p>
                {s.tip ? (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-accent-soft">
                    <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{s.tip}</span>
                  </p>
                ) : null}
                {s.warning ? (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-danger">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{s.warning}</span>
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm leading-relaxed text-fg">{fallback}</p>
      )}
    </div>
  )
}