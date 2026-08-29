// Panel de metadatos de la rutina: título, objetivo, nivel y descripción.
import { useTranslation } from 'react-i18next'
import { LEVELS, OBJECTIVES } from '@/domain/catalog'
import type { Level, Objective } from '@/domain/types'
import { localizeLevel, localizeObjective } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'
import { Panel } from '@/components/ui/Panel'

interface RoutineInfoFormProps {
  title: string
  objective: Objective
  level: Level
  description: string
  onTitleChange: (value: string) => void
  onObjectiveChange: (value: Objective) => void
  onLevelChange: (value: Level) => void
  onDescriptionChange: (value: string) => void
}

const inputClass =
  'h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none'

export const RoutineInfoForm = ({
  title,
  objective,
  level,
  description,
  onTitleChange,
  onObjectiveChange,
  onLevelChange,
  onDescriptionChange,
}: RoutineInfoFormProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  return (
    <Panel as="section">
      <label htmlFor="rb-title" className="mb-1 block kicker">
        {t('rutinas.builder.nombre')}
      </label>
      <input
        id="rb-title"
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t('rutinas.builder.nombrePlaceholder')}
        className={inputClass}
      />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="rb-objective" className="mb-1 block kicker">
            {t('rutinas.builder.objetivo')}
          </label>
          <select
            id="rb-objective"
            value={objective}
            onChange={(e) => onObjectiveChange(e.target.value as Objective)}
            className={inputClass}
          >
            {OBJECTIVES.map((o) => (
              <option key={o} value={o}>
                {localizeObjective(o, lang)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rb-level" className="mb-1 block kicker">
            {t('rutinas.builder.nivel')}
          </label>
          <select
            id="rb-level"
            value={level}
            onChange={(e) => onLevelChange(e.target.value as Level)}
            className={inputClass}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {localizeLevel(l, lang)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label
        htmlFor="rb-description"
        className="mb-1 mt-3 block text-xs font-semibold uppercase tracking-wider text-muted"
      >
        {t('rutinas.builder.descripcion')}
      </label>
      <textarea
        id="rb-description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder={t('rutinas.builder.descripcionPlaceholder')}
        rows={2}
        className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
      />
    </Panel>
  )
}