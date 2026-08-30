// Tarjeta «Mi nota» de la ficha: textarea con ayuda; la persistencia vive en el hook de la página.
import { useTranslation } from 'react-i18next'
import { StickyNote } from 'lucide-react'

export const ExerciseNoteCard = ({
  note,
  onChange,
}: {
  note: string
  onChange: (value: string) => void
}) => {
  const { t } = useTranslation()
  return (
    <div className="panel-light rounded-2xl p-4">
      <div className="mb-2 flex items-center gap-2">
        <StickyNote className="size-5 text-accent" />
        <span className="font-display text-sm font-semibold text-accent">{t('ejercicios.detalle.miNota')}</span>
      </div>
      <textarea
        value={note}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={t('ejercicios.detalle.notaPlaceholder')}
        aria-label={t('ejercicios.detalle.notaAria')}
        className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
      />
      <p className="mt-1 text-xs text-muted">{t('ejercicios.detalle.notaAyuda')}</p>
    </div>
  )
}