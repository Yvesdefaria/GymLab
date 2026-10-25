// F132.4: sheet controlado de alta/edición de objetivo. El picker vive fuera
// (la página desmonta este sheet mientras elige: ExercisePicker es z-100 y el
// BottomSheet z-120, así que no pueden convivir).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Trash2 } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { DecimalInput } from '@/components/ui/DecimalInput'
import { formatUnits, type Units } from '@/domain/settings'
import type { Exercise } from '@/domain/types'

interface GoalSheetProps {
  mode: 'create' | 'edit'
  exercise: Exercise | null
  target: number | undefined
  units: Units
  onTargetChange: (value: number | undefined) => void
  onOpenPicker: () => void
  onSave: () => void
  onDelete?: () => void
  onClose: () => void
}

export const GoalSheet = ({
  mode,
  exercise,
  target,
  units,
  onTargetChange,
  onOpenPicker,
  onSave,
  onDelete,
  onClose,
}: GoalSheetProps) => {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const unit = formatUnits(units)
  const canSave = Boolean(exercise) && target !== undefined && target > 0

  return (
    <>
      <BottomSheet
        title={mode === 'edit' ? t('goalSetter.edit') : t('goalSetter.new')}
        onClose={onClose}
      >
        <div className="mt-3">
          <p className="kicker">{t('goalSetter.exercise')}</p>
          <button
            type="button"
            onClick={onOpenPicker}
            disabled={mode === 'edit'}
            aria-haspopup="dialog"
            className="mt-1 flex min-h-[44px] w-full items-center justify-between gap-2 border-b border-border/40 text-left text-sm text-fg disabled:opacity-60"
          >
            <span className="truncate">
              {exercise ? exercise.name : t('goalSetter.selectExercise')}
            </span>
            {mode === 'create' && (
              <Search className="size-4 shrink-0 text-muted" aria-hidden />
            )}
          </button>

          <div className="mt-3">
            <p className="kicker">{t('goalSetter.targetPlaceholder', { unit })}</p>
            <DecimalInput
              value={target}
              onChange={onTargetChange}
              placeholder={t('goalSetter.targetPlaceholder', { unit })}
              className="mt-1 w-full border-b border-border/40 bg-transparent py-2 font-display text-2xl text-fg focus:outline-none"
              ariaLabel={t('goalSetter.targetPlaceholder', { unit })}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="outline" size="md" onClick={onClose}>
            {t('goalSetter.cancel')}
          </Button>
          <Button variant="primary" size="md" onClick={onSave} disabled={!canSave}>
            {t('goalSetter.save')}
          </Button>
        </div>

        {mode === 'edit' && onDelete && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 text-xs text-danger"
          >
            <Trash2 className="size-3.5" aria-hidden />
            {t('goalSetter.delete')}
          </button>
        )}
      </BottomSheet>

      {confirming && onDelete && (
        <ConfirmSheet
          title={t('goalSetter.delete')}
          message={t('goalSetter.deleteConfirm')}
          destructive
          onConfirm={() => {
            setConfirming(false)
            onDelete()
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  )
}
