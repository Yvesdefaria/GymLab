// Tarjeta de ratios corporales derivados de la última medición: cintura/altura, cintura/cadera
// y simetría izquierda-derecha por parejas. Autocontenida (no renderiza si no hay ratios).
import { useTranslation } from 'react-i18next'
import {
  calcSymmetryPct,
  calcWhr,
  calcWhtr,
  whrCategory,
  whrCategoryColor,
  whrCategoryLabel,
  whtrCategory,
  whtrCategoryColor,
  whtrCategoryLabel,
} from '@/domain/calculators/bodyComposition'
import { BODY_ZONE_PAIRS } from '@/domain/bodyMeasurements'
import type { BodyZone, Sex } from '@/domain/types'

interface BodyRatiosCardProps {
  values: Partial<Record<BodyZone, number>>
  height: number
  sex: Sex
}

export const BodyRatiosCard = ({ values, height, sex }: BodyRatiosCardProps) => {
  const { t } = useTranslation()
  const { cintura, caderas } = values
  const whtr = cintura != null && height > 0 ? calcWhtr(cintura, height) : null
  const whr = cintura != null && caderas != null ? calcWhr(cintura, caderas) : null
  const symmetries = BODY_ZONE_PAIRS.map((pair) => {
    const l = values[pair.left]
    const r = values[pair.right]
    const pct = l != null && r != null ? calcSymmetryPct(l, r) : null
    return { label: pair.label, pct }
  }).filter((s) => s.pct != null)

  if (whtr == null && whr == null) return null

  return (
    <section className="panel-light rounded-2xl p-4">
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
        {t('cuerpo.medidas.ratios')}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {whtr != null && (
          <div className="rounded-xl border border-border/30 bg-bg-elevated/30 p-3">
            <p className="text-xs text-muted">{t('cuerpo.medidas.cinturaAltura')}</p>
            <p className="font-display text-xl font-semibold text-fg">{whtr.toFixed(2)}</p>
            <p
              className="text-xs font-medium"
              style={{ color: whtrCategoryColor(whtrCategory(whtr)) }}
            >
              {whtrCategoryLabel(whtrCategory(whtr))}
            </p>
          </div>
        )}
        {whr != null && (
          <div className="rounded-xl border border-border/30 bg-bg-elevated/30 p-3">
            <p className="text-xs text-muted">{t('cuerpo.medidas.cinturaCadera')}</p>
            <p className="font-display text-xl font-semibold text-fg">{whr.toFixed(2)}</p>
            <p
              className="text-xs font-medium"
              style={{ color: whrCategoryColor(whrCategory(whr, sex)) }}
            >
              {whrCategoryLabel(whrCategory(whr, sex))}
            </p>
          </div>
        )}
      </div>
      {symmetries.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-muted">{t('cuerpo.medidas.simetria')}</p>
          <ul className="space-y-1">
            {symmetries.map((s) => (
              <li key={s.label} className="flex items-center justify-between text-sm">
                <span className="text-muted">{s.label}</span>
                <span className="font-medium text-fg">{s.pct?.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}