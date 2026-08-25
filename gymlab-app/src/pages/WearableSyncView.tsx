// Wearables: selector de dispositivo y estado de sincronización (placeholder futuro).
import { useTranslation } from 'react-i18next'
import { Watch, Lock } from 'lucide-react'
import { WEARABLE_DEVICES } from '@/domain/wearables'

export const WearableSyncView = () => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
      <div className="flex items-center gap-2">
        <Watch className="size-5 text-accent" aria-hidden />
        <h1 className="text-lg font-bold text-fg">{t('wearables.title')}</h1>
      </div>

      {/* Placeholder */}
      <div className="rounded-2xl border border-border/30 bg-bg-elevated/30 p-4 text-center">
        <Lock className="mx-auto mb-2 size-8 text-muted" />
        <p className="text-sm font-semibold text-fg mb-1">{t('wearables.comingSoon')}</p>
        <p className="text-xs text-muted">{t('wearables.description')}</p>
      </div>

      {/* Lista de dispositivos */}
      <div className="flex flex-col gap-2">
        {WEARABLE_DEVICES.map((d) => (
          <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border/30 bg-bg-elevated/30 px-4 py-3 opacity-50">
            <Watch className="size-5 text-muted" />
            <p className="flex-1 text-sm font-medium text-fg">{d.label}</p>
            <span className="rounded-full bg-bg-elevated/50 px-2.5 py-1 text-xs text-muted">
              {t('wearables.notAvailable')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
