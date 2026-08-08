// Página /calculadoras/1rm: estima la repetición máxima con las fórmulas de Brzycki y Epley.
import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { oneRepMaxLabel } from '@/domain/calculators/oneRepMax'

export const OneRepMaxPage = () => {
  const [peso, setPeso] = useState('')
  const [reps, setReps] = useState('')

  // Estimación en vivo; solo se muestra resultado con peso y reps positivos.
  const pesoNum = parseFloat(peso) || 0
  const repsNum = parseFloat(reps) || 0
  const result = oneRepMaxLabel(pesoNum, repsNum)
  const showResult = pesoNum > 0 && repsNum > 0

  return (
    <div>
      <AppHeader title="1RM" subtitle="Fuerza máxima estimada" />
      <div className="space-y-4 p-4">
        <BackLink to="/calculadoras" />

        <div className="panel rounded-2xl p-4">
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
              min={1}
              max={1000}
            />
            <CalculatorField
              label="Repeticiones"
              value={reps}
              onChange={setReps}
              placeholder="5"
              suffix="reps"
              inputMode="numeric"
              min={1}
              max={100}
            />
          </div>
        </div>

        {showResult && (
          <div className="panel rounded-2xl p-6 text-center">
            <p className="kicker">Tu 1RM estimado</p>
            <p className="stat-value text-4xl">
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
