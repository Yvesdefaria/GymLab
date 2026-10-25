// Notificaciones (Nocturno Minimal): filas hairline, la hora como campo plano.
import { useTranslation } from 'react-i18next'
import { useSettings } from '@/hooks/useSettings'
import { useNotifications } from '@/hooks/useNotifications'
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
            <p className="pb-1 text-xs text-danger">{t('ajustes.notificacionesPermisoDenegado')}</p>
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
