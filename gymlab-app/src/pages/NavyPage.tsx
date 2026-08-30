// Página /calculadoras/navy: calculadora Navy (sin picómetro) con back link.
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { NavyCalculator } from '@/components/calculators/NavyCalculator'

export const NavyPage = () => {
  const { t } = useTranslation()
  return (
    <div>
      <AppHeader title={t('navy.title')} />
      <div className="space-y-4 p-4">
        <BackLink to="/calculadoras" />
        <NavyCalculator />
      </div>
    </div>
  )
}
