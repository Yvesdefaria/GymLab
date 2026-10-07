// F120/W2 (T2): estado de meta del tour en UNA sola suscripción compartida por
// TourHost y SectionTipHost (antes cada host abría 3-4 liveQueries por clave).
import { useLiveQuery } from 'dexie-react-hooks'
import { metaRepo } from '@/data/repositories'
import { ONBOARDING_DONE_META_KEY } from '@/domain/onboarding'
import {
  SECTION_TIPS_SEEN_META_KEY,
  TOUR_DONE_META_KEY,
  TOUR_PENDING_META_KEY,
  type SectionTipsSeen,
} from '@/domain/tour'

export interface TourMeta {
  onboardingDone: boolean
  tourPending: boolean
  tourDone: boolean
  tipsSeen: SectionTipsSeen
}

// Referencia estable para el estado de carga: consumirla no re-dispara efectos.
const EMPTY_TOUR_META: TourMeta = {
  onboardingDone: false,
  tourPending: false,
  tourDone: false,
  tipsSeen: {},
}

// Lee las claves del tour en una transacción de lectura y las mantiene reactivas.
export const useTourMeta = (): TourMeta =>
  useLiveQuery(
    async () => {
      const [onboardingDone, tourPending, tourDone, tipsSeen] = await Promise.all([
        metaRepo.getJson<boolean>(ONBOARDING_DONE_META_KEY, false),
        metaRepo.getJson<boolean>(TOUR_PENDING_META_KEY, false),
        metaRepo.getJson<boolean>(TOUR_DONE_META_KEY, false),
        metaRepo.getJson<SectionTipsSeen>(SECTION_TIPS_SEEN_META_KEY, {}),
      ])
      return { onboardingDone, tourPending, tourDone, tipsSeen }
    },
    []
  ) ?? EMPTY_TOUR_META
