// Línea compacta de estado del sistema de salud cuando el permiso ya está
// concedido. Los estados que requieren acción los sigue mostrando HealthSyncBanner.
import { useTranslation } from 'react-i18next'

export const StepSyncStatus = ({ connected }: { connected: boolean }) => {
  const { t } = useTranslation()
  if (!connected) return null

  return (
    <p className="flex items-center gap-2 text-[10px] text-muted" aria-live="polite">
      <span className="size-1.5 rounded-full bg-success" aria-hidden />
      {t('steps.healthConnected')}
    </p>
  )
}
