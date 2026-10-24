# Plan de implementación — F132.5 Cuerpo y progreso

> Spec: `docs/superpowers/specs/2026-10-24-cuerpo-progreso-design.md`
> Doc ODD: `odd/tasks/cuerpo-progreso.md`
> Mockup: `.superpowers/brainstorm/cuerpo-progreso-20261024/content/cuerpo-progreso-v1.html`
> Rama/worktree: `132.5-cuerpo-progreso` → `.worktrees/132.5-cuerpo-progreso/gymlab-app`
> Runner: `npm test` (vitest) + `npm run build`; e2e con `python tests/e2e/scripts/with_server.py`.
> Regla: todo comando corre con cwd en el worktree. Un solo escritor. Sin `git add -A`.

## Guardrails

- **RDD antes de commitear**: implementar → normalizar → `npm run build` + `npm test` (+ e2e de la
  pantalla) → ciclo de review nativo → commit work-unit. Sin push.
- **Invariantes de datos**: `PesoCorporalPage` sigue leyendo `useAchievementsData` y usando
  `useBodyWeightMutations`; `CuerpoPage` sigue con `useAchievementsData()` +
  `lastTrainedByMuscle(workouts, completedSets, exerciseMuscles)`; las rutas de fotos siguen con
  `useProgressPhotoList`. `tests/unit/hooks/f120DataSharing.test.ts` debe quedar verde.
- **No tocar** `/estadisticas` ni `BodyWeightChart` (la tab Cuerpo conserva su gráfica).
- **i18n**: cada clave nueva va en `es` y `en` en el mismo commit.
- **Stage exacto**: `git add <rutas>` nombradas; verificar con `git diff --cached --name-only`.

## T1 — Dominio + tests (rojo→verde)

Archivos:

- `src/domain/bodyProgress.ts` (nuevo).
- `src/domain/muscleFatigue.ts` (escala + quitar `fatigueLabel`).
- `src/domain/muscleColors.ts` (hex de la nueva escala + comentario).
- `tests/unit/domain/bodyProgress.test.ts` (nuevo).
- `tests/unit/domain/muscleColors.test.ts` (si algún assert cambia).

Pasos:

1. Escribir los tests de `weightSummary` (vacío, 1 registro, 30/90/Todo, mínimo/máximo, último
   fuera de rango), `weightDeltaBetween` (ambas/una), `fatigueCounts` (incluye noData) y
   `sortPhotosByDateDesc`. Observar RED.
2. Implementar `bodyProgress.ts` y la escala nueva. GREEN.
3. `npm test -- bodyProgress muscleColors` y luego `npm test`.

Verificación: `npm test` verde; `npm run build` limpio.

## T2 — Peso corporal

Archivos:

- `src/pages/PesoCorporalPage.tsx` (reescritura).
- `src/components/body-log/WeightHero.tsx` (nuevo).
- `src/components/body-log/WeightEvolution.tsx` (nuevo).
- `src/components/body-log/WeightHistoryTimeline.tsx` (restyle).
- `src/i18n/locales/{es,en}/core.ts` (`peso.*`).
- `tests/unit/components/body/weightHero.test.tsx`, `weightHistoryTimeline.test.tsx`.

Pasos:

1. Tests de componente: héroe con valor/delta/vacío; timeline 10 de 15 + «Ver más».
2. `PesoCorporalPage`: `AppHeader` + `BackLink` + rango arriba + `WeightHero` + registro inline +
   `WeightEvolution` + `WeightHistoryTimeline`; estados vacíos.
3. `WeightEvolution`: área 110 px sin grilla, ejes mínimos, `aria-label`, `StatsStatRow`.
4. `WeightHistoryTimeline`: sin `panel-flush`, filas hairline, paginación y borrado intactos.
5. i18n es/en.
6. Verificar e2e F93#5 y F93#23.

## T3 — Cuerpo

Archivos:

- `src/pages/CuerpoPage.tsx`.
- `src/components/body/MuscleDummy.tsx` (redibujo).
- `src/components/body/CuerpoSelected.tsx` (nuevo).
- `src/components/body/CuerpoLinks.tsx` (nuevo).
- `src/i18n/locales/{es,en}/core.ts` (`cuerpo.*`).
- `tests/unit/components/body/muscleDummy.test.tsx`, `cuerpoSelected.test.tsx`.

Pasos:

1. Redibujar `MuscleDummy` con silueta + regiones front/back; conservar props; escala nueva;
   leyenda i18n de 5 niveles; `localizeMuscleGroup`.
2. `CuerpoPage`: segmentado Frente/Espalda (44 px), mapa, resumen, `CuerpoSelected`,
   `CuerpoLinks`, info de umbrales.
3. `CuerpoSelected`: nombre localizado, estado + días, hasta 5 ejercicios, link a biblioteca.
4. i18n es/en.
5. Test de componente del mapa (leyenda/aria/selección) y del detalle.
6. Verificar `test_f103_smoke.py`, `test_perf.py` y 0 pageerror.

## T4 — Fotos de progreso

Archivos:

- `src/pages/ProgressPhotosPage.tsx`.
- `src/components/photos/ProgressPhotosHero.tsx`, `ProgressPhotosCapture.tsx`,
  `ProgressPhotosTimeline.tsx`, `PhotoDateSheet.tsx` (nuevos).
- `src/i18n/locales/{es,en}/features.ts` (`progressPhotos.*`).
- `tests/unit/components/photos/progressPhotosTimeline.test.tsx`.

Pasos:

1. Hero de última sesión (3:4, placeholders), meta de fotos/fechas.
2. Slots «Hoy» con miniatura/reemplazo; conservar `input[type=file]` y `PhotoSourceSheet`.
3. Timeline hairline con `data-photo-date`, paginación 10 + «Ver más».
4. `PhotoDateSheet` con guardar/eliminar; `aria-label="Guardar en galería"`.
5. i18n es/en.
6. Actualizar `test_f120w5_fotos_paginadas.py` (contar filas) y `test_f106_guardar.py` (abrir
   sheet). Mantener `test_f106_camara.py` verde.

## T5 — Comparar

Archivos:

- `src/pages/ProgressPhotosComparePage.tsx`.
- `src/pages/ProgressPhotosCompareRoute.tsx` (bodyWeights desde `useAchievementsData`).
- `src/i18n/locales/{es,en}/features.ts`.
- `tests/unit/components/photos/compareWeightDelta.test.tsx`.

Pasos:

1. Estilizar los dos `<select>` como filas hairline (select transparente encima, fecha formateada).
2. Segmentados de ángulo/modo con 44 px y `aria-pressed`; conservar textos y el badge `A ·`/`B ·`.
3. Delta de peso A→B si ambas fechas tienen registro.
4. i18n es/en.
5. Verificar `test_f106_comparar.py`.

## T6 — E2E

1. Nuevo `tests/e2e/test_f132_5_cuerpo_progreso.py`: navega las 4 rutas, siembra datos mínimos,
   verifica héroe/rango, mapa/leyenda, slots/sheet, comparador/delta y 0 `pageerror`.
2. Correr:
   ```powershell
   python tests/e2e/scripts/with_server.py tests/e2e/test_f132_5_cuerpo_progreso.py --port 5231
   python tests/e2e/scripts/with_server.py tests/e2e/test_f106_camara.py --port 5232
   python tests/e2e/scripts/with_server.py tests/e2e/test_f106_comparar.py --port 5233
   python tests/e2e/scripts/with_server.py tests/e2e/test_f106_guardar.py --port 5234
   python tests/e2e/scripts/with_server.py tests/e2e/test_f120w5_fotos_paginadas.py --port 5235
   python tests/e2e/scripts/with_server.py tests/e2e/test_f93_t5_weight_history.py --port 5236
   ```
3. `test_f103_smoke.py` y `test_perf.py` al cierre (presupuesto de tiempo; si el smoke es largo, se
   corre una vez).

## T7 — Verificación, docs y review

1. `npm test` completo y `npm run build`.
2. `PLAN.md`: marcar 132.5 y sus 4 rutas.
3. `CHANGELOG.md`: entrada `[Unreleased]` con F132.5.
4. `docs/design/README.md`: estado + filas de las 4 pantallas + mockup.
5. `NOCTURNO-MINIMAL.md` §18: anatomía, archivos, decisiones y follow-ups.
6. Review nativo por candidato (RDD) antes de cada commit; documentar linaje/resultado en el doc ODD.
7. Commits: `feat:` por pantalla + `docs:` de cierre. Sin push.

## Riesgos

- **Review nativo parkeado** por el defecto de `intended_untracked_selection` (misma clase que F104):
  si ocurre, conservar el linaje, documentarlo y no bloquear el resto del worktree.
- **Doble lectura de datos**: no usar `useBodyWeight()` en la página (rompe `f120DataSharing`).
- **E2E de fotos**: el sheet cambia el camino de guardado; actualizar el test en el mismo candidato.
- **Redibujo del mapa**: `ExerciseMuscleCard` usa `MuscleDummy` con `highlight`; no cambiar la firma
  de props y verificar el detalle de ejercicio.
