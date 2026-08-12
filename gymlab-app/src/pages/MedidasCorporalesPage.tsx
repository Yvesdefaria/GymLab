// Página /cuerpo/medidas (vía /calculadoras): registro de medidas por zona con upsert diario.
// Calcula ratios (cintura/altura, cintura/cadera, simetría) y muestra evolución en gráfico.
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Ruler } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { InfoTip } from '@/components/ui/InfoTip'
import { BodyMeasurementsChart } from '@/components/body/BodyMeasurementsChart'
import { useBodyMeasurements } from '@/hooks/useBodyMeasurements'
import { useMetaValue } from '@/hooks/useMetaValue'
import { metaRepo } from '@/data/repositories'
import { BODY_SEX_KEY, HEIGHT_KEY } from '@/domain/profileMeta'
import {
  BODY_ZONES,
  BODY_ZONE_GROUP_LABELS,
  BODY_ZONE_PAIRS,
  SEX_LABELS,
} from '@/domain/bodyMeasurements'
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
import type { BodyZone, Sex } from '@/domain/types'

// Formatea la variación vs. registro anterior: +x, -x o ±0.0 según signo.
const formatDelta = (d: number) => (d > 0 ? `+${d.toFixed(1)}` : d < 0 ? d.toFixed(1) : '±0.0')

// Campo de entrada de una zona corporal (cm), memoizado para re-renderizar solo el editado.
const ZoneField = memo(
  ({
    zone,
    value,
    onChange,
  }: {
    zone: (typeof BODY_ZONES)[number]
    value: string
    onChange: (key: BodyZone, value: string) => void
  }) => {
  const id = `medida-${zone.key}`
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-muted">
          {zone.label}
        </label>
        <InfoTip label={`Cómo medir ${zone.label}`}>{zone.guide}</InfoTip>
      </div>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={0}
          max={300}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(zone.key, e.target.value)}
          placeholder="—"
          className="h-11 w-full rounded-xl border border-border bg-bg pr-10 text-sm font-semibold text-fg placeholder:text-muted focus:border-cta focus:outline-none"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
          cm
        </span>
      </div>
    </div>
  )
},
)
ZoneField.displayName = 'ZoneField'

export const MedidasCorporalesPage = () => {
  const { entries, saveToday, today } = useBodyMeasurements()
  const [values, setValues] = useState<Partial<Record<BodyZone, string>>>({})
  const [error, setError] = useState<string | null>(null)

  const height = useMetaValue<number>(HEIGHT_KEY, 0)
  const [heightInput, setHeightInput] = useState('')
  const [heightError, setHeightError] = useState<string | null>(null)
  useEffect(() => {
    if (height) setHeightInput(String(height))
  }, [height])

  const sex = useMetaValue<Sex>(BODY_SEX_KEY, 'male')

  // Si ya hay medidas de hoy, se rehidrata el formulario con esos valores.
  const todayValuesJson = useMemo(
    () => (today ? JSON.stringify(today.values) : ''),
    [today],
  )
  useEffect(() => {
    if (!todayValuesJson) {
      setValues({})
      return
    }
    try {
      const parsed = JSON.parse(todayValuesJson) as Partial<Record<BodyZone, number>>
      const asStrings: Partial<Record<BodyZone, string>> = {}
      for (const [k, v] of Object.entries(parsed)) asStrings[k as BodyZone] = String(v)
      setValues(asStrings)
    } catch {
      setValues({})
    }
  }, [todayValuesJson])

  const handleChange = useCallback((key: BodyZone, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = async () => {
    // Filtra zonas vacías o inválidas y redondea a 0.1 cm; exige al menos una medida.
    const payload: Partial<Record<BodyZone, number>> = {}
    for (const zone of BODY_ZONES) {
      const n = parseFloat(values[zone.key] ?? '')
      if (!Number.isNaN(n) && n > 0) payload[zone.key] = Math.round(n * 10) / 10
    }
    if (Object.keys(payload).length === 0) {
      setError('Introduce al menos una medida para guardar.')
      return
    }
    setError(null)
    await saveToday(payload)
  }

  const handleSaveHeight = async () => {
    const cm = parseFloat(heightInput)
    if (Number.isNaN(cm) || cm < 100 || cm > 250) {
      setHeightError('Introduce una altura entre 100 y 250 cm.')
      return
    }
    setHeightError(null)
    await metaRepo.setJson(HEIGHT_KEY, Math.round(cm))
  }

  const latest = entries[entries.length - 1]

  // Devuelve la última medición anterior de la zona (no necesariamente el día previo).
  const previousValue = useCallback(
    (zone: BodyZone): number | undefined => {
      for (let i = entries.length - 2; i >= 0; i--) {
        const v = entries[i].values[zone]
        if (v != null) return v
      }
      return undefined
    },
    [entries],
  )

  // Ratios derivados de la última medición: WHTR, WHR y simetría izq-der por parejas.
  const ratioData = useMemo(() => {
    if (!latest) return null
    const { cintura, caderas } = latest.values
    const whtr =
      cintura != null && height > 0 ? calcWhtr(cintura, height) : null
    const whr = cintura != null && caderas != null ? calcWhr(cintura, caderas) : null
    const symmetries = BODY_ZONE_PAIRS.map((pair) => {
      const l = latest.values[pair.left]
      const r = latest.values[pair.right]
      const pct = l != null && r != null ? calcSymmetryPct(l, r) : null
      return { label: pair.label, pct }
    }).filter((s) => s.pct != null)
    return { whtr, whr, symmetries }
  }, [latest, height])

  const hasRatios = (ratioData?.whtr ?? null) !== null || (ratioData?.whr ?? null) !== null

  return (
    <div>
      <AppHeader title="Medidas corporales" subtitle="Registro y evolución por zona" />
      <div className="space-y-4 p-4">
        <BackLink to="/calculadoras" />

        <section className="panel rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Registrar hoy
            </h2>
            <InfoTip label="Para qué registrar medidas">
              Mide siempre en los mismos puntos y a horas similares para que la evolución sea
              fiable. La app guarda un registro por día y calcula ratios de salud
              (cintura/altura, cintura/cadera) y simetría izquierda-derecha.
            </InfoTip>
          </div>
          {(['tronco', 'brazos', 'piernas'] as const).map((group) => (
            <div key={group} className="mb-4 last:mb-0">
              <p className="mb-2 text-xs font-medium text-muted">
                {BODY_ZONE_GROUP_LABELS[group]}
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                {BODY_ZONES.filter((z) => z.group === group).map((zone) => (
                  <ZoneField
                    key={zone.key}
                    zone={zone}
                    value={values[zone.key] ?? ''}
                    onChange={handleChange}
                  />
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => void handleSave()}
            className="gold-gradient mt-4 flex h-11 w-full items-center justify-center gap-1 rounded-xl font-medium text-on-gold transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" aria-hidden />
            {today ? 'Actualizar medidas' : 'Guardar medidas'}
          </button>
          {error && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {error}
            </p>
          )}
        </section>

        <section className="panel rounded-2xl p-4">
          <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
            Tu altura y sexo
          </h2>
          <div className="mb-3 flex gap-2">
            {(['male', 'female'] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void metaRepo.setJson(BODY_SEX_KEY, s)}
                aria-pressed={sex === s}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                  sex === s
                    ? 'border-cta bg-cta/20 text-accent-soft'
                    : 'border-border text-muted hover:border-cta'
                }`}
              >
                {SEX_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={100}
              max={250}
              inputMode="decimal"
              value={heightInput}
              onChange={(e) => {
                setHeightInput(e.target.value)
                if (heightError) setHeightError(null)
              }}
              placeholder={height ? `${height} cm` : '175'}
              aria-label="Altura en centímetros"
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 text-base font-semibold text-fg placeholder:font-normal placeholder:text-muted focus:border-cta focus:outline-none"
            />
            <button
              onClick={() => void handleSaveHeight()}
              className="flex h-11 shrink-0 items-center gap-1 rounded-xl border border-cta px-4 font-medium text-accent-soft transition-colors hover:bg-cta/10"
            >
              <Ruler className="size-4" aria-hidden />
              Guardar
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            La altura se usa para el ratio cintura/altura; el sexo, para el ratio
            cintura/cadera. Se guardan una sola vez.
          </p>
          {heightError && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {heightError}
            </p>
          )}
        </section>

        {latest && hasRatios && ratioData && (
          <section className="panel rounded-2xl p-4">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Ratios
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {ratioData.whtr != null && (
                <div className="rounded-xl border border-border/50 bg-bg/40 p-3">
                  <p className="text-xs text-muted">Cintura/altura</p>
                  <p className="font-display text-xl font-semibold text-fg">
                    {ratioData.whtr.toFixed(2)}
                  </p>
                  <p className="text-xs font-medium" style={{ color: whtrCategoryColor(whtrCategory(ratioData.whtr)) }}>
                    {whtrCategoryLabel(whtrCategory(ratioData.whtr))}
                  </p>
                </div>
              )}
              {ratioData.whr != null && (
                <div className="rounded-xl border border-border/50 bg-bg/40 p-3">
                  <p className="text-xs text-muted">Cintura/cadera</p>
                  <p className="font-display text-xl font-semibold text-fg">
                    {ratioData.whr.toFixed(2)}
                  </p>
                  <p
                    className="text-xs font-medium"
                    style={{
                      color: whrCategoryColor(whrCategory(ratioData.whr, sex)),
                    }}
                  >
                    {whrCategoryLabel(whrCategory(ratioData.whr, sex))}
                  </p>
                </div>
              )}
            </div>
            {ratioData.symmetries.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs text-muted">Simetría izq-der (diferencia %)</p>
                <ul className="space-y-1">
                  {ratioData.symmetries.map((s) => (
                    <li key={s.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted">{s.label}</span>
                      <span className="font-medium text-fg">{s.pct?.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {latest && (
          <section className="panel rounded-2xl p-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Última medición
            </h2>
            <p className="mb-2 text-xs text-muted">
              {new Date(latest.localDate + 'T12:00:00').toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </p>
            <ul className="divide-y divide-border/40">
              {BODY_ZONES.filter((z) => latest.values[z.key] != null).map((zone) => {
                const v = latest.values[zone.key] as number
                const prev = previousValue(zone.key)
                return (
                  <li key={zone.key} className="flex items-center justify-between gap-2 py-2">
                    <span className="text-sm text-muted">{zone.label}</span>
                    <span className="flex items-center gap-2">
                      {prev != null && (
                        <span
                          className="text-xs font-medium text-accent"
                          title="vs. anterior"
                        >
                          {formatDelta(v - prev)}
                        </span>
                      )}
                      <span className="font-display font-semibold text-fg">
                        {v.toFixed(1)} cm
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {entries.length >= 1 && (
          <section className="panel rounded-2xl p-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Evolución
            </h2>
            <BodyMeasurementsChart entries={entries} />
          </section>
        )}

        {entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-8 text-center">
            <p className="text-sm text-muted">
              Registra tus medidas (cuello, bíceps, cintura…) para ver la evolución y los
              ratios de cada zona.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted">
          Valores orientativos. No sustituyen una valoración profesional.
        </p>
      </div>
    </div>
  )
}
