// Ratios corporales de la última medición: cintura/altura, cintura/cadera y simetría.
// Filas hairline; el color de categoría va en un punto pequeño, no en toda la fila.
import { useTranslation } from 'react-i18next'
import {
  calcSymmetryPct,
  calcWhr,
  calcWhtr,
  whrCategory,
  whtrCategory,
} from '@/domain/calculators/bodyComposition'
import { BODY_ZONE_PAIRS } from '@/domain/bodyMeasurements'
import type { BodyZone, Sex } from '@/domain/types'

interface BodyRatiosCardProps {
  values: Partial<Record<BodyZone, number>>
  height: number
  sex: Sex
}

// El dominio guarda `base` como string; el mapa mantiene la clave i18n tipada.
const PAIR_LABEL_KEY = {
  biceps: 'cuerpo.pares.biceps',
  antebrazo: 'cuerpo.pares.antebrazo',
  muneca: 'cuerpo.pares.muneca',
  muslo: 'cuerpo.pares.muslo',
  pantorrilla: 'cuerpo.pares.pantorrilla',
  tobillo: 'cuerpo.pares.tobillo',
} as const

export const BodyRatiosCard = ({ values, height, sex }: BodyRatiosCardProps) => {
  const { t } = useTranslation()
  const { cintura, caderas } = values
  const whtr = cintura != null && height > 0 ? calcWhtr(cintura, height) : null
  const whr = cintura != null && caderas != null ? calcWhr(cintura, caderas) : null
  const symmetries = BODY_ZONE_PAIRS.map((pair) => {
    const l = values[pair.left]
    const r = values[pair.right]
    const pct = l != null && r != null ? calcSymmetryPct(l, r) : null
    return { base: pair.base, pct }
  }).filter((s) => s.pct != null)

  if (whtr == null && whr == null) return null

  const whtrCat = whtr != null ? whtrCategory(whtr) : null
  const whrCat = whr != null ? whrCategory(whr, sex) : null
  const dot = (tone: 'success' | 'gold' | 'danger') =>
    tone === 'success' ? 'bg-success' : tone === 'danger' ? 'bg-danger' : 'bg-gold'
  const whtrTone = whtrCat === 'saludable' ? 'success' : whtrCat === 'riesgo_alto' ? 'danger' : 'gold'
  const whrTone = whrCat === 'bajo' ? 'success' : whrCat === 'alto' ? 'danger' : 'gold'

  return (
    <section className="border-t border-border/40 pt-4">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {t('cuerpo.medidas.ratios')}
      </h2>
      <div className="mt-1">
        {whtr != null && whtrCat && (
          <div className="flex items-baseline justify-between gap-2 border-b border-border/40 py-2.5">
            <span className="text-[12px] text-muted">{t('cuerpo.medidas.cinturaAltura')}</span>
            <span className="flex items-baseline gap-2">
              <span className="font-display text-lg font-light tabular-nums text-fg">{whtr.toFixed(2)}</span>
              <span className="flex items-center gap-1.5 text-[10px] text-muted">
                <i className={`size-1.5 rounded-full ${dot(whtrTone)}`} aria-hidden />
                {t(`cuerpo.medidas.categorias.${whtrCat}`)}
              </span>
            </span>
          </div>
        )}
        {whr != null && whrCat && (
          <div className="flex items-baseline justify-between gap-2 border-b border-border/40 py-2.5">
            <span className="text-[12px] text-muted">{t('cuerpo.medidas.cinturaCadera')}</span>
            <span className="flex items-baseline gap-2">
              <span className="font-display text-lg font-light tabular-nums text-fg">{whr.toFixed(2)}</span>
              <span className="flex items-center gap-1.5 text-[10px] text-muted">
                <i className={`size-1.5 rounded-full ${dot(whrTone)}`} aria-hidden />
                {t(`cuerpo.medidas.categorias.${whrCat}`)}
              </span>
            </span>
          </div>
        )}
      </div>
      {symmetries.length > 0 && (
        <div className="mt-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t('cuerpo.medidas.simetria')}
          </p>
          <ul>
            {symmetries.map((s) => (
              <li key={s.base} className="flex items-center justify-between border-b border-border/40 py-1.5 text-[11.5px]">
                <span className="text-muted">
                  {t(PAIR_LABEL_KEY[s.base as keyof typeof PAIR_LABEL_KEY] ?? 'cuerpo.pares.biceps')}
                </span>
                <span className="tabular-nums text-fg">{s.pct?.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
