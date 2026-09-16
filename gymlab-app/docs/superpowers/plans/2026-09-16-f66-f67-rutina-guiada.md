# F66 + F67 — Rutina guiada por equipamiento — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El onboarding deja de elegir una rutina predefinida y pasa a entregar una rutina real (predefinida que calce con tu equipamiento, o generada contra el catálogo) persistida como rutina propia.

**Architecture:** Dominio puro primero (`resolveRoutinePlan` y `findPredefinedRoutine` reciben el catálogo por parámetro, sin React/Dexie/i18n), después UI. El equipamiento tiene **una sola fuente**: `equipmentStore`. Antes de todo, `Exercise.equipment` pasa de `Equipment` a `Equipment[]` porque un press de banca necesita barra **y** banco y el modelo actual no puede declararlo.

**Tech Stack:** Vite + React 18 + TypeScript, Tailwind v4, Dexie, Zustand, react-i18next, Vitest, Playwright (librería Python).

**Spec:** `docs/superpowers/specs/2026-09-16-f66-f67-rutina-guiada-design.md`

## Global Constraints

Copiadas de la spec y de `gymlab-app/AGENTS.md`. Aplican a **todas** las tareas.

- Dominio puro: nada de React, Dexie ni i18n en `src/domain/`.
- Touch targets ≥ 44×44 px; gap ≥ 8 px; `touch-action: manipulation`.
- Respetar `prefers-reduced-motion`.
- Sin scrollbars visibles; todo scroll por arrastre.
- UI en es-ES; **paridad es/en obligatoria** (`en/index.ts` declara `export const en: EsSchema`, así que una clave faltante rompe el build).
- **Sin dependencias nuevas.**
- Un commit por tarea. **Commit sin push** (el usuario pushea a mano).
- `npm test` verde, `npm run build` limpio (`tsc -b && vite build`) antes de cada commit.
- i18n: `es` es la fuente tipada; `en` es el espejo que debe compilar.

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/domain/types.ts` | `Exercise.equipment` pasa a `Equipment[]` (forma). |
| `src/i18n/catalog/index.ts` | `localizeEquipmentList` — join de etiquetas. |
| `src/data/seed/exercises.ts` + `src/data/seed/exercisesExtra/*.ts` | Los 873 tags de equipamiento (migración + banco). |
| `src/data/seed/exercisesExtra/index.ts` | Punto de entrada del catálogo ampliado. |
| `scripts/tools/genCatalog.cjs` | **Roto hoy** (ruta muerta). Debe leer `exercisesExtra/`. |
| `public/catalog/exercises-vN.json` | Catálogo servido en runtime (se regenera). |
| `src/data/repositories/dexie/db.ts` | `SEED_VERSION` (bump = migración). |
| `src/domain/routineResolution.ts` | **Nuevo.** `requiredEquipmentOf`, `findPredefinedRoutine`, `generateRoutinePlan`, `planRoutine`. |
| `src/domain/onboarding.ts` | `MATERIAL_PRESETS` entra; `MATERIALS` y `suggestRoutine` salen. |
| `src/hooks/useExerciseCatalog.ts` | Las dos comparaciones de equipamiento cambian de semántica. |
| `src/components/onboarding/steps.tsx` + `Onboarding.tsx` | Paso 2 (presets + chips) y resumen con el plan. |
| `src/pages/PlanificadorPage.tsx` | **Nuevo.** Página del planificador. |
| `src/app/router.tsx` | Ruta `rutinas/planificador`. |
| Retirados | `src/components/planner/RoutinePlanner.tsx`, `src/domain/routinePlanner.ts` |

---

### Task 1: `Exercise.equipment` pasa a conjunto (WP0a)

**Files:**
- Modify: `src/domain/types.ts:29`
- Modify: `src/i18n/catalog/index.ts`
- Create: `scripts/tools/migrateEquipmentToArray.cjs`
- Modify: `src/hooks/useExerciseCatalog.ts:44-70`
- Modify: `src/pages/EjercicioDetailPage.tsx` (2 sitios)
- Modify: `src/pages/EjerciciosPage.tsx:69`
- Modify: `src/components/workout/ExercisePicker.tsx:62`
- Test: `tests/unit/domain/filterExercises.test.ts`, `tests/unit/hooks/useExerciseCatalog.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `Exercise.equipment: Equipment[]`; `localizeEquipmentList(equipment: readonly Equipment[], lang: AppLanguage): string`.

- [ ] **Step 1: Escribir los tests que fallan**

En `tests/unit/domain/filterExercises.test.ts`, cambiá el helper `mk` para que arme el array:

```ts
const mk = (id: number, muscleGroup: Exercise['muscleGroup'], zones?: string[], equipment: Equipment[] = ['barra']): Exercise =>
  ({ id, slug: `ex-${id}`, name: `Ejercicio ${id}`, muscleGroup, equipment, instructions: '', muscleZones: zones as Exercise['muscleZones'] })
```

Ajustá las llamadas existentes de `mk(10, 'pecho', undefined, 'barra')` a `mk(10, 'pecho', undefined, ['barra'])`.

Agregá estos dos casos dentro de `describe('filterExercises por equipamiento disponible')`:

```ts
it('un ejercicio que exige DOS equipos no es disponible con solo uno (subconjunto)', () => {
  const banca = mk(20, 'pecho', undefined, ['barra', 'banco'])
  const r = filterExercises([banca], EMPTY_FILTERS, new Set(), ['barra'])
  expect(r).toHaveLength(0)
})

it('el mismo ejercicio sí es disponible con los dos', () => {
  const banca = mk(20, 'pecho', undefined, ['barra', 'banco'])
  const r = filterExercises([banca], EMPTY_FILTERS, new Set(), ['barra', 'banco'])
  expect(r.map((e) => e.id)).toEqual([20])
})
```

- [ ] **Step 2: Correr los tests para verlos fallar**

Run: `npx vitest run tests/unit/domain/filterExercises.test.ts`
Expected: FAIL — TypeScript no compila `['barra']` contra `equipment: Equipment`, y el caso del subconjunto devuelve el ejercicio cuando no debería.

- [ ] **Step 3: Cambiar el tipo**

En `src/domain/types.ts`, reemplazá la línea 29:

```ts
  // Equipamiento que el ejercicio exige. Es un CONJUNTO: un press de banca necesita barra Y banco.
  // Todo ejercicio declara al menos un implemento (no se admite lista vacía).
  equipment: Equipment[]
```

- [ ] **Step 4: Agregar el helper de etiquetas**

En `src/i18n/catalog/index.ts`, al lado de `localizeEquipment`:

```ts
// Une las etiquetas del equipamiento de un ejercicio («Barra, Banco»).
export const localizeEquipmentList = (equipment: readonly Equipment[], lang: AppLanguage): string =>
  equipment.map((e) => localizeEquipment(e, lang)).join(', ')
```

- [ ] **Step 5: Invertir las dos comparaciones**

En `src/hooks/useExerciseCatalog.ts`, dentro de `filterExercises`:

```ts
    const matchSearch =
      !q ||
      ex.name.toLowerCase().includes(q) ||
      ex.equipment.some((e) => e.toLowerCase().includes(q)) ||
      ex.muscleGroup.toLowerCase().includes(q)
    // ... (muscle/zone/category sin cambios)
    // Consulta: al menos uno de los equipos del ejercicio coincide.
    const matchEquipmentQuery = !filters.equipmentQuery || ex.equipment.includes(filters.equipmentQuery)
    // Disponibilidad: SUBCONJUNTO. Con barra y sin banco, ['barra','banco'] NO es disponible.
    const matchEquipment =
      availableEquipment.length === 0 || ex.equipment.every((e) => availableEquipment.includes(e))
```

- [ ] **Step 6: Migrar los datos con un script**

Creá `scripts/tools/migrateEquipmentToArray.cjs`:

```js
// Migración one-off: equipment: 'barra' -> equipment: ['barra'] en los seeds de ejercicios.
// Idempotente: un tag ya migrado (array) no vuelve a matchear.
const fs = require('fs')

const dir = 'src/data/seed/exercisesExtra'
const files = [
  'src/data/seed/exercises.ts',
  ...fs.readdirSync(dir).filter((f) => f.endsWith('.ts')).map((f) => `${dir}/${f}`),
]

let total = 0
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  const out = src.replace(/equipment: '([^']+)'/g, (_m, eq) => {
    total++
    return `equipment: ['${eq}']`
  })
  if (out !== src) fs.writeFileSync(file, out)
}
console.log(`migrated ${total} equipment tags across ${files.length} files`)
```

Run: `node scripts/tools/migrateEquipmentToArray.cjs`
Expected: `migrated 873 equipment tags across 12 files`

- [ ] **Step 7: Arreglar la etiqueta en las 4 superficies**

En `src/pages/EjerciciosPage.tsx:69`, `src/components/workout/ExercisePicker.tsx:62` y los 2 sitios de `src/pages/EjercicioDetailPage.tsx`, reemplazá `localizeEquipment(exercise.equipment, lang)` por `localizeEquipmentList(exercise.equipment, lang)` y agregá `localizeEquipmentList` a los imports (manteniendo `localizeEquipment` solo si se sigue usando en otro lado del archivo).

- [ ] **Step 8: Correr los tests y el typecheck**

Run: `npx vitest run tests/unit/domain/filterExercises.test.ts tests/unit/hooks/useExerciseCatalog.test.ts`
Expected: PASS

Run: `npx tsc --noEmit`
Expected: sin salida.

**Consumidores que la primera pasada encontró y NO estaban en la lista original — verificá que sigan migrados:**
- `src/components/exercise/ExerciseMetaChips.tsx` (recibe `equipment` por prop; es el segundo "sitio" de `EjercicioDetailPage`)
- `tests/unit/domain/exerciseIndex.test.ts`, `tests/unit/domain/trainingStats.test.ts`, `tests/unit/domain/cardioClassification.test.ts` (construyen `Exercise` con `equipment` escalar, y `tsconfig.app.json` incluye `"tests"`)

`tsc --noEmit` es el radar real de consumidores, **no la lista de arriba**. Lo que aparezca ahí, se migra.

- [ ] **Step 9: Arreglar el generador roto**

`scripts/tools/genCatalog.cjs` lee `src/data/seed/exercisesCatalog.ts`, **una ruta que no existe**. Reescribilo para que bundlee el catálogo ampliado real:

```js
// Generador del catálogo de ejercicios: bundlea exercisesExtra/ y lo publica como JSON.
// Node puro sin dependencias; se ejecuta al cambiar el equipamiento, las zonas o las categorías.
const fs = require('fs')

// Lee cada archivo por grupo muscular y extrae su array con balance de corchetes.
const readArray = (file) => {
  const t = fs.readFileSync(file, 'utf8')
  const start = t.indexOf('export const seed')
  const open = t.indexOf('[', t.indexOf('=', start))
  let depth = 0
  for (let i = open; i < t.length; i++) {
    if (t[i] === '[') depth++
    else if (t[i] === ']') {
      depth--
      if (depth === 0) return new Function(`return ${t.slice(open, i + 1)}`)()
    }
  }
  throw new Error(`array no encontrado en ${file}`)
}

const dir = 'src/data/seed/exercisesExtra'
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts')
const parsed = files.flatMap((f) => readArray(`${dir}/${f}`))

if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('catalogo vacio')

fs.mkdirSync('public/catalog', { recursive: true })
fs.writeFileSync(`public/catalog/exercises-${process.env.CATALOG_VERSION || 'v2'}.json`, JSON.stringify(parsed))
console.log(`catalog regenerated: ${parsed.length} exercises`)
```

Verificá contra `src/data/seed/exercisesExtra/index.ts` cómo se re-exporta cada grupo antes de correrlo.

- [ ] **Step 10: Republicar el catálogo y forzar la re-siembra**

**Este paso NO se puede diferir a Task 2.** `public/catalog/exercises-v1.json` sigue con `equipment` escalar y `reseeder.ts` siembra Dexie desde `loadCatalog()`, que hace `fetch` de ese JSON. Sin este paso la app revienta en el navegador con `TypeError: equipment.map is not a function` en cualquier fila del catálogo.

En `src/data/catalogLoader.ts`: `export const CATALOG_VERSION = 'v2'`
En `src/data/repositories/dexie/db.ts:415`: `export const SEED_VERSION = '21'`

Run:
```bash
node scripts/tools/genCatalog.cjs
rm public/catalog/exercises-v1.json
```
Expected: `catalog regenerated: 821 exercises` (el conteo exacto puede variar; **anotalo**).

- [ ] **Step 11: Verificar que la app respira — e2e de F66**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f66_equipamiento.py`
Expected: `ALL OK`.

**Este es el gate que dice si el cambio de modelo quedó bien.** Si falla con `equipment.map is not a function`, el Step 10 no quedó aplicado (JSON viejo, `CATALOG_VERSION` sin bumpear o `SEED_VERSION` sin bumpear). Si falla por conteos, revisá la semántica de subconjunto del Step 5.

- [ ] **Step 12: Suite completa y build**

Run: `npm test && npm run build`
Expected: verde.

- [ ] **Step 13: Ciclo de review (Gentle AI, obligatorio)**

Con el switch encendido, correr **antes** de commitear (el candidato es el diff del workspace):

```bash
gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition
```

Rutear **solo** desde el `next_transition` que devuelva.

- [ ] **Step 14: Commit**

```bash
git add src/domain/types.ts src/i18n/catalog/index.ts scripts/tools/migrateEquipmentToArray.cjs scripts/tools/genCatalog.cjs src/data/catalogLoader.ts src/data/repositories/dexie/db.ts src/hooks/useExerciseCatalog.ts src/pages/EjercicioDetailPage.tsx src/pages/EjerciciosPage.tsx src/components/workout/ExercisePicker.tsx src/components/exercise/ExerciseMetaChips.tsx src/data/seed public/catalog tests/unit
git commit -m "refactor: Exercise.equipment pasa a conjunto (Equipment[]) con subconjunto para disponibilidad, catalogo v2 (F66/F67 WP0a)"
```

---

### Task 2: Pase de `banco` (WP0b)

**Files:**
- Modify: `src/data/seed/exercisesExtra/*.ts` (los slugs de abajo)
- Modify: `src/data/seed/exercises.ts:2` (comentario stale)
- Modify: `scripts/tools/genCatalog.cjs` (**está roto**)
- Modify: `src/data/repositories/dexie/db.ts:415` (`SEED_VERSION`)
- Modify: `src/data/catalogLoader.ts` (`CATALOG_VERSION`)
- Create: `public/catalog/exercises-v2.json`

**Interfaces:**
- Consumes: `Exercise.equipment: Equipment[]` de Task 1.
- Produces: catálogo con `banco` donde corresponde, servido como `v2`.

**Regla de decisión (aplicarla a cada slug):** se agrega `banco` **solo** cuando el ejercicio exige un **banco de entrenamiento** (plano / inclinado / declinado / predicador) como parte del setup. **Cajón, box, step, silla y superficie elevada NO cuentan.**

- [ ] **Step 1: Arreglar el comentario stale**

En `src/data/seed/exercises.ts`, reemplazá la línea 2:

```ts
// El catálogo ampliado vive en ./exercisesExtra/ (un archivo por grupo muscular).
```

- [ ] **Step 2: Agregar `banco` — lista completa**

Agregá `'banco'` al array `equipment` de cada uno de estos slugs (sin quitar el tag existente). Uno por línea para poder auditarlos.

**`pierna.ts` (2):**
```
barbell-seated-calf-raise
dumbbell-seated-one-leg-calf-raise
```

**`hombro.ts` (22):**
```
anti-gravity-press
barbell-incline-shoulder-raise
barbell-shoulder-press
bent-over-dumbbell-rear-delt-raise-with-head-on-bench
bradford-rocky-presses
cable-seated-lateral-raise
dumbbell-incline-shoulder-raise
dumbbell-lying-one-arm-rear-lateral-raise
dumbbell-lying-rear-lateral-raise
external-rotation
front-incline-dumbbell-raise
lying-one-arm-lateral-raise
lying-rear-delt-raise
one-arm-incline-lateral-raise
reverse-flyes
reverse-flyes-with-external-rotation
seated-barbell-military-press
seated-bent-over-rear-delt-raise
seated-dumbbell-press
seated-side-lateral-raise
smith-incline-shoulder-raise
straight-raises-on-incline-bench
```

**`espalda.ts` (5):**
```
bent-arm-barbell-pullover
dumbbell-incline-row
incline-bench-pull
lying-cambered-barbell-row
straight-bar-bench-mid-rows
```

**`abdomen.ts` (10):**
```
barbell-rollout-from-bench
cable-seated-crunch
decline-crunch
decline-oblique-crunch
decline-reverse-crunch
flat-bench-lying-leg-raise
press-sit-up
seated-barbell-twist
seated-flat-bench-leg-pull-in
seated-leg-tucks
```

**`antebrazo.ts` (12):**
```
cable-wrist-curl
dumbbell-lying-pronation
dumbbell-lying-supination
palms-down-dumbbell-wrist-curl-over-a-bench
palms-down-wrist-curl-over-a-bench
palms-up-barbell-wrist-curl-over-a-bench
palms-up-dumbbell-wrist-curl-over-a-bench
seated-dumbbell-palms-down-wrist-curl
seated-dumbbell-palms-up-wrist-curl
seated-one-arm-dumbbell-palms-down-wrist-curl
seated-one-arm-dumbbell-palms-up-wrist-curl
seated-two-arm-palms-up-low-pulley-wrist-curl
```

**`pecho.ts` (24):**
```
around-the-worlds
barbell-guillotine-bench-press
barbell-incline-bench-press-medium-grip
bench-press-with-bands
bent-arm-dumbbell-pullover
chain-press
decline-dumbbell-bench-press
decline-dumbbell-flyes
dumbbell-bench-press
dumbbell-bench-press-with-neutral-grip
flat-bench-cable-flyes
front-raise-and-pullover
hammer-grip-incline-db-bench-press
incline-cable-flye
incline-cable-chest-press
incline-dumbbell-bench-with-palms-facing-in
incline-dumbbell-flyes
incline-dumbbell-flyes-with-a-twist
neck-press
one-arm-flat-bench-dumbbell-flye
one-arm-dumbbell-bench-press
push-ups-with-feet-elevated
wide-grip-barbell-bench-press
wide-grip-decline-barbell-pullover
```

**`triceps.ts` (20):**
```
bench-dips
bench-press-powerlifting
bench-press-with-chains
board-press
close-grip-dumbbell-press
close-grip-ez-bar-press
decline-close-grip-bench-to-skull-crusher
decline-dumbbell-triceps-extension
decline-ez-bar-triceps-extension
incline-barbell-triceps-extension
jm-press
lying-close-grip-barbell-triceps-extension-behind-the-head
lying-close-grip-barbell-triceps-press-to-chin
lying-dumbbell-tricep-extension
lying-triceps-press
reverse-band-bench-press
reverse-triceps-bench-press
seated-bent-over-one-arm-dumbbell-triceps-extension
seated-bent-over-two-arm-dumbbell-triceps-extension
tate-press
```

**`biceps.ts` (17):**
```
alternate-incline-dumbbell-curl
barbell-curls-lying-against-an-incline
dumbbell-prone-incline-curl
flexor-incline-dumbbell-curls
incline-hammer-curls
incline-inner-biceps-curl
lying-high-bench-barbell-curl
lying-supine-dumbbell-curl
one-arm-dumbbell-preacher-curl
preacher-hammer-dumbbell-curl
reverse-barbell-preacher-curls
seated-close-grip-concentration-barbell-curl
seated-dumbbell-curl
seated-dumbbell-inner-biceps-curl
spider-curl
two-arm-dumbbell-preacher-curl
zottman-preacher-curl
```

**`gluteo.ts` (0)** y **`trapecios.ts` (0)** — no llevan ninguno.

Total: **112 slugs**.

- [ ] **Step 3: Verificar la asignación con un test**

Creá `tests/unit/domain/bancoTagging.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { seedExercises } from '@/data/seed/exercises'
import { seedExercisesExtra } from '@/data/seed/exercisesExtra'

// Slugs que exigen un banco de entrenamiento como parte del setup (regla de WP0b).
// Cualquier ejercicio con 'banco' en el slug que NO esté acá es un falso positivo a revisar.
const CON_BANCO = new Set([
  'bench-dips', 'bench-jump', 'bench-press-powerlifting', 'bench-press-with-chains',
  // ... copiar los 112 slugs del Step 3
])

const all = [...seedExercises, ...seedExercisesExtra]

describe('tagging de banco', () => {
  it('todos los ejercicios de la lista declaran banco', () => {
    const missing = all.filter((ex) => CON_BANCO.has(ex.slug) && !ex.equipment.includes('banco'))
    expect(missing.map((e) => e.slug)).toEqual([])
  })

  it('ningún ejercicio declara banco sin estar en la lista', () => {
    const extra = all.filter((ex) => ex.equipment.includes('banco') && !CON_BANCO.has(ex.slug))
    expect(extra.map((e) => e.slug)).toEqual([])
  })

  it('todo ejercicio declara al menos un equipamiento', () => {
    const empty = all.filter((ex) => ex.equipment.length === 0)
    expect(empty.map((e) => e.slug)).toEqual([])
  })
})
```

- [ ] **Step 4: Correr el test**

Run: `npx vitest run tests/unit/domain/bancoTagging.test.ts`
Expected: PASS con los 112 aplicados.

**Revisión obligatoria — estos 3 son frontera y hay que confirmarlos con la regla:**
`barbell-squat-to-a-bench`, `dumbbell-squat-to-a-bench`, `front-barbell-squat-to-a-bench` (una sentadilla a banco se hace a un cajón → **quedan fuera**), `bench-sprint` y `bench-jump` (salto sobre banco → un cajón sustituye → **quedan fuera**). Si el implementador decide incluirlos, agregarlos a la lista y al `Set` del test.

- [ ] **Step 5: Republicar con los `banco` y forzar la re-siembra otra vez**

El generador arreglado, `CATALOG_VERSION = 'v2'` y la primera re-siembra ya quedaron en **Task 1** (no los repitas). Acá solo hay que republicar el **mismo** archivo `v2` con las etiquetas nuevas y forzar que Dexie vuelva a sembrar, porque las filas ya sembradas no tienen los `banco`:

En `src/data/repositories/dexie/db.ts:415`: `export const SEED_VERSION = '22'`

Run:
```bash
node scripts/tools/genCatalog.cjs
```
Expected: `catalog regenerated: 821 exercises` (anotalo).

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: todo verde.

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f66_equipamiento.py`
Expected: `ALL OK`. Si falla por conteos, lo más probable es que la re-siembra no corrió (mirá que `SEED_VERSION` haya quedado en `'22'` y que el JSON se haya regenerado).

- [ ] **Step 7: Ciclo de review (Gentle AI, obligatorio)**

```bash
gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition
```
Rutear **solo** desde el `next_transition`.

- [ ] **Step 8: Commit**

```bash
git add src/data public/catalog tests/unit/domain/bancoTagging.test.ts
git commit -m "data: equipamiento con banco real en 112 ejercicios (F66/F67 WP0b)"
```

---

### Task 3: Derivación y matcher de predefinidas (WP1)

**Files:**
- Create: `src/domain/routineResolution.ts`
- Modify: `src/domain/onboarding.ts` (`MATERIAL_PRESETS` entra, `MATERIALS` sale)
- Test: `tests/unit/domain/routineResolution.test.ts` (nuevo)

**Interfaces:**
- Consumes: `Equipment[]` de Task 1-2.
- Produces:
  - `requiredEquipmentOf(routineId, days, items, exercisesById): Equipment[]`
  - `findPredefinedRoutine(match, routines, requiredByRoutineId): Routine | undefined`
  - `RoutineMatch = { objective, level, daysPerWeek, equipment }`
  - `MATERIAL_BUCKETS`, `MaterialBucket`, `MATERIAL_PRESETS`

- [ ] **Step 1: Escribir los tests que fallan**

Creá `tests/unit/domain/routineResolution.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { findPredefinedRoutine, requiredEquipmentOf } from '@/domain/routineResolution'
import type { Exercise, Routine, RoutineDay, RoutineItem } from '@/domain/types'

const ex = (id: number, equipment: Exercise['equipment']): Exercise =>
  ({ id, slug: `ex-${id}`, name: `E${id}`, muscleGroup: 'pecho', equipment, instructions: '' })

const routine = (id: number, objective: Routine['objective'], level: Routine['level'], daysCount: number): Routine =>
  ({ id, slug: `r-${id}`, title: `R${id}`, objective, level, description: '', daysCount })

const day = (id: number, routineId: number): RoutineDay =>
  ({ id, routineId, dayIndex: 0, name: 'Día 1' })

const item = (id: number, routineDayId: number, exerciseId: number): RoutineItem =>
  ({ id, routineDayId, exerciseId, targetSets: 3, targetReps: 10, restSec: 90, order: 1 })

describe('requiredEquipmentOf', () => {
  it('une el equipamiento de todos los ejercicios de la rutina', () => {
    const days = [day(100, 1)]
    const items = [item(1, 100, 10), item(2, 100, 11)]
    const byId = new Map([[10, ex(10, ['barra', 'banco'])], [11, ex(11, ['mancuernas'])]])
    expect(requiredEquipmentOf(1, days, items, byId).sort()).toEqual(['banco', 'barra', 'mancuernas'])
  })

  it('ignora los días de OTRAS rutinas', () => {
    const days = [day(100, 1), day(200, 2)]
    const items = [item(1, 100, 10), item(2, 200, 11)]
    const byId = new Map([[10, ex(10, ['barra'])], [11, ex(11, ['kettlebell'])]])
    expect(requiredEquipmentOf(1, days, items, byId)).toEqual(['barra'])
  })

  it('una rutina sin items no exige nada', () => {
    expect(requiredEquipmentOf(1, [day(100, 1)], [], new Map())).toEqual([])
  })
})

describe('findPredefinedRoutine', () => {
  const routines = [routine(1, 'volumen', 'intermedio', 4), routine(2, 'volumen', 'avanzado', 4)]
  const req = new Map<number, string[]>([[1, ['barra']], [2, ['barra']]])

  it('matchea objetivo, nivel y equipamiento exactos', () => {
    const r = findPredefinedRoutine(
      { objective: 'volumen', level: 'intermedio', daysPerWeek: 4, equipment: ['barra'] },
      routines, req,
    )
    expect(r?.id).toBe(1)
  })

  it('NO matchea si falta parte del equipamiento (subconjunto)', () => {
    const reqBanca = new Map<number, string[]>([[1, ['barra', 'banco']]])
    const r = findPredefinedRoutine(
      { objective: 'volumen', level: 'intermedio', daysPerWeek: 4, equipment: ['barra'] },
      routines, reqBanca,
    )
    expect(r).toBeUndefined()
  })

  it('NO relaja el nivel', () => {
    const r = findPredefinedRoutine(
      { objective: 'volumen', level: 'principiante', daysPerWeek: 4, equipment: ['barra'] },
      routines, req,
    )
    expect(r).toBeUndefined()
  })

  it('relaja los días: sin 5, ofrece la más cercana', () => {
    const r = findPredefinedRoutine(
      { objective: 'volumen', level: 'intermedio', daysPerWeek: 5, equipment: ['barra'] },
      routines, req,
    )
    expect(r?.id).toBe(1)
  })

  it('equipamiento vacío significa sin filtro', () => {
    const r = findPredefinedRoutine(
      { objective: 'volumen', level: 'avanzado', daysPerWeek: 4, equipment: [] },
      routines, req,
    )
    expect(r?.id).toBe(2)
  })

  it('ignora las rutinas custom', () => {
    const conCustom = [...routines, { ...routine(9, 'volumen', 'intermedio', 4), isCustom: true }]
    const r = findPredefinedRoutine(
      { objective: 'volumen', level: 'intermedio', daysPerWeek: 4, equipment: ['barra'] },
      conCustom, req,
    )
    expect(r?.id).toBe(1)
  })
})
```

Agregá al mismo archivo el test de cobertura que fija el número de la spec:

```ts
import { seedRoutines, seedRoutineDays, seedRoutineItems } from '@/data/seed/routines'
import { seedExercises } from '@/data/seed/exercises'
import { seedExercisesExtra } from '@/data/seed/exercisesExtra'

describe('cobertura del catálogo curado (se mide, no se asume)', () => {
  const byId = new Map([...seedExercises, ...seedExercisesExtra].map((e) => [e.id, e]))
  const reqByRoutine = new Map(
    seedRoutines.map((r) => [r.id, requiredEquipmentOf(r.id, seedRoutineDays, seedRoutineItems, byId)]),
  )
  const OBJETIVOS = ['fuerza', 'volumen', 'resistencia', 'definicion', 'general'] as const
  const NIVELES = ['principiante', 'intermedio', 'avanzado'] as const

  it('mide cuantos de los 75 combos tienen predefinida sin equipo declarado', () => {
    let covered = 0
    for (const objective of OBJETIVOS) {
      for (const level of NIVELES) {
        for (let daysPerWeek = 2; daysPerWeek <= 6; daysPerWeek++) {
          const hit = findPredefinedRoutine({ objective, level, daysPerWeek, equipment: [] }, seedRoutines, reqByRoutine)
          if (hit) covered++
        }
      }
    }
    // Baseline medido 2026-09-16 = 30 de 75. Si este numero BAJA, el catalogo empeoro;
    // si SUBE, se agrego una rutina que cubre un combo nuevo. Actualizalo a mano y anotalo.
    expect(covered).toBe(30)
  })
})
```

- [ ] **Step 2: Correr los tests para verlos fallar**

Run: `npx vitest run tests/unit/domain/routineResolution.test.ts`
Expected: FAIL con "Failed to resolve import '@/domain/routineResolution'".

- [ ] **Step 3: Implementar el dominio**

Creá `src/domain/routineResolution.ts`:

```ts
// Resolución de rutinas: deriva el equipamiento que exige una rutina predefinida y
// elige la que calza. Dominio puro: catálogo y rutinas entran por parámetro.
import type { Equipment, Exercise, Level, Objective, Routine, RoutineDay, RoutineItem } from './types'

export interface RoutineMatch {
  objective: Objective
  level: Level
  daysPerWeek: number
  equipment: readonly Equipment[]
}

// Equipamiento que una rutina exige: unión del equipamiento de sus ejercicios.
export const requiredEquipmentOf = (
  routineId: number,
  days: readonly RoutineDay[],
  items: readonly RoutineItem[],
  exercisesById: ReadonlyMap<number, Exercise>,
): Equipment[] => {
  const dayIds = new Set(days.filter((d) => d.routineId === routineId).map((d) => d.id))
  const required = new Set<Equipment>()
  for (const item of items) {
    if (!dayIds.has(item.routineDayId)) continue
    const exercise = exercisesById.get(item.exerciseId)
    if (!exercise) continue
    for (const eq of exercise.equipment) required.add(eq)
  }
  return [...required]
}

// Requerido ⊆ disponible. Disponible vacío = sin filtro (entra todo).
const fits = (required: readonly Equipment[], available: readonly Equipment[]): boolean =>
  available.length === 0 || required.every((eq) => available.includes(eq))

// Busca la predefinida que calza: objetivo y nivel EXACTOS, equipamiento ⊆ el declarado y,
// si no hay días exactos, la más cercana. Nunca relaja nivel ni equipamiento (spec, decisión 2).
export const findPredefinedRoutine = (
  match: RoutineMatch,
  routines: readonly Routine[],
  requiredByRoutineId: ReadonlyMap<number, readonly Equipment[]>,
): Routine | undefined => {
  const candidates = routines.filter(
    (r) =>
      !r.isCustom &&
      r.objective === match.objective &&
      r.level === match.level &&
      fits(requiredByRoutineId.get(r.id) ?? [], match.equipment),
  )
  if (candidates.length === 0) return undefined
  // Desempate por id: determinista y sin depender del orden del seed.
  return [...candidates].sort((a, b) => {
    const diff = Math.abs(a.daysCount - match.daysPerWeek) - Math.abs(b.daysCount - match.daysPerWeek)
    return diff !== 0 ? diff : a.id - b.id
  })[0]
}
```

- [ ] **Step 4: Reemplazar la whitelist por presets**

En `src/domain/onboarding.ts`, eliminá `MATERIALS` y agregá:

```ts
import { EQUIPMENT_OPTIONS } from './catalog'
import type { Equipment, Level, Objective, Routine, Sex } from './types'

// Cómo se pide el equipamiento en el onboarding: 4 atajos que siembran equipmentStore,
// más los chips de EquipmentFilter para afinar. Una sola verdad: el store.
export const MATERIAL_BUCKETS = ['Gimnasio', 'Mancuernas en casa', 'Solo peso corporal', 'Lo que sea'] as const
export type MaterialBucket = (typeof MATERIAL_BUCKETS)[number]

export const MATERIAL_PRESETS: Record<MaterialBucket, Equipment[]> = {
  Gimnasio: [...EQUIPMENT_OPTIONS],
  'Mancuernas en casa': ['mancuernas', 'banco', 'banda', 'peso corporal'],
  'Solo peso corporal': ['peso corporal'],
  'Lo que sea': [],
}
```

Y eliminá la función `suggestRoutine` completa (queda sin consumidores). Quitá `material` y `suggestRoutine` de los imports de `Routine`/`Routine[]` si quedan sin uso.

- [ ] **Step 5: Correr los tests**

Run: `npx vitest run tests/unit/domain/routineResolution.test.ts`
Expected: PASS (7 + 1 = 8 tests).

- [ ] **Step 6: Commit**

```bash
git add src/domain/routineResolution.ts src/domain/onboarding.ts tests/unit/domain/routineResolution.test.ts
git commit -m "feat: derivacion del equipamiento de rutinas y matcher de predefinidas (F66/F67 WP1)"
```

---

### Task 4: Generador contra el catálogo real (WP2)

**Files:**
- Modify: `src/domain/routineResolution.ts` (agrega el generador y el orquestador)
- Delete: `src/domain/routinePlanner.ts`
- Test: `tests/unit/domain/routineResolution.test.ts` (amplía)

**Interfaces:**
- Consumes: `findPredefinedRoutine`, `requiredEquipmentOf`, `RoutineMatch` de Task 3.
- Produces:
  - `generateRoutinePlan(request, catalog): RoutinePlan`
  - `planRoutine(request, routines, catalog, requiredByRoutineId, routineDays, routineItems): RoutinePlan`
  - `RoutinePlan`, `PlannedDay`, `PlannedItem`, `CoverageReport`, `PlanRequest`

- [ ] **Step 1: Escribir los tests que fallan**

Agregá a `tests/unit/domain/routineResolution.test.ts`:

```ts
import { generateRoutinePlan, planRoutine } from '@/domain/routineResolution'

const catalog: Exercise[] = [
  ex(1, ['barra']), ex(2, ['barra']), ex(3, ['mancuernas']), ex(4, ['peso corporal']),
]
// muscleGroup de ex() es 'pecho'; para cubrir pierna hace falta otro helper:
const exG = (id: number, muscleGroup: Exercise['muscleGroup'], equipment: Exercise['equipment']): Exercise =>
  ({ id, slug: `ex-${id}`, name: `E${id}`, muscleGroup, equipment, instructions: '' })

describe('generateRoutinePlan', () => {
  const full = [
    ...['pecho', 'espalda', 'pierna', 'hombro', 'biceps', 'triceps', 'gluteo', 'abdomen'].flatMap(
      (g, i) => [exG(i * 10 + 1, g as Exercise['muscleGroup'], ['barra']), exG(i * 10 + 2, g as Exercise['muscleGroup'], ['barra'])],
    ),
  ]

  it('es determinista: misma entrada, misma salida', () => {
    const req = { level: 'intermedio', objective: 'volumen', daysPerWeek: 4, equipment: ['barra'] } as const
    expect(generateRoutinePlan(req, full)).toEqual(generateRoutinePlan(req, full))
  })

  it('produce exerciseId reales del catálogo', () => {
    const plan = generateRoutinePlan({ level: 'intermedio', objective: 'volumen', daysPerWeek: 4, equipment: ['barra'] }, full)
    const ids = new Set(full.map((e) => e.id))
    for (const day of plan.days) for (const it of day.items) expect(ids.has(it.exerciseId)).toBe(true)
  })

  it('nunca elige ejercicios de cardio, estiramiento o movilidad', () => {
    const conCardio = [...full, { ...exG(999, 'pierna', ['peso corporal']), category: 'cardio' as const }]
    const plan = generateRoutinePlan({ level: 'principiante', objective: 'general', daysPerWeek: 3, equipment: [] }, conCardio)
    for (const day of plan.days) for (const it of day.items) expect(it.exerciseId).not.toBe(999)
  })

  it('reporta los grupos que no pudo cubrir y cae los dias vacios', () => {
    const soloMancuernas = [exG(1, 'pecho', ['mancuernas'])]
    const plan = generateRoutinePlan({ level: 'principiante', objective: 'volumen', daysPerWeek: 4, equipment: ['mancuernas'] }, soloMancuernas)
    expect(plan.coverage.omittedGroups.length).toBeGreaterThan(0)
    for (const day of plan.days) expect(day.items.length).toBeGreaterThan(0)
  })

  it('equipamiento vacio usa todo el catalogo', () => {
    const plan = generateRoutinePlan({ level: 'principiante', objective: 'volumen', daysPerWeek: 3, equipment: [] }, full)
    expect(plan.days.length).toBeGreaterThan(0)
  })
})

describe('planRoutine', () => {
  it('usa la predefinida cuando calza y no genera', () => {
    const routines = [routine(1, 'volumen', 'intermedio', 4)]
    const req = new Map([[1, ['barra'] as Equipment[]]])
    const plan = planRoutine({ level: 'intermedio', objective: 'volumen', daysPerWeek: 4, equipment: ['barra'] }, routines, [], req)
    expect(plan.source).toBe('predefined')
    expect(plan.basedOnId).toBe(1)
  })

  it('cae al generador cuando ninguna calza, y no deja basedOnId', () => {
    const plan = planRoutine({ level: 'intermedio', objective: 'volumen', daysPerWeek: 4, equipment: ['barra'] }, [], [], new Map())
    expect(plan.source).toBe('generated')
    expect(plan.basedOnId).toBeUndefined()
  })
})
```

- [ ] **Step 2: Correr los tests para verlos fallar**

Run: `npx vitest run tests/unit/domain/routineResolution.test.ts`
Expected: FAIL con "generateRoutinePlan is not a function".

- [ ] **Step 3: Implementar el generador y el orquestador**

Agregá a `src/domain/routineResolution.ts`:

```ts
import { COMMON_EXERCISE_SLUGS } from './catalog'
import type { MuscleGroup } from './types'

export interface PlanRequest {
  level: Level
  objective: Objective
  daysPerWeek: number
  equipment: readonly Equipment[]
}

export interface PlannedItem {
  exerciseId: number
  targetSets: number
  targetReps: number
  restSec: number
}

export interface PlannedDay {
  dayNumber: number
  name: string
  items: PlannedItem[]
}

export interface CoverageReport {
  omittedGroups: MuscleGroup[]
  droppedDays: number[]
}

export interface RoutinePlan {
  source: 'predefined' | 'generated'
  basedOnId?: number
  title: string
  objective: Objective
  level: Level
  daysPerWeek: number
  days: PlannedDay[]
  coverage: CoverageReport
}

// Split por días por semana (heredado del planner anterior).
const SPLIT_BY_DAYS: Record<number, MuscleGroup[][]> = {
  3: [['pecho', 'espalda', 'pierna']],
  4: [['pecho', 'hombro'], ['espalda', 'biceps'], ['pierna', 'gluteo'], ['pierna', 'abdomen']],
  5: [['pecho', 'triceps'], ['espalda', 'biceps'], ['pierna'], ['hombro', 'trapecios'], ['pierna', 'gluteo']],
  6: [['pecho'], ['espalda'], ['pierna'], ['hombro', 'trapecios'], ['biceps', 'triceps'], ['pierna', 'gluteo']],
}

// Volumen semanal óptimo por nivel y objetivo (series semanales por grupo).
const VOLUME_BY_LEVEL: Record<Level, Record<Objective, number>> = {
  principiante: { fuerza: 10, volumen: 10, resistencia: 12, definicion: 10, general: 10 },
  intermedio: { fuerza: 12, volumen: 14, resistencia: 15, definicion: 12, general: 12 },
  avanzado: { fuerza: 14, volumen: 16, resistencia: 18, definicion: 14, general: 14 },
}

const REPS_BY_OBJECTIVE: Record<Objective, number> = { fuerza: 5, volumen: 10, resistencia: 18, definicion: 12, general: 10 }
const REST_BY_OBJECTIVE: Record<Objective, number> = { fuerza: 180, volumen: 90, resistencia: 45, definicion: 60, general: 90 }

// Ranking de selección: primero los de la lista curada, después por slug (determinista y sin i18n).
const COMMON_INDEX = new Map(COMMON_EXERCISE_SLUGS.map((slug, i) => [slug, i]))

// Aísla el ranking para poder afinarlo sin tocar el resto del generador (spec, riesgos).
const rankCandidates = (candidates: readonly Exercise[]): Exercise[] =>
  [...candidates].sort((a, b) => {
    const ia = COMMON_INDEX.get(a.slug) ?? Number.POSITIVE_INFINITY
    const ib = COMMON_INDEX.get(b.slug) ?? Number.POSITIVE_INFINITY
    if (ia !== ib) return ia - ib
    return a.slug.localeCompare(b.slug)
  })

const clamp = (n: number, min: number, max: number): number => Math.min(Math.max(n, min), max)

// Genera un plan contra el catálogo real. Pura y determinista.
export const generateRoutinePlan = (request: PlanRequest, catalog: readonly Exercise[]): RoutinePlan => {
  const days = clamp(Math.round(request.daysPerWeek), 3, 6)
  const split = SPLIT_BY_DAYS[days] ?? SPLIT_BY_DAYS[4]
  const weeklyVolume = VOLUME_BY_LEVEL[request.level][request.objective]
  const omitted = new Set<MuscleGroup>()
  const planned: PlannedDay[] = []

  split.forEach((groups, index) => {
    const items: PlannedItem[] = []
    for (const group of groups) {
      const candidates = catalog.filter(
        (ex) =>
          ex.muscleGroup === group &&
          (ex.category ?? 'strength') === 'strength' &&
          request.equipment.every((eq) => ex.equipment.includes(eq)),
      )
      if (candidates.length === 0) {
        omitted.add(group)
        continue
      }
      const daysTouchingGroup = split.filter((day) => day.includes(group)).length
      const weeksShare = weeklyVolume / daysTouchingGroup
      const howMany = clamp(Math.round(weeksShare / 3.5), 1, 4)
      const sets = Math.max(1, Math.round(weeksShare / howMany))
      for (const exercise of rankCandidates(candidates).slice(0, howMany)) {
        items.push({
          exerciseId: exercise.id,
          targetSets: sets,
          targetReps: REPS_BY_OBJECTIVE[request.objective],
          restSec: REST_BY_OBJECTIVE[request.objective],
        })
      }
    }
    // Un día sin ejercicios cae: reportarlo es más honesto que entregarlo vacío.
    if (items.length > 0) planned.push({ dayNumber: index + 1, name: `Día ${index + 1}`, items })
  })

  return {
    source: 'generated',
    title: `Plan ${request.objective} · ${days} días`,
    objective: request.objective,
    level: request.level,
    daysPerWeek: days,
    days: planned,
    coverage: {
      omittedGroups: [...omitted],
      droppedDays: split.map((_, i) => i + 1).filter((n) => !planned.some((d) => d.dayNumber === n)),
    },
  }
}

// Orquesta: predefinida si calza, generador si no.
// Necesita los días y los ítems porque la predefinida hay que CONVERTIRLA a PlannedDay[].
export const planRoutine = (
  request: PlanRequest,
  routines: readonly Routine[],
  catalog: readonly Exercise[],
  requiredByRoutineId: ReadonlyMap<number, readonly Equipment[]>,
  routineDays: readonly RoutineDay[],
  routineItems: readonly RoutineItem[],
): RoutinePlan => {
  const match = findPredefinedRoutine(request, routines, requiredByRoutineId)
  if (!match) return generateRoutinePlan(request, catalog)

  // Convierte la predefinida respetando dayIndex y el order de cada ítem.
  const days = routineDays
    .filter((day) => day.routineId === match.id)
    .sort((a, b) => a.dayIndex - b.dayIndex)
  const planned: PlannedDay[] = days
    .map((day) => ({
      dayNumber: day.dayIndex + 1,
      name: day.name,
      items: routineItems
        .filter((item) => item.routineDayId === day.id)
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          exerciseId: item.exerciseId,
          targetSets: item.targetSets,
          targetReps: item.targetReps,
          restSec: item.restSec,
        })),
    }))
    .filter((day) => day.items.length > 0)

  return {
    source: 'predefined',
    basedOnId: match.id,
    title: match.title,
    objective: match.objective,
    level: match.level,
    daysPerWeek: request.daysPerWeek,
    days: planned,
    // Si matcheó, por construcción el usuario puede hacerla entera.
    coverage: { omittedGroups: [], droppedDays: [] },
  }
}
```

Actualizá también los tests del Step 1 para pasar `routineDays` y `routineItems` como 5º y 6º argumento (con arrays vacíos en el caso "cae al generador").

- [ ] **Step 4: Retirar el planner viejo**

```bash
git rm src/domain/routinePlanner.ts src/components/planner/RoutinePlanner.tsx
```

`RoutinePlanner.tsx` era el único consumidor de `generateRoutine` y solo lo montaba su propio archivo (sin ruta). Si `npx tsc --noEmit` se queja de algún import restante, ese es un consumidor que hay que limpiar.

- [ ] **Step 5: Correr los tests y el typecheck**

Run: `npx vitest run tests/unit/domain/routineResolution.test.ts && npx tsc --noEmit`
Expected: PASS y sin errores de tipo.

- [ ] **Step 6: Commit**

```bash
git add src/domain/routineResolution.ts tests/unit/domain/routineResolution.test.ts
git commit -m "feat: generador de rutinas contra el catalogo real con reporte de cobertura (F66/F67 WP2)"
```

---

### Task 5: Onboarding (WP3)

**Files:**
- Modify: `src/domain/onboarding.ts` (`material` y `OnboardingAnswers`)
- Modify: `src/components/onboarding/steps.tsx` (paso 2 y resumen)
- Modify: `src/components/onboarding/Onboarding.tsx`
- Modify: `src/store/equipmentStore.ts` (fuente del preset)
- Modify: `src/i18n/locales/es/core.ts`, `src/i18n/locales/en/core.ts`
- Test: `tests/e2e/test_f66_f67_rutina_guiada.py` (nuevo)

**Interfaces:**
- Consumes: `MATERIAL_BUCKETS`, `MATERIAL_PRESETS` (Task 3); `planRoutine`, `RoutinePlan` (Task 4).
- Produces: onboarding que entrega `RoutinePlan` y crea la rutina propia.

- [ ] **Step 1: Escribir el test e2e que falla**

Creá `tests/e2e/test_f66_f67_rutina_guiada.py` siguiendo el patrón de `tests/e2e/test_f66_equipamiento.py` (mismo `with_server`, mismo `parse_count`, misma captura de `console_errors`). El test debe:

1. Arrancar con `localStorage.removeItem('gymlab-equipment')` y sin `onboardingDone` (limpia IndexedDB).
2. Recorrer el onboarding: idioma → objetivo/nivel → semana eligiendo el bucket **«Solo peso corporal»** → perfil → resumen.
3. Aseverar que el resumen muestra los días del plan (al menos un `Día 1`).
4. Tocar «Empezar D1» y aseverar que navega y que el programa activo quedó fijado.
5. **La aserción que importa**: abrir la rutina creada y verificar que **ningún** ejercicio tiene equipamiento fuera de `['peso corporal']`. Leer la lista de equipamiento de cada fila y fallar si aparece «Barra», «Máquina», «Polea», «Mancuernas», «Kettlebell», «Bandas» o «Banco».
6. 0 errores de consola.

- [ ] **Step 2: Correr el test para verlo fallar**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f66_f67_rutina_guiada.py`
Expected: FAIL — hoy el onboarding sugiere una predefinida por objetivo y días, sin mirar el equipamiento.

- [ ] **Step 3: Sacar `material` de `OnboardingAnswers`**

En `src/domain/onboarding.ts`:

```ts
export interface OnboardingAnswers {
  objective: Objective
  daysPerWeek: number
  // `material` sale: el equipamiento vive en equipmentStore (MATERIAL_PRESETS lo siembra).
  level: Level
  language: AppLanguage
  units: 'kg' | 'lb'
  sex: Sex
  birthDate: string
  heightCm: number
  weightKg: number
  sessionDurationMin: number
  cardioPerWeek: number
  guideInterests: string[]
  acceptedTerms: boolean
}
```

- [ ] **Step 4: Paso 2 con presets + chips**

En `src/components/onboarding/steps.tsx`, en `WeekStep`, reemplazá la fila de chips de `MATERIALS` por dos bloques: los 4 buckets en un `HScroll` de `Chip` (al tocar uno, `useEquipmentStore.setState({ selected: MATERIAL_PRESETS[bucket] })` y guardar el bucket elegido en el estado del wizard), y debajo `<EquipmentFilter />` para afinar. `material` sale de `OnboardingState`.

En `src/components/onboarding/Onboarding.tsx`:
- `canNext` del paso 2 deja de exigir `state.material !== null`.
- Sacá `material: safeMaterial` de la construcción de `answers` y la constante `safeMaterial`.
- Reemplazá `const suggested = suggestRoutine(routines, answers)` por el plan:

```ts
  // El plan se arma al entrar al resumen: predefinida si calza, generada si no.
  const plan = useMemo(() => {
    const catalog = exercises
    const requiredByRoutineId = new Map(
      routines.map((r) => [r.id, requiredEquipmentOf(r.id, routineDays, routineItems, byId)]),
    )
    return planRoutine(
      { level: state.level, objective: state.objective ?? 'general', daysPerWeek: state.daysPerWeek ?? 3, equipment },
      routines, catalog, requiredByRoutineId, routineDays, routineItems,
    )
  }, [state.level, state.objective, state.daysPerWeek, equipment, routines, routineDays, routineItems, exercises])
```

Los datos (`exercises`, `routineDays`, `routineItems`, `byId`, `equipment`) tienen que estar disponibles en el componente: agregá los hooks/repos correspondientes (`useExerciseCatalog()`, `routineRepo.getDays`/`getItems` por rutina, `useEquipmentStore((s) => s.selected)`). Si el fan-out a `getDays`/`getItems` de 68 rutinas es caro, calculá el mapa **una sola vez** con `useMemo` sobre `routines` y medilo antes de commitear.

- [ ] **Step 5: `finish(true)` crea la rutina propia**

```ts
    if (withRoutine) {
      // El plan se persiste como rutina PROPIA (isCustom): el usuario la puede editar después.
      const draft: RoutineDraft = {
        slug: uniqueSlug(plan.title, allSlugs),
        title: plan.title,
        objective: plan.objective,
        level: plan.level,
        description: '',
        basedOnId: plan.basedOnId,
        days: plan.days.map((d) => ({
          name: d.name,
          items: d.items.map((it) => ({
            exerciseId: it.exerciseId,
            targetSets: it.targetSets,
            targetReps: it.targetReps,
            restSec: it.restSec,
          })),
        })),
      }
      const routineId = await routineRepo.createRoutine(draft)
      await activeProgramRepo.set({
        routineId,
        startDate: toLocalDateStr(),
        weekdays: weekdaysForDays(answers.daysPerWeek),
        createdAt: new Date().toISOString(),
      })
    }
```

Importá `uniqueSlug` de `@/domain/routines`, `useRoutineSlugs` de `@/hooks/useRoutines` y `RoutineDraft` de `@/data/repositories/types`.

- [ ] **Step 6: Mostrar el plan y la cobertura en el resumen**

En `SummaryStep`, reemplazá la tarjeta de la rutina sugerida por los días del plan y, si `plan.coverage.omittedGroups.length > 0`, un aviso con los grupos que no se pudieron cubrir. Claves nuevas en `es` y `en`:

```
onboarding.equipamientoTitulo
onboarding.equipamientoDescripcion
onboarding.coberturaTitulo
onboarding.coberturaGrupos   // "No encontramos ejercicios de {{grupos}} con tu equipamiento"
onboarding.materialPresetGimnasio / materialPresetMancuernas / materialPresetPesoCorporal / materialPresetLoQueSea
onboarding.planTitulo
onboarding.planGenerado
onboarding.planPredefinido
```

- [ ] **Step 7: Correr todo**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: verde.

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f66_f67_rutina_guiada.py`
Expected: `ALL OK`.

- [ ] **Step 8: Commit**

```bash
git add src/domain/onboarding.ts src/components/onboarding src/store/equipmentStore.ts src/i18n/locales tests/e2e/test_f66_f67_rutina_guiada.py
git commit -m "feat: el onboarding entrega una rutina a medida de tu equipamiento (F66/F67 WP3)"
```

---

### Task 6: Página del planificador y retiros (WP4)

**Files:**
- Create: `src/pages/PlanificadorPage.tsx`
- Modify: `src/app/router.tsx`
- Modify: `src/pages/RutinasPage.tsx` (entrada)
- Modify: `src/i18n/locales/es/core.ts`, `src/i18n/locales/en/core.ts`
- Test: `tests/e2e/test_f66_f67_planificador.py` (nuevo)

**Interfaces:**
- Consumes: `planRoutine`, `RoutinePlan` (Task 4); `EquipmentFilter` (F66); `useRoutineDraft` (existente).
- Produces: ruta `/rutinas/planificador`.

- [ ] **Step 1: Escribir el test e2e que falla**

Creá `tests/e2e/test_f66_f67_planificador.py`: navegar a `/rutinas/planificador`, elegir nivel y objetivo, tocar «Generar», aseverar que aparece el resultado con al menos un día y sus ejercicios, tocar «Guardar como mi rutina», aseverar que queda como rutina propia en `/rutinas` con su badge, y 0 errores de consola.

- [ ] **Step 2: Correr el test para verlo fallar**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f66_f67_planificador.py`
Expected: FAIL — la ruta no existe (cae en el `*` del router y redirige a `/`).

- [ ] **Step 3: Crear la página**

`src/pages/PlanificadorPage.tsx`: reusar el wizard de 3 pasos del `RoutinePlanner` retirado (nivel → objetivo → días + equipamiento) montando `<EquipmentFilter />` en el paso 2, pero:
- Usar `localizeMuscleGroup` / `localizeEquipment` de `@/i18n/catalog` en vez de los ternarios anidados del componente viejo.
- Llamar a `planRoutine(...)` en vez de `generateRoutine(...)`.
- Mostrar `plan.coverage` cuando haya omisiones.
- Guardar con `routineRepo.createRoutine` + `useRoutineDraft`/`uniqueSlug` y navegar a `/rutinas/{slug}`.

- [ ] **Step 4: Registrar la ruta y la entrada**

En `src/app/router.tsx`, junto a `rutinas/nueva`:

```tsx
const PlanificadorPage = lazy(() => import('../pages/PlanificadorPage').then((m) => ({ default: m.PlanificadorPage })))
// ...
<Route path="rutinas/planificador" element={<PlanificadorPage />} />
```

**Cuidado con el orden:** `rutinas/:slug` está declarado después de `rutinas/nueva`; `rutinas/planificador` debe ir **antes** de `rutinas/:slug` para no caer en el matcher dinámico.

En `src/pages/RutinasPage.tsx`, al lado del `Link` a `/rutinas/nueva` (línea ~86), agregá uno a `/rutinas/planificador`.

- [ ] **Step 5: Correr todo y el e2e**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f66_f67_planificador.py`
Expected: todo verde y `ALL OK`.

- [ ] **Step 6: Regresión de las rutas multi-segmento (obligatorio por AGENTS.md)**

Se agregó una ruta nueva con dos segmentos. **Hay que probarla en el emulador**, no solo en el dev server: el e2e web no ve la app nativa y este repo ya tuvo 17 rutas multi-segmento en pantalla negra por un `base` relativo.

```powershell
npm run android:sync
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\android\gradlew.bat -p .\android assembleDebug
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
adb shell am force-stop com.gymlab.app
adb shell am start -n com.gymlab.app/.MainActivity
```

Criterio de aceptación: `document.getElementById('root').children.length > 0`, body con texto, y **0 `pageerror`** en `/rutinas/planificador`.

- [ ] **Step 7: Actualizar PLAN.md**

Marcá F67 y la fusión con F66, y anotá que el equipamiento requerido ahora se **deriva** y que el match relaja solo días.

- [ ] **Step 8: Commit**

```bash
git add src/pages/PlanificadorPage.tsx src/app/router.tsx src/pages/RutinasPage.tsx src/i18n/locales tests/e2e PLAN.md
git commit -m "feat: pagina del planificador y rutas multi-segmento probadas en emulador (F66/F67 WP4)"
```

---

## Self-Review

**Cobertura de la spec:**

| Decisión de la spec | Tarea |
|---|---|
| D1 predefinida primero, generar como fallback | Task 4 (`planRoutine`) |
| D2 match exacto, relajar solo días | Task 3 (`findPredefinedRoutine`) |
| D3 una sola fuente de equipamiento | Task 3 (`MATERIAL_PRESETS`) + Task 5 |
| D4 persistir como rutina propia + `basedOnId` | Task 5, Step 5 |
| D5 el onboarding entrega la rutina; `suggestRoutine` se retira | Task 3 Step 4 + Task 5 |
| D6 cobertura vacía se reporta | Task 4 (`CoverageReport`) + Task 5 Step 6 |
| D7 `equipment` a conjunto antes de empezar | Tasks 1-2 |
| WP0 / WP1 / WP2 / WP3 / WP4 | Tasks 1+2 / 3 / 4 / 5 / 6 |

**Puntos abiertos declarados (no son placeholders, son decisiones que el implementador debe cerrar con evidencia):**
1. Task 2 Step 5: los 5 slugs de frontera (`*squat-to-a-bench`, `bench-jump`, `bench-sprint`) — la regla dice que quedan fuera; confirmarlo.
2. Task 5 Step 4: medir el costo de derivar `requiredEquipmentOf` para 68 rutinas antes de dejarlo en un `useMemo` del componente.
3. Task 5 Step 4 y Task 6 Step 3: `planRoutine` recibe `routineDays`/`routineItems`. El onboarding y la página tienen que obtenerlos del repo (`routineRepo.getDays`/`getItems`), no del seed.

**Correcciones aplicadas en este self-review:**
- **Secuenciación de WP0 corregida en una segunda pasada (post-implementación de Task 1)**: Task 1 dejaba el runtime **roto**. `public/catalog/exercises-v1.json` seguía con `equipment` escalar y `reseeder.ts` siembra Dexie desde ese JSON, así que la app reventaba con `TypeError: equipment.map is not a function` en cualquier fila del catálogo. La republicación (arreglo del generador + `CATALOG_VERSION` + `SEED_VERSION` + regenerar + borrar `v1`) se **movió de Task 2 a Task 1** (Steps 9-12) y Task 2 quedó solo con el pase de `banco` sobre un catálogo ya sano.
- **Consumidores que la implementación encontró y el plan no listaba**: `src/components/exercise/ExerciseMetaChips.tsx`, `tests/unit/domain/exerciseIndex.test.ts`, `tests/unit/domain/trainingStats.test.ts`, `tests/unit/domain/cardioClassification.test.ts`. Lección: **`tsc --noEmit` es el radar real de consumidores, no la lista del plan** — `tsconfig.app.json` incluye `"tests"`.
- Se agregó el **ciclo de review de Gentle AI** a cada tarea. Con el switch encendido el candidato es el **diff del workspace**, así que el ciclo va **antes** del commit: implementar → normalizar → verificar → review → commit.
- `planRoutine` pasó de 4 a 6 parámetros: sin `routineDays`/`routineItems` la predefinida no se puede convertir a `PlannedDay[]`. Corregido en el plan **y** en la spec.
- Se eliminó el marcador `// placeholder a eliminar` del Step 3 de Task 4 (violaba la regla de no-placeholders).
- Task 1 Step 3: el desempate del generador pasó de "nombre localizado" a `slug`, porque el dominio es i18n-free. Corregido en la spec.
- Task 2: se sacaron `barbell-step-ups` y `dumbbell-step-ups` de la lista de `banco`. La regla fija dice que un cajón/step **no** cuenta como banco, y esos dos entraron por un ejemplo erróneo del prompt de análisis. Quedan **112** slugs, no 118.

**Consistencia de nombres:** `RoutineMatch`, `PlanRequest`, `RoutinePlan`, `PlannedDay`, `PlannedItem`, `CoverageReport`, `requiredEquipmentOf`, `findPredefinedRoutine`, `generateRoutinePlan`, `planRoutine`, `localizeEquipmentList`, `MATERIAL_BUCKETS`, `MATERIAL_PRESETS`, `MaterialBucket` — cada uno se define en una tarea y se consume con el mismo nombre en las siguientes.
