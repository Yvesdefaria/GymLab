# F81 — Cierre del import de otras apps (Strong/Hevy/JEFIT)

- **Estado**: en curso (2026-10-08)
- **Fase del PLAN**: Fase 81 — Importar datos de otras apps (POR REVISAR → cierre completo aprobado por el usuario)
- **Directorio**: `gymlab-app` (directorio normal, sin worktree)
- **Alcance**: `gymlab-app` (dominio, datos, UI, i18n, tests unit + e2e)

## Objetivo

Cerrar F81 de verdad: importar un CSV de Strong/Hevy/JEFIT debe producir **sesiones reales** (una por fecha) con sus series enlazadas con los **ids correctos**, **ejercicios resueltos contra el catálogo**, **sin duplicar** al reimportar, y con **PRs recalculados**. Eliminar el código muerto que quedó del refactor a Ajustes.

## Problema (evidencia verificada 2026-10-08)

1. **Bug crítico**: `DataSection.applyImportCSV` crea workouts y series por separado descartando el id real devuelto por `workoutRepo.create` → las series quedan colgadas o pegadas a sesiones viejas. Funciona solo en base virgen (`workoutRepo.ts:14-18`).
2. **Una "sesión" por fila de CSV** (`importParsers.ts:73-94`): un export de 40 entrenos × 12 series = ~480 sesiones de 1 serie.
3. **Sin deduplicación** aunque la spec de F81 la prometía ("no importar sesiones duplicadas").
4. `exerciseId = hashCode(nombre)` (`importParsers.ts:87`): las series no enlazan al catálogo (aparecen como "Ejercicio #N").
5. `ImportDataView.tsx` **huérfano** (sin imports; reemplazado por la sección en Ajustes en `176e148`).
6. `autoDetectAndParse` manda Hevy al parser de Strong (quirk documentado en tests) → `setNumber` siempre 1.
7. Las series importadas **no recalculan `prs`** (solo se calculan al guardar sesión).

## Diseño aprobado (usuario, 2026-10-08)

- Parser reagrupa por fecha: 1 `Workout` por día; series agrupadas por ejercicio; `setNumber` secuencial por ejercicio; `totalVolume` = suma de series completadas.
- `parseImport`/`autoDetectAndParse` aceptan resolver inyectable `(nombre) => id | null`; sin match → `hashCode` estable + nombre en `unmatched`.
- Autodetección: `exercise_name` → JEFIT, `sets` → Hevy, resto con `date`+`exercise` → Strong.
- Nuevo `src/domain/exerciseMatch.ts` (puro): índice normalizado contra `name`/`slug`/`externalId` + fallback por tokens ordenados.
- Nuevo `src/data/importWorkouts.ts` (patrón `workoutDeletion.ts`, deps inyectables): crea sesión → asigna el id real a sus series; dedup por sesión (fecha + multiconjunto exerciseId/peso/reps); recalcula PRs con `bestPRFromSets`; transacción `rw`; devuelve `{ imported, duplicates }`.
- `workoutRepo.getByDate` nuevo (interface + impl Dexie; índice `localDate` existe).
- UI: `DataSection` carga catálogo → matcher → orquestador → resumen i18n ("N importadas · M duplicadas · K sin coincidencia").
- Borrar `ImportDataView.tsx` + keys i18n huérfanas tras verificar usos.
- Tests unit (TDD) + e2e `tests/e2e/test_f81_import.py`.

## Checklist

- [x] **T1** — Reagrupar parser por fecha + fix autodetección + resolver inyectable (`src/domain/importParsers.ts`) + tests RED→GREEN. · ruta: delegado (writer único) · trigger: 2+ archivos no triviales.
- [x] **T2** — `src/domain/exerciseMatch.ts` + tests.
- [x] **T3** — `src/data/importWorkouts.ts` + `workoutRepo.getByDate` (interface + impl) + tests (ids reales, dedup, PRs).
- [x] **T4** — `DataSection.tsx` + i18n es/en + borrar `ImportDataView.tsx` + keys huérfanas.
- [x] **T5** — e2e `test_f81_import.py` + verificación completa (`npx vitest`, `npm test`, `npm run build`, e2e).
- [x] **T6** — Review RDD (candidato = diff del workspace, antes de commit) + commit sin push. · ruta: inline (orquestador).
- [x] **T7** — Post-validación del usuario: archivar F81 en `COMPLETED.md` + `PLAN.md` + `CHANGELOG.md` + registrar advisories R3-001..004 en «Seguimiento de reviews». · ruta: inline (orquestador).

## Criterios de aceptación

1. Importar un CSV multi-fecha crea una sesión por fecha con sus series enlazadas al id real (test de regresión del bug crítico).
2. Reimportar el mismo CSV no crea nada nuevo y reporta duplicadas.
3. Los ejercicios conocidos del catálogo quedan enlazados; los desconocidos se conservan (fallback) y se reportan.
4. PRs recalculados para los ejercicios afectados (mismo criterio que F98.6).
5. `ImportDataView.tsx` eliminado; sin keys i18n muertas.
6. `npm test` verde, `npm run build` exit 0, e2e F81 ALL OK.
7. Review RDD del candidato antes del commit.

## Verificación (comandos)

- `npx vitest run tests/unit/domain/importParsers.test.ts tests/unit/domain/exerciseMatch.test.ts tests/unit/data/importWorkouts.test.ts`
- `npm test`
- `npm run build`
- `python tests/e2e/scripts/with_server.py tests/e2e/test_f81_import.py`

## Review RDD (2026-10-08)

- **Lineage**: `review-55a850cd351e1fae` (medium, lente consolidada `review-reliability`, orden 0).
- **Candidato**: workspace, 13 archivos / 1152 líneas (base `823f1c6c`). Untracked intencionales: los 5 archivos nuevos (2 src + 3 tests).
- **Resultado**: **approved + acknowledged (authority burned)** — `gentle-ai.review-acknowledged/v1`.
- **Advisories NO bloqueantes** (no reabren el candidato; van a «Seguimiento de reviews» del PLAN en T7):
  - R3-001 (WARNING): el matcher se construye con el catálogo leído al elegir el archivo; si el seed aún no terminó, todo cae a `hashCode` y un reimport posterior (catálogo listo) no deduplica (firma con `exerciseId` distinto). Mitigación futura: esperar readiness del catálogo al importar.
  - R3-002 (WARNING): `handleImportCSV` async sin try/catch: un fallo de lectura de archivo o de `exerciseRepo.getAll()` no muestra nada al usuario.
  - R3-003 (SUGGESTION): el mensaje «sin coincidencia» cuenta **nombres únicos**, no series; la copy dice «series».
  - R3-004 (WARNING, pre-existing): los ids placeholder de las series se pasan a `create`; el repo Dexie los pisa con `nextId` (verificado fuera del patch congelado), pero el candidato no lo prueba.

## Progreso / evidencia

- 2026-10-08: F81 re-verificada contra código; hallazgos 1–7 confirmados; diseño aprobado por el usuario; task doc creado.
- 2026-10-08: T1–T5 implementadas por writer único (TDD RED→GREEN) y verificadas: `npx vitest` dirigidos 33/33; `npm test` 137 archivos / 1393 tests; `npm run build` exit 0; e2e `test_f81_import.py` ALL OK (2 importadas; reimport 0 importadas · 2 duplicadas; lecturas reales de IndexedDB con series ligadas a workouts existentes). Spot check del orquestador: re-run dirigido 33/33 OK.
- 2026-10-08: T6 review RDD approved + acknowledged (lineage `review-55a850cd351e1fae`).
- 2026-10-08: Commit `20596b2` del candidato exacto revisado (13 archivos, +924/−228), **sin push** (el usuario pushea).
- 2026-10-08: T7 archivo completo — commit `06fad7e` (`docs: archiva F81 (import CSV) y registra advisories del review`): F81 movida a `COMPLETED.md` (Era 11), `PLAN.md` limpio (sección eliminada, notas actualizadas) y advisories R3-001..004 en «Seguimiento de reviews» (`81.followups`). **F81 cerrada.**

## Próximo paso

Ninguno: F81 cerrada (implementación + review + commit + archivo). Queda pendiente manual del usuario: push cuando quiera (`20596b2` + `06fad7e`).
