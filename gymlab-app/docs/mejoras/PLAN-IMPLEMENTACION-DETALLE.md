# GymLab — Detalle de implementación

> **Qué es este documento.** El detalle ejecutable del plan descrito en
> [`COMPARATIVA-Y-PLAN-MEJORA.md`](./COMPARATIVA-Y-PLAN-MEJORA.md). Ese documento explica
> *qué* y *por qué*; este explica *cómo*, archivo por archivo.
>
> **Estado del código.** Todo lo que aparece aquí es **código propuesto, no compilado**. No
> se ejecutó la app ni la suite. Las firmas marcadas con ⚠️ fueron inferidas por lectura y
> deben confirmarse antes de escribir.
>
> **Base.** Lectura estática de `main` @ `3bc868ca`.

**Índice**

1. [Cómo usar este documento](#1-cómo-usar-este-documento)
2. [Mapa de archivos](#2-mapa-de-archivos)
3. [Fase 0 — Código](#3-fase-0--código)
4. [Fase 1 — Código](#4-fase-1--código)
5. [Fase 2 — Código](#5-fase-2--código)
6. [Fase 3 — Código](#6-fase-3--código)
7. [Fase 4 — Barreras](#7-fase-4--barreras)
8. [Fase 5 — Producto](#8-fase-5--producto)
9. [Tabla de verificación numérica](#9-tabla-de-verificación-numérica)
10. [Orden de commits](#10-orden-de-commits)
11. [Firmas a confirmar](#11-firmas-a-confirmar)
12. [Riesgos de implementación](#12-riesgos-de-implementación)

---

## 1. Cómo usar este documento

**Regla de trabajo:** cada paso se implementa en este orden — test que falla, código,
verificación. Nunca al revés.

```bash
# Ciclo de un paso
npx vitest run tests/unit/domain/<archivo>.test.ts   # rojo
# ... implementar ...
npx vitest run tests/unit/domain/<archivo>.test.ts   # verde
npm run lint && npm run build                        # antes de commitear
```

**Lo que este documento no hace:** no decide producto. Las decisiones ya tomadas están en
`COMPARATIVA-Y-PLAN-MEJORA.md` §15.

---

## 2. Mapa de archivos

| Archivo | Acción | Fase | Notas |
|---|---|---|---|
| `tests/fixtures/reference-session.ts` | **Nuevo** | 0 | Fixture canónico |
| `tests/characterization/*.test.ts` | **Nuevo** (17) | 0 | Fijan el bug actual |
| `docs/METRICS-CONTRACT.md` | **Nuevo** | 0 | Contrato de métricas |
| `src/domain/oneRepMax.ts` | **Nuevo** | 1 | Único dueño del e1RM |
| `src/domain/prs.ts` | Modificar | 1 | Filtros + nueva clave |
| `src/domain/benchmark.ts` | Modificar | 1 | Delega en `oneRepMax.ts` |
| `src/domain/calculators/oneRepMax.ts` | Modificar | 1 | Adaptador de presentación |
| `src/data/repositories/dexie/db.ts` | Modificar | 1 | `version(16)` |
| `src/domain/metricRows.ts` | **Nuevo** | 1 | Selectores de series |
| `src/domain/exerciseIdentity.ts` | **Nuevo** | 1 | Resolución de alias |
| `src/domain/e1rm.ts` | Modificar | 1 | Promedio por sesión |
| `src/domain/muscleFatigue.ts` | Modificar | 2 | Hora real |
| `src/domain/streak.ts` | Modificar | 2 | Target adaptativo ⚠️ |
| `src/domain/goalProjection.ts` | Modificar | 2 | Discriminante de tendencia ⚠️ |
| `src/domain/deload.ts` | Modificar | 2 | Señales agrupadas ⚠️ |
| `src/domain/calculators/plates.ts` | Modificar | 3 | DP + `missingKg` |
| `src/data/backup.ts` | Modificar | 3 | Restore real |
| `src/domain/weeklyVolume.ts` | Modificar | 3 | Canónico ⚠️ |
| `src/domain/trainingStats.ts` | Modificar | 3 | Reexporta ⚠️ |
| `src/domain/calculators/bodyComposition.ts` | Modificar | 3 | Clasificación única ⚠️ |
| `src/domain/calculators/navy.ts` | Modificar | 3 | Sin clasificación ⚠️ |
| `src/domain/types.ts` | Modificar | 3 | `totalVolume` fuera |
| `oxlint` config | Modificar | 4 | Fronteras |
| `tests/contract/metrics.test.ts` | **Nuevo** | 4 | Contrato ejecutable |

⚠️ = firma o estructura inferida, confirmar antes.

---

## 3. Fase 0 — Código

### 3.1 `tests/fixtures/reference-session.ts`

Diseñado para que **cada bug tenga un borde expuesto**. Los valores están calculados a mano
en la sección 9.

```ts
import type { Workout, WorkoutSet } from '../../src/domain/types'

/**
 * Sesión canónica de referencia.
 *
 * Propiedades buscadas:
 *  - Serie 1 y 3 tienen el MISMO e1RM Brzycki (84.7). Bajo la definición vieja, el
 *    warm-up gana por empate (el `>` no reemplaza). Es el borde de H1.
 *  - Serie 4 tiene el e1RM más alto (86.4) pero es de 12 reps: máxima dispersión
 *    entre Brzycki y Epley dentro del rango válido.
 *  - Serie 5 tiene peso y 0 reps: el caso de H5.
 *  - Serie 6 es un single: 1RM = peso exacto, sin fórmula.
 */
export const REFERENCE_WORKOUT: Workout = {
  id: 1,
  startedAt: '2026-10-20T18:00:00.000Z',
  finishedAt: '2026-10-20T19:05:00.000Z',
  routineId: 1,
  routineDayId: 1,
  localDate: '2026-10-20',
  notes: '',
  totalVolume: 0, // se recalcula; no confiar en el valor guardado
}

const base = {
  workoutId: 1,
  exerciseId: 1,
  setNumber: 0,
  completed: true,
  createdAt: '2026-10-20T18:05:00.000Z',
}

export const REFERENCE_SETS: WorkoutSet[] = [
  { ...base, id: 1, setNumber: 1, weightKg: 40,  reps: 20, isWarmup: true },
  { ...base, id: 2, setNumber: 2, weightKg: 60,  reps: 5  },
  { ...base, id: 3, setNumber: 3, weightKg: 80,  reps: 3  },
  { ...base, id: 4, setNumber: 4, weightKg: 60,  reps: 12 },
  { ...base, id: 5, setNumber: 5, weightKg: 40,  reps: 0  },
  { ...base, id: 6, setNumber: 6, weightKg: 100, reps: 1  },
]

export const REFERENCE_1RM = {
  brzycki: [84.7, 67.5, 84.7, 86.4, null, 100.0],
  epley:   [66.7, 70.0, 88.0, 84.0, null, 100.0],
} as const

export const REFERENCE_RECORDS = {
  '1rm':  { reps: 1,  weightKg: 100 },
  '3rm':  { reps: 3,  weightKg: 80  },
  '5rm':  { reps: 5,  weightKg: 60  },
  '12rm': { reps: 12, weightKg: 60  },
} as const
```

**Nota sobre el empate 84.7.** Es el hallazgo más fino de todo el análisis: dos series con
e1RM idéntico, una de ellas un calentamiento. Con la comparación `>` del código actual, la
primera gana. El PR queda registrado como `40 kg × 20` en lugar de `80 kg × 3`, aunque el
e1RM sea el mismo. Al borrar la sesión, `bestPRFromSets` filtra el warm-up y el PR pasa a
`80 kg × 3` — mismo número, distinto peso. Es un cambio de dato invisible para el usuario y
reproducible solo con este fixture.

### 3.2 `tests/characterization/` — 17 tests

Fijan el comportamiento **actual**, incluido el bug. Se declaran con `describe.skip` y se
activan a medida que cada paso los corrige. Objetivo: que ninguna corrección posterior pase
inadvertida.

**Plantilla:**

```ts
import { describe, it, expect } from 'vitest'

/**
 * H1 — Un calentamiento puede generar un PR.
 * Estado: BUG ABIERTO (paso 1.3).
 * Al corregir: quitar `.skip` y ajustar la expectativa al comportamiento correcto.
 */
describe.skip('H1 — warm-up y PR', () => {
  it('el warm-up de 40×20 gana el PR por empate de e1RM', () => {
    /* ... */
  })
})
```

**Los 17, con su aserción:**

| # | Archivo | Aserción que fija el bug |
|---|---|---|
| H1 | `h1-warmup-pr.test.ts` | `detectPRsFromSets([40×20 warmup, 80×3])` devuelve `weightKg === 40` |
| H2 | `h2-brzycki-cap.test.ts` | `estimate1RM(20, 36) === 720` y `estimate1RM(20, 37) === 0` |
| H3 | `h3-two-estimators.test.ts` | `benchmarkEstimate1RM(100, 37) === Infinity`; `(100, 38) === -3600` |
| H4 | `h4-warmup-policy.test.ts` | volumen de sesión incluye warm-ups; comparador los excluye |
| H5 | `h5-zero-reps.test.ts` | con `reps: 0` se crea PR con `estimated1RM === 0` |
| H6 | `h6-streak-two-days.test.ts` | rutina de 2 días × 8 semanas → `currentStreak === 0` |
| H7 | `h7-fatigue-hours.test.ts` | entreno ayer 20:00, consulta hoy 09:00 → 33 h, no 13 h |
| H8 | `h8-projection-negative.test.ts` | tasa −2 %/semana → devuelve fecha futura igual |
| H9 | `h9-avg-e1rm-sets.test.ts` | 1 sesión de 100 kg + 10 sesiones de 70 kg → promedio 72,7 (por serie) |
| H10 | `h10-import-empty.test.ts` | backup con `bodyWeight: []` no borra los pesos existentes |
| H11 | `h11-weekly-volume.test.ts` | `weeklyVolume` rellena ceros; `trainingStats` no |
| H12 | `h12-fat-thresholds.test.ts` | 17,5 % → `fitness` en Navy, `promedio` en Jackson-Pollock |
| H13 | `h13-strength-sex.test.ts` | `getStrengthPercentile` ignora `sex: 'female'` |
| H14 | `h14-bone-mass.test.ts` | sin altura → usa 170 cm |
| H15 | `h15-tdee-steps.test.ts` | TDEE "activo" + 10.000 pasos suma `pasos × 0,04` |
| H16 | `h16-water.test.ts` | 0,5 L / 30 min = 1,0 L/h, por encima del rango citado 0,4–0,8 |
| H17 | `h17-bw-volume.test.ts` | 10 dominadas → volumen 0 |

**Aserción H1, completa:**

```ts
import { detectPRsFromSets } from '../../src/domain/prs'
import { REFERENCE_SETS } from '../fixtures/reference-session'

const prs = detectPRsFromSets(REFERENCE_SETS.slice(0, 3), new Map())
// serie 1 (40×20 warmup) y serie 3 (80×3) tienen e1RM 84.7
expect(prs).toHaveLength(1)
expect(prs[0].weightKg).toBe(40)          // el warm-up
expect(prs[0].reps).toBe(20)
expect(prs[0].estimated1RM).toBe(84.7)
```

**Aserción H3, completa:**

```ts
import { estimate1RM as benchmarkEstimate } from '../../src/domain/benchmark'
expect(benchmarkEstimate(100, 37)).toBe(Number.POSITIVE_INFINITY)
expect(benchmarkEstimate(100, 38)).toBe(-3600)
```

**Criterio de aceptación de la fase:** `npx vitest run tests/characterization` pasa en verde
con todos los `describe.skip` activos. Si alguno no pasa, el comportamiento ya cambió y hay
que revisar el hallazgo.

### 3.3 `docs/METRICS-CONTRACT.md`

Se completa con la tabla del Apéndice B del documento principal. No lleva código; su valor es
que el test de contrato (paso 4.4) lo lee.

---

## 4. Fase 1 — Código

### 4.1 `src/domain/oneRepMax.ts` (nuevo)

Dueño único. Devuelve `null` cuando no puede estimar — nunca `0`, que es un valor.

```ts
/**
 * Único punto de cálculo de 1RM estimado.
 *
 * Reglas:
 *  - `null` significa "no se puede estimar", no "vale cero".
 *  - Brzycki solo es defendible hasta REP_CAP reps. Fuera de ahí, null.
 *  - Brzycki y Epley coinciden exactamente en 10 reps (36/27 = 40/30). No es
 *    casualidad: es el punto donde ambas expresiones son algebraicamente iguales.
 */

export const REP_CAP = 12

export const estimate1RM = (weightKg: number, reps: number): number | null => {
  if (!Number.isFinite(weightKg) || !Number.isFinite(reps)) return null
  if (weightKg <= 0 || reps <= 0) return null
  if (reps === 1) return round1(weightKg)
  if (reps > REP_CAP) return null
  return round1(weightKg * (36 / (37 - reps)))
}

export const estimateEpley = (weightKg: number, reps: number): number | null => {
  if (weightKg <= 0 || reps <= 0) return null
  if (reps === 1) return round1(weightKg)
  return round1(weightKg * (1 + reps / 30))
}

const round1 = (v: number) => Math.round(v * 10) / 10
```

**Test (`tests/unit/domain/oneRepMax.test.ts`):**

```ts
import { describe, it, expect } from 'vitest'
import { estimate1RM, estimateEpley, REP_CAP } from '../../../src/domain/oneRepMax'

describe('estimate1RM', () => {
  it.each([
    [1,   100, 100.0],
    [5,   100, 112.5],
    [10,  100, 133.3],
    [12,  100, 144.0],
  ])('%i reps con 100 kg → %f', (reps, weight, expected) => {
    expect(estimate1RM(weight, reps)).toBe(expected)
  })

  it('devuelve null por encima del cap', () => {
    expect(estimate1RM(100, REP_CAP + 1)).toBeNull()
  })

  it('devuelve null con reps o peso no positivos', () => {
    expect(estimate1RM(0, 5)).toBeNull()
    expect(estimate1RM(100, 0)).toBeNull()
    expect(estimate1RM(100, -1)).toBeNull()
  })

  it('nunca devuelve Infinity', () => {
    for (let r = 2; r <= 60; r++) {
      expect(Number.isFinite(estimate1RM(100, r) ?? 0)).toBe(true)
    }
  })
})

describe('paridad Brzycki / Epley', () => {
  it('coinciden exactamente en 10 reps', () => {
    expect(estimate1RM(100, 10)).toBe(estimateEpley(100, 10))
  })

  it('divergen en 20 reps, pero Brzycki ya es null', () => {
    expect(estimate1RM(100, 20)).toBeNull()
    expect(estimateEpley(100, 20)).toBe(166.7)
  })
})
```

### 4.2 `src/domain/prs.ts` (modificar)

Cambios: importa del módulo único, filtra warm-ups y reps inválidas en **las dos** funciones,
y la clave del registro pasa a ser `[exerciseId, reps]`.

```ts
import type { WorkoutSet, PRRecord } from './types'
import { estimate1RM, REP_CAP } from './oneRepMax'

/** Targets de reps que se registran como récord. Decisión Q2. */
export const PR_TARGETS = [1, 3, 5, 8, 10, 12] as const

const isRecordCandidate = (s: WorkoutSet): boolean =>
  s.completed &&
  !s.isWarmup &&
  s.weightKg > 0 &&
  s.reps > 0 &&
  s.reps <= REP_CAP &&
  (PR_TARGETS as readonly number[]).includes(s.reps)

/**
 * PRs nuevos de una sesión.
 * `existingPRs` se indexa por `${exerciseId}:${reps}`.
 */
export const detectPRsFromSets = (
  sets: WorkoutSet[],
  existingPRs: Map<string, PRRecord>
): PRRecord[] => {
  const best = new Map<string, PRRecord>()

  for (const set of sets) {
    if (!isRecordCandidate(set)) continue
    const key = `${set.exerciseId}:${set.reps}`
    const current = best.get(key)
    if (!current || set.weightKg > current.weightKg) {
      best.set(key, {
        exerciseId: set.exerciseId,
        reps: set.reps,
        weightKg: set.weightKg,
        date: set.createdAt,
      })
    }
  }

  const out: PRRecord[] = []
  for (const [key, record] of best) {
    const existing = existingPRs.get(key)
    if (!existing || record.weightKg > existing.weightKg) out.push(record)
  }
  return out
}

/** Mejor récord que queda tras borrar una sesión. `null` si no queda ninguno. */
export const bestPRFromSets = (sets: WorkoutSet[]): PRRecord | null => {
  let best: PRRecord | null = null
  for (const set of sets) {
    if (!isRecordCandidate(set)) continue
    if (!best || set.weightKg > best.weightKg) {
      best = {
        exerciseId: set.exerciseId,
        reps: set.reps,
        weightKg: set.weightKg,
        date: set.createdAt,
      }
    }
  }
  return best
}
```

**Cambio de contrato que rompe llamadores.** `detectPRsFromSets` ahora espera
`Map<string, PRRecord>` y `bestPRFromSets` ya no recibe `existingPRs`. Hay que revisar cada
call site: `saveWorkoutSession`, `deleteWorkout`, `importBackup`, y el badge de la UI de serie.

**Búsqueda de call sites:**

```bash
rg "detectPRsFromSets|bestPRFromSets|isPR\(" src --type ts
```

### 4.3 `src/domain/benchmark.ts` (modificar)

```diff
-export const estimate1RM = (weightKg: number, reps: number): number => {
-  if (reps <= 0 || weightKg <= 0) return 0
-  if (reps === 1) return weightKg
-  return weightKg * (36 / (37 - reps))
-}
+export { estimate1RM } from './oneRepMax'
```

El módulo deja de tener su propia fórmula. Si algún consumidor esperaba `number` y no
`number | null`, TypeScript lo va a marcar — eso es exactamente lo que se quiere.

### 4.4 `src/domain/calculators/oneRepMax.ts` (modificar)

Es la calculadora de presentación. Mantiene la comparación Epley/Brzycki, pero delega:

```ts
import { estimateEpley, estimate1RM } from '../oneRepMax'

export const calculateOneRepMax = (weightKg: number, reps: number) => ({
  epley: estimateEpley(weightKg, reps),
  brzycki: estimate1RM(weightKg, reps),
  note: reps === 10
    ? 'A 10 repeticiones ambas fórmulas coinciden exactamente'
    : null,
})
```

La nota es el dato que faltaba: la calculadora muestre dos números distintos y el usuario no
sabe que a 10 reps valen lo mismo.

### 4.5 `src/domain/metricRows.ts` (nuevo)

Resuelve H4. Tres selectores con nombre; ningún `filter(isWarmup)` suelto en el resto del
código.

```ts
import type { WorkoutSet } from './types'

/** Solo series de trabajo completadas. Base de récords, progresión y estancamiento. */
export const workSetsOnly = (sets: WorkoutSet[]): WorkoutSet[] =>
  sets.filter((s) => s.completed && !s.isWarmup)

/** Todas las series completadas, incluidos calentamientos. Para volumen y RPE. */
export const allCompletedSets = (sets: WorkoutSet[]): WorkoutSet[] =>
  sets.filter((s) => s.completed)

/** Series que aportan volumen. Hoy coincide con `allCompletedSets`; separado a propósito. */
export const volumeSets = (sets: WorkoutSet[]): WorkoutSet[] =>
  allCompletedSets(sets)
```

**Migración de consumidores** — según el contrato del Apéndice B:

| Consumidor | Selector |
|---|---|
| `prs.ts` | `workSetsOnly` |
| `e1rm.ts` (`buildE1rmSeries`) | `workSetsOnly` |
| `setStats.ts` | `workSetsOnly` |
| `workingProgression.ts` | `workSetsOnly` |
| `loadRecommendation.ts` | `workSetsOnly` |
| `sessionComparison.ts` | `workSetsOnly` |
| `volume.ts` / `trainingStats.ts` | `volumeSets` |
| `deload.ts` (`recentAvgRpe`) | `allCompletedSets` |

**Criterio:** `rg "isWarmup" src/` solo debe devolver `metricRows.ts`, `types.ts` y la UI que
dibuja el badge de la serie.

### 4.6 `src/data/repositories/dexie/db.ts` — `version(16)`

```ts
this.version(16).stores({
  // sin cambios de índice en las tablas existentes
  prs: '[exerciseId+reps], exerciseId, uid',   // ← nueva clave compuesta
  exerciseAlias: 'from, to',                    // ← tabla nueva, vacía
  workouts: '++id, &uid, localDate, startedAt, deletedAt',
  workoutSets: '++id, &uid, workoutId, exerciseId, createdAt',
  bodyWeight: '++id, &uid, localDate, deletedAt',
}).upgrade(async (tx) => {
  // 1) columnas nuevas en filas existentes
  for (const table of ['workouts', 'workoutSets', 'bodyWeight']) {
    await tx.table(table).toCollection().modify((row) => {
      row.uid ??= crypto.randomUUID()
      row.updatedAt ??= row.createdAt ?? new Date().toISOString()
      row.deletedAt ??= null
    })
  }

  // 2) reconstruir récords con la nueva definición
  await tx.table('prs').clear()
  const sets = await tx.table('workoutSets').toArray()
  const best = new Map<string, PRRecord>()

  for (const s of sets) {
    if (!s.completed || s.isWarmup || s.weightKg <= 0) continue
    if (s.reps <= 0 || s.reps > 12) continue
    if (!PR_TARGETS.includes(s.reps)) continue
    const key = `${s.exerciseId}:${s.reps}`
    const cur = best.get(key)
    if (!cur || s.weightKg > cur.weightKg) {
      best.set(key, {
        exerciseId: s.exerciseId,
        reps: s.reps,
        weightKg: s.weightKg,
        date: s.createdAt,
        uid: crypto.randomUUID(),
      })
    }
  }
  await tx.table('prs').bulkAdd([...best.values()])
})
```

**Dos trampas de Dexie en este bloque.**

1. `stores()` **no reemplaza** el schema completo: las tablas no mencionadas se heredan de la
   versión anterior. Solo hay que listar las que cambian.
2. El índice único `&uid` se crea **antes** de que `.upgrade()` rellene los valores. Los
   `undefined` no se indexan, así que no debería fallar — pero si falla por duplicados, la
   salida es crear el índice **sin `&`** en `v16` y promoverlo a único en `v17`, después de
   que todos los `uid` existan.

**Advertencia.** `crypto.randomUUID()` requiere contexto seguro en web (`https:` o
`localhost`) y está disponible en WebView de Capacitor. Si el build web se sirve por `http:`
en LAN, falla. Alternativa sin dependencias:

```ts
const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
```

Es UUIDv4 no criptográfico. Para un identificador de fila alcanza; para un token, no.

### 4.7 `src/domain/e1rm.ts` — promedio por sesión (H9)

```ts
/**
 * Mejor e1RM por sesión, y promedio de sesiones (no de series).
 * Una sesión con 10 series no debe pesar 10 veces más que una con 2.
 */
export const avgE1rmPerSession = (
  sets: WorkoutSet[],
  workouts: Workout[]
): number | null => {
  const byWorkout = new Map<number, number>()
  for (const s of workSetsOnly(sets)) {
    const e = estimate1RM(s.weightKg, s.reps)
    if (e === null) continue
    byWorkout.set(s.workoutId, Math.max(byWorkout.get(s.workoutId) ?? 0, e))
  }
  if (byWorkout.size === 0) return null
  const sum = [...byWorkout.values()].reduce((a, b) => a + b, 0)
  return round1(sum / byWorkout.size)
}
```

**Test:** 1 sesión de `100 kg × 1` y 10 sesiones de `70 kg × 1`.

- Por serie (comportamiento actual): `(100 + 700) / 11 = 72.7`
- Por sesión (correcto): `(100 + 700) / 11 = 72.7` — **mismo número por casualidad.**

Cuidado: este test no discrimina. Usar series múltiples en la sesión pesada:

- Sesión A: 10 series de 100 kg × 1 → mejor 100
- Sesión B: 1 serie de 70 kg × 1 → mejor 70
- Por serie: `(1000 + 70) / 11 = 97.3`
- Por sesión: `(100 + 70) / 2 = 85.0`

Ese es el test.

### 4.8 `src/domain/exerciseIdentity.ts` (nuevo)

```ts
const MAX_HOPS = 8

/**
 * Resuelve un id de ejercicio contra la tabla de alias.
 * Append-only: `from` nunca se reutiliza, así que un ciclo solo puede venir de
 * una carga manual incorrecta. El tope evita colgar el arranque.
 */
export const canonicalId = (
  id: number,
  aliases: ReadonlyMap<number, number>
): number => {
  let cur = id
  for (let hops = 0; aliases.has(cur) && hops < MAX_HOPS; hops++) {
    cur = aliases.get(cur)!
  }
  return cur
}

export const buildAliasMap = (
  rows: ReadonlyArray<{ from: number; to: number }>
): Map<number, number> => new Map(rows.map((r) => [r.from, r.to]))
```

**Test:**

```ts
it('resuelve una cadena de alias', () => {
  const m = new Map([[12, 34], [34, 56]])
  expect(canonicalId(12, m)).toBe(56)
})
it('no cuelga con un ciclo', () => {
  const m = new Map([[12, 34], [34, 12]])
  expect(() => canonicalId(12, m)).not.toThrow()
})
it('devuelve el mismo id si no hay alias', () => {
  expect(canonicalId(7, new Map())).toBe(7)
})
```

**Aplicación:** en los dos loaders de repositorio, al entrar. No en las queries.

---

## 5. Fase 2 — Código

### 5.1 `src/domain/muscleFatigue.ts` (H7)

```diff
-export const lastTrainedByMuscle = (
-  workouts: Workout[],
-  sets: WorkoutSet[],
-  musclesByExercise: ReadonlyMap<number, MuscleGroup>
-): Partial<Record<MuscleGroup, string>> => {
-  const workoutDate = new Map(workouts.map((w) => [w.id, localDateOf(w)]))
+export const lastTrainedByMuscle = (
+  workouts: Workout[],
+  sets: WorkoutSet[],
+  musclesByExercise: ReadonlyMap<number, MuscleGroup>
+): Partial<Record<MuscleGroup, Date>> => {
+  const workoutEnd = new Map(
+    workouts.map((w) => [
+      w.id,
+      new Date(w.finishedAt ?? w.startedAt),   // ← instante, no fecha
+    ])
+  )
```

Y el cálculo de horas:

```ts
export const hoursSince = (at: Date, now = new Date()): number =>
  Math.max(0, (now.getTime() - at.getTime()) / 3_600_000)
```

**Fallback para registros viejos sin `finishedAt`:** usar mediodía local de `localDate`.
Documentarlo; no inventar una hora.

**Test:**

```ts
const now = new Date('2026-10-21T09:00:00')
const w = { startedAt: '2026-10-20T18:00:00', finishedAt: '2026-10-20T20:00:00' }
expect(hoursSince(new Date(w.finishedAt), now)).toBeCloseTo(13, 1)
```

### 5.2 `src/domain/streak.ts` (H6) ⚠️

```ts
/**
 * Mínimo de sesiones para que una semana cuente.
 * Se adapta al plan: una rutina de 2 días no puede exigir 3 sesiones.
 */
export const weeklyTargetFor = (
  plan: { daysPerWeek?: number } | undefined,
  fallback = 3
): number => Math.min(fallback, plan?.daysPerWeek ?? fallback)
```

**Confirmar antes:** la firma real de `streak.ts` y si el plan activo está accesible desde ahí.
Si no lo está, el parámetro entra por el llamador.

### 5.3 `src/domain/goalProjection.ts` (H8) ⚠️

```ts
export type Projection =
  | { kind: 'projected'; weeks: number; date: string; ratePerWeek: number }
  | { kind: 'stalled'; reason: 'no-progress' }
  | { kind: 'regression'; ratePerWeek: number }
  | { kind: 'insufficient-data' }

export const project = (current: number, target: number, ratePerWeek: number): Projection => {
  if (!Number.isFinite(ratePerWeek)) return { kind: 'insufficient-data' }
  if (ratePerWeek <= 0) return { kind: 'regression', ratePerWeek }
  if (current >= target) return { kind: 'projected', weeks: 0, date: todayIso(), ratePerWeek }
  const gap = target - current
  if (gap / ratePerWeek < 0.5) return { kind: 'stalled', reason: 'no-progress' }
  const weeks = Math.ceil(gap / ratePerWeek)
  return { kind: 'projected', weeks, date: addWeeks(todayIso(), weeks), ratePerWeek }
}
```

**Cambio de comportamiento:** ya no existe el piso `Math.max(rate, 0.1)`. Si no hay evidencia
de progreso, la app lo dice.

### 5.4 `src/domain/deload.ts` (D5) ⚠️

```ts
/**
 * Agrupa señales por fenómeno: dos síntomas de la misma causa no deben sumar.
 * Antes: caída de volumen (30) + caída de reps (25) = 55 por un solo problema.
 */
const performanceSignal = (volumeDrop: boolean, repsDrop: boolean): number =>
  volumeDrop && repsDrop ? 30 : volumeDrop ? 30 : repsDrop ? 25 : 0

export const calcDeloadScore = (s: DeloadInputs): number => {
  const performance = performanceSignal(s.volumeDrop15Pct, s.repsDrop)
  const effort = s.avgRpe8 ? 25 : 0
  const duration = s.weeksStreak > 8 ? 10 : 0
  const program = s.isDeloadWeek ? 10 : 0
  return Math.min(100, performance + effort + duration + program)
}
```

---

## 6. Fase 3 — Código

### 6.1 `src/data/backup.ts` (H10)

```diff
 export const importBackup = async (backup: BackupFile): Promise<number> => {
   let imported = 0
   await db.transaction('rw', ALL_TABLES, async (tx) => {
     for (const name of ALL_TABLES) {
       const rows = backup.tables[name] ?? []
-      if (rows.length === 0) continue
+      // Tabla ausente = backup viejo que no conocía esta tabla → no tocar.
+      // Tabla presente y vacía = el usuario no tenía datos → borrar.
+      if (!Object.prototype.hasOwnProperty.call(backup.tables, name)) continue
       await db.table(name).clear()
-      await db.table(name).bulkAdd(rows as never[])
+      if (rows.length > 0) await db.table(name).bulkAdd(rows as never[])
       imported += rows.length
     }
```

Y en `parseBackup`:

```ts
if (backup.app !== 'GymLab') return null
if (!backup.tables || typeof backup.tables !== 'object') return null
if (typeof backup.version !== 'number') return null
if (backup.version > DB_VERSION) {
  logger.warn('backup', 'backup de una versión futura', { version: backup.version })
  return null
}
```

**Test:**

```ts
it('un backup con bodyWeight vacío borra los pesos actuales', async () => {
  await db.bodyWeight.bulkAdd([{ localDate: '2026-01-01', weightKg: 80 }])
  await importBackup({ app: 'GymLab', version: DB_VERSION, tables: { bodyWeight: [] } })
  expect(await db.bodyWeight.count()).toBe(0)
})

it('una tabla ausente no se toca', async () => {
  await db.bodyWeight.bulkAdd([{ localDate: '2026-01-01', weightKg: 80 }])
  await importBackup({ app: 'GymLab', version: DB_VERSION, tables: {} })
  expect(await db.bodyWeight.count()).toBe(1)
})
```

### 6.2 `src/domain/calculators/plates.ts` (DP + `missingKg`)

El cambio de modelo: el inventario pasa de lista a mapa de pares, y el resultado dice cuánto
falta.

```ts
export interface PlateResult {
  barKg: number
  perSide: number[]
  totalLoaded: number
  exact: boolean
  missingKg: number      // NUEVO: lo que falta por lado
}

/** Inventario por defecto: tamaño → pares disponibles. */
export const DEFAULT_INVENTORY: Record<number, number> = {
  25: 6, 20: 6, 15: 6, 10: 6, 5: 6, 2.5: 6, 1.25: 6,
}

const Q = 4   // cuartos de kg: granularidad 0,25
```

**Algoritmo (knapsack acotado con reconstrucción):**

```
perSideQ = round((min(target, MAX) - barKg) / 2 * Q)
sizes = claves del inventario, descendente
dp[i][s] = mínimo de discos usando los primeros i tamaños para sumar s cuartos
dp[0][0] = 0, resto ∞

for i in 1..n:
  sizeQ = sizes[i-1] * Q ; pairs = inventory[sizes[i-1]]
  for s in 0..perSideQ:
    for k in 0..pairs:
      if s - k*sizeQ >= 0:
        dp[i][s] = min(dp[i][s], dp[i-1][s - k*sizeQ] + k)
        tomar[i][s] = k

s* = mayor s <= perSideQ con dp[n][s] < ∞
missing = (perSideQ - s*) / Q
reconstruir hacia atrás con tomar[][]
```

**Complejidad:** `O(nSizes × perSideQ × maxPairs)`. Peor caso realista (7 tamaños, 6 pares,
400 kg por lado = 1600 cuartos): ~67.000 operaciones. Se puede memoizar por inventario.

**Por qué no greedy:** caso donde falla con inventario finito.

| Inventario | Objetivo por lado | Greedy | DP |
|---|---|---|---|
| `{25:1, 20:1, 15:2}` | 30 kg | `25` → falta 5 | `15 + 15` → exacto |

**Test:**

```ts
it('greedy falla, DP acierta', () => {
  const r = platesForWeight(80, 20, { 25: 1, 20: 1, 15: 2 })
  expect(r.perSide.sort((a, b) => a - b)).toEqual([15, 15])
  expect(r.exact).toBe(true)
})

it('reporta lo que falta', () => {
  const r = platesForWeight(101, 20, { 25: 1, 15: 1, 1.25: 1 })
  expect(r.exact).toBe(false)
  expect(r.missingKg).toBe(0.5)
})

it('nunca supera el objetivo', () => {
  for (const kg of [20, 60, 100, 101, 180, 300]) {
    expect(platesForWeight(kg, 20).totalLoaded).toBeLessThanOrEqual(kg)
  }
})
```

### 6.3 `src/domain/weeklyVolume.ts` (H11) ⚠️

`weeklyVolume` es canónico (rellena ceros, marca `isCurrent`). `trainingStats` reexporta:

```ts
// src/domain/trainingStats.ts
export { buildWeeklyVolumeSeries } from './weeklyVolume'
```

**Test:** ambas rutas devuelven el mismo array para el mismo input.

### 6.4 Grasa: una sola clasificación (H12) ⚠️

`navy.ts` y `bodyComposition.ts` devuelven **solo el porcentaje**. La etiqueta sale de una
tabla única:

```ts
// src/domain/calculators/bodyComposition.ts
export const classifyBodyFat = (pct: number, sex: 'male' | 'female') => {
  const t = sex === 'male'
    ? [{ max: 6, label: 'esencial' }, { max: 14, label: 'atlético' },
       { max: 18, label: 'fitness' }, { max: 25, label: 'promedio' },
       { max: Infinity, label: 'elevado' }]
    : [{ max: 14, label: 'esencial' }, { max: 21, label: 'atlético' },
       { max: 25, label: 'fitness' }, { max: 32, label: 'promedio' },
       { max: Infinity, label: 'elevado' }]
  return t.find((x) => pct < x.max)!.label
}
```

**Test:** 17,5 % hombre → `fitness` por ambas calculadoras.

### 6.5 `totalVolume` fuera de `Workout` (4.8)

```diff
 export interface Workout {
   id: number
   startedAt: string
   finishedAt: string | null
   routineId: number | null
   routineDayId: number | null
   localDate: string
   notes: string
-  // Volumen total (kg × reps) de las series completadas, precalculado para evitar
-  // recomputarlo en la UI.
-  totalVolume: number
 }
```

```ts
// src/domain/volume.ts
export const calcTotalVolume = (sets: WorkoutSet[]): number =>
  volumeSets(sets).reduce((sum, s) => sum + s.weightKg * s.reps, 0)
```

**Búsqueda de consumidores:**

```bash
rg "totalVolume" src --type ts
```

Cada uno pasa a `calcTotalVolume(setsDelWorkout())`. Si el repositorio ya carga las series de
la sesión, el cálculo es directo.

**Test de regresión:** una sesión histórica con warm-ups cambia de volumen cuando cambia el
contrato. Con `totalVolume` guardado, **no cambia** — ese es el test que prueba el bug.

---

## 7. Fase 4 — Barreras

### 7.1 `oxlint` — fronteras de importación

```jsonc
// .oxlintrc.json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "paths": [
        { "name": "dexie", "message": "Solo src/data/repositories puede usar Dexie." },
        { "name": "react", "message": "src/domain debe ser puro." }
      ],
      "patterns": [
        { "group": ["**/data/**"], "message": "El dominio no importa la capa de datos." },
        { "group": ["**/repositories/dexie/db"], "message": "Usa la fachada de repositorios." }
      ]
    }]
  },
  "overrides": [
    { "files": ["src/data/**"], "rules": { "no-restricted-imports": "off" } },
    { "files": ["src/hooks/**", "src/pages/**", "src/components/**"], "rules": { "no-restricted-imports": ["error", { "patterns": [{ "group": ["**/repositories/dexie/db"] }] }] } }
  ]
}
```

**Confirmar la sintaxis exacta** contra la versión instalada de `oxlint`; el formato de
`overrides` cambió entre versiones.

### 7.2 Anti-fórmulas inline

```bash
# en CI, como paso de shell
if rg -n "36 / \(37|37 - reps|1 \+ reps / 30" src --glob '!src/domain/oneRepMax.ts'; then
  echo "Fórmula de 1RM fuera de oneRepMax.ts"; exit 1
fi
```

Tosco, pero atrapa H3 y es una línea.

### 7.3 CI

```yaml
# .github/workflows/ci.yml (o el equivalente)
- run: npm ci
- run: npm run lint
- run: npm run build      # typecheck real: tsc -b
- run: npm test
```

**Recordatorio del repo:** `npx tsc --noEmit` no verifica nada con el `tsconfig.json` raíz.

### 7.4 `tests/contract/metrics.test.ts`

Lee el contrato y lo ejecuta. Una fila por métrica:

```ts
const CONTRACT = [
  { metric: 'totalVolume', fn: calcTotalVolume, includesWarmups: true,  expected: 2160 },
  { metric: 'workVolume',  fn: calcWorkVolume,  includesWarmups: false, expected: 1360 },
  { metric: 'prs',         fn: detectAllPRs,    includesWarmups: false,
    expected: { '1': 100, '3': 80, '5': 60, '12': 60 } },
] as const
```

Los valores esperados salen de la sección 9. Cualquier cambio de fórmula rompe el test y
obliga a actualizar el contrato en el mismo commit.

---

## 8. Fase 5 — Producto

Sin detalle de código: depende de decisiones de diseño que no están tomadas.

| # | Qué | Dónde |
|---|---|---|
| 5.1 | `why` en sugerencias | `sessionSuggestions.ts` + copy i18n |
| 5.2 | Rango de incertidumbre en e1RM | componente de gráfico |
| 5.3 | Benchmarks femeninos | `strengthStandards.ts` |
| 5.4 | `missingKg` en la UI de discos | vista de calculadora |
| 5.5 | Inventario real de discos | `profile` o settings |
| 5.6 | Sync | cuando exista backend |

---

## 9. Tabla de verificación numérica

Valores calculados a mano sobre las fórmulas. Sirven como oráculo independiente: si el código
devuelve otra cosa, hay que decidir cuál está mal.

### 9.1 e1RM por serie del fixture

| Serie | Peso × Reps | Brzycki | Epley | Récord (Q2) |
|---|---|---|---|---|
| 1 (warm-up) | 40 × 20 | 84,7 | 66,7 | **ninguno** |
| 2 | 60 × 5 | 67,5 | 70,0 | **5RM = 60** |
| 3 | 80 × 3 | 84,7 | 88,0 | **3RM = 80** |
| 4 | 60 × 12 | 86,4 | 84,0 | **12RM = 60** |
| 5 | 40 × 0 | null | null | **ninguno** |
| 6 | 100 × 1 | 100,0 | 100,0 | **1RM = 100** |

**El empate 84,7 entre las series 1 y 3 es intencional.** Es el borde de H1: el código actual
elige la primera por usar `>` y no `>=`.

### 9.2 Volumen del fixture

| Serie | Aporte |
|---|---|
| 1 (warm-up 40×20) | 800 |
| 2 (60×5) | 300 |
| 3 (80×3) | 240 |
| 4 (60×12) | 720 |
| 5 (40×0) | 0 |
| 6 (100×1) | 100 |

- **Con warm-ups:** 2.160
- **Sin warm-ups:** 1.360

Esa diferencia es exactamente lo que `totalVolume` guardado impide corregir en el historial.

### 9.3 Fórmulas de 1RM con `w = 100 kg`, `r = 10`

| Fórmula | Valor |
|---|---|
| Epley | 133,3 |
| Brzycki | 133,3 |
| Lombardi | 125,9 |
| O'Conner | 125,0 |
| Mayhew | 130,9 |
| Wathan | 134,7 |
| Lander | 134,1 |

Rango: **125,0 – 134,7**. Casi 10 kg de dispersión con el mismo set.

### 9.4 Cruce Brzycki/Epley

| Reps | Brzycki | Epley | Δ |
|---|---|---|---|
| 5 | 1,125 | 1,167 | −3,6 % |
| **10** | **1,333** | **1,333** | **0 %** |
| 12 | 1,440 | 1,400 | +2,9 % |
| 20 | 2,118 | 1,667 | +27 % |
| 36 | 36,0 | 2,200 | +1.536 % |

### 9.5 Discos

Barra 20 kg, inventario por defecto.

| Objetivo | Por lado | Discos | Total | `missingKg` |
|---|---|---|---|---|
| 60 | 20 | 20 | 60 | 0 |
| 100 | 40 | 25 + 15 | 100 | 0 |
| 102,5 | 41,25 | 25 + 15 + 1,25 | 102,5 | 0 |
| 101 | 40,5 | 25 + 15 | 100 | 0,5 |
| 180 | 80 | 25 × 2 + 15 × 2 | 180 | 0 |
| 80 (inv. limitado) | 30 | 15 + 15 | 80 | 0 |

La última fila es la que falla con greedy.

### 9.6 Récords del fixture bajo la definición nueva

```json
{ "1": 100, "3": 80, "5": 60, "12": 60 }
```

Cuatro récords, cuatro hechos, cero fórmulas.

---

## 10. Orden de commits

| # | Commit | Contenido | Verificación |
|---|---|---|---|
| 1 | `test: add reference fixture and characterization suite` | Fase 0 completa | `npx vitest run tests/characterization` |
| 2 | `refactor(domain): single source for 1RM estimation` | 4.1–4.4 | `npx vitest run tests/unit/domain/oneRepMax.test.ts` |
| 3 | `feat(prs)!: define PR as best weight per rep target` | 4.2 + 4.6 | migración probada contra DB real |
| 4 | `refactor(domain): centralize set selection policy` | 4.5 | `rg isWarmup src/` |
| 5 | `fix(stats): average e1RM per session, not per set` | 4.7 | test 1000+70 |
| 6 | `feat(domain): exercise alias resolution layer` | 4.8 | tests de alias |
| 7 | `fix(fatigue): use workout completion time` | 5.1 | 13 h |
| 8 | `fix(streak): adapt weekly target to active plan` | 5.2 | rutina 2 días |
| 9 | `fix(projection): report regression instead of inventing progress` | 5.3 | tasa negativa |
| 10 | `fix(deload): group colinear signals` | 5.4 | score ≤ 65 |
| 11 | `fix(backup)!: replace tables instead of merging` | 6.1 | tabla vacía borra |
| 12 | `feat(plates): bounded inventory with minimum-plate DP` | 6.2 | caso 15+15 |
| 13 | `fix(stats): single weekly volume implementation` | 6.3 | paridad |
| 14 | `fix(health): single body-fat classification` | 6.4 | 17,5 % |
| 15 | `refactor(workout)!: derive totalVolume instead of storing it` | 6.5 | volumen histórico cambia |
| 16 | `chore(ci): enforce domain import boundaries` | 7.1–7.3 | lint rojo con import prohibido |

`!` = cambio visible para el usuario, requiere entrada en `CHANGELOG.md`.

**Los commits 2 y 3 van juntos en el mismo release.** Separarlos deja la app en un estado
donde la tabla `prs` tiene clave vieja y valores nuevos.

---

## 11. Firmas a confirmar

Antes de escribir nada, verificar estas. Si alguna difiere, el código de este documento se
adapta, no se copia.

```bash
rg -n "export (const|function) (buildWeeklyVolumeSeries|calcWeeklyVolume)" src/domain
rg -n "export (const|function) .*[Ss]treak" src/domain/streak.ts
rg -n "export (const|function) .*[Pp]rojection" src/domain/goalProjection.ts
rg -n "export (const|function) .*[Dd]eload" src/domain/deload.ts
rg -n "export (const|function) .*[Bb]odyFat|classify|threshold" src/domain/calculators/bodyComposition.ts
rg -n "export (const|function) .*" src/domain/calculators/navy.ts
rg -n "strengthStandards|Percentile|getStrengthLevel" src/domain/strengthStandards.ts
rg -n "interface BackupFile" -A 10 src/data/backup.ts
rg -n "PRRecord" src --type ts
```

**En particular:** `PRRecord` cambia de forma. Todo consumidor que lea `estimated1RM` va a
romper con TypeScript, y eso es deseable — pero hay que recorrerlos todos antes de mergear.

```bash
rg -n "estimated1RM" src --type ts
```

---

## 12. Riesgos de implementación

| # | Riesgo | Mitigación |
|---|---|---|
| 1 | `PRRecord` cambia de clave → consumidores rotos en runtime | `rg estimated1RM` antes de mergear; TypeScript obliga |
| 2 | `crypto.randomUUID()` no disponible en http LAN | Fallback UUIDv4 manual (§4.6) |
| 3 | Migración `v16` sobre datos reales | Backup previo + tabla reconstruible + copia real de DB |
| 4 | `totalVolume` eliminado rompe vistas que lo leían | Se resuelve en el mismo commit que el tipo |
| 5 | Tests de caracterización mal escritos fijan el bug equivocado | Correrlos contra el código actual **antes** de corregir nada |
| 6 | `describe.skip` queda en el código tras corregir | Checklist por paso; el commit que corrige borra el `.skip` |
| 7 | El contrato de métricas se desactualiza | `tests/contract/metrics.test.ts` lo ejecuta |
| 8 | El inventario de discos por usuario no existe aún | La firma lo acepta opcional; default = inventario estándar |

### Señal de que algo salió mal

Si después de la Fase 1 el volumen histórico **no cambió**, `totalVolume` sigue guardado y el
paso 6.5 no se hizo. Ese es el síntoma más claro de una corrección a medias.

---

## Cierre

La ruta de ejecución es: commits 1 → 2 → 3. Eso solo ya cierra los tres bugs que hacen que la
app mienta sobre un récord.

Todo lo demás puede esperar, con una excepción: el commit 15 (`totalVolume`). Mientras ese
campo siga existiendo, cualquier corrección futura del cálculo de volumen será parcial — la
nueva fórmula se aplicará solo a las sesiones nuevas, y el historial quedará partido en dos
verdades.
