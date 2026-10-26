// «Última medición» del registro corporal: fecha y zonas con variación vs. la anterior.
import { useTranslation } from 'react-i18next'
import { BODY_ZONES } from '@/domain/bodyMeasurements'
import { formatDate } from '@/lib/intl'
import type { BodyMeasurementEntry } from '@/domain/types'
import type { AppLanguage } from '@/domain/onboarding'

// Formatea la variación vs. registro anterior: +x, -x o ±0.0 según signo.
const formatDelta = (d: number) => (d > 0 ? `+${d.toFixed(1)}` : d < 0 ? d.toFixed(1) : '±0.0')

// Devuelve la última medición anterior de la zona (no necesariamente el día previo).
const previousValueOf = (entries: BodyMeasurementEntry[], zone: string): number | undefined => {
  for (let i = entries.length - 2; i >= 0; i--) {
    const v = entries[i].values[zone as keyof typeof entries[number]['values']]
    if (v != null) return v
  }
  return undefined
}

export const MeasurementsEntriesCard = ({ entries }: { entries: BodyMeasurementEntry[] }) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const latest = entries[entries.length - 1]
  if (!latest) return null

  return (
    <section className="border-t border-border/40 pt-4">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {t('cuerpo.medidas.ultimaMedicion')}
      </h2>
      <p className="mt-0.5 text-[10px] text-muted">
        {formatDate(latest.localDate + 'T12:00:00', lang, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}
      </p>
      <ul>
        {BODY_ZONES.filter((z) => latest.values[z.key] != null).map((zone) => {
          const v = latest.values[zone.key] as number
          const prev = previousValueOf(entries, zone.key)
          return (
            <li key={zone.key} className="flex items-center justify-between gap-2 border-b border-border/40 py-2">
              <span className="text-[11.5px] text-muted">{t(`cuerpo.zonas.${zone.key}`)}</span>
              <span className="flex items-center gap-2">
                {prev != null && (
                  <span className="text-[10px] font-medium text-gold" title={t('cuerpo.medidas.vsAnterior')}>
                    {formatDelta(v - prev)}
                  </span>
                )}
                <span className="font-display text-base font-light tabular-nums text-fg">{v.toFixed(1)} cm</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
