// Utilidad «Calculadora de discos» del hub: fila hairline que abre el modal autocontenido.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Scale } from 'lucide-react'
import { PlateCalculatorModal } from '@/components/workout/PlateCalculatorModal'

export const PlateCalculatorRow = () => {
  const { t } = useTranslation()
  const [showPlates, setShowPlates] = useState(false)

  return (
    <div>
      <button
        onClick={() => setShowPlates(true)}
        className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-gold/20 bg-cta/5 px-3 text-left transition-colors hover:border-gold/50"
      >
        <span className="flex size-9 items-center justify-center rounded-lg text-gold">
          <Scale className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-semibold text-gold-bright">
            {t('calculadoras.hub.discosTitulo')}
          </span>
          <span className="block text-[10.5px] text-muted">{t('calculadoras.hub.discosDesc')}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
      </button>
      {showPlates && <PlateCalculatorModal onClose={() => setShowPlates(false)} />}
    </div>
  )
}
