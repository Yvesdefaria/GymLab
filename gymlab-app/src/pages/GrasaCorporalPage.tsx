import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Info, Percent, Save } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { SkinfoldGuide } from '@/components/body/SkinfoldGuide'
import { SkinfoldChart } from '@/components/body/SkinfoldChart'
import { useSkinfolds } from '@/hooks/useSkinfolds'
import { metaRepo } from '@/data/repositories'
import { SKINFOLD_SITES, SEX_LABELS } from '@/domain/bodyMeasurements'
import {
  bodyFatCategory,
  bodyFatCategoryColor,
  bodyFatCategoryLabel,
  calcFatFreeMass,
  calcFatMass,
  calcJacksonPollock,
} from '@/domain/calculators/bodyComposition'
import type { Sex, SkinfoldSite } from '@/domain/types'

const SEX_KEY = 'bodySex'

const SiteField = memo(
  ({
    site,
    value,
    onChange,
  }: {
    site: (typeof SKINFOLD_SITES)[number]
    value: string
    onChange: (key: SkinfoldSite, value: string) => void
  }) => {
    const [showGuide, setShowGuide] = useState(false)
    const id = `pliegue-${site.key}`
    return (
      <div>
        <div className="mb-1 flex items-center gap-1">
          <label htmlFor={id} className="flex-1 text-sm text-muted">
            {site.label}
          </label>
          <button
            type="button"
            onClick={() => setShowGuide((s) => !s)}
            aria-expanded={showGuide}
            aria-label={`Cómo medir el pliegue ${site.label}`}
            className="flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:text-accent"
          >
            <Info className="size-4" aria-hidden />
          </button>
        </div>
        <div className="relative">
          <input
            id={id}
            type="number"
            min={0}
            max={80}
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(site.key, e.target.value)}
            placeholder="—"
            className="h-11 w-full rounded-xl border border-border bg-bg pr-10 text-sm font-semibold text-fg placeholder:text-muted/70 focus:border-cta focus:outline-none"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
            mm
          </span>
        </div>
        {showGuide && <p className="mt-1 text-xs leading-snug text-muted">{site.guide}</p>}
      </div>
    )
  },
)
SiteField.displayName = 'SiteField'

export const GrasaCorporalPage = () => {
  const { entries, saveToday, today } = useSkinfolds()
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [sites, setSites] = useState<Partial<Record<SkinfoldSite, string>>>({})
  const [error, setError] = useState<string | null>(null)

  const sex = useLiveQuery(() => metaRepo.getJson<Sex>(SEX_KEY, 'male'), []) ?? 'male'

  const todayValuesJson = useMemo(
    () =>
      today
        ? JSON.stringify({ age: today.age, weightKg: today.weightKg, sites: today.sites })
        : '',
    [today],
  )
  useEffect(() => {
    if (!todayValuesJson) {
      setAge('')
      setWeight('')
      setSites({})
      return
    }
    try {
      const p = JSON.parse(todayValuesJson) as {
        age: number
        weightKg: number | null
        sites: Partial<Record<SkinfoldSite, number>>
      }
      setAge(p.age ? String(p.age) : '')
      setWeight(p.weightKg != null && p.weightKg > 0 ? String(p.weightKg) : '')
      const asStrings: Partial<Record<SkinfoldSite, string>> = {}
      for (const [k, v] of Object.entries(p.sites ?? {})) asStrings[k as SkinfoldSite] = String(v)
      setSites(asStrings)
    } catch {
      setAge('')
      setWeight('')
      setSites({})
    }
  }, [todayValuesJson])

  const handleChange = useCallback((key: SkinfoldSite, value: string) => {
    setSites((prev) => ({ ...prev, [key]: value }))
  }, [])

  const ageNum = parseInt(age, 10)
  const weightNum = parseFloat(weight)

  const parsedSites = useMemo(() => {
    const payload: Partial<Record<SkinfoldSite, number>> = {}
    for (const s of SKINFOLD_SITES) {
      const n = parseFloat(sites[s.key] ?? '')
      if (!Number.isNaN(n) && n > 0) payload[s.key] = Math.round(n * 10) / 10
    }
    return payload
  }, [sites])

  const result7 = ageNum > 0 ? calcJacksonPollock({ sites: parsedSites, sex, age: ageNum }, '7') : null
  const result3 = ageNum > 0 ? calcJacksonPollock({ sites: parsedSites, sex, age: ageNum }, '3') : null
  const active =
    result7?.bodyFatPct != null
      ? { ...result7, protocol: '7' as const }
      : result3?.bodyFatPct != null
        ? { ...result3, protocol: '3' as const }
        : null

  const category = active?.bodyFatPct != null ? bodyFatCategory(active.bodyFatPct, sex) : null
  const fatMass = active?.bodyFatPct != null && weightNum > 0 ? calcFatMass(weightNum, active.bodyFatPct) : null
  const fatFreeMass = active?.bodyFatPct != null && weightNum > 0 ? calcFatFreeMass(weightNum, active.bodyFatPct) : null

  const handleSave = async () => {
    if (Number.isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      setError('Introduce una edad válida.')
      return
    }
    if (Object.keys(parsedSites).length === 0) {
      setError('Introduce al menos un pliegue en milímetros.')
      return
    }
    setError(null)
    await saveToday({
      sex,
      age: ageNum,
      weightKg: !Number.isNaN(weightNum) && weightNum > 0 ? weightNum : null,
      sites: parsedSites,
    })
  }

  const latest = entries[entries.length - 1]
  const latestPct = useMemo(() => {
    if (!latest) return null
    const r7 = calcJacksonPollock({ sites: latest.sites, sex: latest.sex, age: latest.age }, '7')
    const r3 = calcJacksonPollock({ sites: latest.sites, sex: latest.sex, age: latest.age }, '3')
    return r7.bodyFatPct ?? r3.bodyFatPct
  }, [latest])

  return (
    <div>
      <AppHeader title="Grasa corporal" subtitle="Picómetro (pliegues cutáneos)" />
      <div className="space-y-4 p-4">
        <BackLink to="/mas" />

        <SkinfoldGuide />

        <section className="panel rounded-2xl p-4">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
            Registrar hoy
          </h2>

          <div className="mb-3 flex gap-2">
            {(['male', 'female'] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void metaRepo.setJson(SEX_KEY, s)}
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

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="picometro-edad" className="mb-1 block text-sm text-muted">
                Edad
              </label>
              <input
                id="picometro-edad"
                type="number"
                min={1}
                max={120}
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="30"
                className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm font-semibold text-fg placeholder:font-normal placeholder:text-muted/70 focus:border-cta focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="picometro-peso" className="mb-1 block text-sm text-muted">
                Peso (kg, opcional)
              </label>
              <input
                id="picometro-peso"
                type="number"
                min={0}
                max={400}
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75"
                className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm font-semibold text-fg placeholder:font-normal placeholder:text-muted/70 focus:border-cta focus:outline-none"
              />
            </div>
          </div>

          <p className="mb-2 text-xs font-medium text-muted">Pliegues (mm)</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            {SKINFOLD_SITES.map((site) => (
              <SiteField
                key={site.key}
                site={site}
                value={sites[site.key] ?? ''}
                onChange={handleChange}
              />
            ))}
          </div>

          <button
            onClick={() => void handleSave()}
            className="gold-gradient mt-4 flex h-11 w-full items-center justify-center gap-1 rounded-xl font-medium text-on-gold transition-opacity hover:opacity-90"
          >
            <Save className="size-4" aria-hidden />
            {today ? 'Actualizar registro' : 'Guardar registro'}
          </button>
          {error && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {error}
            </p>
          )}
        </section>

        {active?.bodyFatPct != null ? (
          <section className="panel rounded-2xl p-6 text-center">
            <p className="kicker">Tu grasa corporal</p>
            <div className="flex items-center justify-center gap-2">
              <Percent className="size-6 text-accent" aria-hidden />
              <p className="stat-value text-4xl">{active.bodyFatPct}</p>
            </div>
            {category && (
              <p
                className="mt-1 font-display text-base font-semibold"
                style={{ color: bodyFatCategoryColor(category) }}
              >
                {bodyFatCategoryLabel(category)}
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              {active.bodyDensity != null &&
                `Densidad ${active.bodyDensity.toFixed(4)} g/ml · `}
              Protocolo Jackson-Pollock {active.protocol === '7' ? 'de 7' : 'de 3'} pliegues + Siri
            </p>
            {fatMass != null && fatFreeMass != null && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/50 bg-bg/40 p-3">
                  <p className="text-xs text-muted">Masa grasa</p>
                  <p className="font-display text-lg font-semibold text-fg">{fatMass} kg</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-bg/40 p-3">
                  <p className="text-xs text-muted">Masa magra</p>
                  <p className="font-display text-lg font-semibold text-fg">{fatFreeMass} kg</p>
                </div>
              </div>
            )}
          </section>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-bg-elevated/50 p-4 text-center text-sm text-muted">
            {ageNum > 0
              ? `Introduce los pliegues para calcular el %. Con 7 pliegues se usa Jackson-Pollock 7; con 3, el protocolo de 3.`
              : 'Introduce tu edad y al menos 3 pliegues para ver el % de grasa en vivo.'}
          </div>
        )}

        {latest && latestPct != null && (
          <section className="panel rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
                Último registro
              </h2>
              <span className="font-display font-semibold text-fg">{latestPct}%</span>
            </div>
            <p className="text-xs text-muted">
              {new Date(latest.localDate + 'T12:00:00').toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
              {' · '}
              {latest.sites && Object.keys(latest.sites).length} pliegues guardados
            </p>
          </section>
        )}

        {entries.length >= 1 && (
          <section className="panel rounded-2xl p-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              Evolución
            </h2>
            <SkinfoldChart entries={entries} />
          </section>
        )}

        {entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-8 text-center">
            <p className="text-sm text-muted">
              Registra tus pliegues cutáneos con el picómetro para calcular tu % de grasa y
              seguir su evolución.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted">
          Resultado orientativo (ecuaciones de población). No sustituye una valoración
          profesional ni una báscula de impedancia clínica.
        </p>
      </div>
    </div>
  )
}
