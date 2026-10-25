// Bloque «músculo trabajado» de la ficha: mapa corporal + zonas como chips hairline.
import { useTranslation } from 'react-i18next'
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
    <section className="border-t border-border/40 pt-4">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {t('ejercicios.detalle.musculoTrabajado')}
      </h2>
      <MuscleDummy fatigue={{}} highlight={muscleGroup} showLegend={false} />
      {muscleZones.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label={t('ejercicios.detalle.zonas')}>
          {muscleZones.map((z) => (
            <li key={z} className="rounded-full border border-border/50 px-2.5 py-1 text-[10px] text-muted">
              {localizeMuscleZone(z, lang)}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
