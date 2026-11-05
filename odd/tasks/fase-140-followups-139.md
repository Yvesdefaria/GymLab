# Fase 140 — Follow-ups de la Fase 139 (robustez)

**Objetivo**: cerrar los avisos no bloqueantes del review de la Fase 139 con cambios acotados de tests y robustez, sin tocar métricas ni producto. Rama `main`, sin push. Runner: `npm test` (vitest) + `npm run build`.

## Specs

- **S1 — Volumen de la home con prueba conductual.** El volumen semanal de `EntrenarPage` (`weeklySummary.volume`) debe coincidir con la última barra de `buildWeeklyVolumeSeries` en semana vacía, solo semanas previas y borde domingo/lunes. El guard de código fuente deja de exigir el texto exacto `weeklySummary?.volume ?? 0` y conserva solo la comprobación estructural de que no se reconstruye la serie.
- **S2 — Nombre del agrupador del historial.** El hook `useRecentLoadHistory` devuelve `allSetsByExercise`, no `setsByExercise`; los consumidores lo destructuran con ese nombre. El prop de dominio `setsByExercise` se mantiene.
- **S3 — Racha diaria de un solo día.** `longestDailyRun(['YYYY-MM-DD'])` devuelve 1.
- **S4 — CSV con comillas sin cerrar.** Un archivo con una comilla sin cerrar no debe tragarse las filas siguientes: el parser cae a un parseo línea por línea, reporta el problema y conserva las filas válidas posteriores. Los errores de archivos multilínea reportan la línea física de inicio del registro, no el ordinal.
- **S5 — `completed` vacío.** Una celda `completed` vacía se interpreta como `true` (compatibilidad con el comportamiento previo); los valores conocidos se normalizan y un valor no vacío desconocido sigue siendo error de línea.
- **S6 — Tarjeta con solo calentamientos.** Un ejercicio cuyas únicas series completadas son calentamientos no aparece en `prepareSessionImage`; una sesión solo con calentamientos devuelve lista vacía. `sets` sigue contando solo series de trabajo.

## Tasks

- T1 (S1) — Test de equivalencia en `weeklySummary.test.ts` + simplificación del guard. `inline`
- T2 (S2) — Rename del campo del hook y consumidores. `inline`
- T3 (S3) — Caso de un solo día en `streak.test.ts`. `inline`
- T4 (S4, S5) — Parser CSV: recuperación por línea, línea física y `completed` vacío. `inline`
- T5 (S6) — Tests de solo-calentamientos en `sessionImage.test.ts`. `inline`
- T6 — Suite + build + review + commits + docs. `inline`

## Log

- **L1 (verbatim)**: «follows, dale»
