# Pulido Home / Más / Ajustes: huecos finales y textos movidos

**Estado:** COMPLETADO (2026-10-05) — commit `40e161b` (sin push; lo hace el usuario), review Gentle AI **APROBADO** (lineage `review-d2053485e019f49e`).

**Objetivo:** (pedido del usuario 2026-10-05)
1. Quitar el espacio en blanco inútil al final de `/` (Inicio), `/mas` y `/ajustes`.
2. Mover los textos informativos del final de Más (aviso local-first y crédito de free-exercise-db) a Ajustes, en Créditos o similar. El duplicado de "free-exercise-db" se corrige al mover.
3. El orden de Ajustes queda **como está** (decisión explícita del usuario): no mover Zona de peligro, no tocar las notas existentes, no tocar el tip del tour de Más.

## Diagnóstico (medido 2026-10-05, dev server 375×812, seed onboarding/tour hechos)

| Página | `leafDead` (hueco real hoja→fin de documento) | Veredicto |
|--------|-----------------------------------------------|-----------|
| `/` | **228 px** (de los cuales 128 son `pb-32` redundante) | bug |
| `/ajustes` | **200 px** (128 son `pb-32` redundante) | bug |
| `/mas` | 118 px (padding correcto) | sin problema de padding |
| `/calculadoras` (referencia sana) | 88 px | — |

- El shell (`AppShell`) ya reserva 72 px para la tab bar; el `pb-32` (128 px) de Inicio y Ajustes se sumaba encima → ~143 px de blanco visible.
- `/mas` tenía el texto **"free-exercise-db" dos veces** en la misma oración (el span de `MasPage` repetía lo que ya decía la clave i18n).

## Tareas

- [x] T1 — e2e nuevo `tests/e2e/test_pulido_home_mas_ajustes.py` RED→GREEN (hueco ≤120 px en `/` y `/ajustes`; `/mas` sin "free-exercise-db" ni "local-first"; `/ajustes` con "free-exercise-db" exactamente 1 vez)
- [x] T2 — `src/pages/EntrenarPage.tsx`: quitado `pb-32` (queda `space-y-4 p-4`)
- [x] T3 — `src/pages/AjustesPage.tsx`: quitado `pb-32` + nota `ajustes.creditosFotos` dentro del panel CRÉDITOS
- [x] T4 — `src/pages/MasPage.tsx`: quitados los paneles local-first y free-exercise (+ imports `Shield`/`Image`); i18n es/en: `mas.fotosEjerciciosPre/Post` → `ajustes.creditosFotos` (texto unificado, sin duplicado); CHANGELOG `[Unreleased] → Fixed`
- [x] T5 — Verificación: e2e GREEN + regresiones + `npm run build` + `npm test` + `npm run lint`
- [x] T6 — Review RDD (candidato = diff del workspace) **APROBADO** + commit sin push

## Rutas y decisiones

- Ruta: **delegada — un escritor único** (TDD: test primero, RED→GREEN). Spike de diagnóstico del orquestador (mediciones + métrica calibrada). Verificación del parent (spot-check del e2e) + review nativo.
- El `pb-32` de `RutinaBuilderPage.tsx` NO se toca (tiene barra fija propia, fuera de alcance).
- El tip de primera vez de Más y el localFirst que ya vive en Ajustes quedan como están.
- Criterio e2e: el hueco se mide como `scrollHeight - max(bottom de hojas visibles)`; si la página no scrollea, no se evalúa (página corta = blanco natural).

## Evidencia

- **RED (antes de implementar)**: e2e `test_pulido_home_mas_ajustes.py` falló con hueco 228 px / 171 px visibles en `/`, 200 px / 143 px en `/ajustes`, textos presentes en `/mas` y crédito ausente (0) en `/ajustes`.
- **GREEN**: `python tests\e2e\scripts\with_server.py tests\e2e\test_pulido_home_mas_ajustes.py` → `ALL OK: pulido home/mas/ajustes`. Spot-check del orquestador: re-ejecutado → `ALL OK` (2026-10-05).
- **Regresiones** (todas ALL OK): `test_f99_home_layout.py`, `test_f101_tour.py`, `test_f112_reset.py`, `test_f93_t28_mas_grid.py`.
- `npm run build`: exit 0 (tsc -b + vite, 8.07 s). `npm test`: 112 archivos / 1244 tests verdes. `npm run lint`: exit 0 sin hallazgos nuevos.
- Capturas post-fix (dev server 375×812): `%TEMP%\opencode\gymlab-ui-audit\fix-home-bottom.png`, `fix-mas-bottom.png`, `fix-ajustes-bottom.png` — hueco visible ~15-45 px (antes 143 px), crédito en CRÉDITOS con el nombre una sola vez, Más sin paneles.
- Medición post-fix: `/mas` ya no scrollea (scrollHeight 812 = viewport, sin hueco artificial); `/ajustes` termina a ~15 px de la tab bar.

## Review (2026-10-05)

- Gentle AI: **APROBADO** (lineage `review-d2053485e019f49e`; riesgo medium; 1 lente `review-reliability`; autoridad quemada con la ack exacta; 7 archivos / 197 líneas).
- Advisories informativos (NO bloquean; follow-ups opcionales del e2e nuevo):
  - **R3-001 (WARNING)** `test_pulido_home_mas_ajustes.py:100-111` — `assert_no_dead_space` solo rechaza huecos DEMASIADO GRANDES: no detecta el modo de falla inverso (contenido debajo de la tab bar / gap visible negativo) ni evalúa páginas sin scroll.
  - **R3-002 (SUGGESTION)** `test_pulido_home_mas_ajustes.py:153` — la aserción usa el substring español sin fijar locale; una corrida que resuelva en inglés fallaría con output correcto.
  - **R3-003 (SUGGESTION)** `test_pulido_home_mas_ajustes.py:129` — `/` se mide sin selector de readiness (solo settle fijo): un render corto cae en el early-return `maxScroll <= 0` y no evalúa layout.

## Commit

- `40e161b` «fix: elimina el hueco final de Inicio y Ajustes y reubica los textos de Más en Créditos» — 7 archivos, +176/−21 (incluye el e2e nuevo de 170 líneas); sin push (convención del repo).
