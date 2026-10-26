# F132.9 — Superficies sin ruta (onboarding, modal de logros y tour)

**Objetivo:** migrar las tres superficies que quedaron fuera de ruta al lenguaje Nocturno Minimal y revalidar el resumen post-entreno/sheets como ya cubiertos por sus pantallas dueñas.
**Rama:** `132.9-superficies` · worktree `.worktrees/132.9-superficies` (multisesión pedida por el usuario).
**Runner:** `vitest` (`npm test`) + `npm run build`; e2e con Playwright Python (`tests/e2e/scripts/with_server.py`).
**Spec:** `gymlab-app/docs/superpowers/specs/2026-10-26-f132-9-superficies-sin-ruta-design.md`.
**Mockup:** `.superpowers/brainstorm/132.9-superficies-20261026/content/01-superficies-direcciones.html`.
**Estado:** completado y **mergeado en `main`** el 2026-10-26 (`4730bf9d`, ff-only sobre `ff37d75a`); worktree `132.9-superficies` cerrado; **sin push**. Commits finales `9bb905f4` (onboarding), `a1b275f6` (modal), `1f9580e6` (tour) y `4730bf9d` (docs); review `review-9d44060d62b5b833` approved + acknowledged.

## Specs

- **S1 — Onboarding de 7 pasos.** El wizard pasa a una decisión por pantalla: Idioma, Objetivo (con nivel), Días, Sesión (duración + cardio + equipamiento), Identidad (nombre + unidades + sexo), Medidas (fecha + altura + peso) y Resumen. Pantalla completa sin `panel`, barra superior con wordmark/«Atrás» y «Ya entreno aquí», progreso en 7 puntos + «Paso N de 7», pregunta en Oswald 300, opciones como filas hairline de 56 px con radio, CTA fija de 52 px. Copy exacto en la spec §3.
- **S2 — Modal de logros A (celebración contenida).** Sin tarjeta: fondo `bg-black/70` + blur, contenido con dos hairline doradas, eyebrow «Logro desbloqueado», medalla 88 px (`size="lg"`), título Oswald 300 3xl, descripción, variante, cola `data-queue-progress` con puntos y «N de M», botón «¡Genial!». Confeti de 12 piezas; reduced-motion estático. Se conservan `role="dialog"`, `aria-labelledby="achievement-modal-title"`, Escape, foco inicial y haptics.
- **S3 — Tour A (globo hairline).** Mismo recorrido, anclas y spotlight. Globo `bg-bg-soft/95` + hairline + `rounded-xl`, eyebrow «Paso» + línea + `N / 13`, cuerpo Barlow y pie con «Saltar tour» a la izquierda y «Anterior»/«Siguiente» a la derecha. `data-testid="tour-spotlight"` y `1 / 13` se conservan. «Volver a ver el tour» en Ajustes sigue siendo el único replay y se revalida.
- **S4 — Sin replay de onboarding.** El onboarding se muestra una sola vez (gate actual `done || workoutCount > 0`); no se agrega store, fila en Ajustes ni modo replay. La repetición que existe es la del tour.
- **S5 — Resumen post-entreno y sheets.** Solo revalidación: ya están migrados en F132.2/F132.6/F132.8. No se duplican checkboxes ni se toca su código.
- **S6 — i18n es/en.** Claves nuevas/cambiadas de la spec §6; `es` sigue siendo la fuente tipada, `en` con la misma estructura; default del producto inglés.
- **S7 — Verificación.** `npm run build` limpio, `npm test` verde, e2e nuevo `test_132_9_superficies.py` + actualización de `test_f101_tour_autostart.py`, `test_f127_tour_logros.py` y `test_f101_wizard_scroll.py`; 375/768 px, 0 `pageerror`, reduced-motion. Review nativo antes de commit.

## Tasks

- [x] **T0 — Docs de diseño.** Spec + task ODD + mockup registrado. Commit `docs:` (sin código). · S1–S7
- [x] **T1 — Onboarding 7 pasos.** `DaysStep`, `SessionStep`, `IdentityStep`, `MeasurementsStep`; shell C1 (barra, puntos, filas, CTA); animación con reduced-motion; i18n de los 7 pasos. E2E de flujo actualizados. Commit `9bb905f4`. · S1, S6
- [x] **T2 — Modal de logros A.** `AchievementModal` sin panel + `AchievementMedal size="lg"` + confeti 12 + cola en puntos; unit test verde. Commit `a1b275f6`. · S2
- [x] **T3 — Tour A.** `TourOverlay` hairline; anclas/spotlight/`1 / 13` conservados; e2e de tour nuevo y replay desde Ajustes. Commit `1f9580e6`. · S3
- [x] **T4 — Cierre.** E2E nuevo, build + suite, revisión visual mockup vs app, `PLAN.md` §132.9, `CHANGELOG.md`, `docs/design/README.md`, `NOCTURNO-MINIMAL.md` §24. · S4, S5, S7

## Review y follow-ups

- **Review nativo:** `review-9d44060d62b5b833` (medium, lens `review-reliability`) **approved + acknowledged** (authority burned, 2026-10-26). 0 blockers; 7 advisories no bloqueantes.
- **R3-001 (WARNING, tests):** los e2e de onboarding solo prueban valores válidos; faltan aserciones de CTA deshabilitada con nombre vacío, sexo sin elegir, fecha inválida o medidas fuera de rango.
- **R3-002 (WARNING, tests):** el branch `prefersReducedMotion` del wizard (slide y salto de animación) no tiene e2e con `emulate_media(reduced_motion='reduce')`.
- **R3-003 (WARNING, tests):** el eyebrow del tour se asserta con `inner_text().upper()` y los botones Next/Skip no están scoped al diálogo; endurecer el selector.
- **R3-004 (WARNING, contrato):** la spec pedía `radiogroup/radio/aria-checked` y la implementación usa `role="group"` + `aria-pressed`. Se corrigió la spec para reflejar el patrón real del repo; si se quiere semántica radio completa, es una tarea aparte.
- **R3-005 (SUGGESTION, tests):** el e2e nuevo usa esperas fijas (1200/500/900 ms) para sembrar y esperar el tour; conviene esperar una señal de readiness.
- **R3-006 (SUGGESTION, tests):** el e2e del replay no verifica que `onboardingDone` siga true ni que el wizard no reaparezca.
- **R3-007 (SUGGESTION, tests):** el modal de logros no tiene e2e propio del nuevo kicker/contenedor/cola; el unit test cubre el contrato de cola.

## Log

- **L1 (2026-10-26, pedido original, verbatim):** «activa multisesion, quiero hacer 132.9 — Superficies sin ruta (decidir alcance), usa grillme si tienes dudas sobre algo y usa mockups con al menos 3 opciones por diseño para ver como quedaria».
- **L2 (2026-10-26, decisión de diseño del usuario, verbatim):** «B/A/A , repetir el onboarding deberia aparecer en ajustes».
- **L3 (2026-10-26, aclaración del usuario, verbatim):** «el onboarding no se repite, es el tour el que lo hace». Consecuencia: se elimina el replay del onboarding del alcance; «Volver a ver el tour» ya existe en Ajustes y se revalida.
- **L4 (2026-10-26, supuestos de alcance):** 132.9 son 3 superficies, no 4: el resumen post-entreno y los sheets ya se rediseñaron con su pantalla dueña (F132.2, F132.6, F132.8) y solo se revalidan. El onboarding sigue siendo de una sola vez.
- **L5 (2026-10-26, verificación previa):** worktree creado desde `main` `c287b7f8`; worktree `132.8-sistema` sigue registrado aunque el README dice cerrado (no se toca). Mockups aprobados: onboarding B, modal A, tour A.
- **L6 (2026-10-26, verificación):** `npm run build` limpio; `npx vitest run` **202 archivos / 1877 tests**; e2e `test_132_9_superficies.py`, `test_f101_tour_autostart.py`, `test_f101_wizard_scroll.py` y `test_f127_tour_logros.py` **ALL OK** (375 y 360×640); revisión visual del onboarding (7 pasos), modal y tour con 0 `pageerror`.
- **L7 (2026-10-26, review):** `review-9d44060d62b5b833` approved + acknowledged; 0 blockers, 7 advisories (R3-001..R3-007) documentadas arriba.
- **L8 (2026-10-26, higiene de merge):** el checkout principal tiene `PLAN.md`, `CHANGELOG.md` y `docs/design/README.md` modificados por el cierre de 132.8 **sin commitear** (no están en `main`). Al mergear `132.9-superficies` hay que resolver esos tres archivos combinando ambos cierres, no descartar ninguno.
- **L9 (2026-10-26, merge y cierre):** rebase de la rama sobre `main` `ff37d75a` (conflictos de CHANGELOG/README resueltos combinando 132.8 + 132.9); merge **ff-only** `4730bf9d`; worktree `132.9-superficies` cerrado con `scripts/worktree.ps1 close`. Post-merge en el checkout (con el fix P0 local sin commitear): `npm run build` limpio y `npx vitest run` **202 archivos / 1889 tests**. Sin push. Los hashes finales son `9bb905f4`, `a1b275f6`, `1f9580e6` y `4730bf9d`.
- **L10 (2026-10-26, estado del checkout):** el merge preservó el fix P0 sin commitear (benchmark/PR/1RM + `vite.config.ts` + su entrada en `CHANGELOG.md`). El worktree `132.10-cierre` sigue abierto en la rama `132.10-cierre` (limpio, sin mergear) y no se tocó: es de otra sesión.
