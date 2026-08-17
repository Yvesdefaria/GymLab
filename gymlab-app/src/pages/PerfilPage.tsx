// Página /perfil: resumen de progreso con rachas, volumen, PRs, deload e historial.
// Consume solo hooks y funciones de domain; no accede a Dexie directamente.
import { useMemo, useState } from 'react'
import { Flame, Trophy, TrendingUp, Calendar, User, AlertTriangle, Dumbbell, Camera, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/layout/AppHeader'
import { TabNav } from '@/components/ui/TabNav'
import { SwipeRow } from '@/components/ui/SwipeRow'
import { useStreak } from '@/hooks/useStreak'
import { useWorkouts } from '@/hooks/useWorkouts'
import { usePRs } from '@/hooks/usePRs'
import { VolumeChart } from '@/components/profile/VolumeChart'
import { RachasSection } from '@/components/profile/RachasSection'
import { formatVolume } from '@/domain/volume'
import { detectDeloadSignal } from '@/domain/progress'
import { deloadUntilDate } from '@/domain/deload'
import { activeProgramRepo } from '@/data/repositories'
import { useSettings } from '@/hooks/useSettings'
import { formatWeight, formatUnits } from '@/domain/settings'
import { computeWeeklyVolumeInsight } from '@/domain/insights'
import { InsightCard } from '@/components/insights/InsightCard'
import { BackLink } from '@/components/ui/BackLink'
import { WorkoutHistoryTimeline } from '@/components/workout/WorkoutHistoryTimeline'
import { weeklyVolume } from '@/domain/workouts'
import { useActiveProgram } from '@/hooks/useActiveProgram'
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog'
import { useAvatar } from '@/hooks/useAvatar'
import { AvatarPicker } from '@/components/profile/AvatarPicker'
import { isSafeAvatarUri } from '@/lib/avatar'
import { useProfileName } from '@/hooks/useProfileName'

type PerfilTab = 'resumen' | 'historial' | 'rachas'

export const PerfilPage = () => {
  const { t } = useTranslation()
  const { settings } = useSettings()
  const streak = useStreak()
  const { workouts } = useWorkouts()
  const { prs } = usePRs()
  const { avatarUri, setAvatar } = useAvatar()
  const { name, setName } = useProfileName()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [tab, setTab] = useState<PerfilTab>('resumen')

  // Guarda el alias (recortado) al confirmar y sale del modo edición.
  const commitName = () => {
    const value = nameDraft.trim()
    setEditingName(false)
    if (value !== name) void setName(value)
  }

  const { exercises } = useExerciseCatalog()
  // Mapa id→nombre para resolver los nombres de ejercicio de cada PR.
  const nameById = useMemo(() => new Map(exercises.map((e) => [e.id, e.name])), [exercises])
  const { program } = useActiveProgram()

  // Marca la semana actual como deload dentro del programa activo.
  const handleActivateDeload = async () => {
    await activeProgramRepo.setDeload(true, deloadUntilDate())
  }

  const weeklyVolumeValue = useMemo(() => weeklyVolume(workouts), [workouts])

  // Volumen total acumulado en todos los entrenos.
  const totalVolume = useMemo(() => workouts.reduce((acc, w) => acc + w.totalVolume, 0), [workouts])

  // Detecta si las últimas 3 semanas han caído de volumen y recomienda deload.
  const deload = useMemo(() => detectDeloadSignal(workouts), [workouts])

  const volumeInsight = useMemo(() => computeWeeklyVolumeInsight(workouts), [workouts])

  return (
    <div>
      <AppHeader title={t('perfil.titulo')} subtitle={t('perfil.subtitulo')} />
      <div className="space-y-4 p-4">
        <BackLink to="/mas" />
        {/* User card */}
        <div className="flex items-center gap-3 panel rounded-2xl p-4">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label={t('perfil.cambiarAvatar')}
            className="group relative shrink-0"
          >
            <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-bg text-accent">
              {isSafeAvatarUri(avatarUri) ? (
                <img src={avatarUri} alt="" className="size-full object-cover" />
              ) : (
                <User className="size-7" />
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border border-border bg-bg-elevated text-muted transition-colors group-hover:border-cta group-hover:text-accent-soft">
              <Camera className="size-3.5" aria-hidden />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {editingName ? (
                <input
                  autoFocus
                  type="text"
                  value={nameDraft}
                  maxLength={24}
                  placeholder={t('perfil.tuNombre')}
                  aria-label={t('perfil.tuNombre')}
                  onBlur={commitName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitName()
                    if (e.key === 'Escape') setEditingName(false)
                  }}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-cta bg-bg px-2 py-1 font-display text-lg font-semibold text-fg outline-none"
                />
              ) : (
                <p className="truncate font-display text-lg font-semibold text-fg">
                  {name || t('perfil.atleta')}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setNameDraft(name)
                  setEditingName(true)
                }}
                aria-label={t('perfil.editarNombre')}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:text-accent-soft"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
            </div>
            <p className="text-xs text-muted">{t('perfil.entrenosRegistrados', { count: workouts.length })}</p>
          </div>
        </div>

        {pickerOpen ? (
          <AvatarPicker
            currentUri={avatarUri}
            onSelect={(uri) => void setAvatar(uri)}
            onClose={() => setPickerOpen(false)}
          />
        ) : null}

        {/* Deload suggestion */}
        {deload?.suggestsDeload && (
          <div className="flex items-start gap-3 rounded-2xl border border-gold/50 bg-cta/10 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-cta" aria-hidden />
            <div>
              <p className="font-display text-sm font-semibold text-accent-soft">
                {t('perfil.deloadRecomendado')}
              </p>
              <p className="mt-1 text-xs text-muted">
                {t('perfil.deloadTexto', { pct: Math.round(deload.dropPct) })}
              </p>
              {program && (
                <button
                  type="button"
                  onClick={() => void handleActivateDeload()}
                  className="mt-3 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-cta px-4 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
                >
                  <AlertTriangle className="size-4" aria-hidden />
                  {t('perfil.activarDeload')}
                </button>
              )}
            </div>
          </div>
        )}

        <TabNav
          ariaLabel={t('perfil.seccionesAria')}
          tabs={[
            { id: 'resumen', label: t('perfil.tabResumen') },
            { id: 'historial', label: t('perfil.tabHistorial') },
            { id: 'rachas', label: t('perfil.tabRachas') },
          ]}
          active={tab}
          onChange={(id) => setTab(id as PerfilTab)}
        >
          {tab === 'resumen' ? (
            <div className="space-y-4">
              {workouts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gold/40 bg-bg-elevated/50 p-6 text-center">
                  <Flame className="mx-auto mb-3 size-8 text-cta" aria-hidden />
                  <p className="font-display text-base font-semibold text-fg">{t('perfil.sinDatosTitulo')}</p>
                  <p className="mt-1 text-sm text-muted">
                    {t('perfil.sinDatosTexto')}
                  </p>
                  <Link
                    to="/"
                    className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-cta px-5 text-sm font-semibold text-on-gold transition-opacity hover:opacity-90"
                  >
                    <Dumbbell className="size-4" aria-hidden />
                    {t('perfil.empezarEntrenar')}
                  </Link>
                </div>
              )}
              <SwipeRow className="flex gap-3">
                <div className="panel rounded-2xl p-4 min-w-[140px]">
                  <Flame className="mb-2 size-5 text-cta" />
                  <p className="kicker">{t('perfil.rachaActual')}</p>
                  <p className="stat-value text-2xl">
                    {streak.currentStreak > 0 ? t('perfil.dias', { count: streak.currentStreak }) : '—'}
                  </p>
                </div>
                <div className="panel rounded-2xl p-4 min-w-[140px]">
                  <TrendingUp className="mb-2 size-5 text-success" />
                  <p className="kicker">{t('perfil.volumenSemanal')}</p>
                  <p className="stat-value text-2xl">
                    {weeklyVolumeValue > 0 ? formatVolume(weeklyVolumeValue) : '—'}
                  </p>
                </div>
                <div className="panel rounded-2xl p-4 min-w-[140px]">
                  <Calendar className="mb-2 size-5 text-accent" />
                  <p className="kicker">{t('perfil.totalEntreno')}</p>
                  <p className="stat-value text-2xl">
                    {totalVolume > 0 ? formatVolume(totalVolume) : '—'}
                  </p>
                </div>
                <div className="panel rounded-2xl p-4 min-w-[140px]">
                  <Trophy className="mb-2 size-5 text-cta" />
                  <p className="kicker">{t('perfil.prs')}</p>
                  <p className="stat-value text-2xl">
                    {prs.length > 0 ? prs.length : '—'}
                  </p>
                </div>
              </SwipeRow>
              {workouts.length >= 1 && (
                <div className="panel-light rounded-2xl p-4">
                  <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
                    {t('perfil.volumenPorSemana')}
                  </h2>
                  <VolumeChart workouts={workouts} />
                </div>
              )}
              {volumeInsight && (
                <InsightCard insight={volumeInsight} units={formatUnits(settings.units)} />
              )}
            </div>
          ) : tab === 'historial' ? (
            <div className="space-y-4">
              <div className="panel-light rounded-2xl p-4">
                <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
                  {t('perfil.mejoresMarcas')}
                </h2>
                {prs.length > 0 ? (
                  <div className="space-y-2">
                    {prs.slice(0, 10).map((pr) => (
                      <div
                        key={pr.exerciseId}
                        className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0"
                      >
                        <span className="min-w-0 truncate text-sm text-fg">
                          {nameById.get(pr.exerciseId) ?? t('perfil.ejercicio', { id: pr.exerciseId })}
                        </span>
                        <span className="shrink-0 text-xs text-muted">
                          {t('perfil.prDetalle', {
                            peso: formatWeight(pr.weightKg, settings.units),
                            reps: pr.reps,
                            e1rm: formatWeight(pr.estimated1RM, settings.units),
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">
                    {t('perfil.sinPrs')}
                  </p>
                )}
              </div>
              {workouts.length > 0 && (
                <div className="panel-light rounded-2xl p-4">
                  <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-accent">
                    {t('perfil.historialReciente')}
                  </h2>
                  <WorkoutHistoryTimeline workouts={workouts} units={settings.units} />
                </div>
              )}
            </div>
          ) : (
            <RachasSection streak={streak} />
          )}
        </TabNav>
      </div>
    </div>
  )
}
