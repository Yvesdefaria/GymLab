// Benchmark tests: test de fuerza predefinidos con tracking de mejora.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dumbbell, TrendingUp, Plus } from 'lucide-react'
import { shouldRetest, calcImprovement, getLatest, type BenchmarkExercise } from '@/domain/benchmark'
import type { BenchmarkResult } from '@/domain/types'

const exercises: BenchmarkExercise[] = ['sentadilla', 'banca', 'peso_muerto', 'press_militar']

interface BenchmarkTestsProps {
  results: BenchmarkResult[]
  onAdd: (result: Omit<BenchmarkResult, 'id' | 'e1rm' | 'testedAt'>) => void
}

export const BenchmarkTests = ({ results, onAdd }: BenchmarkTestsProps) => {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<BenchmarkExercise>('sentadilla')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [bodyWeight, setBodyWeight] = useState('')

  const handleSubmit = () => {
    const w = parseFloat(weight)
    const r = parseInt(reps, 10)
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return

    onAdd({
      exercise: selectedExercise,
      weightKg: w,
      reps: r,
      bodyWeightKg: bodyWeight ? parseFloat(bodyWeight) : undefined,
    })
    setWeight('')
    setReps('')
    setBodyWeight('')
    setShowForm(false)
  }

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
                  {ex === 'sentadilla' ? t('benchmark.exercise.sentadilla') : ex === 'banca' ? t('benchmark.exercise.banca') : ex === 'peso_muerto' ? t('benchmark.exercise.peso_muerto') : t('benchmark.exercise.press_militar')}
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
          </div>
        </div>
      )}

      {/* Lista de ejercicios con último resultado */}
      <div className="flex flex-col gap-2">
        {exercises.map((ex) => {
          const latest = getLatest(results, ex)
          const improvement = latest ? calcImprovement(latest, results.find((r) => r.exercise === ex && r.testedAt < latest.testedAt) ?? null) : null
          const needsRetest = latest ? shouldRetest(latest.testedAt) : true

          return (
            <div key={ex} className="rounded-xl border border-border/30 bg-bg-elevated/30 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[0.65rem] font-semibold text-fg">
                  {ex === 'sentadilla' ? t('benchmark.exercise.sentadilla') : ex === 'banca' ? t('benchmark.exercise.banca') : ex === 'peso_muerto' ? t('benchmark.exercise.peso_muerto') : t('benchmark.exercise.press_militar')}
                </p>
                {needsRetest && (
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[0.5rem] font-medium text-accent">
                    {t('benchmark.retest')}
                  </span>
                )}
              </div>
              {latest ? (
                <div className="mt-1.5 flex items-center gap-2">
                  <p className="text-[0.6rem] text-muted">
                    {latest.weightKg}kg × {latest.reps} → <span className="font-semibold text-fg">{latest.e1rm.toFixed(1)}kg</span> 1RM
                  </p>
                  {improvement && (
                    <div className="flex items-center gap-0.5">
                      <TrendingUp className={`size-3 ${improvement.delta >= 0 ? 'text-accent' : 'text-red-400'}`} />
                      <p className={`text-[0.55rem] ${improvement.delta >= 0 ? 'text-accent' : 'text-red-400'}`}>
                        {improvement.delta >= 0 ? '+' : ''}{improvement.delta.toFixed(1)}kg ({improvement.pct.toFixed(1)}%)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-[0.55rem] text-muted">{t('benchmark.noData')}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
