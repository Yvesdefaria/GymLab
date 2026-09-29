// Sheet informativo previo al reset (F112, 112.1): lista lo que se borra, avisa si
// hay sesión activa (D5) y ofrece backup primario + continuar sin backup (D3).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'
import { downloadBackup, exportBackup } from '@/data/backup'
import { track } from '@/lib/telemetry'

const RESET_ITEM_KEYS = [
  'resetItemEntrenos',
  'resetItemMedidasFotos',
  'resetItemPasos',
  'resetItemNutricion',
  'resetItemSuplementos',
  'resetItemLogros',
  'resetItemRutinas',
  'resetItemAjustesPerfil',
] as const

interface ResetInfoSheetProps {
  hasActiveSession: boolean
  onContinue: () => void
  onClose: () => void
}

export const ResetInfoSheet = ({ hasActiveSession, onContinue, onClose }: ResetInfoSheetProps) => {
  const { t } = useTranslation()
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupError, setBackupError] = useState(false)
  useCloseOnEscape(onClose)

  const handleBackup = async () => {
    setBackupBusy(true)
    setBackupError(false)
    try {
      // La entrega NO se verifica: el copy pide guardar el archivo antes de continuar.
      await downloadBackup(await exportBackup())
      track('data_exported', {})
    } catch {
      setBackupError(true)
    } finally {
      setBackupBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={t('ajustes.resetTitulo')}
        onClick={(e) => e.stopPropagation()}
        className="panel-floating w-full max-w-md rounded-t-3xl p-5 sm:rounded-3xl"
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-fg">{t('ajustes.resetTitulo')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('layout.confirm.close')}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:text-accent-soft"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <p className="text-sm text-muted">{t('ajustes.resetAvisoBackup')}</p>
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted">
          {RESET_ITEM_KEYS.map((key) => (
            <li key={key}>{t(`ajustes.${key}`)}</li>
          ))}
        </ul>
        {hasActiveSession && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-2 text-xs text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('ajustes.resetAvisoSesion')}
          </p>
        )}
        {backupError && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {t('ajustes.resetBackupError')}
          </p>
        )}
        <p className="mt-3 text-xs text-muted">{t('ajustes.resetBackupAviso')}</p>
        <div className="mt-2 flex flex-col gap-2">
          <Button className="w-full" onClick={() => void handleBackup()} disabled={backupBusy}>
            <Download className="size-4" aria-hidden />
            {t('ajustes.resetDescargarBackup')}
          </Button>
          <Button variant="outline" className="w-full" onClick={onContinue} disabled={backupBusy}>
            {t('ajustes.resetContinuar')}
          </Button>
        </div>
      </div>
    </div>
  )
}
