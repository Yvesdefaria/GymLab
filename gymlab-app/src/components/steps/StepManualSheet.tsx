// Sheet de alta manual de /pasos: reemplaza el total de hoy (no suma) y no crea
// detalle horario. Vive escondido detrás del menú «⋯» del header.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StepSheet } from './StepSheet'
import { Button } from '../ui/Button'
import type { AppLanguage } from '@/domain/onboarding'
import { MANUAL_STEPS_MAX, parseManualSteps } from '@/domain/stepAnalytics'
import { formatStepNumber } from '@/lib/intl'

type StepManualSheetProps = {
  open: boolean
  currentSteps: number
  onClose: () => void
  onSave: (value: number) => Promise<void> | void
}

export const StepManualSheet = ({
  open,
  currentSteps,
  onClose,
  onSave,
}: StepManualSheetProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [value, setValue] = useState(String(currentSteps))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setValue(String(currentSteps))
      setBusy(false)
    }
  }, [open, currentSteps])

  const parsed = parseManualSteps(value)
  const errorText =
    parsed.error === 'empty'
      ? t('steps.manualErrorEmpty')
      : parsed.error === 'max'
        ? t('steps.manualErrorMax', {
            max: formatStepNumber(MANUAL_STEPS_MAX, lang),
          })
        : null
  const displayValue = value === '' ? '' : formatStepNumber(Number(value), lang)

  const save = async () => {
    if (parsed.value === null || parsed.error) return
    setBusy(true)
    try {
      await onSave(parsed.value)
    } finally {
      setBusy(false)
    }
  }

  return (
    <StepSheet
      open={open}
      title={t('steps.manualTitle')}
      subtitle={t('steps.manualSubtitle')}
      onClose={onClose}
    >
      <label
        className={`mt-3 block rounded-xl border px-3 py-2 ${
          errorText
            ? 'border-danger/70 bg-danger/5'
            : 'border-border/60 bg-bg-elevated/40'
        }`}
      >
        <span className="text-[8px] uppercase tracking-[0.12em] text-muted">
          {t('steps.manualField')}
        </span>
        <input
          inputMode="numeric"
          autoComplete="off"
          aria-label={t('steps.manualField')}
          aria-invalid={Boolean(errorText)}
          aria-describedby={errorText ? 'step-manual-error' : undefined}
          value={displayValue}
          onChange={(event) =>
            setValue(event.target.value.replace(/\D/g, '').slice(0, 6))
          }
          className="w-full bg-transparent font-display text-2xl tabular-nums text-fg outline-none"
        />
      </label>

      {errorText ? (
        <p id="step-manual-error" role="alert" className="mt-1.5 text-[10px] text-danger">
          {errorText}
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onClose} disabled={busy}>
          {t('steps.cancel')}
        </Button>
        <Button
          variant="flat"
          size="sm"
          className="flex-1"
          onClick={() => void save()}
          disabled={Boolean(errorText) || busy}
        >
          {t('steps.manualSave')}
        </Button>
      </div>
    </StepSheet>
  )
}
