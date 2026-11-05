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

- [x] T1 (S1) — Test de equivalencia en `weeklySummary.test.ts` + simplificación del guard. `inline`
- [x] T2 (S2) — Rename del campo del hook y consumidores. `inline`
- [x] T3 (S3) — Caso de un solo día en `streak.test.ts` + forwarder inline. `inline`
- [x] T4 (S4, S5) — Parser CSV: recuperación por línea, línea física y `completed` vacío. `inline`
- [x] T5 (S6) — Tests de solo-calentamientos en `sessionImage.test.ts`. `inline`
- [x] T6 — Suite + build + review + commits + docs. `inline`

## Log

- **L1 (verbatim)**: «follows, dale»
- **L2 (2026-11-05) — Fase 140 cerrada.** T1–T6 implementadas y verificadas. Tests nuevos: equivalencia `summary.volume` vs serie, racha de un día, CSV con comillas sin cerrar + línea física + `completed` vacío, tarjeta solo-warmups. Rename `allSetsByExercise` y forwarder inline. Suite 241 archivos / 2204 passed + 1 skipped; build limpio. Review `review-9c23cad7798db0ee` (readability + reliability): **approved**; avisos no bloqueantes: el fallback línea por línea pierde un campo multilínea si el archivo además tiene una comilla sin cerrar, `csv.trim()` desplaza la línea física si hay líneas en blanco iniciales, `CsvParse.records` queda sin usar en el camino de recuperación, el guard de la home se aflojó a un prefijo que también matchea `volumePct` y el resolver que devuelve `undefined` no tiene test. Commits `0d6911c8`, `5d309287`, `c25270d4`, `147df9de`, `4c9d8e4e`; docs de cierre.
