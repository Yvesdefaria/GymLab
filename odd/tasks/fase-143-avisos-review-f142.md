# Fase 143 — Avisos del review de la Fase 142

**Objetivo**: cerrar los cuatro avisos no bloqueantes del review `review-43bcc95b6855a524`: precisión del heurístico de empujes, regresión de catálogo completa y upgrades reales de Dexie. Rama `main`, sin push. Runner: `npm test` (vitest) + `npm run build`.

**Estado**: 0/4 abierta (2026-11-05).

## Specs

- **S1 (R3-002) — Un estiramiento o movilidad con `push-up` no se vuelve fuerza.** La excepción de empuje solo aplica si el nombre/slug no declara estiramiento o movilidad explícitos. `chest-push-with-run-release` sigue siendo fuerza (su `release` no cuenta como estiramiento); `incline-push-up-depth-jump` sigue fuerza. Un `push-up-stretch` sintético vuelve a `stretch` y un `push-up-mobility` a `mobility`.
- **S2 (R3-003) — Regresión de catálogo durable.** Un test compara el heurístico actual contra el heurístico anterior a F142 sobre las 873 filas del seed y las 821 del catálogo remoto (`public/catalog/exercises-v2.json`), y exige que el conjunto de slugs que cambia sea exactamente los dos empujes de pecho. Cualquier fila futura que cambie con los tokens queda detectada por CI.
- **S3 (R3-001, R3-004) — Upgrades reales de Dexie.** Con `fake-indexeddb` como devDependency, un test crea una base v19 con las dos filas en `cardio` y otra v18 con un remo y un empuje, abre la base de la app (v20) y verifica que las migraciones v19 y v20 se ejecutan de verdad. Se retiran los guards débiles `db.verno` de los tests de migración.
- **S4 — Verificación.** Suite completa, build y review nativo del candidato.

## Tasks

- [x] T1 (S1) — Tests RED de estiramiento/movilidad con push-up + ajuste de `exerciseCategory`. `inline`
- [x] T2 (S2) — Test durable de diff de catálogo seed + remoto contra el heurístico previo. `inline`
- [x] T3 (S3) — `fake-indexeddb` + tests de upgrade real v18→v19→v20; retirar guards `db.verno`. `inline`
- [x] T4 (S4) — Suite + build + assess/review + commits + docs. `inline`

## Log

- **L1 (verbatim)**:
  > dale hazlo, los avisos
- **L2 (2026-11-05) — Fase abierta.** Los cuatro avisos vienen del review `review-43bcc95b6855a524` (F142): R3-001 upgrade real de Dexie no testeado, R3-002 `PUSH_STRENGTH_RE` más amplio que S2, R3-003 falta test durable de diff de catálogo, R3-004 guards de versión débiles.
- **L3 (2026-11-05) — Implementación.** RED observado en el caso `push-up-stretch` (daba fuerza). Cambios: `STRETCH_CORE` compartido y `EXPLICIT_STRETCH_RE` sin `release`; la excepción de empuje exige que no haya movilidad ni estiramiento explícitos. Test durable `cardioTokenRegression.test.ts` (seed 873 + remoto 821; diff exacto de dos slugs). `fake-indexeddb@6.2.7` como devDependency y `dexieUpgrades.test.ts` con upgrades reales v19→v20 y v18→v19→v20; retirados los dos `db.verno` débiles. Suite **245 archivos / 2251 passed + 1 skipped**; build exit 0.
- **L4 (2026-11-05) — Verificación independiente.** `gentle-ai-verify`: S1 y S2 **MET** con pruebas de mutación (un tercer slug rompe el test de diff; vaciar el callback v20 deja las filas en cardio). Encontró un **blocker**: quedaba un tercer guard `db.verno` en `f142CardioTokenAudit.test.ts` y su import `db` sin usar; se retiró. Se incorporó su test de paridad `f143HeuristicParity.test.ts` (873/821 filas, 0 cambios contra F142). Suite final **246 archivos / 2254 passed + 1 skipped**; build exit 0. Sin push.
