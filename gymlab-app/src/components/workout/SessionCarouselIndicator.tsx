// Indicador V2 del carrusel: contador «N de M» (slide en reposo) + barra segmentada por grupo.
// Los segmentos solo indican en v1 (no son clickeables): actual resaltado, completados
// encendidos, resto apagado.
import { useTranslation } from 'react-i18next'
import { isGroupComplete, uniqueGroupKeys, type ExerciseGroup } from '@/domain/sessionGroups'
import type { ActiveExercise } from '@/store/activeWorkoutStore'

interface SessionCarouselIndicatorProps {
  groups: ExerciseGroup<ActiveExercise>[]
  activeIndex: number
}

export const SessionCarouselIndicator = ({ groups, activeIndex }: SessionCarouselIndicatorProps) => {
  const { t } = useTranslation()
  // Misma identidad única que el carrusel (R3-001): sin esto, dos sueltos idénticos
  // consecutivos repetirían la key del segmento.
  const groupKeys = uniqueGroupKeys(groups)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="kicker">{t('session.carruselAria')}</p>
        <p className="text-xs font-medium text-muted" aria-live="polite">
          {t('session.contadorGrupos', { actual: activeIndex + 1, total: groups.length })}
        </p>
      </div>
      <div className="flex gap-1 px-1" aria-hidden>
        {groups.map((group, index) => (
          <span
            key={groupKeys[index]}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index === activeIndex ? 'bg-cta' : isGroupComplete(group) ? 'bg-success' : 'bg-border'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
