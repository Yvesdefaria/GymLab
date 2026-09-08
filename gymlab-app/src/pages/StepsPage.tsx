// Página /pasos (F84b): dashboard del contador de pasos. Compone el anillo de
// progreso, las 4 tarjetas de stats, el gráfico semanal, los logros y el heatmap
// mensual. Incluye un flujo mínimo de registro manual (recordSteps) que es la
// única vía de datos en PWA hasta que F84c añada los sensores.
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { AppHeader } from '../components/layout/AppHeader'
import { Button } from '../components/ui/Button'
import { StepCircularProgress } from '../components/steps/StepCircularProgress'
import { StepStats } from '../components/steps/StepStats'
import { StepWeekChart } from '../components/steps/StepWeekChart'
import { StepAchievements } from '../components/steps/StepAchievements'
import { StepHeatmap } from '../components/steps/StepHeatmap'
import { useStepData } from '@/hooks/useStepData'
import { useHealthSync } from '@/hooks/useHealthSync'
import { HealthSyncBanner } from '../components/steps/HealthSyncBanner'
import { StepDailyChallenge } from '../components/steps/StepDailyChallenge'

export const StepsPage = () => {
  const { t } = useTranslation()
  const { today, week, month, streak, heatmap, achievements, goal, recordSteps } = useStepData()
  const health = useHealthSync()

  const [showRecord, setShowRecord] = useState(false)
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState(false)

  const steps = today?.steps ?? 0
  const distanceKm = today?.distanceKm ?? 0
  const calories = today?.calories ?? 0

  // Guarda los pasos manuales y vuelve al estado por defecto con confirmación breve.
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const n = Math.round(Number(value))
    if (!Number.isFinite(n) || n <= 0) return
    await recordSteps(n)
    setValue('')
    setShowRecord(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2_500)
  }

  return (
    <div>
      <AppHeader title={t('steps.pageTitle')} subtitle={t('steps.subtitle')} />
      <div className="space-y-4 p-4">
        <HealthSyncBanner status={health.status} onAction={() => void health.connect()} />
        <StepDailyChallenge steps={steps} goal={goal} />
        <div className="flex flex-col items-center gap-3">
          <StepCircularProgress steps={steps} goal={goal} />

          {!today && !showRecord && !saved && (
            <p className="text-xs text-muted">{t('steps.empty')}</p>
          )}

          {saved ? (
            <p className="text-xs font-medium text-success" aria-live="polite">
              {t('steps.recorded')}
            </p>
          ) : showRecord ? (
            <form onSubmit={submit} className="flex items-end gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="step-record" className="text-xs text-muted">
                  {t('steps.recordLabel')}
                </label>
                <input
                  id="step-record"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={t('steps.recordPlaceholder')}
                  className="h-11 w-36 rounded-xl border border-border bg-bg-elevated px-3 text-sm text-fg placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-cta/50"
                />
              </div>
              <Button type="submit" variant="primary" size="sm" disabled={!value.trim()}>
                {t('steps.saveSteps')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRecord(false)
                  setValue('')
                }}
              >
                {t('steps.recordCancel')}
              </Button>
            </form>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setShowRecord(true)}>
              <Plus className="size-4" aria-hidden />
              {t('steps.recordAction')}
            </Button>
          )}
        </div>

        <StepStats steps={steps} distanceKm={distanceKm} calories={calories} streak={streak} />
        <StepWeekChart week={week} goal={goal} />
        <StepAchievements achievements={achievements} />
        <StepHeatmap month={month} heatmap={heatmap} />
      </div>
    </div>
  )
}