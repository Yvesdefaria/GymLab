// Detalle del músculo seleccionado en /cuerpo: estado de fatiga, último entreno
// y hasta cinco ejercicios del grupo en filas hairline. Sin selección, un hint honesto.
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { localizeMuscleGroup } from '@/i18n/catalog/en'
import { FATIGUE_LABEL_KEYS } from './fatigueLabels'
import type { AppLanguage } from '@/domain/onboarding'
import type { Exercise, FatigueLevel, MuscleGroup } from '@/domain/types'

type Props = {
  selected: MuscleGroup | null
  fatigue: Partial<Record<MuscleGroup, FatigueLevel>>
  lastDate: string | null
  daysAgo: number | null
  exercises: Exercise[]
}

export const CuerpoSelected = ({ selected, fatigue, lastDate, daysAgo, exercises }: Props) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage

  if (!selected) {
    return (
      <section className="border-t border-border/40 pt-4">
        <p className="text-center text-sm text-muted">{t('cuerpo.tocaMusculo')}</p>
      </section>
    )
  }

  const level = fatigue[selected]
  const status = level ? t(FATIGUE_LABEL_KEYS[level]) : t('cuerpo.sinDatos')
  const daysLabel = lastDate === null || daysAgo === null ? null : `${daysAgo} d`

  return (
    <section className="border-t border-border/40 pt-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-light tracking-wide text-fg">
          {localizeMuscleGroup(selected, lang)}
        </h2>
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
          {t('cuerpo.seleccionado')}
        </span>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-[10.5px] text-muted">
        <span
          className={`inline-block size-1.5 rounded-full ${
            level === 'sore'
              ? 'bg-danger'
              : level === 'fatigued' || level === 'warm'
                ? 'bg-gold'
                : 'bg-muted'
          }`}
          aria-hidden
        />
        {status}
        {daysLabel === null
          ? t('cuerpo.sinEntrenos')
          : daysAgo === 0
            ? t('cuerpo.entrenoHoy')
            : t('cuerpo.ultimoEntreno', { cuando: daysLabel })}
      </p>

      <div className="mt-2">
        {exercises.slice(0, 5).map((ex, index) => (
          <Link
            key={ex.id}
            to={`/ejercicios/${ex.slug}`}
            className="flex min-h-[44px] items-center gap-2 border-t border-border/10 text-[12px] text-fg first:border-t-0"
          >
            <span className="w-6 shrink-0 text-[10px] tabular-nums text-muted">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1 truncate">{ex.name}</span>
            <ChevronRight className="size-3.5 shrink-0 text-muted" aria-hidden />
          </Link>
        ))}
        {exercises.length === 0 ? (
          <p className="py-3 text-xs text-muted">{t('cuerpo.sinEjercicios')}</p>
        ) : null}
      </div>

      <Link
        to="/ejercicios"
        className="mt-1 inline-flex min-h-[44px] items-center gap-1 text-[11px] font-medium text-gold"
      >
        {t('cuerpo.verBiblioteca')}
        <ChevronRight className="size-3.5" aria-hidden />
      </Link>
    </section>
  )
}
