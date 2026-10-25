// Metadatos de la rutina en hairline: nombre, objetivo, nivel y descripción.
// Sin tarjeta: labels kicker + campos transparentes separados por hairlines.
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LEVELS, OBJECTIVES } from '@/domain/catalog'
import type { Level, Objective } from '@/domain/types'
import { localizeLevel, localizeObjective } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'

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

const fieldClass = 'w-full appearance-none bg-transparent text-sm text-fg focus:outline-none'

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
    <section>
      <div className="border-b border-border/40 pb-2 focus-within:border-cta">
        <label htmlFor="rb-title" className="kicker block">
          {t('rutinas.builder.nombre')}
        </label>
        <input
          id="rb-title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t('rutinas.builder.nombrePlaceholder')}
          className="mt-1 w-full bg-transparent font-display text-xl text-fg placeholder:text-muted/60 focus:outline-none"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="border-b border-border/40 pb-2 focus-within:border-cta">
          <label htmlFor="rb-objective" className="kicker block">
            {t('rutinas.builder.objetivo')}
          </label>
          <div className="relative mt-1">
            <select
              id="rb-objective"
              value={objective}
              onChange={(e) => onObjectiveChange(e.target.value as Objective)}
              className={`${fieldClass} pr-6`}
            >
              {OBJECTIVES.map((o) => (
                <option key={o} value={o}>
                  {localizeObjective(o, lang)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          </div>
        </div>
        <div className="border-b border-border/40 pb-2 focus-within:border-cta">
          <label htmlFor="rb-level" className="kicker block">
            {t('rutinas.builder.nivel')}
          </label>
          <div className="relative mt-1">
            <select
              id="rb-level"
              value={level}
              onChange={(e) => onLevelChange(e.target.value as Level)}
              className={`${fieldClass} pr-6`}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {localizeLevel(l, lang)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          </div>
        </div>
      </div>

      <div className="mt-4 border-b border-border/40 pb-2 focus-within:border-cta">
        <label htmlFor="rb-description" className="kicker block">
          {t('rutinas.builder.descripcion')}
        </label>
        <textarea
          id="rb-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t('rutinas.builder.descripcionPlaceholder')}
          rows={2}
          className="mt-1 w-full resize-none bg-transparent text-sm leading-relaxed text-fg placeholder:text-muted/60 focus:outline-none"
        />
      </div>
    </section>
  )
}
