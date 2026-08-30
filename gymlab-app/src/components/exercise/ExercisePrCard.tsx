// Tarjeta «mejor marca» de la ficha de ejercicio con sus 3 estados: PR registrado,
// sin historial (CTA a entrenar) o con historial pero aún sin PR.
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Play, Target, Trophy } from 'lucide-react'
import { formatDate } from '@/lib/intl'
import { applyUnits, formatUnits } from '@/domain/settings'
import type { AppLanguage } from '@/domain/onboarding'
import type { Units } from '@/domain/settings'
import type { PRRecord } from '@/domain/types'

// Convierte kg almacenados a la unidad de display y formatea sin decimales si es entero.
const fmtWeight = (kg: number, units: Units): string => {
  const v = applyUnits(kg, units)
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

export const ExercisePrCard = ({
  pr,
  hasHistory,
  units,
  lang,
}: {
  pr: PRRecord | undefined
  hasHistory: boolean
  units: Units
  lang: AppLanguage
}) => {
  const { t } = useTranslation()

  if (pr) {
    return (
      <section className="rounded-2xl border border-cta/40 bg-cta/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-cta" aria-hidden />
            <span className="font-display text-sm font-semibold text-accent">
              {t('ejercicios.detalle.mejorMarca')}
            </span>
          </div>
          <span className="chip">
            {formatDate(pr.date, lang, { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <p className="mt-2 stat-value text-3xl">
          {fmtWeight(pr.weightKg, units)}
          <span className="text-lg text-muted">
            {' '}
            {formatUnits(units)} × {pr.reps}
          </span>
        </p>
        <p className="mt-1 text-xs text-muted">
          {t('ejercicios.detalle.e1rmEstimado', {
            peso: fmtWeight(pr.estimated1RM, units),
            unidad: formatUnits(units),
          })}
        </p>
      </section>
    )
  }

  if (!hasHistory) {
    return (
      <section className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 px-4 py-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-cta/15">
          <Target className="size-5 text-cta" aria-hidden />
        </span>
        <p className="font-display text-sm font-semibold text-fg">{t('ejercicios.detalle.sinHistorial')}</p>
        <p className="max-w-xs text-xs leading-relaxed text-muted">
          {t('ejercicios.detalle.sinHistorialDesc')}
        </p>
        <Link
          to="/"
          className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-cta px-4 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
        >
          <Play className="size-4" aria-hidden />
          {t('ejercicios.detalle.iniciarEntreno')}
        </Link>
      </section>
    )
  }

  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <Target className="size-5 text-accent" aria-hidden />
        <span className="font-display text-sm font-semibold text-accent">
          {t('ejercicios.detalle.sinMejorMarca')}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {t('ejercicios.detalle.sinMejorMarcaDesc')}
      </p>
    </section>
  )
}