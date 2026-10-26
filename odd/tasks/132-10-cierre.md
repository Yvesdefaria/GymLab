# 132.10 — Reglas de ejecución y cierre · Nocturno Minimal

Objetivo: cerrar la Fase 132 verificando las 42 rutas contra el checklist, corrigiendo solo
violaciones de checklist, migrando la TabBar a la dirección B y dejando docs y PLAN al día.
132.9 ya mergeada antes (`4730bf9d`); 132.10 cierra la fase.

Rama: `132.10-cierre` (worktree `.worktrees/132.10-cierre`, multisesión pedida por el usuario).
Entrega: 3 work-unit commits de código/test + 1 de docs en la rama; merge `--ff-only` a `main`
cuando las otras sesiones estén idle; sin push. Runner: `npm run build`, `npm test`, e2e Python.
Spec: `gymlab-app/docs/superpowers/specs/2026-10-26-f132-10-cierre-design.md`.
Mockup aprobado: `.superpowers/brainstorm/132.10-cierre-20261026/content/tabbar-direcciones-v1.html` (B).

## Specs

- **S1 — Auditoría de las 42 rutas.** Barrido a 375 y 768: root montado, contenido propio de
  la ruta, 0 `pageerror`, 0 `.panel-light/.panel-chart/.panel-hero`, TabBar visible, sin overflow
  horizontal y captura por ruta. Rutas dinámicas con slugs reales y workout `9001`.
- **S2 — Correcciones permitidas.** Solo violaciones del checklist §12; sin features, rutas,
  datos ni migraciones. Lo demás se registra como follow-up.
- **S3 — Limpieza de legado.** Borrar `Panel`, `SessionHero`, `PersonalDataCard` y `DeloadCard`
  si 0 imports; build y suite verdes después.
- **S4 — TabBar B.** Hairline `border-border/40`, 4 destinos, 56 px táctil, iconos 21 px,
  etiquetas Barlow 600 9 px mayúsculas `tracking-[0.14em]`, activo dorado + regla de 2 px sobre
  el borde superior; sin píldora, `scale` ni `gold-text`. Conserva `data-tour="tabbar"`,
  `bottom-0` y `aria-label`.
- **S5 — Verificación.** `npm run build`, `npm test`, nuevo `test_132_10_cierre.py` (375/768) y
  e2e relevantes (tour, home layout, carrusel, f45b2, rutas multi-segmento). Revisión visual de
  capturas + muestra día/paleta.
- **S6 — Documentación.** `docs/design/README.md`, `CHANGELOG.md`, `PLAN.md` 132.10 `[x]`,
  `NOCTURNO-MINIMAL.md` §11 y §24.
- **S7 — Entrega.** Commits convencionales sin push; review nativo antes del commit de código;
  merge ff-only y cierre del worktree cuando las otras sesiones estén idle.

## Tasks

| ID | Tarea | Specs | Ruta | Estado | Evidencia |
|---|---|---|---|---|---|
| T0 | Spec + task doc + espejo Engram | — | inline | hecho | este doc + `2026-10-26-f132-10-cierre-design.md` |
| T1 | TabBar dirección B | S4 | inline | hecho | commit `ad7545dd` |
| T2 | Borrar legado sin uso | S3 | inline | hecho | commit `f75f77a7` (4 archivos, −229 líneas) |
| T3 | E2E de cierre de las 42 rutas | S1, S5 | inline | hecho | commit `91362a45`; `ALL OK — 42 rutas × 2 viewports` |
| T4 | Auditoría visual + correcciones checklist | S1, S2 | inline | hecho | 84 capturas en `.tmp/132.10-audit/`; muestra día/electric + noche/crimson; 0 `panel-*` |
| T5 | Docs de cierre | S6 | inline | en curso | README, CHANGELOG, PLAN, §11/§25 + este doc |
| T6 | Review nativo + commits | S7 | inline | hecho | `review-c00ad77266b7f634` approved + acknowledged |
| T7 | Merge/cierre del worktree | S7 | inline | en curso | merge y push en ejecución |

## Evidencia de verificación

- `npm run build` limpio (Vite 8, 3495 módulos, PWA 216 entradas).
- `npm test` **202 archivos / 1877 tests** verdes.
- `python tests/e2e/scripts/with_server.py tests/e2e/test_132_10_cierre.py --port 5272`:
  **ALL OK — 42 rutas × 2 viewports** (375×812 y 768×1024), con contenido propio, 0 `pageerror`,
  0 `panel-*`, TabBar visible, sin overflow; capturas en `.tmp/132.10-audit/`.
- `test_f101_tour_autostart.py`, `test_f101_wizard_scroll.py`, `test_132_9_superficies.py`,
  `test_f99_home_layout.py` y `test_f113_carrusel.py` **ALL OK**;
  `test_rutas_multi_segmento.py --mode preview` **ALL OK**.
- `test_f45b2.py` falla igual en `main` (no aparece «Ya entreno aquí»): baseline pre-existente,
  no es de esta fase.
- Muestra de tema: día + paleta `electric` (Home, Ajustes, IMC) y noche + paleta `crimson`
  (Home, Ajustes, Estadísticas) sin `panel-*` y con la TabBar visible.

## Log

- **L1 (2026-10-26, pedido literal):** «activa multisesion, quiero hacer 132.10 — Reglas de
  ejecución y cierre, usa grillme si tienes dudas sobre algo y usa mockups con al menos 3
  opciones por diseño para ver como quedaria».
- **L2 (2026-10-26, respuesta literal):** «todo lo recomendado, 132.9 tiene su worktree por
  lo que si necesitas algo sobre esa fase preguntame o verifica el worktree only read».
- **L3 (2026-10-26, decisiones cerradas):** 132.10 incluye auditoría de las 42 rutas +
  corrección de violaciones de checklist + TabBar B + docs; 132.9 queda fuera; barrido
  automático completo a 375/768; se borran los 4 componentes legacy sin uso.
- **L4 (2026-10-26, arranque):** worktree `132.10-cierre` abierto desde `main` `ff37d75a`.
  Mockup `tabbar-direcciones-v1.html` con actual + A/B/C en noche y día; el usuario aprobó
  B. Server de mockups en `http://localhost:53692/?key=…`.
- **L5 (2026-10-26, implementación y verificación):** TabBar B (hairline, regla de 2 px,
  iconos 21 px, etiquetas 9 px, 56 px) y retiro de `Panel`, `SessionHero`, `PersonalDataCard`
  y `DeloadCard` (0 imports). E2E nuevo de 42 rutas × 375/768 con contenido propio y capturas:
  **ALL OK**. `npm run build` limpio y `npm test` **202/1877**. E2E relevantes verdes; `test_f45b2`
  rojo también en `main`. Muestra día/electric + noche/crimson sin `panel-*`.
- **L6 (2026-10-26, review nativo):** `review-c00ad77266b7f634` (lente `review-reliability`,
  medio) **approved + acknowledged**; authority burned. 7 advisories no bloqueantes de
  endurecimiento del e2e: `R3-tautological-content`, `R3-panel-absence-timing`,
  `R3-tabbar-unasserted`, `R3-sweep-not-collected`, `R3-seed-determinism`,
  `R3-pageerror-attribution` y `R3-quick-session-silent`.
- **L7 (2026-10-26, docs):** README, CHANGELOG, PLAN (132.10 `[x]`, 132.9 mergeada),
  `NOCTURNO-MINIMAL.md` §11/§25 y este doc. Commits `f75f77a7` (legado), `ad7545dd` (TabBar)
  y `91362a45` (e2e). Próximo: merge ff-only, push, cierre del worktree y commit documental
  post-merge.

## Follow-ups

- Endurecer el e2e de cierre (los 7 advisories del review): atribución de `pageerror` por
  evento/tiempo, espera de charts antes del check de `panel-*`, asserts de la TabBar
  (destinos, `aria-current`, 56 px), integración con el runner del repo, seed que espere la
  DB/migraciones y reporte explícito de la quick session.
- Cuatro rutas (`/`, `/rutinas`, `/mas`, `/estadisticas`) usan textos que también existen en
  la TabBar; el contenido propio se verificó visualmente, pero el assert del e2e debe
  apuntar a un heading/landmark de la página.
- `test_f101_tour.py` quedó stale con el onboarding de 7 pasos de 132.9 (espera el paso «3»);
  el tour se cubre con `test_f101_tour_autostart`, `test_f101_wizard_scroll` y
  `test_132_9_superficies`. Actualizarlo o retirarlo es follow-up de 132.9.
- `test_f45b2` pre-existente rojo en `main`.
- `test_f103_smoke` pre-existente rojo por reset de DB.
- 132.9 ya mergeada en `main` (`4730bf9d`); worktree cerrado.
