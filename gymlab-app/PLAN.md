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

## Fase 22 — Ajustes, unidades y contraste día

- [ ] Sistema `AppSettings` (domain/settings.ts + metaRepo JSON + `useSettings`).
- [ ] Ajustes por secciones: Apariencia, Sesión, Catálogo, Datos, General.
- [ ] Unidades kg/lb (display; almacenar siempre kg).
- [ ] Contraste modo día revisado (tokens, charts, tooltips).

## Fase 23 — Catálogo: búsqueda, filtros, estiramientos, favoritos, recientes

- [ ] `Exercise.category` (`strength | stretch | cardio | mobility`) + tag estiramientos en seed.
- [ ] Filtro **Estiramientos** + músculo + equipo + “solo con foto”.
- [ ] Favoritos y recientes persistidos.
- [ ] Filtros también en `ExercisePicker`.

## Fase 24 — Sesión inteligente

- [ ] Precarga último peso/reps (ON/OFF + nº series + modo de ajuste de peso).
- [ ] Warm-up sets automáticos (porcentajes configurables).
- [ ] RPE/RIR opcional por serie.
- [ ] Auto-descanso + sonido + vibración (web; nativo en Capacitor).
- [ ] Wake Lock (mantener pantalla encendida).
- [ ] Confirmar al salir de una sesión en curso.
- [ ] Undo al borrar serie/ejercicio (toast).
- [ ] Empty states con CTA.

## Fase 25 — Builder avanzado + notas + plate calc

- [ ] Superseries en builder y sesión (`RoutineItem.supersetGroup`).
- [ ] Notas por ejercicio (tabla `exerciseNotes`).
- [ ] Calculadora de discos (modal en sesión).
- [ ] Home: “Hoy toca D{n} · grupos” más visible.

## Fase 26 — Progreso, PRs, historial, deload + peso corporal

- [ ] PRs con nombre de ejercicio (fix).
- [ ] Historial clickable (detalle sesión pasada).
- [ ] Gráfico e1RM por ejercicio.
- [ ] Deload toggle en programa activo.
- [ ] **Registro de peso corporal** (`bodyWeight` + repo + UI + gráfico por fecha 30/90/todo).

## Fase 27 — Backup + PWA install

- [ ] Export/import JSON (profile, settings, workouts, sets, PRs, customs, favoritos, notas, peso).
- [ ] Prompt “Instalar GymLab” (`beforeinstallprompt`).

## Fase 28 — Catálogo JSON versionado + traducción ES selectiva

- [ ] `public/catalog/exercises-vN.json` con fallback al seed embebido.
- [ ] Renombrar solo nombres absurdos auto-ES; conservar los conocidos en inglés.

## Fase 29 — Dummy rojo en ficha + a11y + calculadoras

- [ ] `MuscleDummy` con músculo destacado en rojo en ficha de ejercicio.
- [ ] A11y: focus visible, labels, empty states.
- [ ] Calculadoras fáciles: **1RM, agua, conversor kg/lb** (macros/%grasa como stubs mejorados).

## Fase 30 — Capacitor Android (último / bajo pedido)

- [ ] `cap init`, Android, safe-area, back button, splash, haptics nativos.

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
