// Acceso al registro corporal desde la home: muestra el último peso (en la unidad activa) y enlaza a /peso-corporal.
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { applyUnits, formatUnits, type AppSettings } from '@/domain/settings'
import type { BodyWeightEntry } from '@/domain/types'

type LastWeightLinkProps = {
  settings: AppSettings
  entries: BodyWeightEntry[]
}

export const LastWeightLink = ({ settings, entries }: LastWeightLinkProps) => {
  const { t } = useTranslation()

  if (!settings.showWeightHint || entries.length === 0) return null
  const last = entries[entries.length - 1]

  return (
    <Link
      to="/peso-corporal"
      className="flex min-h-[44px] items-center justify-between rounded-xl border border-border/30 bg-bg-elevated/30 px-3 text-xs text-muted transition-colors hover:border-cta"
    >
      <span>{t('home.ultimoPeso')}</span>
      <span className="font-display font-semibold text-accent">
        {applyUnits(last.weightKg, settings.units).toFixed(1)} {formatUnits(settings.units)}
      </span>
    </Link>
  )
}