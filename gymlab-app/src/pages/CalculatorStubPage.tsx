import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppHeader } from '../components/layout/AppHeader'

const titles: Record<string, string> = {
  imc: 'IMC',
  calorias: 'Calorías (TDEE)',
}

export const CalculatorStubPage = () => {
  const { calcId } = useParams()
  const title = (calcId && titles[calcId]) || 'Calculadora'

  return (
    <div>
      <AppHeader title={title} subtitle="Cálculo en dominio (fase 6)" />
      <div className="space-y-4 p-4">
        <Link
          to="/calculadoras"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Todas las calculadoras
        </Link>
        <div className="rounded-2xl border border-gold/40 bg-bg-elevated p-5">
          <p className="text-sm text-muted">
            La lógica vivirá en <code className="text-accent">domain/calculators/</code>{' '}
            y la UI en <code className="text-accent">components/calculators/</code>.
          </p>
        </div>
        <p className="text-center text-xs text-muted">
          Resultados informativos. No sustituyen consejo médico profesional.
        </p>
      </div>
    </div>
  )
}
