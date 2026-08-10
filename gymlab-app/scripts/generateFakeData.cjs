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

const START = '2026-04-06' // lunes, inicio del plan PPL
const END = '2026-08-08' // sábado, incluye el "hoy" de la demo

// --- Plantillas de sesión (rutina PPL Volumen, seed routineId 1) ---
// Cada ejercicio: id, nº series, reps, peso base (kg), incremento cada 4 semanas, rpe/rir opcionales.
const DAYS = {
  push: [
    { exerciseId: 1, sets: 5, reps: 5, base: 60, step: 2.5, rpe: 8 },
    { exerciseId: 2, sets: 4, reps: 8, base: 24, step: 1, rpe: 8 },
    { exerciseId: 3, sets: 3, reps: 12, base: 12, step: 0.5, rir: 2 },
    { exerciseId: 22, sets: 4, reps: 6, base: 35, step: 1, rpe: 8 },
    { exerciseId: 24, sets: 3, reps: 12, base: 8, step: 0.5, rir: 1 },
    { exerciseId: 19, sets: 3, reps: 12, base: 25, step: 1, rir: 1 },
  ],
  pull: [
    { exerciseId: 7, sets: 4, reps: 8, base: 0, step: 0 },
    { exerciseId: 8, sets: 4, reps: 8, base: 50, step: 2, rpe: 8 },
    { exerciseId: 11, sets: 3, reps: 10, base: 50, step: 1.5, rir: 2 },
    { exerciseId: 13, sets: 3, reps: 10, base: 22, step: 0.5, rir: 1 },
    { exerciseId: 14, sets: 3, reps: 12, base: 10, step: 0.5, rir: 1 },
  ],
  legs: [
    { exerciseId: 27, sets: 5, reps: 5, base: 80, step: 2.5, rpe: 8.5 },
    { exerciseId: 29, sets: 3, reps: 10, base: 140, step: 5, rir: 2 },
    { exerciseId: 31, sets: 3, reps: 10, base: 45, step: 1.5, rir: 1 },
    { exerciseId: 30, sets: 3, reps: 10, base: 50, step: 2, rir: 1 },
    { exerciseId: 32, sets: 3, reps: 10, base: 20, step: 1, rir: 2 },
    { exerciseId: 36, sets: 3, reps: 45, base: 0, step: 0 },
  ],
}

// Mapa día-semana -> plantilla y rutina (routineDayId del seed PPL: 1=push, 2=pull, 3=legs)
const SLOT = {
  1: { day: 'push', routineDayId: 1, hour: 18, min: 0, durMin: 75 },
  3: { day: 'pull', routineDayId: 2, hour: 7, min: 30, durMin: 70 },
  4: { day: 'legs', routineDayId: 3, hour: 7, min: 30, durMin: 85 },
  5: { day: 'push', routineDayId: 1, hour: 18, min: 30, durMin: 75 },
  6: { day: 'pull', routineDayId: 2, hour: 10, min: 0, durMin: 65 },
}

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
const sessionNotes = {
  [`2026-04-13`]: 'Primera semana completa de PPL, buenas sensaciones.',
  [`2026-05-04`]: 'Subo banca a 65 kg, codo derecho molesto al calentar.',
  [`2026-06-15`]: 'Bloque nuevo: +2,5 kg en los grandes lifts.',
  [`2026-07-27`]: 'PR en sentadilla con 105 kg.',
}

// Horario base: 3 días/semana (L,X,V) + días extra (J,S) en las 2 últimas semanas.
let date = START
const totalWeeks = weeksElapsed(END)
while (date <= END) {
  const wd = weekdayOf(date)
  const weekIdx = weeksElapsed(date)
  const extraWeek = weekIdx >= totalWeeks - 2
  const allowed = extraWeek ? [1, 3, 4, 5, 6] : [1, 3, 5]
  if (!allowed.includes(wd)) {
    date = addDays(date, 1)
    continue
  }
  const slot = SLOT[wd]
  const startTotal = slot.hour * 60 + slot.min
  const [startHH, startMM] = minutesToHM(startTotal)
  const [endHH, endMM] = minutesToHM(startTotal + slot.durMin)
  const startedAt = toISO(date, startHH, startMM)
  const finishedAt = toISO(date, endHH, endMM)

  const sets = []
  let totalVolume = 0
  for (const ex of DAYS[slot.day]) {
    for (let s = 1; s <= ex.sets; s++) {
      const weightKg = loadFor(ex, date)
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
    routineId: 1,
    routineDayId: slot.routineDayId,
    localDate: date,
    notes: sessionNotes[date] ?? '',
    totalVolume,
  })
  workoutSets.push(...sets)
  workoutId++

  date = addDays(date, 1)
}

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
const measureDates = ['2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01']
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
    createdAt: '2026-03-30T09:00:00',
    userId: 'demo-user-1',
  },
]
const activeProgram = [
  {
    id: 1,
    routineId: 1,
    startDate: START,
    weekdays: [1, 3, 5],
    createdAt: '2026-03-30T09:00:00',
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
  warmupSets: true,
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
  { key: 'routineFavorites', value: JSON.stringify([1, 4, 17]) },
  { key: 'heightCm', value: '180' },
  { key: 'bodySex', value: '"male"' },
  { key: 'theme', value: 'night' },
  { key: 'palette', value: 'gold' },
]

// --- Notas por ejercicio ---
const exerciseNotes = [
  {
    exerciseId: 1,
    note: 'Subir 2,5 kg la próxima sesión de banca.',
    updatedAt: toISO('2026-08-07', 18, 45),
  },
  {
    exerciseId: 27,
    note: 'Mantener la profundidad bajo paralelo en todas las series.',
    updatedAt: toISO('2026-08-06', 8, 15),
  },
  {
    exerciseId: 8,
    note: 'Cuidar la espalda neutra, no usar impulso.',
    updatedAt: toISO('2026-08-05', 8, 10),
  },
]

// --- Social (stubs local-first) ---
const socialProfiles = [
  {
    id: 'demo-1',
    handle: 'carlosdemo',
    displayName: 'Carlos Demo',
    avatarUrl: null,
    bio: 'Probando GymLab con datos de ejemplo.',
    createdAt: '2026-03-30T09:00:00',
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
    caption: 'Sesión de pull completada: dominio y remo con nuevo PR.',
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
    caption: 'Mejorando la sentadilla semana a semana, 105 kg x 5.',
    mediaIds: [],
    visibility: 'friends',
    createdAt: toISO('2026-08-06', 12, 0),
    remoteId: null,
    syncedAt: null,
  },
  {
    id: 'post-3',
    authorId: 'demo-1',
    type: 'photo',
    workoutId: null,
    caption: 'Material listo para el bloque de volumen.',
    mediaIds: ['media-1'],
    visibility: 'public',
    createdAt: toISO('2026-08-01', 11, 30),
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
    createdAt: toISO('2026-08-01', 11, 20),
    remoteId: null,
    syncedAt: null,
  },
]

// --- Ensamblado del backup (solo tablas de usuario; catálogo/seed se omiten) ---
const backup = {
  app: 'GymLab',
  version: 1,
  exportedAt: toISO('2026-08-08', 12, 0),
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
