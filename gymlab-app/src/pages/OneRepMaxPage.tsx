import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Trophy } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { oneRepMaxLabel } from '@/domain/calculators/oneRepMax'

export const OneRepMaxPage = () => {
  const [peso, setPeso] = useState('')
  const [reps, setReps] = useState('')

  const pesoNum = parseFloat(peso) || 0
  const repsNum = parseFloat(reps) || 0
  const result = oneRepMaxLabel(pesoNum, repsNum)
  const showResult = pesoNum > 0 && repsNum > 0

  return (
    <div>
      <AppHeader title="1RM" subtitle="Fuerza máxima estimada" />
      <div className="space-y-4 p-4">
        <Link
          to="/calculadoras"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft className="size-4" />
          Calculadoras
        </Link>

        <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-4">
          <p className="mb-3 text-xs text-muted">
            Estima tu repetición máxima a partir de un peso y el número de repeticiones hechas.
          </p>
          <div className="space-y-3">
            <CalculatorField
              label="Peso levantado"
              value={peso}
              onChange={setPeso}
              placeholder="80"
              suffix="kg"
            />
            <CalculatorField
              label="Repeticiones"
              value={reps}
              onChange={setReps}
              placeholder="5"
              suffix="reps"
              inputMode="numeric"
              min={1}
            />
          </div>
        </div>

        {showResult && (
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-muted">Tu 1RM estimado</p>
            <p className="font-display text-4xl font-bold text-fg">
              {result.brzycki} kg
            </p>
            <div className="mt-4 space-y-1.5 text-sm">
              <p className="text-muted">
                Fórmula de <span className="font-medium text-fg">Brzycki</span>:{' '}
                <span className="text-accent-soft">{result.brzycki} kg</span>
              </p>
              <p className="text-muted">
                Fórmula de <span className="font-medium text-fg">Epley</span>:{' '}
                <span className="text-accent-soft">{result.epley} kg</span>
              </p>
              <p className="text-xs text-muted">
                Diferencia entre ambas: {Math.abs(result.diferenciaKg)} kg
              </p>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
              <Trophy className="size-4 text-accent" aria-hidden />
              Sube el peso de trabajo para verificarlo con seguridad y con un compañero.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted">
          Estimación orientativa. No sustituye valoración médica profesional.
        </p>
      </div>
    </div>
  )
}
