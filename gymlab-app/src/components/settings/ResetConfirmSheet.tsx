// Confirmación fuerte del reset (F112, 112.1): type-to-confirm BORRAR (D2) con
// estado busy/error reintentable (la transacción es atómica: o todo o nada).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'
import { matchesResetConfirmation, RESET_CONFIRMATION_WORD } from '@/domain/resetConfirmation'
import { haptics } from '@/lib/haptics'

interface ResetConfirmSheetProps {
  busy: boolean
  error: boolean
  onConfirm: () => void
  onClose: () => void
}

export const ResetConfirmSheet = ({ busy, error, onConfirm, onClose }: ResetConfirmSheetProps) => {
  const { t } = useTranslation()
  const [word, setWord] = useState('')
  const confirmed = matchesResetConfirmation(word)
  useCloseOnEscape(onClose)

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={t('ajustes.resetConfirmTitulo')}
        onClick={(e) => e.stopPropagation()}
        className="panel-floating w-full max-w-md rounded-t-3xl p-5 sm:rounded-3xl"
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-fg">{t('ajustes.resetConfirmTitulo')}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={t('layout.confirm.close')}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:text-accent-soft disabled:opacity-50"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <label htmlFor="reset-confirm-word" className="text-sm text-muted">
          {t('ajustes.resetConfirmInstruccion', { palabra: RESET_CONFIRMATION_WORD })}
        </label>
        <input
          id="reset-confirm-word"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          aria-label={t('ajustes.resetConfirmPalabraLabel')}
          className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg focus:border-danger focus:outline-none"
        />
        {error && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {t('ajustes.resetError')}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="danger"
            className="w-full"
            disabled={!confirmed || busy}
            onClick={() => {
              // Haptics del gesto destructivo (D2); no-op bajo reduced-motion.
              haptics(30)
              onConfirm()
            }}
          >
            {busy ? t('ajustes.resetEnProgreso') : t('ajustes.resetConfirmBoton')}
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose} disabled={busy}>
            {t('ajustes.cancelar')}
          </Button>
        </div>
      </div>
    </div>
  )
}
