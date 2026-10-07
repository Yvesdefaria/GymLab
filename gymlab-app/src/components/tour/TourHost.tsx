// F101: host del tour — dispara el arranque automático (una vez, tras el setup) y monta el overlay.
import { useEffect } from 'react'
import { useTourMeta } from '@/hooks/useTourMeta'
import { shouldAutoStartTour } from '@/domain/tour'
import { useTourStore } from '@/store/tourStore'
import { TourOverlay } from './TourOverlay'

export const TourHost = () => {
  // Meta del tour en una sola suscripción (F120/T2), compartida con SectionTipHost.
  const { onboardingDone, tourPending, tourDone } = useTourMeta()
  const start = useTourStore((s) => s.start)

  useEffect(() => {
    if (shouldAutoStartTour({ onboardingDone, tourPending, tourDone })) {
      start('auto')
    }
  }, [onboardingDone, tourPending, tourDone, start])

  return <TourOverlay />
}
