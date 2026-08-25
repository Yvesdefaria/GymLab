// Página /calculadoras/navy: calculadora Navy (sin picómetro) con back link.
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { NavyCalculator } from '@/components/calculators/NavyCalculator'

export const NavyPage = () => (
  <div>
    <AppHeader title="Navy" subtitle="% grasa corporal" />
    <BackLink to="/calculadoras" />
    <NavyCalculator />
  </div>
)
