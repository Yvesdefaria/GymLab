// Tab "Rachas" del perfil: racha actual, máxima, último entreno y próximo hito de insignia.
import { Calendar, Flame, Trophy } from 'lucide-react'
import { parseLocalDate } from '@/domain/dates'
import type { StreakResult } from '@/domain/types'

// Formatea YYYY-MM-DD a algo legible ("5 de agosto").
const formatDate = (dateStr: string) =>
  parseLocalDate(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })

export const RachasSection = ({ streak }: { streak: StreakResult }) => {
  const { currentStreak, longestStreak, lastWorkoutDate } = streak

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="panel rounded-2xl p-4">
          <Flame className="mb-2 size-5 text-cta" aria-hidden />
          <p className="kicker">Racha actual</p>
          <p className="stat-value text-2xl">{currentStreak > 0 ? `${currentStreak} días` : '—'}</p>
        </div>
        <div className="panel rounded-2xl p-4">
          <Trophy className="mb-2 size-5 text-cta" aria-hidden />
          <p className="kicker">Racha máxima</p>
          <p className="stat-value text-2xl">{longestStreak > 0 ? `${longestStreak} días` : '—'}</p>
        </div>
      </div>

      {lastWorkoutDate && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Calendar className="size-4 text-accent" aria-hidden />
          Último entreno: <strong className="text-fg">{formatDate(lastWorkoutDate)}</strong>
        </p>
      )}

      {currentStreak > 0 && currentStreak < 30 && (
        <p className="rounded-xl border border-gold/40 bg-cta/10 px-3 py-2 text-xs text-accent-soft">
          {currentStreak < 7
            ? `A ${7 - currentStreak} ${7 - currentStreak === 1 ? 'día' : 'días'} de la insignia de racha semanal.`
            : `A ${30 - currentStreak} ${30 - currentStreak === 1 ? 'día' : 'días'} de la insignia de racha mensual.`}
        </p>
      )}
      {currentStreak === 0 && lastWorkoutDate && (
        <p className="text-sm text-muted">
          Tu racha se rompió. Entrena hoy para volver a encender la llama.
        </p>
      )}
      {currentStreak === 0 && !lastWorkoutDate && (
        <p className="text-sm text-muted">Registra tu primer entreno para empezar tu racha.</p>
      )}
    </div>
  )
}
