// Filas «Tus datos» del perfil: edad de lectura y accesos a los editores reales
// (medidas para altura/sexo y peso corporal). Sin chevron donde no hay destino.
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { applyUnits, formatUnits, type Units } from '@/domain/settings'
import { formatNumber } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'

type ProfileDataRowsProps = {
  age: number | null
  heightCm: number | null
  bodySex: 'male' | 'female' | null
  weightKg: number | null
  units: Units
}

const rowClass = 'flex min-h-11 items-center justify-between gap-3 text-sm text-fg'
const valueClass = 'flex items-center gap-1 text-sm tabular-nums text-fg'

export const ProfileDataRows = ({
  age,
  heightCm,
  bodySex,
  weightKg,
  units,
}: ProfileDataRowsProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  const sexLabel =
    bodySex === 'female'
      ? t('perfil.datosMujer')
      : bodySex === 'male'
        ? t('perfil.datosHombre')
        : null
  const bodyValue = [heightCm != null ? `${heightCm} cm` : null, sexLabel]
    .filter((value): value is string => Boolean(value))
    .join(' · ')
  const weightValue =
    weightKg != null
      ? `${formatNumber(applyUnits(weightKg, units), lang, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} ${formatUnits(units)}`
      : null

  if (age == null && !bodyValue && weightValue == null) return null

  return (
    <div className="divide-y divide-border/30">
      {age != null ? (
        <div className={rowClass}>
          <span>{t('perfil.datosEdad')}</span>
          <span className="text-sm tabular-nums text-fg">
            {t('perfil.datosAnios', { count: age })}
          </span>
        </div>
      ) : null}

      {bodyValue ? (
        <Link to="/calculadoras/medidas" className={rowClass}>
          <span>{t('perfil.datosAlturaSexo')}</span>
          <span className={valueClass}>
            {bodyValue}
            <ChevronRight className="size-4 text-muted" aria-hidden />
          </span>
        </Link>
      ) : null}

      {weightValue ? (
        <Link to="/peso-corporal" className={rowClass}>
          <span>{t('perfil.datosPeso')}</span>
          <span className={valueClass}>
            {weightValue}
            <ChevronRight className="size-4 text-muted" aria-hidden />
          </span>
        </Link>
      ) : null}
    </div>
  )
}
