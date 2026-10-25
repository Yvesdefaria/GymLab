# 132.3 — Subpáginas de Rutinas al lenguaje Nocturno Minimal

Rama `132.3-rutinas` (worktree `.worktrees/132.3-rutinas`), base `main @ 0beebe65`. Run: `npm run build` (typecheck real), `npm test`, e2e Python con `tests/e2e/scripts/with_server.py`. Alcance: **rediseño puro**, cero cambios funcionales.

## Specs

- **S1 — Detalle `/rutinas/:slug`**: portada editorial de 150 px (misma foto/kicker que la tarjeta del catálogo, scrim oscuro, favorito 44 px), fila hairline de stats (ejercicios / días / min del día), tabs compactos por día, filas de ejercicio con índice `01` y `4×8 · 120s` a la derecha, «Seguir programa» como sección hairline al final, barra fija con `Empezar · ~N min` + `Repetir última sesión`, y `Eliminar rutina` como fila ghost danger (solo propias) con el `ConfirmSheet` de siempre. El lápiz del header clona una predefinida.
- **S2 — Builder `/rutinas/nueva` y `/rutinas/:slug/editar`**: formulario hairline (nombre en Oswald, objetivo y nivel como filas con chevron, descripción), días numerados `DÍA N` con grip y papelera, ejercicios como filas compactas de 44 px que despliegan series/reps/descanso/superserie (una fila abierta por día), barra fija `Guardar rutina`. Drag & drop de días e ítems se conserva.
- **S3 — Planificador `/rutinas/planificador`**: wizard de 3 pasos con progreso hairline y contador `Paso N de 3`, pregunta grande en Oswald, opciones hairline de 56 px con avance automático, paso 3 con días segmentados + duración + equipamiento; resultado con secciones hairline por día (minutos + ejercicios), aviso de cobertura y CTA `Guardar como mi rutina`.
- **S4 — Cero cambios funcionales**: mismas rutas, hooks, repos y datos; sin features nuevas; i18n es/en en todas las cadenas nuevas; `prefers-reduced-motion` y touch ≥ 44 px.
- **S5 — Lenguaje**: reutilizar primitivas C1 (`StatsStatRow`, `TabNav` compact, `EmptyState`, `BottomSheet`) y eliminar `panel-light` / `panel-elevated` como contenedor principal en estas pantallas; un solo acento semántico, hairline en vez de tarjeta.
- **S6 — Verificación**: `npm run build`, `npm test`, e2e de las tres pantallas (nuevo o actualizado), 0 `pageerror`, revisión visual 375 px + tablet.

## Tasks

| ID | Tarea | Specs | Ruta | Estado | Commit |
|---|---|---|---|---|---|
| T1 | Detalle: hero editorial + stats + filas + follow + barra | S1,S4,S5,S6 | inline | hecho | `7598d185` |
| T2 | Builder: formulario hairline + filas compactas expandibles | S2,S4,S5,S6 | inline | hecho | `be8bf761` |
| T3 | Planificador: wizard + resultado hairline | S3,S4,S5,S6 | inline | hecho | `2e5bf0ad` |
| T4 | Pulido del ciclo de review (foco, acordeón, estado elegido, borrado) | S5,S6 | inline | hecho | `acd8c008` |
| T5 | Docs: PLAN.md, CHANGELOG, NOCTURNO §19, README de diseño | S6 | inline | hecho | `c89e69fa` |

## Decisiones tomadas (aprobadas por el usuario)

- **Detalle A**: portada editorial (la tarjeta se abre). **Builder A**: filas compactas expandibles (un toque extra para editar targets). **Planificador A**: una pregunta por pantalla con avance automático.
- El título del detalle vive en el `AppHeader` sticky (SEO + contexto al scrollear); la portada lleva kicker `objetivo · nivel` y descripción sobre el scrim, como la tarjeta.
- `Eliminar` deja de ser un botón a la par de `Editar`: pasa a fila ghost danger al final, con el mismo `ConfirmSheet`.
- El builder abre **una fila por vez** (acordeón por día) y pierde la virtualización de ítems, porque las filas expandidas tienen altura variable; el detalle conserva la virtualización de filas fijas.
- Copy: el CTA pasa de `Play · ~N min` a `Empezar · ~N min` (es) / `Start · ~N min` (en).

## Log

**L1** (pedido original, verbatim): «activa multisesion,vamos a hacer 132.3 — Subpáginas de Rutinas (pendientes; el catálogo /rutinas ya está en 132.1), si necesitas preguntarme usa grill me y muestrame los ejemplos en mockups»

**L2** (respuestas del grilling): «q1A. q2A. q3A. si en esta sesion solo es rediseño, si hay algun otro cambio sera en otra sesion con sus respectivos cambios»

**L3** (exploración): worktree `132.3-rutinas` creado con `scripts\worktree.ps1 open`; el script corta en `git worktree add` por el stderr de git en PowerShell 7, así que la junction de `node_modules` se creó a mano (`mklink /J`). Estado actual: detalle con `panel-elevated`/`panel-light`, builder con `Panel` y filas de 200 px fijas, planificador con `rounded-xl border` y cards. Mockups: `.superpowers/brainstorm/132.3-rutinas-20261024/content/direcciones-v1.html` (server local, 3 grupos × 2 opciones).

**L4** (implementación, 2026-10-25): T1 `7598d185`, T2 `be8bf761`, T3 `2e5bf0ad`, T4 `acd8c008`. Verificación por tarea: `npm run build` limpio, `npm test` 181 archivos / 1780 tests, e2e nuevos `test_132_3_rutinas_{detalle,builder,planificador}.py` OK, más `test_f88`, `test_f66_f67_planificador`, `test_f66_f67_rutina_guiada` y `test_rutinas_nocturno` OK. Revisión visual a 375 px de las tres pantallas (0 `pageerror`).

**L5** (desvíos del plan): (a) el título del detalle quedó en el `AppHeader` sticky en vez de sobre la foto, para no duplicar h1/SEO; (b) se retiró la virtualización de ítems del builder porque las filas expandidas tienen altura variable; (c) el `PlanDayCard` conserva los músculos dentro del `h3` (como `<span>`) porque el resumen del onboarding comparte el componente y su e2e los busca ahí; (d) `test_f88.py` y `test_f66_f67_planificador.py` siembran `settings.language='es'` — estaban rojos en este entorno porque el default del producto es inglés y el headless corre en en-US, no por el rediseño.

**L6** (hallazgos informativos de review, no bloqueantes): captura `detalle-custom.png` posterior al borrado; seed de IndexedDB repetido en tres e2e; e2e del planificador con aserciones por clase CSS y regex de página; BOM UTF-8 perdido en las locales al borrar claves muertas; `TOTAL_STEPS` como alias del índice del paso final. Todos en `NOCTURNO-MINIMAL.md` §19.6.

**L7** (estado de entrega): rama `132.3-rutinas` con cuatro commits, **sin push**. El cierre del worktree (rebase + `merge --ff-only` + `worktree.ps1 close`) queda pendiente de que las otras sesiones estén idle y de la revisión del usuario.

**L8** (merge + cierre, 2026-10-25): `git rebase main` (conflictos solo en `CHANGELOG.md` y `NOCTURNO-MINIMAL.md`; 132.2 había tomado §18, así que este bloque pasó a §19 y se actualizaron las referencias en PLAN/README) → `git merge --ff-only 132.3-rutinas` → `main` en `c89e69fa`. Verificación post-rebase sobre main: `npm run build` limpio, `npm test` **182 archivos / 1785 tests**, e2e de detalle/builder/planificador + F88 + F66 guiada ALL OK. Antes del merge se borró la copia untracked del doc en `odd/tasks/` (colisionaba con la versión trackeada del branch).
Cierre del worktree: rama `132.3-rutinas` borrada y worktree desregistrado; `worktree.ps1 close` falló en `git worktree remove` con Permission denied porque un Vite de e2e (puerto 5301) seguía vivo y tomaba la carpeta. Se mató el proceso y se removió el contenido, pero la carpeta vacía `.worktrees\132.3-rutinas\gymlab-app` queda tomada por un handle del host (se puede borrar al reiniciar la app). Ambos gotchas quedaron documentados en `NOCTURNO-MINIMAL.md` §16.2.
