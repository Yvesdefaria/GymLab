// Wearables (F132.4): estado vacío honesto y provisional. La app todavía no
// integra pulso/sueño/calorías; no hay CTA, enlaces ni lógica. Cuando exista la
// integración, esta pantalla se rediseña con datos reales.
import { useTranslation } from 'react-i18next'
import { Watch } from 'lucide-react'
import { WEARABLE_DEVICES } from '@/domain/wearables'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'

export const WearableSyncView = () => {
  const { t } = useTranslation()

  return (
    <div>
      <AppHeader title={t('wearables.title')} />
      <div className="mx-auto max-w-md px-4 pb-20 pt-2">
        <BackLink to="/mas" />

        <section className="px-2 pb-6 pt-8 text-center">
          <div className="mx-auto grid size-[116px] place-items-center rounded-full border-2 border-dashed border-gold/40 text-muted">
            <Watch className="size-[42px]" aria-hidden />
          </div>
          <h2 className="mx-auto mt-4 max-w-[260px] font-display text-2xl font-normal leading-tight text-fg">
            {t('wearables.emptyTitle')}
          </h2>
          <p className="mx-auto mt-2 max-w-[250px] text-xs text-muted">
            {t('wearables.emptyBody')}
          </p>
        </section>

        <section className="border-t border-border/40 pt-2">
          <div className="flex items-baseline justify-between">
            <h3 className="kicker">{t('wearables.devicesPlanned')}</h3>
            <span className="text-[10px] text-muted">{t('wearables.soon')}</span>
          </div>
          <div data-testid="wearables-devices" className="mt-2 grid grid-cols-2 gap-2">
            {WEARABLE_DEVICES.map((device) => (
              <span
                key={device.id}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-border/40 px-3 text-xs text-muted"
              >
                <Watch className="size-4 shrink-0" aria-hidden />
                {device.label}
              </span>
            ))}
          </div>
        </section>

        <p className="mt-4 text-center text-[10px] text-muted">{t('wearables.readOnDevice')}</p>
      </div>
    </div>
  )
}
