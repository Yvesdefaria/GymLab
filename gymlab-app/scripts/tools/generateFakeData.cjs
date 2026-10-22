// Generador de datos de ejemplo en formato backup GymLab (para importar en Ajustes).
// Node puro sin dependencias: `node scripts/generateFakeData.cjs` -> fake-data.json
// Solo incluye tablas de usuario; las tablas de catálogo/seed se omiten a propósito
// para que el import preserve las rutinas y ejercicios reales de la app.

const fs = require('fs')

// --- PRNG determinista (misma salida en cada ejecución) ---
const lcg = (seed) => {
  let s = seed
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff
}
const rnd = lcg(20260808)
const round1 = (n) => Math.round(n * 10) / 10

// Misma fórmula Brzycki que la app (src/domain/prs.ts) para que PRs y totalVolume sean coherentes.
const brzycki = (w, reps) =>
  reps <= 0 || w <= 0 ? 0 : Math.round(w * (36 / (37 - reps)) * 10) / 10

// --- Utilidades de fecha ---
const toISO = (date, hh, mm, sec = 0) =>
  `${date}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
const addDays = (date, n) => {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
const weekdayOf = (date) => new Date(Date.parse(date)).getUTCDay()
// Descompone minutos totales en hora:minuto válidos (maneja overflow a la hora siguiente).
const minutesToHM = (m) => [Math.floor(m / 60) % 24, m % 60]

// --- Ventana de la demo: relativa a HOY ---
// El historial termina hoy para que la home muestre la semana en curso, la racha viva
// y las estadísticas con volumen reciente. Un rango fijo envejece y deja todo en cero.
const pad2 = (n) => String(n).padStart(2, '0')
const today = new Date()
const END = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`
const START = addDays(END, -124) // ~18 semanas de historial

// Programa de 3 días con "hoy" incluido: hoy queda pendiente y la semana ya tiene
// sesiones hechas, así el hero muestra la sesión de hoy y el calendario está vivo.
const PROGRAM_WEEKDAYS = [(weekdayOf(END) + 4) % 7, (weekdayOf(END) + 5) % 7, weekdayOf(END)]

// Lunes de la semana de una fecha (para marcar la semana anterior como descarga).
const weekStartOf = (date) => addDays(date, -((weekdayOf(date) + 6) % 7))
const DELOAD_START = addDays(weekStartOf(END), -7)
const DELOAD_END = addDays(DELOAD_START, 6)

// --- Plantillas de sesión (rutina PPL Definición, seed routineId 5; días 13/14/15) ---
// Cada ejercicio: id, nº series, reps, peso base (kg), incremento cada 4 semanas, rpe/rir opcionales.
const DAYS = {
  push: [
    { exerciseId: 1, sets: 3, reps: 12, base: 55, step: 2.5, rpe: 8 },
    { exerciseId: 6, sets: 3, reps: 15, base: 20, step: 0.5, rir: 2 },
    { exerciseId: 23, sets: 3, reps: 12, base: 18, step: 0.5, rpe: 8 },
    { exerciseId: 19, sets: 3, reps: 15, base: 22, step: 1, rir: 1 },
  ],
  pull: [
    { exerciseId: 7, sets: 3, reps: 10, base: 0, step: 0 },
    { exerciseId: 10, sets: 3, reps: 12, base: 45, step: 1.5, rpe: 8 },
    { exerciseId: 14, sets: 3, reps: 15, base: 12, step: 0.5, rir: 2 },
    { exerciseId: 26, sets: 3, reps: 15, base: 20, step: 0.5, rir: 1 },
  ],
  legs: [
    { exerciseId: 29, sets: 3, reps: 12, base: 130, step: 5, rpe: 8.5 },
    { exerciseId: 32, sets: 3, reps: 12, base: 18, step: 0.5, rir: 2 },
    { exerciseId: 31, sets: 3, reps: 15, base: 40, step: 1, rir: 1 },
    { exerciseId: 48, sets: 3, reps: 15, base: 60, step: 2, rir: 1 },
  ],
}

// Posición en la semana -> plantilla y día de rutina (orden de PROGRAM_WEEKDAYS).
// El último día cae en "hoy": Pull, para que el hero muestre espalda, bíceps y hombro.
const SLOTS = [
  { day: 'push', routineDayId: 13, hour: 18, min: 0, durMin: 55 },
  { day: 'legs', routineDayId: 15, hour: 7, min: 30, durMin: 55 },
  { day: 'pull', routineDayId: 14, hour: 7, min: 30, durMin: 50 },
]

// --- Cálculo de la progresión de carga ---
const weeksElapsed = (date) => Math.floor(daysBetween(START, date) / 7)
const loadFor = (ex, date) => {
  const blocks = Math.floor(weeksElapsed(date) / 4)
  const base = round1(ex.base + ex.step * blocks)
  if (ex.base === 0) return 0
  // Pequeña variación de sesión a sesión, siempre en pasos de 0,5 kg.
  return Math.max(0, Math.round((base + (rnd() - 0.5) * ex.step) * 2) / 2)
}

// --- Generación de workouts y sets ---
const workouts = []
const workoutSets = []
const prBests = new Map() // exerciseId -> mejor e1RM con su set

let workoutId = 1
let setId = 1

// Notas de sesión de ejemplo (EN): se asignan después a sesiones concretas del historial.
const SESSION_NOTES = [
  'First full week of PPL: bench moved well and bar speed held.',
  'Bench up to 65 kg; right elbow a bit cranky during the warm-up.',
  'New block: +2.5 kg on the main lifts.',
  'Leg press PR at 105 kg for 12 clean reps.',
]

// Historial: 3 días/semana en los días programados del programa. Hoy queda sin entrenar
// a propósito, así la home muestra la sesión de hoy pendiente.
let date = START
while (date < END) {
  const wd = weekdayOf(date)
  const slotPos = PROGRAM_WEEKDAYS.indexOf(wd)
  if (slotPos < 0) {
    date = addDays(date, 1)
    continue
  }
  const slot = SLOTS[slotPos]
  const startTotal = slot.hour * 60 + slot.min
  const [startHH, startMM] = minutesToHM(startTotal)
  const [endHH, endMM] = minutesToHM(startTotal + slot.durMin)
  const startedAt = toISO(date, startHH, startMM)
  const finishedAt = toISO(date, endHH, endMM)

  const sets = []
  let totalVolume = 0
  for (const ex of DAYS[slot.day]) {
    for (let s = 1; s <= ex.sets; s++) {
      // La semana anterior es de descarga (60% de carga): la comparativa semanal
      // muestra una vuelta a volumen normal en lugar de una caída a mitad de semana.
      const deloadWeek = date >= DELOAD_START && date <= DELOAD_END
      const load = loadFor(ex, date)
      const weightKg = deloadWeek ? Math.round(load * 0.6 * 2) / 2 : load
      const [ch, cm] = minutesToHM(startTotal + s * 5)
      const createdAt = toISO(date, ch, cm, 17)
      const set = {
        id: setId++,
        workoutId,
        exerciseId: ex.exerciseId,
        setNumber: s,
        weightKg,
        reps: ex.reps,
        completed: true,
        createdAt,
      }
      if (ex.rpe != null && s === ex.sets) set.rpe = ex.rpe
      if (ex.rir != null && s === ex.sets) set.rir = ex.rir
      sets.push(set)
      if (weightKg > 0) {
        totalVolume += weightKg * ex.reps
        const e1rm = brzycki(weightKg, ex.reps)
        const cur = prBests.get(ex.exerciseId)
        if (!cur || e1rm > cur.estimated1RM) {
          prBests.set(ex.exerciseId, {
            exerciseId: ex.exerciseId,
            weightKg,
            reps: ex.reps,
            date: createdAt,
            estimated1RM: e1rm,
          })
        }
      }
    }
  }

  totalVolume = round1(totalVolume)
  workouts.push({
    id: workoutId,
    startedAt,
    finishedAt,
    routineId: 5,
    routineDayId: slot.routineDayId,
    localDate: date,
    notes: '',
    totalVolume,
  })
  workoutSets.push(...sets)
  workoutId++

  date = addDays(date, 1)
}

// Notas repartidas entre sesiones del historial (no en la primera ni en la última).
const noteSlots = [2, 12, 26, 40]
noteSlots.forEach((index, i) => {
  const workout = workouts[index]
  if (workout) workout.notes = SESSION_NOTES[i]
})

// --- PRs: mejor 1RM estimado por ejercicio (solo con peso) ---
const prs = Array.from(prBests.values()).sort((a, b) => a.exerciseId - b.exerciseId)

// --- Peso corporal diario (tendencia descendente + ruido) ---
const bodyWeight = []
let bwId = 1
let d = START
const drift = (daysBetween(START, END) > 0 ? 84.2 : 80)
const target = 78.0
while (d <= END) {
  const t = daysBetween(START, d) / Math.max(1, daysBetween(START, END))
  const w = drift + (target - drift) * t + (rnd() - 0.5) * 0.8
  bodyWeight.push({
    id: bwId++,
    localDate: d,
    weightKg: round1(w),
    createdAt: toISO(d, 8, 0),
  })
  d = addDays(d, 1)
}

// --- Medidas corporales mensuales (cm) ---
// Cinco muestras equiespaciadas dentro de la ventana de la demo (siempre dentro del rango).
const measureDates = [0, 1, 2, 3, 4].map((i) => addDays(START, 10 + i * 27))
const measureTrend = (startV, endV, i) => round1(startV + (endV - startV) * (i / (measureDates.length - 1)))
const bodyMeasurements = measureDates.map((localDate, i) => ({
  id: i + 1,
  localDate,
  values: {
    cuello: measureTrend(41, 40.5, i),
    hombros: measureTrend(122, 124, i),
    pecho: measureTrend(102, 104, i),
    cintura: measureTrend(90, 84, i),
    abdomen: measureTrend(95, 87, i),
    caderas: measureTrend(102, 100, i),
    biceps_der: measureTrend(36, 37.5, i),
    biceps_izq: measureTrend(36, 37.5, i),
    muslo_der: measureTrend(58, 60, i),
    muslo_izq: measureTrend(58, 60, i),
  },
  createdAt: toISO(localDate, 9, 0),
}))

// --- Pliegues cutáneos mensuales (Jackson-Pollock 7 sitios) ---
const skinfoldTrend = (startV, endV, i) => round1(startV + (endV - startV) * (i / (measureDates.length - 1)))
const skinfolds = measureDates.map((localDate, i) => {
  const bw = bodyWeight.find((b) => b.localDate === localDate) ?? bodyWeight[0]
  return {
    id: i + 1,
    localDate,
    sex: 'male',
    age: 31,
    weightKg: bw.weightKg,
    sites: {
      pectoral: skinfoldTrend(15, 10, i),
      axilar: skinfoldTrend(14, 10, i),
      triceps: skinfoldTrend(14, 10, i),
      subescapular: skinfoldTrend(16, 12, i),
      abdominal: skinfoldTrend(22, 15, i),
      suprailiaco: skinfoldTrend(18, 12, i),
      muslo: skinfoldTrend(18, 14, i),
    },
    createdAt: toISO(localDate, 9, 15),
  }
})

// --- Perfil y programa activo ---
const profile = [
  {
    id: 1,
    displayName: 'Carlos Demo',
    weeklyGoal: 3,
    createdAt: toISO(addDays(START, -7), 9, 0),
    userId: 'demo-user-1',
  },
]
const activeProgram = [
  {
    id: 1,
    routineId: 5,
    startDate: START,
    weekdays: PROGRAM_WEEKDAYS,
    createdAt: toISO(addDays(START, -7), 9, 0),
    deloadActive: false,
    deloadUntil: null,
  },
]

// --- Metadatos (mismos keys/formatos que la app) ---
const settings = {
  units: 'kg',
  preloadLast: true,
  preloadSetCount: 0,
  preloadWeightMode: 'exact',
  preloadWeightValue: 0,
  autoStartRest: true,
  restSound: true,
  restVibrate: true,
  keepScreenAwake: false,
  confirmLeaveSession: true,
  showRpe: true,
  showRir: true,
  warmupSets: false,
  warmupPercents: [50, 70, 90],
  showLoadSuggestion: true,
  loadProgressionPct: 2.5,
  undoDurationSec: 5,
  showInstallPrompt: true,
  homeShowTodayFocus: true,
  showWeightHint: true,
}
const meta = [
  { key: 'settings', value: JSON.stringify(settings) },
  { key: 'onboardingDone', value: 'true' },
  { key: 'exerciseFavorites', value: JSON.stringify([1, 27, 7, 12]) },
  { key: 'exerciseRecents', value: JSON.stringify([1, 22, 8, 13, 27, 11, 29, 31, 24, 19]) },
  { key: 'routineFavorites', value: JSON.stringify([5, 4, 17]) },
  { key: 'heightCm', value: '180' },
  { key: 'bodySex', value: '"male"' },
  { key: 'theme', value: 'night' },
  { key: 'palette', value: 'gold' },
]

// --- Notas por ejercicio ---
const exerciseNotes = [
  {
    exerciseId: 1,
    note: 'Add 2.5 kg to the bench press next session.',
    updatedAt: toISO(addDays(END, -1), 18, 45),
  },
  {
    exerciseId: 29,
    note: 'Keep the leg press depth below parallel on every set.',
    updatedAt: toISO(addDays(END, -2), 8, 15),
  },
  {
    exerciseId: 10,
    note: 'Neutral spine on machine rows, no body English.',
    updatedAt: toISO(addDays(END, -3), 8, 10),
  },
]

// --- Social (stubs local-first) ---
const socialProfiles = [
  {
    id: 'demo-1',
    handle: 'carlosdemo',
    displayName: 'Carlos Demo',
    avatarUrl: null,
    bio: 'Testing GymLab with demo data.',
    createdAt: toISO(addDays(START, -7), 9, 0),
    remoteId: null,
    syncedAt: null,
  },
]
const lastWorkout = workouts[workouts.length - 1]
const posts = [
  {
    id: 'post-1',
    authorId: 'demo-1',
    type: 'workout',
    workoutId: lastWorkout.id,
    caption: 'Pull session done: pull-ups and machine rows felt strong.',
    mediaIds: [],
    visibility: 'public',
    createdAt: lastWorkout.finishedAt,
    remoteId: null,
    syncedAt: null,
  },
  {
    id: 'post-2',
    authorId: 'demo-1',
    type: 'text',
    workoutId: null,
    caption: 'Leg press climbing every block: 105 kg for 12 reps.',
    mediaIds: [],
    visibility: 'friends',
    createdAt: toISO(addDays(END, -4), 12, 0),
    remoteId: null,
    syncedAt: null,
  },
  {
    id: 'post-3',
    authorId: 'demo-1',
    type: 'photo',
    workoutId: null,
    caption: 'Kit ready for the new volume block.',
    mediaIds: ['media-1'],
    visibility: 'public',
    createdAt: toISO(addDays(END, -9), 11, 30),
    remoteId: null,
    syncedAt: null,
  },
]
const postMedia = [
  {
    id: 'media-1',
    localUri: 'media/demo/volumen.jpg',
    mimeType: 'image/jpeg',
    width: 800,
    height: 600,
    createdAt: toISO(addDays(END, -9), 11, 20),
    remoteId: null,
    syncedAt: null,
  },
]

// --- Ensamblado del backup (solo tablas de usuario; catálogo/seed se omiten) ---
const backup = {
  app: 'GymLab',
  version: 1,
  exportedAt: toISO(END, 12, 0),
  tables: {
    workouts,
    workoutSets,
    prs,
    profile,
    activeProgram,
    meta,
    bodyWeight,
    bodyMeasurements,
    skinfolds,
    exerciseNotes,
    socialProfiles,
    posts,
    postMedia,
  },
}

fs.writeFileSync('fake-data.json', JSON.stringify(backup, null, 2))
console.log(
  `fake-data.json generado: ${workouts.length} workouts, ${workoutSets.length} sets, ` +
    `${prs.length} PRs, ${bodyWeight.length} pesos corporales, ` +
    `${bodyMeasurements.length} medidas, ${skinfolds.length} pliegues, ${meta.length} meta rows`
)
