// Página /cuerpo/medidas (vía /calculadoras): registro de medidas por zona con upsert diario.
// Composición fina: form de zonas, selector sexo/altura, ratios y evolución en piezas reutilizables
// (MeasurementField, SexSelector, BodySaveButton, BodyRatiosCard, MeasurementsEntriesCard, BodyMeasurementsChart).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Ruler } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BodyLogLayout } from '@/components/body-log/BodyLogLayout'
import { InfoTip } from '@/components/ui/InfoTip'
import { BodyMeasurementsChart } from '@/components/body/BodyMeasurementsChart'
import { MeasurementField } from '@/components/body/MeasurementField'
import { SexSelector } from '@/components/body/SexSelector'
import { BodySaveButton } from '@/components/body/BodySaveButton'
import { BodyRatiosCard } from '@/components/body/BodyRatiosCard'
import { MeasurementsEntriesCard } from '@/components/body/MeasurementsEntriesCard'
import { useBodyMeasurements } from '@/hooks/useBodyMeasurements'
import { useMetaValue } from '@/hooks/useMetaValue'
import { metaRepo } from '@/data/repositories'
import { BODY_SEX_KEY, HEIGHT_KEY } from '@/domain/profileMeta'
import { BODY_ZONES, BODY_ZONE_GROUP_LABELS, MINIMAL_BODY_ZONES } from '@/domain/bodyMeasurements'
import type { BodyZone, Sex } from '@/domain/types'

// Zonas mínimas (alimentan los ratios WHtR/WHR); el resto son opcionales.
const MINIMAL_ZONES = new Set<BodyZone>(MINIMAL_BODY_ZONES)

export const MedidasCorporalesPage = () => {
  const { t } = useTranslation()
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

  // Callback estable por zona (clave cerrada) para que MeasurementField (memo) no se re-renderice ajeno.
  const onZoneChange = useCallback(
    (key: BodyZone) => (value: string) => handleChange(key, value),
    [handleChange],
  )

  const handleSave = async () => {
    // Filtra zonas vacías o inválidas y redondea a 0.1 cm; exige al menos una medida.
    const payload: Partial<Record<BodyZone, number>> = {}
    for (const zone of BODY_ZONES) {
      const n = parseFloat(values[zone.key] ?? '')
      if (!Number.isNaN(n) && n > 0) payload[zone.key] = Math.round(n * 10) / 10
    }
    if (Object.keys(payload).length === 0) {
      setError(t('cuerpo.medidas.errorVacio'))
      return
    }
    setError(null)
    await saveToday(payload)
  }

  const handleSaveHeight = async () => {
    const cm = parseFloat(heightInput)
    if (Number.isNaN(cm) || cm < 100 || cm > 250) {
      setHeightError(t('cuerpo.medidas.errorAltura'))
      return
    }
    setHeightError(null)
    await metaRepo.setJson(HEIGHT_KEY, Math.round(cm))
  }

  const latest = entries[entries.length - 1]

  return (
    <BodyLogLayout
      title={t('cuerpo.medidas.titulo')}
      subtitle={t('cuerpo.medidas.subtitulo')}
      backTo="/calculadoras"
      hasData={entries.length > 0}
      emptyMessage={entries.length === 0 ? t('cuerpo.medidas.sinDatos') : undefined}
      disclaimer={t('cuerpo.medidas.disclaimer')}
    >
      <section className="panel-light rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
            {t('cuerpo.medidas.registrarHoy')}
          </h2>
          <InfoTip label={t('cuerpo.medidas.infoTipLabel')}>
            {t('cuerpo.medidas.infoTipCuerpo')}
          </InfoTip>
        </div>
        <p className="mb-3 text-xs text-muted">{t('cuerpo.medidas.hintMinimas')}</p>
        {(['tronco', 'brazos', 'piernas'] as const).map((group) => (
          <div key={group} className="mb-4 last:mb-0">
            <p className="mb-2 text-xs font-medium text-muted">
              {BODY_ZONE_GROUP_LABELS[group]}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              {BODY_ZONES.filter((z) => z.group === group).map((zone) => (
                <MeasurementField
                  key={zone.key}
                  id={`medida-${zone.key}`}
                  label={zone.label}
                  guideTip={t('cuerpo.medidas.comoMedir', { zona: zone.label })}
                  guide={zone.guide}
                  value={values[zone.key] ?? ''}
                  min={0}
                  max={300}
                  suffix="cm"
                  tag={MINIMAL_ZONES.has(zone.key) ? 'min' : 'opt'}
                  tagLabel={MINIMAL_ZONES.has(zone.key) ? t('cuerpo.medidas.minima') : t('cuerpo.medidas.opcional')}
                  onChange={onZoneChange(zone.key)}
                />
              ))}
            </div>
          </div>
        ))}
        <BodySaveButton
          today={Boolean(today)}
          labelGuardar={t('cuerpo.medidas.guardar')}
          labelActualizar={t('cuerpo.medidas.actualizar')}
          icon="plus"
          onSave={() => void handleSave()}
        />
        {error && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {error}
          </p>
        )}
      </section>

      <section className="panel-light rounded-2xl p-4">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-accent">
          {t('cuerpo.medidas.alturaSexo')}
        </h2>
        <div className="mb-3">
          <SexSelector />
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
            aria-label={t('cuerpo.medidas.alturaAria')}
            className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 text-base font-semibold text-fg placeholder:font-normal placeholder:text-muted focus:border-cta focus:outline-none"
          />
          <button
            onClick={() => void handleSaveHeight()}
            className="flex h-11 shrink-0 items-center gap-1 rounded-xl border border-cta px-4 font-medium text-accent-soft transition-colors hover:bg-cta/10"
          >
            <Ruler className="size-4" aria-hidden />
            {t('cuerpo.medidas.guardarBtn')}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          {t('cuerpo.medidas.alturaAyuda')}
        </p>
        {heightError && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {heightError}
          </p>
        )}
      </section>

      {latest && <BodyRatiosCard values={latest.values} height={height} sex={sex} />}

      {latest && <MeasurementsEntriesCard entries={entries} />}

      {entries.length >= 1 && (
        <BodyMeasurementsChart entries={entries} />
      )}
    </BodyLogLayout>
  )
}