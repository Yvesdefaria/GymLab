# GymLab App — Plan de implementación

Stack: **Vite + React 18 + TypeScript + Tailwind + Dexie + Zustand + Recharts + PWA → Capacitor (Android)**

Prototipo HTML en `../GymLab/` = solo referencia de marca. No modificar.

Fuente de contenido offline: `../content/training-library/`.

> **Fases totalmente cerradas → `COMPLETED.md`** (no requieren revisión).
> **Este archivo contiene SOLO lo pendiente o por revisar.**

---

## Producto

App web mobile-first de entrenamiento:
- Seguimiento de series/reps/peso
- Catálogo de rutinas + programa activo
- Calendario (días hechos vs programados)
- Anillo de progreso (sesión + programa)
- Dummy muscular con fatiga
- Papers científicos + **Guías** (nutrición/entrenamiento)
- Perfil, calculadoras, biblioteca de ejercicios con media
- Offline PWA → Capacitor Android
- **Cimiento** de red social (schema/repos; UI feed futura)

Datos: **local-first (Dexie)**. Repositorios desacoplados → Supabase en fase social.

---

## Arquitectura de carpetas

```
ProyectoGymLab/
├── content/training-library/   # fuente offline seeds/guías
└── gymlab-app/
    ├── PLAN.md, AGENTS.md, CHANGELOG.md
    ├── public/exercises/     # media free-exercise-db + SVG
    └── src/
        ├── domain/           # puro: dates, streak, calendar, fatigue, progress, social types
        ├── data/seed + repositories/
        ├── store/            # sesión activa
        ├── pages/ components/
        └── ...
```

### Capas

| Capa | Regla |
|------|-------|
| `domain/` | Sin React/Dexie |
| `data/repositories/` | Interfaces; hoy Dexie, mañana API |
| `pages/` + `components/` | Cero queries Dexie directas preferible (hooks OK) |
| `store/` | Solo sesión efímera |

---

## Site map

```
/
├── Entrenar (/)                         # stats, anillo programa, mini-calendario bajo racha, CTA
│   ├── Sesión (/entrenamiento/active)   # anillo % sesión, finalizar ejercicio
│   └── Calendario (/calendario)         # vista mes completa (comparte MonthCalendar)
├── Rutinas (/rutinas)                   # Mis rutinas (custom) + Predefinidas
│   ├── Nueva (/rutinas/nueva)           # builder rutina custom
│   ├── Editar (/rutinas/:slug/editar)   # solo custom
│   └── Detalle (/rutinas/:slug)         # play, ETA, seguir programa
├── Papers (/papers)
├── Más (/mas)
│   ├── Ajustes (/ajustes)               # toggle modo noche/día
│   ├── Perfil (/perfil)
│   ├── Guías (/guias, /guias/:slug)
│   ├── Cuerpo (/cuerpo)                 # dummy + fatiga
│   ├── Calculadoras (/calculadoras/*)
│   ├── Ejercicios (/ejercicios/*)
│   └── [futuro] Comunidad
```

Tab bar: `Entrenar · Rutinas · Papers · Más`

---

## Design system

Tema **dual** (modo noche/día), acento dorado en ambos:

| Token | Noche | Día |
|-------|-------|-----|
| `--bg` | `#121214` | `#FFFFFF` |
| `--bg-elevated` | `#242422` | `#F5F3EE` |
| `--fg` | `#F8FAFC` | `#17171A` |
| `--accent` / `--cta` | `#D9B384` | `#B07F2E` (dorado oscuro p/ contraste) |
| `--accent-soft` | `#FDDDB4` | `#8A6620` |
| `--success` | `#22C55E` | `#15803D` |
| `--danger` | `#EF4444` | `#B91C1C` |
| `--border` | `#3A352B` | `#E3DACB` |

- Se aplica vía `data-theme="night|day"` en `<html>`; gold-gradient/text se mantienen dorados.
- Persistencia: `localStorage` (primer paint sin flash) + `meta.theme` (Dexie).

Oswald + Barlow · Lucide · motion 150–300ms · `prefers-reduced-motion`

---

## Modelo Dexie (v2+)

```
meta, exercises, routines, routineDays, routineItems,
workouts, workoutSets, papers, guides, profile, activeProgram, prs,
socialProfiles, posts, postMedia   # social stub
dailySteps, mealEntries, progressPhotos, benchmarkResults   # fases 76/79/82 + F84
```

- Fechas de negocio en **local** `YYYY-MM-DD`.
- Seed versionado (`meta.seedVersion`).
- IDs seed < 10000; user/custom ≥ 10000 o UUID en social.

### Media ejercicios

- Fuente primaria: **free-exercise-db** (Unlicense).
- Campos: `imageUrls[]`, `externalId`, fallback SVG por grupo.
- Componente `ExerciseMedia` (2 frames inicio/fin).

---

## Fases por revisar (el usuario debe revisarlas antes de archivar)

### [x] Fase 73 — Frecuencia muscular vs objetivo (PENDIENTE UX → solo falta validación en dispositivo físico)
- [x] `domain/muscleFrequency.ts` + sección con barras + alerta >20%
- [x] **Revisión UX entregada**: tamaños de fuente, barras y espaciado agrandados ya aplicados en `src/components/frequency/MuscleFrequencyView.tsx` (`text-sm` línea 45, `text-xs` línea 49, `h-2.5` línea 60, `px-4` líneas 25 y 43). **Único resto**: validar en dispositivo físico (no verificable en este entorno).
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

### Fase 81 — Importar datos de otras apps (POR REVISAR)
- [x] Parsers CSV Strong/Hevy/JEFIT + mapeo a sesiones
- [x] Validación/resumen + deduplicación + panel en Ajustes
- [x] i18n + mobile-app-ui + verificación + CHANGELOG + commit

### [x] Fase 83 — Checklist de técnica (PENDIENTE)
- [x] `TechniqueChecklist.tsx` + datos en catálogo + botón flotante en sesión
- [x] Persistir última sesión mostrada
- [ ] Ampliar datos de técnica a más ejercicios (curl, fondos, dominadas, etc.)
- [ ] Persistir puntos completados por sesión en Dexie
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 84 — Wearables / contador de pasos (completa salvo 84d y 84e-journal)

> **84a–84c, 84e (resto), 84f, 84g están implementados y verificados** (commits recientes en el log). Ver `COMPLETED.md` no aplica: 84a–84g tienen pendientes puntuales que quedan aquí.

### [x] Fase 84a — Domain + Data ✅
- [x] `dailySteps` (v13) + `domain/stepsTracker.ts` + `domain/stepAchievements.ts` + repo + hook + i18n

### [x] Fase 84b — UI Dashboard ✅
- [x] `/pasos` con anillo SVG, stats, gráfico semanal, heatmap, badges, ruta + link + mobile-app-ui

### [x] Fase 84c — Background Sync ✅
- [x] `capacitor-health` + `stepsFusion` + `healthBridge` + `stepsSync` (backfill 90 días / incremental) + sync al abrir y al primer plano

### [ ] Fase 84d — Widget Nativo (BLOQUEADO por toolchain)
> **Bloqueado por herramientas**: sin ANDROID_HOME/gradle en este entorno y WidgetKit requiere macOS. No se implementa hoy.
- [ ] iOS: WidgetKit extension (Swift) + Shared data via App Groups
- [ ] Android: AppWidgetProvider (Kotlin) + RemoteViews layout XML
- [ ] Configuración de estilo desde la app
- [ ] Tap → abrir `/pasos`
- [ ] tsc + build + commit

### [x] Fase 84e — Integraciones (PENDIENTE menor)
- [x] Recovery Score con factor pasos + reto diario "Camina 10k" + calorías ajustadas + logros en `/logros`
- [ ] Integrar con journal existente (auto-log de pasos en bitácora del día) — **pendiente de decisión de diseño**: no existe bitácora diaria hoy; requiere decisión del usuario.

### [x] Fase 84f — Achievements ✅
- [x] 8 logros de pasos integrados en `/logros` (galería independiente del modal de entrenamiento)

### [x] Fase 84g — Limpieza de código ✅
- [x] Dead code eliminado, cards unificadas, `clampPercent` compartido, `getByDate` indexado

---

## Fases completamente pendientes

### Fase 91 — Rendimiento y fluidez (auditoría 2026-09-11)

Objetivo: la app se siente **fluida en uso real, sin bajones de frames** (prioridad del usuario), en todas las páginas. Diagnóstico completo en `docs/performance-audit-2026-09-11.md` (evidencia archivo:línea + métricas medidas del build). Plan detallado con checkboxes en `docs/performance-tasks.md` (este bloque es la versión oficial en PLAN.md). ⚡ = quick win (esfuerzo S, alto impacto). Cada tarea: implementar → `npx tsc --noEmit` + `npm run build` + prueba de la página → commit por tarea (sin push).

#### 91.1 — RUTINAS (especial atención: mayor impacto de jank)

- [x] **91.1.1 — Builder: drag & drop sin jank (CRITICAL, peor caso 1050 items)**
  - [x] ⚡ rAF-throttle del `onDragMove` de `useDragReorder` (aplicar una vez por frame) — `useDragReorder.ts:30-43`
  - [x] ⚡ Bailout temprano: no llamar `setDragOver` si `(dayIndex, toIndex)` no cambió (hoy objeto nuevo por pointermove rompe el bailout de React)
  - [x] Cachear rects (`getBoundingClientRect`) al inicio del drag / al cambiar conteo, no por evento
  - [ ] Verificar con Performance panel (CPU 4x): arrastrar en la rutina clonada grande
- [x] **91.1.2 — Carga de datos: eliminar N+1 (HIGH, ~1055 GETs → ~2-3)**
  - [x] ⚡ `exerciseRepo.getByIds(ids)` → `where('id').anyOf(ids).toArray()`
  - [x] ⚡ Usar `getByIds` en `enrichItems` (`useRoutines.ts:17-28`)
  - [x] ⚡ Usar `getByIds` en `useRoutineDraft.ts` (builder en edición)
  - [x] ⚡ `Promise.all` sobre días en `handleClone` y en el load de detalle
  - [ ] Verificar: detalle + edición de la rutina grande cargan sin bloqueo visible
- [x] **91.1.3 — Guardado: bulkAdd (LOW, S)**
  - [x] ⚡ `routineRepo.addDaysAndItems` → `bulkAdd` por tandas — `routineRepo.ts:62-80`
- [x] **91.1.4 — Render de listas: virtualización (HIGH, M)**
  - [x] Virtualizar lista de items del builder con `@tanstack/react-virtual` (patrón `ExercisePicker.tsx:158`) — `RutinaBuilderPage.tsx`
  - [x] Virtualizar `RoutineDayPanel` (detalle, 350+ filas por día)
- [x] **91.1.5 — Memoización de componentes (MEDIUM, M)**
  - [x] `memo` en `ExerciseItem` + key por id (hoy key = index) — `ExerciseItem.tsx`
  - [x] `memo` en `RoutineDayEditor`, key por day id, callbacks `useCallback` — `RoutineDayEditor.tsx`, `RutinaBuilderPage.tsx`
  - [x] Hoistear callbacks del builder fuera del render
- [x] **91.1.6 — Lista del catálogo: cards (HIGH)**
  - [x] `memo` en `RoutineCard` — `RoutineCard.tsx:40-47`
  - [x] `onToggleFav` estable (`useCallback`) — `RutinasPage.tsx`
  - [x] Cachear/hoistear `badgeFor` (hoy `routines.find()` por card = O(n·m))
  - [x] ⚡ `content-visibility: auto` + `contain` en `.routine-card` — `index.css:403-534`

#### 91.2 — SESIÓN ACTIVA (`/entrenamiento/active`)

- [x] **91.2.1 — Keystroke storm (CRITICAL: cada tecla re-renderiza todo + localStorage síncrono)** — `3798d63`, `ce49b49`
  - [x] Subscripciones finas al store: cada `SetRow`/selector por ejercicio selecciona solo su set; la página deja de subscribirse a `s.exercises` — `useActiveSession.ts:55`, `SessionGroupList.tsx`, `SetRow.tsx:40`
  - [x] Defer del persist: escritura debounced (400 ms) con flush en `pagehide`/`beforeunload`/`visibilitychange`, mismo formato y `partialize` — `activeWorkoutStore.ts` (perf-only, sin cambio de formato ni pérdida de datos)
  - [x] ⚡ `useCallback` por set + `memo` en `SessionGroupList` (hoy closures frescos en `ExerciseBlock.tsx:207-214`)
  - [x] Hoistear `useBodyWeight()` a nivel de página (hoy 1 liveQuery por bloque) — `ExerciseBlock.tsx:73`

#### 91.3 — PÁGINAS CONCRETAS (página a página; cada página = brainstorming + aprobación antes de tocar)

- [x] **Página: Estadísticas (`/estadisticas`)** — lazy por tab (enfoque A, aprobado)
  - [x] Cada tab monta sus hooks solo cuando está activo: `EntrenoTab`, `CuerpoTab`, `FuerzaTab` (tab cuerpo ya no paga sets/ejercicios/journals; tab fuerza solo benchmarks)
  - [x] Verificado: Recharts 337 kB aislado en la ruta lazy, nunca en el bundle principal
  - [x] `CuerpoTab` conserva el booleano global original vía `useWorkouts()` (paridad de empty state)
  - [x] Cambio aceptado por el usuario: tab `entreno` con datos corporales pero cero entrenos muestra el empty state con CTA (antes: panel lleno de ceros)
  - [ ] Follow-up futuro: acotar queries de sets (últimos N meses) o agregación DB cuando crezcan los datos — `EstadisticasPage.tsx:35-46` (era 91.4.3)
- [x] **Página: Entrenar home (`/`)** — auditoría ✅ (explore, 2026-09-11) · diseño A aprobado · **✅ implementado `157e2df`**
  - [x] **F1 MEDIUM — ~17 live queries duplicadas**: workouts ×6 (`EntrenarPage.tsx:65`, `useRecoveryScore.ts:14`, `ProgressDashboard.tsx:155`, `useStreak.ts:9` ×2, `PastSelfView.tsx:68`), workoutSets ×3 (`PlateauAlerts.tsx:14`, `PastSelfView.tsx:69`, `GoalProjectionCard.tsx:17`), exercises ×3, prs ×2, journals ×2, meta ×4, bodyWeight ×2, routines ×2 (`useActiveProgram.ts:11` + `DeloadBanner.tsx:9`), routineItems ×2 (`useRoutines.ts:77` + `:94`). Cada useLiveQuery hace su propia lectura IDB y clona el array.
  - [x] **F2 MEDIUM — `detectPlateaus` casi cuadrático**: hasta 24 escaneos completos de sets por ejercicio (`plateauDetector.ts:45-67` + `setStats.ts:19-30`); ~0,5–1,5M evaluaciones con 2.000+ sets.
  - [x] **F3 LOW — re-escaneos por ventana** (`goalProjection.ts:37-38,65-66`, `pastComparison.ts:76,83`).
  - [x] **F4 LOW — N+1 `getById`** en `useRoutineDayMuscleGroups` (`useRoutines.ts:80`) + `getItems(dayId)` duplicado (`:77`+`:94`).
  - [x] **F5 LOW — `useActiveProgram` escaneo full de routines** (`useActiveProgram.ts:10-13`; falta `routineRepo.getById`).
  - [x] **F6 NONE — limpio**: selectores Zustand finos, memoizaciones lineales, components prop-driven puros.
  - [x] **F1 fix**: hoistear `workouts`/`sets`/`prs`/`journals`/`settings` a `EntrenarPage` y pasar como props a `ProgressDashboard`, `PastSelfView`, `PlateauAlerts`, `GoalProjectionCard`, `QuickTemplates`, `DeloadBanner`, `LastWeightLink`, `useRecoveryScore` (kills ~17 lecturas duplicadas + clones). `GoalProjectionCard` → `Inner` (props) + `Self` (self-fetch): home pasa props, `ObjetivosPage` intacta.
  - [x] **F2 fix**: reescribir `detectPlateaus` agrupando sets por `exerciseId` con promedios semanales por ventana — O(S+E·W) en vez de O(E×24×S), mismo output (filtro laxo e orden preservados → paridad byte-idéntica).
  - [x] **F3 fix (cascada)**: group-once en `buildGoalProjections`/`buildPastComparison` (`goalProjection.test.ts` valores exactos 95.7/11.23 PASS).
  - [x] **F4 fix (cascada)**: `useRoutineDay(dayId)` → `{groups, items}` con UN `getItems` + `getByIds` batch; `exerciseMuscleGroup` en `RoutineItemWithNames`; hooks viejos como wrappers finos; reactividad preservada.
  - [x] **F5 fix (cascada)**: `RoutineRepository.getById` (interfaz + Dexie impl `db.routines.get`) usado en `useActiveProgram`.
  - [x] Verificación: tsc 0 · build EXIT=0 · 54 files/556 tests PASS · PWA 178 precache entries 3712 KiB (sin regresión de tamaño)
- [x] **Página: Fichas de detalle (`/rutinas/:slug`, `/ejercicios/:slug`, `/guias/:slug`, `/papers/:slug`)** — auditoría ✅ (explore, 2026-09-11) · diseño A aprobado · **✅ implementado `9d7b6c9`**
  - [x] Auditoría: guías/papers ✅ limpias (single indexed read); ejercicio limpia con 1 LOW (scan full de `prs`); rutina/detalle de sesión con LOWs ligeros (scans acotados)
  - [x] **D1**: `WorkoutDetail.tsx:28-29` — reemplazar `useExerciseCatalog()` + `usePRs()` por `exerciseRepo.getByIds(ids del set)` + PR por ejercicio (mata 2 full-table scans; cero cambio de comportamiento; patrón establecido en `useRoutines.ts:17-31`)
  - [x] **D2**: `EjercicioDetailPage.tsx:44` — `usePRs()` → `prRepo.getByExercise(exercise.id)` (ya existe indexado)
  - [x] Verificación: tsc 0 · build EXIT=0 · 54 files/556 tests PASS · PWA 178 entries 3713 KiB (sin regresión)
- [x] **Página: Histórico de sesión (`/entrenamiento/:id`)** — auditoría ✅ (explore, 2026-09-11) · **limpia**: `SesionPage`/`WorkoutHistoryTimeline` sin hallazgos; `WorkoutDetail` limpio tras D1 (`9d7b6c9`). Rendimiento hereda las mejoras de la ficha de detalle.
- [x] **Página: Biblioteca de ejercicios (`/ejercicios` + `/ejercicios/:slug`)** — auditoría ✅ (explore, 2026-09-11) · **limpia, sin fixes**: búsqueda debounced 150 ms + filter/sort/sections memoizados; lista virtualizada (`useWindowVirtualizer`, overscan 6, ~10-20 filas DOM); sin imágenes raster en filas; cero N+1; única lectura del catálogo; D2 verificado en la ficha (`prRepo.getByExercise`). `ExerciseFilterBar`/`AlphaRail`/`MuscleGroupIcon` presentacionales puros.
- [x] **Página: Calendario (`/calendario`)** — auditoría ✅ (explore, 2026-09-11) · **limpia** (decisión A del usuario: sin fixes): 1 LOW aceptado — `workoutRepo.getAll()` una vez por mount; navegación de mes 100% estado (`MonthCalendar`); la query acotada `where('localDate').between(...)` (índice en `db.ts:87`) se descarta por UX (agregaría loading por flip). Grid memoizado, ≤37 celdas, cero N+1, cero re-consulta.
- [x] **Página: Más / Perfil / Ajustes (`/mas`, `/perfil`, `/ajustes`)** — auditoría ✅ (explore, 2026-09-11) · diseño A aprobado · **✅ implementado `b3361ed`**
  - [x] Auditoría: MasPage ✅ limpia; logros ✅ limpios; Perfil 2 MEDIUM (DeloadCard scan full `workoutSets`; 3× scans `workouts`); **NUEVO MEDIUM** `AchievementsHost` global (`AppShell.tsx:59`) — 3 full-table scans por mount (`workouts`, `prs`, `workoutSets` completo)
  - [x] LOWs cargados: Ajustes 5× `useSettings`; Perfil 2ª lectura `prs` + scan catálogo para `nameById`; progress photos base64 (fuera de alcance F91)
  - [x] **M1**: `DeloadCard` — windowing por `localDate` de workouts (índice `db.ts:87`) → `getByWorkoutIds` de sets (índice `workoutId` `db.ts:74`): solo ~14 días en vez del clon completo de la tabla más grande. Cutoff −16 días con `above()` (proba: `createdAt` = `localDate` del workout, paridad exacta)
  - [x] **M2**: Perfil — 3× scans `workouts` → **1×**: `useWorkoutSummary` deriva streak del array ya cargado (`calcStreak`), expone `StreakResult` completo; `useStreak` de página borrado. `useStreak` intacto (lo usan `useActiveSession`, `useNotifications`)
  - [x] **M3**: `AchievementsHost` — `toCollection().filter(completed)` streaming (Dexie no materializa la tabla completa); guardas debounce + firma primitiva intactas
  - [x] Verificación: tsc 0 · build EXIT=0 · 54 files/556 tests PASS (+ 5 files dominio deload/streak/achievements 58 tests) · PWA 178 entries 3713 KiB
- [x] **Página: Calculadoras (`/calculadoras/*`)** — auditoría ✅ (explore, 2026-09-11) · **limpia** (decisión A del usuario: sin fixes): hub 0 lecturas Dexie (recents localStorage); IMC/Agua/Conversor/Navy puras (0 lecturas); Calorías 1 meta (age prefill); sin MEDIUM, sin N+1, sin recomputación sobre arrays de datos. LOWs aceptados: `OneRmExerciseSelector` carga catálogo 821 para buscador opcional (resultados capped a 12, memoizado) y `BODY_SEX_KEY` leído 2× en Medidas/Grasa (`SexSelector`). Series de charts memoizadas; mediciones/pliegues O(1) en el último entry.
- [x] **Página: Papers / Guías (`/papers*`, `/guias*`)** — auditoría ✅ (explore, 2026-09-11) · **limpia, sin fixes** — NONE en toda la superficie: 1 lectura seed por lista (papers ≈6, guías ≈30), 1 `getBySlug` indexado por detalle (`db.ts:75,90`), sin N+1, filtros chip O(6)/O(30) sin search input, hooks con stable-empty y guards por slug. Solo paga el host global de logros (ya M3).
- [x] **Página: Nutrición / Suplementos / Timer (`/nutricion`, `/suplementos`, `/timer`)** — auditoría ✅ (explore, 2026-09-11) · diseño A aprobado · **✅ implementado `98487e5`**
  - [x] Auditoría: Suplementos ✅ limpia (1 tabla pequeña, sin historial); Timer ✅ limpia (cero Dexie, estado puro); Nutrición 3 LOWs (meals full scan para hoy, bodyWeight full scan para hoy, `useFoods` montado 2×)
  - [x] **N1**: `useTodayMeals` (nuevo) — `mealRepo.getByDate(toLocalDateStr())` (índice `db.ts:231`); filtro JS eliminado de la página
  - [x] **N2**: peso de hoy vía `bodyWeightRepo.getByDate(toLocalDateStr())`; `useBodyWeight` NO tocado (otros consumidores necesitan historial)
  - [x] **N3**: 1 `useFoods` hoisteado a `NutritionPage` → props a `FoodAdder`; `foodsWithNames` memoizado `[customFoods, lang]`
  - [x] **DECISIÓN (usuario, opción 1): convención de fecha unificada a `toLocalDateStr()`** — nutrición escribía meals con fecha UTC (`toISOString().split('T')[0]`); alineada lectura Y escritura a fecha local (igual que steps/peso/workouts). Corrige desfase UTC (~21-24h en AR); cambio de comportamiento aceptado explícitamente para homogeneizar datos en toda la app. Nota: `useMeals.ts` quedó como dead code (borrar en pase futuro)
  - [x] Verificación: tsc 0 · build EXIT=0 · 54 files/556 tests PASS (+ nutrition domain 24/24) · lint 0 errores

#### 91.4 — SHELL / GLOBAL (pase final; afecta las 37 páginas a la vez — no es una página puntual)

- [x] **Pase Shell/Global** — auditoría ✅ (explore, 2026-09-11) · paquete completo aprobado (usuario) · **✅ implementado `4f8ce7f`**
  - [x] Auditoría: AppShell ✅ limpio (settings 1 read, telemetry tras consent, transiciones GPU); telemetry/init ✅ (pasa a 91.5); M3 streaming **verificado aplicado** (`useAchievements.ts:33-34`); 2 MEDIUM + 4 LOW
  - [x] **G1 (MEDIUM)**: `background-attachment: fixed` eliminado de body (`index.css:667`) — gradientes ahora scrollean con contenido (5-9% tint, imperceptible)
  - [x] **G2 (LOW)**: routine-card — `backdrop-filter: blur(4px)` eliminado (`:517`); `::after` pasa de `mix-blend-mode: soft-light` a overlay plano con el mismo `color-mix(cta 22%)`; velo `::before`, z-index, shadows y hero-atmosphere intactos
  - [x] **G3 (LOW)**: `.app-grain` — `mix-blend-mode: overlay` eliminado (`:697`); noise a `opacity: 0.05` conservado; elemento intacto (`AppShell.tsx:39`)
  - [x] **G4 (LOW)**: `useGlobalDragScroll` — rAF-coalesce (`pending {dx,dy,raf}` ref + 1 write/frame; cancel en mouseup/cleanup); early-exit, umbral 4px, `passive: false`+preventDefault, ancestor-walk y classList intactos
  - [x] **G5 (LOW)**: preconnect `fonts.googleapis.com` + `fonts.gstatic.com crossorigin` en `index.html`; `@import`+`display=swap` intactos
  - [x] **G6 (MEDIUM, decisión usuario: precachear)**: `jpg` en `globPatterns` + `maximumFileSizeToCacheInBytes: 5_000_000` (max jpg 0.88 MB, nada se descarta). **Precache 178 → 1995 entries; 3713 → 102707 KiB (~100 MB)** — 1817 jpgs (69 rutinas + 1746 ejercicios + hero + logo; el conteo real excede el estimado "~70" de la auditoría pero el tamaño coincide con lo aprobado). Offline visual completo web; Capacitor no afectado
  - [x] Verificación: tsc 0 · build EXIT=0 (precache 1995/102707 KiB confirmado) · 54 files/556 tests PASS

_(Los ítems 91.4.1–91.4.4 del plan original quedaron absorbidos por G1–G6 arriba: 91.4.1=G1+G2+G3, 91.4.2=G4, 91.4.3=G5, 91.4.4=G6. Todos implementados en `4f8ce7f`.)_

#### 91.5 — LOAD / STARTUP

- [x] **Pase Load/Startup** — auditoría ✅ (explore, 2026-09-11) · diseño A aprobado · **✅ implementado `c87534d`**
  - [x] Auditoría: telemetry ✅ diferida (SDKs lazy + consent-gated, post-first-paint, implementación de referencia); index.html ✅ (hero preload + anti-flash inline); boot síncrono ✅ sin bloat; **1 MEDIUM + 1 LOW**
  - [x] **L1 (MEDIUM)**: reseeder gateado — `ensureSeeded` inline en `providers.tsx` (fast path: `metaRepo.get('seedVersion')` + `SEED_VERSION` de `db.ts` + `profileRepo.ensure()`; mismatch → dynamic `import('@/data/seed/reseeder')` → `ensureSeeded()` byte-idéntico). **Boot frío pierde ~239 kB JS** (reseeder 232 kB + logros ya no se fetch-ean en versión al día; `reseeder-CNi-vY42.js` ahora solo dep lazy, ausente del modulepreload inicial)
  - [x] **L2 (LOW)**: `AchievementsHost` → `lazy()` + `<Suspense fallback={null}>` igual que `Onboarding` (`AppShell.tsx:10-12,61-63`); liveQueries reactivas + debounce 600 ms garantizan todos los unlocks; sin delay artificial
  - [x] Verificación: tsc 0 · build EXIT=0 (precache 1998 entries, +3 chunks) · 54 files/556 tests PASS (procesos globales de arranque, no páginas)

_(Los ítems 91.5.1–91.5.2 del plan original quedaron absorbidos por L1–L2 arriba: 91.5.1=L1 reseeder gateado, 91.5.2=telemetry ya era diferida — la auditoría confirmó SDKs lazy + consent-gated, sin trabajo pendiente.)_

#### 91.6 — Cierre del bloque rendimiento

- [x] Medir antes/después con Performance panel (CPU 4x, device low-end si hay) en los 2 flujos peores: builder con rutina grande y keystrokes en sesión — **✅ medido post-fixes (traces Chrome JSONL, CPU 4x)**: builder 35 long tasks/3.36 s total/max 250 ms (drag-reorder; script 2.75 s, layout 114 ms); sesión **suave** 12 long tasks/876 ms/max 80 ms (script 588 ms, layout 64 ms). Sin jank perceptible en sesión; builder OK con pico esperable en drag-reorder sobre 20 items.
- [ ] Actualizar `CHANGELOG.md` bajo `[Unreleased]` por cada tarea relevante (ya se hace por commit)
- [ ] Integrar este bloque en `PLAN.md` commiteado cuando se resuelva el rewrite F63/F93 (los checkboxes viven en el worktree sin mezclar commits)

---

## HANDOFF — Estado de sesión (2026-09-11, corte al terminar /estadisticas)

> **LEER PRIMERO por la próxima sesión.** Cómo retomar sin lagunas.

### Qué se completó (Fase 91, SIN push, commits en `main` local)

| Bloque | Estado | Commits |
|---|---|---|
| 91.1 Rutinas (rAF+bailout, getByIds N+1→batch, bulkAdd, virtualización builder+day panel, memo ExerciseItem/day, memo RoutineCard+badges+content-visibility) | ✅ PLAN.md marcado | `a96c32e`, `89a52bb`, `5bba29d`, `46762bf`, `f138438`, `3b2400c` |
| 91.2 Sesión activa (suscripciones finas por set, memo SetRow, persist debounced 400ms+flush, callbacks estables, bodyWeight hoisted) | ✅ PLAN.md marcado | `3798d63` (5 archivos limpios), `ce49b49` (hunk-split de 3 archivos compartidos) |
| 91.3 Estadísticas — lazy por tab (enfoque A aprobado) | ✅ PLAN.md marcado | `64862e7` |

### Estado del worktree (CRÍTICO)

- **WIP F63 sin commitear ni stagear** (lo tocan fases futuras; NUNCA stagear estos archivos, son de otro trabajo):
  - `.gitignore`, `gymlab-app/CHANGELOG.md`, `gymlab-app/PLAN.md`
  - `src/components/session/SessionSuggestions.tsx`, `src/domain/sessionSuggestions.ts`
  - `src/hooks/useActiveSession.ts`, `src/store/activeWorkoutStore.ts`, `src/pages/EntrenamientoPage.tsx` (quedan solo los hunks F63 tras `ce49b49`)
  - `src/i18n/locales/{en,es}/workout.ts`
- **Checkboxes de PLAN.md viven en el worktree sucio** (no se commitean hasta resolver el rewrite F63/F93).
- **Compromiso adquirido**: mientras exista WIP F63, cada tarea 91.x se commitea con **solo los archivos de código de esa tarea** (stage explícito por archivo, nunca `git add -A`). Si una tarea toca archivos compartidos con F63 → **hunk-split con `git apply --cached`** con patches filtrados en `%TEMP%\opencode\*-*.patch` (patrón usado en `ce49b49`).

### Convenciones del bloque (obligatorias)

1. **Restricción dura**: solo performance; patrones de render idénticos; si un fix cambia comportamiento → STOP y preguntar al usuario (con opciones y tradeoffs, una sola pregunta).
2. **Proceso por página**: explorar → **diseño corto en chat + aprobación del usuario** (skill `brainstorming`, ya acordada con el usuario: "página a página con brainstorming") → delegar a sub-agente `general` con handoff (skills `software-architecture` + `verification-before-completion` inyectadas) → verificar → commit solo código, sin push.
3. **Gates de verificación** (todos antes de commitear): `npx tsc --noEmit` (0 errores) + `npm run build` (exit 0) + `npm test` (54 files / 556 tests) + si aplica e2e `python tests/e2e/scripts/with_server.py tests/e2e/test_f88.py` (ALL OK).
4. **Commits**: `perf:` conventional (ver log: `perf: ... (F91.x)`), un commit por tarea, sin push (el usuario hace push manualmente).
5. **CHANGELOG.md**: NO tocarlo mientras sea WIP ajeno; se integra en el rewrite F63/F93.
6. **Engram**: guardar hitos al cerrar cada página (`engram_remember`, topic `fase91-rendimiento`), briefing al arrancar la sesión.
7. **Rate limit del provider al delegar**: puede fallar el primer intento de sub-agente; reintentar una vez con la misma tarea.

### Decisiones tomadas (no re-preguntar)

- Estrategia frente al choque WIP F63 ↔ 91.x: **stage por hunks** (elegida por el usuario).
- Shell/global (91.4) NO es página → **pase final** después de las páginas concretas (elegido por el usuario: "Páginas primero, shell al final").
- Tab `entreno` con datos corporales pero cero entrenos → mostrar **empty state con CTA** en vez del panel lleno de ceros (aceptado por el usuario).
- Rechazado por el usuario el bloque 91.3 "GLOBAL/SHELL muy general" → reorganizado **página a página** (esta sección 91.3).
- `using-workflow` NO se usa en este bloque (es para crear algo nuevo); se usa `brainstorming`.
- "Verificar con Performance panel" de 91.1.1/91.1.2 **sin marcar** → medición manual diferida a 91.6.

### Baseline (auditoría 2026-09-11, `docs/performance-audit-2026-09-11.md`)

JS inicial ~557 kB raw/~182 kB gz · posthog 274 kB y Sentry 475 kB gated · reseeder 232 kB por boot · PWA precache 3.7 MB, `.jpg` ejercicios 97.5 MB sin cachear (offline roto) · Google Fonts `@import` render-blocking.

### Próximos pasos (orden del checklist 91.3)

1. **Entrenar home (`/`)** — auditoría de hot paths y hooks compartidos (chunk lazy 42.21 kB).
2. Fichas de detalle (`/rutinas/:slug`, `/ejercicios/:slug`, `/guias/:slug`, `/papers/:slug`).
3. Histórico de sesión (`/entrenamiento/:id`).
4. Biblioteca de ejercicios (`/ejercicios` + ficha).
5. Calendario (`/calendario`).
6. Más / Perfil / Ajustes.
7. Calculadoras · Papers/Guías · Nutrición/Suplementos/Timer (probablemente solo confirmar limpio).
   Luego 91.4 Shell (4 items), 91.5 Load/startup, 91.6 cierre (medición + CHANGELOG + integrar PLAN commiteado).

---

## Subtareas opcionales / futuras en fases cerradas

- [ ] **39.D (opc, P3)** — Split archivos >200 líneas: `AjustesPage` (489), `EntrenamientoPage` (449), `EntrenarPage` (415), `RutinaBuilderPage` (379).
- [ ] **46.U3 (opc, P3)** — Virtualizar listado de `RutinasPage` con `@tanstack/react-virtual`
- [ ] **93 #22** — Revisión futura: validar con el usuario que la sesión rápida mantiene el valor/contexto esperado tras su uso real.
- [ ] **93 #8** — Guías: imágenes (ranura hero en `GuiaDetailPage`); requiere `imageUrl` opcional en `Guide` + assets.

---

## Tareas de Fase 93 pendientes

#### [ ] #30 — Crear correo de la app
- [ ] **Requiere intervención del usuario**: crear la cuenta de correo de la app.
- [ ] Añadir el correo como contacto en Ajustes / T&C (`/terminos`) / reporte de errores (#29).
- [ ] Verificación + CHANGELOG + commit.

#### [ ] #15 — Cámara en móvil real + foto shareable (F79/F75 archivadas; validación móvil diferida acá)
- [ ] Probar la captura de fotos en **móvil real** (validación que F79 dejó diferida al archivarse) y reportar resultados.
- [ ] (Nuevo) Foto shareable de progreso: exportar/compartir la foto de progreso (patrón `SessionImageExport` F75).
- [ ] Verificación + CHANGELOG + commit.

#### [ ] #21 — Wearables y contador de pasos (duplicado F84/F84a–f)
- [ ] Ejecutar las fases ya planificadas: **F84a** ✅, **F84b** ✅, **F84c** ✅, **F84d** ⛔ (widget, bloqueado), **F84e** ✅, **F84f** ✅ — ver sus checkboxes arriba.

---

## Fase 94 — Imágenes generadas por IA (sustituir emojis y símbolos de la UI) — PENDIENTE

**Objetivo**: eliminar de la UI renderizable todos los emojis/símbolos decorativos y sustituirlos por **assets estáticos generados con IA**, coherentes con el design system GymLab, manteniendo la app 100% offline-first (sin backend, sin API keys en runtime, sin costo por llamada).

**Decisión de pipeline (aprobada)**: assets estáticos en build. Las imágenes se generan fuera de la app (herramienta/prompt de IA), se guardan en `public/`, y se bundlan con Vite. La app nunca llama a una API de imágenes en runtime.

### Inventario (evidencia recolectada 2026-09-12)

Escaneo de `src/` + `public/` con rango Unicode de emojis/símbolos (fé1f0–fé1faff, 2600–27bf, 2b00–2bff, fe0f, etc.):
- Archivos escaneados: **474** (src) — archivos con emoji: **8** — total emojis: **10**
- `src/data/**` (seeds de ejercicios, rutinas, guías, logros): **0 emojis**

| Emoji/símbolo | Dónde | Renderiza | Acción propuesta |
|---|---|---|---|
| `💪` Flexed Biceps | `src/i18n/locales/es/features.ts` L74 — `footer: 'Entrena con GymLab 💪'` | Sí — footer de la app | Sustituir por imagen/marca IA o eliminar (marca limpia) |
| `💪` Flexed Biceps | `src/i18n/locales/en/features.ts` L74 — `footer: 'Train with GymLab 💪'` | Sí — footer (EN) | Ídem |
| `✓` Check mark | `src/components/workout/WorkoutExerciseBlock.tsx` L77 | Sí — marca de serie completada | Sustituir por icono lucide (`Check`) o image asset; **decisión pendiente en brainstorm de implementación** |
| `↔` Left Right Arrow | `src/i18n/locales/es/core.ts` L185, L216; `en/core.ts` L185, L216 | Sí — título del conversor (texto, no icono) | **Mantener** — es símbolo tipográfico de texto (flecha), no emoji; no renderiza como glifo emoji |
| `↔` (comentarios) | `src/domain/calculators/converter.ts` L1, `src/lib/duration.ts` L1, `src/pages/ConversorPage.tsx` L1 | No — comentarios | No tocar |

### Contexto de la convención

- `AGENTS.md` ya exige **"Iconos: lucide-react (nunca emoji como icono)"** — esta fase ejecuta esa regla donde aún hay huecos.
- El resto de la UI usa iconos lucide (la norma); no se reemplazan iconos lucide, solo emojis/símbolos residuales.
- **No confundir**: los 431 emojis que aparecen globalmente en el repo viven en `PLAN.md`, docs de auditoría y skills (`.agents/`, `.opencode/`) — **no son UI** y **no** entran en esta fase.

### Tareas

- [ ] **94.1 — Inventario definitivo por componente** (detalle fino)
  - [ ] Verificar con grep/script el estado de los 3 puntos de emoji reales (footer es/en, check set), confirmando que no haya nuevos emojis añadidos desde este inventario.
  - [ ] Decidir caso a caso: (a) sustituir por asset IA, (b) sustituir por icono lucide, (c) mantener (símbolo tipográfico).
  - [ ] Documentar la lista final en esta sección (checkboxes).

- [ ] **94.2 — Generación de assets IA** (fuera de la app, una sola vez)
  - [ ] Definir prompt y estilo: coherente con tema GymLab (`#121214`, acento `#D9B384`/`#FDDDB4`), trazo simple, fondo transparente o SVG, para uso en icono de footer y check.
  - [ ] Generar los assets necesarios (mínimo: marca/footer + check de set), formato WebP/SVG, nombres descriptivos en `public/images/` (p. ej. `public/images/brand/footer-mark.webp`).
  - [ ] Registrar en esta sección qué herramienta/prompt se usó (reproducibilidad) y licencia de uso.

- [ ] **94.3 — Integración en la UI**
  - [ ] Footer: reemplazar `💪` en los strings i18n (`features.ts` es/en) por el componente de imagen/marca (con `alt` accesible o `aria-hidden` según sea decorativo).
  - [ ] Check de set (`WorkoutExerciseBlock.tsx`): sustituir `✓` por icono lucide `Check` (alineado con la norma del repo) o por el asset IA según decisión de 94.1.
  - [ ] i18n: si el emoji vive en strings, mover el asset fuera del texto traducible (la imagen no se traduce).
  - [ ] Accesibilidad: `alt` descriptivo para imágenes informativas; `aria-hidden` + rol decorativo si es puramente decorativo; preservar estados `aria-pressed`/`aria-live` existentes.

- [ ] **94.4 — Verificación y cierre**
  - [ ] `npx tsc --noEmit` → 0 errores.
  - [ ] `npm run build` → exit 0.
  - [ ] Escaneo de regresión: repetir el inventario de emojis y confirmar 0 emojis/símbolos residuales renderizables (salvo los decididos como tipográficos tipo `↔`).
  - [ ] Playwright (Python): smoke visual del footer y de la sesión activa (check de set) según `tests/e2e/` — sin regresiones, 0 errores de consola.
  - [ ] `CHANGELOG.md` bajo `[Unreleased] → Added/Changed`.
  - [ ] Commit sin push (`feat: imágenes IA sustituyen emojis de footer y check (F94)` o similar; separado por tarea según convención).

### Criterio de aceptación

1. **0 emojis renderizables** en la app (escaneo fuente repetible, excluyendo símbolos tipográficos acordados).
2. Accesibilidad preservada o mejorada (alt/aria correctos, touch targets intactos).
3. Peso acotado: assets pequeños (< 50 KB cada uno salvo justificación), sin afectar el bundle crítico (lazy/`preload` según criterio de 91).
4. Offline-first intacto: sin llamadas de red en runtime para imágenes; todo en `public/` bundlado.
5. CHANGELOG al día y build limpio.

### Riesgos / decisiones abiertas

- Decidir si el footer conserva alguna marca visual IA o queda texto limpio (la marca «GymLab 💪» es copy histórica — validar con el usuario si quiere mantener el gesto visual).
- Decidir el reemplazo del `✓`: probablemente lucide `Check` es lo correcto (norma del repo), y el asset IA se reserva para elementos de marca — confirmar en el brainstorm de implementación.
- Los `↔` del conversor son flechas tipográficas en strings (no iconos); mantenerlos salvo que el usuario pida pasarlos a icono lucide `ArrowLeftRight`.
- Herramienta de generación IA: elegir y fijar en 94.2 (reproducibilidad) — fuera de este repo, no requiere backend.

---

## Fases 95–100 — Ideas del usuario (sesión de prueba 2026-09-12)

*(Origen: 26 notas de prueba ordenadas y agrupadas en 6 clusters. La exploración de cada fase puede reestructurar estos ítems en tareas concretas; cuando una fase se cierra, marcar sus checkboxes y actualizar CHANGELOG.md.)*

### Fase 95 — Gamificación y celebración (engagement) — IMPLEMENTADA ✅

**Objetivo**: hacer la app divertida y con un "toque adictivo", celebrando logros para que el usuario quiera volver.

Notas origen: **#1, #4, #26**

**Estado SDD (2026-09-13)**: exploración → propuesta → 3 specs → diseño → tasks → apply (3 slices) → **implementada y verificada localmente**. Pendiente: sdd-verify formal, push (14 commits locales sin push) y arte IA de Fase 94 (entra después, no bloqueante). Hallazgos clave de la exploración/diseño:
- La **celebración YA existía** (`AchievementModal.tsx`: confeti de 12 piezas, pulse con animejs, guard `prefersReducedMotion`) — 95.1 amplió un sistema vivo.
- `checkAchievements` era **binario** (sin progreso parcial, targets literales inline) → refactor declarativo en 95.3.
- `WorkoutDetail.tsx:119` hardcodeaba `prCount = 0` → la foto histórica nunca mostraba PRs (bug corregido).
- **Bugs latentes corregidos**: `guias-completas` declarada pero NUNCA evaluada (ahora `targetFrom: 'guideCount'`); `primera-cardio` usaba la MISMA condición que `primer-paso` (ahora categoría cardio real); `primer-ano` llamaba `Date.now()` en el dominio (ahora puro con `now` inyectado).
- Decisión de producto: **NO es gacha mecánica** (sin monedas, sin tiradas; "gacha" era solo tono adictivo).
- Orden incremental ejecutado: **95.3 → 95.2 → 95.1** (PR chained stacked-to-main).

Verificación: suite vitest **57 files / 633 tests PASS**, build limpio, e2e `test_f95.py` ALL OK (3 partes: progreso aria, foto con ventana de PRs + flujo activo, variantes/modal/haptics). Commits: `a6e4e0f` (95.3 dominio) `3e1ef09` (95.3 stats bag) `25d973b` (95.3 hooks) `0a57f3e` (95.3 barras+i18n) `d27d7e3` (95.3 e2e) `5b764dd` (95.2 dominio foto) `b241d19` (95.2 hook+tarjeta) `e9f4861` (95.2 superficies) `2ba7b83` (95.2 e2e) `1b48a16` (95.1 grant) `c1a2c34` (95.1 persistencia) `9da2f9c` (95.1 modal) `57bcdbd` (95.1 galería) `7111fe0` (95.1 e2e).

- [x] **95.1 — Toque adictivo general (#1)**: celebración ampliada + recompensas cosméticas locales. Implementado: cola secuencial dentro del modal (sin stack, avance por dismiss); confeti amplificado (~28 piezas) + `vibrate([30,40,30])` una vez por modal abierto (en gesto de usuario), todo tras `prefersReducedMotion()` (haptics inertes bajo reduced-motion); variantes de chapa CSS-first con **grant determinista e idempotente** (`grantedCollectibles(counts)`, secuencia fija por logro) persistidas en `meta.collectibles` `{achievementId, variantId}` ANTES de mostrar el modal (sin doble grant en recarga); variantes visibles en galería de `/logros` y chapas del perfil. Arte IA de Fase 94 entra después, no es bloqueante.
- [x] **95.2 — Foto del día del entrenamiento estilo Strava (#4)**: rediseño de plantilla canvas (`SessionImageExport.tsx`, 1080×1080) sin deps nuevas. Implementado: `SessionImageData.workoutName` (rutina vía `routineRepo` + fallback localizado); **3 plantillas** (`classic|hero|compact`) con selector local; hook compartido `useSessionPhotoData` para ambas superficies; **fix `prCount`**: post-guardado usa el `prCount` exacto del save, historial deriva por ventana `[startedAt, finishedAt]` (`countPrsInWorkout` puro). Superficies: `SessionSummaryView` (post-guardado, primaria) + `WorkoutDetail` (histórica, ya montada); canvas siempre visible en vivo (sin botón "Vista previa"); share con fallback download.
- [x] **95.3 — Barra de progreso en los logros (#26)**: dominio puro `src/domain/achievementProgress.ts` — mapa declarativo `ACHIEVEMENT_PROGRESS` (15 ids) como fuente única de verdad, `AchievementStats` + `deriveAchievementStats` (puro, `now` inyectado, categorías como `ReadonlyMap` resuelto por el hook, fallback `'strength'`). `checkAchievements` evalúa `current >= target` vía el mapa (fixes `primera-cardio` y `primer-ano` incluidos). Medidas no-monotónicas = historical best (barras nunca retroceden). `guias-completas`: `targetFrom: 'guideCount'` (target dinámico puro, current 0 hasta que exista señal). Barras en galería con `role="progressbar"` vía hook `useAchievementProgress` + barra general `X/15` en `/logros`.

### Fase 97 — Data unificada y sugerencias de carga — IMPLEMENTADA ✅

**Objetivo**: una sola fuente de verdad para los cálculos que hoy duplican data con resultados distintos; sugerencias de peso realistas.

Notas origen: **#11, #12, #16, #17, #19**

> **Nota (pulido F66/F67, 2026-09-26)**: «recomendación de pesos» quedó declarada fuera de alcance del pulido (spec `2026-09-26-f66-f67-pulido-design.md`) por ser territorio de esta fase: acá vive el motor de carga (`recommendLoad`, media de top-sets, PR como techo). No duplicar en fases nuevas.

**Estado SDD (2026-09-13)**: exploración (research L1/L2/L3) → propuesta (decisions D0–D6) → 4 specs → diseño → tasks → apply (3 slices, chained stacked-to-main) → **implementada y verificada localmente** (sdd-verify: `pass_with_warnings`, 16/16 requirements, 31/31 scenarios, 69 files / 775 tests + build limpio + e2e ALL OK 10 checks + regresión F96 5 checks). Pendiente: smoke de dispositivo real y push manual de los 9 commits locales (apilados sobre el tip F96). Hallazgos clave de la exploración/diseño:
- El mensaje **"descansá 3 min"** (fatiga) y el `RestTimer` (90s) venían de fuentes distintas → mensajería unificada sobre `calcRestRecommendation` (`restAdviceMinutes`), sin tocar la matemática (frontera F97.1 byte-idéntica al tip F96).
- `loadSuggestion.ts` (próxima sesión, último peso/PR) y `sessionSuggestions.ts` (en vivo) sugerían distinto → **un solo motor** `recommendLoad` compuesto por rol, con `adaptiveRoutine` retirado.
- La sugerencia **pedía de más** al anclar en el PR → base = **media del top-set de las últimas 5 sesiones**, PR como **techo estricto** y redondeo a la placa más cercana (sin redondear hacia arriba); el factor RIR sólo des-amplifica.
- `Number("16,5")` = **NaN** en `SetRow` y demás inputs → `parseDecimal` compartido + `type="text"`/`inputMode="decimal"` + normalización de coma en la importación CSV.
- El slice 3 **superó el presupuesto** de revisión (964 líneas autoradas) → `size:exception` registrado; existe un split limpio en 2 sub-PRs si el revisor lo prefiere.

- [x] **97.1 — Fuente única de verdad para descanso/fatiga (#19)**: implementado. El aviso inline deriva de `calcRestRecommendation` vía `restAdviceMinutes` (minutos, mínimo 1) con las mismas entradas que el modo Auto del timer; se eliminó el `3 min` hardcodeado. `calcRestRecommendation`/`muscleFatigue` intactos.
- [x] **97.2 — Eliminar sugerido duplicado (#11)**: implementado. Un único motor `recommendLoad` compuesto por rol (per-ejercicio «Sugerido» antes del primer set; overlay en vivo después); `loadSuggestion.ts`, `adaptiveRoutine.ts` y `AdaptiveSuggestions.tsx` retirados.
- [x] **97.3 — Peso sugerido más realista (#16)**: implementado. PR como techo estricto (`min`, nunca suelo), redondeo a la placa más cercana (sin subir) y factor RIR que sólo des-amplifica; el flag `capped` se muestra con `workout.cappedByPr`.
- [x] **97.4 — Media de últimos entrenos (#17)**: implementado. Base = promedio del top-set (sin calentamientos) de las últimas 5 sesiones (`RECENT_SESSIONS_N = 5`), con fallback a sesión viva/última y PR; `useRecentLoadHistory` con una query page-level de 90 días fanned out a los bloques.
- [x] **97.5 — Aceptar coma y punto en kilos (#12)**: implementado. `parseDecimal` compartido (coma y punto, nunca `0` ante inválido) + `DecimalInput`/`inputMode="decimal"` en sesión, calculadoras y ajustes; normalización de coma decimal en la importación CSV (Strong/Hevy/JEFIT).

**Diferido a validación de release (no verificado)**: smoke en dispositivo Android/iOS real del comportamiento del teclado numérico con `type="text"` + `inputMode="decimal"` en WebView (si el teclado del SO expone la coma y cómo la confirma al teclear) y de la importación CSV de archivos reales. No es ejecutable en este entorno; la aceptación de coma app-wide no debe considerarse verificada sólo con unit/e2e.

### Fase 98 — UX de la sesión activa — IMPLEMENTADA ✅

**Objetivo**: cerrar seis fricciones del flujo de sesión activa — notas por sesión, sugerencia junto al ejercicio, filas selectoras de dos zonas, Enter que avanza el foco, fila de force-mode que quepa a 375px y borrado confirmado de una sesión con recálculo de PRs.

Notas origen: **#6, #8, #10, #14, #20, #24**

**Estado SDD (2026-09-14)**: exploración → propuesta (decisions D0–D11) → 5 specs (`session-notes`, `numeric-input`, `load-recommendation`, `exercise-picker`, `session-deletion`) → diseño → tasks → apply (5 slices, chained stacked-to-main) → **implementada y verificada localmente**. Verificación local: suite vitest **75 files / 820 tests PASS**, `npm run build` (tsc -b) limpio y e2e F98 (notas, cadena de foco, chip/selector, borrado, aislamiento de memo) ALL OK. Pendiente: sdd-verify formal, smoke de dispositivo real y push manual de la cadena local (`gh` ausente). Hallazgos clave de la exploración/diseño:
- La sugerencia en vivo era un **overlay page-level desconectado** del ejercicio y con un gate de «≥2 series» que impedía aconsejar pronto → 98.2 la lleva dentro del bloque con props escalares y aislamiento de memo (91.2).
- El gate de «≥2 sets» vivía en el **motor** (`generateSuggestions`), no solo en la página → se retiró en el motor, no únicamente en la superficie.
- El botón de descartar tenía un **`aria-label="Dismiss"` hardcodeado en inglés** → clave i18n `workout.descartarSugerencia`.
- La cadena de foco **no podía depender del DOM** (98.5 rediseña la fila) → 98.4 la modela como dominio puro por rol/serie, con commit de borrador que nunca coacciona un valor inválido a 0.
- El slice C **superó el presupuesto** de revisión (~1.892 líneas autoradas: reescritura completa de `SetRow` + superficie e2e nueva) → `size:exception` aceptado por el maintainer.

- [x] **98.1 — Notas del usuario en la sesión (#10)**: implementado. Estado `sessionNote`/`setSessionNote` en `activeWorkoutStore` (partialize + reset), campo opcional `notes` en `WorkoutSessionSnapshot` rellenado por `useFinishWorkout` (se elimina el `''` hardcodeado) y textarea `SessionHeaderNote` en la cabecera con la persistencia diferida de 91.2 (debounce 400 ms + flush en `pagehide`/`beforeunload`/`visibilitychange`); `WorkoutDetail` ya renderizaba la nota. Claves i18n es/en.
- [x] **98.2 — Sugerencia adaptativa cerca del ejercicio (#24)**: implementado. `useBlockSuggestions` calcula una vez por página y distribuye una referencia escalar estabilizada por bloque; `SuggestionChip` (aplicar/calentamiento/descartar) vive dentro del bloque; retirados el overlay `SessionSuggestions` y el gate de «≥2 series»; descartar localizado.
- [x] **98.3 — Casilla del ejercicio con dos zonas (#6)**: implementado. Filas de dos zonas en `ExercisePicker` (cuerpo→ficha `/ejercicios/:slug`, «+» ≥44 px→alta) en sesión, `RutinaBuilderPage` y `GoalSetter`; el «+» del catálogo (`EjerciciosPage`) añade a la sesión activa o abre `RoutineDestinationSheet` (`routineRepo.addItem`/`removeItem`), con undo generalizado (`UndoToast.messageKey`). es/en completos.
- [x] **98.4 — Input salta al siguiente (#20)**: implementado. `DecimalInput` con `onEnter`/`inputRef`/`enterKeyHint="next"`; cadena pura por rol y serie (`src/domain/setInputChain.ts`) peso→reps→RPE→RIR→primer input de la siguiente serie, blur en el último; `resolveDraftCommit` (`numberGuard.ts`) unifica el commit válido/vacío/inválido sin ceros.
- [x] **98.5 — RPE/RIR desbordan la pantalla (#8)**: implementado. `SetRow` y cabecera del bloque rediseñados en rejilla de dos líneas dentro del presupuesto de 343 px, sin `HScroll` ni scroll horizontal, con targets ≥44 px, gap ≥8 px y columnas alineadas; la cadena de foco de 98.4 se preserva.
- [x] **98.6 — Borrar datos de una sesión sin reset (#14)**: implementado. Acción destructiva en `WorkoutDetail` con `ConfirmSheet` + haptic → `deleteWorkoutSession(id)` en una transacción Dexie (workouts + workoutSets + sessionJournals + prs), recálculo idempotente del PR restante (`bestPRFromSets`, Brzycki, ignora calentamientos; borra la fila si no quedan series). Sin soft-delete; las sesiones importadas por CSV usan el mismo flujo.

**Diferido a validación de release (no verificado)**: comportamiento del teclado real Android/iOS con `enterKeyHint="next"` y la ergonomía de la cadena de foco con teclado físico, y el ajuste visual de la fila en force-mode a 375 px en dispositivo real (los e2e headless solo prueban el atributo/overflow). Arrastrado de F97: el teclado numérico con `type="text"` + `inputMode="decimal"` (si el SO expone la coma decimal en WebView y cómo la confirma) y el smoke de importación CSV de archivos reales. No es ejecutable en este entorno; nada de esto debe considerarse verificado solo con unit/e2e.

### Fase 99 — Home y layout — IMPLEMENTADA ✅

**Objetivo**: dos mejoras de la pantalla de inicio y la orientación — el hero elige qué día de la rutina activa entrenar (con flujo de descarte para días vacíos, sin crear sesión), y la app deja de forzar portrait: en horizontal se ve igual pero centrada, con el sobrante relleno del fondo.

Notas origen: **#21, #22**

**Estado SDD (2026-09-14)**: exploración → propuesta (8 decisiones de producto: `siempre`, `filtrar-items`, `boton-explicito`, `confirm-sheet`, `manifest-media`, `simulacion`, `ocultar-sesion`, `aceptar-1024`) → 2 specs (`home-day-selector`, `landscape-layout`) → diseño (D1–D7) → tasks → apply (2 slices, chained stacked-to-main) → **implementada y verificada localmente**. Verificación local: `npx tsc --noEmit` limpio, **75 files / 827 tests PASS**, `npm run build` limpio (PWA v1.3.0) y e2e `test_f99_home_layout.py` ALL OK (A.9 happy path + locale, A.10 negativo, A.11 reduced-motion, B.4 seis viewports landscape, B.5 TabBar) y `check_manifest.py` OK (`orientation = 'any'`). Pendiente: sdd-verify formal, smoke de dispositivo real y push manual de la cadena local (`gh` ausente). Consideraciones clave de la exploración/diseño:
- El hero ya mostraba el día de hoy; faltaba **elegir qué día entrenar** y un flujo para días vacíos/descanso → `siempre` (el selector abre en cada «Empezar» con programa activo), `filtrar-items` (días sin ejercicios filtrados en dominio puro `selectableDays`) y `ocultar-sesion` (el botón «Cambiar día» solo sin sesión activa).
- El día vacío es **inalcanzable** desde la UI (el selector filtra), pero el flujo existe por diseño (`confirm-sheet`): confirmar descarta sin crear sesión y vuelve al home con `EmptyDayToast`; no se reutiliza `confirmLeaveConfirm`.
- La orientación se forzaba a **portrait en el manifest** → `manifest-media` (`orientation: 'any'`) + escalera de anchos del contenedor (`max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl`) con `overflow-x-clip` y `landscape:p-4` en el hero. `simulacion`: la verificación landscape es headless (DevTools/e2e), el dispositivo real queda como gate de release.
- **Amend post-apply (declarado en apply-progress §4)**: los números originales de los buckets landscape fueron corregidos a los reales de Tailwind v4 (min-width inclusivo): 640×360→512 (base), 812×375→768 (`md`), 1024×768→1024 (`lg`), 1194×834→1024 (`lg`, `aceptar-1024`), ≥1280→1152 (`xl`), ≥1536→1280 (`2xl`); la spec amended es la fuente de verdad y coincide con los e2e B.4.

- [x] **99.1 — Rutina activa en el hero del home (#22)**: implementado. Con programa activo, «Empezar» abre siempre `DaySelectorSheet` (patrón `RoutineDestinationSheet`, filas de 44 px, cierre por backdrop/X/Escape) y el hero muestra un botón explícito **«Cambiar día»** sin sesión activa. Los días sin ejercicios se filtran en dominio puro (`selectableDays` en `src/domain/routines.ts` + hook `useRoutineDaysWithItems`); al elegir día, `resolveDayStart` inicia la sesión (`startRoutineDay(items, routine.id, dayId)` → `/entrenamiento/active`), o —si el día estuviera vacío— abre un `ConfirmSheet` que al confirmar navega a `/` con `EmptyDayToast` **sin crear sesión**. i18n es/en (`home.*`, 7 claves).
- [x] **99.2 — Landscape centrado (#21)**: implementado. El manifest PWA pasa a `orientation: 'any'` (`vite.config.ts`), el contenedor del `AppShell` gana la escalera `xl:max-w-6xl 2xl:max-w-7xl` sobre `max-w-lg md:max-w-3xl lg:max-w-5xl` con `overflow-x-clip` conservado, y el hero reduce su padding en horizontal (`landscape:p-4`); el TabBar mantiene proporciones (57 px ≥ 44, tabs ≥ 44×44, sin scroll horizontal) y `capacitor.config.ts` no restringe orientación.

**Diferido a validación de release (no verificado)**: landscape en dispositivo real (centrado visual, padding del hero, ergonomía del TabBar), PWA standalone con `orientation: 'any'` y orientación nativa de Capacitor (decisión `simulacion`; los e2e headless solo prueban los buckets del contenedor y el contenido del manifest). No es ejecutable en este entorno; nada de esto debe considerarse verificado solo con unit/e2e.

### Fase 100 — Con cuentas: telemetría + sync nube (MÁS ADELANTE / post-cuentas) — PENDIENTE

**NOTA: hacerlo más adelante.** Depende de crear cuentas/backend (hoy la app es 100% local-first: Dexie/IndexedDB, PWA, Capacitor; AGENTS.md prohíbe backend en MVP — Supabase futuro sería "nueva impl del mismo interface"). Esta fase se retoma cuando exista el modelo de cuentas.

Notas origen: **#3, #5**

- [ ] **100.1 — Mapa de calor de uso (#3)**: telemetría de qué usan los usuarios para saber en qué mejorar/enfocarse.
- [ ] **100.2 — Sync local ↔ nube (#5)**: al crear la cuenta real, sincronizar la base local con la nube (Supabase) manualmente o periodizado (tipo WhatsApp).

---

## Fase 101 — Onboarding guiado de la app (tour + replayable) — PENDIENTE

> **Pedido del usuario (2026-09-15).** El onboarding actual (`src/components/onboarding/Onboarding.tsx`) es un **wizard de configuración** (idioma/objetivo/días/perfil/resumen), no un tour que enseñe a usar la app; además es **irrecuperable** (`Onboarding.tsx:97` lo oculta tras el primer entreno y `:139` se niega a correr si ya está hecho) y no tiene tests. Objetivo: convertirlo en un **tour guiado** que enseñe a usar la app y que se pueda **re-ver desde Ajustes**. Reutiliza el catálogo de ayudas de la Fase 90 (esa fase NO persiste "ya visto": la ayuda es on-demand; el tour sí necesita su propio flag de completado en `meta`).

- [ ] **101.1 — Tour guiado**: recorrido por los flujos clave (día/rutina del home, sesión activa, historial/estadísticas, logros, ajustes) explicando qué hace cada uno, sin bloquear el uso.
- [ ] **101.2 — Separar wizard de tour**: el wizard de setup y el tour son cosas distintas; el tour no condiciona el arranque de la app.
- [ ] **101.3 — Replayable desde Ajustes**: re-ver el tour cuando el usuario quiera (flag en `meta`, patrón 90.5).
- [ ] **101.4 — Tests**: unit del gate/estado + e2e del flujo completo.
- [ ] **101.5 — Onboarding por apartado (nota 15)**: hacer un onboarding que te enseñe a utilizar la app cuando entras en un apartado por primera vez; se debe poder desactivar en ajustes y tener un skip.
- [ ] **101.6 — Scroll del wizard existente (nota 18)**: el onboarding existente no hace scroll, por lo que en pantallas pequeñas no se puede dar a los botones porque desaparecen de la pantalla (se ve más abajo).

---

## Fases 102–112 — Notas de mejora (sesión 2026-09-20)

*(Origen: 20 notas agrupadas por conexión. Hasta acá se copia la idea tal cual; el detalle de subtareas se desarrolla fase por fase. Reutilizar código/datos que ya recoge la app; crear de cero solo si no hay nada reutilizable.)*

### Fase 102 — Auditoría de inputs (UX, formato y caracteres) — PENDIENTE

Notas origen: **#1**

**Overlap:** F93 #23 (auditoría e2e de inputs, cerrada) + F97.5 (`parseDecimal` / `DecimalInput`) + F98.4 (cadena Enter). Hecho a nivel de kilos/sesión; **no cubre** el resto de inputs ni “si es molesto” / caracteres que rompen.

**Alcance (aprobado 2026-09-20):** solo campos **numéricos/formato** — peso, reps, medidas, pasos, timers, calculadoras. Quedan **fuera**: nombres, notas, búsquedas, archivos, selects y una pasada UX completa.

**Contrato (aprobado 2026-09-20):**
- Filtro **al teclear** (no al validar al confirmar): el draft inválido **no entra** al input, se descarta antes de pintarse; reutiliza el parser existente (`numberGuard` + `DecimalInput`).
- Solo pasan dígitos y **un** separador decimal (`,` o `.`). Modo **entero** (pasos, reps, semanas) = solo dígitos.
- **Vacío sigue válido**: se limpia, nunca se escribe un `0` mentiroso (mantiene el contrato de `resolveDraftCommit` / `NumberField`).
- **Sin mensajes de error**: la entrada inválida se ignora silenciosamente.
- **Dosis de suplementos queda fuera**: sigue como texto libre (`"5 g"`, `"1 cápsula"`).
- **Caso especial — duración cardio (`0:00`)**: el usuario escribe **solo dígitos** y el `:` se agrega automáticamente al editar (reusa `parseDuration`/`formatDuration`): más fácil que escribir `m:ss` a mano.

**Implementación (TDD, en worktree aislado `gymlab-f102`, rama `f102`):**
1. `sanitizeDecimalDraft` como función **pura** en `src/domain/numberGuard.ts` (modo decimal e entero + formateo de duración con `:` automático) con tests en `tests/unit/domain/numberGuard.test.ts`.
2. `DecimalInput` **filtra el draft antes de pintarlo**; los usos actuales (kilos/sesión, distancia, settings) ganan el filtro sin tocarlos.
3. **Migrar los numéricos sueltos a `DecimalInput`**: pasos, medidas corporales, calculadoras (IMC/calorías/grasa/conversor), benchmark, timer, comida en gramos, onboarding peso/altura — con modo entero/decimal según el campo.
4. Duración cardio en `SetRow` (y donde aplique): solo dígitos + `:` automático.
5. Verificación: tests del sanitizer + suite `numberGuard` + `npm run build` + `npm test`; el e2e F93 #23 no debería romperse.

- [ ] **102.1 — Comprobar todos los input y el funcionamiento**: si es molesto para el usuario, etc.; también si puede generar errores algunos caracteres; si el input espera algún dato o formato se debe restringir para su buen funcionamiento.
- [ ] **102.2 — `sanitizeDecimalDraft` (TDD)**: función pura en `numberGuard` + tests (decimal, entero, separador único, vacío, duración con `:` auto).
- [ ] **102.3 — `DecimalInput` filtra al teclear**: descartar draft inválido antes de pintar; los usos actuales quedan cubiertos gratis.
- [ ] **102.4 — Migrar inputs numéricos sueltos a `DecimalInput`**: pasos, medidas, calculadoras, benchmark, timer, comida, onboarding.
- [ ] **102.5 — Duración cardio con `:` automático**: solo dígitos al escribir.
- [ ] **102.6 — Verificación**: tests del sanitizer + suite existente + build + e2e F93 #23 sin regresiones.

### Fase 103 — Estabilidad: lentitud, cuelgues y crashes — PENDIENTE

Notas origen: **#2, #4, #8**

**Overlap:** F91 (rendimiento 2026-09-11, mayormente implementada) + F93 #24 (baseline, “sin optimización necesaria”). El usuario **sigue** viendo lentitud y cuelgues. F77 suplementos está cerrada; hay que investigar si entrar a `/suplementos` (u otras rutas) rompe la app.

- [ ] **103.1 — Rendimiento de la app en general**: va un poco lento.
- [ ] **103.2 — Investigar por qué se cuelga la app a veces**: ¿rendimiento?
- [ ] **103.3 — Entrar en suplementos rompe la app? o en otros lados**.

### Fase 104 — Gráficos: selección de barras + test de fuerza — PENDIENTE

Notas origen: **#3, #5**

**Overlap:** F70 (benchmark tests) está **archivada** (revisión 2026-09-22, review APROBADO) y F71 (estándares de fuerza) sigue **POR REVISAR**. El label y el gauge **no están hardcoded**: ambos llaman a `getStrengthLevel`, pero las marcas del chart están con `justify-between` (no alinean con los umbrales) — hay que investigar si por eso dice principiante en el label e intermedio en el chart.

- [ ] **104.1 — Al seleccionar las barras de los chart tiene un color de fondo un poco molesto**: rediseño, cambio de color de la barra o destacarla con el borde o cambio ligero de color, pero definitivamente quitar el color de fondo cuando se selecciona.
- [ ] **104.2 — En test de fuerza, investigar si funciona bien la UX**: me dice principiante en el label pero en el chart aparece que soy intermedio; no se si está hardcoded o funciona mal de dónde salen los datos/cálculos.

### Fase 105 — Compartir sesión (UX y botones rotos) — PENDIENTE

Notas origen: **#6, #7**

**Overlap:** F75 (exportar sesión como imagen) + F95.2 (foto shareable en resumen y `WorkoutDetail`). Existe `SessionImageExport` con Share nativo + fallback download. **No verificado** en perfil/historial ni que la UX no se salga del plano. F75 quedó archivada; la prueba en teléfono físico sigue encolada en F93 #15.

- [ ] **105.1 — No aparece para compartir la sesión en redes, y la UX sale del plano**.
- [ ] **105.2 — Botón de compartir y más no funcionan en perfil/historial**.

### Fase 108 — Pasos: permiso al inicio y segundo plano — PENDIENTE

Notas origen: **#14**

**Overlap:** F84a–c/f implementadas. `useHealthSync` pide permiso **just-in-time al entrar a `/pasos`**, no al iniciar la app. 84d widget sigue bloqueado.

- [ ] **108.1 — Los pasos no funcionan, no tienen permisos**: el permiso debe pedirse al iniciar la app, una sola vez, en lugar de cuando entres a su página; la idea es que funcione en segundo plano consumiendo poca batería; si cada vez que quieres registrarlo tenés que entrar a su apartado es tedioso y el usuario se dejará de hacerlo.

### Fase 109 — Medallas unificadas y catálogo — PENDIENTE

Notas origen: **#12, #13**

**Overlap:** F78 logros extendidos, F84f 8 logros de pasos (galería **aparte** `StepAchievementsGallery`), F68 retos + `primer-reto`, F95 chapas. Los de pasos **no** usan `AchievementMedal`; por eso el apartado parece dividido en dos tipos.

- [ ] **109.1 — Los logros que aparecen de los pasos se deben convertir en medallas**: ahora ese apartado parece dividido en dos tipos de logros cuando realmente deben ser iguales.
- [ ] **109.2 — Ampliar catálogo de medallas/retos**.

### Fase 110 — Logger de desarrollo — PENDIENTE

Notas origen: **#16**

**Overlap:** hay telemetría Sentry/PostHog (F93 #27 / F100) con consentimiento, **orientada a producto**, no un logger de desarrollo. `console.error` puntual en `stepsSync`. No hay logger de app a nivel de desarrollo.

- [ ] **110.1 — Poner un logger en la app para ayudar a depurar si es posible, a nivel de desarrollo, no a nivel de usuario**.

### Fase 111 — Verificar notificaciones — PENDIENTE

Notas origen: **#17**

**Overlap:** F53 (push, cerrada) + F96.3 (alerta nativa de descanso; **entrega en background no verificada** en dispositivo real). Hay `NotificationsSection` en Ajustes.

- [ ] **111.1 — Comprobar que la app manda notificaciones**.

### Fase 112 — Reset de fábrica y borrado parcial — PENDIENTE

Notas origen: **#19, #20**

**Overlap:** F27 backup (export/import en `DataSection`) **sí existe**. F98.6 borra **una sesión** desde `WorkoutDetail` (con confirmación y recálculo de PRs). **No hay** reset de fábrica. El borrado parcial de “días de entreno” (p. ej. desde calendario / varios de golpe) no está cubierto por 98.6.

- [ ] **112.1 — Colocar un botón de reset de datos en la app en ajustes** para poder ponerlo como de fábrica; debe tener confirmación y debe sugerir hacer un backup antes de realizar.
- [ ] **112.2 — Poder borrar data parcialmente** al poder borrar días de entrenos para no tener que hacer reset global, así si hemos metido datos de prueba o por equivocación se puede corregir.

### Fase 113 — Sesión activa: ejercicios en carrusel horizontal — PENDIENTE

Notas origen: **nueva nota (2026-09-21)**

**Idea (del usuario):** en la página de rutina cuando la estoy haciendo, en lugar de guardar los ejercicios uno debajo de otro y el timer quede arriba, quiero que el apartado de ejercicio sea un **scroll/carrusel horizontal** donde estará el ejercicio y la sugerencia adaptativa; arriba estará el timer y debajo los botones que ya hay (añadir ejercicio, finalizar, etc.).

**Overlap:** F34c (superseries: hoy `SessionGroupList` apila los ejercicios verticalmente por superset y hace `scrollIntoView` al siguiente grupo incompleto — el carrusel reemplaza ese layout y su auto-desplazamiento). F98.5 (`SetRow` en dos líneas “sin `HScroll` ni scroll horizontal” para caber a 375 px — es la fila de serie individual, no el layout de ejercicios; cada slide conserva esa fila). F97/F98.2 (sugerencia adaptativa `AdaptiveSuggestions`/`getAdaptiveSuggestions` ya vive **dentro** de cada `ExerciseBlock` — en el carrusel viaja con su ejercicio en el mismo slide). Reutilizables ya existentes: `HScroll` (drag-to-scroll con ratón/dedo), `SwipeRow` (fade gradient + `ResizeObserver`) y `useDragToScroll`. ⚠️ El e2e `tests/e2e/test_f93_t22_quick.py` comprueba **“sin scroll horizontal en la sesión activa”** — habrá que actualizarlo cuando el carrusel exista.

- [ ] **113.1 — Apartado de ejercicio como scroll/carrusel horizontal**: timer arriba, carrusel de ejercicios (cada slide = ejercicio + sugerencia adaptativa) en el medio, y debajo los botones que ya hay (añadir ejercicio, finalizar, etc.).

---

## Fases 114–117 — Deuda declarada del pulido de F66/F67 (sesión 2026-09-26)

> Al cerrar el diseño del pulido (`docs/superpowers/specs/2026-09-26-f66-f67-pulido-design.md`, commit `87a4f9c`) se declararon límites explícitos. Para que no se pierdan ni se cuelen como trabajo suelto, quedan acá como fases propias: cada una necesita su diseño (brainstorming → spec) cuando se tome. Los límites que ya estaban cubiertos quedaron anotados en su fase de origen (F88: i18n del seed; F97: recomendación de pesos).

### Fase 114 — Re-autoría del contenido de las rutinas predefinidas — PENDIENTE

**Objetivo**: rediseñar el **contenido** de las rutinas del seed más allá de mover ítems: alinear día↔nombre cuando el nombre promete algo que el día no cumple (p. ej. r26 «Full Body 3 días» que no es full-body por día), rebalancear los días que el pulido dejó grandes o flacos (r43/r64) y elegir mejores ejercicios por patrón. Incluye decidir qué hacer con la cobertura de la matriz objetivo×nivel×días (hoy 30/75 con días exactos).

**Overlap:** el pulido de F66/F67 solo **mueve** ítems entre días (Anexo A de su spec) y elimina copias exactas: no agrega/quita contenido, no cambia series/reps/descanso ni renombra días. F88 clona predefinidas para editarlas, no las reescribe. Esta fase es curación de contenido, con su propio criterio y review.

- [ ] **114.1 — Criterio de calidad de programa** (bloques coherentes, balance de días, progresión) + medición del estado actual.
- [ ] **114.2 — Re-balanceo de las rutinas tocadas por el pulido** (días de 2 ítems / días de 9-13 ítems) sin perder la identidad de cada rutina.
- [ ] **114.3 — (Decisión) Cobertura de la matriz 30/75**: ¿autoría de rutinas nuevas o se acepta el gap?

### Fase 115 — Equipamiento v2: re-clasificar `otro` y ampliar la taxonomía — PENDIENTE

**Objetivo**: dejar de perder señal de equipamiento. `EQUIPMENT_OPTIONS` tiene 9 valores y ~237 ejercicios (29%, medido el 2026-09-16) están taggeados `otro` (estiramientos, movilidad, máquinas raras); fitball / pelota medicinal / rodillo no existen como valores.

**Overlap:** el pulido de F66/F67 excluyó explícitamente reclasificar `otro` y ampliar el enum (WP0 solo agregó `banco`). Consumidores a tocar: chips de `EquipmentFilter`, `filterExercises` (regla de subconjunto), i18n es/en y seed (reclasificación + `SEED_VERSION`).

- [ ] **115.1 — Medir de nuevo `otro`** y decidir los valores nuevos del enum con criterio de uso real (sin taxonomía infinita).
- [ ] **115.2 — Reclasificar los ejercicios afectados** + consumidores + migración/re-siembra.
- [ ] **115.3 — Test de cobertura** que fije que no quedan ejercicios sin clasificación real donde aplique.

### Fase 116 — Sustitución automática de ejercicios por equipamiento faltante — PENDIENTE

**Objetivo**: cuando el equipamiento declarado no cubre un grupo, hoy el generador **omite y reporta** (`coverage.omittedGroups`). Decidir e implementar si se ofrece una **sustitución** por un ejercicio equivalente disponible (mismo grupo muscular/subzona, categoría strength, equipamiento ⊆ disponible) en vez de omitir — y con qué UX (automática o sugerida en el plan).

**Overlap:** declarado fuera de alcance desde la spec original de F66/F67 y repetido en la del pulido. Toca `src/domain/routineResolution.ts` (contratos de `RoutinePlan`/cobertura) y las superficies del plan (planificador + resumen del onboarding).

- [ ] **116.1 — Decisión de producto**: automática vs sugerida; qué se reporta al usuario.
- [ ] **116.2 — Contrato de dominio + tests**: sustituto determinista, mismo grupo, sin repetir en el día.
- [ ] **116.3 — UI + e2e.**

### Fase 117 — Rediseño de flujo del planificador y onboarding (más allá de lo visual) — PENDIENTE

**Objetivo**: repensar la **estructura** del wizard del planificador y del resumen del onboarding — menos pasos, todo en una pantalla, otra secuencia de decisión — no solo su piel.

**Overlap:** el pulido de F66/F67 es **solo visual** (dirección A: cards de día, pill de duración, encabezado con músculos) y mantiene el flujo de 3 pasos. Esta fase cambia la estructura y necesita su propio diseño (con mockups en el navegador) y e2e del flujo nuevo.

- [ ] **117.1 — Diseño del flujo** (brainstorming + mockups).
- [ ] **117.2 — Implementación + e2e.**

---

## Verificación

| Check | Método |
|-------|--------|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Types | `npx tsc --noEmit` |
| Streak/calendario | fechas locales correctas |
| Media | offline en public/exercises |
| Mobile | 375×812 |

---

## Skills

`.opencode/skills/`: frontend-design, ui-ux-pro-max, site-architecture, software-architecture, accessibility, seo, webapp-testing.

Skills remota (*installed on demand*): **`mobile-app-ui-design`** (https://github.com/ceorkm/mobile-app-ui-design) — metodología de UI/UX móvil (paleta 60/30/10, grid 8-pt, sombras tintadas, Peak-End, Trojano Horse/Vanity Mirror/Comfort Trap). Referenciada desde la Fase 31.