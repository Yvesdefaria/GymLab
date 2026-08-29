// Tarjeta «Última medición» del registro corporal: fecha y lista de zonas con variación vs. la medición
// anterior (no necesariamente el día previo). Autocontenida sobre el histórico de entradas.
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
    <section className="panel-light rounded-2xl p-4">
      <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
        {t('cuerpo.medidas.ultimaMedicion')}
      </h2>
      <p className="mb-2 text-xs text-muted">
        {formatDate(latest.localDate + 'T12:00:00', lang, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}
      </p>
      <ul className="divide-y divide-border/40">
        {BODY_ZONES.filter((z) => latest.values[z.key] != null).map((zone) => {
          const v = latest.values[zone.key] as number
          const prev = previousValueOf(entries, zone.key)
          return (
            <li key={zone.key} className="flex items-center justify-between gap-2 py-2">
              <span className="text-sm text-muted">{zone.label}</span>
              <span className="flex items-center gap-2">
                {prev != null && (
                  <span className="text-xs font-medium text-accent" title={t('cuerpo.medidas.vsAnterior')}>
                    {formatDelta(v - prev)}
                  </span>
                )}
                <span className="font-display font-semibold text-fg">{v.toFixed(1)} cm</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}