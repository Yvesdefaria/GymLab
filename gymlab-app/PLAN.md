# GymLab App — Plan de implementación

Stack: **Vite + React 18 + TypeScript + Tailwind + Dexie + Zustand + Recharts + PWA → Capacitor (Android)**

Prototipo HTML en `../GymLab/` = solo referencia de marca. No modificar.

---

## Producto

App web mobile-first de entrenamiento:
- Seguimiento de series/reps/peso
- Catálogo de rutinas
- Papers con resumen + fuente oficial
- Perfil (historial, PRs, rachas, gráficos)
- **Calculadoras** (IMC, calorías, y más en el futuro)
- Offline PWA → empaquetar con Capacitor a Android

Datos: **local-first (Dexie)**. Repositorios desacoplados → Supabase en fase 2.

---

## Arquitectura de carpetas

```
gymlab-app/
├── PLAN.md
├── AGENTS.md
├── package.json
├── vite.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── app/                 # router, providers
│   ├── pages/
│   │   ├── EntrenarPage.tsx
│   │   ├── RutinasPage.tsx
│   │   ├── RutinaDetailPage.tsx
│   │   ├── EntrenamientoPage.tsx
│   │   ├── PapersPage.tsx
│   │   ├── PaperDetailPage.tsx
│   │   ├── PerfilPage.tsx
│   │   ├── EjercicioDetailPage.tsx
│   │   └── CalculadorasPage.tsx   # hub de calculadoras
│   ├── components/
│   │   ├── layout/          # AppShell, TabBar, Header
│   │   ├── workout/
│   │   ├── routines/
│   │   ├── papers/
│   │   ├── profile/
│   │   ├── calculators/     # ImcCalculator, TdeeCalculator, ...
│   │   └── ui/
│   ├── domain/              # TS puro (sin React/Dexie)
│   │   ├── types.ts
│   │   ├── volume.ts
│   │   ├── prs.ts
│   │   ├── streak.ts
│   │   └── calculators/     # imc.ts, tdee.ts, (futuro: 1rm, macros...)
│   ├── data/
│   │   ├── seed/
│   │   └── repositories/
│   ├── store/
│   ├── hooks/
│   └── theme/
└── capacitor.config.ts      # fase Capacitor
```

### Capas (Clean Architecture light)

| Capa | Qué | Regla |
|------|-----|-------|
| `domain/` | Lógica pura | Sin React, sin Dexie, portable |
| `data/repositories/` | Persistencia | Hoy Dexie, mañana Supabase |
| `pages/` + `components/` | UI | Cero queries Dexie directas |
| `store/` | Estado efímero | Solo sesión activa (Zustand) |

---

## Site map y URLs

```
/
├── Entrenar (/)                              # tab
│   └── Sesión (/entrenamiento/:id)
├── Rutinas (/rutinas)                        # tab
│   └── Detalle (/rutinas/:slug)
├── Papers (/papers)                          # tab
│   └── Detalle (/papers/:slug)
├── Más (/mas)                                # tab (Perfil + Calculadoras + extras)
│   ├── Perfil (/perfil)
│   ├── Calculadoras (/calculadoras)
│   │   ├── IMC (/calculadoras/imc)
│   │   ├── Calorías TDEE (/calculadoras/calorias)
│   │   └── [futuro: 1RM, macros, agua, % grasa...]
│   └── Ejercicio (/ejercicios/:slug)
├── Privacidad (/privacidad)
└── Términos (/terminos)
```

### Tab bar (mobile) — 4 items

`Entrenar · Rutinas · Papers · Más`

"Más" agrupa Perfil, Calculadoras y biblioteca. Evita saturar la tab bar (>5 items).

Alternativa UX si se prefiere: 5 tabs con Calculadoras como entrada directa; decidir en Fase 1 según espacio.

### Navegación

- Mobile: bottom tab bar (touch ≥ 44×44px, Lucide icons + labels)
- Desktop md+: grids 2–3 cols; misma shell
- Breadcrumbs en detalles
- Footer mínimo: Privacidad · Términos · © GymLab

---

## Design system

**Dirección:** industrial utilitario + OLED dark + deportivo (marca GymLab).

| Token | Hex |
|-------|-----|
| `--bg` | `#121214` |
| `--bg-elevated` | `#242422` |
| `--fg` | `#F8FAFC` |
| `--accent` | `#D9B384` |
| `--accent-soft` | `#FDDDB4` |
| `--cta` | `#F97316` |
| `--success` | `#22C55E` |
| `--danger` | `#EF4444` |
| `--border` | `#374151` |

- Headings: Barlow Condensed o Oswald
- Body: Barlow
- Iconos: Lucide (nunca emoji)
- Motion 150–300ms; `prefers-reduced-motion`
- Charts: Recharts line/area para volumen

---

## Calculadoras

### MVP (esta release)

| ID | Ruta | Input | Output |
|----|------|-------|--------|
| **IMC** | `/calculadoras/imc` | peso (kg), altura (cm) | IMC + categoría OMS + color |
| **Calorías (TDEE)** | `/calculadoras/calorias` | sexo, edad, peso, altura, actividad (Harris-Benedict o Mifflin-St Jeor) | BMR + TDEE + rangos (déficit/mantenimiento/superávit) |

Lógica en `domain/calculators/` (testable, sin UI).  
UI en `components/calculators/` + hub `CalculadorasPage`.

### Futuro (stubs / roadmap)

- 1RM (Epley / Brzycki)
- Macros (protein/carbs/fat por objetivo)
- Agua diaria
- % grasa corporal (Navy method)
- Platos / pace de carrera
- Conversor lb ↔ kg

Cada calculadora nueva = 1 archivo domain + 1 componente + entrada en el hub. Sin tocar el resto.

**Disclaimer UI:** resultados informativos, no consejo médico.

---

## Modelo Dexie

```
exercises, routines, routineDays, routineItems,
workouts, workoutSets, papers, profile
```

Seed: 40+ ejercicios, 8–10 rutinas, 5–6 papers con DOI reales.

Calculadoras **no** requieren tablas (cálculo en cliente). Opcional futuro: guardar últimos inputs en `profile` o `calculatorHistory`.

---

## Fases

### Fase 0 — Docs ✅
- [x] PLAN.md (este archivo)
- [x] AGENTS.md
- [x] CHANGELOG.md

### Fase 1 — Scaffold ✅
- [x] Vite React-TS
- [x] Tailwind + tokens tema
- [x] deps: router, dexie, zustand, recharts, pwa, lucide
- [x] AppShell + TabBar + rutas base (incl. `/calculadoras`)
- [x] PWA mínima
- [x] `npm run build` OK

### Fase 2 — Domain + Data ✅
- [x] types, volume, prs, streak
- [x] domain/calculators: imc, tdee
- [x] Dexie schema + seed + repos
- [x] Provider seed al arranque

### Fase 3 — Entrenar (core)
- [ ] Zustand sesión activa
- [ ] SetRow, RestTimer, guardar workout

### Fase 4 — Rutinas
- [ ] Catálogo + filtros + detalle + Iniciar

### Fase 5 — Papers
- [ ] Lista + detalle + DOI + disclaimer

### Fase 6 — Perfil + Calculadoras
- [ ] Historial, PRs, racha, gráfico volumen
- [ ] Hub calculadoras + IMC + TDEE
- [ ] Biblioteca ejercicios

### Fase 7 — Polish
- [ ] Responsive, a11y, SEO básico, motion, Playwright, build

### Fase 8 — Capacitor Android
- [ ] cap init, add android, sync, safe-area, back button

---

## Fuera de alcance (MVP)

- Auth / Supabase / multi-dispositivo
- Pagos / planes / pasarela
- Entrenadores / blog marketing completo
- iOS (después de Android)

---

## Verificación

| Check | Comando / método |
|-------|------------------|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Types | `npx tsc --noEmit` |
| Persistencia | cerrar pestaña → historial intacto |
| Mobile | DevTools 375×812 |
| Calculadoras | IMC y TDEE dan valores coherentes con fórmulas conocidas |

---

## Skills del proyecto

Usar desde `.opencode/skills/`: frontend-design, ui-ux-pro-max, site-architecture, software-architecture, accessibility, seo, webapp-testing.
