// Página /calculadoras/imc: calculadora en vivo del IMC (OMS) con categoría y escala visual.
import { useState } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { calcIMC, getIMCCategory, imcCategoryLabel, imcCategoryColor } from '@/domain/calculators/imc'

export const ImcPage = () => {
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')

  // Cálculo en vivo: solo se muestra resultado cuando ambos valores son positivos.
  const pesoNum = parseFloat(peso) || 0
  const alturaNum = parseFloat(altura) || 0
  const imc = calcIMC(pesoNum, alturaNum)
  const category = getIMCCategory(imc)
  const showResult = pesoNum > 0 && alturaNum > 0

  return (
    <div>
      <AppHeader title="IMC" subtitle="Índice de masa corporal (OMS)" />
      <div className="space-y-4 p-4">
        <BackLink to="/calculadoras" />

        {/* Inputs */}
        <div className="panel rounded-2xl p-4 space-y-3">
          <div>
            <label htmlFor="imc-peso" className="mb-1 block text-xs font-medium text-muted">Peso (kg)</label>
            <input
              id="imc-peso"
              type="number"
              min={1}
              max={400}
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="70"
              className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/70 focus:border-cta focus:outline-none"
              inputMode="decimal"
            />
          </div>
          <div>
            <label htmlFor="imc-altura" className="mb-1 block text-xs font-medium text-muted">Altura (cm)</label>
            <input
              id="imc-altura"
              type="number"
              min={50}
              max={250}
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="175"
              className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/70 focus:border-cta focus:outline-none"
              inputMode="decimal"
            />
          </div>
        </div>

        {/* Result */}
        {showResult && (
          <div className="panel rounded-2xl p-6 text-center">
            <p className="kicker">Tu IMC</p>
            <p className="stat-value text-4xl">{imc}</p>
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
