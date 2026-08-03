import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Dumbbell, Flame, Target, Zap, Trophy, Plus, User } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { useLiveQuery } from 'dexie-react-hooks'
import { routineRepo } from '@/data/repositories'
import type { Objective, Level } from '@/domain/types'

const objectiveIcons: Record<Objective, typeof Flame> = {
  volumen: Dumbbell,
  definicion: Flame,
  fuerza: Zap,
  resistencia: Target,
  general: Trophy,
}

const objectiveColors: Record<Objective, string> = {
  volumen: 'text-accent',
  definicion: 'text-cta',
  fuerza: 'text-success',
  resistencia: 'text-blue-400',
  general: 'text-muted',
}

const objectiveLabels: Record<Objective, string> = {
  volumen: 'Volumen',
  definicion: 'Definición',
  fuerza: 'Fuerza',
  resistencia: 'Resistencia',
  general: 'General',
}

const levelLabels: Record<Level, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

const RoutineCard = ({ routine, badge }: { routine: { slug: string; title: string; objective: Objective; level: Level; daysCount: number }; badge?: string }) => {
  const Icon = objectiveIcons[routine.objective]
  const iconColor = objectiveColors[routine.objective]
  return (
    <Link
      to={`/rutinas/${routine.slug}`}
      className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-gold/40 bg-bg-elevated px-4 py-3 transition-colors hover:border-gold/80"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-bg">
        <Icon className={`size-6 ${iconColor}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="block truncate font-display text-base font-semibold text-fg">{routine.title}</span>
          {badge ? (
            <span className="shrink-0 rounded-full border border-cta bg-cta/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-accent-soft">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="block text-xs text-muted">
          {levelLabels[routine.level]} · {routine.daysCount} días/semana
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" />
    </Link>
  )
}

export const RutinasPage = () => {
  const [objectiveFilter, setObjectiveFilter] = useState<Objective | null>(null)
  const [levelFilter, setLevelFilter] = useState<Level | null>(null)

  const routines = useLiveQuery(() => routineRepo.getAll(), []) ?? []

  const custom = routines.filter((r) => r.isCustom)
  const predefined = routines.filter((r) => !r.isCustom).filter((r) => {
    const matchObj = !objectiveFilter || r.objective === objectiveFilter
    const matchLvl = !levelFilter || r.level === levelFilter
    return matchObj && matchLvl
  })

  return (
    <div>
      <AppHeader title="Rutinas" subtitle={`${routines.length} programas de entrenamiento`} />
      <div className="space-y-4 p-4 pb-8">
        <Link
          to="/rutinas/nueva"
          className="gold-gradient flex min-h-[56px] items-center justify-center gap-2 rounded-2xl px-4 py-3 font-display text-lg font-semibold tracking-wide text-on-gold shadow-lg transition-opacity hover:opacity-90"
        >
          <Plus className="size-5" /> Nueva rutina
        </Link>

        {custom.length > 0 ? (
          <section>
            <h2 className="mb-2 flex items-center gap-2 font-display text-base text-accent">
              <User className="size-4" /> Mis rutinas
            </h2>
            <div className="space-y-3">
              {custom.map((routine) => (
                <RoutineCard key={routine.id} routine={routine} badge="Propia" />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-2 font-display text-base text-accent">Predefinidas</h2>

          <div className="mb-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Objetivo</p>
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
                  {objectiveLabels[obj]}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Nivel</p>
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
                  {levelLabels[lvl]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {predefined.map((routine) => (
              <RoutineCard key={routine.id} routine={routine} />
            ))}
            {predefined.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-bg-elevated/50 p-6 text-center">
                <p className="text-sm text-muted">No hay rutinas con estos filtros.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
