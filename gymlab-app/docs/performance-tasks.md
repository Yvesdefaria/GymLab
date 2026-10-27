# F91 — Rendimiento & Fluidez: Plan de tareas por página

**Objetivo:** la app se siente fluida en uso real, sin bajones de frames. Diagnóstico completo en `docs/performance-audit-2026-09-11.md` (evidencia file:line + métricas medidas del build del 2026-09-11).

**Cómo ejecutar:** una página a la vez. Marcar `[x]` al terminar cada subtarea. Cada tarea tiene severidad (CRITICAL/HIGH/MEDIUM/LOW) y esfuerzo (S/M/L). Las ⚡ son quick wins (S, alto impacto). Verificación después de cada bloque: `npx tsc --noEmit` + `npm run build` + test de la página tocada; commit por tarea, sin push.

**Orden recomendado:** RUTINAS → SESIÓN ACTIVA → GLOBAL → LOAD → resto.

---

## 1. RUTINAS (especial atención — mayor impacto en jank)

### 1.1 Builder: drag & drop (CRITICAL — peor caso 1050 items)
- [ ] ⚡ **R1a** — rAF-throttle del `onDragMove` de `useDragReorder` (guardar último evento, aplicar una vez por frame) — `useDragReorder.ts:30-43`
- [ ] ⚡ **R1b** — Bailout temprano: si `(dayIndex, toIndex)` no cambió respecto al ref anterior, NO llamar `setDragOver` (hoy crea objeto nuevo por pointermove y rompe el bailout de React) — `useDragReorder.ts:30-43`
- [ ] **R1c** — Cachear rects de items (`getBoundingClientRect`) al inicio del drag y al cambiar conteo/tamaño, no por evento — `useDragReorder.ts`
- [ ] Verificación: arrastrar días/items en la rutina grande clonada (1050 items) sin jank (panel Performance, CPU 4x)

### 1.2 Carga de datos: matar el N+1 (HIGH)
- [ ] ⚡ **R2a** — `exerciseRepo.getByIds(ids)` → `db.exercises.where('id').anyOf(ids).toArray()` — `src/data/repositories/` + `DexieExerciseRepository`
- [ ] ⚡ **R2b** — Usar `getByIds` en `enrichItems` de `useRoutines.ts:17-28` (reemplaza ~1055 GETs secuenciales por ~2-3)
- [ ] ⚡ **R2c** — Usar `getByIds` en `useRoutineDraft.ts` (load del builder en edición)
- [ ] ⚡ **R2d** — Paralelizar `Promise.all` sobre días en `RutinaDetailPage` `handleClone` y en el load de detalle
- [ ] Verificación: detalle + edición de la rutina grande cargan en < ~300 ms (antes ~1055 roundtrips)

### 1.3 Guardado: bulkAdd (LOW pero rápido)
- [ ] ⚡ **R7a** — `routineRepo.addDaysAndItems` → `bulkAdd` por tandas items (`bulkAdd` ya se usa en session/seed — `routineRepo.ts:62-80`)
- [ ] Verificación: clonar la rutina grande se guarda sin freeze visible

### 1.4 Render de listas: virtualización (HIGH)
- [ ] **R6a** — Virtualizar la lista de items del builder con `@tanstack/react-virtual` (ya es dependencia; patrón en `ExercisePicker.tsx:158`) — `RutinaBuilderPage.tsx`
- [ ] **R6b** — Virtualizar `RoutineDayPanel` (detalle) — 350+ filas por día hoy
- [ ] Verificación: builder con 1050 items monta sin 1050 nodos DOM vivos

### 1.5 Memoización de componentes (MEDIUM)
- [ ] **R5a** — `memo` en `ExerciseItem` + key por id de item (hoy key = index) — `ExerciseItem.tsx`
- [ ] **R5b** — `memo` en `RoutineDayEditor`, key por day id, callbacks `useCallback` — `RoutineDayEditor.tsx`, `RutinaBuilderPage.tsx`
- [ ] **R5c** — Hoistear callbacks del builder fuera del render (sin closures inline por item/día)

### 1.6 Lista del catálogo (HIGH)
- [ ] **R8a** — `memo` en `RoutineCard` — `RoutineCard.tsx:40-47`
- [ ] **R8b** — `onToggleFav` estable (`useCallback`) — `RutinasPage.tsx`
- [ ] **R8c** — Cachear/hoistear `badgeFor` (hoy `routines.find()` por card = O(n·m)) — `RutinasPage.tsx`
- [ ] ⚡ **R8d** — `content-visibility: auto` + `contain` en `.routine-card` (cards below-fold no pintan) — `index.css:403-534`
- [ ] Verificación: scroll del catálogo 68 cards sin paint cost creciente; fade-in correcto

---

## 2. SESIÓN ACTIVA (`/entrenamiento/active`)

### 2.1 Keystroke storm (CRITICAL — cada tecla re-renderiza el árbol completo + localStorage)
- [ ] **S1a** — Subscripciones finas al store: cada `SetRow` (o selector por ejercicio) selecciona solo su propio set; la página deja de subscribirse a `s.exercises` completo — `useActiveSession.ts:55`, `SessionGroupList.tsx`, `SetRow.tsx:40`
- [ ] **S1b** — Defer del persist: sacar `exercises` de `partialize`; persistir en checkpoints (fin/undo/salir) o persister debounced — `activeWorkoutStore.ts`
- [ ] ⚡ **S1c** — No pasar closures nuevas a `SetRow`: `useCallback` por set + `memo` en `SessionGroupList` — `ExerciseBlock.tsx:207-214`
- [ ] **S2a** — Hoistear `useBodyWeight()` al nivel de página (hoy 1 liveQuery por bloque) — `ExerciseBlock.tsx:73`
- [ ] Verificación: tipear peso/reps en sesión con 10+ ejercicios sin frame drops (panel Performance)

---

## 3. GLOBAL / SHELL (afecta TODAS las páginas, cada scroll)

### 3.1 Composición (HIGH)
- [ ] ⚡ **G1a** — Reemplazar `.app-grain` (overlay SVG turbulence + blend) por PNG prerasterizado low-opacity o quitar blend — `index.css:687-695`
- [ ] ⚡ **G1b** — Quitar `backdrop-filter` del icono `.routine-card` — `index.css:513`
- [ ] **G2a** — Quitar `background-attachment: fixed` del body; gradientes en capa `position: fixed` — `index.css:663`
- [ ] Verificación: scroll en `/` y `/rutinas` sin repaint de viewport completo (solo capa afectada)

### 3.2 Drag-scroll global (MEDIUM)
- [ ] ⚡ **G3a** — rAF-throttle de `onMove` de `useGlobalDragScroll` (hoy escribe scrollLeft/Top sincrónico por mousemove) — `useGlobalDragScroll.ts:70-79`

### 3.3 Fuentes (MEDIUM)
- [ ] ⚡ **G4a** — Self-host fonts: woff2 en `public/fonts/`, `@font-face`, preload (mata el `@import` render-blocking y arregla FOUT offline) — `index.css:3`

### 3.4 PWA (LOW)
- [ ] **G5a** — `runtimeCaching` para `/exercises/**` imágenes `.jpg` (97.5 MB no precacheados → offline rompe fotos; runtime cache sin inflar el precache de 3.7 MB) — `vite.config.ts:58-60`

---

## 4. LOAD / STARTUP

- [ ] ⚡ **L1a** — Gate del reseeder: chequear `db.meta.get('seedVersion')` (módulo barato) y solo entonces `import('@/data/seed/reseeder')` — ahorra 232 kB (51.89 gz) en CADA boot una vez seedeado — `providers.tsx:22`, `reseeder.ts:31-38`
- [ ] **L2a** — Cuando se configuren keys de telemetry: diferir init de SDK a idle/post-first-paint (hoy +247 kB gz en boot si se configuran) — `telemetry.ts:70-98`
- [ ] **L3a** — `EstadisticasPage`: queries acotadas (últimos N meses) o agregación DB cuando crezcan los datos — `EstadisticasPage.tsx:35-46`
- [ ] Verificación: boot inicial de la app con seed existente sin descargar reseeder; metrics de network en devtools

---

## 5. Páginas LEAN (sin acciones — ya verificadas)

| Página | Estado |
|---|---|
| `/` Entrenar | ✅ Limpia, chunk lazy 42.21 kB |
| `/entrenamiento/:id` histórico | ✅ Chunk pequeño 9.92 kB (comparte N+1 notas con rutinas si aplica) |
| `/ejercicios` + `/ejercicios/:slug` | ✅ Filtro O(n) trivial sobre ~1100 filas; imágenes lazy |
| `/calendario` | ✅ `trainedLocalDates` memoizado |
| `/mas`, `/perfil`, `/ajustes` | ✅ Sin hot loops en hooks compartidos |
| Calculadoras, papers, guías, nutrición, timer | ✅ Chunks lazy pequeños; domain puro sin cost de render |

---

## Métricas baseline medidas (2026-09-11, `npm run build` Vite 8.2/rolldown)

- JS crítico inicial: ~557 kB raw / ~182 kB gz (sano; rutas lazy)
- Chunks no descargados hoy: posthog 274 kB (90.92 gz) y Sentry 475 kB (155.90 gz) — gated sin keys; riesgo latente al configurarlas (tarea L2a)
- ⚠️ Reseeder: 232.18 kB (51.89 gz) descargado cada boot sin servir (tarea L1a)
- PWA: 177 entradas / 3.7 MB precache; fotos `.jpg` (97.5 MB) sin cache → offline roto (tarea G5a)
- Qué NO tocar: virtualización existente en ExercisePicker, RestTimer 1 Hz, debounce 200 ms de search, bulkAdd de sesión/seed, lazy routes, vendor group-split

## Cierre del bloque rendimiento

- [ ] Medir antes/después con Performance panel (CPU 4x) en los 2 flujos peores: builder con rutina grande + keystrokes en sesión (device low-end Android si es posible)
- [ ] Actualizar `CHANGELOG.md` bajo `[Unreleased]` por cada tarea relevante
- [ ] Actualizar `PLAN.md` cuando el rewrite F63/F93 sin commitear se resuelva (los checkboxes de esta fase no deben mezclarse con ese WIP)