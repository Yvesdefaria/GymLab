// Página /calculadoras/navy: calculadora Navy (sin picómetro) con shell y disclaimer.
import { useTranslation } from 'react-i18next'
import { CalculatorShell } from '@/components/calculators/CalculatorShell'
import { CalculatorDisclaimer } from '@/components/calculators/CalculatorDisclaimer'
import { NavyCalculator } from '@/components/calculators/NavyCalculator'

export const NavyPage = () => {
  const { t } = useTranslation()
  return (
    <CalculatorShell title={t('navy.title')} subtitle={t('navy.sinPicometro')}>
      <NavyCalculator />
      <CalculatorDisclaimer>{t('navy.disclaimer')}</CalculatorDisclaimer>
    </CalculatorShell>
  )
}
