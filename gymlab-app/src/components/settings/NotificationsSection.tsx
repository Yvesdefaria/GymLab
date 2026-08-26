import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useNotifications } from '@/hooks/useNotifications'
import { SectionLabel, Toggle } from './SettingsUI'

export const NotificationsSection = () => {
  const { t } = useTranslation()
  const { settings, update } = useSettings()
  const notif = useNotifications()

  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-accent" aria-hidden />
        <SectionLabel>{t('ajustes.notificaciones')}</SectionLabel>
      </div>
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
            <p className="text-xs text-danger">{t('ajustes.notificacionesPermisoDenegado')}</p>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg">{t('ajustes.recordatorioEntreno')}</p>
              <p className="mt-0.5 text-xs text-muted">{t('ajustes.recordatorioHora')}</p>
            </div>
            <input
              type="time"
              value={`${String(settings.trainingReminderHour).padStart(2, '0')}:${String(settings.trainingReminderMinute).padStart(2, '0')}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number)
                void update({ trainingReminderHour: h ?? 18, trainingReminderMinute: m ?? 0 })
              }}
              className="h-9 rounded-lg border border-border bg-bg-elevated px-2 text-sm text-fg"
            />
          </div>
          <Toggle checked={settings.streakReminder} onChange={(v) => void update({ streakReminder: v })} label={t('ajustes.recordatorioRacha')} description={t('ajustes.recordatorioRachaDesc')} />
          <Toggle checked={settings.inactivityReminder} onChange={(v) => void update({ inactivityReminder: v })} label={t('ajustes.recordatorioInactividad')} description={t('ajustes.recordatorioInactividadDesc')} />
        </>
      )}
    </section>
  )
}
