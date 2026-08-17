// Hoja modal post-entreno para registrar energía, sueño, ánimo y dolor muscular.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSessionJournal } from '@/hooks/useSessionJournal'

type RatingValue = 1 | 2 | 3 | 4 | 5

type Props = {
  workoutId: number
  onClose: () => void
}

// Barra de rating con 5 botones de nivel (1-5) y label descriptivo.
const RatingBar = ({
  label,
  value,
  onChange,
  levels,
}: {
  label: string
  value: RatingValue
  onChange: (v: RatingValue) => void
  levels: string[]
}) => (
  <div>
    <p className="mb-1.5 font-display text-sm font-semibold text-fg">{label}</p>
    <div className="flex gap-2">
      {([1, 2, 3, 4, 5] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-label={`${levels[v - 1]} (${v}/5)`}
          className={`flex h-10 flex-1 items-center justify-center rounded-xl border text-xs font-medium transition-all ${
            v === value
              ? 'border-cta bg-cta/15 text-accent-soft'
              : 'border-border bg-bg-elevated text-muted hover:border-cta/50'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
    <p className="mt-1 text-center text-[0.65rem] text-muted">{levels[value - 1]}</p>
  </div>
)

// Sheet accesible con sliders 1-5 para los 4 indicadores y nota libre opcional.
export const SessionJournalSheet = ({ workoutId, onClose }: Props) => {
  const { t } = useTranslation()
  const { entry, save } = useSessionJournal(workoutId)
  const [energy, setEnergy] = useState<RatingValue>(3)
  const [sleep, setSleep] = useState<RatingValue>(3)
  const [mood, setMood] = useState<RatingValue>(3)
  const [soreness, setSoreness] = useState<RatingValue>(3)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Precarga si ya existe una entrada (edición).
  useEffect(() => {
    if (entry) {
      setEnergy(entry.energy)
      setSleep(entry.sleep)
      setMood(entry.mood)
      setSoreness(entry.soreness)
      setNote(entry.note ?? '')
    }
  }, [entry])

  // Cierra con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSave = async () => {
    setSaving(true)
    await save({ energy, sleep, mood, soreness, note: note.trim() || undefined })
    setSaving(false)
    onClose()
  }

  const nivelLabels = [
    t('journal.nivel1'),
    t('journal.nivel2'),
    t('journal.nivel3'),
    t('journal.nivel4'),
    t('journal.nivel5'),
  ]

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('journal.titulo')}
        onClick={(e) => e.stopPropagation()}
        className="panel-floating w-full max-w-md p-5 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-fg">{t('journal.titulo')}</h2>
            <p className="text-xs text-muted">{t('journal.subtitulo')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('layout.confirm.close')}
            className="relative flex size-10 items-center justify-center rounded-xl border border-border text-muted after:absolute after:-inset-1 after:content-[''] hover:text-fg"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <RatingBar
            label={t('journal.energia')}
            value={energy}
            onChange={setEnergy}
            levels={nivelLabels}
          />
          <RatingBar
            label={t('journal.sueno')}
            value={sleep}
            onChange={setSleep}
            levels={nivelLabels}
          />
          <RatingBar
            label={t('journal.animo')}
            value={mood}
            onChange={setMood}
            levels={nivelLabels}
          />
          <RatingBar
            label={t('journal.dolor')}
            value={soreness}
            onChange={setSoreness}
            levels={nivelLabels}
          />

          <div>
            <label htmlFor="journal-note" className="mb-1 block font-display text-sm font-semibold text-fg">
              {t('journal.nota')}
            </label>
            <textarea
              id="journal-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('journal.notaPlaceholder')}
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" size="md" onClick={onClose}>
            {t('journal.omitir')}
          </Button>
          <Button variant="primary" size="md" onClick={() => void handleSave()} disabled={saving}>
            {t('journal.guardar')}
          </Button>
        </div>
      </div>
    </div>
  )
}
