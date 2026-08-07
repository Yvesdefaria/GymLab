# GymLab App — Plan de implementación

Stack: **Vite + React 18 + TypeScript + Tailwind + Dexie + Zustand + Recharts + PWA → Capacitor (Android)**

Prototipo HTML en `../GymLab/` = solo referencia de marca. No modificar.

Fuente de contenido offline: `../content/training-library/` ().

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
```

- Fechas de negocio en **local** `YYYY-MM-DD`.
- Seed versionado (`meta.seedVersion`).
- IDs seed &lt; 10000; user/custom ≥ 10000 o UUID en social.

### Media ejercicios

- Fuente primaria: **free-exercise-db** (Unlicense).
- Campos: `imageUrls[]`, `externalId`, fallback SVG por grupo.
- Componente `ExerciseMedia` (2 frames inicio/fin).

---

## Fases

### Fase 0–7 — MVP base ✅
Docs, scaffold, domain/data, entrenar, rutinas, papers, perfil, calculadoras, polish dorado.

### Fase 8 — Capacitor Android
- [ ] cap init, android, safe-area, back button

### Fase 9 — Content archive ✅
- [x] `content/training-library/` 01–06
- [x] README + disclaimer
- [x] Splits fuerza/volumen en markdown

### Fase 10 — Domain v2 (deuda técnica) ✅
- [x] `domain/dates.ts` fechas locales
- [x] Fix `calcStreak` timezone
- [x] Types: ActiveProgram, Guide, Workout.localDate/routineDayId, Exercise.imageUrls
- [x] Social stubs (Post, PostMedia, SocialProfile)
- [x] `calendar.ts`, `sessionProgress.ts`, `muscleFatigue.ts`
- [x] Dexie v2 + seed versioning

### Fase 11 — Catálogo ampliado ✅
- [x] Seeds ejercicios/rutinas ampliados
- [x] SVG placeholder por grupo muscular
- [x] UI ExerciseMedia (listo para fotos free-exercise-db)
- [x] Import masivo fotos free-exercise-db (873 ejercicios / 1.746 fotos; catálogo extra en `exercisesCatalog.ts`, SEED_VERSION → 5)

### Fase 12 — Guías ✅
- [x] Seed guides (nutrición/entrenamiento)
- [x] Rutas `/guias`, `/guias/:slug` + Más

### Fase 13 — Calendario ✅
- [x] ActiveProgram (seguir rutina + días semana)
- [x] Vista mes: hecho / programado
- [x] Ruta `/calendario`

### Fase 14 — Anillo de progreso ✅
- [x] % sesión (sets completados)
- [x] % programa (días del ciclo)
- [x] UI ProgressRing

### Fase 15 — Dummy + fatiga ✅
- [x] MuscleDummy SVG clicable
- [x] Fatiga por último entreno del grupo
- [x] Ruta `/cuerpo`

### Fase 16 — UX sesión ✅
- [x] Play + duración estimada en detalle rutina
- [x] Finalizar ejercicio
- [x] Logo más grande
- [x] Stats home con fechas locales

### Fase 17 — Rutinas custom
- [x] Builder + isCustom + CRUD
- [x] IDs custom ≥ 10000; reseed preserva `isCustom`
- [x] Secciones Mis rutinas / Predefinidas en `/rutinas`
- [x] Rutas `/rutinas/nueva`, `/rutinas/:slug/editar` (solo custom)
- [x] Editar/eliminar solo custom en detalle

### Fase 18 — Cimiento red social ✅
- [x] Tipos + repos + tablas Dexie
- [x] `buildWorkoutPostPayload` helper
- [x] Sin UI feed

### Fase 19 — Mini-calendario en Entrenar ✅
- [x] Componente compartido `MonthCalendar` (extraído de CalendarioPage)
- [x] Bajo la racha: mini-mes actual con hecho / programado / ambos / D{n}
- [x] Link a `/calendario` (mes completo)

### Fase 20 — Modo noche/día ✅
- [x] CSS vars duales `data-theme="night|day"` (negro/blanco + dorado)
- [x] `useTheme` + persistencia localStorage + meta.theme
- [x] Más → `/ajustes` con toggle Noche/Día
- [x] Contraste revisado en modo día

### Fase 21+ — Social UI (futuro)
Auth, Supabase, storage fotos, feed, likes. Requiere backend.

---

## Estado F22-F30 (cierre de deuda técnica)

### F22 - Ajustes, unidades y contraste dia  (parcial)
- [x] Sistema `AppSettings` + `useSettings` (kg/lb, preload, RPE, undo...).
- [x] Ajustes por secciones: Apariencia, Sesion, General, Datos.
- [x] Unidades kg/lb: domain + helpers (`formatWeight`, `applyUnits`, `parseWeightToKg`).
- [x] Unidades aplicadas en TODA la UI (sesion `SetRow`, volumenes home/perfil, resumen) -> **F32a**.
- [ ] Seccion Ajustes "Catalogo" dedicada -> **F32a**.
- [ ] Contraste modo dia revisado (charts/tooltips) -> **F34d**.

### F23 - Catalogo: busqueda, filtros, estiramientos, favoritos, recientes  ✅
- [x] `Exercise.category` + tag estiramiento.
- [x] Filtro estiramiento + musculo + equipo + solo favoritos.
- [x] Favoritos y recientes persistidos (`exerciseFavorites` / `exerciseRecents`).
- [x] Filtros tambien en `ExercisePicker`.

### F24 - Sesion inteligente  ✅ (RIR -> F32e)
- [x] Precarga ultimo peso/reps (modos + n. series + ajuste de peso).
- [x] Warm-up sets (porcentajes configurables) + badge.
- [x] RPE por serie + persistencia.
- [x] Auto-descanso + sonido + vibracion (`RestTimer`).
- [x] Wake Lock.
- [x] Confirmar al salir de una sesion en curso.
- [x] Undo al borrar serie/ejercicio (toast).
- [x] Empty state en sesion.
- [x] RIR opcional -> **F32e**.

### F25 - Builder avanzado + notas + plate calc  ✅
- [x] Superseries en builder (`supersetGroup`).
- [x] Notas por ejercicio (`exerciseNotes`).
- [x] Calculadora de discos (`PlateCalculatorModal` en sesion).
- [ ] Superserie con UX en sesion -> **F34c**.
- [ ] Home "Hoy toca D{n} · grupos" mas visible -> **F32g**.

### F26 - Progreso, PRs, historial, deload + peso corporal  (parcial)
- [x] PRs con nombre de ejercicio.
- [x] Historial listado (home/perfil) + registro peso corporal + grafico 30/90/todo.
- [x] Historial clickable (detalle sesion pasada) -> **F32b**.
- [x] Grafico e1RM por ejercicio -> **F32c**.
- [x] Deload toggle en programa activo -> **F32d**.

### F27 - Backup + PWA install  ✅
- [x] Export/import JSON (profile, settings, workouts, sets, PRs, customs, favoritos, notas, peso).
- [x] Prompt "Instalar GymLab" (`beforeinstallprompt`).

### F28 - Catalogo JSON versionado + traduccion ES selectiva  ✅
- [x] `public/catalog/exercises-vN.json` con fallback al seed embebido.
- [x] Renombrar solo nombres absurdos auto-ES; conservar los conocidos en ingles.

### F29 - Dummy rojo en ficha + a11y + calculadoras  ✅
- [x] `MuscleDummy` con musculo destacado en rojo en ficha de ejercicio.
- [x] A11y: focus visible, labels, empty states.
- [x] Calculadoras faciles: **1RM, agua, conversor kg/lb** (macros -> F34a).

### F30 - Capacitor Android  (Tier C / bajo pedido)
- [ ] `cap init`, Android, safe-area, back button, splash, haptics nativos.

---

## Fase 32 - Tier S restante (producto core)

Criterios por subtarea: `npx tsc --noEmit` + `npm run build` + screenshot E2E (375x812), entrada en `CHANGELOG.md`, un commit por subtarea. Datos de peso SIEMPRE en kg en storage; la unidad solo cambia el display.

### [x] F32a - Unidades kg/lb en toda la UI  *(M)*
- [x] `SetRow`: input/placeholder en unidad de display; guardar siempre kg.
- [x] `ExerciseBlock`: PR y labels con `formatWeight`.
- [x] Home/Perfil/Resumen: volumenes y strings de peso con unidades.
- [ ] Seccion Ajustes "Catalogo" (agrupar toggles existentes) si aplica.

### [x] F32b - Historial de sesion (detalle)  *(M-L)*
- [x] `workoutRepo.getById` + sets ordenados (si falta).
- [x] Cargar `/entrenamiento/:id` como sesion pasada (solo lectura).
- [x] UI: fecha, duracion, volumen, ejercicios -> series (peso x reps, RPE, warmup).
- [x] Home/Perfil: filas de historial -> enlace al detalle.
- [x] Empty/error si el id no existe.

### [x] F32c - Grafico e1RM por ejercicio  *(S-M)*
- [x] Serie temporal e1RM por `exerciseId` (domain, reutiliza `estimate1RM`).
- [x] Componente `E1rmChart` (Recharts + tokens tema).
- [x] Montar en `EjercicioDetailPage`; empty con CTA entrenar.

### [x] F32d - Deload en programa activo  *(S-M)*
- [x] `ActiveProgram.deloadActive` (+ opcional `deloadUntil`).
- [x] Toggle en detalle de rutina activa o home.
- [x] Badge "Semana deload" + copy; banner `detectDeloadSignal` -> CTA activar.

### [x] F32e - RIR opcional  *(S)*
- [x] `ActiveSet.rir?` + persistencia; setting `showRir`; columna en `SetRow`.

### [x] F32f - Onboarding (ex-F31c)  *(L)*
- [x] Flag `onboardingDone` (meta/profile).
- [x] Wizard 2-3 pasos: valor + objetivo/nivel/dias/material (chips, no sliders).
- [x] Al terminar: sugerir rutina -> `activeProgram` + CTA "Empezar D1".
- [x] Skip "Ya entreno aqui"; no re-mostrar si done.

### [x] F32g - Home dashboard empty/CTA (ex-F31d)  *(S)*
- [x] Sin programa: card CTA fuerte -> `/rutinas`.
- [x] Sin sesiones: empty unificado (skill).
- [x] Con programa: anillo + "Hoy toca Dn · grupos" como peak visual.

---

## Fase 33 - Tier A: content -> seeds

Fuente: `content/training-library/`. Formato app: tablas + bullets (no MD narrativo). Cada pack = un commit + `SEED_VERSION++`.

### [x] F33a - Pack mujer / gluteo  *(M)*
- [x] Extraer 3-4 rutinas de `06-mujer-fitness` (2d upper/lower, 3d, 4d push/pull, gluteos 3d).
- [x] Renombrar `mujer-full-3d` a titulo coherente.
- [x] Days + items con `exerciseId` < 1000 preferido.
- [x] (opc) Guia "Gluteos base".

### [x] F33b - 5/3/1 + definicion  *(M)*
- [x] Seed 5/3/1 Wendler (plantilla BBB / main lifts).
- [x] 1 rutina definicion adicional o mejora de `PPL Definicion`.
- [x] Sin duplicar Torso/Pierna ni Full Body.

### [x] F33c - Guias cortas (4-6)  *(M)*
- [x] `seedGuides` bullet desde `01` + `05`: HIIT vs LISS, estancamiento, deload, espalda segura, menu definicion, (opc) sobreentrenamiento.
- [x] Disclaimer en cada una.

### [x] F33d - Plantillas 1 dia (<=8)  *(M)*
- [x] Rutinas `daysCount: 1` ("Pecho 15'", "Espalda casa", "Abs principiante"...).
- [x] Badge/filtro "Sesion suelta" vs "Programa" en `/rutinas`.

---

## Fase 34 - Tier B (utilidad media)

### [x] F34a - Calculadora macros  *(S-M)*
- [x] `domain/calculators/macros.ts` (TDEE + objetivo volumen/definicion/mantenimiento).
- [x] Ruta `/calculadoras/macros` + entrada hub + disclaimer.

### [x] F34b - Discos en hub  *(S)*
- [x] Entrada "Calculadora de discos" en `/calculadoras` (reusa `PlateCalculatorModal`).

### [x] F34c - Superserie en sesion UX  *(S-M)*
- [x] Agrupar visual bloques del mismo `supersetGroup`; foco al siguiente grupo al completar.

### [x] F34d - Polish F31e-h (batch)  *(M)*
- [x] `/rutinas` y detalle: jerarquia + badge categoria.
- [x] Sesion: microfeedback de serie + `RestTimer` peak.
- [x] Perfil: historial timeline.
- [x] Hub calculadoras alturas uniformes + `/mas` orden + contraste dia.

---

## Fase 35 - 5 paletas x dia/noche en Ajustes

Modelo: dos preferencias independientes. En el DOM `<html data-palette="…" data-theme="…">`.

| Clave | Valores | Default |
|-------|---------|---------|
| `gymlab.palette` | `gold` · `energy` · `crimson` · `electric` · `violet` | `gold` |
| `gymlab.theme` | `night` · `day` | `night` |

Por cada combo se redefine: `accent`, `accent-soft`, `gold`, `gold-bright`, `cta`, `cta-deep`, `border`, `muted`, tinte suave de `bg-elevated` (noche) / bg secundario (día), y `--color-on-gold` (texto sobre CTA según contraste del acento). `success` / `danger` se mantienen (semántica).

- [x] **CSS**: defaults = gold + night; bloques `html[data-palette='…'][data-theme='night|day']` (10 variantes; gold-night = base); `.gold-gradient` / `.gold-text` / `.gold-border-glow` pasan a `var(--color-*)`.
- [x] **`useTheme`**: `palette` + `setPalette`, `theme` + `setTheme`; persistencia `localStorage` + metaRepo; escribe `dataset.palette` y `dataset.theme`; actualiza `<meta name="theme-color">` al CTA activo.
- [x] **`index.html` anti-flash**: leer `gymlab.palette` + `gymlab.theme` y aplicar ambos attrs antes del paint.
- [x] **`useThemeColors`**: observar también `data-palette` (además de `data-theme`).
- [x] **AjustesPage — Apariencia**: grid 5 swatches (círculo con el color + label; `aria-pressed`); Modo Noche/Día con copy genérico (sin "dorado"); preview visual inmediata al tocar.
- [x] **Polish**: botones con `text-black` fijo sobre CTA → `text-on-gold` / token.
- [x] **Docs**: `CHANGELOG.md` + checkbox en plan; typecheck + build; commit único `feat: 5 paletas con modo día/noche en ajustes`.

Fuera de alcance: temas custom del usuario, sync cloud, animaciones largas de transición, renombrar `gold-*` en todo el código (innecesario si los tokens se rellenan bien).

Criterio de hecho: elegir cada una de las 5 paletas + día/noche en Ajustes y ver CTA, bordes, charts y tab bar coherentes; recarga sin flash del tema incorrecto; default = Dorado + Noche (comportamiento actual).

---

## Fase 36 — Asistente de carga inteligente

Propuesta nueva (T1). Convierte la app de bitácora a coach: sugiere el peso objetivo de la siguiente serie usando datos que ya existen (e1RM, PR, RIR, mejor serie de la sesión).

- [x] **Domain** — `src/domain/loadSuggestion.ts` (puro, sin React/Dexie):
  - `suggestNextLoad({ lastWeightKg, prWeightKg, rir, progressionPct })` → peso objetivo: ancla en `max(mejor serie completada, PR kg)`, aplica progresión configurable (2.5–5%) con factor por RIR (RIR ≥ 2 → ×1.5, RIR ≤ 1 → ×0.5) y redondea a plato de 2.5 kg.
  - Helpers: `bestCompletedSetWeight` y `roundToPlate`.
- [x] **Hook** — `useLoadSuggestion(exerciseId, prWeightKg)` que combina el PR histórico (repositorios) + la sesión activa (store) y devuelve `{ suggestion, enabled }`.
- [x] **UI** — chip en `ExerciseBlock`: "Sugerido: 82.5 kg" con tap-to-apply (rellena el peso de la siguiente serie incompleta; ignora calentamientos).
- [x] **Ajustes** — toggle `showLoadSuggestion` + `loadProgressionPct` (rango %) en sección Sesión; persistencia en `AppSettings`.
- [x] Criterios: `npx tsc --noEmit` + `npm run build` + entrada en `CHANGELOG.md` + un commit único `feat:`.

---

## Fase 37 — Insights de progreso

Propuesta nueva (T2). Usa datos ya registrados para dar feedback proactivo de tendencia, no solo registro pasivo.

- [x] **Domain** — `src/domain/insights.ts` (puro):
  - Comparativa de volumen por semana (agrupa por semana calendario como `VolumeChart`): "Esta semana +8% vs anterior" o alerta "Volumen en descenso". Reutiliza `totalVolume` de los workouts (semana actual vs anterior).
  - Reutilizable en Home y Perfil.
- [x] **UI** — componente `InsightCard` (variante positiva/neutra/alerta).
- [x] **Montaje** — Home (bajo "Volumen sem.") y Perfil (junto al gráfico de volumen).
- [x] Criterios: `npx tsc --noEmit` + `npm run build` + screenshot 375×812 + entrada en `CHANGELOG.md` + un commit único `feat:`.

---

## Fase 39 — Auditoría integral con skills (Lotes A–E)

Auditoría de toda la app contra las skills del repo (accessibility, ui-ux-pro-max, frontend-design, site-architecture, software-architecture, seo, webapp-testing). Cada lote = **un commit** con prefijo convencional. Criterios por lote: `npx tsc --noEmit` + `npm run build` + `npm run lint` + entrada en `CHANGELOG.md` + checkboxes aquí.

### [x] Lote A — Accesibilidad (WCAG 2.2)  *(L)*
- [x] **Etiquetas accesibles** en inputs sin nombre (`aria-label` o `label htmlFor`):
  - [x] `SetRow` → input de reps (`src/components/workout/SetRow.tsx:53`).
  - [x] `PesoCorporalPage` → input "Registrar hoy" (`:62`).
  - [x] `AjustesPage` → `NumberField`/`Select`/warmup (`:59-102, :357`).
  - [x] Calculadoras → `ImcPage`, `CaloriasPage`, `MacrosPage` (label sin `htmlFor`).
  - [x] `RutinaBuilderPage` → nombre, objetivo/nivel, descripción, día, series/reps/descanso, superserie.
  - [x] `EjercicioDetailPage` → textarea "Mi nota" (`:204`).
  - [x] `ExercisePicker` → búsqueda (`:50`).
- [x] **Botones solo-icono** sin nombre → `aria-label`: cerrar `ExercisePicker:59`, reiniciar `RestTimer:130`.
- [x] **Switches de Ajustes** sin nombre accesible → `aria-label` en `Toggle` (`AjustesPage:42-55`).
- [x] **Contraste modo día-gold** → oscurecer `--color-accent`/`cta` de la paleta gold en día (`index.css:29-44`); afecta tabs, `.stat-value`, títulos y CTAs (3.55:1 → ≥4.5:1).
- [x] **Interactivos anidados** → estrella de favorito fuera de `<Link>`/`<button>` (`EjerciciosPage:81`, `ExercisePicker:132`).
- [x] **`ExercisePicker` como diálogo** → `role="dialog" aria-modal`, foco inicial, `Escape`, focus restore (`:46`).
- [x] **`<h1>` único en Home** → hero de `EntrenarPage` pasa a `<h2>`/`<p>` (AppHeader ya es el `h1`) (`:160`).
- [x] Menores: foco visible en input warmup (`SetRow:46`), `aria-pressed` en toggles de día/filtros/sexo, contraste iconos trash en noche (≥3:1), placeholders más legibles, live-region en errores de formulario.

### [x] Lote B — Diseño consistente (industrial-premium extendido)  *(L)*
- [x] **Tokens `.panel` / `.panel-hero` / `.kicker` / `.stat-value` / `.chip` en toda la app** (hoy solo Home y Sesión): Rutinas, RutinaDetalle, Papers, Guías, Ejercicios, Cuerpo, Calendario, Perfil, Ajustes, Peso, hub y 6 calculadoras.
- [x] **Eliminar emojis como iconos** → lucide-react (`useExerciseCatalog` `muscleGroupEmoji`; usado en `EjerciciosPage`, `ExerciseFilterBar`, `ExercisePicker`) — AGENTS.md lo prohíbe.
- [x] **Colores hardcodeados → tokens**: hex IMC (`domain/calculators/imc.ts:26` + `ImcPage`), `text-blue-400` (`RutinasPage:21`), swatches paleta (`AjustesPage:112-118`).
- [x] **Back consistente**: añadir a Perfil, Ajustes, Calculadoras; unificar labels ("Volver") y comportamiento.

### [x] Lote C — SEO + PWA  *(M)*
- [x] **`index.html`**: title descriptivo, meta description 150–160 (hoy 75), tags OG (`og:title/description/type/url/image` con `public/logo.jpg`), Twitter cards, `<link rel="canonical">`.
- [x] **PWA installable**: icons PNG 192/512 + maskable en `vite.config.ts:27-34` (hoy solo SVG); `id` en manifest.
- [x] **Meta por ruta**: hook `useSeo` (title/description/OG/canonical por página) montado en `AppHeader` (hoy solo `document.title`).

### [ ] Lote D — Arquitectura  *(M)*
- [x] **Envolver `useLiveQuery` en hooks de dominio** (14 usos en pages/components, hoy acoplados a dexie-react-hooks): Calendario, Cuerpo, Ejercicios/EjercicioDetalle, Rutinas/Detalle/Builder, Papers/Detalle, Guías/Detalle, Perfil, Home, Onboarding, WorkoutDetail.
- [x] **Consolidar lógica duplicada en `domain/`**: volumen semanal (Home vs Perfil usan fechas distintas), duración ×4, labels grupos musculares ×2, objetivos/niveles ×2, `slugify` fuera de página.
- [x] **Borrar dead code**: `CalculatorStubPage.tsx`, `components/ui/PagePlaceholder.tsx`.
- [ ] (opc) **Split archivos >200 líneas**: `AjustesPage` (489), `EntrenamientoPage` (449), `EntrenarPage` (415), `RutinaBuilderPage` (379).

### [x] Lote E — UX / pulido  *(M)*
- [x] **Validación de formularios**: 1RM (reps máx), edad/peso/altura razonables en calculadoras, peso ≤ 0 con error visible, warmups inválidos con feedback (`AjustesPage`), errores por `role="alert"`.
- [x] **Target sizes ≥44px** (AGENTS.md): inputs sesión (40→44), chips filtro (~30px), botones 32–36px (RutinaBuilder, RestTimer presets, Peso delete), switch (32px).
- [x] **Empty states**: Guías, día sin items en detalle rutina, Perfil sin datos con CTA; copy correcto en Rutinas sin filtros.
- [x] **Bugs menores**: `min-h-100dvh` inválido (`EntrenamientoPage:227` → `min-h-dvh`), `scrollIntoView` smooth sin `prefers-reduced-motion` (`:209` → behavior auto si reduce), "Seguir esta rutina" sin estado de rutina ya activa (`RutinaDetailPage` → "Rutina activa · actualizar días" con icono check cuando el programa activo ya usa esa rutina). Además: `<a>` anidado en las tarjetas de Papers (enlace PubMed dentro del `<Link>` de la tarjeta) reestructurado a hermanos — elimina el warning de React en consola. Verificado con Playwright (estado rutina activa + NO_CONSOLE_ERRORS).

## Fase 40 — Pulido de sesión: reloj vivo + feedback sonoro
- [x] **Reloj de sesión**: `formatElapsedClock` (`src/domain/workouts.ts`, `mm:ss`, `h:mm:ss` si supera la hora); el stat "Tiempo" del header de `/entrenamiento/active` pasa de minutos estáticos a un cronómetro que tic-tac cada segundo (`tabular-nums`). Aislado en `ElapsedClock` (`src/components/workout/ElapsedClock.tsx`) con su propio `setInterval` para no re-renderizar la página completa por segundo.
- [x] **Campana de boxeo** al iniciar sesión y al completar serie: `playBoxingBellSound` (dos golpes metálicos sintetizados con WebAudio, parciales 1180+2970 Hz) en `src/lib/feedback.ts`, suena en `startWorkout`, `loadRoutineDay`, al añadir el primer ejercicio de una sesión vacía (ese flujo ahora también fija `startedAt`, antes quedaba en null y la duración se guardaba como 0) y al marcar una serie como completada en `handleSetCompleted` (antes pitido corto `playSetCompleteSound`, eliminado).
- [x] **Aviso fin de descanso**: pitido corto (`playRestWarningSound`, 523 Hz) en cada uno de los últimos 3 s del `RestTimer` (3, 2 y 1) solo si `settings.restSound` está activo (guard `lastWarnedRef` en vez del `warnedRef` que solo dejaba sonar una vez; el sonido/vibración de fin ya no suena al montar ni al pausar — fix en `e85473f`/F31f).
- [x] **Rendimiento de la sesión**: suscripciones al `activeWorkoutStore` con selectores individuales en `EntrenamientoPage`, `EntrenarPage`, `RutinaDetailPage`, `ExerciseBlock` y `RestTimer` (antes selector global → re-render de todo el árbol en cada tick de `restRemaining`).
- Commit: `e85473f` (fase original) + commit de pulido. Verificado con tsc, build, lint y 27 tests.

---

## Fuera de alcance (Tier C / futuro)

Social UI (F21), Capacitor (F30), deportes especificos, "fisicos de leyenda", feed.

---

## Fase 31 — Pasadas de la skill `mobile-app-ui-design`

Orden de prioridad por momento de la app (Peak-End y productividad antes que pulido cosmético de listados). Cada pasada = una sola tarea con un commit (`fix:` o `refactor:`) y entrada en `CHANGELOG.md`.

Skill instalada: `https://github.com/ceorkm/mobile-app-ui-design` (`mobile-app-ui-design`). Reglas clave: paleta 60/30/10, grid 8-pt, sombras tintadas, tap targets ≥44px, copy corto en español, lucide icons, `rounded-2xl`, F-pattern, thumb-zone, Peak-End (Kahneman), Trojano Horse / Vanity Mirror / Comfort Trap (Spotify), estados vacío/error/loading.

> **Nota:** las pasadas pendientes **F31c–h** se ejecutaron dentro de la **Fase 32** (producto core) y la **Fase 34d** (polish) con los mismos criterios de la skill: F31c→`F32f`, F31d→`F32g`, F31e–h→`F34d` (todas `[x]`). F31a/b ya cerradas; la dedupe de rutinas se registró como `F31-seed` en el changelog. Los checkboxes de abajo se marcaron en el commit `[docs] marcar Fase 31 como completada`. Los 3 sub-ítems que quedaron sin marcar (afirmación del RestTimer, estados de carga/error del `ExercisePicker` y búsqueda con recientes en `/calculadoras`) se completaron después en una pasada de cierre de Fase 31.

### [x] F31a — Resumen de entreno (Peak-End) ✅
- [x] Hero celebratorio con glow + Trophy/Flame según PR/racha; headline y kicker dinámicos.
- [x] Grid 4 `StatCard` (Volumen / Series / **Duración** / **PRs o Racha** resaltado si toca).
- [x] CTA primario `Volver al inicio` + secundario `Ver mi progreso`; microcopy de cierre.
- [x] `handleFinish` calcula `durationMin`, `prCount`, `exerciseCount`, `streak` (`useStreak().currentStreak`).
- Commit: `d718b59`.

### [x] F31b — Empty & peak en el resto de la app ✅
- [x] `MonthCalendar` (home + calendario): estados vacío (`Aún no hay sesiones`) → receta `Empty state` de la skill, con tono GymLab, y dato motivacional "empieza tu primera serie" + CTA.
- [x] `/ejercicios/:slug` ficha: verificar imagen/placeholder con frame estable, y estado "sin historial de sets" → mini-peak con PR si existe (`Vanity Mirror`).
- [x] `AjustesPage`: revisar overflow multicolumna a 320px en select/number field (reportado por el usuario; no reproducido en headless — reabrir con device real / Safari). Confirmar que el toggle cen​trado se ve bien en iOS.
- Commit: `e892fc3`.

### F31c — Modelo de usuario y onboarding  → **F32f** ✅
- [x] Pantalla de bienvenida / onboarding (≥2 pantallas lógicas): valor de Theta-Loop, breakdown + hero, copiar de fuerza GymLab (`Peak-End` en la "primera experiencia"), barra de progreso.
- [x] Preguntas personalizadas (objetivo, nivel, días/semana, material): campos por selección con iconos preferentemente a sliders; usar la receta `Selection Over Manual Input`.
- [x] Programar el primer entreno a partir del onboarding (`Trojano Horse`: feature compleja en UI familiar).

### F31d — Home (`/`) como dashboard  → **F32g** ✅
- [x] Reordenar bloques según `personalización por stage` (nuevo vs. power user) y F-pattern.
- [x] Convertir el anillo de progreso del programa + streak en el **peak visual** de la home.
- [x] Añadir space vacía de "no hay programa activo" → CTA a `/rutinas`.
- [x] Verificar sombras tintadas y `rounded-2xl` consistentes entre todas las tarjetas.

### F31e — Lista de Rutinas y Detalle  → **F34d** ✅
- [x] `/rutinas`: categoría (objetivo) con background suave + imagen aislada (regla `Category Screens`); badge horizontal uniforme, rhythm de scan.
- [x] `/rutinas/:slug`: rework del cards de día con mejor hierarchy; botón **Seguir rutina** con feedback en estado activo (peak-end del "programa activo asignado") y glow sutil.
- [x] `list` vs `card` según stages y objetive; evitar box-in-box en el detalle.

### F31f — Sesión activa (el "trabajo" de la app)  → **F34d** ✅
- [x] Reforzar el feedback emotional de completar una serie (sound/vibrate existente → añadir micro-animación de la fila `SetRow`: check + opacity suave + flash success).
- [x] `RestTimer` como peak-end del descanso: barra de progreso circular + haptics + afirmación "Vuelve a por la siguiente" (`aria-live`) cuando la cuenta llega a 0. De paso se corrigió un bug por el que el descanso nunca terminaba solo (el intervalo se limpiaba al llegar a 0 sin el tick final que ponía `isResting=false`).
- [x] Clarificar jerarquía: anillo de progreso de sesión arriba; CTA `Finalizar entreno` en thumb-zone con mejor peso visual.
- [x] Estados de carga/error en `ExercisePicker`: skeleton con `role="status"` mientras carga el catálogo y fallback `role="alert"` si no se pudo cargar; `useExerciseCatalog` expone `loading`.

### F31g — Perfil y historial  → **F34d** ✅
- [x] `/perfil`: grid de stats con jerarquía (Racha actual > Volumen semanal > Total entreno > PRs); usar `Vanity Mirror` para la "mejor marca" (identidad vs log).
- [x] Historial reciente como timeline visual (no lista plana de fechas) — receta `Order/Status Tracking`.
- [x] Charts (Recharts) con paleta y strokeWidth consistentes con el design system.

### F31h — Calculadoras y `Más`  → **F34d** ✅
- [x] `/calculadoras` hub: unificar altura/estilo de las tarjetas (hoy mezcla) → grid 2 col, h-128 px uniforme; barra de búsqueda (`Smarter Search`) con filtrado instantáneo, sección "Recientes" (localStorage) y estado vacío; tarjeta "Calculadora de discos" a ancho completo.
- [x] Inputs de calculadoras: validar `Selection Over Manual Input` donde aplique (chips de sexo, objetivo) manteniendo `NumberField` para datos precisos.
- [x] `/mas`: revisar jerarquía de items (perfil arriba, guías, cuerpo, calculadoras, ajustes) y spacing grid-8.

### Criterios de cada pasada
- Mobile-first @375px; sombras tintadas; lucide icons; sin blop gradients genéricos.
- Typo: ≤4 tamaños, ≤2 pesos con propósito; headline > body > label por size/weight/opacity.
- Min text-size: si algo queda pequeño, simplificar layout antes que encoger texto.
- Verificación obligatoria por pasada: `npx tsc --noEmit`, `npm run build`, screenshot E2E con el script `with_server.py`.
- Actualizar `CHANGELOG.md` (sección `Changed` o `Fixed`) en cada pasada.

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
