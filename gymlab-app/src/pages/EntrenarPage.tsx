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
import { useRoutineDaysWithItems } from "@/hooks/useRoutines";
import type { RoutineItemWithNames } from "@/hooks/useRoutines";
import type { ExerciseCategory, MuscleGroup, RoutineItem } from "@/domain/types";
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
import { groupSetsByExercise } from "@/domain/setStats";
import { JournalInsightCard } from "@/components/insights/JournalInsightCard";
import { computeJournalInsight } from "@/domain/journalInsights";
import { useLiveList } from "@/hooks/useLiveList";
import { sessionJournalRepo, stepRepo } from "@/data/repositories";
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

// Fallback estable para los grupos del día: evita que el memo se invalide por un
// array nuevo en cada render cuando no hay rutina o el día no está en el selector.
const EMPTY_GROUPS: string[] = [];

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
  // Fuente única de días + items del selector (F103/T8): devuelve también los días
  // crudos para el calendario y los grupos por día, sin getDays/getItems duplicados.
  const { days: routineDays, selectableDays: daysWithItems, groupsByDay } =
    useRoutineDaysWithItems(routine?.id ?? null);

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

  // Chips del hero: grupos del día de hoy tomados del selector ya cargado (F103/T8).
  // Un día sin items no está en el mapa y devuelve [] (mismo resultado que el
  // getItems propio que había antes); el arranque sigue pasando por el selector.
  const todayGroups = useMemo(
    () =>
      todayDay ? groupsByDay.get(todayDay.id) ?? EMPTY_GROUPS : EMPTY_GROUPS,
    [todayDay, groupsByDay],
  );

  const { prs } = usePRs();
  // Racha derivada de los workouts ya cargados (una consulta menos en la home).
  const streak = useMemo(() => calcStreak(workouts.map(localDateOf)), [workouts]);
  const challengeLevel = useMemo(() => deriveLevel(workouts), [workouts]);
  const prDates = useMemo(
    () => prs.map((pr) => prDateKey(pr.date)),
    [prs],
  );
  // Señales de los retos nuevos (F109.2): pasos vivos y mapas del catálogo
  // para cardio (categoría) y volumen por grupo muscular.
  const stepDays = useLiveList(() => stepRepo.getAll());
  const exerciseMuscles = useMemo(() => {
    const map = new Map<number, MuscleGroup>();
    for (const exercise of catalogExercises) {
      map.set(exercise.id, exercise.muscleGroup);
    }
    return map;
  }, [catalogExercises]);
  const exerciseCategories = useMemo(() => {
    const map = new Map<number, ExerciseCategory>();
    for (const exercise of catalogExercises) {
      if (exercise.category) map.set(exercise.id, exercise.category);
    }
    return map;
  }, [catalogExercises]);
  const statsByDuration = useMemo(
    () =>
      computeChallengeStats(workouts, prDates, sets, undefined, {
        stepDays,
        exerciseMuscles,
        exerciseCategories,
      }),
    [workouts, prDates, sets, stepDays, exerciseMuscles, exerciseCategories],
  );
  // Agrupamiento de series por ejercicio compartido por plateau y proyecciones
  // (F103/T8): antes cada widget reconstruía el mismo Map desde todo el historial.
  const setsByExercise = useMemo(() => groupSetsByExercise(sets), [sets]);
  // La racha ya calculada se reutiliza acá y en recovery (una sola vez por visita).
  const weeklySummary = useMemo(
    () => buildWeeklySummary(workouts, prs, streak),
    [workouts, prs, streak],
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

  const recoveryScore = useRecoveryScore(workouts, journals, streak.currentStreak);

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
      <div className="space-y-4 p-4">
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

        <ProgressDashboard
          workouts={workouts}
          prs={prs}
          streak={streak}
          trained={trainedDates}
        />

        {settings.showWeightHint && (
          <LastWeightLink settings={settings} entries={bodyWeightEntries} />
        )}

        <PlateauAlerts
          sets={sets}
          exercises={catalogExercises}
          setsByExercise={setsByExercise}
        />

        <PastSelfView
          workouts={workouts}
          sets={sets}
          settings={settings}
          entries={bodyWeightEntries}
        />

        <GoalProjectionCard
          sets={sets}
          exercises={catalogExercises}
          setsByExercise={setsByExercise}
        />

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
