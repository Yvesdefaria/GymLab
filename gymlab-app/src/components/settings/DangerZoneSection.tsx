// Zona de peligro (Nocturno Minimal): último grupo de la pantalla, rojo y sin
// relleno; el aviso va antes de la acción para que no se pulse por reflejo.
// F112/112.1: reset de fábrica con backup sugerido (D3), type-to-confirm (D2)
// y aviso si hay sesión activa (D5).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { useFactoryReset } from '@/hooks/useFactoryReset'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { settingsGroupClass, settingsRowClass } from './SettingsUI'
import { ResetInfoSheet } from './ResetInfoSheet'
import { ResetConfirmSheet } from './ResetConfirmSheet'

export const DangerZoneSection = () => {
  const { t } = useTranslation()
  const [sheet, setSheet] = useState<'info' | 'confirm' | null>(null)
  const { run, busy, error, clearError } = useFactoryReset()
  // D5: aviso (no bloqueo) si hay una sesión empezada con ejercicios cargados.
  const hasActiveSession = useActiveWorkoutStore(
    (s) => s.startedAt !== null && s.exercises.length > 0
  )

  return (
    <section className={`${settingsGroupClass} border-danger/30`}>
      <h2 className="text-[10px] font-semibold uppercase leading-5 tracking-[0.2em] text-danger">
        {t('ajustes.zonaPeligro')}
      </h2>
      <p className="pb-1 pt-1 text-xs leading-relaxed text-muted">{t('ajustes.resetFabricaDesc')}</p>
      <button
        type="button"
        onClick={() => {
          clearError()
          setSheet('info')
        }}
        className={`${settingsRowClass} w-full text-left text-danger`}
      >
        <span>{t('ajustes.resetFabrica')}</span>
        <ChevronRight className="size-4 shrink-0" aria-hidden />
      </button>
      {sheet === 'info' && (
        <ResetInfoSheet
          hasActiveSession={hasActiveSession}
          onContinue={() => setSheet('confirm')}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'confirm' && (
        <ResetConfirmSheet
          busy={busy}
          error={error}
          onConfirm={() => void run()}
          onClose={() => {
            clearError()
            setSheet(null)
          }}
        />
      )}
    </section>
  )
}
