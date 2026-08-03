# Changelog — GymLab App

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
El versionado sigue [SemVer](https://semver.org/lang/es/) cuando haya releases formales.

---

## [Unreleased]

### Added
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

---

## Cómo actualizar

Al cerrar una fase o feature:

1. Añadir entradas bajo `[Unreleased]` (`Added` / `Changed` / `Fixed` / `Removed`).
2. Al hacer release: renombrar a `## [x.y.z] - YYYY-MM-DD` y dejar `[Unreleased]` vacío.
3. Marcar checkboxes correspondientes en `PLAN.md`.
