// Página /calculadoras/grasa: % de grasa con picómetro (Jackson-Pollock + Siri) con registro
// diario por upsert, resultado en vivo y gráfico. Las piezas reutilizables (MeasurementField,
// SexSelector, BodySaveButton) viven en components/body; el resultado y el último registro en
// BodyFatResultCard y LastSkinfoldCard respectivamente.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BodyLogLayout } from '@/components/body-log/BodyLogLayout'
import { CalculatorSection } from '@/components/calculators/CalculatorSection'
import { CalculatorField } from '@/components/calculators/CalculatorField'
import { ChartCardVariantProvider } from '@/components/stats/ChartCardVariant'
import { InfoTip } from '@/components/ui/InfoTip'
import { MeasurementField } from '@/components/body/MeasurementField'
import { SexSelector } from '@/components/body/SexSelector'
import { BodySaveButton } from '@/components/body/BodySaveButton'
import { BodyFatResultCard, type BodyFatActiveResult } from '@/components/body/BodyFatResultCard'
import { LastSkinfoldCard } from '@/components/body/LastSkinfoldCard'
import { SkinfoldChart } from '@/components/body/SkinfoldChart'
import { useSkinfolds } from '@/hooks/useSkinfolds'
import { useMetaValue } from '@/hooks/useMetaValue'
import { useAgePrefill } from '@/hooks/useAgePrefill'
import { useBodyProfile } from '@/hooks/useBodyProfile'
import { BODY_SEX_KEY } from '@/domain/profileMeta'
import { SKINFOLD_SITES } from '@/domain/bodyMeasurements'
import { calcJacksonPollock, latestBodyFat, optionalSkinfolds } from '@/domain/calculators/bodyComposition'
import type { Sex, SkinfoldSite } from '@/domain/types'

export const GrasaCorporalPage = () => {
  const { t } = useTranslation()
  const { entries, saveToday, today } = useSkinfolds()
  const [age, setAge] = useState<number | undefined>(undefined)
  const [weight, setWeight] = useState<number | undefined>(undefined)
  const [sites, setSites] = useState<Partial<Record<SkinfoldSite, number>>>({})
  const [error, setError] = useState<string | null>(null)

  const sex = useMetaValue<Sex>(BODY_SEX_KEY, 'male')

  // Los pliegues del protocolo de 3 son los mínimos; el resto son opcionales del de 7.
  const optional = useMemo(() => new Set(optionalSkinfolds(sex)), [sex])

  // Si ya hay registro de hoy, se rehidrata el formulario con esos valores.
  const todayValuesJson = useMemo(
    () =>
      today
        ? JSON.stringify({ age: today.age, weightKg: today.weightKg, sites: today.sites })
        : '',
    [today],
  )
  useEffect(() => {
    if (!todayValuesJson) {
      setAge(undefined)
      setWeight(undefined)
      setSites({})
      return
    }
    try {
      const p = JSON.parse(todayValuesJson) as {
        age: number
        weightKg: number | null
        sites: Partial<Record<SkinfoldSite, number>>
      }
      setAge(p.age ? p.age : undefined)
      setWeight(p.weightKg != null && p.weightKg > 0 ? p.weightKg : undefined)
      setSites(p.sites ?? {})
    } catch {
      setAge(undefined)
      setWeight(undefined)
      setSites({})
    }
  }, [todayValuesJson])

  // Edad pre-rellenada desde el perfil solo si no hay registro guardado de hoy.
  // El hook trabaja con strings; se adapta al estado numérico sin cambiar su contrato.
  useAgePrefill(
    age === undefined ? '' : String(age),
    (v) => setAge(v === '' ? undefined : Number(v)),
    Boolean(today),
  )

  // Peso del onboarding/perfil: solo rellena si hoy no hay registro y el campo está vacío.
  const { weightKg: profileWeightKg } = useBodyProfile()
  useEffect(() => {
    if (!today && weight === undefined && profileWeightKg != null) setWeight(profileWeightKg)
  }, [today, weight, profileWeightKg])

  const handleChange = useCallback((key: SkinfoldSite, value: number | undefined) => {
    setSites((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Callback estable por pliegue (clave cerrada) para que MeasurementField (memo) no se re-renderice.
  const onSiteChange = useCallback(
    (key: SkinfoldSite) => (value: number | undefined) => handleChange(key, value),
    [handleChange],
  )

  const ageNum = age ?? 0
  const weightNum = weight ?? Number.NaN

  // Convierte los inputs a números; descarta pliegues vacíos o <= 0 y redondea a 0.1 mm.
  const parsedSites = useMemo(() => {
    const payload: Partial<Record<SkinfoldSite, number>> = {}
    for (const s of SKINFOLD_SITES) {
      const value = sites[s.key]
      if (value !== undefined && value > 0) payload[s.key] = Math.round(value * 10) / 10
    }
    return payload
  }, [sites])

  // Resultado en vivo: prefiere el protocolo de 7 pliegues y cae al de 3 si no hay suficientes.
  const result7 = ageNum > 0 ? calcJacksonPollock({ sites: parsedSites, sex, age: ageNum }, '7') : null
  const result3 = ageNum > 0 ? calcJacksonPollock({ sites: parsedSites, sex, age: ageNum }, '3') : null
  const active: BodyFatActiveResult | null = (() => {
    if (result7?.bodyFatPct != null) {
      return { bodyFatPct: result7.bodyFatPct, bodyDensity: result7.bodyDensity, protocol: '7' as const }
    }
    if (result3?.bodyFatPct != null) {
      return { bodyFatPct: result3.bodyFatPct, bodyDensity: result3.bodyDensity, protocol: '3' as const }
    }
    return null
  })()

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
  const latestPct = latestBodyFat(entries)?.pct ?? null

  return (
    <BodyLogLayout
      title={t('grasa.titulo')}
      subtitle={t('grasa.subtitulo')}
      backTo="/calculadoras"
      hasData={entries.length > 0}
      emptyMessage={entries.length === 0 ? t('grasa.sinDatos') : undefined}
      disclaimer={t('grasa.disclaimer')}
    >
      <ChartCardVariantProvider variant="minimal">
      <CalculatorSection
        title={t('grasa.registrarHoy')}
        meta={<InfoTip id="grasa" />}
      >
        <div className="mb-3">
          <SexSelector />
        </div>

        <CalculatorField
          label={t('grasa.edad')}
          value={age}
          onChange={setAge}
          placeholder="30"
          mode="integer"
          suffix={t('calculadoras.calorias.anios')}
        />
        <CalculatorField
          label={t('grasa.pesoLabel')}
          value={weight}
          onChange={setWeight}
          placeholder="75"
          suffix="kg"
        />

        <p className="mb-1 pt-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">{t('grasa.pliegues')}</p>
        <p className="mb-2 text-[10px] leading-relaxed text-muted">{t('grasa.hintOpcionales')}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          {SKINFOLD_SITES.map((site) => (
            <MeasurementField
              key={site.key}
              id={`pliegue-${site.key}`}
              label={t(`grasa.sitios.${site.key}`)}
              guideTip={t('grasa.comoMedir', { label: t(`grasa.sitios.${site.key}`) })}
              guide={site.guide}
              value={sites[site.key]}
              suffix="mm"
              tag={optional.has(site.key) ? 'opt' : 'min'}
              tagLabel={optional.has(site.key) ? t('grasa.opcional') : t('grasa.minima')}
              onChange={onSiteChange(site.key)}
            />
          ))}
        </div>

        <BodySaveButton
          today={Boolean(today)}
          labelGuardar={t('grasa.guardar')}
          labelActualizar={t('grasa.actualizar')}
          onSave={() => void handleSave()}
        />
        {error && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {error}
          </p>
        )}
      </CalculatorSection>

      <BodyFatResultCard active={active} hasAge={ageNum > 0} weightNum={weightNum} sex={sex} />

      {latest && latestPct != null && (
        <LastSkinfoldCard latest={latest} latestPct={latestPct} />
      )}

      {entries.length >= 1 && (
        <SkinfoldChart entries={entries} />
      )}
      </ChartCardVariantProvider>
    </BodyLogLayout>
  )
}