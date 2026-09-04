// Selector ligero de ejercicio para la calculadora de 1RM: búsqueda por nombre
// sobre el catálogo con resultados acotados; al elegir, muestra el ejercicio con
// opción de quitarlo. No abre modal: filtra en el propio panel.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { localizeExercise, localizeMuscleGroup } from '@/i18n/catalog'
import type { AppLanguage } from '@/domain/onboarding'
import type { Exercise } from '@/domain/types'

const MAX_RESULTS = 12

export const OneRmExerciseSelector = ({
  value,
  onChange,
}: {
  value: Exercise | null
  onChange: (exercise: Exercise | null) => void
}) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const [query, setQuery] = useState('')
  const { exercises } = useExerciseCatalog()

  // Nombres localizados para que la búsqueda coincida en el idioma activo.
  const localized = useMemo(
    () => exercises.map((ex) => localizeExercise(ex, lang)),
    [exercises, lang],
  )
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return localized.filter((ex) => ex.name.toLowerCase().includes(q)).slice(0, MAX_RESULTS)
  }, [query, localized])

  if (value) {
    return (
      <div>
        <p className="mb-1 block text-xs font-medium text-muted">
          {t('calculadoras.oneRm.ejercicio')}
        </p>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-bg px-3 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-fg">
              {localizeExercise(value, lang).name}
            </span>
            <span className="block text-xs capitalize text-muted">
              {localizeMuscleGroup(value.muscleGroup, lang)}
            </span>
          </span>
          <button
            onClick={() => onChange(null)}
            aria-label={t('calculadoras.oneRm.quitarEjercicio')}
            className="relative flex size-10 shrink-0 items-center justify-center rounded-full text-muted after:absolute after:-inset-1 after:content-[''] hover:text-fg"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-1 block text-xs font-medium text-muted">
        {t('calculadoras.oneRm.ejercicioOpcional')}
      </p>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('calculadoras.oneRm.buscarEjercicioPlaceholder')}
          aria-label={t('calculadoras.oneRm.buscarEjercicio')}
          className="h-11 w-full rounded-xl border border-border bg-bg pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
        />
      </div>

      {query.trim() !== '' && (
        <ul className="mt-1 space-y-0.5">
          {results.length === 0 ? (
            <li className="py-3 text-center text-xs text-muted" role="alert">
              {t('calculadoras.oneRm.sinResultados')}
            </li>
          ) : (
            results.map((ex) => (
              <li key={ex.id}>
                <button
                  onClick={() => onChange(ex)}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-2 text-left transition-colors hover:bg-bg-elevated"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{ex.name}</span>
                    <span className="block text-xs text-muted">
                      {localizeMuscleGroup(ex.muscleGroup, lang)}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}