# F118 — Sugerencia de carga adaptativa alcanzable

> Objetivo: que la sugerencia de carga funcione **completa** con los settings de fábrica (RPE/RIR off) y que su acción escriba el **objetivo absoluto** (no el delta).
> Rama: `main` con commits directos por tarea (convención del repo, sin PRs; push manual del usuario) · Runner: `npm test` (Vitest) + `npm run build` (typecheck real) + e2e Playwright (librería Python)
> Spec: `gymlab-app/docs/superpowers/specs/2026-10-16-f118-sugerencia-carga-alcanzable-design.md` · Plan: `gymlab-app/docs/superpowers/plans/2026-10-16-f118-sugerencia-carga-alcanzable.md`

## Specs

- **S1** — La regla madre: el motor funciona completo sin RPE/RIR; con ellos solo afina; **nunca** bloquea una sugerencia por falta de esfuerzo; **no** se inventan datos (`rpe ?? 7` / `rir ?? 2` dejan de ser fuente de permiso); los defaults no se tocan.
- **S2** — Chip «sube»: dispara cuando el objetivo del motor supera el **top** de las series de trabajo completadas de la sesión, desde la 1ª serie, sin el guard de consistencia de F63; se oculta si las pendientes ya están en el objetivo o por encima.
- **S3** — Evidencia: exige **historial real** (`recentTopSetAvg > 0`). Con PR solo (sin historial), no aparece.
- **S4** — Con datos de esfuerzo reales y altos (RPE ≥ 8 o RIR ≤ 1) el «sube» se **suprime**; el nudge «tienes margen» solo con esfuerzo real que lo confirme; sin datos, mensaje **neutro** con el objetivo.
- **S5** — «Baja», «descanso» y sus umbrales se evalúan solo con datos reales; sin esfuerzo cargado no aparecen (no se afirma fatiga inventada).
- **S6** — Aviso del récord: se muestra **siempre** que el PR recorte el objetivo —también junto al chip— y el texto informa en vez de sonar a veto.
- **S7** — Toggle «Sugerir carga»: gobierna **toda propuesta de peso** (botón y chips subir/bajar, con el aviso incluido); calentamiento/descanso/rendimiento quedan fuera; descripción del ajuste corregida.
- **S8** — Calentamientos completados **fuera** de `completedSetsForSuggestions` (G4).
- **S9** — La acción del chip lleva el **objetivo absoluto** y rellena todas las series pendientes de trabajo (completadas y calentamientos intactos; undo existente). Bug real: prensa a 200 kg, chip «+70» → escribía 70 en lugar de 270.
- **S10** — Precarga: corre al armar la sesión (y al agregar un ejercicio); recargar en medio de una sesión no toca nada; autocompletado solo a pedido del usuario; **nunca** sobrescribir lo que escribió el usuario.
- **S11** — Re-verificación en emulador con settings de fábrica (118.3).
- **S12** — Freno con deload activo (aprobado 2026-10-16): con la semana de deload activa no se proponen subidas (ni botón ni chip de subir); el chip de bajar y los avisos de calentamiento/descanso/rendimiento quedan igual.

## Tasks

| ID | Specs | Ruta | Estado | Evidencia |
|---|---|---|---|---|
| T1 | S1–S5, S8, S9 | inline | ✅ | commit `8057051` (12 archivos, +526/−164); review `review-f2fc0272d84fcd16` approved + acknowledged |
| T2 | S6, S7, S12 | inline | ✅ | commit `062678f` (12 archivos, +161/−60); review `review-d3e23330a543b04c` approved + acknowledged |
| T3 | S11 | inline | ✅ | e2e `test_f118_sugerencia_alcanzable.py` ALL OK (7 checks) + regresión `test_f63_suggestions.py` ALL OK; endurecido en `b1d4161` (fechas relativas, escenario de deload discriminante, prueba visible del −10%); review `review-d14ed90215259b31` approved + acknowledged y `review-c272acd8cb4de712` approved + acknowledged; emulador Pixel_10 por CDP (chip 62,5 y objetivo 62.5 en vacías, 0 pageerror); suite 160/1600; build limpio |

## Follow-ups abiertos (pre-existentes, del review `review-c272acd8cb4de712`)

- **R3-001 (e2e f63)**: el PR sembrado conserva fecha absoluta (`'2026-08-01'`) mientras el historial pasó a relativo → si algún consumidor ventanea `prs`, la dependencia de calendario persiste. Fix sugerido: derivar esa fecha del escenario (1 línea) o documentar que la recencia del PR no se ventanea.
- **R3-002 (e2e f118)**: el chequeo de ausencia del chip tras completar (escenario D) muestrea una sola vez tras 700 ms fijos → con CI cargada puede dar un falso verde. Fix sugerido: esperar una señal settled/positiva en vez del sleep (patrón general de los e2e del repo).

## Follow-ups abiertos (del review `review-82b303f8a1bc5359`, del endurecimiento con esperas)

- **R3-wait-swallow**: los `wait_for` nuevos van en `try/except: pass` → un timeout no deja rastro de diagnóstico. Fix sugerido: imprimir el timeout (sin romper el flujo).
- **R3-absence-settle**: las aserciones de ausencia (toggle y deload) se asientan con sleeps fijos (1200 ms) — no prueban ausencia por sí mismos. Fix sugerido: señales positivas de settling cuando existan.
- **R3-weak-deload-selector**: el wait del deload usa `get_by_text("54", exact=False)` (substring laxo). Fix sugerido: selector exacto o scopeado a la fila.


## Lecciones operativas (para la próxima)

- **WebView de Capacitor**: `pushState` + `popstate` **no** re-renderiza la ruta de React Router; el deep-link directo (`goto` a `/entrenamiento/active`) sí carga. La sonda CDP usa eso.
- **Determinismo entre escenarios/emulador**: limpiar `prs` (u otra tabla que cambie el techo) antes de un escenario que debe aislar otra regla — el PR persistido hacía vacuos los casos «sin PR».
- **Fechas en seeds**: siempre relativas al reloj del dispositivo (`new Date()` en JS para el WebView); las fijas mueren con el calendario.
- **`npm run android:sync`** reescribe `android/capacitor.settings.gradle` y `capacitor.build.gradle` con rutas reales → **no se commitean** (revertir con `git checkout --`).


## Log

- **L1 (2026-10-15)** — Pedido original, textual: «vamos a hacer la fase 118, hazme preguntas si necesitas»
- **L2 (2026-10-15)** — Regla de diseño, textual: «solo una aclaracion, el motor debe funcionar cuando no esta rpe y rir activo, si esta activo dara una sugerencia mas acertada pero en ningun caso la app puede funcionar mal si no se registra rpe o rir en las series»
- **L3 (2026-10-15)** — Bug G5 en uso real, textual: «me he dado cuenta que este boton cuando por ejemplo te sugiere subir 70 kg a la siguiente serie y le das en lugar de hacer peso + 70, lo que hace es ponerme 70 , por ejemplo en presa para cuadriceps, estoy en 200kg y me sugiere subir 70kg en lugar de la siguiente serie rellenar con 270, lo hace con 70kg»
- **L4 (2026-10-15/16)** — Grilling aprobado en dos rondas («dale a tus recomendaciones»): trigger por top de la sesión, evidencia con historial, supresión por RPE real, copy neutro/con margen, relleno de todas las pendientes.
- **L5 (2026-10-16)** — Spec commiteada `177dd85`; plan escrito. Mecanismo de ejecución: inline (convención del repo: un solo escritor, sin worktree pedido).
- **L6 (2026-10-16)** — Aprobado por el usuario el freno con deload («dale, me gusta la sugerencia») → S12, spec decisión 11 y plan Task 2 actualizados. Arranca la ejecución de T1.
- **L7 (2026-10-16)** — T1/T2/T3 ejecutadas y verificadas: commits `8057051` (dominio + acción absoluta) y `062678f` (superficies); reviews nativos approved + acknowledged en ambos; e2e nuevo + regresión f63 + emulador Pixel_10 por CDP con el caso G5 (200 → objetivo 62.5 en serie vacía, no el delta) y el aviso del récord; CHANGELOG/P​LAN cerrados. Advisories no bloqueantes de los dos reviews resueltos en T3 (query del botón por nombre, frontera de igualdad del guard, gate de deload cubierto por e2e, comentario del store, rama de margen solo-RIR). F118 cerrada; F122 (capas 2 y 3) queda declarada.
- **L8 (2026-10-16)** — Cierre del endurecimiento del e2e (pedido del usuario: «retoma, documenta bien y lo probamos, en ese orden»): commit `b1d4161` (fechas relativas en los seeds, escenario de deload discriminante con `prs` limpio y prueba visible del −10%, precondición anclada en `activeProgram`) con review `review-c272acd8cb4de712` **approved + acknowledged** (sus 2 advisories son **pre-existentes** → follow-ups arriba). Además se reprodujo y corrigió una **carrera** en vivo (una corrida leyó antes de que llegara la sugerencia por liveQuery): commit `7950d49` con esperas de auto-waiting, review `review-82b303f8a1bc5359` approved + acknowledged. Verificación final: e2e f118 dos corridas seguidas ALL OK + f63 ALL OK + emulador Pixel_10 por CDP ALL OK.
- **L9 (2026-10-16)** — **F118 ARCHIVADA**: el usuario pidió pasarla a `COMPLETED.md` al estar 100% cerrada → fila 118 en la Era 11 (con commits, reviews quemados y verificación) y bloque removido de `PLAN.md` (commit `37a8ff1`). El workspace del plan (`.superpowers/sdd/2026-10-16-f118-…`) se eliminó: el registro ahora vive en git + este doc. F123 declarada aparte (selector de ejercicios consistente con el catálogo).
