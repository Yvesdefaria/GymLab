// Benchmark tests: tests de fuerza con percentil, mejora y recordatorio de re-test.
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dumbbell, TrendingUp, TrendingDown, AlertTriangle, Plus } from 'lucide-react'
import { shouldRetest, calcImprovement, getLatest, RECOMMENDED_WEEKS_BETWEEN_TESTS, type BenchmarkExercise } from '@/domain/benchmark'
import { getStrengthPercentile, getStrengthLevel } from '@/domain/strengthStandards'
import { StrengthGauge } from '@/components/strength/StrengthGauge'
import { useSettings } from '@/hooks/useSettings'
import { formatWeight, parseWeightToKg } from '@/domain/settings'
import type { BenchmarkResult } from '@/domain/types'

const exercises: BenchmarkExercise[] = ['sentadilla', 'banca', 'peso_muerto', 'press_militar']

const LEVEL_COLORS: Record<string, string> = {
  principiante: 'text-muted',
  intermedio: 'text-accent',
  avanzado: 'text-success',
  elite: 'text-gold',
}

const LEVEL_LABELS: Record<string, string> = {
  principiante: 'principiante',
  intermedio: 'intermedio',
  avanzado: 'avanzado',
  elite: 'elite',
}

interface BenchmarkExerciseCardProps {
  exercise: BenchmarkExercise
  results: BenchmarkResult[]
}

const BenchmarkExerciseCard = ({ exercise, results }: BenchmarkExerciseCardProps) => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const latest = getLatest(results, exercise)
  const prev = latest
    ? results.find((r) => r.exercise === exercise && r.testedAt < latest.testedAt) ?? null
    : null
  const improvement = latest ? calcImprovement(latest, prev) : null
  const needsRetest = latest ? shouldRetest(latest.testedAt) : true

  const bw = latest?.bodyWeightKg ?? 80
  const percentile = latest ? getStrengthPercentile(exercise, latest.e1rm, bw) : null
  const level = latest ? getStrengthLevel(exercise, latest.e1rm, bw) : null

  return (
    <div className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[0.65rem] font-semibold text-fg">
          {t(`benchmark.exercise.${exercise}` as any)}
        </p>
        {needsRetest && (
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[0.5rem] font-medium text-accent">
            {t('benchmark.retest')}
          </span>
        )}
      </div>
      {latest ? (
        <>
          <div className="mt-1.5 flex items-center gap-2">
            <p className="text-[0.6rem] text-muted">
              {formatWeight(latest.weightKg, settings.units)} x {latest.reps} = <span className="font-semibold text-fg">{formatWeight(latest.e1rm, settings.units)}</span> 1RM
            </p>
            {improvement && (
              <div className="flex items-center gap-0.5">
                {improvement.delta >= 0
                  ? <TrendingUp className="size-3 text-accent" />
                  : <TrendingDown className="size-3 text-red-400" />}
                <p className={`text-[0.55rem] ${improvement.delta >= 0 ? 'text-accent' : 'text-red-400'}`}>
                  {improvement.delta >= 0 ? '+' : '-'}{formatWeight(Math.abs(improvement.delta), settings.units)} ({improvement.pct.toFixed(1)}%)
                </p>
              </div>
            )}
          </div>
          {percentile !== null && level !== null && (
            <div className="mt-1 flex items-center gap-2">
              <p className="text-[0.55rem] text-muted">
                {t('benchmark.percentile', { value: Math.round(percentile) })}
              </p>
              <p className={`text-[0.55rem] font-medium ${LEVEL_COLORS[level] ?? 'text-muted'}`}>
                {t('benchmark.level', { level: t(`strength.level.${LEVEL_LABELS[level]}` as any) })}
              </p>
            </div>
          )}
          <div className="mt-2">
            <StrengthGauge exercise={exercise} e1rm={latest.e1rm} bodyWeight={bw} />
          </div>
        </>
      ) : (
        <p className="mt-1 text-[0.55rem] text-muted">{t('benchmark.noData')}</p>
      )}
    </div>
  )
}

interface BenchmarkTestsProps {
  results: BenchmarkResult[]
  onAdd: (result: Omit<BenchmarkResult, 'id' | 'e1rm' | 'testedAt'>) => Promise<number> | Promise<void>
}

export const BenchmarkTests = ({ results, onAdd }: BenchmarkTestsProps) => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const [showForm, setShowForm] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<BenchmarkExercise>('sentadilla')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [bodyWeight, setBodyWeight] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const w = parseFloat(weight)
    const r = parseInt(reps, 10)
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return

    try {
      setError(null)
      await onAdd({
        exercise: selectedExercise,
        // El usuario introduce en su unidad; se almacena siempre en kg internos.
        weightKg: parseWeightToKg(w, settings.units),
        reps: r,
        bodyWeightKg: bodyWeight ? parseWeightToKg(parseFloat(bodyWeight), settings.units) : undefined,
      })
      setWeight('')
      setReps('')
      setBodyWeight('')
      setShowForm(false)
    } catch {
      setError(t('benchmark.addError'))
    }
  }

  // Check if ANY exercise needs retest
  const retestExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const latest = getLatest(results, ex)
      return latest ? shouldRetest(latest.testedAt) : false
    })
  }, [results])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="size-4 text-accent" aria-hidden />
          <p className="kicker">{t('benchmark.title')}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 rounded-lg bg-accent/10 px-2 py-1 text-[0.6rem] font-medium text-accent"
        >
          <Plus className="size-3" /> {t('benchmark.add')}
        </button>
      </div>

      {/* Retest reminder */}
      {retestExercises.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
          <div>
            <p className="text-[0.6rem] font-semibold text-accent">{t('benchmark.retestDue')}</p>
            <p className="mt-0.5 text-[0.55rem] text-muted">
              {t('benchmark.retestMsg', { weeks: `${RECOMMENDED_WEEKS_BETWEEN_TESTS}+` })}
            </p>
          </div>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2.5">
          <div className="flex flex-col gap-2">
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value as BenchmarkExercise)}
              className="rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg"
            >
              {exercises.map((ex) => (
                <option key={ex} value={ex}>
                  {t(`benchmark.exercise.${ex}` as any)}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={t('benchmark.weight')}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="flex-1 rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg"
              />
              <input
                type="number"
                placeholder={t('benchmark.reps')}
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-16 rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg"
              />
            </div>
            <input
              type="number"
              placeholder={t('benchmark.bodyWeight')}
              value={bodyWeight}
              onChange={(e) => setBodyWeight(e.target.value)}
              className="rounded-lg border border-border/30 bg-bg-elevated/50 px-2 py-1.5 text-[0.65rem] text-fg"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg bg-bg-elevated/50 px-2 py-1.5 text-[0.6rem] text-muted"
              >
                {t('benchmark.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-lg bg-accent px-2 py-1.5 text-[0.6rem] font-medium text-accent-fg"
              >
                {t('benchmark.save')}
              </button>
            </div>
            {error && (
              <p className="text-[0.55rem] text-red-400">{error}</p>
            )}
          </div>
        </div>
      )}

      {/* Lista de ejercicios */}
      <div className="flex flex-col gap-2">
        {exercises.map((ex) => (
          <BenchmarkExerciseCard key={ex} exercise={ex} results={results} />
        ))}
      </div>
    </div>
  )
}
