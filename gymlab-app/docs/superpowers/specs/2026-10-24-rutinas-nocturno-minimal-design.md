# Spec — Rediseño de `/rutinas` con Nocturno Minimal (dirección E)

> Rama `rutinas-nocturno` (worktree `.worktrees/rutinas-nocturno`, multisesión pedida por el usuario).
> Referencia visual: `.superpowers/brainstorm/rutinas-redesign-20261024/content/rutinas-e-v2.html`
> (4 estados: base, objetivo activo, sheet de creación, sheet de filtros).
> Diseño base: `gymlab-app/docs/design/NOCTURNO-MINIMAL.md` §10.4 + `docs/design/README.md`.

## 1. Objetivo

Reemplazar las tarjetas de rutina con foto de fondo (glow, sombras, badges apilados) por una **tarjeta editorial**: portada a sangre, título sobre un scrim, una hairline de metadatos y el favorito en un botón de 44 px. El catálogo de 68 rutinas predefinidas se agrupa por objetivo, colapsado por defecto, y se filtra por chips de objetivo + un bottom sheet de tipo/nivel. Crear una rutina pasa a ser una decisión explícita (manual o con ayuda) en un sheet.

## 2. Decisiones cerradas (grilling 2026-10-24)

| # | Decisión | Respuesta |
|---|---|---|
| Q1 | Catálogo de 68 | **A** — todas usan la tarjeta editorial; agrupadas por objetivo con grupos colapsables; los chips de objetivo filtran. |
| Q2 | Portada de rutinas propias | **Foto prestada del catálogo** (determinística por id, como hoy). Portada propia queda como feature futura, fuera de alcance. |
| Q3 | Filtros | **A** — una fila de chips de objetivo + bottom sheet «Filtros» con tipo y nivel. |
| Q4 | Acciones de creación | **C** — el «+» del header abre un sheet con «Crear manualmente» (`/rutinas/nueva`) y «Con ayuda» (`/rutinas/planificador`). |
| Q5 | Meta de la tarjeta | **B** — nivel · días/semana · **N ejercicios**, con una consulta agregada. |

Decisión del agente aceptada con el «dale» final: con filtro o búsqueda activa, la pantalla entra en **modo resultados** y oculta En curso / Favoritas / Mías.

## 3. Alcance

**Dentro:** `RutinasPage`, `RoutineCard`, chips de objetivo, grupos por objetivo, sheets de creación y filtros, conteo agregado de ejercicios, i18n es/en, tests unitarios/componente/e2e, tour anchors, CHANGELOG.

**Fuera:** `/rutinas/:slug`, `/rutinas/nueva`, `/rutinas/planificador` (solo se enlazan), subida de portada propia, cambios en el detalle o el builder, nuevas paletas o tokens.

## 4. Composición

### 4.1 Shell y header

- `AppHeader` existente: `kicker={t('rutinas.subtitulo', { count })}` (ej. «68 plantillas y programas»), `title={t('rutinas.titulo')}` (Rutinas), `actions` = botón redondo de 44×44 con `Plus` (`aria-label` = `rutinas.nueva`), `data-tour="rutinas-actions"`.
- Contenido: `px-4 pb-8`, ritmo `space-y-5`; secciones separadas por hairline.
- El botón «+» abre el sheet de creación (§4.6).

### 4.2 Tarjeta editorial (`RoutineCard`)

Anatomía (390 px):

```text
┌──────────────────────────────┐
│ [portada 146 px, object-cover]│
│  KICKER            (★ 44px)  │
│  Título Oswald 18px          │
├──────────────────────────────┤
│ Nivel · 4 días/semana · 18 ej│ ›│
└──────────────────────────────┘
```

- Raíz `<article class="routine-card">`, radio 16 px, borde `border-border/55`, `bg-bg-elevated` de fondo mientras carga la imagen. **Sin sombras ni glows.**
- `img` lazy + `decoding="async"`, `alt=""` (decorativa), `object-cover`, alto 146 px.
- Scrim: `linear-gradient(180deg, rgba(10,10,11,.38) 0%, rgba(10,10,11,.10) 26%, rgba(10,10,11,.16) 46%, rgba(10,10,11,.72) 78%, rgba(10,10,11,.95) 100%)`.
- Kicker (10 px equivalentes: Barlow 600, 8.5 px, `tracking .17em`, mayúsculas, `text-gold-bright`): objetivo localizado; en rutinas propias `Basada en {título}` o `Propia`; nunca ambos.
- Título: Oswald 500 18 px, máximo 2 líneas con `line-clamp-2`, `text-fg`.
- Fila de meta (hairline superior, 10 px, `text-muted`): `{nivel} · {días/semana} · {N ejercicios}`; `sesionSuelta` reemplaza a los días cuando `daysCount === 1`; si el conteo no está disponible se omite el tramo. Chevron a la derecha (`aria-hidden`).
- Favorito: `<button>` de 44×44 sobre la portada (glass: `bg-black/40`, `backdrop-blur`, borde `white/12`), `aria-pressed`, `aria-label` = `anadirFavAria`/`quitarFavAria`. No anidado dentro del link.
- Link: `<Link class="routine-card__link">` cubre portada + textos; `aria-label` = título localizado. El botón de favorito queda como hermano dentro de la tarjeta.
- Estado activo (`isActive`): borde `border-cta/48`; kicker = `Activa`; sin badge extra.
- Hover: solo `border-color` a `border-cta/80`, `transition-colors`. Sin `translate` ni sombra.
- `content-visibility: auto` + `contain-intrinsic-size: 146px` para catálogos largos.

Clases conservadas para e2e: `.routine-card`, `.routine-card__link`, `.routine-card__title`, `.routine-card__meta`, `[aria-pressed]`.

### 4.3 Chips de objetivo

- Fila horizontal con `HScroll` (drag scroll ya global) o `overflow-x-auto` sin scrollbar.
- Opciones: `Todos` + 5 objetivos, cada una con su conteo de predefinidas (`68`, `13`, `15`, `9`, `10`, `21`).
- Chip: `rounded-full border border-border/40 px-3 py-1.5 text-[10px]`; seleccionado `border-gold/55 bg-gold/10 text-gold-bright`; `aria-pressed`; alto táctil ≥ 44 px vía `min-h-11` + `items-center` o `after:-inset-*`.
- Seleccionar un objetivo entra en modo resultados (§4.5) y `Todos` lo desactiva.

### 4.4 Grupos por objetivo

- Cinco filas (`Fuerza 13`, `Volumen 15`, `Definición 9`, `Resistencia 10`, `General 21`), `min-height: 46 px`, hairline entre filas, punto dorado de 5 px, nombre 12 px, conteo muted, chevron.
- Acordeón: **un grupo abierto a la vez**. Abierto, renderiza todas las tarjetas de ese objetivo y el chevron gira 180°.
- `aria-expanded` + `aria-controls`; el contenedor del grupo es un `<button>`.

### 4.5 Modo resultados

`isFiltering = objective !== null || type !== 'todas' || level !== null || debouncedQuery !== ''`.

- **Sin filtros:** En curso (si hay programa) → Favoritas (si hay) → Mis rutinas (si hay) → Predefinidas (grupos colapsados).
- **Con filtros:** se ocultan En curso/Favoritas/Mías y se muestra una única lista plana de rutinas que cumplen **todos** los criterios (query sobre título localizado + objetivo + nivel + tipo). Las rutinas propias también participan. Orden: orden del catálogo (seed) y después las propias por id.
- Encabezado de la lista: `{count} resultados`.
- Sin coincidencias: `EmptyState` con `vacioBusqueda` (si hay query) o `vacioFiltros`.
- Cambiar de filtro resetea el grupo abierto.

### 4.6 Sheet de creación

- Contenido: grabber 40×4, título `rutinas.nuevaSheet.titulo`, subtítulo `rutinas.nuevaSheet.subtitulo`.
- Dos filas de 56 px: icono en círculo `bg-gold/10 text-gold`, título, subtítulo, chevron.
  - Manual → `navigate('/rutinas/nueva')`.
  - Con ayuda → `navigate('/rutinas/planificador')`.
- `Cancelar` (Button outline) cierra.
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, cierre por Escape y por backdrop; foco inicial en la primera fila y devolución del foco al «+».

### 4.7 Sheet de filtros

- Título `rutinas.filtros.titulo`, subtítulo `rutinas.filtros.subtitulo`.
- Grupo **Tipo**: `Todas` / `Sesión suelta` / `Programa` (chips, `aria-pressed`).
- Grupo **Nivel**: `Principiante` / `Intermedio` / `Avanzado`.
- Estado **borrador**: no aplica hasta confirmar. `Limpiar` resetea el borrador; `Ver {n} rutinas` aplica y cierra. El conteo se recalcula en vivo contra el catálogo + objetivo + query actuales.
- Mismo shell a11y que §4.6.

### 4.8 Estados

- **Vacío de catálogo:** `vacioSinRutinas` + `vacioSugerencia` (existente), solo si no hay predefinidas ni resultados.
- **Carga:** sin skeletons nuevos; las imágenes cargan lazy y la tarjeta muestra `bg-bg-elevated` debajo.
- **Sin favoritas / sin propias:** la sección no se renderiza (como hoy).

## 5. Datos reales

- **Conteo de ejercicios:** `countItemsByRoutine(days, items)` en `src/domain/routines.ts` = suma de items de todos los días de cada rutina (slots programados, no ejercicios únicos). `routineRepo.getExerciseCounts()` lee `routineDays` + `routineItems` y delega en la función pura; `useRoutineExerciseCounts()` lo expone con `useLiveQuery`. Costo: un `toArray` de ~1.400 items, solo cuando cambian las tablas.
- **Rutinas propias:** sin `imageUrl`; usan `catalogImages[routine.id % catalogImages.length]` y, si no hay catálogo, `/images/routines/default.jpg` (mismo criterio que hoy).
- **Activa:** `useActiveProgram()`; el encabezado «En curso» muestra a la derecha `Semana N` calculada desde `program.startDate` con `programWeekNumber(startDate, today)` (función pura, día local). Sin programa, la sección no existe.
- **Favoritas:** `useRoutineFavorites()` sin cambios.
- **Búsqueda:** `useDebouncedValue(query, 200)` sobre el título localizado (`localizeRoutine`).

## 6. Componentes y archivos

| Pieza | Archivo |
|---|---|
| Página y composición | `src/pages/RutinasPage.tsx` |
| Tarjeta editorial | `src/components/routines/RoutineCard.tsx` (reescritura) |
| Chips de objetivo | `src/components/routines/RoutineObjectiveChips.tsx` (nuevo) |
| Fila de grupo | `src/components/routines/RoutineObjectiveGroup.tsx` (nuevo) |
| Sheet de creación | `src/components/routines/NewRoutineSheet.tsx` (nuevo) |
| Sheet de filtros | `src/components/routines/RoutineFiltersSheet.tsx` (nuevo) |
| Filtros (tipos + chips) | `src/components/routines/RoutineFilters.tsx` (reutiliza `FilterChips`) |
| Dominio | `src/domain/routines.ts` (+ `countItemsByRoutine`, `routineMatchesFilters`, `programWeekNumber`) |
| Repo | `src/data/repositories/types.ts` (+ `getExerciseCounts`), `dexie/routineRepo.ts` |
| Hook | `src/hooks/useRoutineExerciseCounts.ts` (nuevo) |
| CSS | `src/index.css`: eliminar el bloque `.routine-card*` (≈90 líneas) y agregar solo el scrim de la portada |
| i18n | `src/i18n/locales/{es,en}/routines.ts` |
| Changelog | `CHANGELOG.md` |

## 7. i18n (es/en)

| Clave | es | en |
|---|---|---|
| `rutinas.enCurso` | `En curso` | `In progress` |
| `rutinas.semana` | `Semana {{n}}` | `Week {{n}}` |
| `rutinas.todos` | `Todos` | `All` |
| `rutinas.ejercicios` / `_other` | `{{count}} ejercicio` / `{{count}} ejercicios` | `{{count}} exercise` / `{{count}} exercises` |
| `rutinas.resultados` | `{{count}} resultados` | `{{count}} results` |
| `rutinas.filtros.titulo` | `Filtros` | `Filters` |
| `rutinas.filtros.subtitulo` | `Acotá el catálogo de rutinas` | `Narrow down the routine catalog` |
| `rutinas.filtros.limpiar` | `Limpiar` | `Clear` |
| `rutinas.filtros.ver` / `_one` | `Ver {{count}} rutinas` / `Ver 1 rutina` | `Show {{count}} routines` / `Show 1 routine` |
| `rutinas.nuevaSheet.titulo` | `Nueva rutina` | `New routine` |
| `rutinas.nuevaSheet.subtitulo` | `¿Cómo querés armarla?` | `How do you want to build it?` |
| `rutinas.nuevaSheet.manual` | `Crear manualmente` | `Create manually` |
| `rutinas.nuevaSheet.manualDesc` | `Elegís los días y los ejercicios vos` | `Pick the days and exercises yourself` |
| `rutinas.nuevaSheet.auto` | `Con ayuda` | `With help` |
| `rutinas.nuevaSheet.autoDesc` | `Objetivo, nivel y equipamiento: te la armamos` | `Goal, level and equipment: we build it for you` |

Se reutilizan `rutinas.{titulo, subtitulo, favoritas, misRutinas, predefinidas, nueva, activa, sesionSuelta, diasSemana, basadaEn, propia, buscarPlaceholder, buscarAria, vacioBusqueda, vacioFiltros, vacioSinRutinas, vacioSugerencia, filtros.{tipo,tipoTodas,tipoPrograma,objetivo,nivel}}` y `layout.confirm.close`.

## 8. Accesibilidad y temas

- Todo botón real mide ≥ 44×44 px; chips con `aria-pressed`; grupos con `aria-expanded`/`aria-controls`.
- Sheets con `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape, backdrop y foco inicial; se sigue el patrón existente del repo (sin focus trap, igual que `ConfirmSheet` y `RoutineDestinationSheet`).
- Imágenes decorativas `alt=""`; el nombre accesible de la tarjeta lo da el `aria-label` del link.
- Contraste: kicker y meta en `text-muted` sobre `bg`; el scrim garantiza el título sobre cualquier portada, en noche y día.
- Sin animaciones nuevas; `transition-colors` respeta `prefers-reduced-motion` por ser color.
- Verde reservado a logro: no se usa en objetivos ni grupos. El punto de grupo y los chips son dorados.
- Funciona con las 6 paletas × 2 temas (solo tokens).

## 9. Tests (TDD)

**Unitarios (rojo→verde):**
- `tests/unit/domain/routines.test.ts`: `countItemsByRoutine` (varios días, día sin items, día desconocido), `routineMatchesFilters` (query case-insensitive, objetivo, nivel, tipo sesión/programa, combinación), `programWeekNumber` (mismo día = 1, día 7 = 2, fecha futura = 1).
- `tests/unit/components/routines/RoutineCard.test.tsx`: meta con `N ejercicios`, omisión del conteo cuando falta, kicker `Basada en`, `aria-pressed` del favorito.
- `tests/unit/components/routines/RoutineObjectiveChips.test.tsx`: conteos, selección y `aria-pressed`.

**E2E (Python, canal oficial):**
- Nuevo `tests/e2e/test_rutinas_nocturno.py`: seed de 2 propias + favoritas; kicker con conteo; grupos colapsados; expandir Fuerza = 13 tarjetas; chip Fuerza oculta En curso/Favoritas/Mías; búsqueda «wendler» = 1 resultado; sheet de filtros aplica Programa + Avanzado y «Limpiar»; sheet de creación navega a `/rutinas/nueva` y `/rutinas/planificador`; estrella togglea `aria-pressed`; imágenes cargan (`naturalWidth > 0`); 0 `pageerror`.
- `test_f119_rutina_card.py`: se reescribe con los selectores nuevos y los mismos invariantes (altura uniforme, estrella en la misma posición relativa, título ≤2 líneas, sin overflow horizontal, click togglea).
- `test_t8.py`: se elimina la parte de `.routine-card` (Nocturno Minimal prohíbe sombras y glows); se conserva la verificación de `.panel-elevated` en el detalle.
- `test_f47.py`: sigue usando `.routine-card__link`; verificar sin cambios.
- `test_f101_tour.py`: los anclajes `rutinas-actions` (+ del header) y `rutinas-filters` (buscador + chips) se mantienen; verificar pasos 8-9.

## 10. Verificación y entrega

1. `npm test` verde (unit + componente).
2. `npm run build` limpio (typecheck real).
3. E2E: nuevo + F119 + T8 + F47 + F101 (con `with_server.py`).
4. Screenshots 390×844 de los 4 estados + vacío de búsqueda, 0 `pageerror`.
5. Review nativo RDD sobre el diff del workspace **antes** de commitear.
6. Commits work-unit en `rutinas-nocturno`, sin push. CHANGELOG actualizado.

## 11. Riesgos

- **Peso del catálogo:** 68 portadas (~1,9 MB) con lazy loading; se acepta porque solo se montan las visibles y el grupo abierto.
- **Escala de la tarjeta:** 146 px + meta = 190 px; 21 tarjetas de «General» son ~4 pantallas. Mitigación: chips de objetivo + búsqueda.
- **e2e acoplados:** F119, T8, F47 y F101 dependen del DOM/clases; se actualizan en el mismo candidato para no romper la suite.
- **CSS legado:** al borrar `.routine-card*` hay que verificar que ninguna otra pantalla lo use (hoy solo `RutinasPage`).
- **i18n:** el default del producto es inglés; las claves nuevas se agregan en ambos idiomas.
