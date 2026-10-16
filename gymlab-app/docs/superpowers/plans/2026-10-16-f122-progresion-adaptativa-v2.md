# F122 — Progresión adaptativa v2 (peso de trabajo + freno) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la app prescriba el día como una **escalada** hacia el próximo escalón del **peso de trabajo** (ganado por evidencia de doble progresión, con RPE opcional afinando), aplicable con un toque, y que un **freno de ritmo por ejercicio** consolide cuando la subida es demasiado rápida para los tendones.

**Architecture:** Dominio puro primero (`src/domain/workingProgression.ts`: base de trabajo, evidencia, escalón, escalada, velocidad/freno, orquestador `planDayProposal`). Después store (`applyEscalada`), historial (`useRecentLoadHistory` extendido), cableado (`useActiveSession` → carrusel → bloque) y superficies (`ExerciseBlock`, ficha, i18n). Cierra con e2e + emulador.

**Tech Stack:** Vite + React + TypeScript, Vitest (+ jsdom/@testing-library), Playwright (librería Python) para e2e. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-10-16-f122-progresion-adaptativa-v2-design.md` (commit `3196871`)

**Precondición de ejecución:** directorio normal `C:\Users\Yves De Faria\Desktop\ProyectoGymLab\gymlab-app` (sin worktree: el usuario no pidió aislamiento). **Índice compartido**: nunca `git add -A`/`git add .`/`git stash`; stage de rutas exactas, verificar `git diff --cached --name-only` antes de cada commit y commitear de inmediato. **Ciclo RDD antes de cada commit** (candidato = diff del workspace): `gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition`, ruteando solo desde `next_transition`; si el transporte devuelve vacío (cap de 32k), vía CLI del doc `C:\Users\Yves De Faria\.gentle-ai\opencode-output-cap-fix.md`. **Sin push.** ODD: doc `odd/tasks/f122-progresion-adaptativa-v2.md` + espejo Engram `odd/f122-progresion-adaptativa-v2/tasks` creados **antes de la primera escritura de código** (Task 1, Step 0).

## Global Constraints

Copiadas de la spec y de `gymlab-app/AGENTS.md`. Aplican a **todas** las tareas.

- **Regla madre F118 intacta**: el sistema funciona completo sin RPE/RIR; con ellos solo afina; nunca bloquear por falta de datos (silencio, no error); defaults de fábrica no se tocan.
- **Nunca sobrescribir lo que escribió el usuario**: la propuesta solo escribe con el tap explícito; completadas y calentamientos jamás se tocan.
- **Carril de prescripción**: la base/velocidad usan series de reps (`reps >= WORKING_MIN_REPS`), sin calentamientos; singles/tests fuera.
- **PR = techo de seguridad** (`capped`), nunca objetivo del día.
- `npm run build` es el typecheck REAL (`tsc -b`); **nunca** `npx tsc --noEmit`.
- Antes de cada commit: build limpio + `npm test` verde + `npm run lint` sin hallazgos nuevos.
- **Un commit por tarea**, mensaje convencional, rutas exactas, sin push; tests y docs con el código de su tarea.
- Temporales fuera del repo (`%TEMP%\opencode`); no commitear screenshots/probes ni `android/*.gradle` tocados por `android:sync`.
- Textos de UI es-ES + i18n en ambos idiomas; código e identificadores en inglés; comentarios breves del «por qué».
- Sin ajustes nuevos (gobierna «Sugerir carga»; el deload suprime subidas como S12).

## Review Focus

Las cinco formas de fallar que la spec implica y que ningún test de tarea cubre por defecto — cada una tiene su test en la tarea dueña:

1. **Silencio, no error, sin evidencia**: <2 sesiones frescas, layoff o falta de margen → sin propuesta y sin avisos (nunca un botón roto ni una excepción). Test: Task 2 (`planDayProposal` → `null`).
2. **Aplicar con series ya completadas**: la escalada se re-arma sobre las pendientes de trabajo y no toca completadas ni calentamientos; un solo undo. Test: Task 3 (store + componente).
3. **Interplay toggle/deload**: con deload activo o «Sugerir carga» apagado no aparece ninguna superficie de peso (ni propuesta ni avisos de carga). Test: Task 4.
4. **Regresión del carril**: el caso común (todo reps) no se degrada al excluir singles; f63/f118 siguen verdes tras el cambio. Test: Task 6 (regresión e2e) + Task 1.
5. **Escalones micro con duplicados**: 80→82,5 en 4 series produce valores válidos (nunca 0, negativos ni por encima del PR). Tests: Task 1 (`buildEscalada`, cap).

---

### Task 1: Dominio — base de trabajo, evidencia y escalón

**Files:**
- Create: `src/domain/workingProgression.ts`
- Test: `tests/unit/domain/workingProgression.test.ts`
- Create (docs ODD): `odd/tasks/f122-progresion-adaptativa-v2.md` (raíz del repo) + espejo Engram

**Interfaces (contrato exacto):**
```ts
export interface WorkingSetLike {
  workoutId: number; weightKg: number; reps: number
  completed: boolean; isWarmup?: boolean; createdAt: string
}
export const WORKING_MIN_REPS = 4
export const REPS_MARGIN = 2
export const MICRO_STEP_PCT = 2.5
export const KNOWN_STEP_MAX_PCT = 15

export const workingBase = (sets: WorkingSetLike[], n = 5): number
export const hasMargin = (sets: WorkingSetLike[], plateKg = 2.5): boolean
export const decideStep = (args: { sets: WorkingSetLike[]; prWeightKg?: number; plateKg?: number }):
  { targetKg: number; kind: 'known' | 'micro'; capped: boolean } | null
export const buildEscalada = (baseKg: number, targetKg: number, setCount: number, plateKg = 2.5): number[]
```

- [ ] **Step 0: Crear el doc ODD de la fase**

`odd/tasks/f122-progresion-adaptativa-v2.md` con: header (objetivo, rama `main` commits directos, runner `npm test`/`npm run build`/e2e Python), `## Specs` (numerar S1..S11 desde las decisiones de la spec), `## Tasks` (tabla T1..T6), `## Log` con L1 = pedido original del usuario y las rondas de brainstorming/grilling resumidas. Espejo en Engram (tema `odd/f122-progresion-adaptativa-v2/tasks`).

- [ ] **Step 1: Escribir los tests que fallan (RED)**

`tests/unit/domain/workingProgression.test.ts` — helper local `set(workoutId, weightKg, reps, isWarmup?)` que arma `WorkingSetLike`. Casos con valores exactos:

```ts
it('workingBase: promedio de tops de trabajo de las últimas 5 sesiones', () => {
  // 6 sesiones con tops 70,75,80,80,80,85 → ignora la más vieja → 80
})
it('workingBase: ignora calentamientos y series de ≤3 reps', () => {
  // sesión con 100×2 y warmup 60×8 no alteran la base
})
it('hasMargin: +2 reps sostenidas en las últimas 2 sesiones al mismo peso', () => {
  // 80×10 (referencia), 80×13, 80×15 → true
})
it('hasMargin: mejora menor a +2 no alcanza', () => {
  // 80×10, 80×11, 80×11 → false
})
it('hasMargin: sin peso repetido cae a e1RM al alza (≥2%)', () => {
  // 70×10, 90×10 (buckets distintos, e1RM +28%) → true
})
it('hasMargin: menos de 3 sesiones en el peso → false', () => {})
it('decideStep: conocido dentro de 15% gana', () => {
  // base 80 + sesión vieja con 90×2 series → { targetKg: 90, kind: 'known', capped: false }
})
it('decideStep: sin conocido → micro +2,5% redondeado a placa', () => {
  // base 80 → { targetKg: 82.5, kind: 'micro' }
})
it('decideStep: conocido lejano (>15%) no se usa', () => {
  // sesión vieja con 110 → micro 82.5
})
it('decideStep: el PR recorta y marca capped', () => {
  // pr 82 → targetKg 82, capped true; pr 0 → sin cap
})
it('buildEscalada: distribución uniforme redondeada a placa', () => {
  expect(buildEscalada(80, 90, 3)).toEqual([80, 85, 90])
  expect(buildEscalada(80, 90, 4)).toEqual([80, 82.5, 87.5, 90])
  expect(buildEscalada(80, 82.5, 4)).toEqual([80, 80, 82.5, 82.5])
})
it('buildEscalada: 1 serie = el objetivo', () => {})
```

- [ ] **Step 2: Correr y verificar RED**

Run: `npx vitest run tests/unit/domain/workingProgression.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 3: Implementar `workingProgression.ts`**

- Helpers privados: `workSets(s)` (lane: `completed && !isWarmup && reps >= WORKING_MIN_REPS && weightKg > 0`), `topBySession`.
- `workingBase`: agrupa por `workoutId`, ordena por workoutId desc, tops con peso>0, promedio de los primeros `n`; 0 si no hay.
- `hasMargin`: sesión reciente más pesada W (top redondeado a placa); sesiones dentro de ±1 plato de W, ordenadas; requiere ≥3; `media(últimas 2) − primera ≥ REPS_MARGIN`; fallback: si <3 sesiones en un bucket, e1RM Brzycki (`estimate1RM` de `./prs`) promedio de las últimas 2 sesiones ≥ promedio anterior × 1.02.
- `decideStep`: `base = workingBase`; 0 → `null`; conocido = mínimo peso del historial (lane) `> base`, `≤ base × (1 + KNOWN_STEP_MAX_PCT/100)`, con ≥2 series completadas en alguna sesión a ese peso (±plato); si no, `micro = roundToNearestPlate(base × 1.025)`; cap: `prWeightKg > 0 && target > prWeightKg` → `target = prWeightKg`, `capped = true`.
- `buildEscalada`: `n<=1` → `[targetKg]`; ideal_i = base + (target−base)·i/(n−1), redondeo `roundToNearestPlate` (import de `./calculators/converter`), última = target.

- [ ] **Step 4: Correr y verificar GREEN + suite**

Run: `npx vitest run tests/unit/domain/workingProgression.test.ts` → PASS. Después `npm test`.

- [ ] **Step 5: Verificación + review + commit**

`npm run build` · `npm test` · `npm run lint` limpios. Ciclo RDD (candidato = workspace). Stage exacto y commit:

```powershell
git add src/domain/workingProgression.ts tests/unit/domain/workingProgression.test.ts
git diff --cached --name-only
git commit -m "feat: dominio de progresion por peso de trabajo (base, evidencia, escalon)"
```

---

### Task 2: Dominio — freno de velocidad y orquestador del día

**Files:**
- Modify: `src/domain/workingProgression.ts`
- Test: `tests/unit/domain/workingProgression.test.ts`

**Interfaces (agrega al módulo de Task 1):**
```ts
export const VELOCITY_THRESHOLD_PCT_PER_WEEK = 2.5
export const VELOCITY_WINDOW_DAYS = 21
export const MIN_SESSIONS_AT_BASE = 3
export const FRESH_WINDOW_DAYS = 28

export const workingVelocityPctPerWeek = (sets: WorkingSetLike[], now?: Date): number | null
export const shouldConsolidate = (sets: WorkingSetLike[], now?: Date): boolean
export type DayProposal =
  | { kind: 'escalada'; weightsKg: number[]; capped: boolean }
  | { kind: 'consolidate' }
export const planDayProposal = (args: {
  sets: WorkingSetLike[]; setCount: number; prWeightKg?: number; plateKg?: number; now?: Date
}): DayProposal | null
```

- [ ] **Step 1: Tests RED**

```ts
it('velocidad: tops 80→85 en 2 semanas = 3,125%/semana', () => {})
it('velocidad: <2 sesiones en ventana → null (silencio)', () => {})
it('freno: >2,5%/semana sostenido → consolida; exactamente 2,5 no', () => {
  // 80→84 en 2 semanas = 2,5%/semana → false (estricto >)
})
it('planDayProposal: sin historial → null', () => {})
it('planDayProposal: layoff (sin sesiones frescas en 28 días) → null', () => {})
it('planDayProposal: velocidad excedida → { kind: "consolidate" }', () => {})
it('planDayProposal: margen pero solo 2 sesiones en la base → null (mínimo 3)', () => {})
it('planDayProposal: margen + 3 sesiones + freno OK → escalada completa', () => {
  // base 80, conocido 90, 3 series → { kind: 'escalada', weightsKg: [80, 85, 90], capped: false }
})
```

- [ ] **Step 2: RED confirmado** (`npx vitest run tests/unit/domain/workingProgression.test.ts` → FAIL).

- [ ] **Step 3: Implementar**

- `workingVelocityPctPerWeek`: tops de trabajo por sesión en la ventana de 21 días; <2 → `null`; `weeks = max(díasEntreExtremos/7, 1)`; `(último − primero)/primero × 100 / weeks`.
- `shouldConsolidate`: `velocidad !== null && velocidad > VELOCITY_THRESHOLD_PCT_PER_WEEK`.
- `planDayProposal` (orden exacto): base 0 → null · frescas (<28 días) <2 → null · `shouldConsolidate` → `{ kind: 'consolidate' }` · sin margen → null · sesiones en la base (±plato) <3 → null · `decideStep` null o `target <= base` → null · → escalada (`buildEscalada(base, target, max(1, setCount))`).

- [ ] **Step 4: GREEN + suite** (dirigidos → `npm test`).

- [ ] **Step 5: Verificación + review + commit**

```powershell
git add src/domain/workingProgression.ts tests/unit/domain/workingProgression.test.ts
git diff --cached --name-only
git commit -m "feat: freno de velocidad y orquestador del dia (F122)"
```

---

### Task 3: Acción `applyEscalada` + historial + cableado de la propuesta

**Files:**
- Modify: `src/store/activeWorkoutStore.ts` (nueva acción; patrón de `applyWeightToRemaining` en `:380-398`)
- Modify: `src/hooks/useRecentLoadHistory.ts` (devolver también `setsByExercise`)
- Modify: `src/hooks/useActiveSession.ts` (`:46` firma; `:244-268` memo; `:307-320` handlers; retorno `:317+`)
- Modify: `src/pages/EntrenamientoPage.tsx` (`:45` hook; `:90` uso; `:170` prop)
- Modify: `src/components/workout/SessionCarousel.tsx` + `SessionCarouselSlide.tsx` (props nuevas)
- Modify: `src/domain/sessionSuggestions.ts` (quitar rama `increase`) + `src/hooks/useBlockSuggestions.ts`
- Test: `tests/unit/store/activeWorkoutStore.test.ts`, `tests/unit/domain/sessionSuggestions.test.ts`, `tests/unit/hooks/useBlockSuggestions.test.ts`

**Interfaces:**
- Store: `applyEscalada: (exerciseId: number, weightsKg: number[]) => void` — fija las pendientes de trabajo **en orden de `setNumber`** con `Math.max(0, Math.round(w * 2) / 2)`; no toca completadas ni calentamientos; `i >= weightsKg.length` → esa serie queda como está.
- `useRecentLoadHistory(): { loadAverages: Map<number, number>; setsByExercise: Map<number, WorkoutSet[]> }` (misma consulta: `workoutRepo.getSinceDate(cutoff)` 90 días → `workoutSetRepo.getByWorkoutIds`; nuevo helper puro exportado `groupSetsByExercise`).
- `useActiveSession(loadAverages, deloadActive, setsByExercise?)` → agrega `dayProposalByExercise: Record<number, DayProposal>` (memo con `planDayProposal`; `setCount` = pendientes de trabajo del ejercicio; `prWeightKg` de `prMap`) y `handleApplyEscalada(exerciseId, weightsKg)` (pushUndo etiqueta `«{nombre} (escalada)»`).
- `sessionSuggestions.ts`: se elimina la rama `increase` (el chip de subida muere); `loadTargetByExercise`/`buildLoadTargets`/`suppressIncrease`/`useLoadSuggestion` se retiran **si quedan huérfanos tras el cambio** (verificar con grep antes de borrar; conservar `recommendLoad` en `loadRecommendation.ts`).

- [ ] **Step 1: Tests RED**
  - Store: escalada sobre 4 pendientes (80→90) escribe `[80, 82.5, 87.5, 90]`; no toca completada ni warmup; array más corto que pendientes deja las sobrantes.
  - `groupSetsByExercise`: agrupa por `exerciseId` preservando orden.
  - `sessionSuggestions`: un caso de subida (con `loadTargetByExercise` alto) ahora **no genera** `increase`; `decrease`/`rest`/`warning`/`warmup` siguen.
- [ ] **Step 2: RED confirmado** (dirigidos → FAIL).
- [ ] **Step 3: Implementar** (store → hook historial → `useActiveSession` → carrusel/slide → limpieza grep-guided).
- [ ] **Step 4: GREEN + `npm test` completo.**
- [ ] **Step 5: Verificación + review + commit**

```powershell
git add src/store/activeWorkoutStore.ts src/hooks/useRecentLoadHistory.ts src/hooks/useActiveSession.ts src/pages/EntrenamientoPage.tsx src/components/workout/SessionCarousel.tsx src/components/workout/SessionCarouselSlide.tsx src/domain/sessionSuggestions.ts src/hooks/useBlockSuggestions.ts tests/unit/store/activeWorkoutStore.test.ts tests/unit/domain/sessionSuggestions.test.ts tests/unit/hooks/useBlockSuggestions.test.ts
git diff --cached --name-only
git commit -m "feat: accion de escalada por serie, historial de trabajo y cableado (F122)"
```

---

### Task 4: Superficie del bloque — propuesta, consolidación, calentamiento y copy

**Files:**
- Modify: `src/components/workout/ExerciseBlock.tsx` (bloque `canSuggest` `:176-224`; chip `:259-266`; props `:26-54`; `useLoadSuggestion` `:122-128`)
- Modify: `src/components/workout/SuggestionChip.tsx` (limpieza de copy de `increase` si queda huérfano)
- Modify: `src/i18n/locales/es/workout.ts`, `src/i18n/locales/en/workout.ts`
- Test: `tests/unit/components/workout/exerciseBlockProposal.test.tsx` (crear)

**Props nuevas de `ExerciseBlock`:** `dayProposal?: DayProposal` · `onApplyEscalada?: (exerciseId: number, weightsKg: number[]) => void`. Se conserva `recentTopSetAvgKg` (ahora alimenta el peso del botón de calentamiento) y `onSuggestionWarmup`.

**Reglas de superficie (exactas):**
- **Escalada visible** = `showLoadSuggestion && !deloadActive && dayProposal?.kind === 'escalada' && !!nextSet && !escaladaMatchesPendings(week)`. Helper puro `escaladaMatchesPendings(weightsKg, pendings)` (compara secuencia por `setNumber`).
- **Aplicar** = `onApplyEscalada(exerciseId, weightsKg)` (un toque, todas las pendientes).
- **Consolidación** = `showLoadSuggestion && !deloadActive && dayProposal?.kind === 'consolidate' && !!nextSet` → línea `workout.consolidando`, sin botón.
- **Aviso del récord** = `dayProposal?.kind === 'escalada' && dayProposal.capped && !!nextSet` → copy existente `workout.cappedByPr`.
- **Calentamiento** = botón en la fila de acciones (icono `Flame`): peso = `roundToHalf(45% del primer pendiente de trabajo con peso>0)`; sin pendiente con peso, `recentTopSetAvgKg × 0.45`; 0 → deshabilitado. Llama `onSuggestionWarmup(exerciseId, peso)`.
- i18n es/en (claves nuevas): `workout.escaladaRango` es «Escalada: {{desde}} → {{hasta}} kg» · `workout.aplicarEscaladaAria` es «Aplicar la escalada de {{desde}} a {{hasta}} kg en las series pendientes» · `workout.consolidando` es «Consolidando — el peso viene subiendo rápido.» · `workout.agregarCalentamiento` es «Calentamiento» · `workout.agregarCalentamientoAria` es «Agregar una serie de calentamiento» (+ en equivalentes).

- [ ] **Step 1: Tests RED (componente)**: escalada visible con proposal y oculta con pendientes ya iguales; aplicar llama `onApplyEscalada` con los pesos exactos; consolidación visible sin botón; aviso del récord con `capped`; botón de calentamiento llama `onSuggestionWarmup` con el 45% redondeado; toggle/deload → sin superficies de peso.
- [ ] **Step 2: RED confirmado.**
- [ ] **Step 3: Implementar** (bloque + i18n + limpieza de `SuggestionChip`/`useLoadSuggestion` si huérfanos).
- [ ] **Step 4: GREEN + `npm test`.**
- [ ] **Step 5: Verificación + review + commit**

```powershell
git add src/components/workout/ExerciseBlock.tsx src/components/workout/SuggestionChip.tsx src/i18n/locales/es/workout.ts src/i18n/locales/en/workout.ts tests/unit/components/workout/exerciseBlockProposal.test.tsx
git diff --cached --name-only
git commit -m "feat: propuesta de escalada, aviso de consolidacion y boton de calentamiento (F122)"
```

---

### Task 5: Aviso de zona en la ficha del ejercicio

**Files:**
- Create: `src/domain/zoneAdvisory.ts`
- Modify: `src/pages/EjercicioDetailPage.tsx` (bajo el bloque del gráfico e1RM, `:94-98`)
- Test: `tests/unit/domain/zoneAdvisory.test.ts`

**Interfaces:**
```ts
export interface ZoneAdvisory { zone: string; pctPerWeek: number }
export const buildZoneAdvisories = (args: {
  setsByExercise: Map<number, WorkingSetLike[]>
  muscleByExerciseId: Map<number, string>
  now?: Date
}): ZoneAdvisory[]   // zonas con velocidad > VELOCITY_THRESHOLD_PCT_PER_WEEK, ordenadas desc
```

- [ ] **Step 1: Tests RED** — agrega por músculo (máxima velocidad de sus ejercicios con señal); ignora series sin señal; umbral estricto.
- [ ] **Step 2: RED confirmado.**
- [ ] **Step 3: Implementar** — dominio puro + wiring en la ficha: consulta sets de los ejercicios del mismo músculo (catálogo) con `useLiveList` (patrón de la página); renderiza una línea discreta por zona (`text-xs text-muted`), informativa, nunca bloqueante. i18n: `ejercicios.detalle.zonaRapida` es «Tu {{zona}} viene subiendo rápido.» (+ en).
- [ ] **Step 4: GREEN + `npm test` + `npm run build`.**
- [ ] **Step 5: Verificación + review + commit**

```powershell
git add src/domain/zoneAdvisory.ts src/pages/EjercicioDetailPage.tsx tests/unit/domain/zoneAdvisory.test.ts
git diff --cached --name-only
git commit -m "feat: aviso discreto de zona con subida rapida en la ficha (F122)"
```

---

### Task 6: Cierre — e2e, regresión, emulador y docs (122.3)

**Files:**
- Create: `tests/e2e/test_f122_progresion_adaptativa.py`
- Modify: `tests/e2e/test_f118_sugerencia_alcanzable.py`, `tests/e2e/test_f63_suggestions.py` (superficies de subida cambiadas)
- Modify: `PLAN.md`, `CHANGELOG.md`

- [ ] **Step 1: e2e nuevo (puerto 5242)** — seed con fechas relativas + limpieza de `prs` entre escenarios (lecciones F118); arranque `python tests/e2e/scripts/with_server.py tests/e2e/test_f122_progresion_adaptativa.py --port 5242`:
  - **A (evidencia→escalada):** historial 80×10 (referencia) + 80×14×2 sesiones + conocida 90 → propuesta «Escalada 80 → 90» visible; tap → las 3 pendientes quedan `80 / 85 / 90`.
  - **B (silencio):** historial estable 80×10 → sin propuesta y sin chip de subida.
  - **C (consolidación):** tops 80→92 en ~11 días → aviso «Consolidando» visible, sin botón.
  - **D (calentamiento):** botón agrega una serie al 45% del peso de trabajo.
  - **E (sin historial):** sin propuesta.
  - **F:** 0 `pageerror`.
- [ ] **Step 2: Actualizar regresión** — `test_f118` y `test_f63`: los casos que asertan «Sugerido»/chip de subida pasan a la semántica F122 (propuesta con evidencia; ausencia sin evidencia; el caso G5 del apply absoluto se cubre en A); correr ambos y `test_f122`.
- [ ] **Step 3: Emulador Pixel_10 (receta de `AGENTS.md`)** — con settings de fábrica y seed: propuesta visible, aplicar escribe la escalada, aviso de consolidación, botón de calentamiento; criterio: `root.children.length > 0` + textos + **0 `pageerror`**; screenshots a `%TEMP%\opencode\f122\`.
- [ ] **Step 4: Docs** — `CHANGELOG.md` `[Unreleased]` (Added: propuesta de escalada, freno de ritmo, botón de calentamiento, aviso de zona; Changed: el chip de subida se retira y la propuesta reemplaza al «Sugerido»; el carril de prescripción excluye singles/tests) y `PLAN.md` (122.1/122.2/122.3 a `[x]`, fase → `— IMPLEMENTADA ✅`; archivo en `COMPLETED.md` cuando el usuario lo pida).
- [ ] **Step 5: Review + commit de cierre**

```powershell
git add tests/e2e/test_f122_progresion_adaptativa.py tests/e2e/test_f118_sugerencia_alcanzable.py tests/e2e/test_f63_suggestions.py PLAN.md CHANGELOG.md
git diff --cached --name-only
git commit -m "test: e2e de F122, regresion actualizada y cierre de fase"
```

---

## Self-review (hecho al escribir este plan)

- **Cobertura de la spec**: doble carril (T1 lane), evidencia doble progresión + RPE (T1 `hasMargin`), escalón conocido/micro + PR cap (T1 `decideStep`), escalada por serie aplicada con un toque (T1 `buildEscalada`, T3 store, T4 superficie), silencio sin evidencia (T2), freno + mínimo + layoff (T2), avisos no intrusivos (T4 consolidación, T5 zona), deload/toggle (T4 gates), calentamiento a pedido (T4), bordes (T2), e2e/emulador (T6). ✔
- **Placeholders**: ninguno; valores exactos en tests (80→90 en 3 = [80,85,90]; micro 80→82,5; velocidad 80→85 en 2 semanas = 3,125%). ✔
- **Consistencia de nombres**: `WorkingSetLike`, `planDayProposal`, `DayProposal`, `applyEscalada`, `dayProposalByExercise`, `onApplyEscalada`, `buildZoneAdvisories` se usan igual en todas las tareas. ✔
- **Review Focus**: las 5 líneas tienen test en la tarea dueña (T1/T2/T3/T4/T6). ✔
- **Proporción**: el plan decide contratos, valores y superficies; los cuerpos quedan para el implementador. ✔
