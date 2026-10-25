// Bloque «técnica» de la ficha: pasos numerados con tip/warning (animados en cadena al
// entrar) o las instrucciones de fallback cuando no hay pasos detallados.
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Lightbulb } from 'lucide-react'
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
    <section className="border-t border-border/40 pt-4">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {t('ejercicios.detalle.tecnica')}
      </h2>
      {steps.length > 0 ? (
        <ol className="mt-3 space-y-3">
          {steps.map((s) => (
            <li
              key={s.step}
              ref={(el) => {
                stepRefs.current[s.step - 1] = el
              }}
              className="flex gap-3"
            >
              <span className="mt-0.5 min-w-5 font-display text-base font-light leading-none text-gold">
                {s.step}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] leading-relaxed text-fg">{s.instruction}</p>
                {s.tip ? (
                  <p className="mt-1 flex items-start gap-1.5 text-[11px] text-gold-bright">
                    <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{s.tip}</span>
                  </p>
                ) : null}
                {s.warning ? (
                  <p className="mt-1 flex items-start gap-1.5 text-[11px] text-danger">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{s.warning}</span>
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-[12.5px] leading-relaxed text-fg">{fallback}</p>
      )}
    </section>
  )
}
