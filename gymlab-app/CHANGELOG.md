# Changelog — GymLab App

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
El versionado sigue [SemVer](https://semver.org/lang/es/) cuando haya releases formales.

---

## [Unreleased]

### Added
- **Historial de sesión con detalle (`F32b`)**: nueva vista de solo lectura en `/entrenamiento/:id` (`WorkoutDetail` + wrapper `SesionPage`) con fecha, duración, volumen, series completadas, notas y desglose por ejercicio (serie, peso × reps, RPE, calentamiento). Las filas de historial en Home (`EntrenarPage`) y Perfil ahora enlazan al detalle. Empty state si la sesión no existe.

### Changed
- **Unidades kg/lb en toda la UI (`F32a`)**: la sesión de entrenamiento (`SetRow` input con placeholder y `aria-label` en la unidad elegida, guardando siempre kg), PRs y e1RM (`ExerciseBlock`, `PerfilPage`), volúmenes de resumen/sesión/home/perfil, tooltip del `VolumeChart`, y chips de discos en `PlateCalculatorModal` ahora muestran la unidad activa (`formatUnits`/`applyUnits`/`formatWeight`/`parseWeightToKg`). Se elimina la importación duplicada en `EntrenarPage`.

### Added
- **Licencia propietaria**: `LICENSE` en la raíz del repo con **All Rights Reserved** (source-available, no open source); `"license": "UNLICENSED"` en `package.json`, sección de licencia en README raíz y de la app. El material de terceros (free-exercise-db Unlicense, paquetes npm) conserva sus propios términos.
- **Auditoría de skills** (`F29-cierre`): skip link “Saltar al contenido” en `AppShell`, `document.title` dinámico por página en `AppHeader` (“{Página} · GymLab”), y revisión de arquitectura/SEO/site según las skills del repo (sin páginas huérfanas; `lang="es"`, meta y manifest ya presentes).
- **Dummy muscular en ficha** (`F29`): `MuscleDummy` acepta `highlight` y resalta el músculo trabajado en rojo (`danger`) en `/ejercicios/:slug`.
- **a11y (`F29`)**: `:focus-visible` global con anillo CTA, `aria-label` en búsqueda/campos de calculadora, `aria-pressed` en chips.
- **Calculadoras nuevas (`F29`)**: **1RM** (Brzycki + Epley), **Agua diaria** (35 ml/kg + recarga) y **Conversor lb ↔ kg**, con domain puro en `src/domain/calculators/{oneRepMax,water,converter}.ts`, páginas y rutas `/calculadoras/{1rm,agua,conversor}`; hub actualizado.
- **Catálogo JSON versionado** (`F28`): los 821 ejercicios extra ahora se publican en `public/catalog/exercises-v1.json` y se cargan con fallback al seed embebido (`src/data/catalogLoader.ts`). Corregidos ~100 nombres auto-ES absurdos vía `src/data/seed/translations.ts` (override por slug, conserva el inglés técnico). `SEED_VERSION` → `7`.
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
- **Rutinas predefinidas sin duplicados** (`F31-seed`): eliminadas `Upper/Lower 4 días` (id 2) y `Full Body 3x` (id 3) — réplicas en inglés de `Torso/Pierna 4 días` y `Full Body 3 días` — junto con sus días e ítems en el seed (`src/data/seed/routines.ts`). Quedan 10 rutinas únicas; sin nombres repetidos ni traducciones del mismo programa. `SEED_VERSION` → `8`.
- **Resumen de entreno rediseñado (Peak-End)**: aplicada la skill `mobile-app-ui-design` a la pantalla de finalizar sesión. Hero celebratorio con glow + icono Trophy/Flame según PRs/racha, headline y copy de refuerzo dinámicos, grid de 4 stat cards (Volumen, Series, Duración, PRs/Racha con resaltado CTA), CTA primario “Volver al inicio” + secundario “Ver mi progreso”, y microcopy de cierre. Regla Peak-End de Kahneman: el momento cumbre y el cierre de la sesión ahora se sienten premiados.
- **Empty states según la skill `mobile-app-ui-design`** (`F31b`): `MonthCalendar` muestra un estado vacío con icono, copy motivacional y CTA “Empezar ahora” cuando el mes no tiene entrenos (variante “Este mes no hay entrenos” si ya hay historial); la ficha de ejercicio (`/ejercicios/:slug`) añade la tarjeta “Mi mejor marca” con peso × reps, fecha y 1RM estimado (regla Vanity Mirror), o un empty state “Sin historial todavía” con CTA a iniciar entreno; el placeholder de `ExerciseMedia` usa ahora un monograma con la inicial del ejercicio en un frame estable `4/3`.

### Fixed
- **Overflow horizontal en Ajustes a 320px** (`F31b`): las filas condicionales “Series a precargar / Ajuste de peso / Porcentajes (%)” con `select`/`number` ahora usan `flex-wrap`, evitando que select + input se salgan de la tarjeta en pantallas estrechas.

### Fixed
- **Guardado de entrenos roto (`DataError`)** (`F28-bug`): `workouts` y `workoutSets` declaran `id` sin `++` en el esquema Dexie, así que `db.workouts.add(...)` sin `id` lanzaba `DataError` y “Finalizar entreno” acababa en la pantalla vacía sin guardar nada (por eso Perfil no actualizaba racha/volumen/PRs). `create()` ahora genera el `id` manualmente (`orderBy('id').last() + 1`, mismo patrón que `bodyWeightRepo`) sin tocar la primary key, evitando `UpgradeError` en bases existentes. Flujo sesión → resumen → home/Perfil verificado reactivo vía `useLiveQuery`.
- **Knob de los toggles de Ajustes centrado**: el círculo del `role="switch"` se re-posiciona con `left-1` + `translate-x-6` y píldora `h-8 w-14`, quedando con margen simétrico (4px) en ambos estados y centrado verticalmente.
- **Reseed con home en blanco** (`F28-bug`): el fetch del catálogo (`loadCatalog()`) se ejecutaba dentro de `db.transaction(...)` en `providers.tsx`, provocando `Transaction committed too early` y “Error de carga” hasta borrar datos. Ahora el catálogo se carga antes de abrir la transacción.
- **Nombre de ejercicio no enlazado en detalle de rutina**: cada ítem de día en `RutinaDetailPage` ahora resuelve el `slug` y enlaza a `/ejercicios/:slug` (hover subrayado, `truncate`).
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
