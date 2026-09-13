// Aviso no bloqueante de la alerta de descanso (F96, D3): permisos y exactitud
// de Android, y el techo explícito de la web (sin alerta en segundo plano).
import { Info, TriangleAlert, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RestAlertWarning } from '@/domain/restAlert'

interface RestAlertNoticeProps {
  warning: RestAlertWarning | null
  isNative: boolean
  onDismiss: () => void
}

export const RestAlertNotice = ({ warning, isNative, onDismiss }: RestAlertNoticeProps) => {
  const { t } = useTranslation()
  // Nativo sin aviso: nada que declarar. En web siempre se declara el techo.
  if (!warning && isNative) return null
  const isWarning = warning !== null
  const message =
    warning === 'permission_denied'
      ? t('notifications.restWarning.permissionDenied')
      : warning === 'exact_alarm_denied'
        ? t('notifications.restWarning.exactAlarm')
        : t('notifications.restWebCeiling')
  const Icon = isWarning ? TriangleAlert : Info

  return (
    <div
      data-testid="rest-alert-notice"
      role="status"
      className="mb-3 flex items-start gap-2 rounded-xl border border-border bg-bg-elevated px-3 py-2"
    >
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
      <p className="flex-1 text-[0.65rem] leading-snug text-muted">{message}</p>
      {isWarning && (
        <button
          type="button"
          aria-label={t('workout.cerrar')}
          onClick={onDismiss}
          className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg text-muted transition-colors hover:text-fg"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  )
}
