// Héroe editorial de la home: foto, estado del día, CTA principal y anillo de progreso.
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Dumbbell, Play } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/ProgressRing'
import type { ActiveProgram } from '@/domain/types'

interface HeroCardProps {
  heroImage: string
  hasActiveWorkout: boolean
  todayDone: boolean
  todayDay: { name: string } | null
  todayGroups: string[]
  program: ActiveProgram | null
  sessionPct: number
  programPct: number
  routineSlug?: string
  onStart: () => void
  onChangeDay: () => void
  onContinue: () => void
}

// La home resuelve «¿qué hago hoy?»: el nombre del día y el CTA son el héroe;
// el anillo es el único dato circular de la pantalla.
export const HeroCard = ({
  heroImage,
  hasActiveWorkout,
  todayDone,
  todayDay,
  todayGroups,
  program,
  sessionPct,
  programPct,
  routineSlug,
  onStart,
  onChangeDay,
  onContinue,
}: HeroCardProps) => {
  const { t } = useTranslation()

  const kicker = hasActiveWorkout
    ? t('home.sesionEnCurso')
    : todayDone
      ? t('home.hoyEntrenado')
      : todayDay
        ? t('home.hoyToca')
        : program
          ? t('home.sinSesionProgramada')
          : t('home.entrenar')

  const title = hasActiveWorkout
    ? todayDay?.name ?? t('home.letsGo')
    : todayDay
      ? todayDay.name
      : program
        ? t('home.diaDeDescanso')
        : t('home.sinPlanHoy')

  const ringValue = hasActiveWorkout ? sessionPct : programPct
  const ringLabel = hasActiveWorkout ? t('home.progresoSesion') : t('home.progresoPrograma')
  // Sin programa ni sesión no hay progreso que mostrar: el héroe queda solo con la acción.
  const showRing = hasActiveWorkout || Boolean(program)

  return (
    <section className="home-hero" data-tour="home-hero">
      <img
        src={heroImage}
        alt=""
        className="home-hero__img"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
      <div className="home-hero__veil" aria-hidden="true" />

      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4">
        <p className="kicker text-gold">{kicker}</p>
        <h2 className="mt-1.5 max-w-[19rem] font-display text-[2.6rem] font-light leading-[0.98] tracking-tight text-fg">
          {title}
        </h2>

        {todayGroups.length > 0 && (
          <p className="mt-2 text-[11px] font-medium tracking-[0.06em] text-fg/70">
            {todayGroups.join(' · ')}
          </p>
        )}

        {!program && !hasActiveWorkout && (
          <p className="mt-2 max-w-[18rem] text-xs leading-relaxed text-fg/60">
            {t('home.heroSinRutina')}
          </p>
        )}

        <div className="mt-3.5 flex items-center gap-2.5">
          <div className="min-w-0 flex-1" data-tour="home-start">
            {hasActiveWorkout ? (
              <Button variant="flat" size="sm" className="w-full text-[13px]" onClick={onContinue}>
                <Dumbbell className="size-4" aria-hidden />
                {t('home.continuarEntreno')}
              </Button>
            ) : todayDay ? (
              <Button variant="flat" size="sm" className="w-full text-[13px]" onClick={onStart}>
                <Play className="size-4" fill="currentColor" aria-hidden />
                {todayDone ? t('home.entrenarOtraVez') : t('home.empezarHoy')}
              </Button>
            ) : program ? (
              <Button variant="flat" size="sm" className="w-full text-[13px]" onClick={onStart}>
                <Play className="size-4" fill="currentColor" aria-hidden />
                {t('home.iniciarEntrenamiento')}
              </Button>
            ) : (
              <ButtonLink variant="flat" size="sm" className="w-full text-[13px]" to="/rutinas">
                {t('home.verRutinas')}
              </ButtonLink>
            )}
          </div>

          {showRing && (
            <ProgressRing
              value={ringValue}
              size={58}
              stroke={3.5}
              label={ringLabel}
              textClassName="font-display text-[13px] font-light text-fg"
            />
          )}        </div>

        {!hasActiveWorkout && (program || routineSlug) && (
          <div className="mt-2.5 flex items-center gap-3">
            {program && (
              <button
                type="button"
                onClick={onChangeDay}
                className="flex min-h-[44px] items-center text-[10px] font-medium text-fg/70"
              >
                <span className="border-b border-gold/35 pb-0.5">{t('home.cambiarDia')}</span>
              </button>
            )}
            {routineSlug && (
              <Link
                to={`/rutinas/${routineSlug}`}
                className="flex min-h-[44px] items-center text-[10px] font-medium text-fg/70"
              >
                <span className="border-b border-gold/35 pb-0.5">{t('home.verRutina')}</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
