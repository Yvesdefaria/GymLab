// Sección Permisos (Ajustes): un solo lugar para todo lo que la app pide al sistema.
// Salud (Health Connect), lectura en segundo plano del widget y notificaciones. Las
// filas solo muestran estado y acciones; la decisión de pedir vive en la capa de datos.
import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Capacitor } from '@capacitor/core'
import { Check, Settings } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useHealthBackgroundPermission } from '@/hooks/useHealthBackgroundPermission'
import {
  connectHealthSync,
  getHealthSyncStatus,
  subscribeHealthSync,
} from '@/data/healthSyncController'
import { canOpenSystemSettings, openNotificationSettings } from '@/data/appSettings'
import { SectionLabel, Toggle, settingsGroupClass, settingsRowClass } from './SettingsUI'

const actionClass =
  'flex min-h-11 shrink-0 items-center gap-2 text-xs font-medium text-cta disabled:opacity-50'

export const PermissionsSection = () => {
  const { t } = useTranslation()
  const healthStatus = useSyncExternalStore(subscribeHealthSync, getHealthSyncStatus)
  const background = useHealthBackgroundPermission()
  const notif = useNotifications()

  // Permisos del sistema: no aplican en web/PWA.
  if (!Capacitor.isNativePlatform()) return null

  const healthCopy =
    healthStatus === 'granted'
      ? t('ajustes.permisoSaludConcedido')
      : healthStatus === 'unavailable'
        ? t('ajustes.permisoSaludNoDisponible')
        : healthStatus === 'error'
          ? t('ajustes.permisoSaludError')
          : healthStatus === 'denied'
            ? t('ajustes.permisoSaludDenegado')
            : t('ajustes.permisoSaludComprobando')

  const widgetCopy = !background.available
    ? t('ajustes.permisoWidgetNoDisponible')
    : background.granted
      ? t('ajustes.permisoWidgetActivo')
      : t('ajustes.permisoWidgetInactivo')

  const notifGranted = notif.permission === 'granted'

  return (
    <section className={settingsGroupClass}>
      <SectionLabel>{t('ajustes.permisos')}</SectionLabel>
      <p className="pb-1 text-xs leading-snug text-muted">{t('ajustes.permisosDesc')}</p>

      <div className={settingsRowClass}>
        <div className="min-w-0">
          <p className="text-sm text-fg">{t('ajustes.permisoSalud')}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted">{healthCopy}</p>
        </div>
        {healthStatus === 'granted' ? (
          <Check className="size-4 shrink-0 text-success" aria-hidden />
        ) : (
          healthStatus !== 'unavailable' && (
            <button
              type="button"
              onClick={() => void connectHealthSync()}
              className={actionClass}
            >
              {healthStatus === 'error'
                ? t('ajustes.permisoSaludReintentar')
                : t('ajustes.permisoSaludConectar')}
            </button>
          )
        )}
      </div>

      <div className={`${settingsRowClass} border-t border-border/30`}>
        <div className="min-w-0">
          <p className="text-sm text-fg">{t('ajustes.permisoWidget')}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted">{widgetCopy}</p>
        </div>
        {!background.granted && background.available && (
          <button
            type="button"
            onClick={() => void background.request()}
            disabled={background.asking}
            className={actionClass}
          >
            {t('ajustes.permisoWidgetPermitir')}
          </button>
        )}
      </div>
      {/* Solo tiene sentido ofrecerlo cuando falta el permiso. */}
      {background.available && !background.granted && (
        <Toggle
          checked={background.prompt === 'never'}
          onChange={(v) => void background.updatePrompt(v ? 'never' : 'ask')}
          label={t('ajustes.permisoWidgetNoPreguntar')}
        />
      )}

      <div className={`${settingsRowClass} border-t border-border/30`}>
        <div className="min-w-0">
          <p className="text-sm text-fg">{t('ajustes.permisoNotificaciones')}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted">
            {notifGranted
              ? t('ajustes.permisoNotificacionesConcedidas')
              : t('ajustes.permisoNotificacionesBloqueadas')}
          </p>
        </div>
        {notifGranted ? (
          <Check className="size-4 shrink-0 text-success" aria-hidden />
        ) : notif.permission === 'denied' && canOpenSystemSettings() ? (
          <button
            type="button"
            onClick={() => void openNotificationSettings()}
            className={actionClass}
          >
            <Settings className="size-4" aria-hidden />
            {t('ajustes.notificacionesAbrirAjustes')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void notif.requestPermission()}
            className={actionClass}
          >
            {t('ajustes.permisoNotificacionesPermitir')}
          </button>
        )}
      </div>
    </section>
  )
}
