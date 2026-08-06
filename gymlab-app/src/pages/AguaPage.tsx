import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Droplets } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { calcDailyWater, calcVasosAgua } from '@/domain/calculators/water'

export const AguaPage = () => {
  const [peso, setPeso] = useState('')
  const [ejercicio, setEjercicio] = useState('0')

  const pesoNum = parseFloat(peso) || 0
  const minutos = parseInt(ejercicio, 10) || 0
  const litros = calcDailyWater(pesoNum, minutos)
  const vasos = calcVasosAgua(litros)
  const showResult = pesoNum > 0

  return (
    <div>
      <AppHeader title="Agua diaria" subtitle="Hidratación recomendada" />
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
            Aprox. 35 ml por kg de peso corporal más una recarga por ejercicio intenso.
          </p>
          <div className="space-y-3">
            <CalculatorField
              label="Peso corporal"
              value={peso}
              onChange={setPeso}
              placeholder="70"
              suffix="kg"
              min={1}
              max={400}
            />
            <CalculatorField
              label="Ejercicio diario"
              value={ejercicio}
              onChange={setEjercicio}
              placeholder="0"
              suffix="min"
              inputMode="numeric"
              min={0}
              max={600}
            />
          </div>
        </div>

        {showResult && (
          <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-muted">Tu objetivo</p>
            <p className="font-display text-4xl font-bold text-fg">
              {litros.toLocaleString('es-ES')} L
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted">
              <Droplets className="size-4 text-accent" aria-hidden />
              Unos {vasos} vasos de 250 ml
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted">
          Recomendación general. Necesidades reales según clima, sudoración y salud.
        </p>
      </div>
    </div>
  )
}
