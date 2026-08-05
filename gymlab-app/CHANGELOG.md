# Changelog — GymLab App

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
El versionado sigue [SemVer](https://semver.org/lang/es/) cuando haya releases formales.

---

## [Unreleased]

### Changed
- **Rendimiento de carga (`optimize`)**: code-splitting por ruta con `React.lazy` + `Suspense` en `src/app/router.tsx` (las 27 páginas se cargan bajo demanda; fallback `Loader` con estado `role="status"` en `AppShell` mantiene la TabBar visible). Vendor chunks vía `codeSplitting.groups` en `vite.config.ts`: `vendor-react`, `vendor-router`, `vendor-dexie`, `vendor-charts` (Recharts, solo en Perfil/Detalle ejercicio/Peso corporal) y `vendor-icons`. El chunk inicial pasa de 1201 kB → 350 kB (302 kB → 53 kB gzip) y desaparece el aviso de >500 kB; cada vendor se precachea y cachea por separado en la PWA.

### Fixed
- **Gráfico de volumen semanal en Perfil**: la condición para mostrar el gráfico exigía al menos 2 *semanas* distintas con datos (`data.length >= 2`), así que con varias sesiones dentro de la misma semana mostraba "Necesitas al menos 2 sesiones" y no dibujaba nada. Ahora se evalúa el número de sesiones (`workouts.length >= 2`) y el `Area` renderiza el punto único con `dot`/`activeDot` cuando solo hay una semana registrada.
- **Onboarding y ajustes entre reseeds**: el reseed (`providers.tsx`) limpiaba toda la tabla `meta`, con lo que `onboardingDone` y `settings` se perdían en cada cambio de `SEED_VERSION` y el wizard de primera visita reaparecía al usuario. Ahora se preservan las filas de `meta` existentes y solo se sobreescribe `seedVersion`.

### Added
- **Insights de progreso (`F37`)**: tarjeta `InsightCard` que compara el volumen de esta semana vs la anterior usando `computeWeeklyVolumeInsight` en `src/domain/insights.ts` (puro, agrupa por semana calendario como `VolumeChart`, umbrales +5% alza / −10% descenso, sin baseline → neutral). Tres variantes de tono: positiva (volumen al alza), alerta (volumen en descenso) y neutra (estable / punto de partida). Montada en Home bajo la tarjeta "Volumen sem." y en Perfil junto al gráfico de volumen. Se muestra solo con ≥2 sesiones y datos en alguna de las dos semanas.
- **Asistente de carga inteligente (`F36`)**: botón "Sugerido: X kg" en cada `ExerciseBlock` de la sesión que propone el peso de la siguiente serie incompleta y, al tocarlo, lo aplica al campo de peso. `src/domain/loadSuggestion.ts` (puro): `suggestNextLoad` ancla en `max(peso mejor serie completada, PR kg)`, aplica progresión configurable con factor por RIR (RIR ≥ 2 acelera ×1.5, RIR ≤ 1 frena ×0.5) y redondea a plato de 2.5 kg; `bestCompletedSetWeight` y `roundToPlate`. Hook `src/hooks/useLoadSuggestion.ts` (combinando sesión activa + PR + ajustes). Nuevos ajustes en Ajustes → Sesión: toggle "Sugerir carga" (`showLoadSuggestion`, default on) y "Progresión (%)" (`loadProgressionPct`, default 2.5, rango 0.5–10). Sin tocar las series de calentamiento.
- **5 paletas × modo día/noche (`F35`)**: selector de color principal (Dorado, Energía, Carmesí, Eléctrico, Violeta) con swatches en Ajustes → Apariencia, independiente del modo Noche/Día. Cada combo redefine `accent`, `accent-soft`, `gold`, `gold-bright`, `cta`, `cta-deep`, `border`, `muted`, tinte de `bg-elevated` y `--color-on-gold` (10 variantes en `index.css`). `useTheme` gana `palette`/`setPalette` (persistencia `localStorage` `gymlab.palette` + `meta.palette`), el anti-flash de `index.html` aplica `data-palette` antes del paint, `useThemeColors` observa `data-palette` (gráficos Recharts reaccionan) y el `<meta name="theme-color">` se actualiza al CTA activo. `.gold-gradient`/`.gold-text`/`.gold-border-glow` ahora usan `var(--color-*)`. `text-black` sobre CTA → `text-on-gold` en `ConversorPage` y skip-link de `AppShell`. Default = Dorado + Noche (comportamiento actual).
- **Plan F36/F37** (`docs`): nuevas fases planificadas en `PLAN.md` — F36 Asistente de carga inteligente (sugiere el peso objetivo de la siguiente serie con e1RM/PR/RIR) y F37 Insights de progreso (comparativa de volumen semanal). Sin cambios de código aún.
- **Seed 5/3/1 Wendler + definición (`F33b`)**: rutina nueva `531-wendler` (4 días: press militar, peso muerto, banca y sentadilla, cada uno con serie 5/3/1 de 3×5, complemento BBB 5×10 y accesorios) y mejora de `PPL Definición` con un 5º ejercicio por día (fondos en paralelas, remo a una mano y hip thrust) manteniendo el foco de densidad y poco descanso. `SEED_VERSION` → `10`.
- **Guías cortas (`F33c`)**: 6 guías nuevas en `seedGuides` — HIIT vs LISS, estancamiento, semana de deload, espalda segura, menú de definición y sobreentrenamiento (ids 8-13) — con bullets accionables y el disclaimer "Informativo, no consejo médico" que ya muestra la ficha de guía. `SEED_VERSION` → `11`.
- **Plantillas de 1 día (`F33d`)**: 8 sesiones sueltas nuevas en el seed (`pecho-15`, `espalda-casa`, `abs-principiante`, `pierna-express`, `gluteo-express`, `fullbody-20`, `brazos-hombros`, `cardio-core`) con `daysCount: 1`. En `/rutinas` llevan badge "Sesión suelta" (verde), muestran "Sesión suelta" en vez de "X días/semana" y hay un filtro Tipo (Todas / Sesión suelta / Programa). `SEED_VERSION` → `12`.
- **Calculadora de macros (`F34a`)**: `src/domain/calculators/macros.ts` (puro) con `calcMacros`, que parte del TDEE (Mifflin-St Jeor) y aplica factor por objetivo (volumen ×1.1, mantenimiento ×1, definición ×0.8), proteína 1,8–2,2 g/kg, grasas 0,8 g/kg y el resto de calorías como carbohidratos. Nueva página `/calculadoras/macros` (MacrosPage, reutiliza `CalculatorField`) con selector de objetivo y tarjetas de kcal + proteína/carbs/grasas, entrada en el hub y disclaimer.
- **Calculadora de discos en hub (`F34b`)**: entrada "Calculadora de discos" en `/calculadoras` que abre el `PlateCalculatorModal` existente (discos por lado para una carga), sin necesidad de ruta propia.

### Added
- **Historial de sesión con detalle (`F32b`)**: nueva vista de solo lectura en `/entrenamiento/:id` (`WorkoutDetail` + wrapper `SesionPage`) con fecha, duración, volumen, series completadas, notas y desglose por ejercicio (serie, peso × reps, RPE, calentamiento). Las filas de historial en Home (`EntrenarPage`) y Perfil ahora enlazan al detalle. Empty state si la sesión no existe.
- **Gráfico de evolución 1RM (`F32c`)**: serie temporal de e1RM por ejercicio en la ficha `/ejercicios/:slug` (`E1rmChart` con Recharts y tokens del tema). Nuevo `buildE1rmSeries` en `src/domain/e1rm.ts` (reutiliza `estimate1RM`, mejor valor por sesión) y método `workoutSetRepo.getByExercise`.
- **Semana de deload en programa activo (`F32d`)**: toggle en Home y CTA "Activar semana de deload" en el banner del Perfil (cuando hay programa activo). `ActiveProgram` gana `deloadActive`/`deloadUntil` (+7 días), helper `isDeloadActive` en `src/domain/deload.ts` y `activeProgramRepo.setDeload`. Badge "Semana deload" en la tarjeta de programa.
- **RIR opcional (`F32e`)**: columna "RIR" en `SetRow` (0–6) activable desde Ajustes (`showRir`), persistida en `WorkoutSet.rir` y mostrada en el detalle de sesión.
- **Onboarding de primera visita (`F32f`)**: wizard de 3 pasos (objetivo → días/lugar/nivel → rutina sugerida) con chips, flag `onboardingDone` en meta, sugerencia de rutina por objetivo+días (`suggestRoutine` en `src/domain/onboarding.ts`), CTA "Empezar D1" que configura el `activeProgram`, y skip "Ya entreno aquí". No se re-muestra si ya hay sesiones.
- **Home como dashboard (`F32g`)**: CTA fuerte a `/rutinas` cuando no hay programa activo (copy distinto si aún no hay sesiones), y el bloque "Hoy toca" muestra el día + los grupos musculares del día programado.
- **Pack mujer/glúteo (`F33a`)**: 4 rutinas nuevas en el seed extraídas de la biblioteca de mujer — `mujer-2d` (tren sup/inf), `mujer-3d` (sup/inf/full body), `mujer-4d` (empuje/tirón) y `gluteos-3d` (glúteos con torso intercalado) — todas con `exerciseId` del seed (< 1000), y la guía **Glúteos base** en la categoría mujer. `mujer-full-3d` renombrada a "Full Body Mujer 3 días". `SEED_VERSION` → `9`.

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
