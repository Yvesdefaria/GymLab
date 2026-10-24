// Fila de 3 métricas de la home: racha, sesiones de la semana y volumen semanal.
import { useTranslation } from 'react-i18next'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

type Props = {
  streak: number
  sessions: number
  volume: number
  units: string
}

export const HomeStatRow = ({ streak, sessions, volume, units }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  return (
    <div className="grid grid-cols-3 border-b border-border/40 py-3.5">
      <div className="text-center">
        <strong className="block font-display text-2xl font-light leading-none tabular-nums text-fg">
          {streak}d
        </strong>
        <span className="mt-1.5 block text-[7.5px] font-semibold uppercase tracking-[0.14em] text-muted">
          {t('home.racha')}
        </span>
      </div>
      <div className="border-x border-border/40 text-center">
        <strong className="block font-display text-2xl font-light leading-none tabular-nums text-fg">
          {sessions}
        </strong>
        <span className="mt-1.5 block text-[7.5px] font-semibold uppercase tracking-[0.14em] text-muted">
          {t('home.estaSemana')}
        </span>
      </div>
      <div className="text-center">
        <strong className="block font-display text-2xl font-light leading-none tabular-nums text-fg">
          {formatNumber(volume, lang)}
          <span className="ml-0.5 font-sans text-[9px] font-medium text-muted"> {units}</span>
        </strong>
        <span className="mt-1.5 block text-[7.5px] font-semibold uppercase tracking-[0.14em] text-muted">
          {t('home.volumenSem')}
        </span>
      </div>
    </div>
  )
}
