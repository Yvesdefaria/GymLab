// Alertas de estancamiento: muestra ejercicios donde el e1rm no mejora en 3+ semanas.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { useWorkoutSets } from '@/hooks/useWorkoutSets'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { detectPlateaus } from '@/domain/plateauDetector'
import { prefersReducedMotion } from '@/lib/animations'
import anime from 'animejs'
import { useEffect, useRef, useState } from 'react'

export const PlateauAlerts = () => {
  const { t } = useTranslation()
  const { sets } = useWorkoutSets()
  const { exercises } = useExerciseCatalog()
  const [visible, setVisible] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const alerts = useMemo(
    () => detectPlateaus(sets, exercises),
    [sets, exercises]
  )

  useEffect(() => {
    if (alerts.length === 0 || !listRef.current) return
    if (prefersReducedMotion()) {
      setVisible(true)
      return
    }
    anime({
      targets: listRef.current.children,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 350,
      delay: anime.stagger(60),
      easing: 'easeOutCubic',
      complete: () => setVisible(true),
    })
  }, [alerts.length])

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="kicker">{t('plateau.title')}</p>
        <div className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2.5">
          <p className="text-xs text-muted">{t('plateau.none')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="kicker">{t('plateau.title')}</p>
      <div ref={listRef} className="flex flex-col gap-2">
        {alerts.map((alert) => (
          <div
            key={alert.exerciseId}
            style={{ opacity: visible ? 1 : 0 }}
            className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-fg">{alert.exerciseName}</p>
              <p className="mt-0.5 text-[0.65rem] text-muted">
                {t('plateau.stagnant', { weeks: alert.weeksStagnant })}
              </p>
              <p className="mt-0.5 text-[0.65rem] text-muted">
                {t('plateau.e1rm', { current: alert.currentE1rm, previous: alert.previousE1rm })}
              </p>
              <span className="mt-1 inline-block rounded-full bg-warning/20 px-2 py-0.5 text-[0.6rem] font-medium text-warning">
                {alert.suggestion === 'volume'
                  ? t('plateau.suggestVolume')
                  : alert.suggestion === 'variant'
                    ? t('plateau.suggestVariant')
                    : t('plateau.suggestDeload')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
