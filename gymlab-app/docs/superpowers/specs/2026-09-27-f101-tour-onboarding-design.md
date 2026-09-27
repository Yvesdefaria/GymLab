# F101 — Onboarding guiado: tour re-ver, tips de primera vez y fix del wizard

- **Fecha:** 2026-09-27
- **Fase:** 101 de `PLAN.md` (101.1–101.6)
- **Estado:** diseño aprobado en sesión (mockups + chat); **pendiente revisión de esta spec**
- **Origen:** pedido del usuario (2026-09-15) + notas 15 y 18 del plan; sesión de diseño 2026-09-27 en worktree aislado `f101` (multisesión)

## Decisiones aprobadas

| Tema | Decisión |
|---|---|
| Formato del tour | **Híbrido**: mini-explicación ilustrada por paso + resaltado (spotlight) de 1–2 elementos reales. |
| Navegación | **Guiada**: el tour navega solo entre secciones (con Siguiente / Atrás / Saltar). |
| Disparo | **Automático una sola vez** al terminar el wizard por la ruta «Empezar D1» (usuario nuevo). Usuarios existentes: nunca automático. |
| Repetición | Botón en **Ajustes → Ayuda** («Volver a ver el tour»), siempre disponible para todos. |
| Tips de primera vez | Secciones: **Inicio, Rutinas, Estadísticas, Logros, Más y Perfil**. Breves («qué podés conseguir»), una vez por sección, con «Entendido» y desactivables en Ajustes. Sin tips en Calculadoras, Guías, Suplementos ni equivalentes; sin explicaciones por dentro de las páginas. |
| Interacción tour | Fondo atenuado sin toques (es guiado); Atrás/Siguiente/Saltar siempre visibles; `Escape` = saltar. |
| Interacción tips | Tarjeta breve arriba de la TabBar; se marca vista al mostrarse; «Entendido» cierra. |

Mockups de referencia: `tour-format.html` y `tour-look.html` (sesión del companion visual; temp de la sesión).

## Alcance

**Incluye:** tour guiado (101.1), separación wizard↔tour (101.2), repetible desde Ajustes (101.3), tests unit + e2e (101.4), tips por apartado (101.5), fix de scroll del wizard (101.6).

**Fuera de alcance:** explicaciones profundas dentro de páginas; tips en secciones no listadas; rediseño del wizard (solo el fix); cambios al catálogo HELP de F90 (se usa de referencia de estilo, no se toca); backend/cuentas; dependencias nuevas.

## Diseño

### 1. Datos y flags

`src/domain/tour.ts` (nuevo):
- `TOUR_DONE_META_KEY = 'tourDone'` (bool) — el tour ya se vio (terminado o saltado).
- `TOUR_PENDING_META_KEY = 'tourPending'` (bool) — el wizard pidió el tour automático.
- `SECTION_TIPS_SEEN_META_KEY = 'sectionTipsSeen'` (mapa `Record<SectionId, true>`).
- `type SectionId = 'inicio' | 'rutinas' | 'estadisticas' | 'logros' | 'mas' | 'perfil'`.
- Helpers puros: `shouldAutoStartTour({ onboardingDone, tourPending, tourDone })`, `sectionForPath(pathname)`, `markSectionsSeen(seen, ids)`, `SECTION_IDS`.
- Persistencia: `metaRepo.setJson` (patrón vigente del repo) + `useMetaValue` para lectura reactiva. Los flags sobreviven reseeds (`reseeder` preserva `meta`).

Settings (`src/domain/settings.ts`):
- Nuevo campo `showSectionTips: boolean` (default `true`) en `AppSettings` + `DEFAULT_SETTINGS`.
- Toggle en Ajustes; apagado aplica al instante. Lo ya marcado como visto permanece marcado.

i18n:
- Nuevo catálogo `src/i18n/tour.ts` (`TOUR_STEPS`, `SECTION_TIPS`) con claves tipadas `I18nKey` (mismo patrón que `src/i18n/help.ts`).
- Copy en `src/i18n/locales/es/tour.ts` + `en/tour.ts`, mergeados en los `index.ts` de cada locale (patrón `help.ts`).

### 2. Gate del tour y arranque

- El tour auto-arranca solo si: `onboardingDone === true && tourPending === true && tourDone !== true` (las tres condiciones; evita cualquier solapamiento con el wizard).
- El wizard escribe los flags en este orden al completar: primero `onboardingDone`, después `tourPending` — **solo** en la ruta «Empezar D1» (`finish(true)`). «Ya entreno aquí» no marca pending. Cambio mínimo en `Onboarding.tsx`.
- El tour **no bloquea rutas ni el arranque**: es un overlay salteable; sin pending nunca aparece solo.
- Al terminar o saltar el tour: `tourDone = true` + `tourPending = false` (idempotente).
- Si se cierra la app a mitad del tour o antes de verlo: pending sigue en `true` → abre de nuevo al volver, desde el paso 1.

### 3. Tour (UI)

- `TourOverlay` montado en `AppShell` (sin portal — convención del repo), `z-[140]` (encima del máximo actual `z-[130]`), `role="dialog"` + `aria-modal="true"` + `aria-label` propio.
- `src/store/tourStore.ts` (zustand efímero, patrón `store/`): `{ source: 'auto' | 'replay' | null, start(source), close() }`. La persistencia la escriben los hosts del overlay, no el store.
- Por paso: fondo oscurecido + **spotlight** sobre el ancla (`data-tour="<id>"`): rect transparente con `box-shadow: 0 0 0 9999px rgba(0,0,0,.7)`, posicionado con `getBoundingClientRect()` y recalculado en resize/scroll.
- Globo: panel del tema oscuro, cuerpo + contador «n/8» + botones **Atrás / Siguiente / Saltar** (siempre visibles). Colocación arriba/abajo del ancla según espacio (reusa `src/components/ui/popoverPosition.ts`).
- Guiado: al cambiar de paso el overlay hace `navigate(ruta)` y espera el ancla (rAF/poll con timeout ~1s). Si el ancla no existe → **globo centrado** sin spotlight (degradación elegante; nunca se rompe).
- Mientras el tour está abierto el fondo no recibe toques (salvo los botones del globo). Saltar siempre disponible.
- Al **terminar** el último paso: `navigate('/')` + cierre. **Saltar** cierra donde estés (sin navegar).
- A11y: foco inicial al botón primario; `Escape` = saltar; foco devuelto al elemento previo al cerrar; texto del paso con `aria-live="polite"`; reduced-motion respetado (sin animaciones nuevas; el CSS global ya capa transiciones).
- Pasos (`TOUR_STEPS`, ids estables):

| # | id | Ruta | Ancla | Copy (es, referencia) |
|---|----|------|-------|----------------------|
| 1 | `bienvenida` | `/` | — (centrado) | «Bienvenido/a a GymLab. Te muestro la app en 1 minuto; podés saltearlo cuando quieras.» |
| 2 | `dia` | `/` | `home-hero` | «Este es tu día: la rutina lista para entrenar.» |
| 3 | `empezar` | `/` | `home-start` | «Tocá Empezar y arranca la sesión: series, pesos, RIR, notas y descanso automático.» |
| 4 | `tabbar` | `/` | `tabbar` | «Te movés desde acá: Entrenar, Rutinas, Estadísticas y Más.» |
| 5 | `rutinas` | `/rutinas` | `rutinas-main` | «Tus rutinas: la activa, el catálogo y las tuyas. Podés editar días, ejercicios y descansos.» |
| 6 | `estadisticas` | `/estadisticas` | `stats-tabs` | «Tus números: volumen, PRs, medidas y periodización. Se llena con tus entrenos.» |
| 7 | `logros` | `/logros` | `logros-progress` | «Medallas por constancia y récords. Acá ves cuánto te falta para la próxima.» |
| 8 | `cierre` | `/mas` | `mas-list` | «En Más: perfil, calculadoras, ajustes e informes. Listo, eso es la app.» |

- Anclas: se agregan atributos `data-tour="<id>"` en los componentes indicados (`HeroCard` → hero y botón Empezar, `TabBar` → nav, `RutinasPage`, `EstadisticasPage` → contenedor del `TabNav`, `AchievementsPage` → barra `data-progress="general"`, `MasPage` → lista del hub). El WP fija el nodo exacto si el sugerido no es el bloque estable.
- Cierre: último paso con botón **Terminar** (CTA opcional «Arrancar mi primer entreno» descartado en esta fase).

### 4. Tips de primera vez (101.5)

- `SectionTipHost` montado en `AppShell`: escucha `useLocation()`, mapea ruta→sección (`sectionForPath`, por prefijo: `/` exacto = inicio; `/rutinas...`, `/estadisticas...`, `/logros...`, `/mas...`, `/perfil...`).
- Se muestra si: `settings.showSectionTips === true` y `!seen[section]` y no hay tour abierto y el wizard está cerrado.
- Tarjeta breve arriba de la TabBar (mismo lenguaje visual del globo del tour): etiqueta «Primera vez acá» + cuerpo (qué podés conseguir) + botón **Entendido**.
- **Al mostrarse** se marca `sectionTipsSeen[section] = true` (mostrado = visto: si te vas sin tocar Entendido, no reaparece).
- Al **completar** el tour se marcan vistas las secciones que ya explicó: `inicio, rutinas, estadisticas, logros, mas`. `perfil` queda pendiente de su tip.
- **Saltar** el tour no marca nada: los tips aparecen naturalmente en las primeras entradas.

### 5. Ajustes → Ayuda (101.3)

- Nuevo `src/components/settings/HelpSection.tsx`, renderizado en `AjustesPage` (entre `GeneralSection` y `DataSection`):
  - Fila-acción «Volver a ver el tour» (patrón `min-h-[48px]` + `ChevronRight`, como `DataSection`): `tourStore.start('replay')`.
  - `Toggle` «Consejos de primera vez» + descripción breve, sobre `settings.showSectionTips`.
- Copy en el namespace `ajustes.*` (`core.ts`), es/en.

### 6. Fix del wizard (101.6)

Causa verificada en el código actual: el contenedor con scroll (`Onboarding.tsx:278`) tiene `pointer-events-none`, así que el gesto sobre el fondo no scrollea; el intento previo (`my-auto`, líneas 283–285) ayuda al centrado pero no al gesto. Tampoco hay manejo del IME en nativo.

- Quitar `pointer-events-none` del scroller (el wizard no se cierra por backdrop: no cambia nada más) + `overscroll-contain`.
- Teclado nativo: **verificar en el emulador** (obligatorio por tocar UI nativa) que el CTA no quede tapado por el IME en el paso Perfil. Si queda tapado: fix mínimo (desplazar a la vista el campo enfocado / `scrollIntoView`), documentado con evidencia.
- E2E: gesto real (wheel) sobre el fondo + aserción de CTA alcanzable y clickeable a 375×812 y en un viewport más bajo (p. ej. 360×640), **sin** depender del auto-scroll de Playwright.

### 7. Tests

**Unit (vitest, patrón vigente):**
- `tests/unit/domain/tour.test.ts` — gate, `sectionForPath`, `markSectionsSeen`, ids.
- `tests/unit/i18n/tourCatalog.test.ts` — el catálogo referencia claves i18n existentes y no vacías en es/en (patrón `helpCatalog.test.ts`).
- `tests/unit/store/tourStore.test.ts` — start/close/replay.

**E2E (Playwright Python, patrón `with_server.py`):**
- `tests/e2e/test_f101_wizard_scroll.py` — scroll alcanzable del wizard (WP1).
- `tests/e2e/test_f101_tour.py` — perfil limpio → wizard completo → tour abre solo → recorre (`/rutinas`, `/estadisticas`, `/logros`, `/mas`) → terminar → `tourDone` escrito y no re-abre al recargar; repetir desde Ajustes; tip de sección (1ª vez sí / 2ª no / con toggle off no); saltar no marca secciones vistas.

**Emulador:** smoke de teclado del wizard + montaje del tour/tips en nativo (si no es ejecutable en el entorno, encolar con la validación de release — no darlo por verificado solo con e2e web).

### 8. Work units (orden de implementación)

1. **WP1** — Wizard: fix de scroll + `tourPending` en `finish(true)` + e2e de alcance (101.2 parcial, 101.6).
2. **WP2** — Motor del tour: `domain/tour.ts`, `tourStore`, `TourOverlay` + spotlight + pasos/i18n + `data-tour` (101.1, 101.2). Si supera ~400 líneas de review, partir en «motor» y «contenido + anclas».
3. **WP3** — Ajustes → Ayuda: `HelpSection` + `showSectionTips` + replay (101.3).
4. **WP4** — Tips de primera vez: `SectionTipHost` + `sectionTipsSeen` + marcado al completar tour (101.5).
5. **WP5** — E2E completo + smoke de emulador + cierre de fase (`PLAN.md`, `CHANGELOG.md`) (101.4).

Cada WP: implementar → normalizar → verificar (`npm run build`, `npm test`, e2e del WP) → ciclo de review del candidato → commit en el worktree `f101` (sin push). Un commit por WP.

### 9. Riesgos y notas

- **Deriva de PLAN.md:** las líneas citadas quedaron viejas (hoy: `Onboarding.tsx:157-158` oculta; `:194-195` no re-escribe). Se actualiza PLAN.md al cerrar la fase.
- **Anclas frágiles:** mitigado con atributos `data-tour` propios + degradación a globo centrado.
- **IME/teclado nativo:** dependiente de verificación en emulador; no se asume resuelto.
- **Datos casi vacíos:** el tour auto ocurre con un usuario nuevo; el copy lo contempla («se llena con tus entrenos»).
- **«Patrón 90.5»:** no existe (fue descartado en F90); se sigue el patrón genérico de flags en `meta`.
- Sin dependencias nuevas.

### 10. Archivos

**Nuevos:** `src/domain/tour.ts`, `src/i18n/tour.ts`, `src/i18n/locales/es/tour.ts`, `src/i18n/locales/en/tour.ts`, `src/store/tourStore.ts`, `src/components/tour/TourOverlay.tsx`, `src/components/tour/SectionTipHost.tsx`, `src/components/settings/HelpSection.tsx`, `tests/unit/domain/tour.test.ts`, `tests/unit/i18n/tourCatalog.test.ts`, `tests/unit/store/tourStore.test.ts`, `tests/e2e/test_f101_wizard_scroll.py`, `tests/e2e/test_f101_tour.py`.

**Modificados:** `src/components/layout/AppShell.tsx`, `src/components/onboarding/Onboarding.tsx`, `src/domain/settings.ts`, `src/components/settings/index.ts`, `src/pages/AjustesPage.tsx`, `src/components/home/HeroCard.tsx`, `src/components/layout/TabBar.tsx`, `src/pages/RutinasPage.tsx`, `src/pages/EstadisticasPage.tsx`, `src/pages/AchievementsPage.tsx`, `src/pages/MasPage.tsx`, `src/i18n/locales/es/core.ts` + `en/core.ts` (namespace `ajustes`), `src/i18n/locales/es/index.ts` + `en/index.ts` (merge de `tour`), `CHANGELOG.md` y `PLAN.md` (cierre de fase).
