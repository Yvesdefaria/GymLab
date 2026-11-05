# Fase 142 — Auditoría de tokens de cardio (`jump`/`run`/`ski`)

**Objetivo**: resolver los falsos positivos de `CARDIO_RE` detectados en la auditoría asociada a F139.18, con decisiones de producto tomadas caso por caso. Rama `main`, sin push. Runner: `npm test` (vitest) + `npm run build`.

**Estado**: 0/4 abierta (2026-11-05).

## Specs

- **S1 — `chest-push-with-run-release` es fuerza.** El token suelto `run` deja de implicar cardio: solo `running` (y `treadmill`) siguen marcando cardio. El empuje de pecho es el movimiento principal y cuenta para volumen de pecho, igual que `chest-push-from-3-point-stance`.
- **S2 — `incline-push-up-depth-jump` es fuerza.** Una variante de flexión/empuje de pecho con salto no es cardio: el salto es el componente pliométrico. Regla semántica: `jump|jumping|salto(s)` + `push-up|flexión(es)` ⇒ `strength`.
- **S3 — Los saltos de pierna/glúteo siguen siendo cardio.** `bench-jump`, `box-jump-multiple-response`, `depth-jump-leap`, `dumbbell-seated-box-jump`, `freehand-jump-squat`, `front-box-jump`, `knee-tuck-jump`, `kneeling-jump-squat`, `lateral-box-jump`, `linear-depth-jump`, `rocket-jump`, `rope-jumping`, `scissors-jump`, `side-standing-long-jump`, `single-leg-stride-jump`, `split-jump`, `standing-long-jump`, `star-jump`, `stride-jump-crossover` y `weighted-jump-squat` conservan `cardio`; el volumen ya los excluye por F138 (`NON_VOLUME_PATTERNS`). `running-treadmill` y `trail-running-walking` siguen cardio.
- **S4 — Migración v20.** Las filas persistidas de los dos slugs de S1/S2 se corrigen de `cardio` a `strength`; la migración es idempotente y no toca saltos de pierna, cardio legítimo ni filas ya en fuerza.

## Tasks

- [x] T1 (S1, S2, S3) — Tests RED de detección y catálogo + caso de volumen de pecho. `inline`
- [x] T2 (S1, S2, S3) — Ajuste de `CARDIO_RE` y excepción semántica de flexión con salto. `inline`
- [x] T3 (S4) — Migración v20 + tests. `inline`
- [x] T4 — Suite + build + assess/review + commits + docs. `inline`

## Log

- **L1 (verbatim)**:
  > vamos a ir haciendo uno por uno, ve haciendome preguntas para solucionarlo
- **L2 (2026-11-05) — Decisiones de producto.** Caso `chest-push-with-run-release` → **fuerza**. Caso `incline-push-up-depth-jump` → **fuerza**. Los 20 saltos de pierna/glúteo → **se dejan cardio** (el volumen ya los excluye por F138; cambiar la etiqueta no suma series). `ski` no matchea ningún ejercicio del catálogo actual.
- **L3 (2026-11-05) — Implementación y verificación.** RED observado en detección/catálogo/volumen y en la migración. Cambios: `CARDIO_RE` sin `run` (solo `running`), `PUSH_STRENGTH_RE` antes de cardio/estiramiento para empujes y flexiones, migración v20 `reclassifyChestPushExercises` (solo los dos slugs, idempotente), `db.version(20)`. Verificador independiente (`gentle-ai-verify`): **S1–S4 MET**, sin blockers; diff de catálogo completo (873 filas seed + 821 del catálogo remoto) con exactamente los dos cambios esperados. Avisos: `PUSH_STRENGTH_RE` es más amplio que la regla S2 (un `push-up-stretch` sintético daría fuerza; no existe en el catálogo ni hay alta de ejercicios de usuario), el test de v19 pasó a `>= 19` y el changelog/PLAN se actualizan en este cierre. Limitación: no hay `fake-indexeddb`, así que el upgrade real de Dexie no se ejecuta en tests. Suite **243 archivos / 2248 passed + 1 skipped**; build exit 0; assess **high** por migración (escalado desde medium). Tests del verificador incorporados en `tests/unit/domain/f142CardioTokenAudit.test.ts` (29).

## Cierre

- Suite **243 archivos / 2248 passed + 1 skipped**; build limpio.
- Decisión de producto aplicada: los dos empujes de pecho son fuerza; los 20 saltos de pierna/glúteo siguen cardio.
- Pendiente: review nativo del candidato (high) y push manual del usuario.
