// Página /calculadoras/grasa: cálculo del % de grasa con picómetro (Jackson-Pollock + Siri).
// Registro diario con upsert por fecha local, resultado en vivo y gráfico de evolución.
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Percent, Save } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'
import { InfoTip } from '@/components/ui/InfoTip'
import { SkinfoldChart } from '@/components/body/SkinfoldChart'
import { useSkinfolds } from '@/hooks/useSkinfolds'
import { useMetaValue } from '@/hooks/useMetaValue'
import { useAgePrefill } from '@/hooks/useAgePrefill'
import { metaRepo } from '@/data/repositories'
import { BODY_SEX_KEY } from '@/domain/profileMeta'
import { SKINFOLD_SITES, SEX_LABELS } from '@/domain/bodyMeasurements'
import {
  bodyFatCategory,
  bodyFatCategoryColor,
  bodyFatCategoryLabel,
  calcFatFreeMass,
  calcFatMass,
  calcJacksonPollock,
} from '@/domain/calculators/bodyComposition'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import type { Sex, SkinfoldSite } from '@/domain/types'

const SEX_KEY = BODY_SEX_KEY

// Campo de entrada de un único pliegue (mm), memoizado para no re-renderizar los demás al teclear.
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
    const { t } = useTranslation()
    const id = `pliegue-${site.key}`
    return (
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor={id} className="text-sm text-muted">
            {site.label}
          </label>
          <InfoTip label={t('grasa.comoMedir', { label: site.label })}>{site.guide}</InfoTip>
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
            className="h-11 w-full rounded-xl border border-border bg-bg pr-10 text-sm font-semibold text-fg placeholder:text-muted focus:border-cta focus:outline-none"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
            mm
          </span>
        </div>
      </div>
    )
  },
)
SiteField.displayName = 'SiteField'

export const GrasaCorporalPage = () => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { entries, saveToday, today } = useSkinfolds()
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [sites, setSites] = useState<Partial<Record<SkinfoldSite, string>>>({})
  const [error, setError] = useState<string | null>(null)

  const sex = useMetaValue<Sex>(SEX_KEY, 'male')

  // Al cargar, si ya hay registro de hoy se rehidrata el formulario con esos valores.
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

  // Edad pre-rellenada desde el perfil solo si no hay registro guardado de hoy.
  useAgePrefill(age, setAge, Boolean(today))

  const handleChange = useCallback((key: SkinfoldSite, value: string) => {
    setSites((prev) => ({ ...prev, [key]: value }))
  }, [])

  const ageNum = parseInt(age, 10)
  const weightNum = parseFloat(weight)

  // Convierte los inputs a números; descarta pliegues vacíos o <= 0 y redondea a 0.1 mm.
  const parsedSites = useMemo(() => {
    const payload: Partial<Record<SkinfoldSite, number>> = {}
    for (const s of SKINFOLD_SITES) {
      const n = parseFloat(sites[s.key] ?? '')
      if (!Number.isNaN(n) && n > 0) payload[s.key] = Math.round(n * 10) / 10
    }
    return payload
  }, [sites])

  // Resultado en vivo: prefiere el protocolo de 7 pliegues y cae al de 3 si no hay suficientes.
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

  // Valida edad y pliegues antes de hacer el upsert del registro de hoy.
  const handleSave = async () => {
    if (Number.isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      setError(t('grasa.errorEdad'))
      return
    }
    if (Object.keys(parsedSites).length === 0) {
      setError(t('grasa.errorPliegue'))
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
  // Recalcula el % del último registro guardado para mostrarlo en la tarjeta de resumen.
  const latestPct = useMemo(() => {
    if (!latest) return null
    const r7 = calcJacksonPollock({ sites: latest.sites, sex: latest.sex, age: latest.age }, '7')
    const r3 = calcJacksonPollock({ sites: latest.sites, sex: latest.sex, age: latest.age }, '3')
    return r7.bodyFatPct ?? r3.bodyFatPct
  }, [latest])

  return (
    <div>
      <AppHeader title={t('grasa.titulo')} subtitle={t('grasa.subtitulo')} />
      <div className="space-y-4 p-4">
        <BackLink to="/calculadoras" />

        <section className="panel-light rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
              {t('grasa.registrarHoy')}
            </h2>
            <InfoTip label={t('grasa.comoSeCalcula')}>
              {t('grasa.comoSeCalculaDesc')}
            </InfoTip>
          </div>

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
                {t('grasa.edad')}
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
                className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm font-semibold text-fg placeholder:font-normal placeholder:text-muted focus:border-cta focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="picometro-peso" className="mb-1 block text-sm text-muted">
                {t('grasa.peso')}
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
                className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm font-semibold text-fg placeholder:font-normal placeholder:text-muted focus:border-cta focus:outline-none"
              />
            </div>
          </div>

          <p className="mb-2 text-xs font-medium text-muted">{t('grasa.pliegues')}</p>
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
            {today ? t('grasa.actualizar') : t('grasa.guardar')}
          </button>
          {error && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {error}
            </p>
          )}
        </section>

        {active?.bodyFatPct != null ? (
          <section className="panel rounded-2xl p-6 text-center">
            <p className="kicker">{t('grasa.tuGrasa')}</p>
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
                t('grasa.densidad', { valor: active.bodyDensity.toFixed(4) })}
              {t('grasa.protocolo', {
                tipo: active.protocol === '7' ? t('grasa.de7') : t('grasa.de3'),
              })}
            </p>
            {fatMass != null && fatFreeMass != null && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/30 bg-bg-elevated/30 p-3">
                  <p className="text-xs text-muted">{t('grasa.masaGrasa')}</p>
                  <p className="font-display text-lg font-semibold text-fg">{fatMass} kg</p>
                </div>
                <div className="rounded-xl border border-border/30 bg-bg-elevated/30 p-3">
                  <p className="text-xs text-muted">{t('grasa.masaMagra')}</p>
                  <p className="font-display text-lg font-semibold text-fg">{fatFreeMass} kg</p>
                </div>
              </div>
            )}
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-4 text-center text-sm text-muted">
            {ageNum > 0 ? t('grasa.vacioPliegues') : t('grasa.vacioEdad')}
          </div>
        )}

        {latest && latestPct != null && (
          <section className="panel-light rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
                {t('grasa.ultimoRegistro')}
              </h2>
              <span className="font-display font-semibold text-fg">{latestPct}%</span>
            </div>
            <p className="text-xs text-muted">
              {formatDate(latest.localDate + 'T12:00:00', lang, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
              {' · '}
              {t('grasa.plieguesGuardados', {
                count: latest.sites ? Object.keys(latest.sites).length : 0,
              })}
            </p>
          </section>
        )}

        {entries.length >= 1 && (
          <section className="panel-light rounded-2xl p-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
              {t('grasa.evolucion')}
            </h2>
            <SkinfoldChart entries={entries} />
          </section>
        )}

        {entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-8 text-center">
            <p className="text-sm text-muted">
              {t('grasa.sinDatos')}
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted">
          {t('grasa.disclaimer')}
        </p>
      </div>
    </div>
  )
}
