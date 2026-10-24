# Cuerpo y progreso — rediseño Nocturno Minimal (F132.5)

Objetivo: migrar `/peso-corporal`, `/cuerpo`, `/progreso-fotos` y `/progreso-fotos/comparar` al lenguaje Nocturno Minimal con un héroe por pantalla, hairline en vez de tarjetas y estados vacíos honestos. Rama `132.5-cuerpo-progreso` (worktree aislado por pedido de multisesión). Runner: `vitest` (`npm test`) + `npm run build`; e2e con Playwright Python. Spec: `docs/superpowers/specs/2026-10-24-cuerpo-progreso-design.md`. Mockup aprobado: `.superpowers/brainstorm/cuerpo-progreso-20261024/content/cuerpo-progreso-v1.html`.

## Specs

- **S1 — Alcance y navegación.** Las cuatro rutas del bloque se rediseñan en su lugar; no se crea ruta hub. `/cuerpo` suma dos filas hairline al final hacia `/peso-corporal` y `/progreso-fotos`. `/mas` y sus labels no cambian.
- **S2 — Peso: héroe y rango.** `StatsHero` con «Último registro · {fecha}» + peso + delta; `RangePills` 30 d / 90 d / Todo arriba del héroe. El rango filtra héroe, gráfica, stats e historial. El delta se etiqueta con el rango («en 30 d», «en 90 d», «desde el inicio»).
- **S3 — Peso: registro inline.** Input `DecimalInput` vacío (placeholder «Hoy: {peso}» o «Peso») + «Guardar»/«Actualizar»; upsert por fecha local. Sin sheet ni FAB.
- **S4 — Peso: gráfica, stats e historial.** Área de 110 px sin grilla, ejes mínimos de 3 marcas, `aria-label` con resumen; `StatsStatRow` Mín./Máx./Cambio; `WeightHistoryTimeline` sin tarjeta, filas de 46 px, paginación 10 + «Ver más», borrado 44 px.
- **S5 — Cuerpo: mapa y escala.** `MuscleDummy` redibujado con silueta reconocible y regiones orgánicas; escala `fresh` neutro, `warm` dorado 28 %, `fatigued` dorado 55 %, `sore` rojo 35 %, sin dato base. Selección en `gold-bright`. Verde no se usa para fatiga.
- **S6 — Cuerpo: detalle y vínculos.** Músculo localizado + estado i18n + días desde el último entreno; hasta 5 ejercicios con link; sin selección, hint. Filas «Más de cuerpo» hacia peso y fotos. `InfoTip`/sheet breve con los umbrales (18/48/72 h).
- **S7 — Fotos: héroe y captura.** Última fecha con frent/lateral/espalda 3:4 como héroe; meta `N ángulos · N fotos` y `N fechas`; «Hoy» con tres slots de captura (miniatura si ya existe, reemplazo permitido). Web: `input[type=file]`; nativo: `PhotoSourceSheet`.
- **S8 — Fotos: timeline y sheet.** Filas hairline de 64 px con fecha, `N fotos`, tres miniaturas y `data-photo-date`; paginación 10 + «Ver más». `PhotoDateSheet` con fotos grandes, «Guardar en galería» (`aria-label` exacto), «Eliminar fecha» danger y cierre por Escape/backdrop.
- **S9 — Comparar.** Dos `<select>` nativos estilizados como filas hairline (chip A/B, fecha formateada, chevron); ángulo y modo en botones de 44 px con `aria-pressed`; dividida/alternar con los textos y el badge `A ·`/`B ·` actuales; delta de peso A→B solo si ambas fechas tienen registro.
- **S10 — i18n.** Todas las cadenas nuevas en es/en. Se elimina `fatigueLabel` hardcodeado de `domain/muscleFatigue.ts` y se usan claves `cuerpo.fatiga.*`; `MuscleDummy` usa `localizeMuscleGroup(id, lang)`.
- **S11 — A11y y temas.** Touch ≥ 44 px, foco visible, `aria-pressed`/`aria-label` en segmentados y charts, `prefers-reduced-motion`; funciona en noche/día y 6 paletas usando solo tokens.
- **S12 — Dominio y tests.** `domain/bodyProgress.ts` con `weightSummary`, `weightDeltaBetween`, `fatigueCounts`, `sortPhotosByDateDesc`; tests rojo→verde. Tests de componente de héroe, timeline, mapa y delta. E2E nuevo `test_f132_5_cuerpo_progreso.py`; actualizar `test_f120w5_fotos_paginadas.py` y `test_f106_guardar.py`.
- **S13 — Invariantes.** `PesoCorporalPage` conserva `useAchievementsData` + `bodyWeights` + `useBodyWeightMutations` (sin `useBodyWeight()`); `CuerpoPage` conserva `useAchievementsData()` + `lastTrainedByMuscle(workouts, completedSets, exerciseMuscles)`; las rutas de fotos conservan `useProgressPhotoList`. `test_f120DataSharing` debe seguir verde.
- **S14 — Documentación y entrega.** `PLAN.md` marca 132.5; `CHANGELOG.md` con la entrada; `docs/design/README.md` actualiza estado; `NOCTURNO-MINIMAL.md` §21. Commits work-unit por pantalla + cierre, Conventional Commits, review RDD antes de commitear, sin push.

## Tasks

- **T0 — Spec y doc ODD.** Estado: hecho. Commit `903fc2e3`.
- **T1 — Dominio + tests.** `src/domain/bodyProgress.ts`, escala en `muscleFatigue.ts`/`muscleColors.ts`; `tests/unit/domain/bodyProgress.test.ts` (20 casos). Estado: hecho. Commit `26a621a3`.
- **T2 — Peso corporal.** `WeightHero`, `WeightEvolution`, `WeightHistoryTimeline`, `PesoCorporalPage`; i18n; tests de componente. Estado: hecho. Commit `0ce0c87b`.
- **T3 — Cuerpo.** `MuscleDummy` redibujado + `CuerpoSelected` + `CuerpoLinks` + `CuerpoPage`; i18n; tests. Estado: hecho. Commit `cee10134`.
- **T4 — Fotos.** `ProgressPhotosHero`, `ProgressPhotosCapture`, `ProgressPhotosTimeline`, `PhotoDateSheet`, `ProgressPhotosPage`; i18n; tests. Estado: hecho. Commit `ddb01a93`.
- **T5 — Comparar.** `ProgressPhotosComparePage` + `ProgressPhotosCompareRoute` (bodyWeights); i18n; test de delta. Estado: hecho. Commit `69c1a9dc`.
- **T6 — E2E.** Nuevo `test_f132_5_cuerpo_progreso.py`; actualizar `test_f120w5_fotos_paginadas.py` y `test_f106_guardar.py`; verificar F106.1, F106.2, F93#5, F93#23, F103 y perf. Estado: hecho (F103 falla por reset de DB también en `main`). Commit `d3490815`.
- **T7 — Verificación, docs y review.** `npm test`, `npm run build`, e2e; `PLAN.md`, `CHANGELOG.md`, `docs/design/README.md`, `NOCTURNO-MINIMAL.md` §21; review nativo por candidato. Estado: hecho (cierre documental; ver Log).

## Log

- **L1 (2026-10-24, pedido del usuario, verbatim):** «activa multisesion,vamos a hacer 132.5 — Cuerpo y progreso, si necesitas preguntarme usa grill me y muestrame los ejemplos en mockups».
- **L2 (2026-10-24, aprobación del grilling, verbatim):** «si , lo recomendado». Congela Q1–Q7 de la spec y autoriza implementación.
- **L3 (2026-10-24, mockup y spec):** worktree `.worktrees/132.5-cuerpo-progreso` (rama `132.5-cuerpo-progreso`, base `0beebe65`). Mockup v1 con 4 pantallas + estados vacíos en `.superpowers/brainstorm/cuerpo-progreso-20261024/content/cuerpo-progreso-v1.html`; spec y plan commiteados en `903fc2e3`.
- **L4 (2026-10-24, implementación T1–T6):** dominio `bodyProgress` (20 casos rojo→verde); peso con héroe/rango/historial (`0ce0c87b`); cuerpo con `MuscleDummy` redibujado, escala nueva, `fatigueCounts` y vínculos (`cee10134`); fotos con héroe/slots/timeline/sheet (`ddb01a93`); comparador con delta de peso (`69c1a9dc`); e2e nuevo + `data-muscle` (`d3490815`). Decisiones de implementación: el rango del peso también filtra el héroe (la verdad viene de la misma ventana); A del comparador es la fecha más antigua para que el delta se lea como progreso; el sheet de fecha conserva el guardado/borrado y añade `data-action` para e2e; el mapa distingue «sin datos» de «recuperado». i18n es/en completa, incluida la ayuda `cuerpoFatiga`.
- **L5 (2026-10-24, verificación):** `npm test` **189 archivos / 1814 tests**; `npm run build` limpio. E2E: `test_f132_5_cuerpo_progreso.py` **ALL OK** (peso con rango 30/90, mapa/leyenda/detalle, slots/timeline/sheet, comparador A/B/delta, 0 pageerror); F106.1 captura **ALL OK**; F106.2 guardar **ALL OK** (sheet + descarga + toast); F106.2 comparar **ALL OK**; F120W5 paginación **ALL OK** (10→15 filas); F93#5 historial **ALL OK**. `test_f103_smoke` falla en el reset de DB también en `main` (pre-existente); F93#23 pasa en `/peso-corporal` y mantiene fallas ajenas en agua/medidas.
- **L6 (2026-10-24, review y cierre):** los seis candidatos de código se evaluaron con `gentle-ai review assess` y dieron `medium / under_budget` (`review_due: false`), por lo que no se abrió ciclo nativo. Cierre documental: `PLAN.md` marca 132.5, `CHANGELOG.md` y `docs/design/README.md` actualizados, `NOCTURNO-MINIMAL.md` §21. Commits locales, sin push; merge a `main` pendiente de la decisión del usuario y de que las otras sesiones estén idle.

