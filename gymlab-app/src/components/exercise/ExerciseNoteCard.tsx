// Bloque «Mi nota» de la ficha: textarea hairline; la persistencia vive en el hook de la página.
import { useTranslation } from 'react-i18next'

export const ExerciseNoteCard = ({
  note,
  onChange,
}: {
  note: string
  onChange: (value: string) => void
}) => {
  const { t } = useTranslation()
  return (
    <section className="border-t border-border/40 pt-4">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {t('ejercicios.detalle.miNota')}
      </h2>
      <textarea
        value={note}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={t('ejercicios.detalle.notaPlaceholder')}
        aria-label={t('ejercicios.detalle.notaAria')}
        className="mt-2 w-full rounded-xl border border-border/60 bg-bg-elevated/30 px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
      />
      <p className="mt-1 text-[10px] text-muted">{t('ejercicios.detalle.notaAyuda')}</p>
    </section>
  )
}
