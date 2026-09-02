# F93 #22 — Sesión rápida del home (QuickTemplates): enlazar a ejercicios reales del catálogo (diseño)

> Fecha: 2026-09-03 · Estado: aprobado · Fuente: auditoría F65 QuickTemplates · Ticket #22

## Contexto

`QuickTemplates` (bloque al final del home `/`, `src/components/quick/QuickTemplates.tsx` + `src/domain/quickTemplates.ts`) ofrece 5 plantillas de «sesión rápida» de 8–15 min en 3 categorías (express/stretch/mobility). Al tocarlas, arranca una sesión libre vía `loadRoutineDay` con sets **sintéticos**: `exerciseId: -(i+1)` (negativo, no existe en el catálogo) y `exerciseName` traducido del `nameKey`.

**Problema de valor percibido**: como los `exerciseId` son negativos, la sesión activa **no resuelve** el ejercicio contra el catálogo (`slugFor`/`categoryFor` en `useActiveSession.ts` hacen `map.get(exerciseId)` → `undefined`). Consecuencias:
- El modal de técnica (`TechniqueChecklist`) y la ficha del ejercicio no funcionan (sin `exerciseSlug` real).
- El ejercicio no cuenta en estadísticas/PR/historial reales.
- El MET cardio (`resolveMet`) cae siempre en `generic`.

**Decisión de producto (usuario)**: **mantener la función y enlazar los templates a ejercicios reales del catálogo**, usando ejercicios existentes de peso corporal (preferentemente «sin material») que hagan una función parecida a los originales hardcoded. Al usar ids reales, cada ejercicio se muestra en su **categoría natural** resolvida del catálogo (strength → fila peso×reps; cardio → CardioTracker), aceptando que la «sesión rápida» deja de ser timer puro de duración y pasa a una sesión con ejercicios categorizados correctamente (esto contabiliza en historial/PR).

## Decisiones

1. `QuickTemplateExercise` gana el campo `exerciseId: number` (id real del catálogo). Se elimina el uso del `id` string sintético como ejercicio.
2. Se re-mapean las **5 plantillas** a ejercicios reales existentes (peso corporal / sin material, función parecida) — mapeo detallado en «Mapeo de plantillas».
3. `quickTemplates.ts` declara las plantillas con `exerciseId` real.
4. `QuickTemplates.tsx`:
   - `builtInTemplates` ya no normaliza con `id` negativo: los sets se construyen con `exerciseId: ex.exerciseId` (real) y `exerciseName` resuelto del **catálogo real** (vía `useExerciseCatalog`, no del `nameKey` traducido), con fallback al `nameKey` localizado si el id no está en el catálogo.
   - Se mantiene el selector de categoría, el render de tarjetas, `totalMinutes`, `durationSeconds` (se conservan aunque la sesión los use según categoría) y las claves i18n actuales.
5. Sin cambios en modelo de datos, repositorio/Dexie ni store (bounded a domain + componente). Sin claves i18n nuevas.
6. No se crean ejercicios nuevos ni fichas: se reutiliza el catálogo existente.

## Mapeo de plantillas (todos ejercicios existentes, peso corporal/sin material, función parecida)

| Plantilla (categoría, min) | Ejercicio | ExerciseId real | Función parecida al original |
|---|---|---|---|
| full-body-express (express, 15) | Flexiones | 42 | pushups |
| | Sentadilla (peso corporal) | 1086 | squats |
| | Plancha | 36 | plank |
| | Zancadas | 32 | lunges |
| | Salto de estrella | 1741 | burpees → cardio explosivo |
| | Escalador | 1438 | mountain climbers |
| core-express (express, 12) | Plancha | 36 | plank |
| | Bicicleta en el aire | 1006 | bicycle crunches |
| | Elevaciones laterales de pierna | 1625 | leg raises |
| | Escalador | 1438 | mountain climbers |
| full-body-stretch (stretch, 10) | Estiramiento de cuádriceps a 4 patas | 1007 | quad stretch |
| | 90/90 isquiotibial | 1001 | hamstring stretch |
| | Superman | 1754 | chest opener / espalda |
| | Inchworm | 1311 | child pose (flow/flexibilidad) |
| | Isométrico de cuello frontal/espalda | 1335 | neck roll |
| pre-sleep-stretch (stretch, 8) | Cruces tumbado | 1412 | supine twist |
| | Superman | 1754 | cat-cow / espalda |
| | Círculos de rodilla | 1363 | cat-cow (movilidad suave) |
| | Elevaciones de piernas posterior | 1541 | legs up / leg raises |
| joint-mobility (mobility, 12) | Círculos de rodilla | 1363 | ankle circles |
| | Círculos de cadera de pie | 1719 | hip circles |
| | Elevaciones laterales de pierna | 1625 | movilidad pierna |
| | Círculos de muñeca | 1814 | wrists circles |
| | Isométrico de cuello lateral | 1336 | neck roll |

> Nota: categorías esperadas según `detectCategory` (exerciseCategory.ts) y `categoryFor` (useActiveSession): `star-jump` y `air-bike` → **cardio** (CardioTracker); `all-fours-quad-stretch` → **stretch**; el resto → **strength** (fila peso×reps). Esto es lo deseado.

## Paquetes de trabajo

### WP1 — TDD: dominio + test del mapeo
- `src/domain/quickTemplates.ts`: `QuickTemplateExercise` gana `exerciseId: number`; re-mapeo de las 5 plantillas.
- `tests/unit/domain/quickTemplates.test.ts` (primero, rojo): verifica que cada plantilla tiene ≥1 ejercicio, que todos los `exerciseId` son > 0 (reales) y que las 3 categorías están cubiertas. Luego verde.

### WP2 — Componente: inicio de sesión con ids reales
- `src/components/quick/QuickTemplates.tsx`:
  - `builtInTemplates` → segmento de inicio usa `ex.exerciseId`.
  - `useExerciseCatalog()` para resolver `exerciseName` real por id (fallback al `nameKey` localizado).
  - Mantener `startTemplate`/navegación a `/entrenamiento/activo`.

### WP3 — E2E + verificación
- `tests/e2e/test_f93_t22_quick.py` (patrón #18): en `/`, filtro/chips presentes; tocar «full-body-express» → navega a `/entrenamiento/activo`; la sesión muestra ejercicios con nombres reales del catálogo (ej. «Flexiones», «Plancha») y sin «Ejercicio -1»; 0 errores de consola.
- `npx tsc --noEmit` + `npm run build` + `npm run lint` + `npx vitest run` → verdes.
- CHANGELOG `### Changed` + tick PLAN.md:2620 `[x]` + commit único `feat:` sin push.

## Criterios de éxito
- Al iniciar cada plantilla, la sesión activa muestra los ejercicios con **nombres reales del catálogo** y `exerciseId` positivos (resolubles por `slugFor`/`categoryFor`), de modo que el modal de técnica y las estadísticas funcionan.
- Sin regresión: selector de categoría, tarjetas y navegación siguen funcionando; `durationSeconds`/`totalMinutes` se conservan en los datos.
- tsc + build + lint + tests + Playwright limpios (sin warnings nuevos).
