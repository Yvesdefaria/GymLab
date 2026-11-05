# Fase 141 — Avisos no bloqueantes de la Fase 140

**Objetivo**: cerrar los cinco avisos del review de la Fase 140 con tests y robustez acotada, sin tocar producto ni métricas. Rama `main`, sin push. Runner: `npm test` (vitest) + `npm run build`.

**Estado**: 0/5 abierta (2026-11-05).

## Specs

- **S1 — CSV: conservar los registros completos antes de una comilla sin cerrar.** Si un archivo tiene un campo multilínea válido y más adelante una comilla sin cerrar, la recuperación conserva el registro multilínea ya parseado y solo re-parsea línea por línea el tramo desde el registro roto. Las filas válidas posteriores se siguen recuperando.
- **S2 — Línea física con líneas en blanco iniciales.** Un CSV que empieza con líneas en blanco no debe desplazar el número de línea reportado en los errores: el offset se conserva al recortar el preámbulo.
- **S3 — `CsvParse.records` se usa en la recuperación.** El camino de comilla sin cerrar deja de descartar los registros completos que el parser ya produjo (consecuencia de S1).
- **S4 — El guard de la home no matchea `volumePct`.** La comprobación estructural de `EntrenarPage` exige `weeklySummary?.volume` y no debe aceptar el prefijo `volumePct`; el valor sigue cubierto por el test conductual de la F140.
- **S5 — Resolver que devuelve `undefined`.** Un resolver que devuelve `undefined` (pese al tipo `number | null`) se comporta como sin match: la serie se descarta y el nombre aparece en `unmatched`.

## Tasks

- [x] T1 (S1, S3) — Test RED de multilínea + comilla sin cerrar; recuperación con los registros previos. `inline`
- [x] T2 (S2) — Test RED de offset con líneas en blanco iniciales; recorte con `firstLine`. `inline`
- [x] T3 (S4) — Guard de la home con lookahead negativo. `inline`
- [x] T4 (S5) — Test de caracterización del resolver `undefined`. `inline`
- [x] T5 — Suite + build + assess/review + commit + docs. `inline`

## Log

- **L1 (verbatim)**:
  > verifica por donde nos quedamos en la anterior sesion y continua
  >
  > que paso?
- **L2 (2026-11-05) — Fase abierta.** Verificado el handoff `odd/tasks/sesion-2026-11-05-f139.md`: F139 18/18 y F140 6/6 cerradas, HEAD `4ef632b3`, árbol limpio salvo untracked ajenos, suite 241 archivos / 2204 passed + 1 skipped confirmada en esta sesión. Los cinco avisos del review de F140 son el único frente sin decisión de producto; la auditoría `jump`/`run`/`ski` queda pendiente de decisión.
- **L3 (2026-11-05) — Fase cerrada.** T1–T4 con RED observado en los dos casos de CSV (`conserva un campo multilínea…` y `conserva la línea física…` fallaron antes del fix). Cambios: `parseCsvRecords` acepta `firstLine` y devuelve `brokenLine`; `stripLeadingBlankLines` recorta el preámbulo conservando el offset; la recuperación usa `parsed.records` + `splitCsvLines` del tramo roto. Guard de la home con `(?!Pct)`. Test del resolver `undefined`. Suite **241 archivos / 2207 passed + 1 skipped**; build limpio (exit 0). Assess **medium / under_budget** (`review_due: false`). Commits `bfa26b1b` (parser + tests) y `5894c9b1` (guard). Sin push.

## Cierre

- Suite **241 archivos / 2207 passed + 1 skipped**; build limpio.
- Avisos de F140: los cinco cerrados. No quedan avisos nuevos.
- Pendiente fuera de esta fase: auditoría `jump`/`run`/`ski` (decisión de producto) y push manual.
