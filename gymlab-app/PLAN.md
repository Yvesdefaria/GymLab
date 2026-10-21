# GymLab App — Plan de implementación

Stack: **Vite + React 18 + TypeScript + Tailwind + Dexie + Zustand + Recharts + PWA → Capacitor (Android)**

Prototipo HTML en `../GymLab/` = solo referencia de marca. No modificar.

Fuente de contenido offline: `../content/training-library/`.

> **Fases totalmente cerradas → `COMPLETED.md`** (no requieren revisión).
> **Este archivo contiene SOLO lo pendiente o por revisar.**

---

## Pendientes de release (validación física + firma)

> El snapshot «Estado verificado — 2026-10-04» se archivó en `COMPLETED.md` (2026-10-11): sus pendientes quedaron resueltos o con hogar propio; los únicos abiertos de su tabla final (F94 y F118) viven en sus secciones de este plan. Acá quedan los parkings de release:

### Solo validación física (no verificable en este entorno)
F73 · F84c (frescura real de Health Connect) · F84d (widgets en teléfono real) · F93 #15 (foto en móvil real) · F101 (teclado IME).

### Anotado para fase futura (pedido del usuario, 2026-10-09)

- [ ] **Firma release propia + APK compartible con actualización limpia** — decisión tomada: clave release **propia** (no la debug). Ejecutar cuando el usuario quiera: (1) crear keystore `android/gymlab-release.jks` (NUNCA commitear; `*.jks` ya está ignorado) + credenciales en `android/keystore.properties` (agregar al `android/.gitignore`; guardar COPIA DE SEGURIDAD del keystore — sin él no hay actualizaciones futuras); (2) cablear `signingConfigs.release` en `android/app/build.gradle` leyendo `keystore.properties` con fallback a debug si no existe (los builds de desarrollo siguen igual); (3) `assembleRelease` → APK firmado para compartir (reemplaza al `GymLab-F84d-debug.apk` del Escritorio); (4) **migración única** (~2 min, datos se conservan): en cada teléfono que tenga la versión actual (debug de esta máquina) → Ajustes → exportar backup (JSON, 28 tablas) → desinstalar → instalar la release → importar backup. De ahí en más: toda versión nueva se instala ENCIMA sin borrar nada (tu teléfono y los que compartas) y la firma queda apta para Play Store. Nota: la build release no es inspeccionable por CDP — el emulador sigue siendo el banco de pruebas con builds debug.

---

## Play Store — revisión de políticas (2026-10-19 · código cerrado 2026-10-21)

Contexto: la web ya publica la política de privacidad y los términos en `https://gymlab.dev/privacidad` y `/terminos` (repo `WebGymLab`, T9/T10). Estado de cada punto para la revisión de Play Console:

- [x] **Health Connect — link de privacidad roto** — `strings.xml` → `https://gymlab.dev/privacidad`. Verificado en emulador-5554: `PermissionsRationaleActivity` carga `https://gymlab.dev/privacidad/` (title «Política de Privacidad — GymLab», body 5.244 chars); el dominio viejo `gymlab.app/privacidad` responde **404** (comprobado con fetch).
- [x] **Divulgación de Health Connect en la política web** — sección 6 «Salud y actividad física» en `WebGymLab/src/pages/privacidad.astro` (12 secciones) y en la política in-app (`privacidad.secciones.salud` + `permisos`, es/en). Deployado (`329ecb3`): la página live ya muestra «Health Connect» y fecha 21-oct, y la rationale del emulador carga esa misma versión (verificado por CDP).
- [ ] **Health apps declaration** en Play Console (App content → Health apps) — **acción del usuario**. Declarar: acceso a Health Connect, tipo «Activity / steps», lectura diaria de pasos + lectura en segundo plano para el widget; uso solo en el dispositivo, sin publicidad, sin venta; permiso revocable por el usuario.
- [ ] **Data safety** — **acción del usuario**. Declaración que refleja el código real:
  - `App activity → App interactions` — recogido · **opcional** (toggle `telemetry`, ON por defecto) · no compartido · cifrado en tránsito.
  - `App info and performance → Crash logs` (Sentry) — recogido · opcional · no compartido · cifrado.
  - `App info and performance → Diagnostics` (PostHog) — recogido · opcional · no compartido · cifrado.
  - `Device or other IDs` (distinct_id anónimo de PostHog) — recogido · opcional · no compartido · cifrado.
  - `Health and fitness`, `Location`, `Personal info`, `Financial info`, `Photos` — **no recogidos** (todo queda en IndexedDB del dispositivo; el `autocapture` de PostHog pasa por `scrubForbiddenKeys`, que borra texto, valores, hrefs y atributos).
  - Ads: **No** (AdMob aún no activo). IAP: **No**.
  - Matiz: Sentry y PostHog son encargados del tratamiento bajo DPA → «no compartido» es defendible; si se prefiere la lectura conservadora, marcarlos como «compartido con proveedores de servicio».
- [x] **Permisos/divulgación** — `PermissionsRationaleActivity` + alias declarados en el manifest y apuntando a la política correcta (verificado en emulador).
- [ ] **Email de contacto** — código unificado a `gymlab@gymlab.dev` (`src/config/contact.ts`, antes `gymlab@app.gymlab.dev`). **Falta el buzón**: `gymlab.dev` no tiene registro MX; crear Email Routing (Cloudflare) o buzón en DonDominio → T9b del plan web. Antes de enviar a revisión.
- [ ] **Titular** — no bloquea Play; sí GDPR. Requiere nombre/razón social y NIF del responsable en la política (dato del usuario, no del código).
- Términos: no son requisito de Play; no bloquean.

**Hallazgo fuera de alcance (misma causa raíz, sin decidir):** `src/hooks/useSeo.ts` (`SITE_URL`) e `index.html` (canonical + `og:url` + `og:image`) siguen apuntando a `https://gymlab.app`, que no es propiedad del proyecto. Falta decidir el host canónico del build web de la app (`app.gymlab.dev` aún no resuelve: `ENOTFOUND`).

---

## Tareas de Fase 93 pendientes

#### [ ] #30 — Crear correo de la app
- [ ] **Requiere intervención del usuario**: crear la cuenta de correo de la app.
- [x] Añadir el correo como contacto en Ajustes / T&C (`/terminos`) / reporte de errores (#29) — cableado con el placeholder `gymlab@app.gymlab.dev` (`src/config/contact.ts`; usado en Términos, Privacidad y ReportBug). Reemplazar por la cuenta real al crearla.
- [ ] Verificación + CHANGELOG + commit.

#### [ ] #22 — Revisión futura: sesión rápida
- [ ] Validar con el usuario que la sesión rápida mantiene el valor/contexto esperado tras su uso real.

#### [ ] #8 — Guías: imágenes
- [ ] Ranura hero en `GuiaDetailPage`; requiere `imageUrl` opcional en `Guide` + assets.

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
| `💪` Flexed Biceps | `src/i18n/locales/es/features.ts` L77 — `footer: 'Entrena con GymLab 💪'` | Sí — footer de la app | Sustituir por imagen/marca IA o eliminar (marca limpia) |
| `💪` Flexed Biceps | `src/i18n/locales/en/features.ts` L77 — `footer: 'Train with GymLab 💪'` | Sí — footer (EN) | Ídem |
| `✓` Check mark | `src/components/workout/WorkoutExerciseBlock.tsx` L80 | Sí — marca de serie completada | Sustituir por icono lucide (`Check`) o image asset; **decisión pendiente en brainstorm de implementación** |
| `↔` Left Right Arrow | `src/i18n/locales/es/core.ts` L185, L216; `en/core.ts` L185, L216 | Sí — título del conversor (texto, no icono) | **Mantener** — es símbolo tipográfico de texto (flecha), no emoji; no renderiza como glifo emoji |
| `↔` (comentarios) | `src/domain/calculators/converter.ts` L1, `src/lib/duration.ts` L1, `src/pages/ConversorPage.tsx` L1 | No — comentarios | No tocar |

**Re-verificación 2026-10-08:** los 3 puntos renderizables siguen presentes (líneas actualizadas en la tabla); no se agregaron emojis nuevos en `src/`.

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

## Fase 100 — Con cuentas: telemetría + sync nube (post-cuentas)

*(Origen: 26 notas de prueba ordenadas y agrupadas en 6 clusters. La exploración de cada fase puede reestructurar estos ítems en tareas concretas; cuando una fase se cierra, marcar sus checkboxes y actualizar CHANGELOG.md.)*

**NOTA: hacerlo más adelante.** Depende de crear cuentas/backend (hoy la app es 100% local-first: Dexie/IndexedDB, PWA, Capacitor; AGENTS.md prohíbe backend en MVP — Supabase futuro sería "nueva impl del mismo interface"). Esta fase se retoma cuando exista el modelo de cuentas.

Notas origen: **#3, #5**

- [ ] **100.1 — Mapa de calor de uso (#3)**: telemetría de qué usan los usuarios para saber en qué mejorar/enfocarse.
- [ ] **100.2 — Sync local ↔ nube (#5)**: al crear la cuenta real, sincronizar la base local con la nube (Supabase) manualmente o periodizado (tipo WhatsApp).

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

## Subtareas opcionales (P3) en fases cerradas

- [ ] **39.D (opc, P3)** — Split archivos >200 líneas: `AjustesPage` (489), `EntrenamientoPage` (449), `EntrenarPage` (415), `RutinaBuilderPage` (379).
- [ ] **46.U3 (opc, P3)** — Virtualizar listado de `RutinasPage` con `@tanstack/react-virtual`
- [x] **123.F (opc, P3)** — Follow-ups del review de F123 cerrados (`9d0183ec`): guard del `getItemKey` (como el `estimateSize`), índice alfa extraído a dominio (`buildAlphabetRows`/`letterOffsetsFromRows`/`letterAtOffset`/`alphabetFor` + `INDEX_*` en `src/domain/exerciseIndex.ts`) con 9 tests unit nuevos y bordes e2e (eñe en el rail, sin resultados, encogimiento por búsqueda). Review `review-6dd3e5a423330734` approved + acknowledged (authority burned).
- [x] **123.F-2 (opc, P3)** — Advisory del review de F123.F: el fallback del `getItemKey` (índice fuera de rango) no tenía test que fallara si se volvía a la forma que lanza. **Cerrado** (`ff910f63`) moviendo la derivación de la clave al dominio (`alphabetRowKeyAt(rows, index)` en `src/domain/exerciseIndex.ts`, con test de índice fuera de rango) y usándolo en `ExercisePicker` y `EjerciciosPage`; el catálogo deja de tener la variante que lanzaba. Verificado: `npm test` 163/1652, `npm run build` limpio, `review assess` medium/under_budget.

## Mejoras identificadas (sin fase asignada)

- **Notificaciones — permiso bloqueado sin salida**: en Ajustes, con el permiso denegado («no volver a preguntar») sólo se muestra el aviso; falta un botón «Abrir ajustes del sistema» (requiere un plugin nativo de settings). Identificada en la verificación de F111 (2026-09-27); sin implementar.

---

## Referencia del proyecto

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
