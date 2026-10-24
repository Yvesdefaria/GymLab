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

- **T0 — Spec + doc ODD.** Estado: hecho (commit pendiente en el mismo bloque docs).
- **T1 — Dominio: conteos, filtros y semana + tests rojo→verde.** `src/domain/routines.ts`, `tests/unit/domain/routines.test.ts`. Estado: pendiente.
- **T2 — Repo + hook de conteos.** `getExerciseCounts`, `useRoutineExerciseCounts`. Estado: pendiente.
- **T3 — Chips y grupos + tests de componente.** `RoutineObjectiveChips`, `RoutineObjectiveGroup`. Estado: pendiente.
- **T4 — Tarjeta editorial + test de componente.** `RoutineCard` reescrita, CSS legado eliminado. Estado: pendiente.
- **T5 — Sheets de creación y filtros + tests.** `NewRoutineSheet`, `RoutineFiltersSheet`. Estado: pendiente.
- **T6 — Página y modo resultados.** `RutinasPage` reescrita; anclajes de tour. Estado: pendiente.
- **T7 — i18n es/en.** Claves de §7 de la spec. Estado: pendiente.
- **T8 — E2E nuevos y actualizados.** `test_rutinas_nocturno.py`, F119, T8, F47, F101. Estado: pendiente.
- **T9 — Verificación, CHANGELOG, review y commits.** Estado: pendiente.

## Log

- **L1 (2026-10-24, pedido del usuario, verbatim):** «activa multisesion, quiero rediseñar la pagina de rutinas siguiendo el  diseño que esta en docs, nocturno, lee son 2 creo, quiero que me muestres mockups de como quedaria, ademas si es necesario usa grill me».
- **L2 (2026-10-24, corrección de rumbo, verbatim):** «guarda la A como opcion para que me des mas ejemplos, ya que me gustaria ver diseños con tarjetas con imagenes como hasta ahora, pero con un diseño mas limpio y estilado, asi como ahora se ve muy sobrio, dame mas ejemplos».
- **L3 (2026-10-24, elección):** «opcion E» (tarjeta editorial a sangre).
- **L4 (2026-10-24, respuestas del grilling, verbatim):** «q1a,q2 elegir una ramdon del catalogo como hasta ahora, en un futuro dare la posibilidad de añadir una foto, q3a, q4c que de a elegir si crear una manual o con ayuda, q5b, si tienes mas dudas(preguntame) o cambia mucho(mockup)».
- **L5 (2026-10-24, aprobación):** «dale». Congela E refinada (4 estados) y autoriza spec + implementación.
