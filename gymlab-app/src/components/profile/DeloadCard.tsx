// Control de deload: switch manual (marca la semana del programa activo) + recomendación
// automática si las últimas 3 semanas cayeron de volumen. Autocontenido con useActiveProgram.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InfoTip } from '@/components/ui/InfoTip'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { activeProgramRepo } from '@/data/repositories'
import { deloadUntilDate, isDeloadActive } from '@/domain/deload'
import { detectDeloadSignal } from '@/domain/progress'
import type { Workout } from '@/domain/types'

export const DeloadCard = ({ workouts }: { workouts: Workout[] }) => {
  const { t } = useTranslation()
  const { program } = useActiveProgram()
  const [busy, setBusy] = useState(false)

  const deload = useMemo(() => detectDeloadSignal(workouts), [workouts])
  const deloadActive = program ? isDeloadActive(program.deloadActive, program.deloadUntil) : false

  // Marca la semana actual como deload dentro del programa activo.
  const handleToggle = async () => {
    if (!program) return
    setBusy(true)
    try {
      await activeProgramRepo.setDeload(!deloadActive, !deloadActive ? deloadUntilDate() : null)
    } finally {
      setBusy(false)
    }
  }

  if (!program) return null

  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-semibold text-fg">{t('home.semanaDeDeload')}</p>
            <InfoTip label={t('home.deloadTipLabel')}>{t('home.deloadTipCuerpo')}</InfoTip>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {deload?.suggestsDeload
              ? t('perfil.deloadTexto', { pct: Math.round(deload.dropPct) })
              : t('home.deloadDescripcion')}
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
    </section>
  )
}