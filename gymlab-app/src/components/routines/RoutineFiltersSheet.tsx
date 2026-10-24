// Sheet de filtros del catálogo: tipo y nivel en borrador, con conteo en vivo y "Ver N rutinas".
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { FilterChips } from '@/components/ui/FilterChips'
import { LEVELS } from '@/domain/catalog'
import type { AppLanguage } from '@/domain/onboarding'
import type { Level, Objective } from '@/domain/types'
import { localizeLevel } from '@/i18n/catalog'

export type RoutineTypeFilter = 'todas' | 'sesion' | 'programa'

export type RoutineFiltersValue = {
  type: RoutineTypeFilter
  objective: Objective | null
  level: Level | null
}

export const RoutineFiltersSheet = ({
  value,
  countFor,
  onApply,
  onClose,
}: {
  value: RoutineFiltersValue
  countFor: (value: RoutineFiltersValue) => number
  onApply: (value: RoutineFiltersValue) => void
  onClose: () => void
}) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  // Borrador: nada se aplica hasta confirmar; cerrar descarta los cambios.
  const [draft, setDraft] = useState<RoutineFiltersValue>(value)
  const count = countFor(draft)

  return (
    <BottomSheet
      title={t('rutinas.filtros.titulo')}
      subtitle={t('rutinas.filtros.subtitulo')}
      onClose={onClose}
    >
      <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        {t('rutinas.filtros.tipo')}
      </p>
      <FilterChips<RoutineTypeFilter>
        options={[
          { value: 'todas', label: t('rutinas.filtros.tipoTodas') },
          { value: 'sesion', label: t('rutinas.sesionSuelta') },
          { value: 'programa', label: t('rutinas.filtros.tipoPrograma') },
        ]}
        value={draft.type}
        onChange={(next) => setDraft({ ...draft, type: next ?? 'todas' })}
        ariaLabel={t('rutinas.filtros.tipo')}
        allowDeselect={false}
      />
      <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        {t('rutinas.filtros.nivel')}
      </p>
      <FilterChips<Level>
        options={LEVELS.map((level) => ({ value: level, label: localizeLevel(level, lang) }))}
        value={draft.level}
        onChange={(next) => setDraft({ ...draft, level: next })}
        ariaLabel={t('rutinas.filtros.nivel')}
      />
      <div className="mt-5 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setDraft({ type: 'todas', objective: value.objective, level: null })}
        >
          {t('rutinas.filtros.limpiar')}
        </Button>
        <Button variant="flat" size="sm" className="flex-1" onClick={() => onApply(draft)}>
          {t('rutinas.filtros.ver', { count })}
        </Button>
      </div>
    </BottomSheet>
  )
}
