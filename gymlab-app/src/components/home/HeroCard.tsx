import { Play, Dumbbell } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/ProgressRing'

interface HeroCardProps {
  heroImage: string
  hasActiveWorkout: boolean
  todayDone: boolean
  todayDay: { name: string } | null
  todayGroups: string[]
  program: any
  sessionPct: number
  programPct: number
  onStart: () => void
  onContinue: () => void
  t: any
}

export const HeroCard = ({
  heroImage,
  hasActiveWorkout,
  todayDone,
  todayDay,
  todayGroups,
  program,
  sessionPct,
  programPct,
  onStart,
  onContinue,
  t,
}: HeroCardProps) => {
  return (
    <section className="panel-hero reveal overflow-hidden rounded-3xl p-5">
      <div className="hero-atmosphere" aria-hidden="true">
        <img src={heroImage} alt="" loading="eager" decoding="async" fetchPriority="high" />
      </div>
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="kicker">
              {hasActiveWorkout
                ? t('home.sesionEnCurso')
                : todayDone
                  ? t('home.hoyEntrenado')
                  : todayDay
                    ? t('home.hoyToca')
                    : program
                      ? t('home.sinSesionProgramada')
                      : t('home.entrenar')}
            </p>
            <h2 className="mt-1.5 font-display text-[2.6rem] font-bold leading-[0.95] tracking-tight text-fg min-w-0 truncate">
              {hasActiveWorkout
                ? t('home.letsGo')
                : todayDay
                  ? todayDay.name
                  : program
                    ? t('home.diaDeDescanso')
                    : t('home.sinPlanHoy')}
            </h2>
            {todayGroups.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {todayGroups.map((g) => (
                  <span key={g} className="chip">
                    {g}
                  </span>
                ))}
              </div>
            )}
            {!program && !hasActiveWorkout && (
              <p className="mt-2 text-sm text-muted">
                {t('home.heroSinRutina')}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <ProgressRing
              value={hasActiveWorkout ? sessionPct : programPct}
              label={hasActiveWorkout ? t('home.progresoSesion') : t('home.progresoPrograma')}
            />
          </div>
        </div>

        <div className="mt-5">
          {hasActiveWorkout ? (
            <Button
              size="md"
              className="w-full"
              onClick={onContinue}
            >
              <Dumbbell className="size-5" />
              {t('home.continuarEntreno')}
            </Button>
          ) : todayDay ? (
            <Button size="md" className="w-full" onClick={onStart}>
              <Play className="size-5" fill="currentColor" />
              {todayDone ? t('home.entrenarOtraVez') : t('home.empezarHoy')}
            </Button>
          ) : program ? (
            <Button size="md" className="w-full" onClick={onStart}>
              <Play className="size-5" fill="currentColor" />
              {t('home.iniciarEntrenamiento')}
            </Button>
          ) : (
            <ButtonLink size="md" className="w-full" to="/rutinas">
              {t('home.verRutinas')}
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  )
}
