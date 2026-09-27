# F109 — Medallas unificadas y catálogo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar los 8 logros de pasos en el sistema único de medallas (tier, barra de progreso, persistencia y celebración) y ampliar el catálogo con 12 medallas y 4 retos nuevos, todo con datos que la app ya registra.

**Architecture:** El dominio de logros es declarativo: `ACHIEVEMENTS` (catálogo) + `ACHIEVEMENT_TIERS` (metal) + `ACHIEVEMENT_PROGRESS` (medida→target) + `deriveAchievementStats` (bag de medidas). Los logros de pasos se pliegan a ese sistema con 6 medidas numéricas derivadas de `dailySteps`; las medallas nuevas pliegan medidas de nutrición/cuerpo/entreno/cardio. El motor de retos suma 3 señales (pasos, cardio, volumen por grupo muscular) y 2 tipos nuevos.

**Tech Stack:** React 18 + Vite + TypeScript · Dexie · i18next (es/en con paridad forzada por `EsSchema`) · Vitest (sin jsdom) · Playwright Python (e2e) · Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-09-27-f109-medallas-unificadas-catalogo-design.md`

## Global Constraints

- **Worktree (aislamiento multisesión):** TODO corre con cwd `C:\Users\Yves De Faria\Desktop\ProyectoGymLab\.worktrees\f109\gymlab-app` (dev server, tests, review, commits). Nunca en el checkout principal.
- **Verificación por tarea:** `npm run build` (typecheck REAL vía `tsc -b`; NUNCA `npx tsc --noEmit`) + `npm test` + los e2e indicados. Suite completa antes de cada commit.
- **Review Gentle AI antes de cada commit** (candidato = diff del workspace; orden: implementar → normalizar → verificar → review → commit). Entrada: `gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition` y seguir SOLO el `next_transition` devuelto. **Commit sin push.**
- **Índice:** stagear solo rutas exactas y nombradas; verificar `git diff --cached --name-only`; nunca `git add -A`, `git add .`, `git stash`.
- **Sin dependencias nuevas. Sin cambios de schema Dexie. Sin emulador** (no se toca código nativo, router ni `vite.config.ts`).
- **Paridad i18n es/en forzada por el compilador** (`en` tipado `EsSchema`): toda clave nueva va en ambos idiomas en el mismo paso.
- **Copy:** es-ES con tuteo; `en` natural. Los textos de UI nuevos van en español; identificadores/código en inglés como el scaffold.
- **Un commit por tarea**; no acumular cambios sin commitear.

---

## Task 1 (Commit 1) — Dominio: medidas numéricas de pasos + fix de `pr-10kg`

**Por qué primero:** es un cambio de dominio puro, sin efecto visual (la galería vieja sigue viva). Deja verde toda la suite existente y prepara la unificación.

**Files:**
- Modify: `src/domain/stepAchievements.ts` (agrega `deriveStepStats`; mantiene helpers viejos hasta Task 2)
- Modify: `src/domain/achievementProgress.ts` (reemplaza la derivación de `maxPrDeltaKg`)
- Test: `tests/unit/domain/stepAchievements.test.ts` (bloque nuevo)
- Test: `tests/unit/domain/achievementProgress.test.ts` (reemplaza los casos de `maxPrDeltaKg`)

**Interfaces (produce para Tasks 2-5):**
- `interface StepStats { stepsTotal: number; stepsMaxDay: number; steps10kRun: number; steps7dWindow: number; stepsMonth: number; distanceKm: number }`
- `deriveStepStats(days: DailyStepsEntry[]): StepStats` — desde `@/domain/stepAchievements`
- `maxPrDeltaKg` del bag ahora se deriva de `completedSets` (mismo campo, misma semántica: delta ≥10 kg concede `pr-10kg`)

- [ ] **Step 1: Escribir los tests de `deriveStepStats` (deben fallar)**

Agregar al final de `tests/unit/domain/stepAchievements.test.ts` (respetar imports existentes; sumar `deriveStepStats` al import del módulo y `type DailyStepsEntry` si falta):

```ts
// F109.1: medidas numéricas para el sistema unificado de medallas.
describe('deriveStepStats', () => {
  const day = (localDate: string, steps: number, distanceKm = 0): DailyStepsEntry => ({
    localDate,
    steps,
    distanceKm,
    calories: 0,
    source: 'manual',
    syncedAt: '2026-09-01T00:00:00.000Z',
  })

  it('sin días devuelve todo en 0', () => {
    expect(deriveStepStats([])).toEqual({
      stepsTotal: 0,
      stepsMaxDay: 0,
      steps10kRun: 0,
      steps7dWindow: 0,
      stepsMonth: 0,
      distanceKm: 0,
    })
  })

  it('suma total, máximo diario y distancia', () => {
    const stats = deriveStepStats([day('2026-09-01', 8_000, 6.1), day('2026-09-02', 12_500, 9.4)])
    expect(stats.stepsTotal).toBe(20_500)
    expect(stats.stepsMaxDay).toBe(12_500)
    expect(stats.distanceKm).toBeCloseTo(15.5)
  })

  it('steps10kRun mide la racha más larga de días ≥10k (un día flojo la corta)', () => {
    const stats = deriveStepStats([
      day('2026-09-01', 10_200),
      day('2026-09-02', 11_000),
      day('2026-09-03', 9_400), // corta la serie
      day('2026-09-04', 10_500),
      day('2026-09-05', 12_000),
      day('2026-09-06', 10_100),
    ])
    expect(stats.steps10kRun).toBe(3)
  })

  it('steps7dWindow toma la mejor ventana de 7 días calendario', () => {
    const stats = deriveStepStats([
      day('2026-09-01', 30_000),
      day('2026-09-04', 25_000),
      day('2026-09-20', 60_000),
    ])
    expect(stats.steps7dWindow).toBe(60_000)
  })

  it('stepsMonth toma el mejor mes calendario', () => {
    const stats = deriveStepStats([
      day('2026-08-30', 20_000),
      day('2026-09-01', 25_000),
      day('2026-09-15', 25_000),
      day('2026-09-28', 25_000),
    ])
    expect(stats.stepsMonth).toBe(75_000)
  })
})
```

Run: `npx vitest run tests/unit/domain/stepAchievements.test.ts`
Expected: FAIL — `deriveStepStats` no existe.

- [ ] **Step 2: Implementar `deriveStepStats` en `src/domain/stepAchievements.ts`**

Agregar (sin tocar áun `STEP_ACHIEVEMENTS` ni los helpers existentes):

```ts
// F109.1: medidas numéricas para el sistema unificado de medallas. Mismas
// semánticas que los checks booleanos de arriba (racha ≥10k, ventana de 7
// días, mes calendario), pero devolviendo el valor para la barra de progreso.
export interface StepStats {
  stepsTotal: number
  stepsMaxDay: number
  steps10kRun: number
  steps7dWindow: number
  stepsMonth: number
  distanceKm: number
}

// Mejor ventana de 7 días calendario (días sin registro suman 0), como
// hasWeeklyTotal pero devolviendo el máximo en vez de un umbral.
const maxWeeklyTotal = (days: DailyStepsEntry[]): number => {
  const stepsByDate = new Map(days.map((e) => [e.localDate, e.steps]))
  let best = 0
  for (const start of stepsByDate.keys()) {
    let total = 0
    for (let i = 0; i < 7; i++) total += stepsByDate.get(addLocalDays(start, i)) ?? 0
    if (total > best) best = total
  }
  return best
}

// Mejor mes calendario (YYYY-MM, suma directa).
const maxMonthlyTotal = (days: DailyStepsEntry[]): number => {
  const byMonth = new Map<string, number>()
  for (const e of days) {
    const month = e.localDate.slice(0, 7)
    byMonth.set(month, (byMonth.get(month) ?? 0) + e.steps)
  }
  return Math.max(0, ...byMonth.values())
}

export const deriveStepStats = (days: DailyStepsEntry[]): StepStats => ({
  stepsTotal: days.reduce((sum, e) => sum + e.steps, 0),
  stepsMaxDay: days.reduce((max, e) => Math.max(max, e.steps), 0),
  steps10kRun: longestConsecutiveRun(days, STREAK_DAILY_GOAL),
  steps7dWindow: maxWeeklyTotal(days),
  stepsMonth: maxMonthlyTotal(days),
  distanceKm: days.reduce((sum, e) => sum + (e.distanceKm || 0), 0),
})
```

(Nota: `addLocalDays` y `diffLocalDays` ya están importados; `longestConsecutiveRun` ya existe. `Math.max(0, ...[])` da `0` con array vacío.)

- [ ] **Step 3: Correr el test nuevo**

Run: `npx vitest run tests/unit/domain/stepAchievements.test.ts`
Expected: PASS.

- [ ] **Step 4: Escribir los tests del nuevo `maxPrDeltaKg` (deben fallar)**

En `tests/unit/domain/achievementProgress.test.ts`: BUSCAR y **borrar los casos existentes que cubren `maxPrDeltaKg` a partir de `prs`** (los que construyen `PRRecord[]` con 2+ filas del mismo ejercicio — esa fuente ya no se usa para el delta) y agregar este bloque (ajustar imports: `deriveAchievementStats`, `WorkoutSet`):

```ts
// F109.1: el delta de PR se deriva del historial real de series (la tabla de
// PRs pisa una fila por ejercicio y nunca podía dar un delta).
describe('maxPrDeltaKg desde completedSets', () => {
  const set = (id: number, exerciseId: number, weightKg: number, createdAt: string, isWarmup = false): WorkoutSet =>
    ({
      id,
      workoutId: 1,
      exerciseId,
      setNumber: 1,
      weightKg,
      reps: 8,
      completed: true,
      createdAt,
      isWarmup,
    }) as WorkoutSet

  const base = {
    workouts: [],
    prs: [],
    exerciseCategories: new Map(),
    guideCount: 0,
    streak: { currentStreak: 0, longestStreak: 0, weekKeys: [] } as never,
    now: new Date('2026-09-27T12:00:00.000Z'),
  }

  it('sin historial el delta es 0', () => {
    expect(deriveAchievementStats({ ...base, completedSets: [] }).maxPrDeltaKg).toBe(0)
  })

  it('primera serie vs. mejor peso posterior por ejercicio', () => {
    const stats = deriveAchievementStats({
      ...base,
      completedSets: [
        set(1, 101, 40, '2026-01-01T10:00:00.000Z'),
        set(2, 101, 55, '2026-06-01T10:00:00.000Z'),
      ],
    })
    expect(stats.maxPrDeltaKg).toBe(15)
  })

  it('excluye warmups y peso 0, y toma el máximo entre ejercicios', () => {
    const stats = deriveAchievementStats({
      ...base,
      completedSets: [
        set(1, 101, 50, '2026-01-01T10:00:00.000Z', true), // warmup: no cuenta
        set(2, 101, 40, '2026-01-02T10:00:00.000Z'),
        set(3, 101, 52, '2026-02-02T10:00:00.000Z'), // delta 12
        set(4, 202, 0, '2026-01-02T10:00:00.000Z'), // peso corporal: fuera
        set(5, 303, 20, '2026-01-02T10:00:00.000Z'),
        set(6, 303, 47, '2026-03-02T10:00:00.000Z'), // delta 27
      ],
    })
    expect(stats.maxPrDeltaKg).toBe(27)
  })
})
```

> ⚠️ Si el `streak` del archivo tiene otro shape, reusar el helper/fixture que ya usan los tests existentes de ese archivo en vez de este `as never` (no inventar uno nuevo).

Run: `npx vitest run tests/unit/domain/achievementProgress.test.ts`
Expected: FAIL — el delta actual sale de `prs` y da 0.

- [ ] **Step 5: Implementar la nueva derivación en `src/domain/achievementProgress.ts`**

Reemplazar el bloque actual de `maxPrDeltaKg` (líneas ~109-128) por:

```ts
  // F109.1: delta de PR desde el historial real de series. Por ejercicio:
  // primera serie registrada (base) vs. mejor peso posterior; warmups y peso 0
  // (lastre/peso corporal) quedan fuera. La tabla `prs` pisa una fila por
  // ejercicio, por eso no sirve como historial.
  let maxPrDeltaKg = 0
  const workingSets = completedSets.filter((s) => !s.isWarmup && (s.weightKg ?? 0) > 0)
  if (workingSets.length >= 2) {
    const setsByExercise = new Map<number, WorkoutSet[]>()
    for (const s of workingSets) {
      const list = setsByExercise.get(s.exerciseId) ?? []
      list.push(s)
      setsByExercise.set(s.exerciseId, list)
    }
    for (const sets of setsByExercise.values()) {
      if (sets.length < 2) continue
      const sorted = [...sets].sort(
        (a, b) => a.createdAt.localeCompare(b.createdAt) || a.setNumber - b.setNumber
      )
      const first = sorted[0]!.weightKg ?? 0
      const peak = sorted.reduce((max, s) => Math.max(max, s.weightKg ?? 0), 0)
      const delta = peak - first
      if (delta > maxPrDeltaKg) maxPrDeltaKg = delta
    }
  }
```

- [ ] **Step 6: Correr los tests de dominio**

Run: `npx vitest run tests/unit/domain/stepAchievements.test.ts tests/unit/domain/achievementProgress.test.ts`
Expected: PASS ambos.

- [ ] **Step 7: Build + suite completa**

Run: `npm run build` → EXIT 0.
Run: `npm test` → verde (la galería vieja de pasos sigue funcionando: los helpers viejos se eliminan en Task 2).

- [ ] **Step 8: Review + commit**

1. Review Gentle AI (candidato = workspace, ANTES de commitear) con la entrada de Global Constraints; seguir SOLO el `next_transition` devuelto.
2. `git add src/domain/stepAchievements.ts src/domain/achievementProgress.ts tests/unit/domain/stepAchievements.test.ts tests/unit/domain/achievementProgress.test.ts`; `git diff --cached --name-only` (solo esas 4 rutas).
3. `git commit -m "feat: medidas numericas de pasos y fix del delta de PR (F109.1)"` (sin push).

---

## Task 2 (Commit 2) — Unificación completa: catálogo, hooks, /logros, /pasos

**Por qué acá:** es el "momento bisagra": los 8 logros entran al catálogo, los hooks alimentan sus medidas y la UI cambia de una vez; para no dejar nada roto a medias, todo entra en este commit junto con la actualización de e2e existentes.

**Files:**
- Modify: `src/domain/achievements.ts` (8 entradas + `STEP_ACHIEVEMENT_IDS` + tiers; `conditionKey` opcional)
- Modify: `src/domain/achievementProgress.ts` (5 MeasureKey + stats + readers + input `stepDays` + 8 entradas de progreso)
- Modify: `src/domain/stepAchievements.ts` (**elimina** `STEP_ACHIEVEMENTS`, `StepAchievementDef`, `getUnlockedStepAchievements`, `getStepAchievementsWithStatus`, `hasWeeklyTotal`, `hasMonthlyTotal`)
- Modify: `src/components/achievements/AchievementMedal.tsx` (ICON_MAP: `CalendarRange`, `Mountain`)
- Modify: `src/pages/AchievementsPage.tsx` (fuera galería + contador dinámico)
- Modify: `src/pages/AchievementsRoute.tsx` (fuera `stepDays`)
- Modify: `src/pages/StepsPage.tsx` (ids persistidos → `StepAchievements`)
- Modify: `src/components/steps/StepAchievements.tsx` (reescritura con `AchievementMedal`)
- Modify: `src/hooks/useAchievements.ts` (live `dailySteps` → `stepDays`)
- Modify: `src/hooks/useAchievementProgress.ts` (ídem)
- Modify: `src/hooks/useStepData.ts` (deja de calcular logros)
- **Delete:** `src/components/achievements/StepAchievementsGallery.tsx`, `src/components/steps/StepAchievementCard.tsx`
- Test: `tests/unit/domain/achievements.test.ts`, `tests/unit/domain/achievementProgress.test.ts`, `tests/unit/domain/stepAchievements.test.ts`
- e2e: `tests/e2e/test_f84b_pasos.py`, `tests/e2e/test_f95.py`

**Interfaces que consume:** `deriveStepStats`, `StepStats` (Task 1).
**Interfaces que produce:** `STEP_ACHIEVEMENT_IDS: readonly string[]` desde `@/domain/achievements`; medidas `stepsTotal|stepsMaxDay|steps10kRun|steps7dWindow|stepsMonth` en el bag; `deriveAchievementStats` acepta `stepDays?: DailyStepsEntry[]`.
**Orden interno sugerido (evita rojos intermedios):** dominio → hooks → UI → borrados → e2e → verificación. Al final del task, TODO verde.

- [ ] **Step 1: Dominio — catálogo, tiers y progreso**

`src/domain/achievements.ts`:
1. `conditionKey?: string` (pasa a opcional).
2. Al final de `ACHIEVEMENTS`, agregar los 8 (reutilizan i18n existente; sin `conditionKey`):

```ts
  // Logros de pasos (F109.1): unificados al sistema de medallas — mismos
  // tier, progreso, persistencia y celebración que el resto.
  { id: 'primeros-pasos', titleKey: 'steps.achievements.primerosPasos.name', descriptionKey: 'steps.achievements.primerosPasos.desc', icon: 'Footprints' },
  { id: 'diez-mil-dia', titleKey: 'steps.achievements.diezMilDia.name', descriptionKey: 'steps.achievements.diezMilDia.desc', icon: 'Target' },
  { id: 'racha-7-dias', titleKey: 'steps.achievements.racha7Dias.name', descriptionKey: 'steps.achievements.racha7Dias.desc', icon: 'Flame' },
  { id: 'racha-30-dias', titleKey: 'steps.achievements.racha30Dias.name', descriptionKey: 'steps.achievements.racha30Dias.desc', icon: 'Crown' },
  { id: 'cincuenta-mil-semana', titleKey: 'steps.achievements.cincuentaMilSemana.name', descriptionKey: 'steps.achievements.cincuentaMilSemana.desc', icon: 'TrendingUp' },
  { id: 'doscientos-mil-mes', titleKey: 'steps.achievements.doscientosMilMes.name', descriptionKey: 'steps.achievements.doscientosMilMes.desc', icon: 'CalendarRange' },
  { id: 'millon-total', titleKey: 'steps.achievements.millonTotal.name', descriptionKey: 'steps.achievements.millonTotal.desc', icon: 'Medal' },
  { id: 'maraton', titleKey: 'steps.achievements.maraton.name', descriptionKey: 'steps.achievements.maraton.desc', icon: 'Mountain' },
]

// Ids de pasos (F109.1): la UI que agrupa por origen los usa desde acá.
export const STEP_ACHIEVEMENT_IDS = [
  'primeros-pasos',
  'diez-mil-dia',
  'racha-7-dias',
  'racha-30-dias',
  'cincuenta-mil-semana',
  'doscientos-mil-mes',
  'millon-total',
  'maraton',
] as const
```

3. `ACHIEVEMENT_TIERS` suma: `primeros-pasos`/`diez-mil-dia` → `bronze`; `racha-7-dias`/`cincuenta-mil-semana` → `silver`; `racha-30-dias`/`doscientos-mil-mes`/`maraton` → `gold`; `millon-total` → `platinum`.
4. Sin entradas en `achievementCollectibles.ts` (permanentes).

`src/domain/achievementProgress.ts`:
- `MeasureKey` suma: `'stepsTotal' | 'stepsMaxDay' | 'steps10kRun' | 'steps7dWindow' | 'stepsMonth'`.
- `AchievementStats` suma esos 5 campos (number).
- `ACHIEVEMENT_PROGRESS` suma (al final, junto a las de su familia):

```ts
  'primeros-pasos': { measure: 'stepsTotal', target: 1 },
  'diez-mil-dia': { measure: 'stepsMaxDay', target: 10_000 },
  'racha-7-dias': { measure: 'steps10kRun', target: 7 },
  'racha-30-dias': { measure: 'steps10kRun', target: 30 },
  'cincuenta-mil-semana': { measure: 'steps7dWindow', target: 50_000 },
  'doscientos-mil-mes': { measure: 'stepsMonth', target: 200_000 },
  'millon-total': { measure: 'stepsTotal', target: 1_000_000 },
  'maraton': { measure: 'stepsMaxDay', target: 42_000 },
```

- Input de `deriveAchievementStats` suma `stepDays?: DailyStepsEntry[]`; al inicio: `const stepStats = stepDays && stepDays.length > 0 ? deriveStepStats(stepDays) : null` (importar `deriveStepStats` desde `./stepAchievements`); en el return: los 5 campos con `stepStats?.campo ?? 0`.
- `MEASURE_READER` suma: `stepsTotal: (s) => s.stepsTotal`, etc.

- [ ] **Step 2: Dominio — borrar el sistema viejo de pasos**

En `src/domain/stepAchievements.ts` eliminar `StepAchievementDef`, `STEP_ACHIEVEMENTS`, `getUnlockedStepAchievements`, `getStepAchievementsWithStatus`, `hasWeeklyTotal`, `hasMonthlyTotal` y las constantes que queden sin uso (`STREAK_7`, `STREAK_30`, `WEEKLY_50K`, `MONTHLY_200K`, `TOTAL_1M`, `MARATHON_STEPS`). Quedan: `STREAK_DAILY_GOAL`, `longestConsecutiveRun`, `maxWeeklyTotal`, `maxMonthlyTotal`, `StepStats`, `deriveStepStats`. Actualizar el comentario de cabecera del archivo (ahora es "medidas" de pasos, no definiciones de logros).

- [ ] **Step 3: Dominio — tests del catálogo y progreso**

`tests/unit/domain/achievements.test.ts`: donde se afirme el tamaño/completitud del catálogo, actualizar a 24 y verificar que los 8 ids de `STEP_ACHIEVEMENT_IDS` tienen tier (el test existente "tiers completos por catálogo" ya lo cubre si itera `ACHIEVEMENTS`; si hardcodea 16, cambiar a `ACHIEVEMENTS.length`).
`tests/unit/domain/achievementProgress.test.ts`: agregar casos: `diez-mil-dia` completa con `stepsMaxDay: 10_000` (y no con 9_999); `racha-7-dias` clampa current a 7; `primeros-pasos` con `stepsTotal: 0` no completa y con 1 sí; `maraton` target 42_000. Pasar `stepDays` al input de derive (o stats directos a `achievementProgress(id, stats)` — preferir eso, ya que la derivación de pasos ya está testeada aparte).
`tests/unit/domain/stepAchievements.test.ts`: quitar los bloques que testean `STEP_ACHIEVEMENTS`/`getStepAchievementsWithStatus` (si existen); conservar los de `deriveStepStats`.

Run: `npx vitest run tests/unit/domain/achievements.test.ts tests/unit/domain/achievementProgress.test.ts tests/unit/domain/stepAchievements.test.ts`
Expected: PASS.

- [ ] **Step 4: Hooks — alimentar `stepDays`**

`src/hooks/useAchievements.ts` y `src/hooks/useAchievementProgress.ts`: leer ambos archivos completos primero. En cada uno:
- Sumar la lista viva de pasos siguiendo EXACTAMENTE el patrón de las live queries existentes (mismo estilo de hook/subscribe): `stepRepo.getAll()` desde `@/data/repositories` (buscar cómo importan los repos en el archivo; mismo camino).
- Pasar `stepDays` al `deriveAchievementStats(...)` de cada hook.
- Si el archivo mantiene una "firma"/signature de primitivas para el debounce, incluir un valor estable de pasos (p. ej. `${days.length}:${days[days.length - 1]?.steps ?? 0}`) para que los cambios disparen re-evaluación.

- [ ] **Step 5: UI — /logros unificado**

`src/pages/AchievementsRoute.tsx`: quitar la lectura de `stepDays` (L23 aprox.) y su paso por props; quitar imports del repo de pasos si quedan sin uso; actualizar el comentario obsoleto de "15 barras" (L24).

`src/pages/AchievementsPage.tsx` (leer el archivo completo antes):
- Quitar el import y el render de `StepAchievementsGallery` (L107) y la prop `stepDays` del type.
- Contador de cabecera (L42-49): usar `unlockedIds.length` y `ACHIEVEMENTS.length` (importar `ACHIEVEMENTS` desde `@/domain/achievements`). Actualizar comentarios obsoletos ("15 barras", "16").
- El resto no cambia: las 24 medallas se pintan con las secciones y `AchievementCard` existentes (las de pasos aparecen desbloqueadas/pendientes como cualquiera).

- [ ] **Step 6: UI — /pasos y medallón**

`src/components/achievements/AchievementMedal.tsx`: agregar al `ICON_MAP` `CalendarRange` y `Mountain` (mismo patrón de las entradas existentes).

`src/pages/StepsPage.tsx`: leer `unlockedAchievements` de `meta` con el MISMO patrón que usa `AchievementsRoute.tsx` (L14-21) y pasar `unlockedIds` a `<StepAchievements ... />` (L106 aprox.).

`src/components/steps/StepAchievements.tsx` — reescritura completa (ajustar nombres de clases/estilos a los del archivo actual; conservar el empty state con su clave i18n existente):

```tsx
// Logros de pasos en /pasos (F109.1): medallones del sistema unificado; se
// muestran solo los conseguidos, igual que antes.
import { useTranslation } from 'react-i18next'
import { ACHIEVEMENTS, STEP_ACHIEVEMENT_IDS } from '@/domain/achievements'
import { AchievementMedal } from '@/components/achievements/AchievementMedal'

type StepAchievementsProps = {
  unlockedIds: string[]
}

export const StepAchievements = ({ unlockedIds }: StepAchievementsProps) => {
  const { t } = useTranslation()
  const medals = ACHIEVEMENTS.filter(
    (a) => (STEP_ACHIEVEMENT_IDS as readonly string[]).includes(a.id) && unlockedIds.includes(a.id)
  )
  if (medals.length === 0) return <p className="text-sm text-muted">{t('steps.achievementsEmpty')}</p>
  return (
    <ul className="flex flex-wrap gap-3">
      {medals.map((a) => (
        <li key={a.id}>
          <AchievementMedal achievement={a} unlocked count={0} size="sm" />
        </li>
      ))}
    </ul>
  )
}
```

> `achievementsEmpty`: usar la clave i18n que ya usaba el componente viejo para el estado vacío (buscarla en `src/i18n/locales/es/features.ts` sección `steps.achievements*`); no crear claves nuevas si ya existe.

`src/hooks/useStepData.ts`: quitar el import y el campo `achievements` (queda el resto: entries, stats de pasos); ajustar consumidores si alguno usaba `achievements` (StepsPage); `getUnlockedStepAchievements` ya no existe (Task 2 Step 2).

`git rm src/components/achievements/StepAchievementsGallery.tsx src/components/steps/StepAchievementCard.tsx`

- [ ] **Step 7: e2e existentes**

`tests/e2e/test_f84b_pasos.py`: la sección de logros de /pasos ya no son `<li>` de badge con texto plano — ahora son medallones `[data-achievement]` (selector que emite `AchievementMedal`). Adaptar SOLO las aserciones de esa sección (L123-128 aprox.) a la nueva marca; el resto del test no cambia.
`tests/e2e/test_f95.py`: cualquier aserción de contador de /logros pasa a dinámico (24); las barras siguen por `data-progress` (las de pasos ahora existen: no romper las existentes).

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f84b_pasos.py` y `python tests/e2e/scripts/with_server.py tests/e2e/test_f95.py`
Expected: ALL OK.

- [ ] **Step 8: Build + suite + regresión de chapas**

Run: `npm run build` → EXIT 0.
Run: `npm test` → verde.
Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f93_16_chapas.py` → ALL OK (las chapas del perfil ahora pueden incluir medallas de pasos desbloqueadas por seeds; si el test rompe por eso, es señal de un seed con historial de pasos: evaluar en el mismo paso).

- [ ] **Step 9: Review + commit**

1. Review Gentle AI (candidato = workspace, ANTES de commitear); solo el `next_transition` devuelto.
2. `git add` de TODAS las rutas tocadas (listarlas explícitas, incluidos los `git rm` ya stageados); `git diff --cached --name-only`.
3. `git commit -m "feat: logros de pasos unificados como medallas (F109.1)"` (sin push).

---

## Task 3 (Commit 3) — 12 medallas nuevas (nutrición, cuerpo, entreno, cardio, pasos)

**Files:**
- Modify: `src/domain/achievements.ts` (12 entradas + tiers)
- Modify: `src/domain/achievementProgress.ts` (10 MeasureKey + stats + readers + 12 progresos + input de familias)
- Modify: `src/domain/nutrition.ts` (`deriveMealStats`)
- Modify: `src/domain/stepAchievements.ts` (StepStats suma `distanceKm` — ya está en Task 2? NO: `distanceKm` ya se agregó en Task 1; acá solo se usa)
- Modify: `src/hooks/useAchievements.ts`, `src/hooks/useAchievementProgress.ts` (live: meals, bodyWeights, photos)
- i18n: `src/i18n/locales/es/core.ts`, `src/i18n/locales/en/core.ts` (`achievements.items.*`)
- Test: `tests/unit/domain/achievementProgress.test.ts`, `tests/unit/domain/achievements.test.ts`

**Interfaces que consume:** bag de Task 2; helpers existentes (`workoutDurationMin` de `@/domain/workouts`, `MealEntry`/`BodyWeightEntry`/`ProgressPhotoEntry` de `@/domain/types`).
**Interfaces que produce:** medidas `mealsRegisteredCount|consecutiveMealDays|maxDailyProteinG|mealDaysDistinct|bodyWeightCount|progressPhotoCount|longestDailyWorkoutRun|longestSessionMin|cardioTotalSeconds|stepsDistanceKm`; `deriveMealStats(meals: MealEntry[]): { mealsRegisteredCount: number; consecutiveMealDays: number; maxDailyProteinG: number; mealDaysDistinct: number }` desde `@/domain/nutrition`.

- [ ] **Step 1: Tests de las medidas nuevas (deben fallar)**

En `tests/unit/domain/achievementProgress.test.ts`, agregar un describe por familia con datos mínimos. Ejemplos representativos (repetir el patrón para cada medida):

```ts
describe('medidas de familias nuevas (F109.2)', () => {
  it('mealsRegisteredCount / mealDaysDistinct / consecutiveMealDays', () => {
    const meals = [
      { localDate: '2026-09-01', items: [{ proteinG: 40 }] },
      { localDate: '2026-09-02', items: [{ proteinG: 60 }] },
      { localDate: '2026-09-03', items: [{ proteinG: 20 }] },
      { localDate: '2026-09-03', items: [{ proteinG: 30 }] },
      { localDate: '2026-09-10', items: [{ proteinG: 50 }] },
    ] as MealEntry[]
    const stats = deriveMealStats(meals)
    expect(stats.mealsRegisteredCount).toBe(5)
    expect(stats.mealDaysDistinct).toBe(4) // 01, 02, 03, 10
    expect(stats.consecutiveMealDays).toBe(3) // 01→02→03
    expect(stats.maxDailyProteinG).toBe(50) // 03 suma 50
  })

  it('bodyWeightCount y progressPhotoCount son longitudes', () => {
    // verificar vía deriveAchievementStats: bodyWeights.length / photos.length
  })

  it('longestDailyWorkoutRun y longestSessionMin', () => {
    // 3 sesiones en días consecutivos + una de 95 min (finishedAt-startedAt)
  })

  it('cardioTotalSeconds suma duraciones de series cardio', () => {
    // 2 series con durationSeconds 600 y 1800 → 2400
  })
})
```

Completar cada caso con datos reales (no dejar comentarios): construir los arrays mínimos con los tipos del repo (usar `as` solo si el literal parcial lo exige y con los campos que la derivación realmente lee).

Run: `npx vitest run tests/unit/domain/achievementProgress.test.ts`
Expected: FAIL — medidas no existen.

- [ ] **Step 2: Implementar `deriveMealStats` en `src/domain/nutrition.ts`**

```ts
// F109.2: medidas de nutrición para las medallas (dominio puro).
export interface MealStats {
  mealsRegisteredCount: number
  consecutiveMealDays: number
  maxDailyProteinG: number
  mealDaysDistinct: number
}

export const deriveMealStats = (meals: MealEntry[]): MealStats => {
  const days = [...new Set(meals.map((m) => m.localDate))].sort()
  let bestRun = 0
  let run = 0
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && diffLocalDays(days[i - 1]!, days[i]!) === 1 ? run + 1 : 1
    if (run > bestRun) bestRun = run
  }
  const proteinByDay = new Map<string, number>()
  for (const meal of meals) {
    const total = meal.items.reduce((sum, item) => sum + (item.proteinG || 0), 0)
    proteinByDay.set(meal.localDate, (proteinByDay.get(meal.localDate) ?? 0) + total)
  }
  return {
    mealsRegisteredCount: meals.length,
    consecutiveMealDays: bestRun,
    maxDailyProteinG: Math.max(0, ...proteinByDay.values()),
    mealDaysDistinct: days.length,
  }
}
```

(Verificar el import de `diffLocalDays` desde `./dates` y que `MealEntry.items[].proteinG` sea el campo real — el inventario lo confirmó.)

- [ ] **Step 3: Bag + catálogo + i18n + bars**

`src/domain/achievementProgress.ts`:
- `MeasureKey` suma las 10; `AchievementStats` suma las 10; `MEASURE_READER` suma las 10.
- Input de derive suma `meals?`, `bodyWeights?`, `photos?` (usa `deriveMealStats`; los conteos son `.length`; `longestDailyWorkoutRun` con un helper local igual al patrón de `longestConsistentWeekRun` pero con `localDateOf`; `longestSessionMin` = max de `workoutDurationMin(w)` sobre sesiones con `finishedAt`; `cardioTotalSeconds` = suma de `durationSeconds` de las series que ya cuentan como cardio en `cardioSetCount`; `stepsDistanceKm` = `stepStats?.distanceKm ?? 0`).
- `ACHIEVEMENT_PROGRESS` suma las 12 (familia, en este orden):

| id | medida → target |
|---|---|
| `nutricion-primera` | `mealsRegisteredCount` → 1 |
| `nutricion-semana` | `consecutiveMealDays` → 7 |
| `nutricion-proteina` | `maxDailyProteinG` → 150 |
| `nutricion-30-dias` | `mealDaysDistinct` → 30 |
| `cuerpo-primer-peso` | `bodyWeightCount` → 1 |
| `cuerpo-30-pesos` | `bodyWeightCount` → 30 |
| `cuerpo-10-fotos` | `progressPhotoCount` → 10 |
| `entreno-5-dias` | `longestDailyWorkoutRun` → 5 |
| `entreno-90min` | `longestSessionMin` → 90 |
| `entreno-12-semanas` | `longestConsistentWeekRun` → 12 |
| `cardio-60min` | `cardioTotalSeconds` → 3600 |
| `pasos-50km` | `stepsDistanceKm` → 50 |

`src/domain/achievements.ts` — 12 entradas nuevas al final del catálogo con estos datos EXACTOS (title/desc i18n van en el Step 4; verificar que cada ícono exista en `lucide-react` y en `ICON_MAP`, agregándolo si falta):

| id | icon | titleKey (`achievements.items.<x>.title/.desc`) | tier |
|---|---|---|---|
| `nutricion-primera` | `Utensils` | `nutricionPrimera` | bronze |
| `nutricion-semana` | `CalendarDays` | `nutricionSemana` | silver |
| `nutricion-proteina` | `Beef` | `nutricionProteina` | silver |
| `nutricion-30-dias` | `Salad` | `nutricion30Dias` | gold |
| `cuerpo-primer-peso` | `Scale` | `cuerpoPrimerPeso` | bronze |
| `cuerpo-30-pesos` | `CalendarCheck` | `cuerpo30Pesos` | silver |
| `cuerpo-10-fotos` | `Camera` | `cuerpo10Fotos` | gold |
| `entreno-5-dias` | `Flame` | `entreno5Dias` | silver |
| `entreno-90min` | `Timer` | `entreno90Min` | silver |
| `entreno-12-semanas` | `Repeat` | `entreno12Semanas` | gold |
| `cardio-60min` | `HeartPulse` | `cardio60Min` | silver |
| `pasos-50km` | `Route` | `pasos50Km` | silver |

- [ ] **Step 4: i18n es/en (completo, sin placeholders)**

`src/i18n/locales/es/core.ts` — dentro de `achievements.items` (mismo estilo de las existentes `title`/`desc`):

| clave | title | desc |
|---|---|---|
| `nutricionPrimera` | Primer bocado | Registrá tu primera comida en Nutrición. |
| `nutricionSemana` | Semana registrada | Registrá comidas 7 días seguidos. |
| `nutricionProteina` | Día proteico | Sumá 150 g de proteína en un día. |
| `nutricion30Dias` | Nutrición de hierro | Registrá comidas en 30 días distintos. |
| `cuerpoPrimerPeso` | Autoconocimiento | Registrá tu peso por primera vez. |
| `cuerpo30Pesos` | Báscula fiel | Registrá tu peso 30 veces. |
| `cuerpo10Fotos` | Seguimiento visual | Sumá 10 fotos de progreso. |
| `entreno5Dias` | Cinco al hilo | Entrená 5 días seguidos. |
| `entreno90Min` | Sesión maratón | Completá una sesión de 90 minutos o más. |
| `entreno12Semanas` | Trimestre constante | Sumá 12 semanas seguidas con al menos una sesión. |
| `cardio60Min` | Pulmones de acero | Acumulá 60 minutos de cardio. |
| `pasos50Km` | Caminante | Acumulá 50 km caminados. |

`src/i18n/locales/en/core.ts` — mismas claves:

| clave | title | desc |
|---|---|---|
| `nutricionPrimera` | First bite | Log your first meal in Nutrition. |
| `nutricionSemana` | Logged week | Log meals 7 days in a row. |
| `nutricionProteina` | Protein day | Hit 150 g of protein in a single day. |
| `nutricion30Dias` | Iron nutrition | Log meals on 30 different days. |
| `cuerpoPrimerPeso` | Know thyself | Log your weight for the first time. |
| `cuerpo30Pesos` | Steady scale | Record your weight 30 times. |
| `cuerpo10Fotos` | Visual tracking | Add 10 progress photos. |
| `entreno5Dias` | Five in a row | Train 5 days in a row. |
| `entreno90Min` | Marathon session | Complete a session of 90+ minutes. |
| `entreno12Semanas` | Consistent quarter | Keep at least one session per week for 12 straight weeks. |
| `cardio60Min` | Steel lungs | Accumulate 60 minutes of cardio. |
| `pasos50Km` | Walker | Walk 50 km in total. |

(La paridad la verifica `npm run build`.)

- [ ] **Step 5: Hooks — lecturas vivas de familias**

`useAchievements.ts` + `useAchievementProgress.ts`: sumar listas vivas de comidas, peso corporal y fotos siguiendo el mismo patrón que el archivo ya usa (buscar los repos exactos: `mealRepo`, `bodyWeightRepo` y el repo de fotos — `grep -r "progressPhoto" src/data src/hooks` para el nombre real; hay índice `localDate`). Pasar `meals`, `bodyWeights`, `photos` a `deriveAchievementStats`. Sumar al signature/debounce un valor estable por lista (p. ej. `${meals.length}:${bodyWeights.length}:${photos.length}`).

- [ ] **Step 6: Correr tests, build y suite**

Run: `npx vitest run tests/unit/domain/achievementProgress.test.ts tests/unit/domain/achievements.test.ts`
Expected: PASS (catálogo: 36).
Run: `npm run build` → EXIT 0.
Run: `npm test` → verde.

- [ ] **Step 7: Review + commit**

1. Review Gentle AI; solo el `next_transition` devuelto.
2. `git add` rutas exactas; `git diff --cached --name-only`.
3. `git commit -m "feat: 12 medallas nuevas de nutricion, cuerpo, entreno, cardio y pasos (F109.2)"` (sin push).

---

## Task 4 (Commit 4) — 4 retos nuevos (pasos, cardio, pierna, días seguidos)

**Files:**
- Modify: `src/domain/challenges.ts` (tipos, stats, defs, `computeChallengeStats`, `countEverCompletedChallenges`)
- Modify: `src/components/challenges/DynamicChallenges.tsx` (iconos por tipo)
- Modify: `src/pages/EntrenarPage.tsx` (inputs nuevos al motor)
- Modify: `src/domain/achievementProgress.ts` (pasa `stepDays`/`exerciseMuscles` a `countEverCompletedChallenges`)
- Modify: `src/hooks/useAchievements.ts` (mapa de grupos musculares live)
- i18n: `src/i18n/locales/es/features.ts`, `src/i18n/locales/en/features.ts` (`challenge.*`)
- Test: `tests/unit/domain/challenges.test.ts`

**Interfaces que consume:** `deriveStepStats`/`stepDays` (Task 2), sets con duración, `MUSCLE_GROUPS` del catálogo (verificar el valor exacto de pierna: `'pierna'`).
**Interfaces que produce:** `ChallengeType` suma `'pasos' | 'cardio'`; `Challenge` suma `muscleGroup?: MuscleGroup` (si el tipo del campo no existe exportado, exportarlo); `ChallengeStats` suma `stepsTotal`, `cardioSeconds`, `muscleVolume: Record<string, number>`, `longestDailyRun`.

- [ ] **Step 1: Tests del motor (deben fallar)**

En `tests/unit/domain/challenges.test.ts`, agregar casos por reto nuevo (usar los fixtures/helpers que el archivo ya tiene para workouts/sets; sumar `stepDays` y un mapa `exerciseMuscles` mínimo). Casos mínimos:
- `pasos-100k` con `stepDays` de 110.000 en la ventana de 7 días → completo; con 90.000 → progreso 0.9.
- `cardio-45` con dos series cardio de 900 s y 1800 s → completo (45 min).
- `vol-pierna-5000` con sets de pierna sumando 5.000 kg en la ventana → completo; el mismo volumen en "pecho" NO lo completa.
- `dias-4` con 4 `localDate` consecutivos con sesión dentro de la ventana → completo.
- `getAvailableChallenges` respeta `minLevel` de los nuevos (definido en Step 2).

Run: `npx vitest run tests/unit/domain/challenges.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implementar motor + defs**

`src/domain/challenges.ts` (leer el archivo completo antes; seguir sus patrones):
1. `ChallengeType` = `'frecuencia' | 'volumen' | 'pr' | 'consistencia' | 'pasos' | 'cardio'`.
2. `Challenge` suma `muscleGroup?: string` y `ChallengeStats` suma los 4 campos nuevos.
3. `computeChallengeStats` suma al input `stepDays?: DailyStepsEntry[]` y `exerciseMuscles?: ReadonlyMap<number, string>`; calcula:
   - `stepsTotal`: suma de pasos en el periodo (usar `stepRepo`-libre: los días vienen ya filtrados o filtrar por la regla de periodo existente — seguir EXACTAMENTE el patrón de fechas que usa el archivo para `sessionsCount`).
   - `cardioSeconds`: suma de `durationSeconds` de sets cardio (mismo filtro de cardio que `achievementProgress.ts` — categoría del mapa o `durationSeconds > 0` sin categoría).
   - `muscleVolume`: `peso × reps` de sets de trabajo agrupado por `exerciseMuscles.get(exerciseId)` (puede reusar `calcSetVolume` de `./volume`).
   - `longestDailyRun`: racha máxima de días consecutivos con sesión dentro del periodo (mismo patrón `diffLocalDays` de otros módulos).
   - Con inputs ausentes → valores 0 (los tests viejos siguen pasando).
4. `calculateProgress`: extender el switch por tipo con `pasos`/`cardio` (y `volumen` con `muscleGroup` → usar `muscleVolume[challenge.muscleGroup]`).
5. `countEverCompletedChallenges(workouts, prDates, sets, extra?)` acepta los mismos inputs opcionales y los pasa al motor.
6. Defs nuevas al final del catálogo `CHALLENGES`:

| id | type | duration | target | extra | minLevel |
|---|---|---|---|---|---|
| `pasos-100k` | `pasos` | `1semana` | 100_000 | — | 1 |
| `cardio-45` | `cardio` | `2semanas` | 45 | unit min | 2 |
| `vol-pierna-5000` | `volumen` | `2semanas` | 5_000 | `muscleGroup: 'pierna'` | 3 |
| `dias-4` | `consistencia` | `1semana` | 4 | — | 2 |

(ojo: verificar la unidad exacta que usa el target del motor para cardio — si el motor trabaja en segundos, `cardio-45` debe comparar contra `45 * 60` o usar target 2700 con display en minutos; elegir UNA y ser consistente con `calculateProgress` y el i18n. Recomendado: target en **minutos** y `cardioSeconds/60` en el mapa de stats del tipo.)

- [ ] **Step 3: cablear consumidores**

- `src/pages/EntrenarPage.tsx` (~L116-124): sumar la lectura viva de pasos y el mapa `exerciseId → muscleGroup` (patrón: cómo ya obtiene workouts/sets/ejercicios la página) y pasarlos a `computeChallengeStats`.
- `src/domain/achievementProgress.ts`: `countEverCompletedChallenges(...)` recibe `stepDays` (ya lo tiene) y `exerciseMuscles` (nuevo input opcional del derive, que `useAchievements` construye desde los ejercicios que ya carga — mismo patrón que el mapa de categorías existente).
- `src/hooks/useAchievements.ts`: construir el mapa `exerciseMuscles` y pasarlo.
- `src/components/challenges/DynamicChallenges.tsx` (~L9-14): iconos por tipo — `pasos: Footprints`, `cardio: HeartPulse` (agregar al record existente).

- [ ] **Step 4: i18n es/en**

`challenge.*` en `features.ts` (mismo bloque donde viven `freq-3` etc.; seguir su estructura exacta de `titleKey`/`descriptionKey`/`unitKey`):

| clave | es | en |
|---|---|---|
| `pasos100k` title / desc / unit | 100.000 pasos / Caminá 100.000 pasos en una semana. / pasos | 100,000 steps / Walk 100,000 steps in one week. / steps |
| `cardio45` title / desc / unit | Cardio constante / Sumá 45 minutos de cardio en dos semanas. / min | Steady cardio / Log 45 minutes of cardio in two weeks. / min |
| `volPierna5000` title / desc / unit | Pierna de acero / Levantá 5.000 kg de volumen de pierna en dos semanas. / kg | Steel legs / Lift 5,000 kg of leg volume in two weeks. / kg |
| `dias4` title / desc / unit | Cuatro al hilo / Entrená 4 días seguidos. / días | Four in a row / Train 4 days in a row. / days |

- [ ] **Step 5: Tests + build + suite**

Run: `npx vitest run tests/unit/domain/challenges.test.ts` → PASS.
Run: `npm run build` → EXIT 0. Run: `npm test` → verde (los tests viejos de retos no deben cambiar).

- [ ] **Step 6: Review + commit**

1. Review Gentle AI; solo el `next_transition`.
2. `git add` rutas exactas; `git diff --cached --name-only`.
3. `git commit -m "feat: 4 retos nuevos de pasos, cardio, pierna y dias seguidos (F109.2)"` (sin push).

---

## Task 5 (Commit 5) — e2e de fase + repaso de regresiones

**Files:**
- Create: `tests/e2e/test_f109.py`
- Modify: e2e que queden afectados por contadores/marcado (los detecta el repaso)

- [ ] **Step 1: Crear `tests/e2e/test_f109.py`**

Estructura (reusar helpers de siembra/dismiss de modal EXISTENTES: copiar de `tests/e2e/test_f95.py` el helper de dismiss del modal de logros y el patrón de seeds; la siembra necesita: `onboardingDone`, historial de pasos (p. ej. 10.000+ un día y total ≥50 km), comidas de 3 días, workouts con sets, un PR con delta ≥10 kg, peso y fotos):

Casos:
1. **/logros unificado**: contador `X/36` (aserción por texto del contador con `36`); NO existe el heading "Logros de pasos" como bloque aparte; `[data-achievement="diez-mil-dia"]` presente y en estado desbloqueado (`aria-label` contiene "desbloqueada"); una medalla nueva bloqueada (`nutricion-semana`) presente con su barra (`[data-progress="nutricion-semana"]`).
2. **/pasos**: los medallones de pasos desbloqueados aparecen (`[data-achievement="diez-mil-dia"]`).
3. **Home**: los 4 retos nuevos aparecen en Disponibles (o Activos según minLevel/seed) por título ("100.000 pasos", "Pierna de acero"…).
4. **Cola del modal (retro)**: tras el seed con historial, al menos un logro se celebra (modal visible, se dismissea con el helper existente) — sin colgar el test si el orden varía.

- [ ] **Step 2: Repaso de contadores/marcado en e2e**

Run: `grep -n "16\|/8\|logros" tests/e2e/*.py` (solo para ubicar); ajustar lo que quede apuntando a los denominadores viejos.

- [ ] **Step 3: Correr la fase + regresiones**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f109.py` → ALL OK.
Run (regresiones): `test_f84b_pasos.py`, `test_f95.py`, `test_f93_16_chapas.py`, `test_t2.py` → ALL OK.

- [ ] **Step 4: Review + commit**

1. Review Gentle AI; solo el `next_transition`.
2. `git add` rutas exactas; `git diff --cached --name-only`.
3. `git commit -m "test: e2e de F109 y actualizacion de regresiones"` (sin push).

---

## Task 6 (Commit 6) — Docs de cierre

**Files:**
- Modify: `PLAN.md` (tildar 109.1 y 109.2; anotar la deuda de guías en las notas de la fase)
- Modify: `CHANGELOG.md` (`[Unreleased]`)

- [ ] **Step 1: PLAN.md**

- `109.1` y `109.2` → `[x]`.
- En las notas de Fase 109, agregar: "Deuda declarada: `guias-completas` sigue inalcanzable hasta instrumentar el marcado de guías leídas (mini-feature futura)."

- [ ] **Step 2: CHANGELOG.md** — bajo `[Unreleased]`:

```markdown
### Added
- F109: 12 medallas nuevas (nutrición, cuerpo, entreno, cardio y pasos) y 4 retos nuevos (pasos, cardio, pierna y días seguidos).

### Changed
- F109: los 8 logros de pasos se unificaron como medallas del sistema principal (tier, barra de progreso, persistencia y celebración); `/logros` es una sola galería de 36 medallas y `/pasos` muestra medallones.

### Fixed
- F109: `pr-10kg` ahora se calcula desde el historial real de series (antes siempre daba 0 por la PK de la tabla de PRs).
```

- [ ] **Step 3: Verificación final + commit**

Run: `npm run build` → EXIT 0. Run: `npm test` → verde.
1. Review Gentle AI; solo el `next_transition`.
2. `git add PLAN.md CHANGELOG.md`; `git diff --cached --name-only`.
3. `git commit -m "docs: cierre de F109 (PLAN + CHANGELOG)"` (sin push).

---

## Después del plan (cierre de fase)

1. `git -C .worktrees/f109 rebase main` (en el worktree) → `git merge --ff-only f109` (desde el principal, con las otras sesiones idle) → `.\scripts\worktree.ps1 close f109`.
2. Engram: hito de fase (commits + verificación) cuando el MCP esté disponible (las otras sesiones lo liberan por turnos).
