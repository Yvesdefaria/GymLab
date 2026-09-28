// F101: host del tour — dispara el arranque automático (una vez, tras el setup) y monta el overlay.
import { useEffect } from 'react'
import { useMetaValue } from '@/hooks/useMetaValue'
import { ONBOARDING_DONE_META_KEY } from '@/domain/onboarding'
import { shouldAutoStartTour, TOUR_DONE_META_KEY, TOUR_PENDING_META_KEY } from '@/domain/tour'
import { useTourStore } from '@/store/tourStore'
import { TourOverlay } from './TourOverlay'

export const TourHost = () => {
  const onboardingDone = useMetaValue<boolean>(ONBOARDING_DONE_META_KEY, false)
  const pending = useMetaValue<boolean>(TOUR_PENDING_META_KEY, false)
  const done = useMetaValue<boolean>(TOUR_DONE_META_KEY, false)
  const start = useTourStore((s) => s.start)

  useEffect(() => {
    if (shouldAutoStartTour({ onboardingDone, tourPending: pending, tourDone: done })) {
      start('auto')
    }
  }, [onboardingDone, pending, done, start])

  return <TourOverlay />
}
