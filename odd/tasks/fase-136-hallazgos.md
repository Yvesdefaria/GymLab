# Fase 136 — Hallazgos de la validación física de release

Objetivo: cerrar los hallazgos abiertos de `gymlab-app/PLAN.md` Fase 136 (136.1, 136.2, 136.5, 136.6) con decisión de producto, tests y verificación. Rama: `main`. Entrega: commits work-unit sin push. Runner: `vitest` (`npm test`) + `npm run build`.

## Specs

- **S1 — 136.1 Frecuencia muscular con ventana móvil de 7 días.**
  Decisión del usuario (verbatim): «Móvil: 7 y 28 días (Recomendado)».
  La ventana es `hoy − 6 … hoy` en fechas locales (`toLocalDateStr`), cuenta días únicos por grupo muscular y no usa `toISOString` ni `getDay` para construirla. El copy de ayuda y tour dice «últimos 7 días» en es/en. Criterios: 136.1 test de borde de ventana (día −6 incluido, −7 excluido), series incompletas/ausentes ignoradas, caída a `finishedAt` en fecha local, y test de fuente que impide volver a `toISOString`/`getDay` en `EntrenoTab`.

- **S2 — 136.2 Copy del detalle por hora según la fuente del dato.**
  `StepSource = 'manual' | 'phone' | 'watch'`. El vacío de «HOY · por hora» debe decir la causa real: `manual` sin salud conectada → copy de alta manual; `manual` con salud conectada → solo «El alta manual guarda solo el total del día.»; `phone/watch` sin salud conectada → invitar a conectar; `phone/watch` con salud conectada → error honesto de lectura, sin botón Conectar; sin fuente → neutro. Criterios: selector puro testeado para las cinco ramas, claves es/en, y el botón Conectar solo aparece si la salud no está conectada.

- **S3 — 136.5 Encabezado duplicado en `/ejercicios`.**
  Causa confirmada: el índice sticky (`EjerciciosPage.tsx:378-396`) muestra la misma letra + conteo que la cabecera real de la sección (`:416-428`); no es doble render. El índice sticky se oculta (sin cambiar la altura, solo opacidad) mientras la cabecera real de la sección activa sigue visible, y reaparece cuando la cabecera pasa detrás del `AppHeader`. Criterios: predicado puro `shouldShowStickyIndex` testeado en los bordes y test de fuente que verifica que la página lo usa.

- **S4 — 136.6 Anillo de progreso con ventana móvil de 28 días + etiqueta.**
  `programProgressPct` evalúa `max(startDate, hoy − 27) … hoy`; deja de congelarse en las primeras 8 semanas. En los datos reales (inicio 2026-08-11, L/X/V, hoy 2026-11-03) da 4/12 = 33 %. El anillo muestra una etiqueta visible «programa»/«program» cuando representa progreso del programa. Criterios: tests de ventana de 28 días, entrenos viejos ignorados, inicio dentro de la ventana, `scheduled = 0`, redondeo 12,5 → 13 y ventana de 7 días.

- **S5 — 136.7 «Salir sin guardar» descarta la sesión activa.**
  `confirmLeaveConfirm` debe resetear el store de la sesión activa antes de navegar al home; si no, la home sigue ofreciendo «Continuar entreno» con 0 series y la hoja miente. Criterio: test de fuente que exige `useActiveWorkoutStore.getState().reset()` entre el cierre de la hoja y `navigate('/')`, y validación física de que la home vuelve a «Empezar hoy».

## Tasks

| ID | Tarea | Specs | Ruta | Estado |
|----|-------|-------|------|--------|
| T1 | Ventana móvil de 7 días en frecuencia muscular + copy de ayuda/tour | S1 | inline | **hecho + validado en teléfono** — `6abb33a6` |
| T2 | Copy del detalle por hora según `source` y estado de salud | S2 | inline | **hecho** — `d11c3982`; tests OK, vacío no reproducible con salud conectada |
| T3 | Ocultar el índice sticky mientras la cabecera real está visible | S3 | inline | **hecho + validado en teléfono y preview** — `4088d522` |
| T4 | Ventana móvil de 28 días en `programProgressPct` + etiqueta del anillo | S4 | inline | **hecho + validado en teléfono** — `e6733d72` |
| T5 | **136.7** — «Salir sin guardar» resetea la sesión activa | S5 | inline | **hecho + validado en teléfono** — `0144c9a9` |

## Log

L1 — Pedido del usuario (2026-11-03), verbatim: «vamos a hacer Fase 136 — Hallazgos de la validación física de release — ABIERTA (2026-11-03)».

L2 — Decisión del usuario (2026-11-03): «Móvil: 7 y 28 días (Recomendado)» — frecuencia muscular en ventana móvil de 7 días; anillo de progreso en ventana móvil de 28 días.

L3 — Diagnóstico read-only (2026-11-03): 136.5 es el índice sticky (`EjerciciosPage.tsx:378-396`) conviviendo con la cabecera real (`:416-428`), no doble render. 136.2: `StepTodayChart` usa un único copy para `available === false` y ofrece Conectar aunque la salud ya esté conectada. 136.1: `EntrenoTab.tsx:34-38` arranca el domingo y deriva con `toISOString`. 136.6: `programProgressPct` recorre desde `startDate` con tope de 56 iteraciones y queda congelado desde el 2026-10-05.

L4 — Implementación y verificación (2026-11-03): T1–T4 con TDD (RED 13 tests → GREEN 67 en los seis archivos tocados). Suite completa **228 archivos / 2070 passed + 1 skipped**; `npm run build` limpio. 136.5 verificado en preview 390×844: a scroll 0 el índice sticky tiene `opacity: 0` y la cabecera real «A · 3 EJERCICIOS» se ve una sola vez; a scroll 900 el índice muestra «C · 3 EJERCICIOS» con la cabecera ya detrás del `AppHeader`; 0 `pageerror`. Assess del rango `f1ee928d..HEAD`: **medium / under_budget** (21 paths, 466 líneas), `review_due: false`.

L5 — Pendiente (2026-11-03): validación física de 136.1 (ventana de 7 días con datos reales), 136.2 (fila `source: phone` sin permiso y con permiso), 136.6 (el anillo debe dar 33 % y moverse al completar un entreno dentro de la ventana) y captura de 136.5 en teléfono. La fase sigue ABIERTA hasta esa pasada.

L6 — Validación física (2026-11-04, RMX5085, release firmado instalado con `adb install -r` sobre el release previo, datos intactos):
- **136.6 — pass**: la home del 3-11 mostró **33 %** + etiqueta **PROGRAMA**; la del 4-11, **25 %** + PROGRAMA (la ventana móvil se movió sola, ya no está congelada).
- **136.1 — pass**: Estadísticas → Entreno mostró **Pecho, Espalda, Bíceps, Hombro y Pierna en 1/2**; la ventana vieja (domingo 1-11 → 3-11) solo habría contado el pecho del domingo. Prueba directa de que la ventana de 7 días incluye entrenos del 28-10 al 31-10.
- **136.5 — pass**: `/ejercicios` con «pres» (98 de 873). A scroll 0 solo se ve la cabecera inline «A · 3 EJERCICIOS» (índice sticky en opacidad 0). Al scrollear, el índice sticky muestra «D · 2 EJERCICIOS» con la cabecera real ya detrás del `AppHeader`; no hay encabezado duplicado.
- **136.3 — sin regresión**: `/pasos` mostró «Sistema de salud conectado», **12.937** pasos y «pico 9 h · 2.181»; el detalle por hora sigue dibujando.
- **136.2 — no reproducible visualmente**: con Health Connect conectado el bloque por hora tiene datos y no entra al estado vacío. La rama de copy queda cubierta por `todayEmptyCopy` (5 casos).

L7 — Hallazgo nuevo (2026-11-04) → **PLAN.md 136.7**: al abrir una sesión de prueba, la hoja «¿Salir sin guardar?» cerraba y navegaba al home pero la sesión seguía viva («Continuar entreno», 0/13, temporizador corriendo). Causa: `confirmLeaveConfirm` (`useActiveSession.ts:397-400`) no llamaba a `reset()`. Fix: resetear `useActiveWorkoutStore` antes de `navigate('/')` + test de fuente `sessionLeaveReset`. Validado en teléfono: la home volvió a «Hoy toca / Empezar hoy». Commit `0144c9a9`.
