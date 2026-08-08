// Asistente de bienvenida de 3 pasos que configura objetivo, días y material, y sugiere una rutina.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Play, X } from 'lucide-react'
import { activeProgramRepo, metaRepo } from '@/data/repositories'
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus'
import {
  ONBOARDING_DONE_META_KEY,
  suggestRoutine,
  weekdaysForDays,
} from '@/domain/onboarding'
import { toLocalDateStr } from '@/domain/dates'
import type { Objective, Level } from '@/domain/types'

// Opciones de objetivo mostradas en el primer paso.
const OBJECTIVES: { value: Objective; label: string }[] = [
  { value: 'fuerza', label: 'Fuerza' },
  { value: 'volumen', label: 'Ganar masa' },
  { value: 'definicion', label: 'Definirme' },
  { value: 'resistencia', label: 'Resistencia' },
  { value: 'general', label: 'General' },
]

const DAYS_OPTS = [2, 3, 4, 5]

const LEVELS: { value: Level; label: string }[] = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
]

const MATERIALS = ['Gimnasio', 'Mancuernas en casa', 'Solo peso corporal', 'Lo que sea']

// Onboarding a pantalla completa; se oculta si ya se completó o si el usuario ya tiene sesiones.
export const Onboarding = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [objective, setObjective] = useState<Objective | null>(null)
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null)
  const [level, setLevel] = useState<Level>('principiante')
  const [material, setMaterial] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { done, workouts, routines } = useOnboardingStatus()

  if (done || workouts.length > 0) return null

  const answers = objective && daysPerWeek ? { objective, daysPerWeek, material: material ?? '' } : null
  const suggested = answers ? suggestRoutine(routines, answers) : undefined

  // Guarda el programa activo (si el usuario acepta la sugerencia) y marca el onboarding como hecho.
  const finish = async (withRoutine: boolean) => {
    setBusy(true)
    if (withRoutine && suggested) {
      await activeProgramRepo.set({
        routineId: suggested.id,
        startDate: toLocalDateStr(),
        weekdays: weekdaysForDays(daysPerWeek ?? 3),
        createdAt: new Date().toISOString(),
      })
    }
    await metaRepo.setJson(ONBOARDING_DONE_META_KEY, true)
    setBusy(false)
    navigate('/')
  }

  // Permite avanzar solo cuando el paso actual está completo (objetivo, días+material, o el resumen).
  const canNext =
    (step === 0 && objective !== null) ||
    (step === 1 && daysPerWeek !== null && material !== null) ||
    step === 2

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] gold-text">
            GymLab
          </p>
          {step === 0 ? (
            <button
              type="button"
              onClick={() => void finish(false)}
              disabled={busy}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-border px-3 text-xs text-muted transition-colors hover:border-cta hover:text-accent-soft"
            >
              <X className="size-4" aria-hidden />
              Ya entreno aquí
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-border px-3 text-xs text-muted transition-colors hover:border-cta hover:text-accent-soft"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Atrás
            </button>
          )}
        </div>

        <div className="panel rounded-3xl p-5">
          {step === 0 && (
            <div>
              <h1 className="font-display text-2xl font-bold text-fg">¿Qué quieres lograr?</h1>
              <p className="mt-1 text-sm text-muted">Elige tu objetivo principal para empezar.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {OBJECTIVES.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setObjective(o.value)}
                    className={`min-h-[52px] rounded-xl border px-3 text-sm font-medium transition-colors ${
                      objective === o.value
                        ? 'border-cta bg-cta/20 text-accent-soft'
                        : 'border-border text-muted hover:border-cta'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 className="font-display text-2xl font-bold text-fg">Tu semana</h1>
              <p className="mt-1 text-sm text-muted">Días que puedes entrenar y dónde.</p>
              <p className="mt-4 kicker">Días por semana</p>
              <div className="mt-2 flex gap-2">
                {DAYS_OPTS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDaysPerWeek(d)}
                    className={`min-h-[48px] flex-1 rounded-xl border text-sm font-medium transition-colors ${
                      daysPerWeek === d
                        ? 'border-cta bg-cta/20 text-accent-soft'
                        : 'border-border text-muted hover:border-cta'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="mt-4 kicker">Lugar de entrenamiento</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {MATERIALS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMaterial(m)}
                    className={`min-h-[44px] rounded-xl border px-3 text-sm font-medium transition-colors ${
                      material === m
                        ? 'border-cta bg-cta/20 text-accent-soft'
                        : 'border-border text-muted hover:border-cta'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <p className="mt-4 kicker">Nivel</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    className={`min-h-[44px] rounded-xl border px-3 text-sm font-medium transition-colors ${
                      level === l.value
                        ? 'border-cta bg-cta/20 text-accent-soft'
                        : 'border-border text-muted hover:border-cta'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="font-display text-2xl font-bold text-fg">Tu plan está listo</h1>
              <p className="mt-1 text-sm text-muted">
                Te sugerimos esta rutina para empezar:
              </p>
              {suggested ? (
                <div className="mt-4 rounded-2xl border border-cta/40 bg-cta/10 p-4">
                  <p className="font-display text-base font-semibold text-accent-soft">
                    {suggested.title}
                  </p>
                  <p className="mt-1 text-xs capitalize text-muted">
                    {suggested.level} · {suggested.daysCount} días · {suggested.objective}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-fg">{suggested.description}</p>
                </div>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-gold/40 p-4 text-sm text-muted">
                  Aún estamos preparando las rutinas. Puedes empezar igualmente.
                </p>
              )}
            </div>
          )}
        </div>

        {step < 2 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-cta font-display text-base font-semibold text-on-gold shadow-lg transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Continuar
            <ArrowRight className="size-5" aria-hidden />
          </button>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => void finish(false)}
              disabled={busy}
              className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-2xl border border-border text-sm text-muted transition-colors hover:border-cta hover:text-accent-soft"
            >
              <X className="size-4" aria-hidden />
              Ya entreno aquí
            </button>
            <button
              type="button"
              onClick={() => void finish(true)}
              disabled={busy || !suggested}
              className="gold-gradient flex min-h-[52px] items-center justify-center gap-1.5 rounded-2xl font-display text-sm font-semibold text-on-gold shadow-lg transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Play className="size-4" fill="currentColor" aria-hidden />
              Empezar D1
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
