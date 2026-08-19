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
- [x] **Pitidos finales audibles**: `beep` gana el parámetro `vol` (`src/lib/feedback.ts`) y `playRestWarningSound` pasa de 523 Hz a 880 Hz con volumen 0.4 para que los avisos de los últimos 3 s se oigan con claridad (antes el pitido casi no se percibía).
- [x] **Ring de boxeo al terminar el descanso**: al llegar la cuenta a 0, el `RestTimer` reproduce `playBoxingBellSound` en lugar del triple pitido `playRestEndSound` (que se mantiene exportado en `feedback.ts` para otro uso), solo si `settings.restSound` está activo.
- [x] **Precarga del día de la rutina activa**: `handleStart` de `EntrenarPage` carga automáticamente los ejercicios del día programado del programa activo (nuevo hook `useRoutineDayItems` en `src/hooks/useRoutines.ts` → `startRoutineDay`), en lugar de arrancar la sesión en blanco y obligar a añadir ejercicios a mano; si no hay día programado, sigue iniciando sesión vacía (`startWorkout`).
- Commit: `e85473f` (fase original) + `8569001` (pulido reloj/selectores) + `f22a91d` (precarga día activo + audio descanso). Verificado con tsc, build, lint y 27 tests.

---

## Fase 41 — Medidas corporales y grasa corporal (picómetro)

Dos apartados nuevos en el hub Más con registro por fecha y cálculos derivados. Siguen el patrón de `bodyWeight` (tabla Dexie, upsert por fecha, hooks, página).

### 1. Tipos de dominio
- [x] `BodyMeasurementEntry`, `SkinfoldEntry`, `BodyZone`, `SkinfoldSite` y `Sex` en `src/domain/types.ts`
- [x] Catálogo de 18 zonas (tronco/brazos/piernas) con etiqueta, grupo y lado en `src/domain/bodyMeasurements.ts`
- [x] Catálogo de los 7 pliegues del picómetro (clave, etiqueta y punto de medida)
- [x] Guía de medición paso a paso: técnica de la cinta + instrucciones de cada zona
- [x] Técnica del picómetro paso a paso: pasos generales de la pinza + guía de cada pliegue

### 2. Lógica de cálculo (`src/domain/calculators/bodyComposition.ts`)
- [x] Jackson-Pollock: densidad corporal con 7 pliegues (y 3 pliegues)
- [x] Conversión densidad → % grasa con la ecuación de Siri
- [x] Categoría de % grasa por sexo (Esencial/Atleta/En forma/Promedio/Alto)
- [x] Masa grasa y masa magra (FFM) con peso
- [x] Ratio cintura/altura (WHtR) con categoría de riesgo
- [x] Ratio cintura/cadera (WHR)
- [x] Simetría izq-der de las zonas pareadas
- [x] Tests unitarios de las fórmulas (`bodyComposition.test.ts`, 46 tests en total)

### 3. Persistencia
- [x] Subir versión Dexie (v4) y añadir tablas `bodyMeasurements` y `skinfolds`
- [x] Repos `bodyMeasurementRepo` (upsert con merge parcial por zona) y `skinfoldRepo` (getAll, upsert, delete)
- [x] Exportar en `src/data/repositories/index.ts` e interfaces

### 4. Hooks
- [x] `useBodyMeasurements` (entradas por fecha, upsert, merge parcial por zona, delete)
- [x] `useSkinfolds` (entradas por fecha, upsert, delete)

### 5. Página /medidas
- [x] Formulario por zonas (18, en cm) agrupado por tronco/brazos/piernas
- [x] Guía de medición desplegable: técnica de la cinta + instrucciones de cada zona
- [x] Guardado con merge parcial sobre la entrada del día
- [x] Altura y sexo (guardados una vez en `meta`, fuera de la tabla de medidas)
- [x] Resumen de la última medición con delta vs anterior (+/-)
- [x] Ratios WHtR, WHR y simetría izq-der
- [x] Selector de zona + gráfico de evolución (Recharts)

### 6. Página /picometro
- [x] Formulario: sexo, edad, peso (opcional), 7 pliegues en mm
- [x] Guía desplegable: técnica del picómetro paso a paso + punto exacto de cada pliegue
- [x] Cálculo en vivo del % grasa (Jackson-Pollock + Siri)
- [x] Categoría, masa grasa y masa magra
- [x] Historial + gráfico de evolución del % grasa

### 7. Integración
- [x] Entradas en `MasPage.tsx` (Medidas corporales y Grasa corporal)
- [x] Rutas lazy en `router.tsx` (/medidas y /picometro)
- [x] Descripciones SEO en `useSeo.ts`

### 8. Verificación y cierre
- [x] `tsc --noEmit` y `npm run build`
- [x] Prueba Playwright contra `http://localhost:5173`
- [x] Actualizar CHANGELOG.md
- [x] Commit + push en español

### Ideas derivadas (fases futuras)
- FFMI (índice de masa magra)
- % grasa por método de la Marina (perímetros, sin picómetro)
- Cambios acumulados por zona (% ganado/perdido desde el inicio)
- Peso magro como referencia para marcas
- Objetivos por zona con barra de progreso

---

## Fase 42 — Tab «Estadísticas» (rendimiento + composición)

Nuevo tab **Estadísticas** en la barra inferior (Entrenar · Rutinas · Estadísticas · Más), ruta `/estadisticas`, que agrega datos de entrenamiento + calculadoras corporales mostrando la evolución del rendimiento con **múltiples tipos de gráfico**: líneas, área, barras (verticales y horizontales), **donuts circulares**, **velas (candlestick)**, bullet de objetivo y KPIs en texto.

Decisiones de alcance (confirmadas por el usuario):
- Ubicación: tab en barra inferior (posición de Papers), no entrada en Más.
- Alcance: **Cuerpo + Entrenamiento**.
- Métricas: IMC, WHtR/WHR, masa grasa/magra, racha máx, días entrenados, frecuencia semanal, volumen por grupo muscular, duración media de sesión, rango de cargas.
- Gráficos: **velas dobles** (cargas por sesión de un ejercicio + rango de volumen semanal) y **donuts dobles** (composición actual + reparto de volumen por músculo).

### 1. Lógica de dominio (`src/domain/`, con tests)
- [x] Ampliar `domain/calculators/bodyComposition.ts`: `buildImcSeries`, `buildBodyCompSeries`, `buildRatiosSeries`
- [x] Nuevo `domain/trainingStats.ts` (puro): `weeklyFrequency`, `avgSessionDurationMin`, `trainedDaysInLast`, `maxStreak`, `volumeByMuscleGroup`, `buildLoadRangeSeries` (velas por ejercicio: open 1ª serie, close última, high/low máx-mín), `buildVolumeRangeSeries` (velas de volumen semanal), `weeklyGoalProgress`
- [x] Reutilizar `buildE1rmSeries`, `calcStreak`, `calcSetVolume`, `calcFatMass`/`calcFatFreeMass`, `calcWhtr`/`calcWhr`
- [x] Tests unitarios de las nuevas funciones

### 2. Gráficos (`src/components/stats/`)
- [x] `ImcChart` (línea), `RatiosChart` (líneas + `ReferenceLine` de umbral WHtR/WHR), `CompositionChart` (líneas masa grasa/magra) + `CompositionDonut` (donut % grasa vs magra)
- [x] `FrequencyChart` (barras verticales), `VolumeByMuscleChart` (barras horizontales con valores visibles) + `VolumeByMuscleDonut` (donut de reparto)
- [x] `LoadRangeCandlestick` (velas por ejercicio con selector de ejercicio) y `VolumeRangeCandlestick` (velas de volumen semanal) — `ComposedChart` + `Bar` con `shape` SVG personalizado (Recharts no tiene candlestick nativo)
- [x] `ExercisePills` (pills con `aria-pressed`), `WeeklyGoalBullet` (KPI vs `profile.weeklyGoal`)
- [x] Reutilizar `BodyWeightChart`, `BodyMeasurementsChart`, `SkinfoldChart`, `VolumeChart`, `E1rmChart`, `ProgressRing`
- [x] A11y: `role="img"` + `aria-label`, leyendas, valores también como texto (no solo hover), no depender del color; configs como constantes de módulo; `React.memo` + `useMemo`

### 3. Página `/estadisticas`
- [x] `src/pages/EstadisticasPage.tsx`: header + estado vacío con CTA
- [x] Sección Entrenamiento: KPIs texto → objetivo semanal (bullet) → volumen por semana (área) → frecuencia (barras) → volumen por músculo (barras horizontales + donut) → velas de cargas por ejercicio → velas de volumen → e1RM por ejercicio (línea)
- [x] Sección Cuerpo: peso + IMC (línea) → medidas por zona + ratios (línea con umbrales) → % grasa (línea) + donut composición + categoría
- [x] Secciones < 200 líneas; queries solo desde `src/hooks/`

### 4. Integración
- [x] `TabBar.tsx`: 4º tab `Estadísticas` (icono `BarChart3`)
- [x] Ruta lazy en `router.tsx`
- [x] `ROUTE_META` en `useSeo.ts` (150–160 chars)

### 5. Apartado B — mejoras detectadas (en esta fase)
- [x] Nuevo hook `src/hooks/useMetaValue.ts`; refactor de `useLiveQuery` directo en `MedidasCorporalesPage` y `GrasaCorporalPage`
- [x] Fix `src/data/backup.ts`: añadir `bodyMeasurements` y `skinfolds`

### 6. Verificación y cierre
- [x] `npx tsc --noEmit` + `npm run build` + `npm run test`
- [x] Playwright: seed `page.evaluate`, render de cada tipo de SVG, tab activo, filtro de rango, 0 errores de consola
- [x] Actualizar `CHANGELOG.md`
- [x] Commit(s) + push en español

---

## Fase 43 — Animaciones (anime.js) + Mejoras UX + Seguridad

Librería de animaciones: **anime.js v3** (`animejs@3`, local vía npm, sin CDN). Ligero, API declarativa y encadenable. Los helpers viven en `src/lib/animations.ts` con guard `prefers-reduced-motion` (si `reduce`, no animar).

Principios de seguridad (auditoría integrada en cada tarea):
- Sanitizar todo input de usuario antes de renderizar (XSS): `textContent`, nunca `innerHTML` con datos de usuario.
- Validar tipos y rangos en calculadoras y campos numéricos.
- Validar imagen subida (tipo MIME, tamaño máximo, sanitización base64 con prefijo `data:image/`).
- Contenido de guías: renderizar como texto, sin HTML arbitrario.
- anime.js: selectores DOM seguros, nunca interpolar input de usuario en selectores.

### Criterio de hecho por tarea (mobile-first + tablet-safe)

1. Código mobile-first (viewports base 375×812) y tablet-safe.
2. `npx tsc --noEmit` — 0 errores.
3. `npm run build` — sin errores.
4. `npm run lint` (oxlint) — 0 warnings.
5. **Playwright dual** (`scripts/with_server.py`, `test_*.py`):
   - **iPhone 375×812** → asserts + screenshot (`-iphone.png`)
   - **iPad 768×1024** → mismos asserts críticos + screenshot (`-ipad.png`)
   - **iPad landscape 1024×768** → solo en T3, T4+T6, T9, T1 (tabs, charts, grid, onboarding)
   - En iPad: contenido centrado con `max-w-lg` sin full-bleed roto, targets ≥44px, TabBar + `safe-area` sin solapamiento, grids/modales/charts usables, tooltips por tap (no solo hover), sin scrollbar visible.
6. Entrada en `CHANGELOG.md` ([Unreleased]).
7. **1 commit** por tarea (mensaje convencional `feat:`/`fix:`/`refactor:`/`docs:`).
8. Respeto `prefers-reduced-motion` (anime.js no debe animar en `reduce`).
9. Avisar al usuario al cerrar cada tarea antes de empezar la siguiente.

### F43 — Setup anime.js + helpers de animación (S)
- [x] `npm install animejs@3 @types/animejs`
- [x] `src/lib/animations.ts` — helpers reutilizables:
  - [x] `fadeIn(targets, duration?)`, `fadeOut(targets, duration?)`
  - [x] `slideIn(targets, direction, duration?)`, `slideOut(targets, direction, duration?)`
  - [x] `staggerFade(targets, delay?)`, `staggerSlide(targets, direction, delay?)`
  - [x] `confetti(target, colors?)` — partículas con translate/rotate/scale aleatorios
  - [x] `drawOn(target)` — para gráficos SVG (`stroke-dashoffset`)
  - [x] `popScale(target)` — checks, badges
  - [x] `pulse(target, iterations?)` — iconos de logro
  - [x] Todos con guard `prefers-reduced-motion`
- [x] Clase CSS `.anime-ready { opacity: 0 }` como estado base; las animaciones lo controlan
- [x] Verificación: `drawOn` en un SVG de prueba + `npx tsc --noEmit`
- [x] Playwright 375×812 + 768×1024 (helpers visibles, reduced-motion sin animar)

### T10 — Ocultar sección Papers (XS)
- [x] Quitar entrada `Papers` de `src/pages/MasPage.tsx` (la TabBar ya no lo tiene; reaparece en fase social)
- [x] Playwright 375×812 + 768×1024 (hub sin Papers, sin huecos, filas táctiles intactas)
- [x] CHANGELOG + commit

### T8 — Sombra degradada en cards de rutinas (S)
- [x] `src/index.css`: foco de luz en esquina superior-izquierda en `.routine-card` + nueva clase `.panel-elevated`, transición suave de `box-shadow` en hover y `:active` (touch)
- [x] Playwright 375×812 + 768×1024 (sombra visible en OLED, cards centradas con `max-w-lg`)
- [x] CHANGELOG + commit

### T9 — Modo grip/lista en Más (S)
- [x] `src/domain/settings.ts`: `hubLayout: 'grip' | 'list'` en `AppSettings` + `DEFAULT_SETTINGS.hubLayout`
- [x] `src/pages/MasPage.tsx`: botón toggle `LayoutGrid`/`List` (≥44px) + renderizado condicional (grid 2× vs lista) con `staggerFade` al cambiar
- [x] Playwright 375×812 + 768×1024 + 1024×768 (grid usable en tablet, toggle accesible)
- [x] CHANGELOG + commit

### T5 — Avatar en Perfil (S)
- [x] `meta.avatarUri` + hook `src/hooks/useAvatar.ts` (leer/escribir `meta.avatarUri`)
- [x] Nuevo `src/components/profile/AvatarPicker.tsx`:
  - «Subir foto» → `<input type="file" accept="image/*">` → `FileReader` → validar MIME (`image/jpeg|png|webp|gif`) + tamaño ≤ 2 MB → base64 → guardar
  - Galería de 12 avatares predefinidos con URLs HTTPS (Pexels/Unsplash, temas: gimnasio, naturaleza, animales, urbano — sin emoji), allowlist de host al renderizar
  - Animación `popScale` al seleccionar; `aria-label` en todos los botones
- [x] `src/pages/PerfilPage.tsx`: avatar circular con fallback a icono `User`
- [x] `src/hooks/useProfileName.ts` (`meta.profileName`) + nombre/alias editable inline en la card (lápiz, input con Enter/blur/Escape, persiste)
- [x] Seguridad: MIME/tamaño en cliente; src del `img` solo si `data:image/` válido o HTTPS de dominio conocido
- [x] Playwright 375×812 + 768×1024 (picker scrollable en 4×3, avatar sin romper card en tablet)
- [x] CHANGELOG + commit

### T7 — Instrucciones detalladas de ejercicios (M)
- [x] **NOTA: aplica a TODOS los ejercicios** — los 821 del catálogo ampliado derivan sus pasos en render desde las 31 plantillas de instrucciones (`src/i18n/catalog/exerciseSteps.ts` + `exerciseStepsEn.ts`, overlay en `localizeExerciseDetail`); los curados sin pasos (40) tienen clave propia en el mismo mapa. Sin re-seed ni cambio de `SEED_VERSION`.
- [x] `src/domain/types.ts`: `detailedSteps?: ExerciseStep[]` en `Exercise` (`{ step, instruction, tip?, warning? }`)
- [x] `src/data/seed/exercises.ts`: `detailedSteps` para ~20 ejercicios principales (sentadilla, press banca, peso muerto, curl, press hombro, dominadas…)
- [x] `src/pages/EjercicioDetailPage.tsx`: pasos como lista numerada con badges de tip/warning; animación `staggerSlide`
- [x] Seguridad: pasos del seed son de confianza; la nota personal ya usa `textContent`
- [x] Playwright 375×812 + 768×1024 (pasos legibles con pulgar, badges no solo color; incluye pasos derivados de un ejercicio sin `detailedSteps`)
- [x] CHANGELOG + commit

### T11 — Extender contenido de Guías (M)
- [x] `src/domain/types.ts`: `sections?: GuideSection[]` en `Guide` (`{ title, content, bullets?: string[] }`)
- [x] `src/data/seed/guides.ts`: **desarrollar las guías existentes** (13) con secciones explicativas amplias + 5 guías nuevas (técnica sentadilla, progresión press banca, principiante, recuperación activa, hidratación)
- [x] `src/pages/GuiaDetailPage.tsx`: renderizar secciones con tipografía diferenciada; `staggerFade` al entrar
- [x] Seguridad: sin HTML de usuario, todo seed de confianza
- [x] Playwright 375×812 + 768×1024 (secciones apiladas legibles, tipografía móvil)
- [x] CHANGELOG + commit

### T2 — Sistema de Logros (M)
- [x] `src/domain/achievements.ts` (puro): tipo `Achievement { id, title, description, icon, condition }` + `checkAchievements(workouts, streak, prs): Achievement[]` (solo nuevos). Lista: primer paso, inaugural (1ª sesión), racha 7/30 días, primera marca, volumen semanal superado, 50 sesiones, consistencia 4 semanas
- [x] `src/components/achievements/AchievementModal.tsx`: modal centrado (backdrop blur), icono con `pulse` en loop, `confetti()` al abrir, botón «¡Genial!» con `popScale`, `role="dialog"`, `aria-modal`, foco inicial, cierra con Escape
- [x] `src/hooks/useAchievements.ts`: lee `meta.unlockedAchievements: string[]`, llama a `checkAchievements` al completar sesión/nuevo PR/cambio de racha, muestra modal una vez y guarda IDs
- [x] Seguridad: IDs de logro son constantes, no input de usuario
- [x] Playwright 375×812 + 768×1024 (modal centrado usable, botón «¡Genial!» en thumb-zone, confetti ligero)
- [x] CHANGELOG + commit

### T3 — Tabs internos en páginas cargadas (M)
- [x] `src/components/ui/TabNav.tsx`: tabs con underline animado (anime.js `translateX` del indicador), `slideOut`/`slideIn` del contenido, `aria-selected`, scroll horizontal si hay muchos; hit ≥44px
- [x] Montaje: `/estadisticas` (Entrenamiento · Cuerpo), `/perfil` (Resumen · Historial · Rachas), días de `/rutinas/:slug`
- [x] Playwright 375×812 + 768×1024 + 1024×768 (tabs scroll-x, underline alineado, contenido sin romper scroll de página)
- [x] CHANGELOG + commit

### T4 + T6 — Gráficos mejorados (L)
- [x] Reemplazar velas japonesas (candlestick) por área/barras/donuts según el dato:
  - e1RM por ejercicio → área con gradiente; volumen semanal → barras redondeadas con valor visible; frecuencia → barras verticales; volumen por músculo → barras horizontales; composición corporal → donut con %; IMC/ratios → área con gradiente; peso corporal → área con gradiente; cargas por ejercicio → área con puntos
- [x] `src/components/stats/`: `AnimatedAreaChart`, `AnimatedBarChart`, `AnimatedDonut` (Recharts + `drawOn` en mount); refactor de `VolumeChart`/`E1rmChart`
- [x] Playwright 375×812 + 768×1024 + 1024×768 (charts altura ~220–280px, tooltips por tap, valores visibles sin hover)
- [x] CHANGELOG + commit

### T1 — Onboarding expandido (L)
- [x] `src/domain/onboarding.ts`: ampliar `OnboardingAnswers` (idioma, unidades, sexo, fecha nacimiento, altura, peso, días/semana, duración, cardio, guías, material, términos)
- [x] `src/components/onboarding/Onboarding.tsx`: expandir a 5 pasos con `aria-current` en el stepper, animación `slideIn`/`slideOut` entre pasos, validar T&C antes del finish, guardar todo en `meta` + sugerencia de rutina
- [x] `src/domain/settings.ts`: `measurementSystem` en `AppSettings`
- [x] Seguridad: fecha nacimiento en rango 14–99 años; material contra lista blanca; T&C booleano
- [x] Playwright 375×812 + 768×1024 + 1024×768 (wizard full-screen en tablet, chips ≥44px, stepper `aria-current`, T&C accesible)
- [x] CHANGELOG + commit

### Orden de implementación (evita deuda técnica)
1. F43 — Setup anime.js + helpers (infra)
2. T10 — Ocultar Papers (sin dependencias)
3. T8 — Sombra degradada (CSS puro)
4. T9 — Modo grip/lista (UI toggle + useSettings)
5. T5 — Avatar en Perfil (nuevo hook + componente)
6. T7 — Instrucciones detalladas (extiende types + seed)
7. T11 — Extender Guías (extiende seed + GuiaDetailPage)
8. T2 — Sistema de Logros (domain + hooks + modal)
9. T3 — Tabs internos (nuevo componente TabNav)
10. T4+T6 — Gráficos mejorados (reemplaza velas)
11. T1 — Onboarding expandido (UI wizard + meta)

### Dependencias
- T5, T7, T11, T2, T3, T4, T1 pueden ejecutarse en paralelo una vez resueltas F43–T9.
- T1 usa T5/T11 como referencia (no obligatorio, coherente).
- anime.js se instala al inicio (F43).

### Auditoría de seguridad integrada
| Riesgo | Mitigación |
|--------|------------|
| XSS en nota de ejercicio | `textContent`, no `innerHTML` |
| XSS en contenido guías | Renderizar como texto, no HTML de usuario |
| Upload de archivo malicioso | Validar MIME + tamaño + base64 |
| Injection en base64 avatar | Verificar prefijo `data:image/` |
| Animación con selectores dinámicos | Nunca interpolar user input en selectores anime.js |
| Datos de localStorage/IndexedDB | Sanitizar al leer antes de renderizar |

### Viewports de prueba (Playwright)
| Dispositivo | Viewport | Obligatorio |
|-------------|----------|-------------|
| iPhone | 375×812 | Todas las tareas |
| iPad portrait | 768×1024 | Todas las tareas |
| iPad landscape | 1024×768 | Solo T9, T3, T4+T6, T1 |

---

## Fase 44 — Onboarding con datos útiles (sub-proyecto A)

> **Objetivo:** que lo que responde el usuario en el onboarding deje de quedarse solo en `onboardingAnswers` y alimente meta, peso corporal, perfil y calculadoras. Diseño aprobado en `docs/superpowers/specs/2026-08-11-onboarding-datos-utiles-design.md`. Orden: **datos primero, i18n después** (Fase 45).

### A1 — Dominio de meta del perfil (nuevo, puro)
- [x] `src/domain/profileMeta.ts` (puro, sin Dexie): constantes `HEIGHT_KEY = 'heightCm'`, `BODY_SEX_KEY = 'bodySex'`, `BIRTH_DATE_KEY = 'birthDate'` y `weeklyGoalFromDays(daysPerWeek): number` (mapea días/semana → objetivo semanal)
- [x] Tests unitarios TDD en `src/domain/profileMeta.test.ts`
- [x] `npx tsc --noEmit` + tests en verde

### A2 — `finish()` escribe los datos útiles
- [x] `src/components/onboarding/Onboarding.tsx` `finish()`: escribir en `meta` `heightCm`/`bodySex`/`birthDate` **solo si válidos** (`isBirthDateValid`, rango altura/sexo)
- [x] `bodyWeightRepo.upsert({ localDate: hoy, weightKg })` si `weightKg > 0` (peso inicial)
- [x] `profileRepo` ensure + `update({ weeklyGoal: weeklyGoalFromDays(daysPerWeek) })`
- [x] No duplicar: si la sesión se marca como hecha, no reescribir a la segunda vez

### A3 — Hook de edad desde meta
- [x] `src/hooks/useProfileAge.ts`: lee `meta.birthDate` vía `useMetaValue` y devuelve `{ age, isBirthDateValid }` reutilizando `ageFromBirthDate`/`isBirthDateValid` de `src/domain/onboarding.ts`

### A4 — Prefill de edad en calculadoras
- [x] `CaloriasPage`, `MacrosPage`, `GrasaCorporalPage`: pre-rellenar el campo Edad con `useProfileAge()` (editable). Refactor: hook unificado `src/hooks/useAgePrefill.ts` que respeta valores guardados (p. ej. pliegues de hoy) y lo que el usuario ya tecleó.

### A5 — Peso en lb en el onboarding
- [x] `src/components/onboarding/steps.tsx` ProfileStep: input de peso en lb cuando `units === 'lb'` (usa `applyUnits`/`parseWeightToKg` de `src/domain/settings.ts`), placeholder correcto. Al cambiar de unidad se convierte el valor tecleado.

### A6 — Ajustes: unidades ↔ measurementSystem
- [x] `src/pages/AjustesPage.tsx`: al cambiar kg/lb actualizar también `measurementSystem` en `AppSettings` (hoy solo cambia `units`)

### A7 — Verificación y cierre
- [x] Verificación: `npx tsc --noEmit` + `npm run build` + Playwright 375×812 + 768×1024 (flujo completo → home con programa y datos en `meta`/`bodyWeight`/`profile`; skip → sin datos)
- [x] CHANGELOG + **1 commit `feat:`**

---

## Fase 45 — i18n completa + catálogo EN (sub-proyecto B)

> **Objetivo:** i18n completa del app (es-ES por defecto + en) en UI **y** catálogo (rutinas/ejercicios/guías/papers) vía overlay EN en render, sin tocar el modelo de datos (el seed queda ES en Dexie como fallback). Diseño aprobado en `docs/superpowers/specs/2026-08-11-i18n-completa-design.md`. **Rechazado:** modelo bilingüe en seed (SEED_VERSION bump, backup/import, tests).

### B1 — Infraestructura i18n (infra)
- [x] Instalar `i18next` + `react-i18next`; añadir `language` a `AppSettings` en `src/domain/settings.ts`
- [x] `src/i18n/index.ts` + `src/i18n/locales/{es,en}.ts` tipados (claves fuertes, paridad es↔en)
- [x] Gate de bootstrap en `src/app/providers.tsx`: tras `ensureSeeded()` leer settings → `i18n.changeLanguage` → render (evita parpadeo)
- [x] `document.documentElement.lang` + título por idioma
- [x] `src/lib/intl.ts`: formato de fechas/números/volumen según locale
- [x] Selector **Idioma** en `AjustesPage`; el onboarding aplica el idioma al instante y guarda `settings.language`

### B2 — Migración de la UI a `t()`
- [x] Reemplazar textos hardcoded por claves `t()` (es-ES por defecto), plurals con `count`
- [x] Script de paridad de claves es↔en (falla si falta alguna clave)

### B3 — Catálogo EN en overlay (render)
- [x] `src/i18n/catalog/en.ts`: traducciones de 821 ejercicios del catálogo (vía `externalId`, que ya es EN), 52 ejercicios curados, ~30 rutinas, 18 guías y 6 papers (manuales)
- [x] Helper `localize*` aplicado en las páginas de catálogo/detalle; labels de `muscleGroup` traducidos

### B4 — Verificación y cierre
- [x] Verificación: `npx tsc --noEmit` + `npm run build` + lint + Playwright en **es y en** (375×812 + 768×1024)
- [x] CHANGELOG + PLAN.md + **1 commit por fase** (`feat:` B1, `feat:` B2, `feat:` B3, `chore:` B4)

### Dependencias
- La Fase 45 **depende** de la Fase 44 (el onboarding guarda `settings.language` y los datos útiles).
- B3 usa los catálogos existentes (`genCatalog.cjs` → `public/catalog/exercises-v1.json`, 821 ítems) sin cambiar seeds.

---

## Fase 46 — Auditoría UI/UX (skill `ui-ux-pro-max`)

> Hallazgos de la auditoría con la skill `ui-ux-pro-max` (Playwright 375×812 + 768×1024 sin overflow ni errores de consola; contrastes AA/AAA en las 6 paletas × 2 temas). **Se ejecutan antes de las Fases 44–45** para no tocar componentes que la i18n (B2) migrará después.

### U1 — Touch targets ≥44px (P2, CRITICAL)
- [x] Icon-only buttons de 40px (`size-10`) → 44px o área ampliada con `after:-inset-1` (patrón `RutinasPage.tsx:89`): `EjerciciosPage.tsx:58` (favorito), `ExercisePicker.tsx:176` (cerrar) y `:60` (favorito), `PlateCalculatorModal.tsx:46` (cerrar), `ConfirmSheet.tsx:56` (cerrar), `InstallBanner.tsx:30` (descartar)
- [x] `ConversorPage.tsx:32,43`: toggle kg/lb `h-10` → `min-h-[44px]`
- [x] Playwright 375×812 + 768×1024 (hit-area ≥44px sin romper filas)
- [x] CHANGELOG + **1 commit `fix:`**

### U2 — Charts accesibles (P10)
- [x] `role="img"` + `aria-label` en `AnimatedCharts.tsx` (o en los consumidores: `BodyWeightChart`, `VolumeChart`, `E1rmChart`, `ImcChart`, `FrequencyChart`, `RatiosChart`, `CompositionChart`, `SkinfoldChart`, `BodyMeasurementsChart`)
- [x] `npx tsc --noEmit` + Playwright (`/estadisticas`, `/perfil`)
- [x] CHANGELOG + **1 commit `feat:`**

### U3 — Limpieza menor
- [x] `AvatarPicker.tsx:146`: template literal sin interpolación → string plano
- [ ] (opc, P3) Virtualizar listado de `RutinasPage` con `@tanstack/react-virtual`
- [x] `npx tsc --noEmit` + `npm run build`
- [x] CHANGELOG + **1 commit `chore:`**

### Orden de ejecución (pendiente global)
1. **T8** (sombra degradada cards, ya en F43)
2. **Fase 46** (U1 → U2 → U3)
3. **Fase 44** (datos onboarding; **A5** ya cubre el hallazgo P8 del peso en lb)
4. **Fase 45** (i18n)

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

## Fase 47 — Reducción de redundancia (DRY)

> Objetivo: eliminar la información/constantes/lógica que se repite en varios sitios y centralizar en módulos de dominio con nombre (sin cajones genéricos `utils.ts`). Un commit por tarea, prefijo `refactor:`/`fix:`. Criterios por tarea: `npx tsc --noEmit` + `npm run lint` + `npm run build` + `npm test` + entrada en `CHANGELOG.md`. Métrica: jscpd (baseline antes/después).

### Paso 0 — jscpd baseline
- [x] Instalar skill `kucherenko/jscpd@dry-refactoring` (`npx skills add kucherenko/jscpd@dry-refactoring -g -y`)
- [x] Ejecutar jscpd sobre `src/` y registrar el baseline de duplicación (%)
- [x] **Baseline (2026-08-15):** 26 clones / 330 líneas duplicadas / **1.27%** (tsx 2.14%, ts 0.58%) — `jscpd --reporters json --min-lines 10 --min-tokens 30 --ignore "**/*.test.ts" src`, reporte en `report/jscpd-report.json`

### R1 — Vocabulario de dominio de ejercicios
- [x] Nuevo `src/domain/catalog.ts` como única fuente de **grupos musculares, equipamiento y categorías** (+ labels ES/EN)
- [x] Consumido por `types.ts`, `ExerciseFilterBar.tsx`, `useExerciseCatalog.ts`, `MuscleGroupIcon.tsx`, `i18n/catalog/en.ts`, `MuscleDummy.tsx`
- [x] Eliminar `MUSCLE_GROUP_LABELS` muerto (`domain/routines.ts`) y `categoryLabel` muerto (`useExerciseCatalog.ts`); resolver divergencias `'cardio'` (músculo) y `'cuerda'` (equipo)

### R2 — Vocabulario de rutinas centralizado
- [x] Arrays `OBJECTIVES`/`LEVELS` únicos en `domain/catalog.ts`
- [x] `RutinasPage`, `RutinaBuilderPage`, `steps.tsx` (onboarding), `routineMeta.ts` derivan de ahí (eliminar arrays inline duplicados)

### R3 — Constantes de cálculo y platos unificadas
- [x] `MAX_WEIGHT_KG` único (`plates.ts`, `SetRow.tsx`, `OneRepMaxPage`, `ConversorPage`)
- [x] `STANDARD_PLATES` único (`plates.ts` = `PlateCalculatorModal.tsx`)
- [x] `roundToNearestPlate` reutilizado por `converter.ts`
- [x] Umbrales IMC de `ImcPage.tsx` → `domain/calculators/imc.ts`
- [x] `TARGET_BOUNDS` a dominio; `formatVolume` único (`EntrenarPage` reimplementa); MIME avatar exportado desde `lib/avatar.ts`

### R4 — Fechas de workouts locales (+2 fixes de bug)
- [x] Exportar `localDateOf` y unificar `weekStartKey` en `domain/dates.ts`; reemplazar las 9 copias de `w.localDate || toLocalDateStr(...)`
- [x] **Fix:** `insights.ts` pasa de semana-domingo+UTC → semana-lunes+local (usa `weekStartKey` compartida)
- [x] **Fix:** `VolumeRangeCandlestick.tsx` deja de usar `toISOString()` (bug de día anterior)

### R5 — Serie compartida para charts de stats
- [x] Helper de etiqueta de fecha (`formatDate(+ 'T12:00:00', {day,month})`) y uso de `inRange` donde se reimplementa (`BodyWeightChart`, `SkinfoldChart`, `BodyMeasurementsChart`)
- [x] Consolidar agregación semanal en `buildVolumeRangeSeries` (hoy `VolumeChart` y `VolumeRangeCandlestick` la duplican con fuentes de fecha distintas)

### R6 — Repos Dexie con base compartida
- [x] `data/repositories/dexie/base.ts` con `getBySlug`, `getByDate`, `nextId`, esqueleto `upsertByDate`
- [x] Aplicar a `exerciseRepo`, `routineRepo`, `paperRepo`, `guideRepo`, `bodyWeightRepo`, `bodyMeasurementRepo`, `skinfoldRepo`, `workoutRepo`, `workoutSetRepo`

### R7 — Hooks de datos unificados
- [x] `useLiveList` (query → `?? []` con referencia estable) para los ~15 hooks
- [x] Hook genérico de favoritos `useMetaIdFavorites` (funde `useExerciseFavorites`/`useRoutineFavorites`)
- [x] Extraer `enrichItems` en `useRoutines.ts` (bucle ×2-3)

### Cierre
- [x] Re-ejecutar jscpd y reportar reducción vs baseline
- [x] Actualizar `CHANGELOG.md` y marcar checkboxes
- [x] **Tras R1–R7 (2026-08-15):** 25 clones / 318 líneas duplicadas / **1.23%** (tsx 2.23%, ts 0.42%) vs baseline **1.27%** (26 clones / 330 líneas). Clones residuales: JSX corto (11–20 líneas) de charts de cuerpo y formularios de calculadoras, fuera del alcance de R1–R7.
- [x] **Smoke E2E (`test_f47.py`):** 375×812 y 768×1024, 0 errores de consola — `/estadisticas` (volumen accesible), `/rutinas` (favorito con persistencia tras recarga + detalle con items enriquecidos), `/ejercicios` (favorito), `/papers`, `/guias` y `/perfil`.

---

## Fase 48 — Muñeco anatómico 3D (Three.js)

**Objetivo:** sustituir el `MuscleDummy` SVG por un maniquí anatómico 3D con Three.js que muestre la forma de las fibras musculares, manteniendo la misma API y a11y. *(Solicitado explícitamente por el usuario: Three.js. Fuera de la regla «no meter libs nuevas sin pedir».)*

**Decisiones aprobadas (brainstorming, 2026-08-15; revisadas 2026-08-16 tras feedback visual):**
- **Librería:** `three` vanilla (sin `@react-three/fiber`) + `@types/three`. Escena única por página; `setAnimationLoop`, `Raycaster` y `OrbitControls` cubren todo. **Dynamic import** → chunk lazy (~630 KB) solo en `/cuerpo` y ficha de ejercicio.
- **Modelo (revisado 2026-08-16):** el maniquí esculpido por código no convenció visualmente («sigue siendo feo»). Pivot aprobado por el usuario: **atlas anatómico real Z-Anatomy** (`Models-of-human-anatomy`, CC BY-SA 4.0, derivado de BodyParts3D), **reducido a los 10 grupos musculares de la app** y exportado a `public/models/muscles.glb` (203 KB, compresión **Draco**, ~52 K tris tras decimar al 20%). Pipeline en Blender 5.2 headless (`reduce.py`): revelar colecciones del view layer → resolver los `.g` a sus hijos MESH `.l/.r` → reset mundo (single-user data) → join por grupo → `Decimate` → girar 180° en Y (frente del atlas en −Y ⇒ glTF −Z = hacia la cámara) → exportar GLB con `KHR_draco_mesh_compression`. Decodificador Draco servido desde `public/models/draco/`. La app carga el GLB con `GLTFLoader` y mapea cada malla por su nombre al grupo (`userData.muscleGroup`). **Atribución CC BY-SA 4.0 aceptada**: sección «Créditos» en Ajustes con enlace al repo de Z-Anatomy (el usuario pasó de «no voy a hacer mención» a aceptar la línea de crédito). *Descartados `clive520/human-anatomy-explorer` (sin licencia) y BodyParts3D directo (vía Z-Anatomy es suficiente).*
- **Interacción (opción 1):** rotación libre por arrastre (`OrbitControls`, solo rotación, damping, límites de ángulo polar) + tocar un músculo lo selecciona y tocar el vacío lo deselecciona. Botón **reset** para centrar cámara + giro suave inicial. Los botones Frente/Espalda se eliminan (la rotación los sustituye).
- **Paleta (opción 2, escala de calor):** `fresh` = verde `#22c55e` → `warm` = ámbar `#f59e0b` → `fatigued` = naranja `#f97316` → `sore` = rojo `#ef4444`. **Sin datos** = gris neutro `#3a352b` (distinto de «recuperado», mejora sobre el SVG). Selección/resaltado = dorado `#FDDDB4`.
- **a11y:** canvas `role="img"` + chips de los 10 grupos tabulables debajo (equivalente al teclado del SVG) que disparan la misma selección + `aria-live` al seleccionar.
- **Robustez:** detección WebGL; si no hay soporte → fallback al SVG `MuscleDummy` actual. Respetar `prefers-reduced-motion`. Carga asíncrona del GLB (`mannequin.ready`): el estado de fatiga/selección se reaplica al terminar.

### Tareas
- [x] `three` + `@types/three` en `package.json`
- [x] `src/domain/muscleColors.ts` — paleta de calor pura (`fatigueToColor`) + test unitario
- [x] `src/three/mannequin.ts` — constructor del maniquí: **carga el atlas Z-Anatomy reducido** (`public/models/muscles.glb`, Draco), normaliza escala/orientación y etiqueta cada malla (`userData.muscleGroup`). Revisado 2026-08-16: sustituye el maniquí esculpido por código por el GLB real.
- [x] `src/three/scene.ts` — renderer/cámara/luces/`OrbitControls`/raycaster/reset/`update()`/dispose
- [x] `src/components/body/MuscleDummy3D.tsx` — canvas + hint + reset + chips a11y + leyenda + fallback WebGL
- [x] i18n `es`/`en`: claves `cuerpo.gira`, `cuerpo.centrar`, `cuerpo.selMusculo`…
- [x] Integrar en `CuerpoPage` (sin botones frente/espalda) y `EjercicioDetailPage` (highlight)
- [x] **Atribución CC BY-SA 4.0:** sección «Créditos» en `/ajustes` con enlace a Z-Anatomy (2026-08-16)
- [x] **Pipeline del atlas:** `reduce.py` (Blender 5.2 headless) genera `public/models/muscles.glb` + decodificador Draco en `public/models/draco/` (2026-08-16)
- [x] Verificar build / lint / tests (74)
- [x] Smoke E2E `test_f48.py` (375×812 + 768×1024, canvas renderiza, click selecciona, reset, 0 errores)
- [x] CHANGELOG + commit

---


## Fase 49 — Clean UI: Eliminar efecto "bloques"

> **Objetivo:** las páginas secundarias (Estadísticas, Calculadoras, Más, Ajustes, Perfil) se ven como un muro de tarjetas idénticas. Reducir el peso visual de los paneles, variar el ritmo y eliminar wrappers innecesarios.

### Problema raíz

La clase `panel` (`index.css:273-285`) es visualmente pesada (gradiente + borde dorado + sombra profunda) y se usa para todo: desde filas de ajustes hasta contenedores de gráficos. En páginas secundarias se apilan 8-15 paneles idénticos → efecto "muro de tarjetas". Home y Rutinas se ven bien porque usan variedad visual (hero con foto, photos en cards, ritmo variado).

### Tareas

#### 1. CSS: Nuevas clases de panel
- [x] Crear `.panel-light` en `index.css`: bg-elevated, border-border/40, sin gradiente ni sombra
- [x] Crear `.panel-flush` en `index.css`: solo padding, sin bg/border/shadow
- [x] Actualizar tokens en `DESIGN.md` con las nuevas elevation levels

#### 2. EstadisticasPage + sub-componentes
- [x] `EntrenamientoStats.tsx`: 7 section panels → `panel-light` (StatCards mantienen `panel`)
- [x] `CuerpoStats.tsx`: 6 panels → `panel-light`
- [x] Heading de charts: mantener kicker `uppercase` pero con menos padding

#### 3. CalculadorasPage
- [x] 8 calculator cards: `panel` → `panel-light` (son navegación, no contenido hero)
- [x] Icon circles `bg-bg` → eliminar fondo anidado
- [x] Plate calculator: mantener `panel` (es el CTA principal)

#### 4. MasPage
- [x] Grip view: `rounded-2xl border bg-bg-elevated` → `panel-flush` con `border-b border-border/30`
- [x] List view: `panel rounded-2xl` → `panel-flush` con `border-b border-border/30`
- [x] Icon circles `bg-bg` → `bg-bg-elevated`
- [x] Info banners: `panel-light`

#### 5. AjustesPage
- [x] 4 secciones principales: `panel` → `panel-light`
- [x] Sub-paneles anidados: eliminar wrapper → contenido inline con `pt-3 border-t border-border/30`
- [x] Palette/theme buttons: mantener `rounded-2xl border`
- [x] Footer banners: `panel-light`

#### 6. PerfilPage
- [x] 4 stat cards: mantener `panel` (hero stats)
- [x] Volume chart + PRs table + timeline: `panel` → `panel-light`

#### 7. PesoCorporalPage
- [x] Latest weight summary: mantener `panel` (hero)
- [x] Registration form + chart: `panel` → `panel-light`
- [x] History list: `panel` → `panel-flush` con dividers

#### 8. EjerciciosPage + GuiasPage
- [x] List items: `panel rounded-xl` → `panel-flush` con `border-b border-border/20`

#### 9. Verificación
- [x] Playwright 375×812: páginas limpias, sin "muro de tarjetas"
- [x] Home y Rutinas no cambiaron (deben mantenerse igual)
- [x] Modo día y noche + 5 paletas
- [x] `tsc --noEmit` + `npm run build`
- [x] CHANGELOG + commit

---

## Fase 50 — Premium Chart System (rediseño radical)

> **Objetivo:** convertir los 14 gráficos de "gráficos estáticos con tooltip" en **paneles de insights interactivos tipo app de salud premium** — cada chart se convierte en un **ChartCard** con métricas resumen, trend indicators, goal overlays, comparativas de período, y drill-down al tocar.

### Visión

```
┌─────────────────────────────────────────┐
│  ChartCard (premium shell)              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Stat 1  │ │ Stat 2  │ │ Stat 3  │   │  ← AnimatedCountUp + trend arrow
│  └─────────┘ └─────────┘ └─────────┘   │
│  ┌─────────────────────────────────┐    │
│  │  RangeSlider (segmented)        │    │  ← Sliding indicator, 44px targets
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │     Chart (glassmorphic)        │    │  ← Gradient premium, goal line,
│  │     + crosshair tooltip         │    │     period comparison ghost
│  │     + tap → drill-down          │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  Trend badge: ↑ 12% vs semana   │    │  ← Insight contextual
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Fase 50 — Consistencia base (completada)

<details><summary>Sub-fases completadas (tokens, heights, touch targets, tooltips, renames)</summary>

#### 1. Paleta de colores para gráficos (token-based)
- [x] Crear `domain/chartTokens.ts`: paleta de 9 colores derivada de tokens del tema
- [x] Los 9 colores deben funcionar en todas las paletas (gold/energy/crimson/electric/violet/gray) × 2 temas
- [x] Reemplazar PALETTE hardcodeada en `VolumeByMuscleDonut.tsx:16` y `VolumeByMuscleChart.tsx:17`

#### 2. Unificar heights y YAxis
- [x] Area charts: 220px (todos iguales)
- [x] Bar charts: 240px (todos iguales)
- [x] Donuts: 200px (reducir de 240)
- [x] YAxis width: 36px para todos
- [x] LabelList fontSize: 11px para todos

#### 3. Fix touch targets
- [x] `RangePills`: `min-h-[44px]` + padding `py-2.5`
- [x] Unificar 3 selectors inline → usar `RangePills`
- [x] Spanish hardcodeado → i18n keys

#### 4. Tooltip consistente
- [x] Donuts: `labelStyle={{ color: colors.muted }}`
- [x] Unificar `contentStyle` vía `chartStyle.ts`

#### 5. Wrapper + limpieza
- [x] `VolumeByMuscleChart` → `AnimatedBarChart`
- [x] Renombrar `LoadRangeCandlestick` → `LoadRangeChart`, `VolumeRangeCandlestick` → `VolumeRangeChart`
- [x] `E1rmChart`: agregar `CartesianGrid`
</details>

### Fase 50A — Foundation premium (componentes base)

> **Objetivo:** crear los componentes compartidos que todos los charts usarán.

#### 1. `ChartCard` — shell premium glassmorphic
- [x] Nuevo `src/components/stats/ChartCard.tsx`
- [x] Estética: `backdrop-blur-md bg-white/5 dark:bg-white/[0.03] border border-border/40 rounded-2xl p-4`
- [x] Sombra: `shadow-[0_2px_20px_rgba(0,0,0,0.15)]` sutil
- [x] Header con `title` + `subtitle` (i18n)
- [x] Slot `stats` — array de `{ value, label, trend?, icon? }` → renderiza `StatRow`
- [x] Slot `actions` — para RangeSlider, filtros, toggles
- [x] Slot `children` — el chart
- [x] Slot `footer` — para trend badges, insights
- [x] Respeta `prefers-reduced-motion`

#### 2. `StatRow` — métricas resumen animadas
- [x] Nuevo `src/components/stats/StatRow.tsx`
- [x] `AnimatedCountUp`: número que anima de 0 al valor real (ease-out, 600ms)
- [x] Trend arrow: `↑ 12%` / `↓ 5%` / `—` con color (green/red/muted)
- [x] Layout: fila horizontal, scroll si >3 stats, `gap-3`
- [x] Cada stat: `flex flex-col items-center min-w-[72px]`

#### 3. `TrendBadge` — insight contextual
- [x] Nuevo `src/components/stats/TrendBadge.tsx`
- [x] Props: `value: number`, `label: string`, `tone: 'positive' | 'neutral' | 'alert'`
- [x] Estilo: pill con icono flecha + texto, bg adaptativo (`success/10`, `muted/10`, `danger/10`)
- [x] Animación de entrada (slide up + fade)

#### 4. `RangeSlider` — selector de período rediseñado
- [x] Nuevo `src/components/stats/RangeSlider.tsx`
- [x] Reemplaza `RangePills` visualmente (mismo API: `value`, `onChange`, `options`)
- [x] Estilo: contenedor con bg-elevated, indicator deslizante animado (spring)
- [x] 44px touch target por defecto
- [x] Soporta 2-5 opciones

#### 5. `InteractiveChart` — wrapper con interactividad
- [x] Nuevo `src/components/stats/InteractiveChart.tsx`
- [x] Extiende `AnimatedAreaChart`/`AnimatedBarChart` con:
  - Crosshair vertical en hover (linea punteada + dot)
  - Tooltip personalizado con glassmorphic backdrop
  - `onBarClick` / `onDotClick` para drill-down
  - `comparisonData` → renderiza línea ghost (stroke punteado, opacity 0.4)
  - `goalValue` → `ReferenceLine` con label "Objetivo"
  - `averageValue` → `ReferenceLine` punteada con label "Promedio"
- [x] Responsive: en mobile, tooltip se muestra arriba (no tapa el dato)

#### 6. `DrillDownPanel` — panel expandible
- [x] Nuevo `src/components/stats/DrillDownPanel.tsx`
- [x] Se expande debajo del chart al tocar un bar/dot
- [x] Muestra detalles: fecha, valor exacto, comparación con anterior, PR si aplica
- [x] Animación accordion (height transition)
- [x] Botón cerrar (X)

### Fase 50B — Volume charts (rewrites)

> **Objetivo:** reescribir charts de volumen con ChartCard + interactividad.

#### 1. `VolumeRangeChart` rewrite
- [x] Envolver en `ChartCard` con stats: volumen total semana, promedio, tendencia
- [x] `RangeSlider` para 30d/90d/all
- [x] `comparisonData`: semana anterior (ghost line)
- [x] `goalValue`: volumen promedio de las 4 semanas anteriores (auto-goal)
- [x] Tap en bar → `DrillDownPanel` con detalle de la semana
- [x] `TrendBadge`: "↑ 15% vs semana anterior"

#### 2. `VolumeByMuscleChart` rewrite
- [x] Envolver en `ChartCard` con stats: volumen total, músculo top, distribución
- [x] Tap en bar → filtrar por ese músculo en `VolumeByMuscleDonut`
- [x] `comparisonData`: período anterior por grupo muscular
- [x] Animación de entrada stagger mejorada

#### 3. `VolumeByMuscleDonut` rewrite
- [x] Envolver en `ChartCard` con stats: volumen total, % músculo dominante
- [x] Tap en sector → highlight + info panel
- [x] Leyenda interactiva (tap para ocultar/mostrar grupo)
- [x] Centro: total con `AnimatedCountUp`

### Fase 50C — Body charts (rewrites)

> **Objetivo:** reescribir charts de composición corporal.

#### 1. `BodyWeightChart` rewrite
- [x] Envolver en `ChartCard` con stats: peso actual, cambio vs mes, BMI
- [x] `goalValue`: peso objetivo (si se define en perfil)
- [x] `comparisonData**: mes anterior
- [x] `TrendBadge`: "↓ 2.3 kg este mes"
- [x] Tap en dot → detalle con fecha + nota si existe

#### 2. `BodyMeasurementsChart` rewrite
- [x] Envolver en `ChartCard` con stats: medida actual, cambio, tendencia
- [x] Selector de zona integrado en `ChartCard.actions`
- [x] `comparisonData**: período anterior
- [x] Tap en dot → detalle

#### 3. `SkinfoldChart` rewrite
- [x] Envolver en `ChartCard` con stats: % grasa actual, cambio, categoría
- [x] `goalValue`: objetivo de % grasa
- [x] Zonas de riesgo coloreadas (ReferenceArea)
- [x] `TrendBadge` con categoría actual

#### 4. `CompositionChart` rewrite
- [x] Envolver en `ChartCard` con stats: grasa kg, magra kg, ratio
- [x] `comparisonData**: período anterior
- [x] Legend interactiva

#### 5. `CompositionDonut` rewrite
- [x] Envolver en `ChartCard` con stats: % grasa, kg grasa, kg magra
- [x] Tap en sector → info
- [x] Centro: % con `AnimatedCountUp`

### Fase 50D — Training charts (rewrites)

> **Objetivo:** reescribir charts de rendimiento.

#### 1. `LoadRangeChart` rewrite
- [x] Envolver en `ChartCard` con stats: PR actual, promedio, progresión
- [x] PR marker: `ReferenceDot` en el punto más alto con label "PR"
- [x] `comparisonData**: período anterior
- [x] Tap en dot → detalle con sets de esa sesión

#### 2. `FrequencyChart` rewrite
- [x] Envolver en `ChartCard` con stats: sesiones esta semana, promedio semanal, racha
- [x] `goalValue`: `profile.weeklyGoal` (ya existe `weeklyGoalProgress`)
- [x] `TrendBadge`: "3/4 sesiones esta semana"

#### 3. `E1rmChart` rewrite
- [x] Envolver en `ChartCard` con stats: 1RM actual, cambio, PR
- [x] PR marker en el punto más alto
- [x] `comparisonData**: período anterior
- [x] Tap en dot → detalle

#### 4. `ImcChart` rewrite
- [x] Envolver en `ChartCard` con stats: IMC actual, categoría, cambio
- [x] `ReferenceArea` con zonas de IMC (bajo/peso normal/sobrepeso/obesidad)
- [x] `goalValue`: IMC objetivo
- [x] `TrendBadge` con categoría

#### 5. `RatiosChart` rewrite
- [x] Envolver en `ChartCard` con stats: WHtR actual, WHR actual, riesgo
- [x] `ReferenceLine` en umbral de riesgo (0.5 WHtR)
- [x] `comparisonData**: período anterior

### Fase 50E — Integración + testing

> **Objetivo:** conectar todo, verificar, changelog.

#### 1. Integración en pages
- [x] `EstadisticasPage`: envolver cada chart en `ChartCard`
- [x] `PerfilPage`: envolver charts de perfil en `ChartCard`
- [x] `CuerpoPage`: envolver charts de cuerpo en `ChartCard`
- [x] Verificar que `chartStyle.ts` se actualiza con estilos premium
- [x] Verificar que `chartTokens.ts` se actualiza si es necesario

#### 2. i18n
- [x] Nuevas claves: `stats.vsAnterior`, `stats.objetivo`, `stats.promedio`, `stats.tendencia`, `stats.detalle`
- [x] Actualizar `es.ts` y `en.ts`

#### 3. Testing visual
- [x] Verificar en 375×812 (mobile), 768×1024 (tablet)
- [x] Verificar en ambas paletas × 2 temas
- [x] Verificar `prefers-reduced-motion`
- [x] Verificar que touch targets ≥ 44px

#### 4. Verificación final
- [x] `tsc --noEmit` + `npm run build`
- [x] CHANGELOG.md actualizado
- [x] PLAN.md checkboxes marcados
- [x] Commit + push

---

## Fase 51 — Journal de sesión (bitácora post-entreno)

> **Objetivo:** después de cada sesión, registrar energía, sueño, ánimo y dolor. Alimenta recovery score, insights y dashboard de progreso.

### Tareas

#### 1. Dominio y tipos
- [x] `SessionJournalEntry` en `types.ts` (workoutId, energy, sleep, mood, soreness, note, createdAt)
- [x] Tabla Dexie `sessionJournals` (v5, índice por `workoutId`)

#### 2. Repositorio + hook
- [x] Interface `SessionJournalRepository` (getByWorkout, upsert, delete) + Dexie impl
- [x] `useSessionJournal.ts`

#### 3. UI en sesión activa
- [x] Sheet/modal post-entreno al finalizar (después del resumen)
- [x] Sliders 1-5 para: energía, sueño, ánimo, dolor muscular
- [x] Nota libre opcional → guardar asociado al `workoutId`

#### 4. Integración en historial
- [x] Mostrar resumen del journal en `SesionPage` (detalle pasada)
- [x] Timeline de perfil muestra datos del journal

#### 5. Insights (domain)
- [x] `domain/journalInsights.ts`: correlación sueño/energía vs rendimiento
- [x] InsightCard en Home: "Duermes mejor → rendimiento +12%"

#### 6. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 52 — Recovery Score ("¿Entreno hoy?")

> **Objetivo:** score 0-100 basado en días desde último entreno, sueño, dolor y racha. Resuelve la pregunta diaria.

### Tareas

#### 1. Dominio
- [x] `domain/recoveryScore.ts` (puro): score basado en días sin entrenar, sueño (journal), dolor (journal), racha
- [x] Clasificación: "Listo" (≥70), "Podría entrenar" (40-69), "Mejor descansa" (<40)
- [x] Tests unitarios

#### 2. UI en Home
- [x] Chip/card con score y recomendación (verde/ámbar/rojo)
- [x] Click expande desglose

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 53 — Notificaciones push

> **Objetivo:** recordatorios de entrenamiento, suplementos y rachas vía PWA push.

### Tareas

#### 1. Infra
- [x] Service worker + permisos de notificación
- [x] Configuración de recordatorios en Ajustes

#### 2. Triggers
- [x] Hora de entrenar (configurable)
- [x] "Llevas 3 días sin entrenar"
- [x] "Tu racha va a expirar"

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 54 — Vista semanal en Home

> **Objetivo:** mostrar la rutina semanal completa en el dashboard (Lun pecho, Mar espalda, Mié descanso...).

### Tareas

#### 1. UI
- [x] Sección en Home con días de la semana y qué toca cada uno
- [x] Resaltar el día actual
- [x] Click → detalle de rutina o iniciar sesión

#### 2. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 55 — Resumen semanal automático

> **Objetivo:** reporte generado cada domingo con métricas clave y comparación con semana anterior.

### Tareas

#### 1. Dominio
- [x] `domain/weeklySummary.ts`: generar resumen de la semana (sesiones, volumen, PRs, streak, mejor día)
- [x] Comparación con semana anterior (flechas ↑↓)

#### 2. UI
- [x] `WeeklySummary.tsx`: tarjeta en Home con resumen
- [x] "Tu mejor semana en 2 meses" / "Bajaste volumen vs semana pasada"
- [x] Generar y cachear en Dexie

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 56 — Dashboard de progreso inteligente

> **Objetivo:** vista unificada que muestra tendencia de fuerza, composición corporal y frecuencia en un solo lugar con narrativa.

### Tareas

#### 1. UI
- [x] `ProgressDashboard.tsx`: vista unificada en Home
- [x] Tarjetas: streak, hábitos, volumen semanal, tendencia fuerza
- [x] Sparklines para métricas clave (30 días)
- [x] Narrativa: "Tu fuerza subió 8%, tu frecuencia bajó"
- [x] Integrar resumen semanal (fase 75)
- [x] Pull-to-refresh

#### 2. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 57 — Detección de estancamiento

> **Objetivo:** analizar patrones de entrenamiento para identificar cuando dejaste de progresar y sugerir cambios.

### Tareas

#### 1. Dominio
- [x] `domain/plateauDetector.ts`: analiza últimos 30-60 días por ejercicio
- [x] Criterios: < 2% mejora en e1rm en 4 semanas = estancamiento
- [x] Sugerencias: "Prueba volumen", "Cambia variante", "Deload"

#### 2. UI
- [x] Alerta en dashboard: "Llevas 3 semanas sin subir en sentadilla"
- [x] Mostrar en `ProgressDashboard` (fase 76)

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 58 — Comparación con yo del pasado

> **Objetivo:** vista "hace 1 mes / 3 meses / 6 meses" mostrando fuerza, volumen, composición corporal.

### Tareas

#### 1. UI
- [x] `PastSelfView.tsx`: selector de período (1, 3, 6 meses)
- [x] Métricas: fuerza (e1rm promedio), volumen, composición corporal
- [x] Visual: barras lado a lado o gauge con delta
- [x] "Tu sentadilla subió 15kg en 3 meses"

#### 2. Integración
- [x] Conectar con datos existentes de e1rm, peso, measurements

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 59 — Proyección de objetivos

> **Objetivo:** proyectar cuándo alcanzarás tu siguiente objetivo basado en tu tasa de progreso actual.

### Tareas

#### 1. Dominio
- [x] `domain/goalProjection.ts`: calcula fecha estimada de próximo hit
- [x] Basado en tasa de mejora de e1rm de últimos 30 días
- [x] Ajuste automático si la mejora se desacelera

#### 2. UI
- [x] Tarjeta en dashboard con fecha estimada
- [x] "A este ritmo, alcanzarás 100kg en banca en ~6 semanas"

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 60 — Workout timer avanzado

> **Objetivo:** temporizador de sesión con rondas para AMRAP, EMOM, Tabata, For Time. Integra cardio (duración/distancia/calorías).

### Tareas

#### 1. Dominio
- [x] `domain/roundTimer.ts`: configuración de rondas (trabajo/descanso/reps)
- [x] `domain/cardio.ts`: calorías (METs × peso × tiempo), ritmo

#### 2. UI
- [x] `WorkoutTimer.tsx`: modos Tabata (20/10), EMOM, AMRAP, For Time, Custom
- [x] Configurar: trabajo, descanso, rondas, rondas totales
- [x] Visual: círculo de progreso grande, colores por fase (trabajo=verde, descanso=amarillo)
- [x] Audio: beep al cambio de fase, vibración en móvil
- [x] Historial de sesiones de timer

#### 3. Cardio en sesión
- [ ] Campo alternativo en `SetRow` cuando `category === 'cardio'`: duración + distancia
- [ ] Auto-calcular calorías y ritmo
- [ ] Gráfico de progreso distancia/tiempo/ritmo por ejercicio en estadísticas

#### 4. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 61 — Rest timer / descanso óptimo

> **Objetivo:** timer de descanso con recomendación basada en ejercicio, intensidad y objetivo.

### Tareas

#### 1. Dominio
- [x] `domain/restRecommendation.ts`: cálculo de descanso óptimo
- [x] Compuesto pesado 3-5min, aislamiento 60-90s (ajustable por RPE)

#### 2. UI
- [x] `RestTimer.tsx`: componente inline en sesión de entrenamiento
- [x] Timer visual con countdown circular
- [x] Acceso rápido desde `WorkoutPage`

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 62 — Calentamiento guiado

> **Objetivo:** rutina de 5 min con ejercicios dinámicos antes de empezar.

### Tareas

#### 1. Seed + dominio
- [x] Plantilla de calentamiento general (saltos, sentadillas sin peso, rotaciones)
- [x] `domain/warmup.ts`: secuencia con temporizador

#### 2. UI
- [x] Flujo guiado al iniciar sesión (antes de ejercicios)
- [x] Temporizador por ejercicio + avance automático

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 63 — Sugerencias inteligentes en sesión

> **Objetivo:** overlay contextual durante entreno que sugiere ajustes basados en datos de la sesión.

### Tareas

#### 1. Dominio
- [x] `domain/sessionSuggestions.ts`: analizar series completadas, peso, RPE, tiempo
- [x] Sugerencias: "Sube 2.5kg" / "Descansa 3 min" / "Cambia a X"

#### 2. UI
- [x] `SessionSuggestions.tsx`: overlay contextual
- [x] Basado en patrones del usuario (no genérico)
- [x] Mostrar al final de cada serie, dismissable

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 64 — Repetir último workout

> **Objetivo:** repetir la última vez que hiciste un día de rutina con los mismos pesos/reps.

### Tareas

#### 1. Lógica
- [x] Buscar último workout del mismo `rutinaDayId`
- [x] Cargar ejercicios con pesos/reps del último intento

#### 2. UI
- [ ] Botón "Repetir última sesión" en detalle de rutina
- [ ] Precargar datos como `useSessionPreload`

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 65 — Templates de sesión rápida

> **Objetivo:** rutinas pre-armadas de 15-20 min para días con poco tiempo. Incluye flujos de estiramientos/movilidad.

### Tareas

#### 1. Seed
- [x] Categorías: Full body express, Solo pierna, Solo upper, Core express
- [x] 4-6 rutinas de estiramientos/movilidad: full body, piernas, espalda, cuello/hombros, pre-sleep, movilidad articular

#### 2. UI
- [x] `QuickTemplates.tsx`: lista de templates
- [x] Flujo guiado de estiramientos: nombre + instrucción + temporizador (30-60s)
- [x] Avance automático o manual
- [x] Completar → marcar en calendario
- [x] Crear/editar/eliminar templates custom
- [x] Botón "Empezar rápido" en Home

#### 3. Persistencia
- [ ] Guardar en Dexie: `workoutTemplates` table

#### 4. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 66 — Selector por equipamiento

> **Objetivo:** filtrar ejercicios según equipamiento disponible para evitar frustración.

### Tareas

#### 1. UI
- [x] `EquipmentFilter.tsx`: chips con iconos de equipo
- [x] Equipamiento: barra, mancuernas, polea, máquina, peso corporal, kettlebell, bandas
- [x] Guardar selección en localStorage (persiste entre sesiones)

#### 2. Integración
- [ ] Filtrar catálogo de ejercicios según equipamiento seleccionado
- [ ] Integrar en `EjerciciosPage` y `WorkoutPage`

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 67 — Planificador por objetivo + equipamiento

> **Objetivo:** wizard que genera rutina semanal completa según nivel, objetivo y equipamiento disponible.

### Tareas

#### 1. UI
- [x] `RoutinePlanner.tsx`: wizard de 3 pasos
  1. Nivel: principiante/intermedio/avanzado
  2. Objetivo: fuerza/volumen/resistencia/definición/general
  3. Equipamiento: (reutilizar filtro de fase 66)

#### 2. Dominio
- [x] Algoritmo: basado en volumen óptimo por nivel y frecuencia
- [x] Output: rutina semanal completa con progresión

#### 3. Integración
- [ ] Guardar como template (conectar con fase 65)

#### 4. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 68 — Retos dinámicos adaptativos

> **Objetivo:** retos personalizados que se ajustan a tu nivel y progreso actual.

### Tareas

#### 1. Dominio
- [x] `domain/challenges.ts`: retos basados en historial
- [x] Tipos: frecuencia, volumen, PR, consistencia
- [x] Duración configurable: 1 semana, 2 semanas, 1 mes

#### 2. UI
- [x] `DynamicChallenges.tsx`: retos activos + disponibles
- [x] Progreso visual: barra de avance, completado con animación
- [ ] Recompensa: badge/logro al completar

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 69 — Comparación de sesiones

> **Objetivo:** seleccionar dos sesiones y verlas lado a lado con deltas.

### Tareas

#### 1. UI
- [x] `SessionComparison.tsx`: selector de dos sesiones desde historial
- [x] Vista lado a lado: fecha, duración, volumen, ejercicios, PRs
- [x] Delta: +/− en volumen, PRs, duración

#### 2. Integración
- [ ] Integrar en `HistorialPage` o `WorkoutPage`

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 70 — Benchmark tests

> **Objetivo:** tests predefinidos de fuerza con tracking de mejora cada 4-8 semanas.

### Tareas

#### 1. Dominio
- [x] Tests: 1RM estimado en sentadilla, banca, peso muerto
- [x] Tabla Dexie `benchmarkResults`

#### 2. UI
- [x] `BenchmarkTests.tsx`: lista de tests + registrar resultado
- [ ] Gráfico de evolución (reutilizar E1rmChart)
- [ ] Comparar con percentiles de fase 94
- [ ] Recordatorio de test periódico (cada 4-8 semanas)

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 71 — Estándares de fuerza (percentiles)

> **Objetivo:** comparar tu rendimiento con percentiles por peso/sexo/edad (datos reales de powerlifting).

### Tareas

#### 1. Dominio
- [x] `domain/strengthStandards.ts`: tabla de percentiles por peso/sexo/edad
- [x] Datos reales de powerlifting (IPF, USAPL databases)
- [x] Ejercicios: sentadilla, banca, peso muerto, press militar

#### 2. UI
- [x] Input: peso corporal + e1rm del ejercicio → Output: percentil
- [x] Visual: gauge o barra con marcas (principiante/intermedio/avanzado/élite)

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 72 — Periodización visual

> **Objetivo:** planificación de mesociclos con progreso visual (hipertrofia → fuerza → deload).

### Tareas

#### 1. Dominio
- [x] `domain/periodization.ts`: modelo de mesociclos (nombre, duración, tipo, semanas)

#### 2. UI
- [x] `PeriodizationView.tsx`: vista de calendario con mesociclos
- [ ] Drag & drop de bloques para planificar
- [x] Vista de progreso: semana actual vs planificada

#### 3. Integración
- [ ] Conectar con SmartRoutines (fase 89) para auto-sugerir mesociclos

#### 4. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 73 — Frecuencia muscular vs objetivo

> **Objetivo:** "esta semana entrenaste pecho 2×, espalda 1×, pierna 0×" vs objetivo. Alertas de desbalance.

### Tareas

#### 1. Dominio
- [x] `domain/muscleFrequency.ts`: frecuencia semanal por grupo vs objetivo configurable

#### 2. UI
- [x] Sección en `/estadisticas` o Home con barras de frecuencia vs objetivo
- [x] Alerta cuando >20% diferencia

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 74 — Balance push/pull/pierna

> **Objetivo:** análisis de equilibrio push/pull/legs con alertas de desequilibrio.

### Tareas

#### 1. Dominio
- [x] `domain/pushPullBalance.ts`: clasificar ejercicios, calcular volumen por categoría

#### 2. UI
- [x] Donut o barras de balance push/pull/legs en estadísticas
- [x] Alerta por desequilibrio significativo

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 75 — Exportar sesión como imagen

> **Objetivo:** imagen shareable con resumen de sesión para redes sociales.

### Tareas

#### 1. Generación
- [x] Canvas con fecha, duración, volumen, ejercicios principales, PRs

#### 2. UI
- [x] Botón "Compartir" en detalle de sesión
- [x] Descargar imagen o Web Share API

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 76 — Nutrición

> **Objetivo:** registro simple de comidas con búsqueda de alimentos comunes y resumen kcal/macros vs TDEE.

### Tareas

#### 1. Dominio
- [x] `FoodItem` (id, name, kcal, proteinG, carbsG, fatG) + `MealEntry` (localDate, mealType, items, note)
- [x] Tabla Dexie `mealEntries` (v7, índice por `localDate`)
- [x] `domain/nutrition.ts`: seed ~40 alimentos comunes + totales diarios

#### 2. Repositorio + hook
- [ ] `MealRepository` (getAll, getByDate, upsert, delete) + `useMeals.ts`

#### 3. Página `/nutricion`
- [x] Resumen diario: kcal vs TDEE (barra), macros vs objetivo
- [x] Formulario: buscar alimento → cantidad → agregar
- [x] Historial de comidas del día
- [ ] Integración con calculadora TDEE existente

#### 4. Navegación + i18n + verificación
- [ ] Link en hub "Más" + keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 77 — Suplementación

> **Objetivo:** tracking de suplementos comunes con dosis, frecuencia y recordatorios.

### Tareas

#### 1. Dominio
- [x] `SupplementEntry` (name, dose, frequency, timeOfDay) + tabla Dexie `supplements`
- [x] Seed: creatina, proteína, cafeína, vitamina D, omega-3, multivitamínico, BCAA, citrulina

#### 2. Página `/suplementos`
- [x] Lista de suplementos activos + agregar/editar/eliminar
- [x] Check diario de tomas + recordatorios (push si PWA soporta)

#### 3. Integración + i18n + verificación
- [ ] Link en hub "Más" + conectar con guías de suplementos
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 78 — Logros extendidos

> **Objetivo:** ampliar sistema de logros (8 actuales → 15+).

### Tareas

#### 1. Nuevos logros
- [x] "Primera sesión de cardio", "100 ejercicios diferentes", "Racha 100 días"
- [x] "Subir 10kg en un ejercicio", "Completar todas las guías", "500 sesiones", "1 año"

#### 2. Página `/logros`
- [x] Todos los logros (desbloqueados + pendientes) con progreso

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 79 — Fotos de progreso

> **Objetivo:** registrar fotos corporales (frente/lateral/espalda) por fecha, comparar entre fechas, y visualizar la evolución física.

### Tareas

#### 1. Dominio y tipos
- [x] `ProgressPhotoEntry` en `types.ts` (id, localDate, frontUri, sideUri, backUri, note, createdAt)
- [x] Tabla Dexie `progressPhotos` (v5, índice por `localDate`)

#### 2. Repositorio
- [x] Interface `ProgressPhotoRepository` (getAll, getByDate, upsert, delete)
- [x] Implementación Dexie `progressPhotoRepo.ts`
- [x] Exportar en `repositories/index.ts`

#### 3. Hook
- [x] `useProgressPhotos.ts` — reactivo con `useLiveList`, CRUD

#### 4. Página `/progreso-fotos`
- [x] Captura por ángulo: `<input type="file" accept="image/*">` con `capture` para cámara
- [x] Resize a max 800px antes de guardar
- [x] Miniaturas de fotos recientes + timeline cronológica
- [x] Comparador lado a lado (toggle entre dos fechas)
- [x] Eliminación de entradas + empty state

#### 5. Navegación + i18n
- [x] Link en hub "Más" (icono `Camera`) + ruta lazy + SEO
- [x] Keys `es.ts` / `en.ts`

#### 6. Verificación
- [x] `tsc --noEmit` + `npm run build` + tests
- [x] Playwright 375×812 + 768×1024
- [x] CHANGELOG + commit

---

## Fase 80 — Smart Routines (rutinas adaptativas)

> **Objetivo:** rutinas que ajustan automáticamente pesos y volumen según progreso real.

### Tareas

#### 1. Dominio
- [x] `domain/adaptiveRoutine.ts`: reglas basadas en e1RM, RIR, tendencia de progresión
- [x] Si e1RM subió ≥5% → subir pesos; si fallaste series → reducir volumen

#### 2. Integración
- [x] Toggle "Adaptativa" en rutinas custom
- [x] Al iniciar día: sugerir pesos basados en progreso real
- [x] Conectar con PeriodizationView (fase 92)

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 81 — Importar datos de otras apps

> **Objetivo:** migrar historial desde Strong, Hevy, JEFIT sin perder datos.

### Tareas

#### 1. Parsers
- [x] `ImportDataView.tsx`: selector de app origen
- [x] Parsers CSV para Strong, Hevy, JEFIT
- [x] Mapear a `WorkoutSession`, `ExerciseSet`

#### 2. UI
- [x] Validar y mostrar resumen antes de importar
- [x] Deduplicación: no importar sesiones duplicadas

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 82 — Calculadora Navy (sin picómetro)

> **Objetivo:** estimar % grasa corporal con método de la Marina (peso + medidas, sin equipamiento).

### Tareas

#### 1. Dominio
- [x] `domain/calculators/navy.ts`: fórmulas Navy para hombres y mujeres
- [x] Hombres: peso + cuello + cintura
- [x] Mujeres: cuello + cintura + caderas

#### 2. UI
- [x] `NavyCalculator.tsx`: inputs según sexo
- [x] Mostrar % grasa con rangos de referencia
- [x] Guardar en Dexie para tracking histórico

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 83 — Checklist de técnica

> **Objetivo:** checklist visual de 3-5 puntos clave por ejercicio para verificar forma durante la sesión.

### Tareas

#### 1. UI
- [x] `TechniqueChecklist.tsx`: modal con 3-5 puntos por ejercicio
- [x] Datos: definidos en catálogo de ejercicios o custom
- [x] Toggle rápido por punto, guardado al completar
- [x] Botón flotante en sesión: "Checklist técnica"

#### 2. Persistencia
- [x] Persistir: última sesión mostrada (no molestar si ya vio)

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit

---

## Fase 84 — Wearables (futuro)

> **Objetivo:** sincronizar datos de Apple Watch, Garmin, Fitbit: frecuencia cardíaca, sueño, pasos.

### Tareas

#### 1. Infra
- [x] Investigar APIs disponibles (HealthKit, Google Fit)
- [x] `WearableSyncView.tsx`: selector de dispositivo

#### 2. Sincronización
- [x] Sincronizar: HR, sueño, pasos
- [x] Guardar en Dexie para alimentar recovery y journal

#### 3. i18n + verificación
- [x] Keys es/en + `tsc` + build + tests + CHANGELOG + commit
---

## Intento fallido — Carrusel lateral en sesión activa (Fase 52 experimental)

> **Estado:** revertido. Los archivos volvieron a su estado original (commit `d0c82eb`).
> **Commits revertidos:** `3d3a4eb`, `08f689d`, `70dde7d`, `72408d0`.

### Qué se intentó
Convertir la pantalla de sesión activa (`/entrenamiento/active`) de scroll vertical único a un **carrusel horizontal con un ejercicio por slide** (`scroll-snap`), manteniendo fijos arriba el header (progreso, volumen, tiempo, RestTimer) y abajo los botones "Añadir ejercicio" y "Finalizar entreno".

### Qué se logró (parcialmente)
- Header compacto integrado (BackLink + contador + calculadora de discos en una fila)
- RestTimer compacto (presets + "Iniciar descanso") que se expande al descansar
- Indicador de posición (dots) y contador "Ejercicio X de Y"
- Slide con asomo lateral (`px-3` en contenedor) para affordance de swipe
- Animación de transición con anime.js (direccional, sin parpadeo)
- SetRow compactado para RPE/RIR sin desborde

### Por qué no funcionó
1. **Touch táctil no funciona en móvil real**: los slides del carrusel tenían `overflow-y-auto` pero sin `touch-action` explícito. El navegador en dispositivo real capturaba el gesto para scroll vertical del slide en vez de delegar el pan horizontal al contenedor del carrusel. Se intentó arreglar con `touch-pan-y` en slides e inputs, pero no se pudo verificar con Playwright (CDP touch no produce scroll nativo real — solo funciona en dispositivo físico).

2. **`useGlobalDragScroll` bloqueaba el BackLink**: el hook suprimía clics después de arrastrar desde inputs del carrusel. Se intentó arreglar verificando si el mouseup fue sobre un elemento diferente al mousedown, pero el test de Playwright mostraba que el ConfirmSheet de `confirmLeaveSession` aparecía correctamente — el problema real era que el usuario confundía "no puedo navegar entre ejercicios" (touch roto) con "no puedo salir de la sesión" (confirmación normal).

3. **No se pudo verificar en dispositivo real**: todos los tests con Playwright (CDP `Input.dispatchTouchEvent`, `dispatchEvent` de TouchEvent sintético) fallaron en reproducir el scroll nativo del navegador. El scroll-snap + overflow-x-auto con touch real solo se puede probar en un dispositivo físico, lo que hacía imposible iterar con confianza.

### Lecciones aprendidas
- **Touch nativo vs mouse**: `useGlobalDragScroll` solo maneja eventos de mouse. El scroll táctil es nativo del navegador via `overflow-x-auto` + `scroll-snap`. No se puede simular con dispatchEvent ni CDP.
- **`touch-action` es clave**: para que un carrusel horizontal funcione dentro de un slide con `overflow-y-auto`, el slide necesita `touch-action: pan-y` para delegar el pan horizontal al ancestro.
- **`confirmLeaveSession` puede confundir**: el usuario interpretaba "no puedo salir" como un bug del carrusel, cuando en realidad era el sheet de confirmación funcionando correctamente.

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
