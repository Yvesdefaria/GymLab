// Fila «Calculadora de discos» del hub: abre el modal de distribución de discos de forma
// autocontenida (el estado de apertura no afecta al resto de la página).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Scale } from 'lucide-react'
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal'

export const PlateCalculatorRow = () => {
  const { t } = useTranslation()
  const [showPlates, setShowPlates] = useState(false)

  return (
    <li className="col-span-2">
      <button
        onClick={() => setShowPlates(true)}
        className="flex min-h-[56px] w-full items-center gap-3 panel rounded-2xl px-4 py-3 text-left transition-colors hover:border-gold/80"
      >
        <span className="flex size-11 items-center justify-center rounded-xl text-cta">
          <Scale className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-fg">{t('calculadoras.hub.discosTitulo')}</span>
          <span className="block text-sm text-muted">{t('calculadoras.hub.discosDesc')}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
      </button>
      {showPlates && <PlateCalculatorModal onClose={() => setShowPlates(false)} />}
    </li>
  )
}