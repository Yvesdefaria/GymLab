# Cierre de pendientes — «Estado verificado — 2026-10-04» (gymlab-app/PLAN.md)

**Objetivo**: cerrar los pendientes restantes de la sección `Estado verificado — 2026-10-04` de `gymlab-app/PLAN.md`, podar la tabla de filas resueltas y (al terminar) archivar/reubicar la sección para limpiar el plan.

## Verificación 2026-10-11 (read-only, código actual)

De las 9 filas de «Pendientes reales», **6 ya están resueltas** en `main` (lotes 1–10 del seguimiento de reviews):

| Fila | Estado | Evidencia |
|---|---|---|
| Reto `pr-1`/logros | ✅ | `src/domain/challenges.ts:78-97` normaliza con `dateKey` (`2fcfb79`) |
| 110a guard del thunk | ✅ | `src/lib/logger.ts:52-64` try/catch + sink tragado (`88f1aec`) |
| R3-001 mailto | ✅ | `MainActivity.java:24-29` incluye EMAIL/PHONE/GEO (`3537495`) |
| 108 follow-ups a/b/c | ✅ | `healthSyncController.ts:32-63`, `useHealthSync.ts:37-52` (`cd501db`, `af05ed8`) |
| 112b clearStorage | ✅ | `factoryReset.ts:60` llama `persist.clearStorage()` (`6828df2`) |
| 113a clamp del contador | ✅ | `SessionCarouselIndicator.tsx:20` clamp en render (`bf7e736`) |
| **102.7** entero `12,5`→`125` | ❌ | `numberGuard.ts:54-59` — el separador no se retiene en el draft |
| **F94** emojis | ❌ | `features.ts:77` es/en (💪), `WorkoutExerciseBlock.tsx:80` (✓) |
| **F118** G1/G4 | ❌ | `sessionSuggestions.ts:147` (`rpe ?? 7`), `:84-96` (sin filtro de calentamientos) |

Nota: los hashes históricos citados en COMPLETED.md (`01a3e3b`, `b0a5280`, `650224b`, `5bc10fb`, `c63d92d`) no son ancestros de HEAD; `main` tiene re-commits equivalentes (arriba).

## Tareas

- [x] **T1 — 102.7 — CERRADA (2026-10-11)**: modo entero de `sanitizeDecimalDraft` con retención del primer separador (TDD RED→GREEN; suite 1455/1455; build ✅; e2e `test_f93_t23_inputs.py` + `test_f98_enter_chain.py` ALL OK). Review nativo `review-51872f455c135a78` (medium, reliability, **0 findings**) **approved + acknowledged (authority burned)**. Commit `9e733b1` (fix, 3 archivos) + commit de docs (PLAN/CHANGELOG) de este pase. La remediación del tooling quedó aplicada y verificada (SDK `@opencode/plugin@2.0.4` + sync + reinicio; relay contract visible en shell; review end-to-end OK en OpenCode 2.0.26/Windows).

## Bloqueo de review (2026-10-11) — diagnóstico verificado

- Gate v4 (`internal/cli/review_transport_capability.go:86-109`): OpenCode admitido solo con runtime V2 **y** declaración exacta del contrato de relay; sin declaración exige runtime **V1** → con 2.0.26 instalado rechaza (`immutable_review_transport_unsupported`).
- Los plugins administrados en disco son V1 (`~/.config/opencode/plugins/opencode-review-transport.ts` importa `@opencode-ai/plugin`, sin declaración; ídem copia del proyecto en `.config/opencode/plugins/`, 2026-09-07). El asset V2 (con `RELAY_CONTRACT` + shell hook) existe solo en la fuente (`internal/assets/opencode/plugins-v2/`).
- Causa de la omisión: gentle-ai v4 no provisiona el SDK V2 cuando hay estado npm existente; entrega un **comando manual** (`npm install --save --no-audit --no-fund @opencode/plugin@2.0.4`, pineado en `opencode_sdk_manager_test.go`) — **ejecutado 2026-10-11 (exit 0)**; tras el sync los assets quedaron en V2.
- Caveat documentado por gentle-ai: review V2 probado en OpenCode 2.0.19/macOS; acá es 2.0.26/Windows (admitido por diseño, no probado).
- **Resuelto (2026-10-11)**: remedio aplicado (SDK V2 + sync + reinicio) y verificado end-to-end — shell con `GENTLE_AI_OPENCODE_RELAY_CONTRACT=gentle-ai.opencode-relay/v2-staged`, gate admitió, review del candidato aprobado (0 findings) y acknowledged. La vía legacy de untracked (`--untracked-scope=exclude --expected-untracked-inventory=…`) funcionó; el slot JSON de `--intended-untracked-selection` se destrozó en `cmd`/PowerShell (gotcha nuevo).
## Tareas restantes

- [x] **T2 — Poda de PLAN.md** — HECHA (2026-10-11): las 7 filas resueltas (6 + 102.7) salieron de la tabla; nota de poda + nota del pase 2026-10-11 en la sección; `102.7` tildado en F102.
- [ ] **T3 — F118**: G4 (filtrar calentamientos, fix chico); G1/G2 requieren diseño (brainstorming con el usuario).
- [ ] **T4 — F94**: decisión del footer (marca visual vs texto limpio) + `✓` → lucide `Check`; assets IA solo si se decide marca.
- [x] **T5 — Cierre (2026-10-11)**: sección «Estado verificado — 2026-10-04» archivada en `COMPLETED.md` (snapshot + historial + bloques resueltos) y parkings reubicados a «Pendientes de release (validación física + firma)» en PLAN.md. F94/F118 quedan vivos en sus secciones (se harán en otra sesión).

## Parkings que NO se pueden perder al archivar

- «Solo validación física» (F73, F84c, #15, F101) — referenciada desde COMPLETED.md; diferida a release.
- Ítem de firma release propia + APK compartible (pedido del usuario, 2026-10-09).
- Punetros de «Otros abiertos» con su propia sección (F100, F114–F117, #30/#22/#8, 102.8, 91.3).

## Convenciones

TDD · review nativo ANTES de commit (switch global ON) · commit sin push (convención del repo) · stage de rutas exactas · CHANGELOG al día.
