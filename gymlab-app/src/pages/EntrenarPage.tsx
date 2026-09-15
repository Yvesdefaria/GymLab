// Página home «Entrenar» (/): inicio de sesión, progreso del programa, racha e historial.
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { WeekCalendar } from "@/components/calendar/WeekCalendar";
import { WeeklySummaryCard } from "@/components/home/WeeklySummaryCard";
import { ProgressDashboard } from "@/components/home/ProgressDashboard";
import { PlateauAlerts } from "@/components/home/PlateauAlerts";
import { PastSelfView } from "@/components/home/PastSelfView";
import { GoalProjectionCard } from "@/components/home/GoalProjectionCard";
import { InstallBanner } from "@/components/ui/InstallBanner";
import { useActiveWorkoutStore } from "@/store/activeWorkoutStore";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useWorkoutSets } from "@/hooks/useWorkoutSets";
import { useExerciseCatalog } from "@/hooks/useExerciseCatalog";
import { useBodyWeight } from "@/hooks/useBodyWeight";
import { HeroCard } from "@/components/home/HeroCard";
import { DaySelectorSheet } from "@/components/home/DaySelectorSheet";
import { EmptyDayToast } from "@/components/ui/EmptyDayToast";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { useActiveProgram } from "@/hooks/useActiveProgram";
import {
  useRoutineDays,
  useRoutineDay,
  useRoutineDaysWithItems,
} from "@/hooks/useRoutines";
import type { RoutineItemWithNames } from "@/hooks/useRoutines";
import type { RoutineItem } from "@/domain/types";
import { resolveDayStart } from "@/domain/routines";
import { useStartSession } from "@/hooks/useStartSession";
import {
  programProgressPct,
  trainedLocalDates,
  scheduledDayIndex,
} from "@/domain/calendar";
import { useSettings } from "@/hooks/useSettings";
import { formatUnits } from "@/domain/settings";
import { sessionProgressPct } from "@/domain/sessionProgress";
import { localDateOf, toLocalDateStr } from "@/domain/dates";
import { prDateKey } from "@/domain/prs";
import { calcStreak } from "@/domain/streak";
import { JournalInsightCard } from "@/components/insights/JournalInsightCard";
import { computeJournalInsight } from "@/domain/journalInsights";
import { useLiveList } from "@/hooks/useLiveList";
import { sessionJournalRepo } from "@/data/repositories";
import { RecoveryScoreCard } from "@/components/home/RecoveryScoreCard";
import { QuickTemplates } from "@/components/quick/QuickTemplates";
import { DeloadBanner } from "@/components/deload/DeloadBanner";
import { DynamicChallenges } from "@/components/challenges/DynamicChallenges";
import { LastWeightLink } from "@/components/home/LastWeightLink";
import { Panel } from "@/components/ui/Panel";
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
  const { sets } = useWorkoutSets();
  const { exercises: catalogExercises } = useExerciseCatalog();
  const { entries: bodyWeightEntries } = useBodyWeight();
  const { program, routine } = useActiveProgram();
  const { days: routineDays } = useRoutineDays(routine?.id ?? null);
  // Días con ejercicios para el selector de día (F99.1 D2); solo los seleccionables.
  const { selectableDays: daysWithItems } = useRoutineDaysWithItems(
    routine?.id ?? null,
  );

  // Mapa día → items para resolver el arranque con la función pura (F99.1 D4).
  const itemsByDay = useMemo(() => {
    const m = new Map<number, RoutineItem[]>();
    for (const { day, items } of daysWithItems) {
      m.set(day.id, items);
    }
    return m;
  }, [daysWithItems]);

  const { settings } = useSettings();

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

  // Los grupos del día de hoy se siguen usando para las chips del hero; los items
  // ya no se necesitan aquí (F99.1: el arranque pasa por el selector de día).
  const { groups: todayGroups } = useRoutineDay(todayDay?.id ?? null);

  const { prs } = usePRs();
  // Racha derivada de los workouts ya cargados (una consulta menos en la home).
  const streak = useMemo(() => calcStreak(workouts.map(localDateOf)), [workouts]);
  const challengeLevel = useMemo(() => deriveLevel(workouts), [workouts]);
  const prDates = useMemo(
    () => prs.map((pr) => prDateKey(pr.date)),
    [prs],
  );
  const statsByDuration = useMemo(
    () => computeChallengeStats(workouts, prDates),
    [workouts, prDates],
  );
  const weeklySummary = useMemo(
    () => buildWeeklySummary(workouts, prs),
    [workouts, prs],
  );

  const hasActiveWorkout = startedAt !== null;

  // Estado del selector de día y del aviso de día vacío (F99.1).
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [emptyDay, setEmptyDay] = useState<number | null>(null);
  const [emptyDayToast, setEmptyDayToast] = useState(false);

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

  const journals = useLiveList(() => sessionJournalRepo.getAll());
  const journalInsight = useMemo(
    () => computeJournalInsight(journals, workouts),
    [journals, workouts],
  );

  const recoveryScore = useRecoveryScore(workouts, journals);

  // Inicia eligiendo día cuando hay programa activo (F99.1 R1); sin programa,
  // se conserva el arranque de sesión en blanco (día libre).
  const handleStart = () => {
    if (program && routine) {
      setDayPickerOpen(true);
      return;
    }
    startWorkout();
    navigate("/entrenamiento/active");
  };

  // “Cambiar día” (F99.1 R2/D5): mismo selector que “Empezar”; el hero lo oculta
  // mientras haya sesión activa.
  const handleChangeDay = () => {
    if (program && routine) setDayPickerOpen(true);
  };

  // Arranca la sesión con el día elegido; un día sin items queda guardado por R4
  // (ConfirmSheet sobre el selector, sin crear sesión).
  const handleSelectDay = async (dayId: number) => {
    if (!routine) return;
    const resolution = resolveDayStart(dayId, itemsByDay);
    if (resolution.kind === "empty") {
      setEmptyDay(dayId);
      return;
    }
    setDayPickerOpen(false);
    // Los items del selector llegan enriquecidos (nombre del ejercicio); resolveDayStart
    // opera sobre RoutineItem, así que el map usa el tipo enriquecido para el nombre.
    const items = resolution.items as RoutineItemWithNames[];
    await startRoutineDay(
      items.map((it) => ({
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
      dayId,
    );
    navigate("/entrenamiento/active");
  };

  // Confirma la cancelación de un día vacío (R4): sin sesión, toast y vuelta a la home.
  const confirmEmptyDay = () => {
    setEmptyDay(null);
    setDayPickerOpen(false);
    setEmptyDayToast(true);
    navigate("/", { replace: true });
  };

  // Descarta el aviso y deja el selector abierto para elegir otro día (R4).
  const dismissEmptyDay = () => setEmptyDay(null);

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
          onChangeDay={handleChangeDay}
          onContinue={() => navigate("/entrenamiento/active")}
          t={t}
        />
        <DeloadBanner program={program} />
        {/*inicio Calendario semanal */}
        {recoveryScore && <RecoveryScoreCard data={recoveryScore} />}

        {journalInsight && <JournalInsightCard insight={journalInsight} />}

        <Panel as="section">
          <WeekCalendar
            trained={trainedDates}
            program={program ?? null}
            routineDaysCount={routine?.daysCount ?? 0}
            routineDays={routineDays}
          />
        </Panel>

        {weeklySummary && (
          <WeeklySummaryCard
            summary={weeklySummary}
            units={formatUnits(settings.units)}
          />
        )}
        {/*fin Calendario semanal */}

        <ProgressDashboard workouts={workouts} prs={prs} streak={streak} />

        {settings.showWeightHint && (
          <LastWeightLink settings={settings} entries={bodyWeightEntries} />
        )}

        <PlateauAlerts sets={sets} exercises={catalogExercises} />

        <PastSelfView
          workouts={workouts}
          sets={sets}
          settings={settings}
          entries={bodyWeightEntries}
        />

        <GoalProjectionCard sets={sets} exercises={catalogExercises} />

        <Panel as="section">
          <DynamicChallenges
            level={challengeLevel}
            statsByDuration={statsByDuration}
          />
        </Panel>
        <Panel as="section">
          <QuickTemplates exercises={catalogExercises} />
        </Panel>
      </div>

      {/* Selector de día sobre el home (F99.1 D1); solo días con ejercicios (D2). */}
      {dayPickerOpen && routine && (
        <DaySelectorSheet
          days={daysWithItems.map(({ day }) => day)}
          routineName={routine.title}
          onSelectDay={(dayId) => void handleSelectDay(dayId)}
          onClose={() => setDayPickerOpen(false)}
        />
      )}

      {/* Día vacío (R4): guardado porque el selector filtra; sobre el picker que queda abierto. */}
      {emptyDay !== null && (
        <ConfirmSheet
          title={t("home.diaVacioTitulo")}
          message={t("home.diaVacioMensaje")}
          confirmLabel={t("home.diaVacioCancelar")}
          cancelLabel={t("layout.confirm.close")}
          onConfirm={confirmEmptyDay}
          onCancel={dismissEmptyDay}
        />
      )}

      {emptyDayToast && <EmptyDayToast />}
    </div>
  );
};
