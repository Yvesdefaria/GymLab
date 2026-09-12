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

### [x] Fase 63 — Sugerencias inteligentes en sesión (PENDIENTE menor)
- [x] `domain/sessionSuggestions.ts`: analizar series completadas, peso, RPE, tiempo
- [x] `SessionSuggestions.tsx`: overlay contextual al final de cada serie, dismissable
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit
- [ ] **Pendiente**: ampliar sugerencias — auto-apply al peso siguiente, persistir entre sesiones, sugerir calentamiento si peso alto

### [x] Fase 65 — Templates de sesión rápida (⚠️ REVISIÓN NECESARIA)
> **Nota del plan original:** Crear/editar/eliminar templates custom requiere rediseño. El formulario modal no funcionaba en PWA y un prompt simple no es útil sin poder configurar ejercicios. La funcionalidad de crear templates se ha removido de la UX por ahora. Persistencia Dexie creada pero sin uso hasta que se resuelva el flujo de creación.
- [x] Seeds de categorías + 6 rutinas de estiramientos/movilidad
- [x] `QuickTemplates.tsx` + flujo guiado con temporizador + marcar en calendario
- [x] Botón "Empezar rápido" en Home
- [ ] Crear/editar/eliminar templates custom ← **REVISAR: ver nota arriba**
- [ ] Guardar en Dexie: `workoutTemplates` table ← **Creado (v11) pero sin uso activo**
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

### [x] Fase 66 — Selector por equipamiento (PENDIENTE)
- [x] `EquipmentFilter.tsx`: chips con iconos de equipo, persiste en localStorage
- [ ] Filtrar catálogo de ejercicios según equipamiento seleccionado
- [ ] Integrar en `EjerciciosPage` y `WorkoutPage`
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

### [x] Fase 67 — Planificador por objetivo + equipamiento (PENDIENTE)
- [x] `RoutinePlanner.tsx`: wizard de 3 pasos (nivel/objetivo/equipamiento)
- [x] Algoritmo de volumen óptimo + output rutina semanal
- [ ] Guardar como template (conectar con fase 65)
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

### [x] Fase 68 — Retos dinámicos adaptativos (PENDIENTE)
- [x] `domain/challenges.ts` (frecuencia, volumen, PR, consistencia; duración configurable)
- [x] `DynamicChallenges.tsx` + barra de progreso con animación
- [ ] Recompensa: badge/logro al completar
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

### [x] Fase 69 — Comparación de sesiones (PENDIENTE)
- [x] `SessionComparison.tsx` + vista lado a lado + deltas
- [x] Integrado en historial
- [ ] Añadir más métricas comparables: ejercicios totales, series totales, reps totales, PRs logrados, ejercicios nuevos, calorías (si disponible), grupos musculares trabajados, intensidad media (peso/promedio reps)
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

### Fase 70 — Benchmark tests (POR REVISAR)
- [x] Tests 1RM estimado en sentadilla, banca, peso muerto + tabla Dexie `benchmarkResults`
- [x] `BenchmarkTests.tsx` + gráfico de evolución + recordatorio periódico
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

### Fase 71 — Estándares de fuerza (percentiles) (POR REVISAR)
- [x] `domain/strengthStandards.ts` + datos reales powerlifting (IPF, USAPL)
- [x] `StrengthGauge.tsx` + percentil por peso/sexo/edad
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

### [x] Fase 72 — Periodización visual (PENDIENTE)
- [x] `domain/periodization.ts` + `PeriodizationView.tsx` con drag & drop
- [x] Auto-sugerir mesociclos (`autoPeriodization.ts`)
- [ ] Conectar con SmartRoutines para auto-sugerir mesociclos
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

### [x] Fase 73 — Frecuencia muscular vs objetivo (PENDIENTE UX)
- [x] `domain/muscleFrequency.ts` + sección con barras + alerta >20%
- [ ] **Revisión UX**: tamaños de fuente, barras y espaciado agrandados (text-[0.6rem]→text-sm, h-1.5→h-2.5, px-3→px-4). Pendiente validar en dispositivo real.
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

### [x] Fase 75 — Exportar sesión como imagen (PENDIENTE móvil real)
- [x] Canvas + botón "Compartir" + descarga/Web Share
- [x] Tests unitarios + i18n canvas + revisión UX mobile + rediseño 1080×1080 + E2E 390×844
- [ ] **Probar en teléfono real**: verificar captura de fotos, resize, timeline, comparador, eliminación en dispositivo físico

### Fase 76 — Nutrición (POR REVISAR)
- [x] Domain `nutrition.ts` + tabla `mealEntries` + `MealRepository` + `useMeals`
- [x] `/nutricion`: resumen diario, formulario, historial, integración TDEE
- [x] Revisión UX mobile verificada Playwright 390×844
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

### Fase 78 — Logros extendidos (POR REVISAR)
- [x] +15 logros (cardio, volumen, rachas, metas) + `/logros` + chapas en perfil
- [x] Route wrapper + link en Más + mobile-app-ui
- [x] i18n es/en + verificación + CHANGELOG + commit

### [x] Fase 79 — Fotos de progreso (PENDIENTE móvil real)
- [x] Domain/types + tabla `progressPhotos` + repo + hook `useProgressPhotos`
- [x] `/progreso-fotos`: captura por ángulo, resize 800px, comparador, eliminación
- [x] Link en Más + i18n + Playwright 375×812 + 768×1024
- [ ] **Probar en teléfono real**: verificar captura de fotos, resize, timeline, comparador, eliminación en dispositivo físico

### Fase 80 — Smart Routines (rutinas adaptativas) (POR REVISAR)
- [x] `domain/adaptiveRoutine.ts` + toggle "Adaptativa" + sugerir pesos al iniciar día
- [x] `AdaptiveSuggestions` en la sesión activa + conexión con PeriodizationView
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

### [x] Fase 88 — Rutinas Predefinidas ✅

Las 68 rutinas predefinidas del catálogo (F80) existen como datos pero **no eran editables ni personalizables por el usuario** — desde F88 cualquier predefinida se puede clonar como rutina propia.

- [x] **88.1 — UI de edición de rutina predefinida**: botón "Editar esta rutina" en detalle → clonar como rutina custom y abrir el editor
- [x] **88.2 — Editor de días**: añadir/quitar/reordenar días con nombre y ejercicios
- [x] **88.3 — Editor de ejercicios dentro del día**: drag-and-drop reordenar, "+" selector de ejercicios, "×" quitar
- [x] **88.4 — Guardar como "mi rutina"**: se guarda como custom con nombre editable; la predefinida original queda intacta
- [x] **88.5 — Diferenciar visualmente**: badge "Basada en …" en Mis rutinas
- [x] **88.6 — Persistencia**: clonar en `routines` + `routineDays` + `routineItems` (mismo esquema, sin tablas nuevas)
- [x] **88.7 — Tests**: dominio de clonación + UI del flujo completo

### Fase 90 — Tooltips de ayuda contextuales

- [ ] **90.1 — Componente `Tooltip` reutilizable**: dismissable, tap para abrir/cerrar en mobile
- [ ] **90.2 — Tooltips en estadísticas**: qué mide cada gráfico, cómo se calcula, qué es un PR
- [ ] **90.3 — Tooltips en Recovery Score**: explicación del score y rangos (0-30/31-60/61-100)
- [ ] **90.4 — Tooltips en Deload**: qué es, por qué se activa, qué hacer
- [ ] **90.5 — Persistir "ya visto"**: en `meta`, reactivable desde Ajustes

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

#### [ ] #15 — Cámara en móvil real + foto shareable (duplicado F79/F75)
- [ ] Probar la captura de fotos en **móvil real** (pendiente del checklist de F79) y reportar resultados.
- [ ] (Nuevo) Foto shareable de progreso: exportar/compartir la foto de progreso (patrón `SessionImageExport` F75).
- [ ] Verificación + CHANGELOG + commit.

#### [ ] #21 — Wearables y contador de pasos (duplicado F84/F84a–f)
- [ ] Ejecutar las fases ya planificadas: **F84a** ✅, **F84b** ✅, **F84c** ✅, **F84d** ⛔ (widget, bloqueado), **F84e** ✅, **F84f** ✅ — ver sus checkboxes arriba.

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