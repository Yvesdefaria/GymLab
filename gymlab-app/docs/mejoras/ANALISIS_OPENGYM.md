# openGym — Análisis técnico completo

> Documento de auditoría del repositorio `opengym-main` (openGym v1.4.2).
> Elaborado por lectura directa del código, sin ejecutar la aplicación.
> Cada afirmación no trivial incluye evidencia `path:line`.

**Índice**

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Números del repositorio](#2-números-del-repositorio)
3. [Arquitectura](#3-arquitectura)
4. [Frontend](#4-frontend)
5. [Diseño visual](#5-diseño-visual)
6. [Lógica de dominio y algoritmos](#6-lógica-de-dominio-y-algoritmos)
7. [Backend](#7-backend)
8. [Contenido y assets](#8-contenido-y-assets)
9. [Tests y CI](#9-tests-y-ci)
10. [Riesgos y deuda técnica](#10-riesgos-y-deuda-técnica)
11. [Preguntas para profundizar](#11-preguntas-para-profundizar)
12. [Batería de verificación numérica](#12-batería-de-verificación-numérica)

---

## 1. Resumen ejecutivo

openGym es un tracker de gimnasio y peso corporal *self-hosted*. Dos contenedores
(`api` + `web`) más una carpeta `./data` que pertenece al usuario. Autenticación por
passkeys (WebAuthn), instalable como PWA, sin cuenta en servidores de terceros, sin
telemetría. Licencia AGPL-3.0.

La tesis del proyecto está en el README: los datos de entrenamiento son del usuario y
deben sobrevivir al proveedor. Todo lo demás se deriva de esa decisión.

**Cuatro decisiones estructurales que explican el resto del código:**

| Decisión | Consecuencia |
|---|---|
| Origen único (`nginx` proxya `/api`) | Passkeys exigen `RP_ID` + HTTPS exactos; condiciona auth, settings y deploy |
| Sin base de datos (JSON + escritura atómica) | El "backup" es copiar una carpeta; la concurrencia se resuelve por revisión |
| Dependencias mínimas como restricción dura | Frontend: React + Router + Zustand. API: 2 paquetes. Rechaza la mayoría de las soluciones obvias |
| Lógica de entrenamiento como funciones puras con test | El corazón del producto es verificable sin abrir un navegador |

---

## 2. Números del repositorio

| Métrica | Valor |
|---|---|
| Archivos totales | 20.982 |
| Peso total (sin `node_modules` ni `.git`) | 248,4 MB |
| Peso por extensión | `.mp4` 63,1 % · `.webp` 13,4 % · `.json` 8,9 % · `.js` 10,8 % |
| `frontend/src` sin tests | ~90.300 líneas |
| `frontend/src` en tests | ~66.000 líneas (~42 %) |
| Pantallas (`views/`) | 23 productivas (+ 94 archivos de test) |
| Componentes productivos | 39 |
| Archivos de test en `lib/` | 209 |
| `api/server.js` | 2.890 líneas (verificado) |
| `frontend/src/index.css` | 2.093 líneas (verificado) |
| API documentada | 66 paths / 72 operaciones |
| Ejercicios en catálogo | 6.554 archivos (verificado) |
| Packs i18n del catálogo | 17 (verificado) |

**Archivos más grandes** — donde el proyecto se está doblando bajo su propio peso:

| Archivo | Líneas |
|---|---|
| `frontend/src/sheets.jsx` | 3.487 |
| `frontend/src/views/Workout.jsx` | 2.161 |
| `frontend/src/index.css` | 2.093 |
| `frontend/src/store/useStore.js` | 1.999 |
| `frontend/src/views/Settings.jsx` | 1.535 |
| `frontend/src/lib/history.js` | 1.210 |
| `frontend/src/lib/sync-merge.js` | 1.092 |

---

## 3. Arquitectura

```
[Phone / Browser / Capacitor shell]
        │ HTTPS — un solo origen (obligatorio para passkeys)
        ▼
[web]  nginx-unprivileged
        ├─ sirve el build estático de React
        ├─ sirve /exercise-media (180 px, cache inmutable 30 d)
        └─ proxy /api → api (resolver en runtime, X-Forwarded-For sobrescrito)
        ▼
[api]  node:http puro · 2 dependencias
        │  @simplewebauthn/server · web-push
        ▼
[./data]
      db.json            usuarios, credenciales, suscripciones, invites, deviceLinks
      db.json.bak        copia del último estado válido (se reescribe en cada save)
      state-<uid>.json   plan, entrenamientos, peso corporal, ajustes
      audit.log          JSONL rotativo de eventos de admin
      secret             clave de firma de cookies (32 bytes hex, 0600)
      vapid.json         claves de push (autogeneradas)
      uploads/<uid>/     media propia del usuario
```

### 3.1 Contenedores y despliegue

- `docker-compose.yml` — servicios `api` y `web`. Sin `healthcheck:` propio (usan los
  `HEALTHCHECK` de imagen), sin `networks:` custom, sin volúmenes nombrados. Bind
  `./data:/data` y `./coach-auth:/coach-auth`.
- `docker-compose.prod.yml` — una sola línea de override: bindea `web` a `127.0.0.1`.
- `kubernetes/` — kustomize, namespace `fitness`, un Deployment con 1 réplica y
  estrategia `Recreate`, dos contenedores en el mismo pod, HTTPRoute (Envoy Gateway) +
  Certificate (cert-manager), PVC de 2 GiB.
- `helm/` — chart 0.2.2 / app 1.4.2. Todo por `values`: ingress **o** HTTPRoute,
  ServiceAccount con `automount:false`, PVC con `helm.sh/resource-policy: keep`,
  `helm test` contra `/api/health`.

### 3.2 Las tres capas de datos

1. **Persistencia**: archivos JSON bajo `DATA_DIR`.
2. **Transporte**: `GET /api/data` / `PUT /api/data` con control optimista de
   concurrencia.
3. **Cliente**: un único documento `S` en Zustand, persistido en `localStorage`
   (`gym_state_v1`) y empujado con debounce.

---

## 4. Frontend

### 4.1 Stack y arranque

React 19 + Vite. `HashRouter` con 19 rutas declaradas en una sola tabla
(`App.jsx:246-272`). Zustand. CSS escrito a mano. Sin TypeScript, sin Tailwind, sin
ESLint/Prettier configurado.

**Cadena de arranque:**

1. `index.html` pinta una pantalla de carga inline **antes** de que cargue el JS
   (`index.html:37-83`).
2. Un script pre-paint lee `localStorage` y fija `lang`/`dir` para que el árabe no
   parpadee en LTR (`index.html:4-14`).
3. `main.jsx` monta `StrictMode` + `App`, arranca la sincronización de media, el puente
   de teclado nativo y registra el service worker solo si `!MOBILE && https`.
4. El service worker cachea el shell con nombre versionado (`opengym-rt-__BUILD__`) y
   mantiene una cache de media separada con tope de 150 MB / 3.000 entradas.

### 4.2 Pantallas

| Archivo | Tamaño | Propósito |
|---|---|---|
| `Home.jsx` | 16,6 KB | Saludo, sesión de hoy, tarjeta de peso, racha |
| `CheckIn.jsx` | 12 KB | Check-in de gimnasio con QR y escaneo por cámara |
| `Plan.jsx` | 27 KB | Grilla semanal / rotación, asignación de días |
| `RoutineEdit.jsx` | 34 KB | Editor de rutinas: orden, impresión, reemplazo, progresión |
| `Workout.jsx` | 2.161 L | La sesión: layouts card/list/compact, series, timers, cierre |
| `FocusView.jsx` | 22 KB | Entrada de series enfocada en un ejercicio |
| `Stats.jsx` | 47 KB | Volumen, PR, recuperación, heatmap, balance estructural |
| `History.jsx` | 2 KB | Entrenamientos pasados y notas por día |
| `Library.jsx` | 8,6 KB | Catálogo: búsqueda, filtros, equipamiento, favoritos |
| `Muscles.jsx` | 1,2 KB | Explorador muscular (BodyMap) |
| `StructuralBalance.jsx` | 5,7 KB | Ratios musculares contra volumen registrado |
| `Measurements.jsx` | 13 KB | Medidas corporales por día |
| `ProgressPhotos.jsx` | 15 KB | Galería, comparación antes/después |
| `Settings.jsx` | 98 KB / 1.535 L | 13 subpáginas, con buscador |
| `Admin.jsx` | 25 KB | Administración: usuarios, invites, backup |
| `AdminCoach.jsx` | 32 KB | Configuración del proveedor de IA |
| `CoachChat.jsx` | 45 KB | Conversación, propuestas, deshacer |
| `CoachIntake.jsx` | 17 KB | Cuestionario de una pregunta por pantalla |
| `CoachSetup.jsx` | 12,5 KB | Modo móvil del coach (off / servidor / clave propia) |
| `Login.jsx` | 8,4 KB | Passkey, contraseña y vinculación de dispositivo |
| `MobileOnboarding.jsx` | 10 KB | Primer arranque: local o conectar servidor |
| `PermissionSteps.jsx` | 3,6 KB | Permisos del sistema tras el onboarding |
| `WatchSettings.jsx` | 5,2 KB | Ajustes de Apple Watch (solo iPhone) |

### 4.3 Componentes destacados

- **Controles**: `ui.jsx` (~500 líneas) concentra `NumberField`, `TextField`,
  `SearchField`, `Switch`, `Segmented`, `Stepper`, `Slider`, `Check`, `Section`, `Row`,
  `SelectRow`, `MultiSelectRow`, `Button`. Es el sistema de diseño en forma de código.
- **Overlays**: `Modals.jsx` (host de sheets, arrastre con eje bloqueado, cierre por
  Escape, restauración de scroll, entrada en el historial para que el "back" cierre).
- **Gráficos**: `LineChart`, `Heatmap`, `BodyMap` (SVG de músculos), `Icon` (set propio
  de 24×24 con `currentColor`).
- **Timers**: `RestTimer` (barra acoplada), `TimerFlash` (parpadeo de tema para
  gimnasios ruidosos), `Elapsed`, `DurationWheel` (ruedas con scroll-snap estilo iOS).
- **Workout**: `SwipeCards`, `SwipeRow` + `use-swipe-row`, `WorkoutMedia`,
  `WorkoutThumb`, `WorkoutScrollAnchor`.

### 4.4 Estado

`store/useStore.js` contiene un único documento `S`:

- Persistido en `gym_state_v1`.
- Claves meta alrededor: `gym_sync`, `gym_state_wid`, `gym_state_owner`, `gym_dirty`,
  `gym_synced_at`, `gym_synced_fp`, `gym_stash`, `gym_owner`, `gym_guest`, `gym_user`,
  `gym_adopt`, `gym_logout_owed`.
- Nunca persistido: `user`, `ready`, `sync`, `config`, `needsMobileOnboarding`,
  `permSteps`, `linkCode`, `coachLocal`.

`store/useUI.js` (530 líneas) mantiene lo efímero: pila de sheets, toasts, timers. Los
countdowns de descanso y de trabajo sobreviven a un reload en `gym_rest` y `gym_work`.

**Sincronización del lado cliente:** `pushState` hace `PUT /api/data` con
`{state, rev, wid}`; hay un `GET /api/data/rev` liviano para comparar antes de empujar;
`pullState` hace `GET /api/data`. La fusión de conflictos vive en `lib/sync-merge.js`
(1.092 líneas). Estados posibles: `auth | local | offline | error | held | pending | ok`.

### 4.5 Internacionalización

- 20 opciones de idioma en la UI, 18 packs físicos. `de-CH` no existe como archivo: se
  genera desde alemán con un transform ß→ss (`lib/i18n-core.js:29-31`).
- RTL solo para árabe (`RTL_LANGS = new Set(['ar'])`), aplicado tanto en `setLang` como
  pre-paint.
- Carga diferida por `import.meta.glob`: el inglés viaja solo hasta que se elige idioma.
- Instrucciones de ejercicios: 15 packs. Nombres: 17 packs. Descripciones: 2 (en, de).
- `t()` interpola `{0}` y cae al texto inglés; `tn()` usa `Intl.PluralRules`.

### 4.6 Accesibilidad

`:focus-visible` global con outline de 2,5 px. 255 atributos `aria-*`/`role` en JSX
productivo. Kill switch global de `prefers-reduced-motion`. Escape cierra solo el sheet
superior no bloqueado. Medición de `visualViewport` para que los pickers no queden
debajo del teclado. Wake lock re-adquirido en `visibilitychange`, atado a un
entrenamiento activo.

---

## 5. Diseño visual

> Esta sección es la más subjetiva del documento. Se describe el sistema, no se
> evalúa el gusto.

Sin framework de CSS. Toda la base son custom properties escritas a mano en
`src/index.css:19-91`. Tema oscuro por defecto, tema claro como espejo exacto, y
`theme: system` sigue `prefers-color-scheme` en vivo.

| Grupo | Token / valor |
|---|---|
| Superficies | `--bg:#000` · `--bg-el:#0e0e10` · `--surface:#1c1c1e` · `--surface-2:#2c2c2e` · `--surface-3:#3a3a3c` |
| Texto | `--label:#fff` + 3 niveles de opacidad (.60 / .32 / .18) |
| Líneas | `--sep`, `--sep-op`, `--hair: 0.5px` |
| Paleta | Azules/verdes/rojos del sistema iOS (`--blue:#0a84ff` … `--grey:#8e8e93`) |
| Acento | `--acc` (8 presets + `#rrggbb` custom validado), derivados con `color-mix` |
| Geometría | `--r-sm:8` · `--r:12` · `--r-lg:16` · `--r-xl:22` · `--r-card:14` · `--pad:16` |
| Movimiento | `--ease:cubic-bezier(.32,.72,0,1)` · `--fast:140ms` · `--med:220ms` |
| Safe area | `--sat`/`--sab` = `max(env(safe-area-inset-*), var(--native-s*))` |

**Lenguaje visual**: listas agrupadas estilo iOS (`.card` + `.lrow` con hairlines que
arrancan después del riel del ícono), segmented controls, sheets con `backdrop-filter`
y fallback `@supports` sin blur. Tipografía del sistema (SF Pro), numerales tabulares —
detalle que importa: los pesos no bailan al actualizarse.

**Jerarquía por peso, no por tamaño.** El escalado tipográfico `.t-*` fue eliminado
deliberadamente (`index.css:150-154`); los títulos usan 600 y el contenido 400.

**Responsive**: `#app` con máximo de 560 px en móvil; en desktop (≥1000 px) crece a
1080 px con dos columnas y tab bar flotante de 520 px. Propiedades lógicas
(`inset-inline-start`, `marginInlineStart`) en todo el CSS para que RTL funcione sin
duplicar reglas.

---

## 6. Lógica de dominio y algoritmos

> Esta es la sección importante. Lo visual es discutible; esto no.

Todo vive en funciones puras bajo `frontend/src/lib/`, cada una con su `*.test.js` al
lado. La regla del repositorio (CONTRIBUTING.md) es explícita: *si decide lo que se
levanta en la próxima sesión, o lee una sesión guardada, es un helper puro con test*.
El servidor MCP **reimporta estos mismos módulos** para que sus números coincidan
exactamente con los de la interfaz.

### 6.1 Motor de progresión — `lib/progression.js`

**Interfaz compartida:**

```
nextPrescription(S, cfg, routine) → {
  policy, kind: 'first'|'up'|'hold'|'deload'|'off',
  weight?, reps?, sec?, sets?, rowReps?, why[]
}
```

`applyPrescription(sets, p, step, floor, assisted)` escribe solo las filas abiertas,
puede agregar filas de trabajo y luego recalcula los warm-ups.

**Resolución de política**: `cfg.prog` (por ejercicio) > `routine.prog` (por rutina) >
default (`linear` para reps, `off` para el resto). Restringido por `POLICIES_FOR`:
reps → `{off, linear, greyskull, double, triple}`; tiempo → `{off, time}`; cardio →
`{off}`.

**Lectura de una sesión previa** (`readSession`):

- Filtra warm-ups.
- Una sesión "alcanza" solo si `logged.length >= planned`.
- Por lado y timed: duplica las filas planificadas.
- Un "hit" exige **todas** las series prescritas completadas con `reps >= objetivo`.
- Triple progresión usa `target.rowReps` por serie; las filas back-off se juzgan contra
  `backoffAt(top, k, step)`.

**Contadores de stall**: se cuentan fallos consecutivos desde el más reciente. Los
rompe: un cambio de peso, una edición del plan (`sets/reps/repsMin/sec/setsMax`), o —en
doble/triple— una sesión que supera el mejor registro de reps bajas al mismo peso.

**Incrementos por defecto** (`lib/exercises.js:248-259`):

| Grupo | Incremento |
|---|---|
| Piernas, espalda, cadera, glúteos | 5 kg / 10 lb |
| Resto | 2,5 kg / 5 lb |
| Ejercicios por tiempo | 5 s |
| Deload (factor) | ×0,9 (válido 0,5–0,95) |

**Deload tras stall**: linear 3, Greyskull 1, doble 3, triple 3, tiempo 3.

#### Reglas por política

| Política | Éxito | Fallo | Deload |
|---|---|---|---|
| **Linear** | `+incremento` con snap a grilla (tolerancia 0,1) | hold con countdown | 3 stalls → Epley |
| **Greyskull** | `+inc`; **doble salto** si el AMRAP de la última serie ≥ 2× objetivo | hold | **primer fallo** → 10 % |
| **Doble** | sube peso solo si `last.ok && last.low >= top`; si no, persigue `min(top, max(bottom, last.low + repStep))` | — | 3 stalls → `repsMin` |
| **Triple** | series suben juntas bottom→top; luego una serie sola hasta `setsMax` (cap 10); después `+peso` y reinicio | — | 3 stalls |
| **Tiempo** | `goal + inc` segundos | hold | 3 fallos → 10 % snapped a 5 s |
| **Bodyweight** | +1 rep (+2 por lado); al llegar a `repsMax` agrega serie (cap 6) y resetea | — | hold + sugerencia de cargar |
| **Asistida** | dirección invertida: más difícil = **restar** peso | — | deload = **sumar** peso |

#### El deload no es "×0,9"

Es un optimizador acotado (`progression.js:156-207`):

1. `target1RM = round1( Epley(pesoActual, repsUpper) × factor )`.
2. Para cada cantidad de reps en `[bottom … upper]` (paso 2 si es por lado) calcula el
   peso ideal: `ideal = target1RM / (1 + reps/30)` (inversa de Epley).
3. Filtra los puntos de la grilla de pesos disponibles alrededor de ese ideal, acotados
   por el peso actual.
4. Ordena por: `(|Epley(candidato) − target1RM|`, luego `|reps − upper|`, luego **más
   peso**, luego **más reps**).
5. Si nada sirve, mantiene la carga intentada.

**Mancuernas propias**: sube a la siguiente campana (dos si hay doble salto); el deload
va a la más cercana por debajo de `0,9 × peso`; si ya está en la más pesada, hold.
**Asistidas**: `addStep(w, −step)` para subir dificultad y `+inc` para el deload.

**Alcance del historial**: el historial se lee por slot de rutina (`rid`), con fallback
a todo el historial si esa rutina no tiene registros. Las entradas marcadas `noProg` o
con `excludeFromProgression` **nunca** alimentan la progresión.

### 6.2 1RM estimado — `lib/onerm.js`

Siete fórmulas, todas con `w` = peso y `r` = repeticiones:

| Fórmula | Expresión |
|---|---|
| Epley | `w · (1 + r/30)` |
| Brzycki | `36w / (37 − r)` |
| Lombardi | `w · r^0.1` |
| O'Conner | `w · (1 + r/40)` |
| Mayhew | `100w / (52.2 + 41.9·e^(−0.055r))` |
| Wathan | `100w / (48.8 + 53.8·e^(−0.075r))` |
| Lander | `100w / (101.3 − 2.67123r)` |

**Límites de repeticiones:** una sola fórmula hasta **12 reps**; el modo ponderado (7
fórmulas + tabla `%1RM` por RIR) hasta **15 reps efectivas** (`reps + RIR`).

**Tabla RIR → %1RM** usada en el modo ponderado:

```
RIR 0..14 → 100, 95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 71.7, 69.5, 67.5, 65.5, 63.6
```

**Reglas de cálculo:**

- Rechaza peso/repeticiones no positivos o `NaN`.
- `r = 1` y sin RIR (o RIR 0) → devuelve el peso tal cual.
- Modo ponderado: `effectiveReps = reps + RIR`, tope 15.
- Modo simple: si `reps > 12` el set se descarta.
- Redondeo final a 0,1.
- **Filtros de entrada:** solo filas de reps completadas; warm-ups y drops excluidos;
  por lado se lee cada lado completo; **asistidas → `null`**.

**Métrica de confianza** (`repFactor`, `:200-222`): decae con las reps
(`1 − 0.5·(r−1)/14`), castiga RIR > 0 (×0,92) y castiga la dispersión entre fórmulas
(`max(0.5, 1 − cv/0.15 × 0.5)`).

### 6.3 Recuperación y fatiga — `lib/recovery.js`

El modelo más elaborado del proyecto.

**Unidad de medida:** 8 series efectivas por sesión = `1.0`. Tope de 12 por músculo y
por sesión.

**Peso de una serie según RIR:**

```
RIR nulo   → 1.0
RIR ≤ 3    → 1.0
RIR ≥ 6    → 0.3
intermedio → 1 − 0.7·(RIR − 3)/3
```

Si no hay RIR registrado, se estima desde el ancla de 90 días:
`maxReps = 30·(anchor/w − 1)`, `RIR = clamp(maxReps − r, 0, 10)`.

**Ganancia relativa** (volumen agudo vs crónico):

```
gain = clamp( (agudo + 4) / (crónico/4 + 4), 0.5, 2 )
```

Ventanas: aguda 7 días, crónica 28 días. Prior de novato: 4 series/semana.

**Acumulación y decaimiento:**

```
v       += (effectiveSets / 8) · gain · 0.5^(Δt / halfLife)
fatigue  = 1 − e^(−v)
```

**Vida media por músculo:**

| Horas | Músculos |
|---|---|
| 24 h | brazos, músculos pequeños, core |
| 30 h | pecho, hombros, trapecio, espalda alta, serrato |
| 48 h | lumbar, glúteos, cuádriceps, isquiotibiales, aductores, gemelos |

**Estados** (`lib/recovery-view.js:11-17`):

| Fatiga | Estado |
|---|---|
| `< 0,25` | listo |
| `0,25 – 0,5` | recuperando |
| `> 0,5` | fatigado |

**Fuerza retenida**: sin entrenar cae a un piso de 0,5. Una serie completa no-warm-up
resetea 14 días a 1.0; después: `max(0.5, 0.5^((edad − 14d)/28d))`.

**Músculos desentrenados**: `detrained < 1` (unidad = sesión completa equivalente).

### 6.4 Cálculo de discos — `lib/plates.js`

Trabaja en **cuartos de unidad** (`Q = 4`), lo que da granularidad de 0,25 kg.

**Algoritmo en tres pasadas:**

1. **Greedy** de más pesado a más liviano. Si la suma es exacta, termina.
2. **Programación dinámica** `f[i][s]` = mínima cantidad de discos para suma exacta;
   desempate por discos más pesados.
3. Si es imposible: suma más cercana **por debajo** y campo `missing` explícito.

**Inventario por defecto:** tamaños estándar × 6 pares. Se excluyen los poco comunes
(kg `{2, 1.5, 1, 0.5}`, lb `{15, 1.25, 1, 0.5}`). Configurable por el usuario en
`S.plates[unit] = {size: pairs}`.

**Barras por defecto** (`lib/bar.js:20-22`):

| Barra | kg | lb |
|---|---|---|
| Olímpica | 20 | 45 |
| EZ | 10 | 25 |
| Smith | 9 | 20 |
| Trap | 25 | 55 |

**Reparto:** pares parten `(peso − barra) / 2`. Single stack (Smith, trap) usa
`(peso − base)` completo y duplica el conteo del inventario.

### 6.5 Balance estructural — `lib/structuralBalance.js`

Compara el rendimiento actual contra **anclas** definidas por template.

**Conversión a carga comparable:**

| Tipo de ejercicio | Carga usada |
|---|---|
| Normal | la registrada |
| Lastrado (on-lifter) | peso corporal + añadido |
| Asistido | peso corporal − asistencia |
| Ratio por peso corporal | si `reps ≥ N` usa la carga; si no, Epley 1RM y luego `1RM/(1 + N/30)` |

**Templates y ratios** (ancla = 100 %):

*Poliquin*

| Ejercicio | Ratio |
|---|---|
| Close-grip bench | 100 |
| Press inclinado | 91 |
| Dips | 117 |
| Dominada supina | 87 |
| Curl | 40 |
| Sentadilla alta | 100 |
| Sentadilla frontal | 85 |
| Peso muerto | 125 |
| Power clean | 61 |

*Thibaudeau Powerlifting*: sentadilla 100 · bench 75 · peso muerto 120 · militar 45.

*ATG*: RDL 100 % PC × 12 · seated good morning 66 % × 10 · step-up 50 % × 15 ·
Nordic 1 rep · dominada 10 · dip 10 · press inclinado con mancuernas 40 % × 8 ·
press militar con mancuernas 33 % × 8.

**Clasificación** (`BORDERLINE_BAND_PCT = 5`):

| Resultado | Estado |
|---|---|
| `≥ target` | balanceado |
| `≥ target − 5 pp` | borderline |
| resto | débil |
| sin dato | `no-data` |

### 6.6 Volumen, músculos y heatmap

- `completedVolumeOf = peso × reps + drops`, por miembro completado.
- `workoutVolume` excluye warm-ups y **multiplica ×2** las mancuernas registradas
  "cada una" con dos campanas.
- Carga muscular = series efectivas × peso por músculo (**primario 1,0 · secundario
  0,4**); si el ejercicio no tiene mapa muscular, se reparte 1,0 entre las partes.
- Sombras del mapa: relativo `ceil(v/max × 4)` o umbrales absolutos 0–4.
- Heatmap: 53 semanas. Cuartiles de días no-cero → 4 niveles. Un día con actividad pero
  métrica cero = nivel 1.

### 6.7 Otros cálculos resueltos

| Cálculo | Fórmula / regla |
|---|---|
| **Warm-up ramp** | Cada escalón parte la distancia a la mitad, redondeo hacia abajo al step, piso = barra: 50 %, 75 %, 87,5 %. Máximo 5 series. Asistidas rampan hacia abajo desde 1,5× |
| **Back-off** | `backoffAt(top, k, step)` = `top − k·step` en grilla, clamp `[step, top]` |
| **Drop set** | `prev × (1 − pct/100)`, pct clamp 1–90, snapped a grilla, forzado por debajo del anterior |
| **Rest-pause** | Bursts que se parten a la mitad (`nextBurstReps`, `splitBurstReps`) |
| **Rotación** | A, B, C… el próximo es el siguiente no acreditado; el pase nuevo arranca el día siguiente al cierre |
| **Fecha de sesión** | Anclada a **mediodía local**, nunca UTC (`history.js:28-41`) |
| **Unidades** | kg↔lb `2.2046226218`; cargas a 0,5 lb / 0,25 kg; peso corporal a 0,1 |
| **Peso semanal** | Agrupación por clave de semana, media, delta contra la anterior; pesajes a mediodía local |
| **Reubicación de sesión** | Conserva duración, reordena cronológicamente y recalcula badges de PR de forma asimétrica (puede revocar, solo la sesión movida puede ganar) |

### 6.8 Importadores

**CSV** (`lib/import-csv.js`): parseo tolerante a BOM, comillas y separador `;`;
detección automática de FitNotes / Strong / Hevy; matching de nombres por alias curado →
word-bag exacto → subset único (máx 2 palabras extra); meses multilingües; conversión
lb↔kg por fila a 0,1; límites de sanidad (2.000 kg, 1.000 reps, 650 kg de peso
corporal); clave de sesión = fecha + inicio + nombre para Strong/Hevy; ids
deterministas `cyrb53`.

**Hevy API** (`lib/import-hevy.js`): paginación con `page_count`, backoff ante 429,
mapeo de template ids, importación de rutinas y medidas corporales.

---

## 7. Backend

### 7.1 Estructura de `api/server.js`

Un solo archivo, `node:http`, sin framework. Secciones delimitadas por comentarios:

| Rango | Contenido |
|---|---|
| `40-97` | Constantes de configuración |
| `114-227` | Secretos y base de datos |
| `229-455` | Push y guard SSRF |
| `457-599` | Reminders y nudges |
| `601-792` | Sesiones y CSRF |
| `794-834` | Challenges y pairing |
| `928-1022` | Audit log |
| `1024-1141` | Throttle |
| `1143-1378` | Contraseñas |
| `1662-1909` | Passkeys y device links |
| `1911-2041` | Media |
| `2075-2856` | Tabla de rutas |
| `2900-2996` | Dispatcher |

**Router**: objeto plano con claves `"METHOD /api/path"`. Agregar un endpoint = agregar
una clave. Una sola ruta templada (`/api/media/{hash}`) se reescribe antes del lookup.

**Orden del pipeline**: `bodyDeadline` (300 s) → CORS con reflexión de origen y
`Vary: Origin` → OPTIONS con `Max-Age: 86400` → guard de igualdad de path (anti
`..\`) → `csrfOk` → throttle → handler.

**Errores**: `json()` siempre con `Cache-Control: no-store`; `HttpError` mapea status;
`BusyError` devuelve 503 + `Retry-After: 2`; el resto se loguea como 500. Límites:
request 30 min, headers 60 s, body JSON 5 MiB.

### 7.2 Modelo de datos

`db.json`:

| Colección | Campos |
|---|---|
| `users` | `id, name, created, admin?, owner?, disabled?, invitedBy?, lastPull?, lastNudge?, sv?, pw?{h,set}, pwReset?{h,exp,by}, email?` |
| `creds` | `id, userId, publicKey (base64url), counter, transports[], created, lastUsed?, name?` |
| `subs` | `userId, endpoint, keys{p256dh,auth}, deviceId?, created` |
| `invites` | `code, note, createdBy, created, usedBy?, usedAt?, revoked?` |
| `deviceLinks` | `{h, userId, exp, created}` |

`state-<uid>.json` — claves principales:

```
_rev, _wid, _wids, _ts          control de concurrencia
_prior, _unstamped              uso interno del servidor (nunca sale al cliente)
deleted, edited, undone         tombstones y stamps por campo
routines, workouts, customEx, equipProfiles, gymCards,
bodyweight, measurements, favEx, exNotes, dayNotes, dayPhotos
week, dayPlan, barWeights, routineOrder, exWeights,
balanceOverrides, loadKind, plates, dbLoad, dumbbells
unit, unitSet, resetAt, resetIds, coach, reminder, lang
```

**Escritura atómica** (`durable.js:28-37`): archivo temporal → `fsync` → `rename` →
`fsync` del directorio. `db.json` con permisos `0600`.

**Respaldo**: `db.json.bak` se reescribe en **cada** guardado. Si `db.json` no se puede
leer, se conserva a un lado y se usa el `.bak`; si tampoco se puede, **el servidor no
arranca** en lugar de arrancar vacío.

**Versionado**: no hay versión de esquema. Los arrays faltantes se inicializan vacíos.
Los parámetros de hash de contraseña van embebidos para permitir rehash. `coach.json`
tiene una migración one-way desde v1.2.11.

### 7.3 Sincronización — la decisión más importante del backend

Control optimista sobre **dos** valores simultáneos: `_rev` (contador) y
`_wid`/`_wids` (linaje de escritura, últimos 50 ids).

**Flujo:**

1. El cliente manda `PUT /api/data` con `{state, baseRev, baseWid}`.
2. Si `baseRev !== curRev`, o `baseWid` no coincide → **409 con `{rev, state}`
   completo**. El cliente fusiona y reintenta.
3. Si coincide → escritura, `_rev = curRev + 1` (o **+2** si el stamping modificó el
   documento, para forzar re-lectura en clientes viejos), `_wid` nuevo, el anterior se
   antepone a `_wids`.

**Ausencia de `baseRev` = sobrescritura deliberada** (restauración de backup).

**Stamps**: el cliente escribe `_ts` en milisegundos y `_f` por entrada. Si un escritor
no trae stamps, el servidor los genera en un **tiempo lógico monótono**:
`t = max(now, highestStamp(cur) + 1, highestStamp(next) + 1)`. No confía en el reloj
del teléfono.

**Tombstones**: `deleted.<lista>.<clave>` = ms positivo para borrado, negativo para
re-agregado. Gana el valor absoluto mayor; empate favorece el re-agregado. Tope de
**5.000 por lista**.

**`_prior`**: últimos 6 valores hasheados por campo, máximo 5.000 claves. Nunca se
envía al cliente.

**Qué valida el servidor y qué no**: valida forma del sobre, que `workouts`/`routines`
sean arrays, y los contadores propios. **No** valida campos del plan ni aplica límites
semánticos. Nunca deja que un documento encoja y restaura campos que un escritor de
v1.3.9 no podría haber borrado.

### 7.4 Autenticación

**WebAuthn** (`@simplewebauthn/server`): registro con `excludeCredentials`, login
usernameless (`allowCredentials` vacío), agregar dispositivo. `userVerification:
'preferred'`, `requireUserVerification: false`, resident key requerida, attestation
`none`.

**Challenges**: `Map` en memoria, 16 bytes aleatorios en base64url, TTL **5 min**,
one-shot, tope **20.000**, atados al tipo (`register|login|add|link`), barridos cada
60 s.

**Modelo multi-passkey**: muchas credenciales por perfil, máximo **20**, y la última
forma de entrar no se puede borrar.

**Vinculación de dispositivo**: código de **12 caracteres / 60 bits**, almacenado como
SHA-256 de `opengym-link:<código>`, TTL **10 min**, uno por perfil, se consume al usarse.
Pairing móvil: **8 caracteres / 40 bits**, TTL **5 min**, en memoria.

**Sesión**: token `<uid>:<expiry>:<sv>:<kind>` + `.` + HMAC-SHA256 con
`data/secret`, en base64url. `kind` = `c` (cookie) o `b` (bearer). Cookie
`__Host-gymsid` en https, `gymsid` en http, `HttpOnly; SameSite=Lax`, `Max-Age` de
**90 días** por defecto.

**Revocación**: bump de `sv` en logout-all, cambio de contraseña o reset de admin
invalida **todos** los tokens del usuario. Deshabilitar/borrar invalida en
`sessionUser`. Quitar un passkey **no** cierra sesiones.

**Throttle**: solo en rutas de contraseña, link y email.
- IP: 60/min; 20 intentos gratis → ×2 cada 30 s → 15 min.
- Cuenta: 5 gratis → ×2 cada 1 min → 1 h.
- IPv6 se cuenta por `/64`. Con `TRUST_PROXY=1` confía en `CF-Connecting-IP` o el
  `X-Forwarded-For` más a la derecha.
- Los flujos de passkey y pairing **no** tienen throttle.

### 7.5 Postura de seguridad

| Control | Implementación |
|---|---|
| Traversal | El path de la URL debe ser idéntico a su `pathname` parseado; uid reducido a `[A-Za-z0-9_-]`; hash de media con `^[0-9a-f]{64}$` |
| CSRF | `Sec-Fetch-Site` `same-origin`/`none`, o `Origin === ORIGIN`. Excepción única: `POST /api/pair/redeem` |
| Body | 5 MiB, `Content-Type: application/json` obligatorio, profundidad acotada |
| SSRF (push) | Resolución y bloqueo de loopback/privadas/link-local/CGNAT/multicast **dentro del `lookup` de la conexión TLS real** — cierra la ventana de DNS rebinding. `ALLOWED_PRIVATE_IPS` como allowlist explícita |
| Media | Imagen 2 MiB · GIF 8 MiB · video 40 MiB/60 s · cuota 200 MiB · 600 subidas/h · 2 en vuelo · piso de 512 MiB libres · GC a los 14 días |
| Headers de media | `nosniff`, CSP sandbox, `Cross-Origin-Resource-Policy: same-origin`, `no-store` |
| Invite-only | Off por defecto; códigos de 16 hex = 64 bits, verificados en options y re-verificados y consumidos en verify |
| Audit | JSONL, `AUDIT_MAX=5000`, `AUDIT_DAYS=90`, `AUDIT_IP=off|net|full`, ids monótonos |

**Punto débil conocido**: el servidor **nunca decodifica media ni limpia EXIF**. El
scrubbing de metadatos es responsabilidad del cliente, y no hay verificación del lado
servidor.

### 7.6 AI Coach (`api/coach/`)

Trabajos (`create | review | debrief`) ejecutados en el servidor. Las propuestas viven
en `DATA/coach/<uid>.json` y **no** en el estado sincronizado, porque el siguiente
`PUT` de otro dispositivo las borraría.

**Adapters**: `fixture`, `claude` (Agent SDK), `codex` (CLI), `anthropic`, `openai`,
`gemini`, `compatible` (cualquier endpoint OpenAI-compatible, incluido Ollama).

**La frontera de seguridad es el validador, no el prompt:**

- Payload con allowlist estricta y topes: 12 semanas, 60 sesiones, 300.000 caracteres.
- Perfil = handle HMAC de 16 caracteres. **Nunca el uid.**
- Una sola ronda de repair; si falla, falla.
- Límites: 2 jobs concurrentes, timeout de 5 min, propuestas con TTL de 14 días,
  historial de 20, tope diario por defecto de 10 por perfil.
- Credenciales cifradas con AES-256-GCM y HKDF desde `data/secret`; se inyectan solo en
  el entorno del job.
- En Linux el job baja a usuario sin privilegios y falla cerrado si no puede.

**Dos targets de imagen**: `default` (sin dependencias de IA, `npm` removido) y `coach`
(Agent SDK + Codex CLI + bubblewrap).

### 7.7 MCP (`mcp/`)

9 herramientas read-only: `list_routines`, `get_routine`, `get_week_plan`,
`list_workouts`, `get_workout`, `get_bodyweight`, `estimate_1rm`, `muscle_balance`,
`preview_session`.

Esquemas con `zod`, fechas validadas en calendario, `limit` 1–200. Lee `DATA_DIR`
directamente del disco con `fs.watch` + fallback de mtime. **Reimporta los módulos puros
del frontend** (`history`, `onerm`, `muscles`, `exercises`, `queue`, `progression`,
`session-start`) para que los números coincidan con la UI.

No se publica en npm: los imports relativos a `../../frontend/src/lib` exigen un
checkout del repositorio. No forma parte del build de Docker.

---

## 8. Contenido y assets

### 8.1 Catálogo de ejercicios

`catalogue/` = **19.693 archivos / 212,2 MB**, el activo más grande del proyecto.

| Parte | Archivos | Peso |
|---|---|---|
| `exercises/<id>.json` | 6.554 | 4,3 MB |
| `i18n/<lang>.json` | 17 | 17,47 MB |
| `browse/*.md` (generados) | 12 | 0,69 MB |
| `media/still/*.webp` | 6.554 | 33,2 MB |
| `media/clip/*.mp4` | 6.554 | 156,7 MB |

La media es el **89,5 %** de los bytes del catálogo; el texto es 22,3 MB.

**Modelo de un ejercicio** (ejemplo `catalogue/exercises/0009.json`):

| Campo | Contenido |
|---|---|
| `id` | Numérico, 4–5 dígitos, **permanente** — es la clave que guardan workouts y récords |
| `name` | Minúsculas, equipamiento primero |
| `bodyPart` | 1 de 11 valores |
| `equipment` | 1 de 34 valores |
| `target` | Músculo primario, 19 valores |
| `secondaryMuscles[]` | 42 valores posibles |
| `category` | 1 de 12 valores |
| `description` | 1–2 frases |
| `instructions[]` | 4–7 pasos en segunda persona |
| `muscleMap` | `{primaries, secondaries, weights 0–1, bodyPart}` — 246 entradas lo tienen |
| `femaleVariant` | Id de la misma variante sobre figura femenina — 935 entradas |
| `variantOf` | Marca dibujos sin texto propio — 922 entradas |
| `maleVariant` | 13 entradas |
| `textSource` | `"exercisedb"` para las 1.324 originales (MIT) |

**Composición real**: 6.554 archivos = **5.632 ejercicios reales + 922 variantes
femeninas** sin texto propio.

**Distribución por grupo corporal** (solo ejercicios reales):

| Grupo | Cantidad |
|---|---|
| Piernas superiores | 1.605 |
| Core / cintura | 863 |
| Espalda | 720 |
| Hombros | 618 |
| Brazos superiores | 561 |
| Pecho | 476 |
| Piernas inferiores | 239 |
| Cuerpo completo | 224 |
| Antebrazos | 139 |
| Cardio | 121 |
| Cuello | 66 |

**Equipamiento**: peso corporal 2.246 · mancuerna 757 · cable 446 · barra 389.

**No hay índice: el id es el índice.** `build.mjs` comprime todo en filas `EXDB`
`{id, n, bp, eq, tg, mg, sm, img, gif, cat, fv, mv}` que produce
`frontend/src/lib/exercises-data.js` (1,17 MB, 5.632 filas + 922 alias). Los nombres de
los archivos de media se derivan del id, no se almacenan.

### 8.2 Traducciones

- 17 archivos en `catalogue/i18n/` (no existe `pt.json`, solo `pt-BR`) × 5.632 claves.
- **Nombres**: completos en todos los idiomas.
- **Instrucciones**: solo para las 1.324 entradas originales, en 14 idiomas.
- **Descripciones**: solo `en` y 12 entradas en `de`.
- `bn`, `th`, `uk` son solo nombres.
- El build genera chunks por idioma: `instr` (15 archivos, 11,4 MB), `exercise-names`
  (17, 5,2 MB), `exercise-desc` (2, 603 KB), con fallback a inglés por ejercicio y un
  badge visible cuando se usa.

### 8.3 Pipeline de media

1. Pack licenciado de Gym visual (GIF).
2. `scripts/media/build-media.py` produce: `web/<id>.mp4` a 180 px (x264 crf14),
   `still/<id>.webp` a 180 px lossless, y `app/<id>.mp4` a **360 px** crf22.
3. `build-app-webp.py` genera además 240 px como WebP animado — para evitar que
   `<video>` se trabe dentro del WebView.
4. **Los archivos viajan dentro de la imagen web**: `COPY catalogue/media/
   /usr/share/nginx/html/exercise-media/`. Sin CDN, sin descarga al arrancar.
5. `VITE_IMG_BASE` / `VITE_GIF_BASE` permiten apuntar a otro origen.
6. nginx los sirve con `Cross-Origin-Resource-Policy: same-origin` y cache inmutable de
   30 días.

**Control de licencia en CI**: `scripts/catalogue/check-media.mjs` falla si detecta
cualquier media de más de 180 px.

**Nota**: el servicio `media` de compose y el initContainer de descarga **fueron
eliminados** a partir de v1.4.0. Ya no existen.

### 8.4 Documentación

25 archivos, 684 KB.

| Documento | Peso | Contenido |
|---|---|---|
| `SELF_HOSTING.md` | 53 KB | Instalación, passkeys/HTTPS, usuarios, backups, actualización, troubleshooting |
| `MOBILE.md` | 30 KB | APK, iOS, pairing, descarga de packs de animación |
| `AI_COACH.md` | 30 KB | Proveedores, exposición de datos, configuración |
| `NIX.md` | 25 KB | Flake y módulo de NixOS |
| `dev/COMBINE_ROUTINES.md` | 31,6 KB | Spec implementable |
| `dev/SET_TYPES.md` | 12,9 KB | Modelo de drop sets y rest-pause |
| `dev/FATIGUE_SETS_MODEL.md` | 10 KB | Razonamiento del modelo de fatiga v2 |
| `APP_STORES.md` | 12,7 KB | Firma para Play y App Store |
| `DATA_IMPORTS.md` | 5,8 KB | FitNotes, Strong, Hevy, Apple Health |

### 8.5 Sitio web

`website/`: HTML/CSS/JS escrito a mano, **sin build step**. `api.html` (308 KB) se
genera desde `api/openapi.yaml`. La demo en `/demo/` es el build real con `VITE_DEMO=1`
y media preparada por `stage-media.mjs`. El sitio se publica fuera de banda; solo la
demo está automatizada (GitHub Pages + GitLab Pages).

---

## 9. Tests y CI

### 9.1 Cobertura

| Suite | Contenido |
|---|---|
| Frontend | 213 archivos de test. Solo `progression.test.js` = 126 tests / 1.142 líneas. `onerm.test.js` 53 tests, `recovery` 53 |
| API | `api/test/` con fixtures (`media-refs.json`) |
| MCP | vitest, incluye un check de carga con node puro |

Los tests de dominio **no usan snapshots ni golden files**: cada valor esperado es una
constante explícita. Es la decisión correcta para matemática de dominio, porque un
snapshot acepta un cambio silencioso.

### 9.2 CI

**GitHub Actions** (8 workflows):

| Workflow | Qué hace |
|---|---|
| `test.yml` | 4 jobs (frontend, mcp, api, api-image), Node 22, build de Vite, checks de locale, probe de fatiga de ~108k, y **arranca ambas imágenes api verificando que no tengan IA** |
| `docker-publish.yml` | Matriz api+web, **linux/amd64 + linux/arm64**, GHCR, tag `edge` en main y semver+latest en release |
| `pages.yml` | Demo + `stage-media` → GitHub Pages |
| `ios.yml` | `macos-26`: simulador, UI tests, archive sin firmar |
| `mirror.yml` | Push fast-forward de `main` y tags `v*` a GitLab |
| `catalogue.yml` | Validación + `build.mjs --check` + `check-media` |
| `cla.yml` / `cla-issue.yml` | Firmas del CLA en el repo |

**GitLab** (`.gitlab-ci.yml`, 956 líneas, 7 stages, 15 jobs): imágenes multi-arch
amd64+arm64 con tags `X.Y.Z`, `X.Y`, `latest`; `edge` en main; APK firmados
(`zipalign` + `apksigner` + `.sha256`, a registro genérico); `verify:stack` que levanta
compose desde las imágenes publicadas y curlea `/api/health`, `/api/config` y `/`;
`verify:scan` con **SBOM CycloneDX** por imagen y gate de HIGH/CRITICAL.

---

## 10. Riesgos y deuda técnica

| # | Hallazgo | Impacto | Evidencia |
|---|---|---|---|
| 1 | `catalogue/media` está commiteado (190 MB) | Cualquier re-encode mueve 190 MB de historia. No es accidente: es el contrato de licencia + "no descargues nada al instalar" | `.gitignore`, `web/Dockerfile:80` |
| 2 | `Settings.jsx` (98 KB) y `sheets.jsx` (3.487 L) | Cada nueva opción agranda un archivo ya desproporcionado | — |
| 3 | `api/server.js` monolítico (2.890 L) | Funciona por el router de claves, pero mezcla 12 responsabilidades | `server.js:40-2996` |
| 4 | Sin linter, sin TypeScript, sin formatter | El estilo se sostiene a mano; cualquier contributor nuevo diverge | `CLAUDE.md:55-56` |
| 5 | Threshold de fatiga `0,25` con vida media de 48 h | Un día de piernas queda "fatigado" a las 24 h (0,507) y "listo" a las 48 h. Agresivo para hipertrofia | `recovery.js:47-63` |
| 6 | Historial de progresión por `rid` | Un mismo ejercicio en dos rutinas progresa dos veces distinto. Puede ser intencional, pero no está documentado | `progression.js:332-356` |
| 7 | El servidor no limpia EXIF | Todo depende del cliente. Un cliente modificado sube geolocalización | `media.js:12-15` |
| 8 | `db.json` sin versión de esquema | Las migraciones futuras tendrán que inferir la forma del documento | `server.js:146-150` |
| 9 | `GET /api/data/rev` con cache de 10 min por `mtime`+tamaño | Un cambio de igual tamaño en el mismo segundo podría no detectarse | `server.js:497-520` |
| 10 | README desactualizado | La tabla de roadmap dice v1.3.10 como última release; `openapi.yaml` y `helm/` dicen **1.4.2** | `README.md:279-287` vs `openapi.yaml:5-9` |
| 11 | `docs/SELF_HOSTING.md:35` dice "~80 MB" de media | El árbol mide **189,9 MB** | verificable con `du` |
| 12 | El directorio analizado no es un repositorio git | No hay historial local ni ramas | `git status` |

---

## 11. Preguntas para profundizar

> Organizadas por área y ordenadas por impacto sobre la **corrección de los datos**.
> Las que se responden leyendo código están marcadas con `[código]`; las que requieren
> un test escrito, con `[test]`; las que requieren una decisión de producto, con
> `[producto]`.

### A. Progresión

1. `[código]` `readSession` exige `logged.length >= planned` para considerar una sesión
   completa. Si el usuario hizo 3 de 4 series y falló la última, ¿cuenta como *miss*
   (y alimenta el contador de stalls) o se descarta?
2. `[test]` Si el usuario **borra** la serie que falló después de terminar, ¿el stall
   desaparece del historial y la progresión "olvida" el fallo?
3. `[código]` El contador de stalls se rompe con un cambio de peso. ¿Qué pasa si el
   usuario cambia el peso manualmente en una sola serie (no en el plan)?
4. `[test]` Greyskull: el doble salto ocurre cuando el AMRAP ≥ 2× objetivo. ¿El salto es
   `w + 2·inc` o `2·(w + inc)`? La diferencia es grande y hay que fijarla con un test.
5. `[test]` Doble progresión: `last.low >= top` dispara el aumento. ¿Qué pasa si el
   usuario hace **más** reps que `top` en la última serie (AMRAP accidental)?
6. `[test]` Triple progresión: con `setsMin=3, setsMax=4`, estando en 4 series al tope
   de reps, ¿sube peso y vuelve a 3 series, o queda trabado en 4?
7. `[código]` El deload por Epley ordena por "más peso" en caso de empate. ¿Eso puede
   producir un deload que **no sea menor** que el peso actual? El código fuerza
   `strictly < w`, pero ¿qué pasa si el único candidato válido es igual?
8. `[test]` Asistidas: el deload **suma** peso (más asistencia). ¿Se clampea al peso
   corporal del usuario? Superarlo no tiene sentido físico.
9. `[producto]` Bodyweight: al llegar a 6 series, la app dice "hold y cargá peso". Si el
   usuario lo ignora para siempre, ¿el ejercicio queda congelado indefinidamente?
10. `[producto]` El historial por `rid` significa que el mismo ejercicio en dos rutinas
    tiene dos progresiones independientes. ¿Es intencional? Si no lo es, es un bug de
    diseño con impacto directo en los datos.
11. `[test]` Historial importado de FitNotes: ¿los registros importados tienen `_f`
    stamps y forma suficiente para alimentar stalls, o quedan excluidos de hecho?
12. `[código]` `excludeFromProgression` puede crear un hueco permanente. ¿Hay forma de
    que un ejercicio vuelva a progresar después de haber sido excluido?
13. `[test]` Los warm-ups se excluyen del conteo. ¿Qué pasa con un entrenamiento
    compuesto **solo** de warm-ups? ¿Se registra como sesión vacía o como fallo?

### B. 1RM

14. `[producto]` ¿Por qué siete fórmulas y no el promedio simple? ¿Hay evidencia de que
    el esquema ponderado (7 fórmulas + tabla RIR) tenga menor error que Epley solo?
15. `[test]` `REP_CAP=12` y `WEIGHTED_REP_CAP=15`: un set de 20 reps al fallo se
    **descarta entero**. ¿No se pierde la información más valiosa (el set más cercano
    al límite)?
16. `[producto]` La tabla RIR → `%1RM` es un modelo lineal por RIR. ¿Tiene respaldo
    experimental o es una interpolación razonable? RIR 5 = 83,7 % es un valor de
    literatura antigua.
17. `[código]` ¿Cómo se maneja un RPE decimal (9,5)? La tabla está indexada por RIR
    entero.
18. `[producto]` Las asistidas devuelven `null`. Justamente el usuario que necesita
    asistencia es el que más necesita medir progreso. ¿Cómo se trackea su mejora?
19. `[test]` `r=1` sin RIR devuelve el peso tal cual. ¿Y `r=1` con RIR 0? ¿Y `r=1` con
    RIR 2 (que implica que no fue un verdadero 1RM)?
20. `[código]` La métrica de confianza castiga la dispersión entre fórmulas. ¿Se usa en
    algún lado para decidir algo, o es informativa?

### C. Recuperación y fatiga

21. `[producto]` ¿De dónde sale "8 series efectivas = 1,0"? Es la constante que
    normaliza todo el modelo.
22. `[test]` El cap de 12 series por músculo y sesión implica que un día de 20 series
    de espalda reporta la misma fatiga que uno de 12. ¿Es conservador a propósito?
23. `[test]` Verificar la cadena completa: 8 series → `1 − e^−1 = 0,632` (fatigado);
    +24 h con vida media 24 → `0,393` (recuperando); +48 h → `0,221` (listo). Con vida
    media 48, a las 24 h queda en `0,507` — apenas por encima del umbral.
24. `[producto]` Ese `0,507` es el argumento más discutible del modelo: un día de
    cuádriceps sigue "fatigado" a las 24 h. ¿Es la intención?
25. `[código]` `gain = clamp((agudo+4)/(crónico/4+4), 0.5, 2)` usa un prior de novato de
    4 series/semana. ¿Qué pasa con un usuario nuevo en su primera semana? El
    denominador arranca en 4 y el `gain` se dispara.
26. `[test]` El RIR se estima desde un ancla de 90 días. Si el usuario nunca registró un
    ancla, ¿todo cae a `null → 1.0` y se sobreestima la fatiga de cada serie?
27. `[test]` "Fuerza retenida" con piso 0,5: ¿se aplica por músculo o global? ¿Y qué
    pasa con un músculo que nunca se entrenó (división por cero o piso inmediato)?
28. `[producto]` `detrained < 1` usa "1 sesión equivalente" como unidad. ¿Cómo se
    comunica eso al usuario sin que suene arbitrario?

### D. Cálculo de discos

29. `[test]` Verificar los tres caminos con un inventario conocido: (a) exacto por
    greedy, (b) exacto solo por DP, (c) imposible → campo `missing`.
30. `[código]` La DP corre por cada cálculo. ¿Cuál es su costo con un inventario grande
    (6 pares de 25, 6 de 20, 6 de 15…)? ¿Está memoizada o se recalcula en cada render?
31. `[test]` `Q=4` implica granularidad de 0,25 kg. ¿Qué pasa con discos de 1,25 lb o
    mancuernas de 1 kg? ¿Se representan o se pierden?
32. `[producto]` Single stack duplica el inventario asumiendo que la Smith usa discos
    olímpicos. ¿Es correcto para todas las Smith?
33. `[test]` La barra por defecto es 20 kg / 45 lb. Un usuario con barra de 15 kg y
    discos en lb: ¿la conversión de barra y de discos se hace en la misma unidad?

### E. Balance estructural

34. `[código]` Poliquin usa close-grip bench como ancla. Si el usuario nunca hace
    close-grip, ¿el template entero queda en `no-data` o hay fallback a bench normal?
35. `[producto]` `borderline = target − 5 pp`. ¿Por qué 5 puntos y no un intervalo de
    confianza derivado de la dispersión de fórmulas?
36. `[test]` Los ratios comparan estimaciones Epley. Epley sobreestima en reps altas;
    ATG usa "peso para N reps" precisamente para evitarlo. ¿Se mezclan ambos enfoques en
    el mismo score sin corrección?
37. `[test]` Ejercicio trabajado: 80 kg de peso corporal, RDL objetivo 100 % × 12. El
    usuario hace 60 kg × 8. Epley da `76,0`; la inversa para 12 reps da `54,3`;
    `54,3/80 = 67,9 %` → débil. Verificar que el código dé exactamente eso.

### F. Volumen y músculos

38. `[test]` El `×2` de mancuernas asume que el usuario registra "cada una". Si registra
    el par total, el volumen se duplica silenciosamente. ¿Hay detección o es un footgun?
39. `[producto]` El peso secundario es 0,4. ¿De dónde sale ese número?
40. `[test]` Heatmap por cuartiles: con pocos días de datos los cuartiles son
    inestables. ¿Hay mínimo de días para pintar?
41. `[código]` Un día con actividad y métrica cero cuenta como nivel 1. ¿Eso puede hacer
    que un día de solo warm-ups pinte como entrenado?

### G. Sincronización (datos, no UI)

42. `[código]` El servidor estampa con tiempo lógico `max(now, highest+1)`. Si un
    cliente con el reloj adelantado tres años escribe una vez, `highest` queda en 2029 y
    **todo** el documento futuro hereda ese piso. ¿Existe un guard contra saltos
    absurdos?
43. `[código]` `_prior` guarda 6 valores hasheados por campo. ¿Qué pasa en el séptimo
    conflicto sobre el mismo campo? ¿Se pierde la capacidad de detectar el conflicto?
44. `[código]` Los tombstones tienen tope de 5.000 por lista. Al excederse, ¿se descartan
    los más viejos? Si se descarta un borrado, el registro **revive** en el próximo pull.
45. `[test]` `_rev` avanza +2 cuando el stamping modifica el documento. ¿Puede un cliente
    viejo entrar en un loop de 409 infinito contra un cliente nuevo?
46. `[test]` El body JSON está limitado a 5 MiB. Un usuario con años de historial,
    medidas y notas: ¿cuánto pesa su `state-<uid>.json` realista? ¿Hay margen?
47. `[código]` Sin `baseRev` se interpreta como sobrescritura deliberada. ¿Qué endpoint y
    qué rol pueden mandar eso? Si es el mismo `PUT`, es un bypass del control de
    concurrencia.
48. `[test]` "Nunca deja que un documento encoja" es una garantía fuerte. ¿Cómo se
    concilia con un borrado legítimo masivo (el usuario limpia su historial)?

### H. Autenticación y seguridad

49. `[producto]` La sesión dura 90 días y solo `sv` la revoca. Perder el teléfono
    significa cerrar sesión en **todos** los dispositivos. ¿Hay revocación por
    dispositivo?
50. `[test]` Bump de `sv` invalida todos los tokens. ¿El usuario pierde también el
    estado local no sincronizado, o el cliente conserva `gym_stash`?
51. `[código]` Los flujos de passkey y pairing no tienen throttle. El tope es 20.000
    challenges en memoria. ¿Qué pasa al llegar al tope: se rechazan nuevos, se desaloja
    el más viejo, o crece sin control?
52. `[test]` El device link es de 60 bits con TTL de 10 min. Sin throttle, ¿cuántos
    intentos tolera antes de que la probabilidad de acierto sea relevante? Calcular el
    presupuesto real.
53. `[código]` `TRUST_PROXY=1` confía en el `X-Forwarded-For` más a la derecha. Si nginx
    lo **sobrescribe** (como hace), es correcto. ¿Qué pasa en un deploy sin nginx delante?
54. `[test]` El guard SSRF bloquea privadas dentro del `lookup`. ¿Cubre IPv6 mapeadas,
    NAT64 y 6to4? El informe anterior dice que sí; verificarlo con casos concretos.
55. `[producto]` El servidor no limpia EXIF. ¿Se puede mover esa responsabilidad al
    servidor sin romper el "dependency-light"?

### I. Importadores, unidades y fechas

56. `[test]` El matching por word-bag es en inglés. Un export de Strong en español, ¿cae
    a match exacto o crea ejercicios nuevos silenciosamente?
57. `[test]` Los ids son `cyrb53` deterministas. Reimportar el mismo archivo, ¿deduplica
    o duplica? El informe menciona tests de idempotencia; conviene verificar el caso de
    reimportar **después** de editar una sesión.
58. `[test]` Límite de 2.000 kg. Un leg press de 400 kg es normal; uno de 600 kg
    también. ¿El límite está pensado para peso muerto y no para máquina?
59. `[test]` Las fechas se anclan a mediodía local. Un viaje que cruza husos horarios:
    ¿la sesión cambia de día al volver?
60. `[código]` La conversión kg↔lb redondea cargas a 0,5 lb / 0,25 kg, pero el peso
    corporal a 0,1. ¿Ese redondeo se aplica una sola vez o se acumula al ida y vuelta?

### J. Catálogo e i18n

61. `[producto]` 5.632 ejercicios con 15 packs de instrucciones, 17 de nombres y 2 de
    descripciones. ¿La estrategia es traducir todo o aceptar el fallback a inglés de
    forma permanente?
62. `[test]` `de-CH` se genera con ß→ss. ¿Hay palabras donde esa transformación es
    incorrecta en contexto suizo?
63. `[producto]` Las 922 variantes femeninas: ¿duplican el id en los workouts o son
    alias? Si son alias, un PR en la variante femenina, ¿cuenta para la masculina?
64. `[código]` El `muscleMap` solo existe en 246 de 6.554 entradas. ¿Cómo se calcula el
    volumen muscular para las otras 6.308?
65. `[test]` `check-media.mjs` falla si algo supera 180 px. ¿También valida el peso del
    archivo y las dimensiones declaradas en el manifiesto, o solo el lado mayor?

---

## 12. Batería de verificación numérica

> Valores calculados a mano a partir de las fórmulas documentadas. Sirven como
> **oráculo independiente**: si el código devuelve otra cosa, hay que decidir cuál está
> mal.

### 12.1 Fórmulas de 1RM con `w = 100 kg`, `r = 10`

| Fórmula | Resultado | Redondeado a 0,1 |
|---|---|---|
| Epley | 133,333 | **133,3** |
| Brzycki | 133,333 | **133,3** |
| Lombardi | 125,893 | **125,9** |
| O'Conner | 125,000 | **125,0** |
| Mayhew | 130,934 | **130,9** |
| Wathan | 134,746 | **134,7** |
| Lander | 134,070 | **134,1** |

**Observación clave:** con el mismo set, el rango va de **125,0 a 134,7 kg** — casi
10 kg de diferencia. A 5 reps el rango se cierra (112,5 a 117,5). Esa dispersión es
exactamente lo que la métrica de confianza debería estar midiendo.

| `w`, `r` | Epley | Brzycki | Lombardi |
|---|---|---|---|
| 100, 5 | 116,7 | 112,5 | 117,5 |
| 100, 12 | 140,0 | 144,0 | 128,3 |
| 60, 8 | 76,0 | 79,0 | 73,9 |
| 140, 3 | 154,0 | 158,9 | 156,3 |

### 12.2 Cadena de recuperación

Con 8 series efectivas y RIR ≤ 3 (peso de serie = 1,0):

| Vida media | t = 0 | t = 24 h | t = 48 h | t = 96 h |
|---|---|---|---|---|
| 24 h | `v=1,000` → **0,632** fatigado | `v=0,500` → **0,393** recuperando | `v=0,250` → **0,221** listo | `v=0,063` → **0,061** listo |
| 30 h | `v=1,000` → **0,632** | `v=0,574` → **0,437** recuperando | `v=0,330` → **0,281** recuperando | `v=0,109` → **0,103** listo |
| 48 h | `v=1,000` → **0,632** | `v=0,707` → **0,507** fatigado | `v=0,500` → **0,393** recuperando | `v=0,250` → **0,221** listo |

**El punto discutible:** con vida media de 48 h, a las 24 h exactas la fatiga es
**0,507**, apenas por encima del umbral de 0,5. Un cuarto de hora de diferencia cambia
el estado mostrado. Es un borde frágil.

### 12.3 Cálculo de discos

Barra olímpica de 20 kg, inventario estándar de 6 pares:

| Objetivo | Por lado | Discos por lado | Total | Nota |
|---|---|---|---|---|
| 100 kg | 40,0 | 25 + 15 | 4 | Greedy resuelve |
| 102,5 kg | 41,25 | 25 + 15 + 1,25 | 6 | Requiere el disco chico |
| 101 kg | 40,5 | 25 + 15 | 4 | **`missing = 0,5 kg` por lado** |
| 180 kg | 80,0 | 25 + 25 + 15 + 15 | 8 | Inventario al límite |
| 62,5 kg | 21,25 | 20 + 1,25 | 4 | Salto de tamaño |

### 12.4 Balance estructural — ejemplo trabajado

**Dato:** peso corporal 80 kg. Objetivo ATG: RDL al 100 % del peso corporal × 12 reps.
El usuario registra 60 kg × 8.

1. Epley del set real: `60 · (1 + 8/30) = 76,0 kg`.
2. Inversa de Epley para 12 reps: `76,0 / (1 + 12/30) = 76,0 / 1,4 = 54,3 kg`.
3. Ratio contra el objetivo: `54,3 / 80 = 0,679`.
4. Resultado: **67,9 %** → `target 100 %`, `borderline ≥ 95 %` → **débil**.

**Segundo ejemplo, mismo usuario:** press militar con mancuernas al 33 % × 8.
Objetivo = `0,33 × 80 = 26,4 kg`. El usuario hace 30 kg × 8:

1. Epley: `30 · (1 + 8/30) = 38,0 kg`.
2. Inversa para 8 reps: `38,0 / 1,2667 = 30,0 kg` (coincide, porque son las mismas reps).
3. Ratio: `30,0 / 26,4 = 1,136`.
4. Resultado: **113,6 %** → **balanceado**.

### 12.5 Poliquin con bench de 100 kg

| Ejercicio | Ratio | Objetivo |
|---|---|---|
| Close-grip bench | 100 % | 100 kg |
| Press inclinado | 91 % | 91 kg |
| Dips | 117 % | 117 kg |
| Dominada supina | 87 % | 87 kg |
| Curl | 40 % | 40 kg |

Con sentadilla de 140 kg: peso muerto `175 kg`, sentadilla frontal `119 kg`,
power clean `85,4 kg`.

### 12.6 Volumen y unidades

| Caso | Cálculo | Resultado |
|---|---|---|
| Mancuernas 2×20 kg × 10 reps "cada una" | `20 × 10 × 2` | **400 kg** de volumen |
| Barra 100 kg × 5 reps + 1 drop de 80 kg × 8 | `100×5 + 80×8` | **1.140 kg** |
| Músculo primario 1,0, secundario 0,4, 4 series | `4 × 1,0` + `4 × 0,4` | **4,0** y **1,6** series efectivas |
| 100 kg → lb | `×2,2046226218` | **220,5 lb** |
| 45 lb → kg | `÷2,2046226218` | **20,4 kg** |

### 12.7 Cómo ejecutar la verificación

```bash
# Toda la suite de dominio
cd frontend && npm test

# Solo el motor de progresión
npx vitest run src/lib/progression.test.js

# Solo 1RM
npx vitest run src/lib/onerm.test.js

# Solo recuperación
npx vitest run src/lib/recovery.test.js

# Un test concreto por nombre
npx vitest run -t "deload"

# API y MCP
cd api && npm test
cd mcp && npm test
```

Para contrastar un valor contra la interfaz, el MCP reimporta los mismos módulos puros:
si el MCP y la UI discrepan, hay un bug de derivación, no de fórmula.

---

## Apéndice — procedencia

Este documento se construyó por lectura estática del repositorio, sin ejecutar la
aplicación. Los conteos marcados como *verificado* se comprobaron directamente sobre el
árbol de archivos:

- `catalogue/exercises` → 6.554 archivos
- `catalogue/i18n` → 17 archivos
- `frontend/src/lib/**/*.test.js` → 209 archivos
- `api/server.js` → 2.890 líneas
- `frontend/src/index.css` → 2.093 líneas

El resto de las cifras proviene de lectura dirigida de los archivos citados. Donde el
informe original estimaba, aquí se indica el valor medido. Los valores de la sección 12
son cálculos independientes sobre las fórmulas documentadas en el código, no salidas
capturadas de la aplicación.
