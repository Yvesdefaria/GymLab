// F101: tips de primera vez por apartado — tarjeta breve, una vez por sección.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { metaRepo } from '@/data/repositories'
import { useMetaValue } from '@/hooks/useMetaValue'
import { useSettings } from '@/hooks/useSettings'
import { ONBOARDING_DONE_META_KEY } from '@/domain/onboarding'
import {
  markSectionsSeen,
  sectionForPath,
  SECTION_TIPS_SEEN_META_KEY,
  type SectionId,
  type SectionTipsSeen,
} from '@/domain/tour'
import { SECTION_TIPS } from '@/i18n/tour'
import { useTourStore } from '@/store/tourStore'

export const SectionTipHost = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { settings, loaded } = useSettings()
  const onboardingDone = useMetaValue<boolean>(ONBOARDING_DONE_META_KEY, false)
  const tourOpen = useTourStore((s) => s.source !== null)
  const [activeTip, setActiveTip] = useState<SectionId | null>(null)

  const section = sectionForPath(pathname)

  // Al cambiar de ruta se oculta el tip anterior.
  useEffect(() => {
    setActiveTip(null)
  }, [pathname])

  // Entrada a una sección: si es la primera vez, se muestra y queda marcada
  // (mostrado = visto: no reaparece si te vas sin tocar «Entendido»). Nunca con el
  // wizard abierto (onboardingDone) ni con el tour en curso.
  useEffect(() => {
    if (!loaded || !onboardingDone || !settings.showSectionTips || !section) {
      setActiveTip(null)
      return
    }
    // Gate imperativo: `tourOpen` puede llegar stale en el mismo commit en que el tour
    // auto-arranca (el efecto hermano de TourHost corre antes) y mostraría el tip con el
    // overlay abierto. Se mantiene `tourOpen` en deps para reaccionar a cambios en vivo.
    if (useTourStore.getState().source !== null) {
      setActiveTip(null)
      return
    }
    let alive = true
    void (async () => {
      // Merge con lo ÚLTIMO persistido: el tour pudo marcar las secciones cubiertas en
      // este mismo ciclo y un snapshot de render las pisaría (carrera destapada por el e2e).
      const latest = await metaRepo.getJson<SectionTipsSeen>(SECTION_TIPS_SEEN_META_KEY, {})
      if (!alive || latest[section]) return
      setActiveTip(section)
      await metaRepo.setJson(SECTION_TIPS_SEEN_META_KEY, markSectionsSeen(latest, [section]))
    })()
    return () => {
      alive = false
    }
  }, [pathname, loaded, onboardingDone, settings.showSectionTips, section, tourOpen])

  if (!activeTip) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[95] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-border bg-bg-elevated p-4 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t('tour.ui.tipLabel')}</p>
        <p className="mt-1 text-sm leading-relaxed text-fg">{t(SECTION_TIPS[activeTip].bodyKey)}</p>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setActiveTip(null)}
            className="min-h-[44px] rounded-xl px-3 text-sm font-semibold text-accent-soft"
          >
            {t('tour.ui.tipDismiss')}
          </button>
        </div>
      </div>
    </div>
  )
}
