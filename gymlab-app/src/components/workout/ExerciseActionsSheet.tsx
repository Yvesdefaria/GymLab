// F132.2/B2 — acciones del ejercicio concentradas en un solo ⋯: técnica,
// calentamiento, finalizar y quitar. Reemplaza los tres iconos sueltos del header.
import { CheckCheck, ClipboardCheck, Flame, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/BottomSheet'

type Props = {
  exerciseName: string
  warmupKg: number
  canFinish: boolean
  onTechnique: () => void
  onWarmup?: (weightKg: number) => void
  onFinish?: () => void
  onRemove: () => void
  onClose: () => void
}

const Row = ({
  icon,
  label,
  onClick,
  danger = false,
  ariaLabel,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
  ariaLabel?: string
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel ?? label}
    className={`flex min-h-14 w-full items-center gap-3 border-t border-border/40 py-2 text-left first:border-t-0 ${
      danger ? 'text-danger' : 'text-fg'
    }`}
  >
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
        danger ? 'bg-danger/10 text-danger' : 'bg-gold/10 text-gold'
      }`}
    >
      {icon}
    </span>
    <span className="min-w-0 flex-1 text-sm">{label}</span>
  </button>
)

export const ExerciseActionsSheet = ({
  exerciseName,
  warmupKg,
  canFinish,
  onTechnique,
  onWarmup,
  onFinish,
  onRemove,
  onClose,
}: Props) => {
  const { t } = useTranslation()
  return (
    <BottomSheet title={exerciseName} subtitle={t('workout.accionesEjercicio')} onClose={onClose}>
      <div className="mt-2">
        <Row
          icon={<ClipboardCheck className="size-4" aria-hidden />}
          label={t('workout.tecnicaAria')}
          onClick={onTechnique}
        />
        {onWarmup && warmupKg > 0 && (
          <Row
            icon={<Flame className="size-4" aria-hidden />}
            label={t('workout.agregarCalentamientoAria')}
            ariaLabel={t('workout.agregarCalentamientoAria')}
            onClick={() => onWarmup(warmupKg)}
          />
        )}
        {canFinish && onFinish && (
          <Row
            icon={<CheckCheck className="size-4" aria-hidden />}
            label={t('workout.finalizarEjercicio')}
            onClick={onFinish}
          />
        )}
        <Row
          icon={<Trash2 className="size-4" aria-hidden />}
          label={t('workout.eliminarEjercicio')}
          onClick={onRemove}
          danger
        />
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted">{t('workout.eliminarSerieHint')}</p>
    </BottomSheet>
  )
}
