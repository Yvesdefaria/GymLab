# Rutinas — rediseño Nocturno Minimal (dirección E)

Objetivo: rediseñar `/rutinas` con tarjeta editorial (portada + título sobre scrim + hairline de métricas), catálogo agrupado por objetivo, chips de objetivo + sheet de filtros y «+» con sheet de creación. Rama `rutinas-nocturno` (worktree aislado por pedido de multisesión). Runner: `vitest` (`npm test`) + `npm run build`; e2e con Playwright Python. Spec: `docs/superpowers/specs/2026-10-24-rutinas-nocturno-minimal-design.md`.

## Specs

- **S1 — Header y «+».** `AppHeader` con kicker `{count} plantillas y programas`, título `Rutinas` y acción redonda de 44×44 con `Plus` (`aria-label` = `rutinas.nueva`), anclada como `data-tour="rutinas-actions"`. Abre el sheet de creación.
- **S2 — Tarjeta editorial.** `<article class="routine-card">` sin sombras ni glows: portada `object-cover` de 146 px con scrim, kicker del objetivo (o `Basada en {título}` / `Propia`), título Oswald 18 px clampleado a 2 líneas, fila de meta `{nivel} · {días/semana} · {N ejercicios}` y chevron. La tarjeta activa se marca con borde `cta/48` y kicker `Activa`.
- **S3 — Favorito accesible.** Botón de 44×44 sobre la portada, `aria-pressed`, `aria-label` de añadir/quitar, hermano del link (nunca anidado). La tarjeta entera linkea al detalle vía `.routine-card__link`.
- **S4 — Chips de objetivo.** Fila horizontal con `Todos` + los 5 objetivos y sus conteos (68/13/15/9/10/21), `aria-pressed`, alto táctil ≥44 px. Seleccionar uno entra en modo resultados; `Todos` lo desactiva.
- **S5 — Grupos por objetivo.** Con `Todos`, las 68 predefinidas se muestran como 5 filas de 46 px (`Fuerza 13`, `Volumen 15`, `Definición 9`, `Resistencia 10`, `General 21`), acordeón de un grupo abierto a la vez, `aria-expanded`/`aria-controls`. Abierto, muestra todas las tarjetas de ese objetivo.
- **S6 — Modo resultados.** Con objetivo, tipo, nivel o búsqueda activos se ocultan En curso / Favoritas / Mías y se lista en plano lo que cumple **todos** los criterios (query sobre título localizado, objetivo, nivel y tipo; las propias participan). Encabezado `{count} resultados`; sin coincidencias, `vacioBusqueda` o `vacioFiltros`.
- **S7 — Sheet de creación.** El «+» abre un bottom sheet con «Crear manualmente» (`/rutinas/nueva`) y «Con ayuda» (`/rutinas/planificador`), más Cancelar. `role="dialog"`, `aria-modal`, Escape, backdrop y foco inicial; devuelve el foco al «+».
- **S8 — Sheet de filtros.** Bottom sheet con Tipo (Todas/Sesión suelta/Programa) y Nivel (3), estado borrador, `Limpiar` y `Ver {n} rutinas` que aplica y cierra. Mismo shell a11y que S7.
- **S9 — Conteo de ejercicios.** `countItemsByRoutine(days, items)` puro en `domain/routines.ts`; `routineRepo.getExerciseCounts()` y `useRoutineExerciseCounts()` lo exponen. Es la suma de items de todos los días (slots, no únicos); si falta, el tramo se omite.
- **S10 — En curso.** Si hay `activeProgram`, sección «En curso» con la tarjeta activa; el encabezado muestra `Semana N` calculada por `programWeekNumber(startDate, today)`. Sin programa, la sección no existe.
- **S11 — Portadas propias.** Las rutinas propias siguen tomando una portada prestada del catálogo por `id % length` (o `/images/routines/default.jpg`). Sin subida de portada en esta fase.
- **S12 — i18n, a11y y temas.** Todas las cadenas nuevas en es/en; 44 px; `aria-pressed`/`aria-expanded`; verde solo para logro; funciona en noche/día y 6 paletas; sin animaciones nuevas. Se actualizan `test_f119`, `test_t8`, `test_f47` y `test_f101` en el mismo candidato.
- **S13 — Entrega.** Commits work-unit en `rutinas-nocturno`, review RDD antes de commitear, sin push. CHANGELOG actualizado.

## Tasks

- **T0 — Spec + doc ODD.** Estado: hecho. Commit `dd3b5eb8`.
- **T1 — Dominio: conteos, filtros y semana + tests rojo→verde.** `countItemsByRoutine`, `routineMatchesFilters`, `programWeekNumber` en `src/domain/routines.ts`; `tests/unit/domain/routineCatalog.test.ts` (12 casos). Estado: hecho.
- **T2 — Repo + hook de conteos.** `routineRepo.getExerciseCounts()` + `useRoutineExerciseCounts`; 2 casos nuevos en `routineRepo.test.ts`. Estado: hecho.
- **T3 — Chips y grupos + tests de componente.** `RoutineObjectiveChips` (3 casos), `RoutineObjectiveGroup`, `RoutineSection`. Estado: hecho.
- **T4 — Tarjeta editorial + test de componente.** `RoutineCard` reescrita (7 casos), scrim `.routine-cover`, CSS legado eliminado. Estado: hecho.
- **T5 — Sheets de creación y filtros.** `BottomSheet`, `NewRoutineSheet`, `RoutineFiltersSheet`. Estado: hecho.
- **T6 — Página y modo resultados.** `RutinasPage` reescrita; anclajes `rutinas-actions`/`rutinas-filters`; arranque en frío. Estado: hecho.
- **T7 — i18n es/en.** Claves nuevas en ambos locales. Estado: hecho.
- **T8 — E2E nuevos y actualizados.** `test_rutinas_nocturno.py` (nuevo), F119 y T8 reescritos, F47 y F101 verificados. Estado: hecho.
- **T9 — Verificación, CHANGELOG, review y commits.** Estado: hecho. Commits `7f704f34` (review `review-7e8bfb2d7c9dbfb2` approved + acknowledged) y `2ef577fa` (follow-up; assess medium/under_budget, `review_due: false`).

## Log

- **L1 (2026-10-24, pedido del usuario, verbatim):** «activa multisesion, quiero rediseñar la pagina de rutinas siguiendo el  diseño que esta en docs, nocturno, lee son 2 creo, quiero que me muestres mockups de como quedaria, ademas si es necesario usa grill me».
- **L2 (2026-10-24, corrección de rumbo, verbatim):** «guarda la A como opcion para que me des mas ejemplos, ya que me gustaria ver diseños con tarjetas con imagenes como hasta ahora, pero con un diseño mas limpio y estilado, asi como ahora se ve muy sobrio, dame mas ejemplos».
- **L3 (2026-10-24, elección):** «opcion E» (tarjeta editorial a sangre).
- **L4 (2026-10-24, respuestas del grilling, verbatim):** «q1a,q2 elegir una ramdon del catalogo como hasta ahora, en un futuro dare la posibilidad de añadir una foto, q3a, q4c que de a elegir si crear una manual o con ayuda, q5b, si tienes mas dudas(preguntame) o cambia mucho(mockup)».
- **L5 (2026-10-24, aprobación):** «dale». Congela E refinada (4 estados) y autoriza spec + implementación.
- **L6 (2026-10-24, implementación):** worktree `.worktrees/rutinas-nocturno` (rama `rutinas-nocturno`, base `8227a797`). TDD rojo→verde en dominio (12 casos), repo (2), tarjeta (7) y chips (3). Se reescribió `RoutineCard` (portada 146 + scrim + kicker + título clamp + meta + favorito 44), se sumaron `RoutineObjectiveChips`, `RoutineObjectiveGroup`, `RoutineSection`, `BottomSheet`, `NewRoutineSheet`, `RoutineFiltersSheet` y `useRoutineExerciseCounts`; `RutinasPage` pasa a modo base / resultados / sheets. Se eliminaron el bloque `.routine-card*` de `index.css` y `RoutineFilters.tsx`. Arranque en frío: el primer grupo se abre solo si no hay programa, favoritas ni propias. Decisión de conteo: los chips y el kicker cuentan todas las rutinas (predefinidas + propias) para que el número coincida con el modo resultados; «Predefinidas» mantiene su propio conteo.
- **L7 (2026-10-24, verificación):** `npm test` **178 archivos / 1763 tests**; `npm run build` limpio. E2E: `test_rutinas_nocturno.py` ALL OK (base, acordeón 13, resultados, empty state, filtros con Limpiar/Ver 70, creación manual y con ayuda, 0 pageerror), `test_f119_rutina_card.py` reescrito ALL OK (alturas 175-195, clamp, kicker sin desborde, estrella), `test_t8.py` actualizado ALL OK (panel-elevated del detalle), `test_f101_tour.py` ALL OK. **F47**: el tramo de `/rutinas` pasa; falla en `/perfil` por `get_by_role("tab", name="Resumen")`, una aserción anterior al rediseño de perfil (`523610e3`) — falla pre-existente en `main`, fuera de alcance.


- **L8 (2026-10-24, review nativo):** consentimiento concedido; START `review-7e8bfb2d7c9dbfb2` (medium, lens reliability) con 27 archivos / 1855 líneas. Reviewer **approved** con 9 hallazgos **no bloqueantes** (informational) y acknowledge ejecutado (`authority: burned`). Commit del candidato revisado: `7f704f34`.
- **L9 (2026-10-24, follow-up del review):** se corrigieron los hallazgos con impacto real y se endurecieron tests: **R3-1** el título/kicker de la portada usan colores claros fijos (`#f8fafc` / `#fdddb4`) porque el scrim es siempre oscuro y en tema día `text-fg`/`gold-bright` son oscuros; **R3-2** `resultados_one` en es/en («1 resultado»); **R3-4** `useMetaIdFavorites` expone `loaded` y el arranque en frío espera a las favoritas (queda un residuo teórico si el programa activo carga después: abre un grupo de más, no rompe nada); **R3-3** el e2e ahora verifica Volumen 16 y que la rutina propia aparece en resultados; **R3-5** test de kicker «Activa» (la sección En curso sigue sin e2e propio); **R3-6** tests de `BottomSheet` (foco, Escape, backdrop) y del borrador del sheet de filtros; **R3-7** los conteos sensibles del e2e usan `expect(...).to_have_count`. **R3-8** (`networkidle` en T8) y **R3-9** (F47 falla en /perfil) son pre-existentes y quedan documentados.
- **L10 (2026-10-24, verificación final):** `npm test` **180 archivos / 1771 tests**; `npm run build` limpio; e2e `test_rutinas_nocturno.py` ALL OK con los asserts nuevos.

