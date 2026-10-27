# F123 — Selector de ejercicios con paridad de lista con el catálogo (orden + rail A–Z)

Objetivo: que el selector de ejercicios (sesión / rutina / objetivos) ordene alfabéticamente y muestre los encabezados de letra + rail A–Z, igual que `/ejercicios`. Rama: `main` (sin worktree). Entrega: commit sin push. Runner: Playwright Python (`tests/e2e/`).

## Specs

- **S1** — El selector de ejercicios ordena alfabéticamente con el dominio existente (`sortAndGroupExercises`, `src/domain/exerciseIndex.ts`) y renderiza encabezados de sección (letra grande + «{letra} · N ejercicios») con la misma estructura que el catálogo. Cita del usuario: «el menú de agregar un ejercicio y el catálogo es diferente, no está ordenado alfabéticamente ni tiene el buscador por letra»; regla: «estas inconsistencias no deben pasar en la app».
- **S2** — El selector monta el mismo `AlphaRail` con letra activa actualizada al hacer scroll, letras presentes habilitadas y ausentes deshabilitadas; tocar una letra salta a su sección.
- **S3** — Con «Comunes» activo la lista sigue alfabética (paridad con el catálogo, que ya lo fija en `test_f93_t19_alpha_library.py`).
- **S4** — Fuera de alcance (decidido con el usuario 2026-10-16): NO se toca la barra de filtros, favoritos, recientes, estados de carga/vacío, ni el comportamiento de equipamiento (diferencia deliberada documentada en `ExerciseFilterBar`); NO se agrega la barra sticky de letra grande (es propia de la página del catálogo).

Checks: e2e nuevo `tests/e2e/test_f123_selector_alfa.py` (paridad con el catálogo) + regresión `test_f98_picker_catalog.py` + `npm run build` + `npm test`.

## Tasks

- **T123.1** — Diseño/alcance (S1–S4): ✅ decidido con el usuario (2026-10-16), registro en Log. Sin commit (no hay spec separada: fix acotado).
- **T123.2** — Implementación (`src/components/workout/ExercisePicker.tsx`) + e2e de paridad + doc/changelog/PLAN: ✅ cerrada (2026-10-16).
  - Implementado: secciones `sortAndGroupExercises` + filas mixtas cabecera/ejercicio (36/64/8) + rail A–Z con letra activa y salto; sin tocar filtros/recientes/estados/equipamiento.
  - RED (2026-10-16): `test_f123_selector_alfa.py` rojo antes de implementar — sin rail (`R2a/R2b`), primera fila distinta al catálogo (`'Press de pecho con barra'` vs `'3/4 abdominal'`, `R1`), «Comunes» en orden canónico (`'Sentadilla con barra'`, `R4`).
  - GREEN (2026-10-16): e2e ALL OK (paridad de primera fila, letras S/X habilitada/deshabilitada, salto a «S» con encabezado + `aria-current`, «Comunes» alfabético con rail, 0 errores de consola).
  - Verificación: `npm run build` limpio; `npm test` 163 archivos / 1637 tests; regresiones `test_f98_picker_catalog.py`, `test_f93_t19_alpha_library.py`, `test_f98_enter_chain.py` ALL OK; smoke visual (capturas en `tests/screenshots/f123/`).
  - Review nativo `review-0583b3111ed8a76b` (medium, lente reliability): **approved + acknowledged (authority burned)**, 0 correcciones; 3 advisories informativos → `123.followups` (PLAN): guard del `getItemKey`, cobertura unit de la lógica pura y bordes (rail vacío, encogimiento por búsqueda/favoritos).
  - Commits: `ebc7ca0` (feat + e2e + CHANGELOG, 3 archivos) y `ef865e4` (docs: archiva F123 en COMPLETED.md, Era 11). Sin push.
- **T123.F** — Follow-ups del review (123.F / opc P3): ✅ cerrada (2026-10-16).
  - Guard del `getItemKey` (`rows[index]?.key ?? index`, como `estimateSize`).
  - Índice renderizable extraído a dominio compartido: `alphabetFor`, `buildAlphabetRows`, `letterOffsetsFromRows`, `letterAtOffset` + `INDEX_HEADER_HEIGHT/ROW_HEIGHT/GAP` en `src/domain/exerciseIndex.ts`; el selector los consume (se retira la lógica inline y el tipo `Row` local).
  - TDD: 9 tests unit nuevos (RED: `buildAlphabetRows is not a function` → GREEN 20/20) y bordes e2e R5–R7 (eñe en el rail; búsqueda «zzzz» → sin filas ni rail; «sentadilla» → encogimiento con S habilitada y B deshabilitada; limpiar restaura la lista).
  - Verificación: `npm run build` limpio; `npm test` **163 archivos / 1646 tests**; e2e f123 R1–R7 ALL OK; regresión `test_f98_picker_catalog.py` ALL OK (server caliente).
  - Review `review-6dd3e5a423330734` (medium, lente reliability declarada vía `--lenses`): approved + acknowledged (authority burned); 1 advisory informativo (el fallback del `getItemKey` sin test que lo pinee) → `123.F-2` en PLAN.
  - Commits: `9d0183ec` (refactor + tests + CHANGELOG) y `a6d8b806` (docs: PLAN). Sin push.
  - Gotchas operativos de la sesión: (a) el wait casero de puerto (`New-Object Net.Sockets.TcpClient` en loop PowerShell) cuelga el shell de OpenCode — para regresiones, levantar el server aparte y calentarlo con un script, luego `with_server` lo reutiliza; (b) la extensión Console Ninja estaba enganchada a Vite (resultado: "ready in 7598ms") y probablemente agrava el arranque en frío que rompe `networkidle`.
- **T123.F-2** — Advisory del review de 123.F (opc P3): ✅ cerrada (2026-10-19).
  - La clave de fila del virtualizador se deriva en `alphabetRowKeyAt(rows, index)` (`src/domain/exerciseIndex.ts`), con fallback al propio índice fuera de rango; `ExercisePicker` y `EjerciciosPage` la usan (el catálogo deja de tener la variante que lanzaba).
  - TDD: 2 tests unit nuevos (RED `alphabetRowKeyAt is not a function` → GREEN 22/22 en `exerciseIndex.test.ts`).
  - Verificación: `npm test` **163 archivos / 1652 tests**; `npm run build` limpio; `review assess` medium / `under_budget` (sin review nuevo).
  - Commit: `ff910f63` (refactor + tests + CHANGELOG + PLAN). Sin push.

## Log

- **L1 (2026-10-16)** — Pedido del usuario, verbatim: «haz la fase 123, si necesitas preguntame».
- **L2 (2026-10-16)** — Exploración: catálogo ordena con `sortAndGroupExercises` y monta `AlphaRail` (`EjerciciosPage.tsx:154,384`); selector renderiza `filterExercises` sin orden alfabético ni rail (`ExercisePicker.tsx:129-132`). Diferencias de filtro de equipamiento entre superficies: deliberadas y documentadas en `ExerciseFilterBar.tsx:16-19`.
- **L3 (2026-10-16)** — Decisión del usuario (opción elegida, verbatim): «Paridad de lista (Recomendado)» → orden + encabezados + rail; sin barra sticky de letra grande; sin tocar equipamiento/estados.
- **L4 (2026-10-16)** — Engram (MCP) rate-limited (cuota Gemini agotada hasta ~5 h): espejo pendiente en el momento; resuelto al cierre (memoria `c0fefe58-aa46-4ad7-8fa0-aa6dabba0562`, tipo episodic).
- **L5 (2026-10-16)** — Cierre validado por el usuario, verbatim: «ESTA TODO BIEN, documenta y pasa a completed». Antes de confirmar revisó la paridad visual selector↔catálogo y aceptó las diferencias restantes (modal vs página, fila de chips «Equipo», «Recientes», sticky de letra grande y chevron del catálogo). Fase 100% cerrada y archivada.
- **L6 (2026-10-16)** — Pedido del usuario, verbatim: «haz el follow up». Se ejecuta `123.F`: guard + dominio compartido + tests unit + bordes e2e, review `review-6dd3e5a423330734` approved + acknowledged (authority burned) con 1 advisory informativo → `123.F-2`; commits `9d0183ec` + `a6d8b806`, sin push.
- **L7 (2026-10-19)** — Pedido del usuario, verbatim: «termina esto:123.F-2 (opc, P3) — Advisory del review de F123.F: el fallback del getItemKey (índice fuera de rango) no tiene test que falle si se vuelve a la forma que lanza; pinear por conducta (test de componente) o mover la derivación de la clave al helper de dominio ya testeado.». Se elige la segunda vía: `alphabetRowKeyAt` en el dominio + 2 tests; `ExercisePicker` y `EjerciciosPage` lo consumen. `review assess` medium/under_budget.
