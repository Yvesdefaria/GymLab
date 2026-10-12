// Panel editable de la nota de sesión (F84): única fuente Workout.notes.
// Se muestra siempre: con texto, en edición o con la acción de añadir.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useWorkoutNote } from '@/hooks/useWorkoutNote'

type Props = { workoutId: number }

export const WorkoutNotePanel = ({ workoutId }: Props) => {
  const { t } = useTranslation()
  const { note, ready, failed, save } = useWorkoutNote(workoutId)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  const startEdit = () => {
    setDraft(note ?? '')
    setEditing(true)
  }

  // R3-001b: el rechazo del save deja de ser silencioso: se muestra error y el
  // editor queda abierto para reintentar.
  const handleSave = async () => {
    setSaving(true)
    setError(false)
    try {
      await save(draft)
      setEditing(false)
    } catch {
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div role="group" aria-label={t('session.notaTitulo')} className="panel-light rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="kicker">{t('session.notaTitulo')}</p>
        {ready && !editing && (
          <button
            type="button"
            onClick={startEdit}
            aria-label={note ? t('session.notaEditar') : t('session.notaAnadir')}
            className="relative flex size-11 items-center justify-center rounded-xl text-accent after:absolute after:-inset-1 after:content-['']"
          >
            <Pencil className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {editing ? (
        <div className="mt-1.5 space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('session.notaPlaceholder')}
            aria-label={t('session.notaAria')}
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void handleSave()} disabled={saving}>
              {t('session.notaGuardar')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setError(false)
                setEditing(false)
              }}
              disabled={saving}
            >
              {t('session.notaCancelar')}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-xs text-danger">
              {t('session.notaError')}
            </p>
          )}
        </div>
      ) : failed ? (
        // Sin nota legible no se muestra «vacía» (no sabemos si hay): aviso y
        // lápiz oculto (ready=false) para no arriesgar un clobber con el borrador.
        <p role="alert" className="mt-2 text-xs text-danger">
          {t('session.notaNoCargada')}
        </p>
      ) : note ? (
        <p className="mt-2 text-sm leading-relaxed text-fg">{note}</p>
      ) : (
        <p className="mt-2 text-sm text-muted">{t('session.notaVacia')}</p>
      )}
    </div>
  )
}
