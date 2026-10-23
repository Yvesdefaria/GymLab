// Sheet de meta diaria de /pasos: input entero, rango 1.000–50.000, atajos y
// validación visible. Guardar se deshabilita con un valor inválido.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StepSheet } from './StepSheet'
import { Button } from '../ui/Button'
import type { AppLanguage } from '@/domain/onboarding'
import {
  STEP_GOAL_MAX,
  STEP_GOAL_MIN,
  parseStepGoal,
} from '@/domain/stepAnalytics'
import { formatStepNumber } from '@/lib/intl'

type StepGoalSheetProps = {
  open: boolean
  goal: number
  onClose: () => void
  onSave: (value: number) => Promise<void> | void
}

const QUICK_GOALS = [5_000, 7_000, 10_000, 20_000]

export const StepGoalSheet = ({ open, goal, onClose, onSave }: StepGoalSheetProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [value, setValue] = useState(String(goal))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setValue(String(goal))
      setBusy(false)
    }
  }, [open, goal])

  const parsed = parseStepGoal(value)
  const errorText =
    parsed.error === 'empty'
      ? t('steps.goalErrorEmpty')
      : parsed.error === 'min'
        ? t('steps.goalErrorMin', { min: formatStepNumber(STEP_GOAL_MIN, lang) })
        : parsed.error === 'max'
          ? t('steps.goalErrorMax', { max: formatStepNumber(STEP_GOAL_MAX, lang) })
          : null
  const displayValue = value === '' ? '' : formatStepNumber(Number(value), lang)

  const save = async () => {
    if (!parsed.value || parsed.error) return
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
      title={t('steps.goalTitle')}
      subtitle={t('steps.goalSubtitle')}
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
          {t('steps.goalField')}
        </span>
        <input
          inputMode="numeric"
          autoComplete="off"
          aria-label={t('steps.goalField')}
          aria-invalid={Boolean(errorText)}
          aria-describedby={errorText ? 'step-goal-error' : 'step-goal-range'}
          value={displayValue}
          onChange={(event) =>
            setValue(event.target.value.replace(/\D/g, '').slice(0, 6))
          }
          className="w-full bg-transparent font-display text-2xl tabular-nums text-fg outline-none"
        />
      </label>

      {errorText ? (
        <p id="step-goal-error" role="alert" className="mt-1.5 text-[10px] text-danger">
          {errorText}
        </p>
      ) : (
        <p id="step-goal-range" className="mt-1.5 text-[9.5px] text-muted">
          {t('steps.goalRange', {
            min: formatStepNumber(STEP_GOAL_MIN, lang),
            max: formatStepNumber(STEP_GOAL_MAX, lang),
          })}
        </p>
      )}

      <div className="mt-2.5 flex gap-1.5">
        {QUICK_GOALS.map((quick) => {
          const selected = Number(value) === quick
          return (
            <button
              key={quick}
              type="button"
              onClick={() => setValue(String(quick))}
              aria-pressed={selected}
              className={`flex-1 rounded-lg border py-1.5 text-[10px] tabular-nums ${
                selected
                  ? 'border-gold/50 bg-gold/10 text-gold-bright'
                  : 'border-border/40 text-muted'
              }`}
            >
              {formatStepNumber(quick, lang)}
            </button>
          )
        })}
      </div>

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
          {t('steps.goalSave')}
        </Button>
      </div>
    </StepSheet>
  )
}
