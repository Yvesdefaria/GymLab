# F92 — Fila de ejercicio compartida: sesión, resumen e historial (diseño)

> Fecha: 2026-08-30 · Estado: aprobado · Fuente: auditoría página por página (Fase 92) · Ticket #2548

## Contexto

La auditoría detectó que la «fila de ejercicio con PR/RIR/notas» se implementa dos veces:

1. **Sesión activa** — `components/workout/ExerciseBlock.tsx` + `SetRow.tsx` (interactivo): cabecera con nombre, PR (`workout.prTexto`), nota de rutina (`workout.nota`) y filas editables (peso×reps, RPE/RIR, badge PR/CAL, ✓, borrar).
2. **Resumen/historial (detalle de sesión guardada)** — `components/workout/WorkoutDetail.tsx` (read-only, inline): `<h2>` por ejercicio + filas read-only (`#n`/CAL, `formatWeight × reps`, `rpeValor`/`rirValor`, ✓/–).

Deltas detectados: el detalle **no muestra el PR por ejercicio** ni la nota; y en cardio muestra `0 × 0` porque ignora `durationSeconds`/`distanceMeters` pese a que se guardan.

«Resumen» e «historial» son el mismo componente (`WorkoutDetail`, enrutado por `SesionPage`); el usuario confirmó que ese es el alcance de «resumen».

## Decisiones

1. Extraer una **unidad read-only** `components/workout/WorkoutExerciseBlock.tsx` (nombre + PR opcional + nota opcional + filas de serie read-only con RPE/RIR/CAL) y usarla en `WorkoutDetail`.
2. `WorkoutDetail` **empieza a mostrar el PR** por ejercicio vía `usePRs()` (misma fuente que la sesión: PR global por `exerciseId`). Sin lógica nueva.
3. **Cardio**: la fila read-only muestra **duración + distancia** cuando la serie las tenga (en vez de `0 × 0`). Helpers `formatDuration`/`parseDuration` se extraen de `SetRow` a **`src/lib/duration.ts`** compartido (TDD: `tests/unit/lib/duration.test.ts` primero).
4. `ExerciseBlock`/`SetRow` **interactivos intactos**; solo importan los helpers compartidos. Cabecera del bloque compartido se mantiene en `h2` (paridad con el detalle actual).
5. Sin claves i18n nuevas (se reutilizan `workout.prTexto`, `workout.nota`, `workout.rpeValor`, `workout.rirValor`, `workout.calentamiento`, `workout.completada`/`sinCompletar`, `workout.ejercicioNum`).

## Paquetes de trabajo

### WP1 — Helpers de duración compartidos
- `src/lib/duration.ts`: `formatDuration(seconds)` (MM:SS / HH:MM:SS) y `parseDuration(str)` (min, m:ss, h:mm:ss). Extraídos de `SetRow`.
- `tests/unit/lib/duration.test.ts` primero (rojo), luego módulo (verde).

### WP2 — Componente read-only
- `components/workout/WorkoutExerciseBlock.tsx`: props `name`, `sets`, `pr?`, `units`, `note?`. Render análogo a WorkoutDetail actual + `prTexto` + nota + rama cardio (duración `formatDuration` + distancia).

### WP3 — Refactor WorkoutDetail
- Bloque inline (l.109–159) → `{exerciseIds.map(id => <WorkoutExerciseBlock … />)}`.
- `usePRs()` para `prMap`; limpieza de imports sin uso (`formatWeight`).
- `SetRow` pasa a importar `formatDuration`/`parseDuration` de `lib/duration`.

## Criterios de éxito
- El detalle de sesión muestra PR por ejercicio cuando existe, y cardio con duración+distancia; sin regresión en la sesión activa (mismo render + helpers compartidos).
- `npx tsc -p tsconfig.app.json --noEmit` + `npm run build` + lint limpios; `npm test` verde (220 previos + nuevos helpers).
- Smoke Playwright: `/entrenamiento/:id` con workout seeded (con PR y con cardio) → 1 `h1`, bloque por ejercicio con `prTexto`, cardio con duración/distancia, 0 errores de consola.
- Un commit `refactor:` del cambio + CHANGELOG `### Changed` + tick PLAN.md:2548 `[x]` + commit `chore:`; sin push.