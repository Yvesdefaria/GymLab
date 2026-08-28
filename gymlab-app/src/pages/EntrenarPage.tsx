// Página home «Entrenar» (/): inicio de sesión, progreso del programa, racha e historial.
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { WeekCalendar } from "@/components/calendar/WeekCalendar";
import { WeeklySummaryCard } from "@/components/home/WeeklySummaryCard";
import { ProgressDashboard } from "@/components/home/ProgressDashboard";
import { PlateauAlerts } from "@/components/home/PlateauAlerts";
import { PastSelfView } from "@/components/home/PastSelfView";
import { GoalProjectionCard } from "@/components/home/GoalProjectionCard";
import { GoalSetter } from "@/components/goals/GoalSetter";
import { InstallBanner } from "@/components/ui/InstallBanner";
import { useActiveWorkoutStore } from "@/store/activeWorkoutStore";
import { useWorkouts } from "@/hooks/useWorkouts";
import { HeroCard } from "@/components/home/HeroCard";
import { useActiveProgram } from "@/hooks/useActiveProgram";
import {
  useRoutineDays,
  useRoutineDayMuscleGroups,
  useRoutineDayItems,
} from "@/hooks/useRoutines";
import { useStartSession } from "@/hooks/useStartSession";
import {
  programProgressPct,
  trainedLocalDates,
  scheduledDayIndex,
} from "@/domain/calendar";
import { useSettings } from "@/hooks/useSettings";
import { applyUnits, formatUnits } from "@/domain/settings";
import { useBodyWeight } from "@/hooks/useBodyWeight";
import { sessionProgressPct } from "@/domain/sessionProgress";
import { toLocalDateStr, weekStartKey } from "@/domain/dates";
import { JournalInsightCard } from "@/components/insights/JournalInsightCard";
import { computeJournalInsight } from "@/domain/journalInsights";
import { useLiveList } from "@/hooks/useLiveList";
import { sessionJournalRepo } from "@/data/repositories";
import { RecoveryScoreCard } from "@/components/home/RecoveryScoreCard";
import { QuickTemplates } from "@/components/quick/QuickTemplates";
import { DynamicChallenges } from "@/components/challenges/DynamicChallenges";
import { useRecoveryScore } from "@/hooks/useRecoveryScore";
import { usePRs } from "@/hooks/usePRs";
import { buildWeeklySummary } from "@/domain/weeklySummary";
import { deriveLevel, computeChallengeStats } from "@/domain/challenges";

// Home de entrenamiento: decide qué toca hoy según programa activo y el estado de la sesión.
export const EntrenarPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const startedAt = useActiveWorkoutStore((s) => s.startedAt);
  // Solo derivar contadores en vez de suscribir al array completo de exercises.
  const sessionCompleted = useActiveWorkoutStore((s) =>
    s.exercises.reduce(
      (a, e) => a + e.sets.filter((st) => st.completed).length,
      0,
    ),
  );
  const sessionTotal = useActiveWorkoutStore((s) =>
    s.exercises.reduce((a, e) => a + e.sets.length, 0),
  );
  const { startRoutineDay } = useStartSession();
  const startWorkout = useActiveWorkoutStore((s) => s.startWorkout);
  const { workouts } = useWorkouts();
  const { program, routine } = useActiveProgram();
  const { days: routineDays } = useRoutineDays(routine?.id ?? null);

  const { settings } = useSettings();
  const { entries } = useBodyWeight();

  const trainedDates = useMemo(() => trainedLocalDates(workouts), [workouts]);

  // Día programado de hoy (rotatorio según el programa) y si ya se ha entrenado hoy.
  const todayIndex = program
    ? scheduledDayIndex(program, toLocalDateStr())
    : null;
  const todayDay =
    todayIndex !== null && routineDays.length > 0
      ? routineDays[todayIndex % routineDays.length]
      : null;
  const todayDone = todayDay ? trainedDates.has(toLocalDateStr()) : false;

  const { groups: todayGroups } = useRoutineDayMuscleGroups(
    todayDay?.id ?? null,
  );
  const { items: todayItems } = useRoutineDayItems(todayDay?.id ?? null);

  const { prs } = usePRs();
  const weeklyPrCount = useMemo(() => {
    const weekKey = weekStartKey(toLocalDateStr());
    return prs.filter((pr) => {
      const prDate =
        pr.date.length === 10 ? pr.date : toLocalDateStr(new Date(pr.date));
      return weekStartKey(prDate) === weekKey;
    }).length;
  }, [prs]);
  const challengeLevel = useMemo(() => deriveLevel(workouts), [workouts]);
  const prDates = useMemo(
    () =>
      prs.map((pr) =>
        pr.date.length === 10 ? pr.date : toLocalDateStr(new Date(pr.date)),
      ),
    [prs],
  );
  const statsByDuration = useMemo(
    () => computeChallengeStats(workouts, prDates),
    [workouts, prDates],
  );
  const weeklySummary = useMemo(
    () => buildWeeklySummary(workouts, weeklyPrCount),
    [workouts, weeklyPrCount],
  );

  const hasActiveWorkout = startedAt !== null;

  // Atmósfera del hero: foto de la rutina activa; custom sin foto usa la predeterminada;
  // sin rutina activa se conserva la imagen genérica de gimnasio.
  const heroImage =
    routine?.imageUrl ??
    (routine ? "/images/routines/default.jpg" : "/images/home-hero.jpg");

  const programPct = useMemo(
    () =>
      programProgressPct(
        [...trainedDates],
        program ?? null,
        routine?.daysCount ?? 0,
      ),
    [trainedDates, program, routine],
  );

  // Progreso de la sesión en curso (series hechas sobre total) para el anillo de progreso.
  const sessionPct = sessionProgressPct(sessionCompleted, sessionTotal);

  const recoveryScore = useRecoveryScore();

  const journals = useLiveList(() => sessionJournalRepo.getAll());
  const journalInsight = useMemo(
    () => computeJournalInsight(journals, workouts),
    [journals, workouts],
  );

  // Inicia la sesión: precarga el día de la rutina si hay uno programado; si no, sesión en blanco.
  const handleStart = async () => {
    if (todayDay && todayItems.length > 0 && routine) {
      await startRoutineDay(
        todayItems.map((it) => ({
          exerciseId: it.exerciseId,
          exerciseName:
            it.exerciseName ??
            t("home.ejercicioFallback", { id: it.exerciseId }),
          restSec: it.restSec,
          supersetGroup: it.supersetGroup,
          targetSets: it.targetSets,
          targetReps: it.targetReps,
        })),
        routine.id,
        todayDay.id,
      );
    } else {
      startWorkout();
    }
    navigate("/entrenamiento/active");
  };

  return (
    <div>
      <AppHeader title={t("home.titulo")} subtitle={t("home.subtitulo")} />
      <div className="space-y-4 p-4 pb-32">
        {settings.showInstallPrompt && <InstallBanner />}

        <HeroCard
          heroImage={heroImage}
          hasActiveWorkout={hasActiveWorkout}
          todayDone={todayDone}
          todayDay={todayDay}
          todayGroups={todayGroups}
          program={program}
          sessionPct={sessionPct}
          programPct={programPct}
          onStart={handleStart}
          onContinue={() => navigate("/entrenamiento/active")}
          t={t}
        />
        {/*inicio Calendario semanal */}
        {recoveryScore && (
          <div className="reveal reveal-2">
            <RecoveryScoreCard data={recoveryScore} />
          </div>
        )}

        {journalInsight && <JournalInsightCard insight={journalInsight} />}

        <section className="panel-light rounded-2xl p-4">
          <WeekCalendar
            trained={trainedDates}
            program={program ?? null}
            routineDaysCount={routine?.daysCount ?? 0}
            routineDays={routineDays}
          />
        </section>

        {weeklySummary && (
          <WeeklySummaryCard
            summary={weeklySummary}
            units={formatUnits(settings.units)}
          />
        )}
        {/*fin Calendario semanal */}

        <ProgressDashboard />

        {settings.showWeightHint && entries.length > 0 && (
          <Link
            to="/peso-corporal"
            className="flex min-h-[44px] items-center justify-between rounded-xl border border-border/30 bg-bg-elevated/30 px-3 text-xs text-muted transition-colors hover:border-cta"
          >
            <span>{t("home.ultimoPeso")}</span>
            <span className="font-display font-semibold text-accent">
              {applyUnits(
                entries[entries.length - 1].weightKg,
                settings.units,
              ).toFixed(1)}{" "}
              {formatUnits(settings.units)}
            </span>
          </Link>
        )}

        <PlateauAlerts />

        <PastSelfView />

        <GoalSetter />

        <GoalProjectionCard />

        <section className="panel-light rounded-2xl p-4">
          <DynamicChallenges
            level={challengeLevel}
            statsByDuration={statsByDuration}
          />
        </section>
        <section className="panel-light rounded-2xl p-4">
          <QuickTemplates />
        </section>
      </div>
    </div>
  );
};
