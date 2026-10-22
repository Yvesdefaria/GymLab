// Tarjeta «Tus datos» del perfil: resume lo que el onboarding guardó (edad, altura,
// sexo y último peso) y enlaza a las pantallas donde se edita. Omite lo que falte.
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useBodyProfile } from '@/hooks/useBodyProfile'
import { useSettings } from '@/hooks/useSettings'
import { applyUnits, formatUnits } from '@/domain/settings'
import type { BodyWeightEntry } from '@/domain/types'

export const PersonalDataCard = ({ bodyWeights }: { bodyWeights?: readonly BodyWeightEntry[] }) => {
  const { t } = useTranslation()
  const { age, bodySex, heightCm, weightKg } = useBodyProfile(bodyWeights)
  const { settings } = useSettings()

  const items: { label: string; value: string }[] = []
  if (age != null) items.push({ label: t('perfil.datosEdad'), value: t('perfil.datosAnios', { count: age }) })
  if (heightCm != null) items.push({ label: t('perfil.datosAltura'), value: `${heightCm} cm` })
  if (bodySex != null) {
    items.push({ label: t('perfil.datosSexo'), value: t(bodySex === 'female' ? 'perfil.datosMujer' : 'perfil.datosHombre') })
  }
  if (weightKg != null) {
    items.push({
      label: t('perfil.datosPeso'),
      value: `${applyUnits(weightKg, settings.units).toFixed(1)} ${formatUnits(settings.units)}`,
    })
  }

  if (items.length === 0) return null

  return (
    <section className="panel-light rounded-2xl p-4">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
        {t('perfil.datosPersonales')}
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-fg">{item.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <Link to="/calculadoras/medidas" className="text-accent-soft underline">
          {t('perfil.datosEditarMedidas')}
        </Link>
        <Link to="/peso-corporal" className="text-accent-soft underline">
          {t('perfil.datosEditarPeso')}
        </Link>
      </div>
    </section>
  )
}
