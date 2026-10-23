// Menú de acciones poco frecuentes de /pasos. Es la única entrada al alta manual
// y a la edición de la meta: no hay botón protagonista en la página.
import { useTranslation } from 'react-i18next'
import { ChevronRight, Plus, Target } from 'lucide-react'
import { StepSheet } from './StepSheet'
import { Button } from '../ui/Button'
import type { AppLanguage } from '@/domain/onboarding'
import { formatStepNumber } from '@/lib/intl'

type StepOptionsSheetProps = {
  open: boolean
  goal: number
  onClose: () => void
  onManual: () => void
  onGoal: () => void
}

export const StepOptionsSheet = ({
  open,
  goal,
  onClose,
  onManual,
  onGoal,
}: StepOptionsSheetProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  return (
    <StepSheet
      open={open}
      title={t('steps.menuTitle')}
      subtitle={t('steps.menuSubtitle')}
      onClose={onClose}
    >
      <div className="mt-2">
        <button
          type="button"
          onClick={onManual}
          className="flex w-full items-center gap-3 border-t border-border/40 py-3 text-left"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-gold/10 text-gold">
            <Plus className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-fg">
              {t('steps.menuManual')}
            </span>
            <span className="block text-[9px] text-muted">
              {t('steps.menuManualHint')}
            </span>
          </span>
          <ChevronRight className="size-4 text-muted" aria-hidden />
        </button>

        <button
          type="button"
          onClick={onGoal}
          className="flex w-full items-center gap-3 border-t border-border/40 py-3 text-left"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-gold/10 text-gold">
            <Target className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-fg">
              {t('steps.menuGoal')}
            </span>
            <span className="block text-[9px] text-muted">
              {t('steps.menuGoalHint', { goal: formatStepNumber(goal, lang) })}
            </span>
          </span>
          <ChevronRight className="size-4 text-muted" aria-hidden />
        </button>
      </div>

      <div className="mt-3">
        <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
          {t('steps.cancel')}
        </Button>
      </div>
    </StepSheet>
  )
}
