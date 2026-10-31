// Notificaciones (Nocturno Minimal): filas hairline, la hora como campo plano.
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useNotifications } from '@/hooks/useNotifications'
import { canOpenSystemSettings, openNotificationSettings } from '@/data/appSettings'
import { SectionLabel, Toggle, settingsGroupClass, settingsRowClass } from './SettingsUI'

export const NotificationsSection = () => {
  const { t } = useTranslation()
  const { settings, update } = useSettings()
  const notif = useNotifications()

  return (
    <section className={settingsGroupClass}>
      <SectionLabel>{t('ajustes.notificaciones')}</SectionLabel>
      <Toggle
        checked={settings.notificationsEnabled}
        onChange={async (v) => {
          if (v && notif.isSupported && notif.permission !== 'granted') {
            const granted = await notif.requestPermission()
            if (!granted) return
          }
          void update({ notificationsEnabled: v })
        }}
        label={t('ajustes.notificacionesActivar')}
        description={t('ajustes.notificacionesActivarDesc')}
      />
      {settings.notificationsEnabled && (
        <>
          {notif.permission === 'denied' && (
            <div className="pb-1">
              <p className="text-xs text-danger">{t('ajustes.notificacionesPermisoDenegado')}</p>
              {/* Android no puede volver a pedir el permiso: el botón lleva a Ajustes. */}
              {canOpenSystemSettings() && (
                <button
                  type="button"
                  onClick={() => void openNotificationSettings()}
                  className="mt-1 flex min-h-11 items-center gap-2 text-xs font-medium text-cta"
                >
                  <Settings className="size-4" aria-hidden />
                  {t('ajustes.notificacionesAbrirAjustes')}
                </button>
              )}
            </div>
          )}
          <div className={`${settingsRowClass} border-t border-border/30`}>
            <div className="min-w-0">
              <p className="text-sm text-fg">{t('ajustes.recordatorioEntreno')}</p>
              <p className="mt-0.5 text-xs text-muted">{t('ajustes.recordatorioHora')}</p>
            </div>
            <input
              type="time"
              value={`${String(settings.trainingReminderHour).padStart(2, '0')}:${String(settings.trainingReminderMinute).padStart(2, '0')}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number)
                void update({ trainingReminderHour: h ?? 18, trainingReminderMinute: m ?? 0 })
              }}
              className="h-11 shrink-0 border-0 border-b border-border/50 bg-transparent px-1 text-right text-sm tabular-nums text-fg focus:border-cta focus:outline-none"
            />
          </div>
          <Toggle
            checked={settings.streakReminder}
            onChange={(v) => void update({ streakReminder: v })}
            label={t('ajustes.recordatorioRacha')}
            description={t('ajustes.recordatorioRachaDesc')}
          />
          <Toggle
            checked={settings.inactivityReminder}
            onChange={(v) => void update({ inactivityReminder: v })}
            label={t('ajustes.recordatorioInactividad')}
            description={t('ajustes.recordatorioInactividadDesc')}
          />
        </>
      )}
    </section>
  )
}
