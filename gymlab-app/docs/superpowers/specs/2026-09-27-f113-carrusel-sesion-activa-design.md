# F113 — Sesión activa: ejercicios en carrusel horizontal (diseño)

> Fecha: 2026-09-27 · Estado: propuesto para revisión · Fuente: fase F113 de `PLAN.md` (nota del usuario 2026-09-21) + mockups del compañero visual (sesión local `.superpowers/brainstorm/f113/content/`)
> Rama aislada: worktree `f113` (`.worktrees/f113/gymlab-app`), desde `main` `1a6f54e`

## Contexto

La nota original pide: en la sesión activa, el apartado de ejercicios deja de apilarse verticalmente y pasa a ser un **carrusel horizontal** (cada slide = ejercicio + su sugerencia); el timer queda arriba y los botones abajo. El problema real: la lista vertical obliga a recorrer la página entera para pasar de un ejercicio al siguiente.

Mapa verificado del estado actual (worktree `f113`):

1. **Página**: `src/pages/EntrenamientoPage.tsx` (ruta `/entrenamiento/active`; `/entrenamiento/:id` delega numéricos a `WorkoutDetail`). Orden actual dentro de la página: hero de sesión → nota → `RestTimer` → botón calculadora de discos → `SessionGroupList` (lista vertical) → botones «añadir ejercicio» / «finalizar entreno».
2. **Agrupación**: `SessionGroupList` agrupa con `groupExercises` (`src/domain/sessionGroups.ts`): ejercicios consecutivos con igual `supersetGroup` forman un grupo; suelto = grupo propio. `isGroupComplete` = todas las series de todos sus ejercicios completas.
3. **Auto-avance F34c**: cuando un grupo **pasa a completo**, un `useEffect` hace `scrollIntoView({ behavior: reduced-motion ? 'auto' : 'smooth', block: 'center' })` al siguiente grupo incompleto. Es la única pieza de «ir a donde toca».
4. **Sugerencias**: por bloque, dentro de `ExerciseBlock` (`SuggestionChip`; motor `generateSuggestions` + `useBlockSuggestions`). Los nombres `AdaptiveSuggestions`/`getAdaptiveSuggestions` del PLAN.md están obsoletos — no existen en `src/`.
5. **Reutilizables existentes**: `HScroll` (`src/components/ui/HScroll.tsx`, filas de chips con drag de ratón y `touch-pan-x`), `SwipeRow` (fade + `ResizeObserver`), drag global de escritorio (`useGlobalDragScroll`, montado en `App.tsx`). **No existe scroll-snap ni carrusel de scroll horizontal en la app** (`ExerciseMedia` auto-rota fotos, sin scroll manual): esta fase estrena el patrón.
6. **e2e**: `tests/e2e/test_f93_t22_quick.py` comprueba «sin scroll horizontal» **a nivel `documentElement`** (página completa) y que los nombres de ejercicios estén en `inner_text("body")` (lo que exige slides montados, sin virtualización).

## Decisiones aprobadas por el usuario (brainstorming + mockups)

1. **Slide = grupo.** Ejercicio suelto = un slide con su bloque; **superserie = un slide** con sus bloques apilados adentro (como hoy, con su borde/etiqueta). La sugerencia adaptativa viaja **dentro de cada bloque** (cada ejercicio conserva la suya).
2. **Auto-avance se mantiene** (F34c): al completarse un grupo, el carrusel se desliza solo al siguiente grupo incompleto. El swipe/drag manual queda siempre disponible.
3. **Layout A2** (todo en flujo): hero, nota, **timer y calculadora quedan como están** y scrollean con la página como hoy — el timer no se toca. Si un slide es alto, **scrollea la página entera** (sin scroll anidado). Único cambio de forma: la lista vertical pasa a carrusel.
4. **Botones en barra fija inferior**: «+ Añadir ejercicio» y «Finalizar» quedan fijos abajo, **sobre la TabBar global** (la ruta muestra `TabBar` de `AppShell` en todas las páginas). Se usa el patrón ya existente en `RutinaDetailPage`: `bottom-[calc(4.5rem+env(safe-area-inset-bottom))]`, `z-40` (por debajo del `UndoToast`, `z-90`). El contenido de la página suma padding inferior equivalente al alto de la barra para que el último slide no quede tapado. En WP1 se verifica en pantalla que el `UndoToast` no tape los botones (si los tapa, se sube su offset en esta página).
5. **Indicador V2**: arriba del carrusel, **barra segmentada** (un segmento por grupo; completados encendidos, actual resaltado) + contador **«N de M»** (M = cantidad de grupos).
6. **Slide ≈88% de ancho** con peek del siguiente y **snap**.
7. **Arranque**: al abrir la sesión, el carrusel arranca en el **primer grupo incompleto** (si no hay ninguno incompleto, en el primero).

## Diseño

### Componentes y archivos

- **`src/components/workout/SessionCarousel.tsx` (nuevo)** — carrusel + indicador de progreso:
  - Recibe los mismos datos/bloques que hoy recibe `SessionGroupList` desde `EntrenamientoPage` (sin cambios de contrato de store ni de dominio).
  - Agrupa con `groupExercises` / `isGroupComplete` (`src/domain/sessionGroups.ts`) — misma fuente de verdad que hoy.
  - Cada slide renderiza el/los `ExerciseBlock` del grupo tal cual, **sin cambios en `ExerciseBlock`**. El auto-avance usa refs por slide + `scrollTo` del contenedor del carrusel (reemplaza los `groupRefs` + `scrollIntoView` actuales de `SessionGroupList`).
- **`src/pages/EntrenamientoPage.tsx`** — reemplaza `SessionGroupList` por `SessionCarousel`; mueve los dos botones a la barra fija; agrega el padding inferior del contenido para que la barra no tape nada.
- **`src/components/workout/SessionGroupList.tsx`** — se retira de la página y se elimina en WP1 (único consumidor verificado: `EntrenamientoPage`, en `src` y `tests`). Las funciones de dominio (`sessionGroups.ts`) se conservan.
- **CSS** — snap y ocultamiento de scrollbar siguiendo el patrón existente (`scrollbar-hidden`, sin barra visible en ninguna página).

### Comportamiento del carrusel

- **Contenedor**: `overflow-x-auto` + `scroll-snap-type: x mandatory`, hijos `shrink-0 w-[88%] snap-center` con gap y padding lateral para el peek (si el snap resulta incómodo en emulador, se ajusta a `proximity` en WP1).
- **Sin virtualización**: todos los slides montados (requisito de e2e, accesibilidad y del drag global).
- **Auto-avance**: al completarse un grupo → `scrollTo` suave al siguiente grupo incompleto (carrusel + página si hace falta llegar). `prefers-reduced-motion` → salto sin animación. Reemplaza al `scrollIntoView` actual. Si no quedan incompletos, no se mueve (igual que hoy).
- **Toque (touch)**: el área del carrusel debe permitir **pan vertical y horizontal** (`touch-action: pan-x pan-y` o default), para que el scroll de la página siga funcionando con el dedo dentro del carrusel. **No se reutiliza el `touch-pan-x` de `HScroll` tal cual.**
- **Escritorio**: arrastre horizontal con el patrón existente (`useGlobalDragScroll` ya dragga el contenedor scrollable más cercano y excluye inputs/botones); probar que el arrastre dentro de un slide no pelee con el scroll vertical.
- **Mutaciones durante la sesión**:
  - Agregar ejercicio desde el picker → se agrega al final (nuevo slide); **sin auto-salto** en v1 (el usuario desliza).
  - Quitar ejercicio/serie que vacía un grupo → el carrusel se reposiciona al grupo válido más cercano (siguiente; si no, anterior). Sin saltos a mitad de swipe.
- **Grupo completado**: el slide queda visible (no se desmonta) y el segmento lo marca.
- **Sin ejercicios**: mismo `EmptyState` de hoy **con el botón «+ añadir ejercicio» en flujo** (como hoy): la barra fija recién aparece con ≥1 ejercicio, así el primer ejercicio siempre se puede agregar.

### Indicador (V2)

- Barra segmentada arriba del carrusel: un segmento por grupo (`groupExercises`), completados encendidos, actual resaltado, resto apagado.
- Contador textual «N de M» (1-indexado por el slide **en reposo** — el snapped —, no la posición a mitad de swipe).
- Sin click en segmentos en v1 (solo indican).

### i18n

- Los textos nuevos («Ejercicios de la sesión», «N de M», «Ejercicio N de M: …») se agregan a `src/i18n/locales/es/workout.ts` y `src/i18n/locales/en/workout.ts` (ambos idiomas).

### Accesibilidad

- Región del carrusel con `aria-label` («Ejercicios de la sesión»); cada slide `role="group"` con `aria-label` «Ejercicio N de M: {nombre}» (superserie: «Superserie N de M: {nombres}»).
- Contador con texto real (no solo color).
- Todo montado ⇒ tab/lector alcanzan cualquier serie de cualquier ejercicio.
- Respeto de `prefers-reduced-motion` en el auto-avance.

### Qué NO cambia

- `ExerciseBlock` y su interior (series, RPE/RIR, técnica, sugerencias, cardio).
- `useActiveSession`, `activeWorkoutStore`, dominio y persistencia: **cero cambios de datos**.
- Hero, nota de sesión, `RestTimer`, calculadora de discos, picker, `handleFinish`/resumen, `UndoToast`, overlays.
- Semántica del auto-avance (mismas condiciones que F34c: transición grupo → completo).

## Verificación

1. `npm run build` (typecheck real vía project references), `npm test`, lint.
2. **e2e**: actualizar `tests/e2e/test_f93_t22_quick.py` para que la assertion de horizontalidad mida **el carrusel** (`carousel.scrollWidth` vs `clientWidth`) en vez de `documentElement`, y que la navegación entre ejercicios (peek/swipe) quede cubierta. Correr los e2e que tocan la sesión activa: `test_f63_suggestions`, `test_f90`, `test_f93_t2_warmup_persist`, `test_f93_t20_technique`, `test_f95`, `test_f96_timer`, `test_f98_enter_chain`, `test_f98_memo_isolation`, `test_f98_notes`, `test_f98_picker_catalog`, `test_f99_home_layout`, `test_rutas_multi_segmento`.
3. **Emulador (obligatorio, cambio de UI)**: receta de `AGENTS.md` (sync → gradle → install → CDP). Criterio: `root.children.length > 0`, texto visible, **0 `pageerror`**, `/entrenamiento/active` navegable, swipe horizontal y scroll vertical funcionando.
4. **Review por candidato** (RDD, encendido global) antes de cada commit; commits por tarea, sin push.

## Paquetes de trabajo (borrador — el plan detalla)

1. **WP1 — Carrusel + integración + barra fija** (`SessionCarousel`, `EntrenamientoPage`, CSS de snap; retiro de `SessionGroupList`).
2. **WP2 — e2e actualizado + verificación completa** (t22 re-scopeado, suite e2e de sesión activa, build, emulador) + `PLAN.md`/`CHANGELOG` al cerrar.

Orden: WP1 → WP2.

## Riesgos

- **Toque dentro del carrusel**: si el `touch-action` queda restrictivo, el usuario no puede scrollear la página desde el área de slides. Mitigación: doble eje + prueba real en emulador.
- **Drag de escritorio vs. inputs**: el patrón global excluye interactivos; verificar que arrastrar sobre un slide no interfiera con `SetRow` ni con el suggestion chip.
- **Snap**: estrena patrón en la app; probar con slides altos y `prefers-reduced-motion`.
- **Superserie de 3 bloques**: slide muy alto — aceptado (scrollea la página, decisión A2).
- **e2e previo mal scopeado**: el t22 actual puede pasar «por accidente» con el carrusel; la fase lo corrige para que mida lo que cree medir.

## Fuera de alcance

- Cambios en timer/notificaciones (F96/F111), rediseño de hero/nota, virtualización de slides, cambios de datos/esquema, sustitución automática por equipamiento (F116), re-autoría de rutinas (F114).
