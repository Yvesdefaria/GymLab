import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Plus, User, Star } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { useRoutines } from '@/hooks/useRoutines'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useRoutineFavorites } from '@/hooks/useRoutineFavorites'
import type { Objective, Level } from '@/domain/types'
import { OBJECTIVE_ICONS, OBJECTIVE_COLORS } from '@/components/routines/routineMeta'
import { OBJECTIVE_LABELS, LEVEL_LABELS } from '@/domain/routines'

const RoutineCard = ({
  routine,
  badge,
  isActive,
  isFav,
  onToggleFav,
}: {
  routine: { slug: string; title: string; objective: Objective; level: Level; daysCount: number }
  badge?: string
  isActive?: boolean
  isFav: boolean
  onToggleFav: () => void
}) => {
  const Icon = OBJECTIVE_ICONS[routine.objective]
  const iconColor = OBJECTIVE_COLORS[routine.objective]
  const solo = routine.daysCount === 1
  return (
    <div
      className={`flex items-stretch gap-2 panel rounded-2xl px-4 py-3 transition-colors hover:border-gold/80 ${
        isActive ? 'border-cta bg-cta/10' : ''
      }`}
    >
      <Link
        to={`/rutinas/${routine.slug}`}
        className="flex min-h-[72px] flex-1 items-center gap-3"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-bg">
          <Icon className={`size-6 ${iconColor}`} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="block truncate font-display text-base font-semibold text-fg">{routine.title}</span>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-wide ${OBJECTIVE_COLORS[routine.objective]}`}>
              {OBJECTIVE_LABELS[routine.objective]}
            </span>
            {isActive ? (
              <span className="shrink-0 rounded-full border border-cta bg-cta/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-accent-soft">
                Activa
              </span>
            ) : badge ? (
              <span className="shrink-0 rounded-full border border-cta bg-cta/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-accent-soft">
                {badge}
              </span>
            ) : solo ? (
              <span className="shrink-0 rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-success">
                Sesión suelta
              </span>
            ) : null}
          </span>
          <span className="block text-xs text-muted">
            {LEVEL_LABELS[routine.level]} · {solo ? 'Sesión suelta' : `${routine.daysCount} días/semana`}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted" />
      </Link>
      <button
        type="button"
        onClick={onToggleFav}
        aria-pressed={isFav}
        aria-label={`${isFav ? 'Quitar de' : 'Añadir a'} favoritas: ${routine.title}`}
        className={`my-auto flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
          isFav
            ? 'border-cta bg-cta/20 text-cta'
            : 'border-border text-muted hover:border-cta hover:text-accent-soft'
        }`}
      >
        <Star className="size-5" fill={isFav ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}

export const RutinasPage = () => {
  const [objectiveFilter, setObjectiveFilter] = useState<Objective | null>(null)
  const [levelFilter, setLevelFilter] = useState<Level | null>(null)
  const [typeFilter, setTypeFilter] = useState<'todas' | 'sesion' | 'programa'>('todas')

  const { routines } = useRoutines()
  const { program } = useActiveProgram()
  const { favorites, isFavorite, toggle } = useRoutineFavorites()

  const custom = routines.filter((r) => r.isCustom)
  const predefined = routines.filter((r) => !r.isCustom).filter((r) => {
    const matchObj = !objectiveFilter || r.objective === objectiveFilter
    const matchLvl = !levelFilter || r.level === levelFilter
    const matchType =
      typeFilter === 'todas' || (typeFilter === 'sesion' && r.daysCount === 1) || (typeFilter === 'programa' && r.daysCount > 1)
    return matchObj && matchLvl && matchType
  })

  const favRoutines = routines.filter((r) => favorites.includes(r.id))
  const activeRoutineId = program?.routineId

  const grouped = (['volumen', 'definicion', 'fuerza', 'resistencia', 'general'] as const)
    .map((obj) => ({ obj, routines: predefined.filter((r) => r.objective === obj) }))
    .filter((g) => g.routines.length > 0)

  const hasFilters = objectiveFilter !== null || levelFilter !== null || typeFilter !== 'todas'

  return (
    <div>
      <AppHeader title="Rutinas" subtitle={`${routines.length} plantillas y programas`} />
      <div className="space-y-4 p-4 pb-8">
        <Link
          to="/rutinas/nueva"
          className="gold-gradient flex min-h-[56px] items-center justify-center gap-2 rounded-2xl px-4 py-3 font-display text-lg font-semibold tracking-wide text-on-gold shadow-lg transition-opacity hover:opacity-90"
        >
          <Plus className="size-5" /> Nueva rutina
        </Link>

        {favRoutines.length > 0 ? (
          <section>
            <h2 className="mb-2 flex items-center gap-2 font-display text-base text-accent">
              <Star className="size-4" /> Favoritas
            </h2>
            <div className="space-y-3">
              {favRoutines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  isActive={routine.id === activeRoutineId}
                  isFav
                  onToggleFav={() => void toggle(routine.id)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {custom.length > 0 ? (
          <section>
            <h2 className="mb-2 flex items-center gap-2 font-display text-base text-accent">
              <User className="size-4" /> Mis rutinas
            </h2>
            <div className="space-y-3">
              {custom.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  badge="Propia"
                  isActive={routine.id === activeRoutineId}
                  isFav={isFavorite(routine.id)}
                  onToggleFav={() => void toggle(routine.id)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 font-display text-base text-accent">Predefinidas</h2>

          <div className="mb-3">
            <p className="mb-2 kicker">Tipo</p>
            <div className="flex gap-2">
              {([
                { key: 'todas', label: 'Todas' },
                { key: 'sesion', label: 'Sesión suelta' },
                { key: 'programa', label: 'Programa' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTypeFilter(typeFilter === opt.key ? 'todas' : opt.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    typeFilter === opt.key
                      ? 'border border-cta bg-cta/20 text-accent-soft'
                      : 'border border-border text-muted hover:border-cta hover:text-accent-soft'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <p className="mb-2 kicker">Objetivo</p>
            <div className="flex flex-wrap gap-2">
              {(['volumen', 'definicion', 'fuerza', 'resistencia', 'general'] as const).map((obj) => (
                <button
                  key={obj}
                  onClick={() => setObjectiveFilter(objectiveFilter === obj ? null : obj)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    objectiveFilter === obj
                      ? 'border border-cta bg-cta/20 text-accent-soft'
                      : 'border border-border text-muted hover:border-cta hover:text-accent-soft'
                  }`}
                >
                  {OBJECTIVE_LABELS[obj]}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <p className="mb-2 kicker">Nivel</p>
            <div className="flex gap-2">
              {(['principiante', 'intermedio', 'avanzado'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(levelFilter === lvl ? null : lvl)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    levelFilter === lvl
                      ? 'border border-cta bg-cta/20 text-accent-soft'
                      : 'border border-border text-muted hover:border-cta hover:text-accent-soft'
                  }`}
                >
                  {LEVEL_LABELS[lvl]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {grouped.map(({ obj, routines }) => {
              const GroupIcon = OBJECTIVE_ICONS[obj]
              return (
                <div key={obj}>
                  <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-accent-soft">
                    <GroupIcon className={`size-4 ${OBJECTIVE_COLORS[obj]}`} />
                  {OBJECTIVE_LABELS[obj]}
                  </h3>
                  <div className="space-y-3">
                    {routines.map((routine) => (
                      <RoutineCard
                        key={routine.id}
                        routine={routine}
                        isActive={routine.id === activeRoutineId}
                        isFav={isFavorite(routine.id)}
                        onToggleFav={() => void toggle(routine.id)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
            {grouped.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-6 text-center">
                {hasFilters ? (
                  <p className="text-sm text-muted">No hay rutinas con estos filtros.</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-fg">Aún no hay rutinas predefinidas</p>
                    <p className="mt-1 text-xs text-muted">
                      Crea la primera con «Nueva rutina» y aparecerá en Mis rutinas.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
