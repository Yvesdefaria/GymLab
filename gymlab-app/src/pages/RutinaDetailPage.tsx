import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Play, Calendar, Dumbbell, Flame, Zap, Target, Trophy } from 'lucide-react'
import { AppHeader } from '@/components/layout/AppHeader'
import { useLiveQuery } from 'dexie-react-hooks'
import { routineRepo, exerciseRepo } from '@/data/repositories'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import type { Objective, Level, RoutineItem } from '@/domain/types'

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

const objectiveIcons: Record<Objective, typeof Flame> = {
  volumen: Dumbbell,
  definicion: Flame,
  fuerza: Zap,
  resistencia: Target,
  general: Trophy,
}

export const RutinaDetailPage = () => {
  const { slug } = useParams()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const { startWorkout, exercises: activeExercises } = useActiveWorkoutStore()

  const routine = useLiveQuery(
    () => (slug ? routineRepo.getBySlug(slug) : undefined),
    [slug]
  )

  const days = useLiveQuery(
    () => (routine ? routineRepo.getDays(routine.id) : []),
    [routine]
  ) ?? []

  const allItems = useLiveQuery(async () => {
    if (days.length === 0) return []
    const items: (RoutineItem & { exerciseName?: string })[] = []
    for (const day of days) {
      const dayItems = await routineRepo.getItems(day.id)
      for (const item of dayItems) {
        const ex = await exerciseRepo.getById(item.exerciseId)
        items.push({ ...item, exerciseName: ex?.name })
      }
    }
    return items
  }, [days]) ?? []

  if (!routine) {
    return (
      <div>
        <AppHeader title="Rutina" />
        <div className="p-4">
          <Link to="/rutinas" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft">
            <ArrowLeft className="size-4" /> Volver
          </Link>
          <div className="mt-4 rounded-2xl border border-border bg-bg-elevated p-5 text-center">
            <p className="text-sm text-muted">Rutina no encontrada.</p>
          </div>
        </div>
      </div>
    )
  }

  const Icon = objectiveIcons[routine.objective]
  const displayDays = selectedDay !== null ? days.filter((d) => d.dayIndex === selectedDay) : days
  const hasActiveWorkout = activeExercises.length > 0

  return (
    <div>
      <AppHeader
        title={routine.title}
        subtitle={`${levelLabels[routine.level]} · ${routine.daysCount} días · ${objectiveLabels[routine.objective]}`}
      />
      <div className="space-y-4 p-4">
        <Link
          to="/rutinas"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-accent-soft"
        >
          <ArrowLeft className="size-4" />
          Todas las rutinas
        </Link>

        {/* Description */}
        <div className="rounded-2xl border border-border bg-bg-elevated p-4">
          <div className="mb-2 flex items-center gap-2">
            <Icon className="size-5 text-accent" />
            <span className="font-display text-sm font-semibold text-accent">
              {objectiveLabels[routine.objective]}
            </span>
          </div>
          <p className="text-sm text-fg">{routine.description}</p>
        </div>

        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedDay(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedDay === null ? 'bg-cta text-bg' : 'border border-border text-muted'
            }`}
          >
            Todos
          </button>
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.dayIndex)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedDay === day.dayIndex ? 'bg-cta text-bg' : 'border border-border text-muted'
              }`}
            >
              {day.name}
            </button>
          ))}
        </div>

        {/* Days with exercises */}
        {displayDays.map((day) => {
          const dayItems = allItems.filter((i) => i.routineDayId === day.id)
          return (
            <div key={day.id} className="rounded-2xl border border-border bg-bg-elevated p-4">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="size-4 text-accent" />
                <h3 className="font-display text-sm font-semibold text-accent">{day.name}</h3>
              </div>
              <div className="space-y-2">
                {dayItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-sm text-fg">{item.exerciseName ?? `Ejercicio #${item.exerciseId}`}</span>
                    <span className="text-xs text-muted">
                      {item.targetSets}×{item.targetReps} · {item.restSec}s
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Start workout */}
        <button
          onClick={() => {
            startWorkout(routine.id)
          }}
          disabled={hasActiveWorkout}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-cta px-4 py-3 font-display text-lg font-semibold tracking-wide text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Play className="size-5" fill="currentColor" />
          {hasActiveWorkout ? 'Entreno en curso' : 'Iniciar entrenamiento'}
        </button>
      </div>
    </div>
  )
}
