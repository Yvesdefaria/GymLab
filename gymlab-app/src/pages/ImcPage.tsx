import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { calcIMC, getIMCCategory, imcCategoryLabel, imcCategoryColor } from '@/domain/calculators/imc'

export const ImcPage = () => {
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')

  const pesoNum = parseFloat(peso) || 0
  const alturaNum = parseFloat(altura) || 0
  const imc = calcIMC(pesoNum, alturaNum)
  const category = getIMCCategory(imc)
  const showResult = pesoNum > 0 && alturaNum > 0

  return (
    <div>
      <AppHeader title="IMC" subtitle="Índice de masa corporal (OMS)" />
      <div className="space-y-4 p-4">
        <Link
          to="/calculadoras"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft className="size-4" />
          Calculadoras
        </Link>

        {/* Inputs */}
        <div className="rounded-2xl border border-border bg-bg-elevated p-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Peso (kg)</label>
            <input
              type="number"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="70"
              className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Altura (cm)</label>
            <input
              type="number"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="175"
              className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/50 focus:border-cta focus:outline-none"
              inputMode="decimal"
            />
          </div>
        </div>

        {/* Result */}
        {showResult && (
          <div className="rounded-2xl border border-border bg-bg-elevated p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-muted">Tu IMC</p>
            <p className="font-display text-4xl font-bold text-fg">{imc}</p>
            <p
              className="mt-1 font-display text-base font-semibold"
              style={{ color: imcCategoryColor(category) }}
            >
              {imcCategoryLabel(category)}
            </p>

            {/* Scale */}
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((imc / 40) * 100, 100)}%`,
                  backgroundColor: imcCategoryColor(category),
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[0.6rem] text-muted">
              <span>15</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>40</span>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted">
          Resultado orientativo. No sustituye valoración médica profesional.
        </p>
      </div>
    </div>
  )
}
