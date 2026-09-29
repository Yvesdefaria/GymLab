// Zona de peligro de Ajustes (F112, 112.1): reset de fábrica con backup sugerido
// (D3), type-to-confirm BORRAR (D2) y aviso si hay sesión activa (D5).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useFactoryReset } from '@/hooks/useFactoryReset'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { SectionLabel } from './SettingsUI'
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
    <section className="panel-light rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-danger" aria-hidden />
        <SectionLabel>{t('ajustes.zonaPeligro')}</SectionLabel>
      </div>
      <p className="mt-2 text-xs text-muted">{t('ajustes.resetFabricaDesc')}</p>
      <Button
        variant="outline"
        className="mt-2 w-full border-danger/50 text-danger hover:border-danger"
        onClick={() => {
          clearError()
          setSheet('info')
        }}
      >
        {t('ajustes.resetFabrica')}
      </Button>
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
