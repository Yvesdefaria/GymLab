// Nota libre de la sesión activa (F98.1): escribe en activeWorkoutStore y el
// persist diferido del 91.2 (400 ms + flush al ocultar) la guarda sin más plumbing.
import { useTranslation } from 'react-i18next'
import { NotebookPen } from 'lucide-react'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'

// Suscripción al store en la hoja: cada tecla re-renderiza solo este textarea,
// no la página ni los bloques (memoización del 91.2 intacta).
export const SessionHeaderNote = () => {
  const { t } = useTranslation()
  const sessionNote = useActiveWorkoutStore((s) => s.sessionNote)
  const setSessionNote = useActiveWorkoutStore((s) => s.setSessionNote)

  return (
    <div>
      <span className="kicker flex items-center gap-1.5 text-muted">
        <NotebookPen className="size-4 text-accent-soft" aria-hidden />
        {t('session.notaTitulo')}
      </span>
      <textarea
        value={sessionNote}
        onChange={(e) => setSessionNote(e.target.value)}
        placeholder={t('session.notaPlaceholder')}
        aria-label={t('session.notaAria')}
        rows={2}
        className="mt-1.5 w-full resize-none rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
      />
    </div>
  )
}
