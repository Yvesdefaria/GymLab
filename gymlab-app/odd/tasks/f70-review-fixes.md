# F70 — Correcciones de la revisión (benchmark tests de fuerza)

## Objetivo
Cerrar los 3 hallazgos de la revisión de F70: (1) tests unitarios del dominio `benchmark.ts`/`strengthStandards.ts`,
(2) chip «Re-testear» solo cuando corresponde, (3) redondeo coherente del stat del gráfico de evolución.

## Problema / Por qué
La revisión funcional de F70 en emulador (Pixel_10, Android 17) quedó **ALL OK** (0 pageerror) pero detectó:
- `src/domain/benchmark.ts` y `src/domain/strengthStandards.ts` sin tests dedicados (el repo ya tiene suite vitest).
- El chip «Re-testear» aparece en las 4 tarjetas **sin datos** (`needsRetest = latest ? shouldRetest(...) : true`).
- El stat del gráfico redondea a entero (124.0 kg) mientras la tarjeta muestra 1 decimal (123.8 kg).

## Alcance autorizado (solo estos archivos)
- `tests/unit/domain/benchmark.test.ts` (nuevo)
- `tests/unit/domain/strengthStandards.test.ts` (nuevo)
- `src/components/benchmark/BenchmarkTests.tsx` (fix chip)
- `src/components/benchmark/BenchmarkEvolutionChart.tsx` (fix stat + tooltip)
- `CHANGELOG.md` (entrada en `[Unreleased]`)

Fuera de alcance: cualquier otro archivo, refactor, cambio de UI o dependencia nueva.

## Restricciones
- Sin dependencias nuevas (no hay RTL/jsdom → los fixes de UI se verifican en emulador).
- Un solo writer. No commitear (el orquestador hace el ciclo de review + commit sin push al final).
- Comentarios en español, estilo del repo; descripciones de tests en español como el resto de `tests/unit/`.

## Tareas
- [x] T1 (delegada, writer) — Tests de `domain/benchmark.ts` → `tests/unit/domain/benchmark.test.ts`, **19 casos** (Brzycki 112.5, reps=1, guards, umbral 6 semanas con fake timers, mejora/retroceso, orden/no-mutación, getLatest).
- [x] T2 (delegada, writer) — Tests de `domain/strengthStandards.ts` → `tests/unit/domain/strengthStandards.test.ts`, **18 casos** (tablas, interpolación 85 kg, clamps 50/130, niveles en bordes, percentiles con cap).
- [x] T3 (delegada, writer) — Fix chip: `needsRetest = latest ? shouldRetest(latest.testedAt) : false` (consistente con `retestExercises`).
- [x] T4 (delegada, writer) — Fix stat del gráfico: `displayValue` sin `Math.round` + tooltip con `formatWeight`; eje Y intacto.
- [x] T5 (delegada, writer) — Verificación: vitest 2 archivos **37 tests** ✓, `npm test` **86 files / 995 tests** ✓, `npm run build` exit 0 (9.91 s) ✓. Spot check del orquestador re-corrió `npm test` → 86/995 ✓.
- [x] T6 (orquestador) — Re-verificación funcional en emulador (CDP) → **ALL OK** (APK debug del código con fixes, PID 29409): 0 chips en vacío, exactamente 1 chip con banca vencida, stat del gráfico `123.8 kg` (3 menciones, sin `124.0`), 0 pageerror. Screenshots: `tests/screenshots/f70-emulator-fixed/`.
- [x] T7 (orquestador) — Ciclo de review nativo (RDD ON global) → **APROBADO** (lineage `review-1d0f3c1ece671c3c`, riesgo medio, lente `review-reliability`, 6 paths / 290 líneas; authority quemada con `gentle-ai.review-acknowledged/v1`). Advisory no bloqueantes: `R3-001` (chip sin test automatizado) y `R3-002` (stat del gráfico sin test automatizado) — trabajo posterior, no bloquean ni re-abren este review.
- [x] T8 (orquestador) — CHANGELOG con el resultado del review + commit único sin push (stage exacto de los 6 paths del candidato).

## Ruta por tarea (ODD)
- T1–T5: **delegada directa** (un writer) — disparador: 4 archivos no triviales (2 nuevos).
- T6–T8: orquestador (verificación / estado / comando).

## Criterios de aceptación
- Suite verde con los 2 archivos nuevos; `npm run build` limpio (typecheck real).
- Emulador: sin chip en estado vacío; con banca de 8 semanas → 1 chip + aviso «Hora de re-testear»; stat del gráfico `123.8 kg`; 0 pageerror.
- CHANGELOG actualizado; commit único sin push.

## Verificación aplicable
- Unit: `npx vitest run tests/unit/domain/benchmark.test.ts tests/unit/domain/strengthStandards.test.ts`.
- Suite completa: `npm test`. Typecheck real: `npm run build` (tsc -b + vite build).
- Funcional: script CDP `f70_emulator_check.py` (emulador Pixel_10) con aserciones ajustadas a los fixes.
- TDD: sin modo strict configurado; tests de dominio = caracterización de código existente; fixes de UI sin RTL/jsdom → emulador como verificación funcional.

## Progreso
- 2026-09-22: documento creado. Revisión inicial de F70 en emulador completada (ALL OK, 0 pageerror; hallazgos registrados arriba).
- 2026-09-22: T1–T5 done (writer `general`, sesión `ses_f34c9f185ffeDaOf2FypUCBuWz`). CHANGELOG actualizado (`[Unreleased] > Fixed`). Diff: 2 M + 2 nuevos (solo los del alcance). Pendiente: T6 emulador → T7 review → T8 commit.
- 2026-09-22: T6 done (emulador ALL OK con fixes) → T7 done (**review APROBADO**, advisory `R3-001`/`R3-002` no bloqueantes, authority quemada) → T8: se modifica CHANGELOG con el resultado y se commitea sin push (6 paths exactos).

## Evidencia
- Screenshots de la revisión: `gymlab-app/tests/screenshots/f70-emulator/` (7 PNG) y `gymlab-app/tests/screenshots/f70-emulator-fixed/` (7 PNG, build con fixes).
- Script CDP: `%LOCALAPPDATA%\Temp\opencode\f70_emulator_check.py`.
- Review: lineage `review-1d0f3c1ece671c3c`, target `sha256:62db2145…`, aprobado y acknowledgement consumido (`consumed_revision: sha256:bdbb49e1…`, `authority: burned`).
- Seguimiento sugerido (advisory): cubrir los fixes de UI con un test automatizado cuando el repo incorpore jsdom/RTL o un e2e web (`tests/e2e/`) para F70.

## Próximo paso
- Delegar T1–T5 al writer y verificar T6–T8.
