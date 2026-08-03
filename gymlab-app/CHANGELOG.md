# Changelog — GymLab App

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
El versionado sigue [SemVer](https://semver.org/lang/es/) cuando haya releases formales.

---

## [Unreleased]

### Added
- **Mini-calendario en Entrenar**: componente compartido `MonthCalendar` (mes actual compacto bajo la racha con días hechos/programados) y link “Ver completo” a `/calendario`; `CalendarioPage` reutiliza el mismo componente.
- **Modo noche/día**: tema dual `data-theme="night|day"` (negro o blanco + dorado), token `--color-on-gold`, hook `useTheme` con persistencia `localStorage` + `meta.theme`, anti-flash en `index.html` y página **Ajustes** (`/ajustes`) con toggle desde Más.
- **Rutinas custom**: builder en `/rutinas/nueva` y edición en `/rutinas/:slug/editar` (solo propias), CRUD (`createRoutine`/`updateRoutine`/`deleteRoutine`) con cascada days+items e ids ≥ 10000, secciones **Mis rutinas / Predefinidas** con badge “Propia” en Rutinas, y acciones Editar/Eliminar en el detalle de rutinas propias. El reseed preserva las rutinas custom.

### Added (legacy)
- Biblioteca de contenido offline en `content/training-library/` (referencia para seeds/guías).
- **Dexie v2**: `guides`, `activeProgram`, `meta` (seed versionado), tablas social stub (`socialProfiles`, `posts`, `postMedia`).
- Domain: fechas locales, calendario, progreso de sesión/programa, fatiga muscular, payload social.
- Seeds ampliados: 52 ejercicios, 12 rutinas, 6 guías.
- UI **ProgressRing** (sesión + programa en home).
- **Calendario** (`/calendario`): días hechos vs programados.
- **Cuerpo** (`/cuerpo`): dummy muscular + fatiga por grupo.
- **Guías** (`/guias`): nutrición, macros, recuperación.
- Detalle rutina: Play con ETA, precarga series, “Seguir rutina” (ActiveProgram).
- Sesión: finalizar ejercicio, anillo de progreso, `localDate` al guardar.
- **ExerciseMedia** + SVG placeholders por grupo muscular.
- Imágenes reales de ejercicios (2 frames por ejercicio) desde **free-exercise-db** (Unlicense/dominio público) en `public/exercises/{slug}/`, con atribución en README y en Más. `SEED_VERSION` → `4` para re-sembrar con las nuevas `imageUrls`.
- **Catálogo completo de free-exercise-db**: 821 ejercicios extra (873 total) con 2 fotos reales cada uno (1.746 JPG en total) en `src/data/seed/exercisesCatalog.ts` (`seedExercisesExtra`, ids 1000+). Nombres en español híbrido generados con `build-catalog.cjs` (traducción automática fiable; los complejos/técnicos se mantienen en inglés). `SEED_VERSION` → `5`.
- Logo cabecera más grande (`size-12`).
- Scaffold **Vite + React + TypeScript** en `gymlab-app/`.
- **PLAN.md** — plan de fases (stack, arquitectura, site map, calculadoras, Capacitor).
- **AGENTS.md** — reglas para agentes (capas, stack, convenciones, rutas, obligación de actualizar changelog).
- **CHANGELOG.md** — este archivo.
- Dependencias: `react-router-dom`, `dexie`, `dexie-react-hooks`, `zustand`, `recharts`, `lucide-react`, Tailwind v4 (`@tailwindcss/vite`), `vite-plugin-pwa`.
- Tema oscuro GymLab (tokens CSS + Barlow / Barlow Condensed).
- **AppShell** + **TabBar** mobile-first: Entrenar · Rutinas · Papers · Más.
- Rutas base: `/`, `/entrenamiento/:id`, `/rutinas`, `/papers`, `/mas`, `/perfil`, `/calculadoras`, `/calculadoras/:calcId`, `/ejercicios`.
- Páginas placeholder con UI de marca para cada sección.
- Hub **Calculadoras** (IMC y TDEE listados; roadmap 1RM, macros, agua, % grasa, conversor).
- PWA mínima (manifest + service worker autoUpdate).
- Alias `@` → `src/` en Vite.
- Repositorio Git en la raíz del monorepo, remoto `origin` → https://github.com/Yvesdefaria/GymLab.git (`main`).
- **Fase 2 completada:** Domain + Data layer.
  - Tipos TypeScript: Exercise, Routine, Workout, WorkoutSet, Paper, Profile, PRRecord.
  - Domain: `calcSetVolume`, `estimate1RM`, `detectPRsFromSets`, `calcStreak`.
  - Calculadoras domain: IMC (OMS) y TDEE (Mifflin-St Jeor).
  - Dexie schema v1: exercises, routines, routineDays, routineItems, workouts, workoutSets, papers, profile, prs.
  - Repositories interfaces + Dexie implementations (exercise, routine, workout, workoutSet, paper, profile, pr).
  - Seed data: 40+ ejercicios, 8 rutinas (PPL, Upper/Lower, Full-Body, 5×5, Bro Split, Starting Strength, Torso/Pierna), 6 papers con DOI reales.
  - Providers con auto-seed al primer arranque.

### Changed
- N/A (proyecto nuevo).

### Fixed
- Racha y stats del home con fechas **locales** (evita desfase UTC).
- Tipado de `end` en `TabBar` (union `as const` con React Router).
- Warning Vite: `__dirname` sustituido por `import.meta.url`.
- Tipado de repositorios Dexie (`PromiseExtended` → `Promise<unknown>`).
- Alias `@/` en tsconfig (paths sin baseUrl en TS 6).

### Added (Fase 3 — Entrenar)
- **activeWorkoutStore** (Zustand + persist): sesión activa con exercises, sets, rest timer.
- **SetRow**: input peso/reps, checkbox completada, detección PR, borrar serie.
- **RestTimer**: barras de progreso, presets 30s–3m, play/pause/reset.
- **ExerciseBlock**: agrupa sets por ejercicio, PR badge, añadir/eliminar serie.
- **ExercisePicker**: modal con búsqueda + filtro por grupo muscular.
- **EntrenarPage**: botón iniciar/continuar, racha, volumen semanal, historial reciente.
- **EntrenamientoPage**: stats en vivo, finish → guarda en Dexie + actualiza PRs.
- Hooks: `useWorkouts`, `usePRs`, `useStreak` (dexie-react-hooks).

### Added (Fase 4 — Rutinas)
- **RutinasPage**: catálogo con filtros por objetivo (volumen/definición/fuerza/resistencia/general) y nivel (principiante/intermedio/avanzado).
- **RutinaDetailPage**: descripción, selector de días, lista de ejercicios con series/reps/descanso, botón "Iniciar entrenamiento" que precarga la rutina en el store.

### Added (Fase 5 — Papers)
- **PapersPage**: lista de papers con filtro por tema (hipertrofia, nutrición, entrenamiento, recuperación), links PubMed externos.
- **PaperDetailPage**: resumen, puntos clave, DOI, enlace a fuente oficial, disclaimer informativo.

### Added (Fase 6 — Perfil + Calculadoras)
- **PerfilPage**: tarjeta de usuario, estadísticas (racha, volumen semanal, total, PRs), gráfico de volumen semanal (Recharts AreaChart), historial reciente, lista de PRs.
- **VolumeChart**: gráfico de área con volumen por semana (Recharts).
- **ImcPage**: calculadora IMC con escala visual OMS, categorías coloreadas.
- **CaloriasPage**: calculadora TDEE (Mifflin-St Jeor) con selects de actividad, resultados déficit/superávit.

### Added (Fase 7 — Polish + Biblioteca)
- **EjerciciosPage**: biblioteca de 40+ ejercicios con búsqueda y filtro por grupo muscular.
- **EjercicioDetailPage**: ficha con técnica e información del ejercicio.
- HTML lang="es", meta theme-color, viewport-fit=cover para PWA nativa.

### Changed (Rediseño dorado)
- Paleta alineada con la guía real del prototipo (extraída de `GymLab/css/*`): CTA naranja `#F97316` sustituido por dorado `#D9B384`; acentos `#D9B384` / `#FDDDB4`; bordes y grises con tono cálido.
- Fuente display cambiada a **Oswald** (la del prototipo); body Barlow.
- Logo del prototipo añadido en `public/logo.jpg` y mostrado en los headers principales (Entrenar, Rutinas, Papers, Perfil) vía `AppHeader showLogo`.
- Botones CTA principales ahora usan gradiente dorado (`gold-gradient`) con sombra (Entrenar, RutinaDetail, Entrenamiento, RestTimer).
- TabBar activo con texto degradado dorado (`gold-text`).
- `theme_color` (meta + manifest) → `#D9B384`.
- `VolumeChart`, IMC "sobrepeso" y tokens → `#D9B384` (sin naranja en todo el app).

### Changed (Rediseño tarjetas, filtros y UX)
- **Tarjetas** de todas las páginas (Entrenar, Rutinas, Papers, Ejercicios, Perfil, Calculadoras, Más, detalle de sesión) con borde dorado `border-gold/40` y hover `hover:border-gold/80`, estilo del prototipo (botones oscuros `#242422` + borde `#D9B384`).
- **Chips/filtros seleccionados**: sustituido relleno `bg-cta` por borde dorado `border-cta` + tinte `bg-cta/20` + texto `text-accent-soft` (visible sobre fondo oscuro); hover dorado en no seleccionados.
- **TabBar**: icono activo con `text-cta` sólido (antes `gold-text` ocultaba el icono SVG por `color: transparent` → se veía negro); el degradado dorado queda solo en la etiqueta.
- **Entrenar**: botón "Iniciar entrenamiento" ahora navega a `/entrenamiento/active` tras `startWorkout()` (antes solo reseteaba estado, no funcionaba); CTA movido a barra fija justo encima del TabBar para acceso con el pulgar.
- **RutinaDetailPage**: "Iniciar entrenamiento" navega a la sesión; detección de entreno en curso por `startedAt` (antes por ejercicios cargados, fallaba al iniciar con lista vacía).
- Hovers de botones secundarios (añadir serie, añadir ejercicio, descanso) a dorado.

### Changed (Cabecera unificada)
- **AppHeader**: altura y posición idénticas en todas las páginas. Ahora siempre muestra la fila del logo (antes solo en Entrenar/Rutinas/Papers/Perfil) y reserva altura fija para título + subtítulo (`min-h-[3.5rem]`), con `truncate` para títulos largos. Eliminado el prop `showLogo`.
- **Desplazamiento lateral fijo**: `scrollbar-gutter: stable` en `index.css` para que la barra de scroll vertical no empuje el contenido centrado hacia la izquierda al navegar entre páginas con distinta altura (p.ej. Entrenar/Más sin scroll frente a Rutinas/Papers con scroll).

---

## Cómo actualizar

Al cerrar una fase o feature:

1. Añadir entradas bajo `[Unreleased]` (`Added` / `Changed` / `Fixed` / `Removed`).
2. Al hacer release: renombrar a `## [x.y.z] - YYYY-MM-DD` y dejar `[Unreleased]` vacío.
3. Marcar checkboxes correspondientes en `PLAN.md`.
