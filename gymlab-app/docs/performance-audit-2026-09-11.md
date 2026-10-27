# GymLab Performance Audit — Runtime Fluidity & Jank (2026-09-11)

**Scope:** Read-only audit of `gymlab-app/` (React 18 + Vite 8/rolldown + TS + Tailwind v4 PWA), focused on runtime fluidity (jank/frame drops) with a deep dive on the RUTINAS area. No files were modified; the only build artifact produced is `dist/` via `npm run build` (allowed for measurement).

**Method:** Static source analysis (all claims verified by reading source), plus production build shape measurement. No DevTools frame profiling was run (read-only constraint) — see Section 5 for the honest evidence tier of each claim.

**Legend:** ≤ 22 columns on mobile. Severity: CRITICAL / HIGH / MEDIUM / LOW. Type: R (re-render storm), P (paint/composite), IO (IndexedDB/localStorage), L (load/startup), M (memoization).

---

## 1. Executive summary — Top 5 jank causes

1. **Session page keystroke storm (R) — CRITICAL**
   Every weight/reps keystroke re-renders the *entire* active session tree and writes to localStorage synchronously:
   - `useActiveSession.ts:55` subscribes the page to the whole `s.exercises` array → re-render on every `updateSet`.
   - `ExerciseBlock.tsx:207-214` creates new `handleUpdate`/`handleRemove`/`handleComplete` closures per set per render → defeats the `SetRow` memo (`SetRow.tsx:40`), so **every SetRow re-renders on every keystroke**.
   - `SessionGroupList` is not memoized; each `ExerciseBlock` additionally runs `useLoadSuggestion` (`useLoadSuggestion.ts:12` — subscribes `s.exercises`) and `useBodyWeight()` (`ExerciseBlock.tsx:73` — one liveQuery per block).
   - `activeWorkoutStore` uses Zustand `persist` with `exercises` in `partialize` → synchronous `JSON.stringify` + `localStorage.setItem` on every keystroke.

2. **Routine builder drag: N layout reads + new-object state per pointermove (R, P) — CRITICAL (on large routines)**
   `useDragReorder.ts:30-43`: on every pointermove, `onDragMove` calls `getBoundingClientRect()` on **every item ref** (N forced layouts) and calls `setDragOver({ dayIndex, toIndex })` with a **fresh object** — React's `Object.is` bailout never triggers, so the full `RutinaBuilderPage` tree (all days, all `ExerciseItem`s) re-renders on every mouse event, even with no position change. On a cloned 1050-item routine this is 1000+ layout reads + one full-tree render per move event.

3. **Global compositing costs (P) — HIGH**
   - `.app-grain` (`index.css:687-695`): fixed, full-viewport noise overlay with `mix-blend-mode: overlay` at z-index 70 → forces a viewport-wide blend on every scroll/animation frame, on every page.
   - `.routine-card` (`index.css:403-534`): each card paints `::before` (3 gradient layers) + `::after` (`mix-blend-mode: soft-light`) + icon `backdrop-filter: blur(4px)` (`index.css:513`) + 4-layer box-shadows. The 68-card RUTINAS grid re-composites all of this per scroll frame.
   - `body` uses `background-attachment: fixed` (`index.css:663`) with 3 radial gradients — a known mobile repaint cost during scroll.

4. **RUTINAS data loading is N+1 and sequential (IO, L) — HIGH**
   - `useRoutines.ts:17-28` (`enrichItems`): awaits `exerciseRepo.getById` **sequentially per item**; `useRoutineDetail` loads days, then each day's items, sequentially. The 1050-item seeded routine = ~1055 sequential IndexedDB roundtrips on every detail-page load.
   - `useRoutineDraft.ts` (builder edit mode) repeats the same pattern.
   - `RutinaDetailPage` `handleClone` loops days with sequential `getItems`.
   - Once loaded, the day panels and builder mount **unvirtualized item lists** (a seeded day renders 350+ rows; the builder can mount 1050 `ExerciseItem`s at once).

5. **Unthrottled global drag-scroll (P, R) — MEDIUM**
   `useGlobalDragScroll.ts:70-79`: `onMove` writes `scrollLeft`/`scrollTop` synchronously on every mousemove with no `requestAnimationFrame` throttle. With a high-polling-rate mouse this produces multiple sync scroll writes per frame, and interacts badly with finding #2 during drag operations.

**Honorable mentions (load/startup):** every boot downloads a 232.18 kB seed chunk (`providers.tsx:22` unconditional dynamic import of `reseeder`) that inlines the entire seed catalog, only to early-return (`reseeder.ts:35-38`) — see task list R1. Google Fonts are loaded via render-blocking `@import url(...)` (`index.css:3`) and are not available offline.

**What's already well done (do not touch):** all routes lazy (`router.tsx`), `ExercisePicker` virtualized with `@tanstack/react-virtual` (`ExercisePicker.tsx:158`), `RestTimer` fine-grained 1 Hz selectors (`RestTimer.tsx:33-40`), `useLiveList` stable empty-array fallback, 200 ms debounce on routine search, session save uses a single `bulkAdd` (`workoutSession.ts:83-90`), reseeder uses `bulkAdd`, Sentry/PostHog are gated dynamic imports (`telemetry.ts:70-98`), vendor chunks are group-split in `vite.config.ts`, exercise seed images are local paths with lazy `loading="lazy" decoding="async"`.

---

## 2. Per-page findings

| Page / route | Severity | Type | Finding | Evidence |
|---|---|---|---|---|
| `/` Entrenar (home) | — | — | Clean. Light page, lazy chunk 42.21 kB. | build output |
| `/entrenamiento/active` (Sesión activa) | **CRITICAL** | R | Keystroke storm: whole-page re-render + SetRow memo defeated + localStorage write per keystroke. | `useActiveSession.ts:55`, `ExerciseBlock.tsx:207-214`, `SetRow.tsx:40`, store `persist` |
| `/entrenamiento/active` (Sesión activa) | MEDIUM | R | One liveQuery (`useBodyWeight`) + one `s.exercises` subscription (`useLoadSuggestion`) per ExerciseBlock. | `ExerciseBlock.tsx:73`, `useLoadSuggestion.ts:12` |
| `/entrenamiento/:id` (history detail — SesionPage) | LOW | — | Small chunk (9.92 kB); not line-audited. History paths share the N+1 notes in the RUTINAS section. | build output |
| `/rutinas` (catalog) | **HIGH** | P/R | 68+ CSS-heavy `.routine-card`s, no virtualization; `badgeFor` does `routines.find()` per card (`RutinasPage`); `onToggleFav` inline closure; cards not memoized. | `index.css:403-534`, `RoutineCard.tsx:40-47` |
| `/rutinas/:slug` (detail) | **HIGH** | IO/L | N+1 sequential `enrichItems` on load; day panel renders all day items unmounted (350+ rows); clone path sequential. | `useRoutines.ts:17-28`, `RutinaDetailPage.tsx` `handleClone` |
| `/rutinas/nueva` + `/editar` (builder) | **CRITICAL** | R/P/IO | Drag = N rect reads + new-object `setDragOver` per move; full-tree re-render on any change; days keyed by index; `ExerciseItem` not memoized; 1050 items mounted at once; load via N+1 draft. | `useDragReorder.ts:30-43`, `RutinaBuilderPage.tsx`, `ExerciseItem.tsx`, `useRoutineDraft.ts` |
| `/ejercicios` + `/ejercicios/:slug` | LOW | — | Catalog filter is O(n) over ~1100 in-memory rows per keystroke (trivial); detail page lazily loads images. Catalog loads once via liveQuery (`useExerciseCatalog.ts:30`), acceptable. | `useExerciseCatalog.ts` |
| `/estadisticas` | MEDIUM | IO/L | Pulls ALL sets + workouts + body data on mount; computations are memoized (good). Recharts ships via shared chunk (345.57 kB / 100.55 gz) loaded lazily with the route. | `EstadisticasPage.tsx:35-46`, build output |
| `/calendario` | LOW | — | Light; `trainedLocalDates` memoized. | `CalendarioPage.tsx:20` |
| `/mas`, `/perfil`, `/ajustes` | LOW | — | Screened via chunk sizes (4.96/25.05/28.76 kB) + hooks; no hot loops detected in the shared hooks they use. Not line-audited. | build output |
| Calculadoras, papers, guías, nutrición, timer | LOW | — | Small lazy chunks; calculators live in pure `domain/calculators/` (no render cost). Not line-audited. | build output |
| All pages | MEDIUM | P | Global `.app-grain` overlay + `background-attachment: fixed` paint tax on every scroll. | `index.css:663,687-695` |

---

## 3. RUTINAS deep dive

### Flow and data path

```
RutinasPage (list)
  └─ RoutineCard (not memoized; CSS-heavy)
RutinaDetailPage (detail)
  ├─ useRoutineDetail → days (sequential) → items (sequential) → enrichItems (exerciseRepo.getById per item)
  └─ handleClone → for...of days → getItems (sequential) → archive every item → navigate to builder
RutinaBuilderPage (builder: /rutinas/nueva, /rutinas/:slug/editar)
  ├─ useRoutineDraft.load → same N+1 pattern
  ├─ day list + per-day RoutineDayEditor → ExerciseItem list (all mounted, keyed by index)
  ├─ useDragReorder (2 instances: items and days) — hot drag loop
  └─ RoutineDayPanel (detail tab panel): all items of a day, unmounted
```

### Hot spots, worst case = the big seeded routine (68 routines, one with 1050 routineItems)

| # | Location | Problem | Worst case cost |
|---|---|---|---|
| R1 | `useDragReorder.ts:30-43` | Per pointermove: `itemRefs` loop calling `getBoundingClientRect()` on every ref + `setDragOver(newObj)` (memo bailout defeated) | 1050 forced layouts + full builder render per move event |
| R2 | `useRoutines.ts:17-28` (`enrichItems`) | Sequential `await exerciseRepo.getById(...)` per item | ~1050 sequential IndexedDB GETs per detail load |
| R3 | `useRoutineDraft.ts` (load) | Same sequential pattern in edit mode | ~1050 roundtrips before the builder is usable |
| R4 | `RutinaDetailPage` `handleClone` | Sequential `for...of day → getItems` before archiving | Clone of the big routine serializes 5-6 day queries + 1050 archives |
| R5 | Builder render tree | `RutinaBuilderPage` re-renders all days + all `ExerciseItem`s on any state change; inline closures per day/item; keys = index; no `memo` | Full 1050-item tree re-render on every edit/drag |
| R6 | `RoutineDayPanel` / builder item lists | No virtualization | 350+ rows per day mounted; 1050 in builder |
| R7 | `routineRepo.addDaysAndItems` | Sequential `db.routineItems.add()` per item inside the transaction (`routineRepo.ts:62-80`) | 1050 roundtrips on clone save |
| R8 | `RoutineCard` in list | Not memoized, `onToggleFav` inline, `badgeFor` does `routines.find` per card (`RutinasPage`); hover/active transitions on 68 heavy cards | O(n·m) badge scans + card re-render churn |
| R9 | Detail page item rows | `routineRepo` indexed `where('routineDayId')` lookups are fine; the cost is enrichment (#R2) and the all-items DOM (#R6) | — |

### Recommendation for the drag loop (R1)

- Throttle `onDragMove` with `requestAnimationFrame` (store the latest event; apply once per frame).
- Cache `getBoundingClientRect` values computed on drag start / item-count change instead of re-reading every event (fall back to `elementFromPoint` on the container).
- Make `setDragOver` a true no-op when `(dayIndex, toIndex)` is unchanged (keep the target in a ref; compare before setting state).
- Early exit: `if (dragOverRef.current?.dayIndex === dayIndex && ...toIndex === toIndex) return`.

### Recommendation for data loading (R2/R3/R4)

- Add `exerciseRepo.getByIds(ids)` → single `db.exercises.where('id').anyOf(ids).toArray()`; fan out with `Promise.all` across days/items. This collapses ~1055 roundtrips into ~2-3.
- Parallelize the per-day `getItems` calls (`Promise.all` over days).
- Clone: collect all item ids first (batched), then `bulkAdd` the archived copies (see task R7).

---

## 4. Priority-ordered task list (grouped by page)

**Quick wins** are marked ⚡. No architectural rewrites — every item is local to the current stack.

### RUTINAS
| Priority | Task | Severity | Effort | Evidence |
|---|---|---|---|---|
| P1 | ⚡ UseDragReorder: rAF-throttle + unchanged-target early bailout (ref-compare before `setDragOver`) | CRITICAL | S | `useDragReorder.ts:30-43` |
| P1 | ⚡ Batch exercise enrichment: `exerciseRepo.getByIds(ids)` + `Promise.all` days; use in `useRoutines`, `useRoutineDraft`, clone | HIGH | S | `useRoutines.ts:17-28`, `useRoutineDraft.ts`, `RutinaDetailPage` `handleClone` |
| P1 | ⚡ `routineRepo.addDaysAndItems` → `bulkAdd` sets of items | LOW | S | `routineRepo.ts:62-80` |
| P2 | Virtualize builder item lists + `RoutineDayPanel` with `@tanstack/react-virtual` (already a dependency, pattern in `ExercisePicker.tsx:158`) | HIGH | M | `RutinaBuilderPage.tsx`, `RoutineDayPanel.tsx` |
| P2 | Memoize `ExerciseItem` + `RoutineDayEditor`, key by item/day id, hoist callbacks (`useCallback`) | MEDIUM | M | `ExerciseItem.tsx`, `RoutineDayEditor.tsx`, `RutinaBuilderPage.tsx` |
| P2 | `RoutineCard` memo + stable `onToggleFav` + cache `badgeFor` results | LOW | S | `RoutineCard.tsx`, `RutinasPage.tsx` |
| P2 | ⚡ `content-visibility: auto` + `contain` on `.routine-card` (below-fold cards skip paint) | MEDIUM | S | `index.css:403-534` |
| P3 | Cache rects across drags (only recompute when item count/size changes) | MEDIUM | M | `useDragReorder.ts` |

### SESIÓN ACTIVA (/entrenamiento/active)
| Priority | Task | Severity | Effort | Evidence |
|---|---|---|---|---|
| P1 | Fine-grained store subscriptions: each `SetRow` (or a per-exercise selector component) selects only its own set object; page stops subscribing to `s.exercises` wholesale | CRITICAL | M | `useActiveSession.ts:55`, `SessionGroupList.tsx`, `SetRow.tsx:40` |
| P1 | Defer persistence: drop `exercises` from `partialize`; save to localStorage at checkpoints (finish/leave/undo) or debounce the persister | CRITICAL | S | `activeWorkoutStore.ts` `persist` config |
| P1 | ⚡ Stop passing new closures to `SetRow`: `useCallback` per set (or move handlers into store actions taken from selectors) + memoize `SessionGroupList` | HIGH | S-M | `ExerciseBlock.tsx:207-214` |
| P2 | Hoist `useBodyWeight()` to page level, pass weight down; drop per-block liveQuery | MEDIUM | S | `ExerciseBlock.tsx:73` |

### GLOBAL / SHELL
| Priority | Task | Severity | Effort | Evidence |
|---|---|---|---|---|
| P1 | ⚡ rAF-throttle `useGlobalDragScroll.onMove` writes | MEDIUM | S | `useGlobalDragScroll.ts:70-79` |
| P1 | ⚡ Replace `.app-grain` SVG-turbulence blend overlay with a pre-rasterized low-opacity PNG (or drop the blend mode); remove `backdrop-filter` from `.routine-card__icon` | HIGH | S | `index.css:513,687-695` |
| P2 | Remove `background-attachment: fixed`; paint body gradients on a `position: fixed` layer (or static) | MEDIUM | M | `index.css:663` |
| P2 | ⚡ Self-host fonts (woff2 in `public/fonts/`, `@font-face`, preload) — kills the render-blocking `@import` + fixes offline FOUT | MEDIUM | S | `index.css:3` |
| P3 | PWA: add `runtimeCaching` for `/exercises/**` images (precache currently excludes .jpg → photos break offline; runtime cache fixes it without bloating the 3.7 MB precache) | LOW | S | `vite.config.ts:58-60` |

### LOAD / STARTUP
| Priority | Task | Severity | Effort | Evidence |
|---|---|---|---|---|
| P1 | ⚡ Gate the reseeder import: check `db.meta.get('seedVersion')` first (cheap module) and only then `import('@/data/seed/reseeder')` — saves 232.18 kB (51.89 gz) every boot once seeded | MEDIUM | S | `providers.tsx:22`, `reseeder.ts:31-38` |
| P3 | When telemetry keys are configured, defer SDK init to idle (post-first-paint) — adds +247 kB gz (posthog 90.92 + sentry 155.90) to boot otherwise | LOW | S | `telemetry.ts:70-98`, build output |
| P3 | `EstadisticasPage`: consider bounded queries (recent N months) or DB-side aggregation when datasets grow | LOW | M | `EstadisticasPage.tsx:35-46` |

---

## 5. Measurement evidence

### Build shape (production, `npm run build`, Vite 8.2 / rolldown, 3217 modules, build 3.2 s)

**Critical path (initial download on `/`):** the eager graph is lean at **≈ 557 kB raw / ≈ 182 kB gzip JS + 99.12 kB CSS (16.73 gz)** — `vendor-react` 190.35 (59.83 gz), `vendor-dexie` 96.47 (31.77), `i18n` 80.70 (28.54), `vendor-router` 38.51 (13.84), `vendor-icons` 25.48 (9.01), `i18next` 42.44 (13.47), `index` 29.81 (9.64), `Trans` 10.76 (4.54), `rolldown-runtime` 0.71, plus route chunk `EntrenarPage` 42.21 (11.31).

**Notable route chunks (lazy — correct behavior):**
| Chunk | Raw | gzip | Note |
|---|---|---|---|
| `useThemeColors-*` (shared stats: Recharts + helpers) | 345.57 kB | 100.55 kB | Loaded only with `/estadisticas` (page chunk 105.71 kB / 27.71 gz) → ≈ 130 kB gz page cost for stats |
| `EntrenamientoPage-*` (active session) | 70.65 kB | 18.67 kB | Session flow |
| `catalogLoader-*` | 286.30 kB | 36.56 kB | Dynamic, only on first-ever seed |
| `catalog-*` / `module-*` | 218.13 / 273.16 kB | 60.91 / 90.92 gz | `module-*` = **posthog-js**; **not downloaded** without keys |
| `reseeder-*` | 232.18 kB | 51.89 kB | ⚠️ Downloaded **every boot** (inlines full seed catalog); see task L1 |
| `esm-*` | 474.78 kB | 155.90 kB | **@sentry/react 10.73.0**; **not downloaded** without keys (gated) |

**Telemetry latency (verified behavior):** `telemetry.ts:31-36` turns telemetry on only when `PROD && VITE_POSTHOG_PROJECT_KEY && VITE_SENTRY_DSN && consent`. The repo has only `.env.example` → the current build gates to `off-not-configured`, so posthog/Sentry chunks are emitted but never fetched. **Risk to track:** the moment real keys are added, boot (`AppShell` → `applyTelemetryConsent` → `initTelemetry`) downloads posthog + Sentry (+247 kB gz) on every launch with all samples set to 0 — i.e. pure captureException payload. Defer the init to idle/first interaction (task L2).

**PWA precache:** 177 entries / 3,707 KiB. `globPatterns` covers `js,css,html,ico,png,svg,webp,woff2` — exercise photos are `.jpg` (97.5 MB total over 1839 files in `public/`), so they are **not precached and never runtime-cached** → first view needs network; offline shows broken photos. The precache size is fine; this is a runtime-caching gap, not a jank source.

**Honest evidence tier:** all jank claims (sections 1-4) are **static analysis** — code paths read and cited, not measured frames. The build-shape numbers above are **measured** (this run). Any change should be validated with the Performance panel scrolling the big-routine detail/builder and typing in a session — before/after — on a low-end Android device; the two flows most likely to prove it are the 1050-item builder drag and the session keystroke storm.