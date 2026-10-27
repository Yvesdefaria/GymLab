# F101 — Pulido del tour: arranque, foco, anclas, copy neutro y ampliación

- **Estado:** cerrado (2026-10-02) · **Ronda 2 (feedback del usuario, 2026-10-02): cerrada — T7 ✅**
- **Repo:** `C:\Users\Yves De Faria\Desktop\ProyectoGymLab` — directorio normal (sin worktree). Sesión f103 activa solo toca `PLAN.md` raíz.
- **RDD:** ON (global). Review nativo por candidato ANTES de cada commit; commits sin push.
- **Verificación e2e:** `python tests/e2e/scripts/with_server.py tests/e2e/test_f101_tour.py` (cwd `gymlab-app`, usar puerto 5179 si el script lo soporta).

## Objetivo

Cerrar el pulido pendiente de F101 (PLAN.md L491-498) y ampliar el tour:

1. **Arranque del tour**: al cerrar el onboarding aparece el tip ("Primera vez acá") en lugar del tour. Causa raíz: `Onboarding.tsx:248` escribe `tourPending` solo si `withRoutine` (el cierre "Ya entreno aquí" no lo deja pendiente) y se escribe DESPUÉS de `onboardingDone` (ventana donde el tip gana la carrera). Fix aprobado: pending antes que done + tour ofrecido en ambos cierres del resumen (no en el escape del paso 0) + tip suprimido mientras el tour esté pendiente + e2e del flujo real (hoy siembra `tourPending` a mano).
2. **Foco robusto**: `useTourAnchor.ts` espera 1s sin rearme, mide nodos desconectados, mide durante animaciones de entrada y no reacciona a cambios de ruta. Anclas gigantes (página entera) dejan el spotlight fuera de pantalla.
3. **Anclas correctas**: logros → barra `role="progressbar"`; rutinas → `rutinas-actions` + `rutinas-filters`; estadísticas → tablist real (prop nuevo en `TabNav`); más → `mas-links`; `home-start` estable en las 4 ramas del hero.
4. **Tour 8 → 12 pasos** con copy español neutro (es-ES, didáctico) + tips; barrido de voseo app-wide (`core.ts`, `routines.ts`, `features.ts`).
5. **Ayuda visible en Ajustes** (sección AYUDA sobre el pliegue).

## No-goals

- No tab-switching en Estadísticas (el tour no cambia sub-pestañas).
- No renombrar "entreno(s)" fuera del copy del tour.
- Sin push, sin worktree.

## Tareas

- [x] **T1 — Arranque del tour garantizado** (bug reportado) — commit `1a42cee`; review nativo `review-0a83d5b999bf59ce` aprobado + acknowledged (authority burned).
  - `Onboarding.tsx`: escribir `TOUR_PENDING` antes de `ONBOARDING_DONE`; ofrecer tour en ambos cierres del resumen; escape paso 0 sin tour.
  - `SectionTipHost.tsx`: suprimir tip mientras `shouldAutoStartTour` esté pendiente.
  - e2e: flujo real perfil limpio → wizard → cierre → tour abre sin tip (ambos botones del resumen).
- [x] **T2 — Focus hardening** (`useTourAnchor.ts`, `TourOverlay.tsx`) — commit `c937488`; review nativo `review-2655f338c4469703` aprobado + acknowledged. RED determinista: chunk lazy de Rutinas retrasado 2.5s → spotlight quedaba centrado; GREEN con poll persistente. Advisories: R3-001 (sin test de la rama disconnect/sin-fantasma — requiere jsdom, no disponible), R3-002 (pre-existing: el rect no se limpia si el ancla desaparece sin reemplazo).
  - Poll persistente hasta encontrar ancla; guarda `isConnected`; rearme por ruta; re-medición (animationend / fonts.ready / diferida); reset pre-paint.
  - e2e: aserción de geometría por paso (spotlight ≈ rect del ancla).
- [x] **T3 — Anclas + ampliación 12 pasos + copy tour es/en** — commit `41f87f7`; review nativo `review-4b5f02563fba6bfc` aprobado con 0 findings + acknowledged.
  - Re-scope de anclas listadas arriba; nuevas: `home-calendar`, `home-quick-templates`, `stats-frequency`;
  - `TOUR_STEPS` 12 entradas; copy neutro en `es/tour.ts` y espejo `en/tour.ts`; tips.
  - e2e: `1 / 12`, orden/rutas, `TIP_LABEL` nuevo, sin tips durante el tour.
- [x] **T4 — Barrido de voseo app-wide**: `es/core.ts`, `es/routines.ts`, `es/features.ts` (+ `es/nutrition.ts` extra) — commit `6a9fd0f`; review nativo `review-5aa2dba2e3cc69d7` aprobado con 0 findings + acknowledged (el 1er capture falló por transporte; relanzado OK).
- [x] **T5 — Ayuda visible en Ajustes** — commit `2eb0e84`; review nativo `review-c16ac15e805b7348` aprobado con 0 findings + acknowledged (2 captures fallidos por transporte; relanzado OK).
- [x] **T6 — Cierre** — smoke nativo emulador-5554 PASS (tour 1/12→12/12 con Terminar y flags correctos, ruta multi-segmento `/calculadoras/imc`, 0 `pageerror`); `npm run build` limpio; `npm test` 111/1227; los 3 e2e F101 ALL OK; PLAN.md + CHANGELOG actualizados.
- [x] **T7 — Ronda 2 (feedback del usuario)** — commit `79cd2b6`; review nativo `review-5b5dc48469c55308` aprobado (2 advisories no bloqueantes: e2e no simula el cambio de dueño del ancla de medalla; no verifica el texto del paso nuevo). E2E 13 pasos RED→GREEN; build limpio; `npm test` 111/1227; APK reconstruido e instalado en emulador-5554.

## Criterios de aceptación

- E2E F101: recorrido completo de 12 pasos con geometría verificada por paso (el spotlight coincide con el ancla descrita), arranque real desde onboarding (sin sembrar meta) y sin tip; replay desde Ajustes; tipos/tips solo donde corresponde.
- `npm run build` limpio (typecheck real) + `npm test` verde.
- Smoke emulador: tour abre, recorre y cierra; 0 `pageerror`.
- Copy del tour sin voseo/regionalismos; barrido aplicado.

## Decisiones de ruta

- Un solo escritor (`general`); e2e con librería Python de Playwright.
- Review nativo por candidato antes de cada commit (contrato `gentle-ai.review-integration/v2`, agente `opencode`).
- Orden: T1 → T2 → T3 → T4 → T5 → T6 (T3 depende de T2 sólo para las aserciones de geometría).

## Evidencia

- **T4** (commit `6a9fd0f`, 4 archivos / 27 strings): voseo y regionalismos neutralizados en `es/` (core 16: logros/ErrorBoundary/`Vista del hub`→`Vista de enlaces`/onboarding; features 8 incl. `Dale caña`, `Caminá`, `Revisá`; routines 2; nutrition 1 `maní`→`cacahuete`). Grep final: 0 voseo (quedan solo «entrenos» como término de dominio). Build limpio; `npm test` 111/1227; sin referencias en tests.
- **T3** (commit `41f87f7`, 14 archivos): anclas re-scopeadas (logros→progressbar; rutinas→`rutinas-actions`+`rutinas-filters`; stats→tablist vía `listDataTour`; más→`mas-links`; `home-start` estable en las 4 ramas del hero) + nuevas (`home-calendar`, `home-quick-templates`, `stats-frequency`); `TOUR_STEPS` 8→12; copy es neutro completo + espejo en; tips reescritos (sin voseo/«acá»/«entrenos»). E2E: RED (contador/copy/pasos) → GREEN de los 3 e2e; build limpio; `npm test` 111/1227. Review `review-4b5f02563fba6bfc` aprobado con **0 findings**.
- **T2** (commit `c937488`): `useTourAnchor` con poll persistente (rAF 2s + watchdog 250ms sin timeout terminal), guarda `isConnected` con re-enganche, rearme por `pathname`, re-medición (`animationend`/`transitionend`/`fonts.ready`/diferida 600ms), rect atado al `stepId` (sin fantasma). E2E: aserción de geometría por paso (±2px con offsets del spotlight) + RED determinista por chunk lazy de Rutinas retardado 2500ms; GREEN x2; regresiones OK; build limpio; `npm test` 111/1227. Review `review-2655f338c4469703` aprobado + acknowledged. **Advisories:** R3-001 (rama disconnect sin test dedicado; sin jsdom en el proyecto), R3-002 (pre-existing: no se limpia el rect si el ancla desaparece sin reemplazo).
- **T5** (commit `2eb0e84`): aserción e2e visible-sin-scroll (RED) → `HelpSection` movida tras `AppearanceSection` → GREEN; regresiones OK; build limpio; `npm test` 111/1227. Review `review-c16ac15e805b7348` aprobado con **0 findings**.
- **T6** (cierre, 2026-10-02): smoke nativo en emulador-5554 — build+sync OK, APK instalado, CDP: arranque sin pantalla negra (0 `pageerror`), tour sembrado 1/12→12/12 con `Terminar` (meta `tourDone=true`, `tourPending=false`), ruta multi-segmento `/calculadoras/imc` monta, 0 `pageerror`. PLAN.md (bloque de pulido → cerrado) y CHANGELOG (`[Unreleased]`) actualizados.
- **Lección de entorno:** el capture del reviewer falla si el Task lleva un wrapper de materialización a mano; la regla de oro es **Task = SOLO la línea `GENTLE_AI_REVIEW_BINDING {...}`**. Un fallo de capture se resuelve reconsultando el STATUS del lineage y relanzando el slot reofrecido.
- **T7** (commit `79cd2b6`, 7 archivos): ronda 2 por feedback — paso `objetivos` (`home-goals`), logros → `logros-medalla` (primera medalla; remonte por `key` cuando el ancla cambia de dueño al resolver Dexie — hallazgo del e2e), deck de 13 pasos sin jerga + tip de estadísticas; e2e a 13 pasos con geometría. Review `review-5b5dc48469c55308` aprobado (2 advisories). **Rebuild del APK:** el primer intento (worker) colgó en la salida de `vite build` (wedge conocido del proceso huérfano; el cap sync nunca corrió) y el usuario lo canceló; reintento acotado del orquestador OK (cap sync 3s, gradle 31s, install, smoke CDP: 1/13→13/13, spotlight == `logros-medalla`, 0 `pageerror`). APK instalado en emulador-5554.
- **T1** (commit `1a42cee`): e2e nuevo `test_f101_tour_autostart.py` RED (el escenario "Ya entreno aquí" del resumen no abría el tour) → GREEN; regresión `test_f101_tour.py` + `test_f101_wizard_scroll.py` OK; `npm run build` limpio; `npm test` 111 archivos / 1227 tests. Review nativo `review-0a83d5b999bf59ce` aprobado + acknowledged. **Advisories no bloqueantes:** R3-1 (si falla una escritura posterior al pending y luego se cierra por el escape con `offerTour:false`, el pending residual no se limpia → el tour arranca igual; borde raro), R3-2 (el e2e verifica el tip solo post-open, no la ventana de carrera previa).
