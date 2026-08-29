// Filtros del catálogo de rutinas: tipo (sesión/programa), objetivo y nivel. Presentacional.
import { useTranslation } from 'react-i18next'
import type { AppLanguage } from '@/domain/onboarding'
import type { Level, Objective } from '@/domain/types'
import { LEVELS, OBJECTIVES } from '@/domain/catalog'
import { FilterChips } from '@/components/ui/FilterChips'
import { localizeLevel, localizeObjective } from '@/i18n/catalog'

export type RoutineTypeFilter = 'todas' | 'sesion' | 'programa'

export type RoutineFiltersValue = {
  type: RoutineTypeFilter
  objective: Objective | null
  level: Level | null
}

export const RoutineFilters = ({
  value,
  onChange,
  lang,
}: {
  value: RoutineFiltersValue
  onChange: (value: RoutineFiltersValue) => void
  lang: AppLanguage
}) => {
  const { t } = useTranslation()
  const set = (patch: Partial<RoutineFiltersValue>) => onChange({ ...value, ...patch })
  return (
    <>
      <div className="mb-3">
        <p className="mb-2 kicker">{t('rutinas.filtros.tipo')}</p>
        <FilterChips<RoutineTypeFilter>
          options={[
            { value: 'todas', label: t('rutinas.filtros.tipoTodas') },
            { value: 'sesion', label: t('rutinas.sesionSuelta') },
            { value: 'programa', label: t('rutinas.filtros.tipoPrograma') },
          ]}
          value={value.type}
          onChange={(v) => set({ type: v ?? 'todas' })}
          ariaLabel={t('rutinas.filtros.tipo')}
        />
      </div>

      <div className="mb-3">
        <p className="mb-2 kicker">{t('rutinas.filtros.objetivo')}</p>
        <FilterChips<Objective>
          options={OBJECTIVES.map((obj) => ({ value: obj, label: localizeObjective(obj, lang) }))}
          value={value.objective}
          onChange={(v) => set({ objective: v })}
          ariaLabel={t('rutinas.filtros.objetivo')}
        />
      </div>

      <div className="mb-3">
        <p className="mb-2 kicker">{t('rutinas.filtros.nivel')}</p>
        <FilterChips<Level>
          options={LEVELS.map((lvl) => ({ value: lvl, label: localizeLevel(lvl, lang) }))}
          value={value.level}
          onChange={(v) => set({ level: v })}
          ariaLabel={t('rutinas.filtros.nivel')}
        />
      </div>
    </>
  )
}
