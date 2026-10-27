# Cálculos Fase 0 — PR como hecho, warmups fuera y métricas con un solo dueño

Objetivo: que ningún número visible de entrenamiento salga de dos fuentes distintas. Rama: `main` (sin worktree). Entrega: commits work-unit sin push. Runner: Vitest (`npm test`) + build real (`npm run build`).

## Specs

- **S1** — Un PR es un **hecho**: el mayor peso levantado por ejercicio y por cantidad de repeticiones, para reps `1..12`, solo con series de trabajo completadas. No se guarda `estimated1RM` en la fila; el e1RM se deriva al leer. Cita del usuario: «lo que si quiero es que este unificada la propuesta de verdad y que no me de varios datos que salen de diferentes fuentes».
- **S2** — Los warmups quedan fuera de **todas** las métricas de entrenamiento: volumen, e1RM, PR, fatiga, comparador y progresión. Decisión del usuario: «D2 para todas las métricas de entrenamiento».
- **S3** — `null` es una respuesta válida: una serie fuera del rango fiable (reps > 12, peso ≤ 0, reps ≤ 0) no estima 1RM y la UI puede mostrar «sin dato». Decisión del usuario: «ok».
- **S4** — La racha semanal se adapta al plan: `min(3, daysPerWeek)`, retroactiva. Decisión del usuario: «ok».
- **S5** — Los estándares de fuerza incluyen mujeres; no se oculta el percentil. Decisión del usuario: «incluye mujeres».
- **S6** — El peso corporal se mide en reps (`repsVolume`), separado del volumen en kg; no se inventa carga. Decisión del usuario: «ok recomendado».
- **S7** — Orden de ejecución: verificar/commitear H1/H2/H3/H5; fixture + tests de caracterización + contrato; migración del modelo de PR y de la política de warmups; H6/H7/H10; percentiles femeninos. Decisión del usuario: «q8 orden recomendado» y «ok dale con tus recomendaciones».
- **S8** — openGym es AGPL-3.0: las ideas se reimplementan, el código no se copia.

## Tasks

- **T1** — Verificar y commitear H1/H2/H3/H5. ✅ `df7631f7` (12 archivos, suite 1889/1889, build exit 0, review assess medium/under_budget).
- **T2** — Fixture + tests de caracterización + contrato de métricas. ⏳ **parcial**: fixture de migración v15 (`tests/e2e/fixtures/migration-seed.html`) y tests de borde (PR, warmups, volumen, rebuild); la suite de caracterización H1–H17 y `docs/METRICS-CONTRACT.md` quedan pendientes.
- **T3** — Modelo de PR por reps (1–12) + migración Dexie + consumidores. ✅ implementado: `PRRecord` con `++id, &[exerciseId+reps]`, `estimated1RM` derivado, `bestPRsFromSets`, migración v16/v17, `usePRs` con `prByKey`/`prMaxWeight`, UI del badge por serie. Evidencia: `npm test` 205/1909 y e2e `test_calculos_migracion_v17.py` OK.
- **T4** — `setFilters` + política de warmups + backfill de `Workout.totalVolume`. ✅ implementado: `isWorkingSet` en volumen, e1RM, volumen por músculo, RPE de deload y stats; v17 backfillea `totalVolume` a volumen de trabajo. `totalVolume` queda como caché; su eliminación es T10.
- **T5** — H6: racha `min(3, daysPerWeek)`. ✅ implementado: `weeklyTargetFor` en `streak.ts`, aplicado en `useStreak`, `EntrenarPage`, `useWorkoutSummary`, logros y deload; retroactivo. Tests de plan de 2 días y de target.
- **T6** — H7: fatiga con hora real. ✅ implementado: `lastTrainedByMuscle` devuelve `Date` (`finishedAt ?? startedAt`, fallback mediodía local) y `fatigueMap` usa `hoursSince`; `CuerpoPage` formatea la fecha local. Tests 13 h/25 h.
- **T7** — H10: restore real de backup (replace, no merge parcial). ✅ implementado: `importBackup(backup, { mode })` con `replace` (default) / `merge`; tabla ausente no se toca, tabla presente vacía se limpia; `parseBackup` rechaza schema futuro; los PRs se reconstruyen desde `workoutSets` en vez de importarse. Tests de replace, merge, PR rebuild y schema futuro.
- **T8** — Percentiles de fuerza femeninos con fuente citable. ✅ implementado: `FEMALE_STANDARDS` derivada de Strength Level 2026 (≈1M resultados femeninos por lift), `sex` en `getStrengthThresholds/Level/Percentile`; la UI oculta percentil y gauge si no hay sexo declarado. Tests femeninos de sentadilla, banca y press militar.
- **T9** — `uid`/`updatedAt` en tablas sincronizables. ⏳ pendiente (D12, antes del release).
- **T10** — Eliminar `Workout.totalVolume` y derivarlo en todos los consumidores. ⏳ follow-up: en esta fase queda como caché backfilleada por una sola función; la eliminación total toca calendario, insights y logros y se hará con su propio candidato.

## Log

- **L1 (2026-10-27)** — Pedido del usuario, verbatim: «lee los archivos sobre mejoras en doc, que son sobre las diferecias de opengym y gymlab y como mejorar gymlab, usa grill me si tienes dudas una vez hayas leido todos los archivos».
- **L2 (2026-10-27)** — Respuestas del usuario al grill, verbatim: «q1. no se dame una comparativa, lo que si quiero es que este unificada la propuesta de verdad y que no me de varios datos que salen de diferentes fuentes / q2 D2 para todas las métricas de entrenamiento / q3 no se que es h4, etc explicamelo / q4 ok / q5 ok / q6 incluye mujeres / q7 ok recomendado / q8 orden recomendado / dale».
- **L3 (2026-10-27)** — Decisión cerrada: PR = mayor peso por ejercicio y reps 1–12 (hecho), e1RM derivado, warmups fuera de todo, racha adaptativa, percentiles femeninos, peso corporal en reps separadas. Confirmación: «ok dale con tus recomendaciones».
- **L4 (2026-10-27)** — Verificación del corte H1/H2/H3/H5: `npm test` **202 archivos / 1889 tests**; `npm run build` exit 0; `gentle-ai review assess` **medium / under_budget** (untracked excluidos). Commit `df7631f7` sin push.
- **L5 (2026-10-27)** — Hallazgo documental: `COMPARATIVA-Y-PLAN-MEJORA` tenía dos números mal (`80×3` como 85,3 en vez de 84,7; «mejor récord 86,4» ignorando `100×1` = 100). Refuerza la necesidad de un oráculo y un contrato únicos.
- **L6 (2026-10-27)** — Implementación del PR como hecho y de la política única de warmups. **Migración:** `v16` borra `prs` (clave vieja) y `v17` la recrea con `++id, &[exerciseId+reps]`, agrega `exerciseAlias`, reconstruye los PRs desde `workoutSets` y backfillea `workouts.totalVolume` al volumen de trabajo. **Dominio:** `setFilters.isWorkingSet`, `calcTotalVolume` (trabajo) + `calcSessionVolume` (informativo), `rebuildPrsAndVolumes` puro, `PRRecord.estimated1RM` derivado. **UI:** `usePRs` con `prs`/`bestPrs`/`prByKey`/`prMaxWeight`; perfil cuenta ejercicios únicos; badge de PR por serie. **Verificación:** `npm test` **205 archivos / 1909 tests**; `npm run build` limpio; e2e `test_calculos_migracion_v17.py` contra una base v15 real: PR 5RM 80 (sin el warmup de 20), `totalVolume` 1200 y `exerciseAlias` presente; `review assess` **medium / under_budget**. Sin commit todavía.
- **L7 (2026-10-27)** — Segundo corte de la fase: **H6** racha adaptativa `min(3, daysPerWeek)` retroactiva; **H7** fatiga con `finishedAt ?? startedAt` y `hoursSince` (13 h en vez de 33 h); **H10** restore con `replace`/`merge`, validación de schema futuro y PRs reconstruidos; **H13** percentiles femeninos con tabla derivada de Strength Level 2026 y `sex` explícito (sin sexo no se inventa percentil). Tests nuevos en `streak`, `muscleFatigue`, `backup` y `strengthStandards`. Pendiente: `uid`/`updatedAt` (T9) y eliminar `totalVolume` (T10).
