// Tab de composición corporal: solo monta hooks de cuerpo cuando está activo.
import { useTranslation } from 'react-i18next'
import { BarChart3 } from 'lucide-react'
import { CuerpoStats } from '@/components/stats/CuerpoStats'
import { useBodyWeight } from '@/hooks/useBodyWeight'
import { useBodyMeasurements } from '@/hooks/useBodyMeasurements'
import { useSkinfolds } from '@/hooks/useSkinfolds'
import { useMetaValue } from '@/hooks/useMetaValue'
import { useWorkouts } from '@/hooks/useWorkouts'
import { BODY_SEX_KEY, HEIGHT_KEY } from '@/domain/profileMeta'
import type { Sex } from '@/domain/types'

export const CuerpoTab = () => {
  const { t } = useTranslation()
  const { entries: weightEntries } = useBodyWeight()
  const { entries: measurementEntries } = useBodyMeasurements()
  const { entries: skinfoldEntries } = useSkinfolds()
  const heightCm = useMetaValue<number>(HEIGHT_KEY, 0)
  const sex = useMetaValue<Sex>(BODY_SEX_KEY, 'male')
  const { workouts } = useWorkouts()

  // Paridad: el booleano global original incluye workouts para ambas pestañas.
  const hasData =
    workouts.length > 0 ||
    weightEntries.length > 0 ||
    measurementEntries.length > 0 ||
    skinfoldEntries.length > 0

  if (hasData) {
    return (
      <CuerpoStats
        weightEntries={weightEntries}
        measurementEntries={measurementEntries}
        skinfoldEntries={skinfoldEntries}
        heightCm={heightCm}
        sex={sex}
      />
    )
  }

  return (
    <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-8 text-center">
      <BarChart3 className="mx-auto mb-3 size-8 text-cta" aria-hidden />
      <p className="font-display text-base font-semibold text-fg">
        {t('estadisticas.sinDatosTitulo')}
      </p>
      <p className="mt-1 text-sm text-muted">
        {t('estadisticas.sinDatosTexto')}
      </p>
    </div>
  )
}
