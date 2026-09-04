import { useTranslation } from 'react-i18next'
import { Dumbbell } from 'lucide-react'
import { MuscleDummy } from '@/components/body/MuscleDummy'
import type { MuscleGroup, MuscleZone } from '@/domain/types'
import { localizeMuscleZone } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'

export const ExerciseMuscleCard = ({
  muscleGroup,
  muscleZones = [],
  lang,
}: {
  muscleGroup: MuscleGroup
  muscleZones?: MuscleZone[]
  lang: AppLanguage
}) => {
  const { t } = useTranslation()
  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="mb-1 flex items-center gap-2">
        <Dumbbell className="size-5 text-accent" />
        <span className="font-display text-sm font-semibold text-accent">{t('ejercicios.detalle.musculoTrabajado')}</span>
      </div>
      <MuscleDummy fatigue={{}} highlight={muscleGroup} showLegend={false} />
      {muscleZones.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={t('ejercicios.detalle.zonas')}>
          {muscleZones.map((z) => (
            <li key={z} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {localizeMuscleZone(z, lang)}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
