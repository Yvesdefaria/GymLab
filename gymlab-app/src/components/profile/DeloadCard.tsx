// Control de deload: switch manual (marca la semana del programa activo) + score combinado
// de señales de fatiga (volumen, RPE, rendimiento, rachas, programación). Autocontenido.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InfoTip } from '@/components/ui/InfoTip'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useLiveList } from '@/hooks/useLiveList'
import { workoutSetRepo } from '@/data/repositories'
import { activeProgramRepo } from '@/data/repositories'
import { deloadUntilDate, isDeloadActive, calcDeloadScore } from '@/domain/deload'
import { addLocalDays, localDateOf, toLocalDateStr } from '@/domain/dates'
import type { Workout } from '@/domain/types'
import type { I18nKey } from '@/i18n'

type SignalKey = 'volumeDrop' | 'sustainedHighRpe' | 'performanceDrop' | 'consecutiveWeeks' | 'programScheduled'

const SIGNAL_KEYS: { key: SignalKey; i18n: I18nKey; max: number }[] = [
  { key: 'volumeDrop', i18n: 'perfil.deloadSeñalVolumen', max: 30 },
  { key: 'sustainedHighRpe', i18n: 'perfil.deloadSeñalRpe', max: 25 },
  { key: 'performanceDrop', i18n: 'perfil.deloadSeñalRendimiento', max: 25 },
  { key: 'consecutiveWeeks', i18n: 'perfil.deloadSeñalSemanas', max: 10 },
  { key: 'programScheduled', i18n: 'perfil.deloadSeñalPrograma', max: 10 },
]

// Barra individual de una señal: muestra el valor como fracción de su tope.
const SignalBar = ({ label, value, max }: { label: string; value: number; max: number }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const active = value > 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-bg">
        <div
          className={`h-full rounded-full transition-all ${active ? 'bg-cta' : 'bg-border'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-16 shrink-0 text-right text-[0.65rem] ${active ? 'text-fg' : 'text-muted'}`}>
        {label}
      </span>
    </div>
  )
}

export const DeloadCard = ({ workouts }: { workouts: Workout[] }) => {
  const { t } = useTranslation()
  const { program } = useActiveProgram()
  // El score solo consume series con createdAt dentro de 7/14 días; basta con leer
  // las de los workouts recientes en vez de clonar la tabla completa. Un día extra
  // de margen cubre el desfase entre localDate y createdAt por zona horaria.
  const recentIds = useMemo(() => {
    const cutoff = addLocalDays(toLocalDateStr(), -16)
    return workouts.filter((w) => localDateOf(w) > cutoff).map((w) => w.id)
  }, [workouts])
  const sets = useLiveList(() => workoutSetRepo.getByWorkoutIds(recentIds), [recentIds])
  const [busy, setBusy] = useState(false)

  const score = useMemo(
    () => (program ? calcDeloadScore(workouts, sets, program) : null),
    [workouts, sets, program],
  )
  const deloadActive = program ? isDeloadActive(program.deloadActive, program.deloadUntil) : false

  const handleToggle = async () => {
    if (!program) return
    setBusy(true)
    try {
      await activeProgramRepo.setDeload(!deloadActive, !deloadActive ? deloadUntilDate() : null)
    } finally {
      setBusy(false)
    }
  }

  if (!program || !score) return null

  const scoreCopy =
    score.overall >= 60
      ? t('perfil.deloadScoreAlto')
      : score.overall >= 40
        ? t('perfil.deloadScoreRecomendado')
        : t('perfil.deloadScoreBajo')

  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-semibold text-fg">{t('home.semanaDeDeload')}</p>
            <InfoTip label={t('home.deloadTipLabel')}>{t('home.deloadTipCuerpo')}</InfoTip>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {deloadActive ? t('home.deloadDescripcion') : scoreCopy}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={deloadActive}
          aria-label={t('home.activarSemanaDeload')}
          onClick={() => void handleToggle()}
          disabled={busy}
          className={`relative inline-flex h-11 w-14 shrink-0 items-center rounded-full border transition-colors disabled:opacity-60 ${
            deloadActive ? 'border-cta bg-cta/30' : 'border-border bg-bg'
          }`}
        >
          <span
            className={`inline-block size-6 rounded-full bg-cta shadow transition-transform ${
              deloadActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="mt-3 space-y-1.5 rounded-xl bg-bg/60 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted">
            {t('perfil.deloadScore')}
          </span>
          <span className="font-display text-base font-bold text-cta">{score.overall}/100</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {SIGNAL_KEYS.filter((s) => score.signals[s.key] > 0).map((s) => (
            <SignalBar key={s.key} label={t(s.i18n)} value={score.signals[s.key]} max={s.max} />
          ))}
        </div>
      </div>
    </section>
  )
}
