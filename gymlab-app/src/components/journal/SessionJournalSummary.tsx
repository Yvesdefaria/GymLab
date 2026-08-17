// Resumen de la bitácora post-entreno: muestra los 4 indicadores en el detalle de sesión.
import { useTranslation } from 'react-i18next'
import { useSessionJournal } from '@/hooks/useSessionJournal'

type Props = {
  workoutId: number
}

// Emoji visual para cada nivel de rating (1-5).
const RATING_COLORS: Record<number, string> = {
  1: 'text-danger',
  2: 'text-cta/70',
  3: 'text-muted',
  4: 'text-success/70',
  5: 'text-success',
}

// Barra visual de un rating: muestra el valor con color semántico.
const RatingPill = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted">{label}</span>
    <span className={`font-display font-semibold ${RATING_COLORS[value] ?? 'text-fg'}`}>
      {value}/5
    </span>
  </div>
)

// Resumen de la bitácora: solo se renderiza si hay entrada para ese workout.
export const SessionJournalSummary = ({ workoutId }: Props) => {
  const { t } = useTranslation()
  const { entry } = useSessionJournal(workoutId)

  if (!entry) return null

  return (
    <div className="panel-light rounded-2xl p-4">
      <p className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
        {t('journal.titulo')}
      </p>
      <div className="space-y-2">
        <RatingPill label={t('journal.resumenEnergia')} value={entry.energy} />
        <RatingPill label={t('journal.resumenSueno')} value={entry.sleep} />
        <RatingPill label={t('journal.resumenAnimo')} value={entry.mood} />
        <RatingPill label={t('journal.resumenDolor')} value={entry.soreness} />
      </div>
      {entry.note && (
        <p className="mt-3 text-xs leading-relaxed text-muted">{entry.note}</p>
      )}
    </div>
  )
}
