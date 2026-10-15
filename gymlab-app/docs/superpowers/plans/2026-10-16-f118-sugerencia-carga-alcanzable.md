# F118 — Sugerencia de carga adaptativa alcanzable — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la sugerencia de carga adaptativa sea alcanzable y correcta con los settings de fábrica (RPE/RIR off): el chip dispara por el motor (historial + PR), el esfuerzo cargado solo afina, el aviso del récord nunca se pierde, el toggle gobierna toda propuesta de peso y la acción del chip escribe el objetivo absoluto (no el delta).

**Architecture:** Dominio puro primero (`sessionSuggestions.ts`: señal por motor, esfuerzo solo con datos reales, filtro de calentamientos, acción con objetivo absoluto; `loadRecommendation.ts`: helper puro `buildLoadTargets` con la puerta de historial). Después el store (`applyWeightToRemaining` fija el objetivo) y las superficies (`ExerciseBlock`, `useActiveSession`, `SuggestionChip`, i18n). Cierra con e2e nuevo + emulador.

**Tech Stack:** Vite + React + TypeScript, Vitest (+ jsdom/@testing-library/react ya en devDeps), Playwright (librería Python) para e2e. Sin cambios en `recommendLoad` (la aritmética del motor queda intacta).

**Spec:** `docs/superpowers/specs/2026-10-16-f118-sugerencia-carga-alcanzable-design.md` (commit `177dd85`)

**Precondición de ejecución:** directorio normal `C:\Users\Yves De Faria\Desktop\ProyectoGymLab\gymlab-app` (sin worktree: el usuario no pidió aislamiento). **Índice compartido**: nunca `git add -A`/`git add .`/`git stash`; stage de rutas exactas, verificar `git diff --cached --name-only` antes de cada commit y commitear de inmediato. **Ciclo RDD antes de cada commit** (el candidato es el diff del workspace): `gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition`, ruteando **solo** desde `next_transition`; si el transporte devuelve vacío (cap de 32k de OpenCode), vía CLI del doc `C:\Users\Yves De Faria\.gentle-ai\opencode-output-cap-fix.md`. **Sin push.**

## Estado de avance

- [ ] Task 1 — Dominio + acción absoluta (señal por motor, G4, G5)
- [ ] Task 2 — Superficies: aviso del récord, toggle y copy (G2, G3)
- [ ] Task 3 — Cierre: e2e + emulador + docs (118.3)

(El orquestador marca cada casilla en el mismo commit de cierre de la tarea.)

## Global Constraints

Copiadas de la spec y de `gymlab-app/AGENTS.md`. Aplican a **todas** las tareas.

- **La regla de diseño manda**: el motor funciona completo sin RPE/RIR; con ellos solo afina; los defaults **no se tocan**; ningún dato inventado puede ser fuente de permiso (se eliminan `rpe ?? 7` y `rir ?? 2` como decisión).
- **`recommendLoad` no se toca**: la aritmética (base, paso, PR techo, `capped`) queda igual.
- **Nunca sobrescribir lo que escribió el usuario**: la precarga solo actúa al armar la sesión (y al agregar un ejercicio); el único autocompletado es el tap explícito del usuario.
- **`npm run build` es el typecheck REAL** (`tsc -b`); **nunca** `npx tsc --noEmit` (falso verde).
- Antes de cada commit: `npm run build` limpio + `npm test` verde + `npm run lint` sin hallazgos nuevos.
- **Un commit por tarea**, mensaje convencional, rutas exactas, sin push. Tests y docs van con el código de su tarea.
- **Temporales fuera del repo** (`%TEMP%\opencode`); no commitear screenshots ni probes.
- Textos de UI es-ES; código e identificadores en inglés; comentarios breves del «por qué».

## Estructura de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/domain/sessionSuggestions.ts` | Modificar | Señal por motor (top de la sesión), esfuerzo real (sin inventar), filtro de calentamientos, acción `targetKg`, `data` con `target`/`withMargin`/`capped` |
| `src/domain/loadRecommendation.ts` | Modificar | Nuevo helper puro `buildLoadTargets` (target + `capped`, **solo con historial real**) |
| `src/hooks/useActiveSession.ts` | Modificar | Usa `buildLoadTargets`; filtra chips de peso con el toggle; `handleApplyWeight` con objetivo absoluto |
| `src/hooks/useBlockSuggestions.ts` | Modificar | Acepta `loadTargetByExercise` con forma nueva y `includeLoadSuggestions` |
| `src/store/activeWorkoutStore.ts` | Modificar | `applyWeightToRemaining` **fija** el objetivo en las pendientes de trabajo |
| `src/components/workout/SuggestionChip.tsx` | Modificar | Copy neutro/con margen, aviso del récord del chip, `onApply` con `targetKg` |
| `src/components/workout/ExerciseBlock.tsx` | Modificar | Aviso del récord desacoplado del botón (G2) |
| `src/components/settings/SessionSection.tsx` | Modificar | Descripción del ajuste corregida |
| `src/i18n/locales/{es,en}/workout.ts` · `core.ts` | Modificar | Claves nuevas/reescritas |
| `tests/unit/domain/sessionSuggestions.test.ts` · `loadRecommendation.test.ts` | Modificar | RED→GREEN del dominio |
| `tests/unit/store/activeWorkoutStore.test.ts` | Modificar | RED→GREEN de la acción absoluta |
| `tests/unit/components/workout/suggestionChip.test.tsx` | Crear | Chip: copy neutro, aviso del récord, `targetKg` |
| `tests/e2e/test_f118_sugerencia_alcanzable.py` | Crear | Criterios de la fase en el canal oficial |
| `PLAN.md` · `CHANGELOG.md` | Modificar | Cierre de la fase |

## Review Focus

Las cinco formas de fallar que la spec implica y que ningún test de tarea cubre por defecto — cada una tiene su test en la tarea dueña del código:

1. **Series pendientes vacías (0 kg) al aplicar** → debe escribirse el **objetivo**, no el delta (el bug G5). Test: Task 1 (store).
2. **Sin historial real** (ejercicio nuevo o ventana sin datos) → **silencio**: sin entrada en `buildLoadTargets`, sin «sube» y sin afirmar margen. Test: Task 1 (`buildLoadTargets`, y dominio con objetivos ausentes).
3. **Calentamientos completados** presentes en la sesión → no contaminan promedios, conteos ni umbrales. Tests: Task 1 (dominio, con warmups 45 kg + trabajo 60 kg).
4. **Esfuerzo parcial** (algunas series con RPE, otras sin) → el promedio usa **solo** las que tienen dato; sin dato no suprime ni afirma «tienes margen». Test: Task 1 (dominio).
5. **RPE al límite con motor pidiendo subir** (RPE 9, objetivo 70 > top 65) → el chip de subir **se suprime** (no se afirma subir al límite). Test: Task 1 (dominio).

> **Freno con deload activo (aprobado por el usuario el 2026-10-16, spec decisión 11):** con deload activo, las superficies de peso no proponen subir (botón y chip de subir suprimidos; el chip de bajar y los avisos de calentamiento/descanso/rendimiento quedan igual). Su test vive en la Task 2 (`useBlockSuggestions.test.ts`, caso `suppressIncrease`).

---

### Task 1: Dominio + acción absoluta (señal por motor, G4, G5)

**Files:**
- Modify: `src/domain/sessionSuggestions.ts`
- Modify: `src/domain/loadRecommendation.ts`
- Modify: `src/store/activeWorkoutStore.ts:380-396`
- Modify: `src/hooks/useActiveSession.ts:244-268, 311-320`
- Modify: `src/hooks/useBlockSuggestions.ts:55-84`
- Modify: `src/components/workout/SuggestionChip.tsx:71-88`
- Test: `tests/unit/domain/sessionSuggestions.test.ts`, `tests/unit/domain/loadRecommendation.test.ts`, `tests/unit/store/activeWorkoutStore.test.ts`

> **Por qué WP1+WP2 de la spec van juntos acá:** el contrato de la acción no puede cambiar a medias (el chip y el store deben hablar `targetKg` en el mismo commit), así que dominio + store + wireo mínimo del chip viajan como una unidad coherente.

**Interfaces (contrato exacto):**
- `LoadTarget = { weightKg: number; capped: boolean }`
- `SuggestionOptions.loadTargetByExercise?: Record<number, LoadTarget>`
- `SuggestionAction = { kind: 'applyWeight'; targetKg: number } | { kind: 'addWarmupSet'; warmupWeightKg: number }`
- `SuggestionSetInput` gana `isWarmup?: boolean`
- `buildLoadTargets(input): Record<number, LoadTarget>` — entrada: `{ exercises, prs, recentTopSetAvgByExercise, progressionPct }` (mismas fórmulas que hoy en `useActiveSession`, **más** la puerta `recentTopSetAvg > 0`)
- `useBlockSuggestions` gana `includeLoadSuggestions?: boolean` (default `true`; filtra `increase`/`decrease` antes de agrupar) y `suppressIncrease?: boolean` (default `false`; filtra solo `increase` — lo cablea el freno de deload en Task 2)

- [ ] **Step 1: Escribir los tests que fallan (RED)**

`tests/unit/domain/sessionSuggestions.test.ts` — el helper `completed()` pasa a `rpe`/`rir` **opcionales** (default `undefined` = sin datos; los casos con esfuerzo pasan valores explícitos). Actualizar las expectativas existentes al contrato nuevo y agregar los casos del Review Focus. Casos clave, con valores exactos:

```ts
it('increase: objetivo > top de la sesión; acción y data absolutas', () => {
  const result = generateSuggestions([completed(1, 60, 8, 5, 3, 1)], {
    loadTargetByExercise: { 1: { weightKg: 62.5, capped: false } },
  })
  const s = result.find((x) => x.id === 'increase-1')
  expect(s?.action).toEqual({ kind: 'applyWeight', targetKg: 62.5 })
  expect(s?.data).toEqual({ amount: 2.5, target: 62.5, withMargin: true, capped: false })
})

it('sin datos de esfuerzo el mensaje es neutro (sin margen afirmado)', () => {
  const result = generateSuggestions([completed(1, 60, 8)], {
    loadTargetByExercise: { 1: { weightKg: 62.5, capped: false } },
  })
  const s = result.find((x) => x.id === 'increase-1')
  expect(s?.messageKey).toBe('suggestions.increaseWeightNeutral')
  expect(s?.data).toMatchObject({ withMargin: false })
})

it('con RPE real alto el increase se suprime', () => {
  const result = generateSuggestions([completed(1, 65, 8, 9, 1, 1)], {
    loadTargetByExercise: { 1: { weightKg: 70, capped: false } },
  })
  expect(result.some((x) => x.type === 'increase')).toBe(false)
})

it('el top de la sesión manda (no la última serie) y el calentamiento no cuenta', () => {
  const result = generateSuggestions(
    [completed(1, 45, 8, 7, 2, 1, true), completed(1, 60, 8, 7, 2, 2), completed(1, 50, 8, 7, 2, 3)],
    { loadTargetByExercise: { 1: { weightKg: 62.5, capped: false } } }
  )
  expect(result.find((x) => x.id === 'increase-1')?.data).toMatchObject({ amount: 2.5 })
})

it('no dispara si las pendientes ya están en el objetivo o por encima', () => {
  const result = generateSuggestions([completed(1, 60, 8)], {
    loadTargetByExercise: { 1: { weightKg: 62.5, capped: false } },
    activeSets: [active(1, 62.5, 2)],
  })
  expect(result.some((x) => x.type === 'increase')).toBe(false)
})

it('decrease: objetivo absoluto', () => {
  const result = generateSuggestions([completed(1, 60, 8, 10, 0, 1)])
  const s = result.find((x) => x.id === 'decrease-1')
  expect(s?.action).toEqual({ kind: 'applyWeight', targetKg: 57.5 })
})

it('sin esfuerzo cargado no hay decrease ni rest', () => {
  const sets = [completed(1, 60, 12, undefined, undefined, 1), completed(1, 60, 12, undefined, undefined, 2), completed(1, 60, 12, undefined, undefined, 3)]
  const result = generateSuggestions(sets, { restMinutesByExercise: { 1: 4 } })
  expect(result.some((x) => x.type === 'decrease' || x.type === 'rest')).toBe(false)
})

it('G4: tres calentamientos + dos series de trabajo no disparan el rest de ≥3', () => {
  const sets = [
    completed(1, 45, 8, 8, 1, 1, true), completed(1, 45, 8, 8, 1, 2, true), completed(1, 45, 8, 8, 1, 3, true),
    completed(1, 60, 8, 8, 1, 4), completed(1, 60, 8, 8, 1, 5),
  ]
  const result = generateSuggestions(sets, { restMinutesByExercise: { 1: 4 } })
  expect(result.some((x) => x.type === 'rest')).toBe(false)
})
```

(`completed()` gana un 7º parámetro `isWarmup`; el tipo `CompletedSet` también, para que los warmups puedan marcarse.)

`tests/unit/domain/loadRecommendation.test.ts`:

```ts
it('buildLoadTargets: sin historial no hay entrada (aunque haya PR)', () => {
  const targets = buildLoadTargets({
    exercises: [ex(1, [{ weightKg: 60, completed: true }])],
    prs: new Map([[1, { weightKg: 70 }]]),
    recentTopSetAvgByExercise: new Map(),
    progressionPct: 2.5,
  })
  expect(targets).toEqual({})
})

it('buildLoadTargets: con historial calcula el objetivo y propaga capped', () => {
  const targets = buildLoadTargets({
    exercises: [ex(1, [{ weightKg: 60, completed: true }])],
    prs: new Map([[1, { weightKg: 60 }]]),
    recentTopSetAvgByExercise: new Map([[1, 60]]),
    progressionPct: 2.5,
  })
  expect(targets[1]).toEqual({ weightKg: 60, capped: true })
})
```

`tests/unit/store/activeWorkoutStore.test.ts` (nuevo describe `applyWeightToRemaining — objetivo absoluto (G5)`):

```ts
it('fija el objetivo en series pendientes vacías (no suma el delta)', () => { /* pending 0 → 270 */ })
it('fija el objetivo en series pendientes con peso', () => { /* pending 200 → 270 */ })
it('no toca completadas ni calentamientos', () => { /* completada 200 y warmup 100 intactas */ })
```

- [ ] **Step 2: Correr los tests y verificar que fallan (RED)**

Run: `npx vitest run tests/unit/domain/sessionSuggestions.test.ts tests/unit/domain/loadRecommendation.test.ts tests/unit/store/activeWorkoutStore.test.ts`
Expected: FAIL — `buildLoadTargets` no existe; `action.amountKg` vs `targetKg`; el increase sale sin RPE (hoy `avgRpe ?? 7` lo bloquea); el store suma el delta.

- [ ] **Step 3: Implementar el dominio (`sessionSuggestions.ts`)**

- `completedSetsForSuggestions`: agrega `isWarmup` al tipo de entrada y filtra `!s.isWarmup`.
- Promedios: `const rpeSets = sets.filter(s => s.rpe !== undefined)`; `avgRpe = rpeSets.length ? mean : undefined`; análogo `avgRir`. Sin datos → `undefined` (nunca 7/2).
- `topWorking = Math.max(...sets.map(s => s.weightKg))`; `maxPending` = máximo de `activeSets` de trabajo con peso > 0 y `!completed`.
- **increase**: `target && !suppressed && target.weightKg > topWorking && target.weightKg > maxPending` donde `suppressed = (avgRpe !== undefined && avgRpe >= 8) || (avgRir !== undefined && avgRir <= 1)`; `withMargin = (avgRpe !== undefined && avgRpe <= 6) || (avgRpe === undefined && avgRir !== undefined && avgRir >= 2)`; `messageKey` según `withMargin`; `data = { amount: roundToHalf(target.weightKg - topWorking), target: target.weightKg, withMargin, capped: target.capped }`; `action = { kind: 'applyWeight', targetKg: target.weightKg }`.
- **decrease**: condición `(avgRpe !== undefined && avgRpe >= 9.5) || (avgRir !== undefined && avgRir <= 0.5)`; `target = roundToHalf(topWorking - 2.5)`; `data = { amount: 2.5, target }`; `action = { kind: 'applyWeight', targetKg: target }`.
- **rest**: `avgRpe !== undefined && avgRpe >= 8 && sets.length >= 3` (sin cambios de minutos).
- **warning** y **warmup**: sin cambios de regla.

- [ ] **Step 4: Implementar `buildLoadTargets` (`loadRecommendation.ts`) y cablearlo**

- Helper puro con la misma cuenta que hoy hace `useActiveSession` (líneas 249-268): top vivo (completadas de trabajo, máx), `lastRir` de datos reales, `recommendLoad`, y **solo agrega la entrada si `recentTopSetAvgByExercise.get(id) > 0`**; guarda `{ weightKg, capped }`.
- `useActiveSession`: el `useMemo` de `loadTargetByExercise` pasa a llamar `buildLoadTargets` con `loadAverages`, `prMap` y `settings.loadProgressionPct`.
- `useBlockSuggestions`: tipo nuevo + `includeLoadSuggestions` (default true) y `suppressIncrease` (default false) filtrando **antes** de `suggestionsByExercise` (para que un aviso de otra clase del mismo ejercicio siga visible).

- [ ] **Step 5: Implementar la acción absoluta (store + chip + handler)**

- `applyWeightToRemaining(exerciseId, targetKg)`: `weightKg: Math.max(0, Math.round(targetKg * 2) / 2)` en cada serie `!completed && !isWarmup` (mismo filtro que hoy).
- `useActiveSession.handleApplyWeight(exerciseId, targetKg)`: mismo `pushUndo` con etiqueta `«{nombre} ({targetKg} kg)»`.
- `SuggestionChip`: `onApply?.(suggestion.exerciseId, action.targetKg)`.

- [ ] **Step 6: Correr los tests y verificar que pasan (GREEN)**

Run: `npx vitest run tests/unit/domain/sessionSuggestions.test.ts tests/unit/domain/loadRecommendation.test.ts tests/unit/store/activeWorkoutStore.test.ts`
Expected: PASS. Después: `npm test` completo.

- [ ] **Step 7: Verificación completa + review + commit**

```powershell
npm run build   # typecheck real (tsc -b); limpio
npm test        # suite completa; verde
npm run lint    # sin hallazgos nuevos
```

Después, **ciclo RDD** (candidato = diff del workspace) y commit (rutas exactas, verificar staged antes):

```powershell
git add src/domain/sessionSuggestions.ts src/domain/loadRecommendation.ts src/store/activeWorkoutStore.ts src/hooks/useActiveSession.ts src/hooks/useBlockSuggestions.ts src/components/workout/SuggestionChip.tsx tests/unit/domain/sessionSuggestions.test.ts tests/unit/domain/loadRecommendation.test.ts tests/unit/store/activeWorkoutStore.test.ts
git diff --cached --name-only
git commit -m "feat: sugerencia por motor sin RPE y accion con objetivo absoluto (F118)"
```

---

### Task 2: Superficies — aviso del récord, toggle, deload y copy (G2, G3, S12)

**Files:**
- Modify: `src/components/workout/ExerciseBlock.tsx` (bloque `canSuggest`, líneas 203-216; gate del botón con `!deloadActive`)
- Modify: `src/components/workout/SuggestionChip.tsx` (copy + aviso del chip)
- Modify: `src/components/settings/SessionSection.tsx:127`
- Modify: `src/hooks/useActiveSession.ts` (pasar `includeLoadSuggestions` desde settings y `suppressIncrease` desde `deloadActive`)
- Modify: `src/pages/EntrenamientoPage.tsx` (pasar `deloadActive` a `useActiveSession`)
- Modify: `src/i18n/locales/es/workout.ts`, `src/i18n/locales/en/workout.ts`, `src/i18n/locales/es/core.ts`, `src/i18n/locales/en/core.ts`
- Test: `tests/unit/components/workout/suggestionChip.test.tsx` (crear), `tests/unit/hooks/useBlockSuggestions.test.ts`

**Interfaces:**
- Consumes: `SuggestionAction.targetKg`, `data.{target, withMargin, capped}`, `includeLoadSuggestions` y `suppressIncrease` de Task 1.
- Produces: nada que otra tarea consuma (Task 3 solo verifica).

- [ ] **Step 1: Tests RED (`suggestionChip.test.tsx` + caso de deload en `useBlockSuggestions.test.ts`)**

```tsx
it('mensaje neutro usa la clave nueva y muestra el objetivo', () => {
  // suggestion: { messageKey: 'suggestions.increaseWeightNeutral', data: { target: 62.5, amount: 2.5, withMargin: false, capped: false }, action: { kind: 'applyWeight', targetKg: 62.5 } }
  // espera: texto con «62,5» y sin «margen»
})
it('muestra el aviso del récord cuando data.capped', () => { /* texto de workout.cappedByPr visible */ })
it('el tap aplica con targetKg', () => { /* onApply llamado con (exerciseId, 62.5) */ })
```

```ts
it('con suppressIncrease el increase no sale, pero el decrease sí (freno de deload)', () => {
  // misma entrada con objetivo 70 y series RPE 9, RIR 1 → sin increase; con RPE 10/RIR 0 → decrease presente
})
```

- [ ] **Step 2: Correr el test y verificar que falla (RED)**

Run: `npx vitest run tests/unit/components/workout/suggestionChip.test.tsx`
Expected: FAIL (clave neutra inexistente; aviso no renderizado).

- [ ] **Step 3: Implementar superficies**

- `ExerciseBlock`: el aviso `capped` sale del bloque del botón y se renderiza con `enabled && capped && nextSet` (una sola vez, aunque `suggestion === nextSet.weightKg`); el criterio del botón suma `&& !deloadActive`.
- `SuggestionChip`: `case 'suggestions.increaseWeightNeutral'` → `t(..., { weight: formatNumber(target, lang) })`; si `data.capped` → `<p className="mt-1 text-[0.65rem] text-muted">{t('workout.cappedByPr')}</p>` bajo el chip.
- `useActiveSession`: firma `useActiveSession(loadAverages, deloadActive = false)`; pasa `includeLoadSuggestions: settings.showLoadSuggestion` y `suppressIncrease: deloadActive` a `useBlockSuggestions`.
- `EntrenamientoPage`: pasa su `deloadActive` ya calculado (líneas 37-38) a `useActiveSession`.
- i18n es/en: `suggestions.increaseWeightNeutral` (es: «Tu objetivo para las siguientes series: {{weight}} kg.» / en: «Your target for the next sets: {{weight}} kg.»), `workout.cappedByPr` reescrito (es: «Estás en tu récord — superarlo es decisión tuya.» / en: «You're at your record — beating it is up to you.»), `ajustes.sugerirCargaDesc` reescrito (es: «Propone el peso de tus siguientes series según tu historial y tu PR; si cargás RPE/RIR, lo afina.» / en equivalente).
- `SessionSection`: sin cambio estructural (la descripción viene de i18n).

- [ ] **Step 4: Correr el test y verificar que pasa (GREEN)**

Run: `npx vitest run tests/unit/components/workout/suggestionChip.test.tsx` → PASS. Después `npm test` completo.

- [ ] **Step 5: Verificación completa + review + commit**

```powershell
npm run build; npm test; npm run lint
git add src/components/workout/ExerciseBlock.tsx src/components/workout/SuggestionChip.tsx src/hooks/useActiveSession.ts src/i18n/locales/es/workout.ts src/i18n/locales/en/workout.ts src/i18n/locales/es/core.ts src/i18n/locales/en/core.ts tests/unit/components/workout/suggestionChip.test.tsx
git diff --cached --name-only
git commit -m "feat: aviso de record, toggle, freno de deload y copy sin RPE (F118)"
```

---

### Task 3: Cierre — e2e, emulador y docs (118.3)

**Files:**
- Create: `tests/e2e/test_f118_sugerencia_alcanzable.py`
- Modify: `PLAN.md`, `CHANGELOG.md`

**Interfaces:**
- Consumes: todo lo de Tasks 1-2.
- Produces: F118 verificada y documentada.

- [ ] **Step 1: e2e nuevo (RED sobre main: los criterios nuevos fallan contra el código viejo)**

Reusar el arranque/seed de `tests/e2e/test_f63_suggestions.py` (siembra de historial + sesión activa) y el patrón de boot de `tests/e2e/test_f104.py` (espera del reseed antes de sembrar). Seed determinista: settings de fábrica en `meta.settings` (RPE/RIR off, `preloadLast: true`), `meta.onboardingDone: 'true'`, 2 workouts previos con 2 series de trabajo completadas a **60 kg** del ejercicio elegido (id real del seed), sin PR en `prs`. Assertions exactas:

  - antes de la primera serie: botón «Sugerido: 62,5» visible (`62.5 = roundToNearestPlate(60 × 1.025)`);
  - completar la primera serie → chip visible con **«Tu objetivo para las siguientes series: 62,5 kg»** (copy neutro, sin RPE) y **sin** «margen»;
  - borrar el peso de las series pendientes (0) y pulsar el chip → las pendientes quedan en **62.5** (no en 2.5 — el bug G5);
  - caso récord: sembrar `prs` con 60 kg → recargar → aviso **«Estás en tu récord…»** visible antes de la primera serie aunque el botón no aparezca (objetivo 60 == precarga 60);
  - con `showLoadSuggestion: false` → ninguna superficie de peso (ni botón, ni chip, ni aviso);
  - 0 `pageerror`.

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f118_sugerencia_alcanzable.py --port 5241`
Expected: GREEN con el código de Tasks 1-2 (y ROJO si se corre contra `main` sin ellas — verificar al menos una vez que los criterios fallan contra el código viejo).

- [ ] **Step 2: Emulador (118.3)**

Receta de `AGENTS.md` (desde `gymlab-app`: `npm run android:sync` → `gradlew assembleDebug` con `JAVA_HOME` al JBR → `adb install -r` → `am start` → CDP `tcp:9222`). Con settings de fábrica y el mismo seed: botón antes de la primera serie, chip tras completarla, aplicar escribe el objetivo, aviso del récord visible. Criterio: `root.children.length > 0`, textos presentes, **0 `pageerror`**. Screenshots a `%TEMP%\opencode\f118\`.

- [ ] **Step 3: `CHANGELOG.md` bajo `[Unreleased]`**

Entradas `Fixed` (G5: la acción escribe el objetivo, no el delta; G4: calentamientos fuera del motor) y `Changed` (señal por motor sin RPE; aviso del récord reformulado; toggle gobierna propuestas de peso; copy del ajuste).

- [ ] **Step 4: Marcar F118 en `PLAN.md`**

`118.1`, `118.2` y `118.3` a `[x]` y la fase a `— IMPLEMENTADA ✅` (sin borrar la sección hasta el archivo en `COMPLETED.md`, si el orquestador decide archivarla en el cierre).

- [ ] **Step 5: Review + commit de cierre**

```powershell
git add tests/e2e/test_f118_sugerencia_alcanzable.py PLAN.md CHANGELOG.md
git diff --cached --name-only
git commit -m "test: e2e de F118 (sugerencia alcanzable) y cierre de fase"
```

---

## Self-review (hecho al escribir este plan)

- **Cobertura de la spec**: regla madre y defaults intactos (Global Constraints + Step 3 de Task 1); G1 señal por motor (Step 3/4); evidencia con historial (Step 4); supresión con RPE real (Step 3); copy neutro/con margen (Step 3 + Task 2); G2 aviso siempre + en el chip (Task 2); G3 toggle (Task 2 Step 3); G4 filtro (Step 3); G5 acción absoluta (Step 5); precarga intacta (nada la toca); 118.3 emulador (Task 3 Step 2). ✔
- **Placeholders**: ninguno; contratos con nombres y tipos exactos; valores de test exactos (60 → 62.5, 62.5 − 60 = 2.5, decrease 57.5). ✔
- **Consistencia de nombres**: `LoadTarget`, `targetKg`, `buildLoadTargets`, `includeLoadSuggestions`, `increaseWeightNeutral` se usan igual en dominio, hooks, UI, tests y e2e. ✔
- **Review Focus**: las 5 líneas tienen test en la tarea dueña (Task 1) y la nota de deload queda explícitamente fuera hasta confirmación. ✔
- **Proporción**: el plan decide contratos y valores; los cuerpos de las funciones quedan para el implementador. ✔
