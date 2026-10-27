# GymLab — Arquitectura, contenido y cálculos

> **Qué es este documento.** Radiografía técnica del proyecto y, sobre todo, banco de
> preguntas para auditar la capa de datos y cálculos. La parte visual es subjetiva y
> cambia con el rediseño; las fórmulas, los umbrales y las fuentes de verdad no.
>
> **Estado del análisis.** Lectura estática del repositorio el **2026-10-25**, rama
> `main` @ `3bc868ca`. No se ejecutó la app ni se reprodujeron los hallazgos en runtime:
> cuando algo se marca como *posible inconsistencia*, es una lectura de código y debe
> confirmarse con un test antes de tocarlo.
>
> **Alcance.** `gymlab-app/` (código, seeds, docs), `content/`, `legal/` y documentos de
> fase (`PLAN.md`, `CHANGELOG.md`, `odd/tasks/`).

---

## Índice

1. [Qué es y en qué estado está](#1-qué-es-y-en-qué-estado-está)
2. [Arquitectura](#2-arquitectura)
3. [Diseño (resumen, capa subjetiva)](#3-diseño-resumen-capa-subjetiva)
4. [Assets](#4-assets)
5. [Contenido y datos semilla](#5-contenido-y-datos-semilla)
6. [Cálculos y algoritmos](#6-cálculos-y-algoritmos)
7. [Mapa de cálculos: archivo → función → consumidor](#7-mapa-de-cálculos-archivo--función--consumidor)
8. [Constantes mágicas y su justificación](#8-constantes-mágicas-y-su-justificación)
9. [Hallazgos y riesgos de datos](#9-hallazgos-y-riesgos-de-datos)
10. [Preguntas para profundizar](#10-preguntas-para-profundizar)
11. [Plan de auditoría de cálculos](#11-plan-de-auditoría-de-cálculos)
12. [Glosario de fórmulas](#12-glosario-de-fórmulas)
13. [Comandos y verificación](#13-comandos-y-verificación)

---

## 1. Qué es y en qué estado está

**GymLab** es una aplicación de entrenamiento **local-first**: sin backend, sin cuenta y
sin nube en el MVP. Todo vive en IndexedDB del dispositivo y se exporta a un JSON.

- **Stack:** Vite 8 + React 19 + TypeScript 7 + Tailwind v4 + Dexie 4 + Zustand 5 +
  Recharts 3 + react-router 7 + i18next + Capacitor 8 (Android/iOS) + `vite-plugin-pwa`.
- **Tamaño:** ~61.000 líneas TS/TSX en `src`, 46 páginas, 262 archivos de componentes,
  82 hooks y 102 archivos de dominio.
- **Rama de trabajo:** `main`. El rediseño **Nocturno Minimal** (F132) está a mitad de
  camino: 132.1 a 132.5 ya integrados; 132.6 (Nutrición), 132.7 (Aprender) y 132.8
  (Sistema) pendientes.
- **Licencia:** propietaria, *All Rights Reserved*, código público solo para consulta
  (`LICENSE`). El material de terceros conserva su licencia (fotos de ejercicios:
  free-exercise-db, Unlicense).

---

## 2. Arquitectura

### 2.1 Capas

La regla está documentada en `gymlab-app/AGENTS.md` y se respeta en todo el árbol:

```
UI (pages/components) → hooks → repositories (interfaz) → Dexie
                      ↘ domain/ (cálculos puros)
```

| Capa | Responsabilidad | Prohibiciones |
|---|---|---|
| `src/domain/` | Cálculos, reglas, tipos, agregaciones | React, Dexie, UI, i18n |
| `src/data/repositories/` | Persistencia detrás de interfaces | Lógica de negocio |
| `src/hooks/` | Puente reactivo entre repos y UI | Cálculos de dominio propios |
| `src/store/` | Estado efímero de la sesión activa | Persistencia de negocio |
| `src/pages` + `src/components` | Presentación | Acceso directo a `db` |

Puntos fuertes reales:

- **Dominio puro y testeable** sin montar React ni IndexedDB.
- **Fachada única** de repositorios (`src/data/repositories/index.ts`): la UI nunca
  importa la implementación Dexie.
- **Fuente única de verdad** para PR, carga recomendada y progresión. Evita el clásico
  “la calculadora dice 100 y el récord dice 97”.

### 2.2 Base de datos

- Nombre: `GymLabDB` (IndexedDB vía Dexie).
- **28 tablas** y **15 versiones de schema** con migraciones incrementales. Una versión
  publicada no se modifica: se agrega la siguiente.
- Tablas principales: `exercises`, `routines`, `routineDays`, `routineItems`, `workouts`,
  `workoutSets`, `prs`, `profile`, `activeProgram`, `bodyWeight`, `bodyMeasurements`,
  `skinfolds`, `dailySteps`, `mealEntries`, `foods`, `supplements`, `progressPhotos`,
  `benchmarkResults`, `periodizationPlans`, `workoutTemplates`, `sessionJournals`,
  `exerciseNotes`, `meta`, y las heredadas `socialProfiles`/`posts`/`postMedia`.
- `SEED_VERSION = '23'`: al cambiarla, el reseeder vuelve a sembrar catálogo y rutinas.

### 2.3 Arranque y seed

1. Se aplica el idioma guardado (arranque mínimo).
2. Se monta la shell.
3. El seed corre en segundo plano (`SeedingProvider` + `seedingStore`).
4. El catálogo se intenta descargar de `public/catalog/exercises-v2.json`; si falla
   (offline), cae al seed embebido de `exercisesExtra`; si ese chunk también falla, el
   seed sigue con el catálogo base en lugar de bloquear el arranque.

### 2.4 Rutas

Cuatro tabs fijas: **Entrenar · Rutinas · Estadísticas · Más**. Alrededor de 42
pantallas reales, entre ellas:

| Grupo | Rutas |
|---|---|
| Entrenamiento | `/`, `/entrenamiento/active`, `/entrenamiento/:id`, `/timer`, `/calendario` |
| Rutinas | `/rutinas`, `/rutinas/:slug`, `/rutinas/:slug/editar`, `/rutinas/nueva`, `/rutinas/planificador` |
| Catálogo | `/ejercicios`, `/ejercicios/:slug` |
| Estadísticas | `/estadisticas` (Entreno · Cuerpo · Fuerza · Periodización) |
| Cuerpo | `/cuerpo`, `/peso-corporal`, `/progreso-fotos`, `/progreso-fotos/comparar`, `/calculadoras/medidas`, `/calculadoras/grasa`, `/calculadoras/navy` |
| Calculadoras | `/calculadoras`, IMC, calorías/macros, 1RM, agua, conversor, discos |
| Actividad | `/pasos`, `/logros`, `/objetivos`, `/wearables` |
| Nutrición | `/nutricion`, `/suplementos` |
| Aprender | `/papers`, `/papers/:slug`, `/guias`, `/guias/:slug` |
| Sistema | `/perfil`, `/perfil/historial`, `/ajustes`, `/terminos`, `/privacidad` |

Detalle de arquitectura que vale la pena conservar: `base: '/'` en Vite es obligatorio.
Con `base: './'` las rutas de dos segmentos (`/entrenamiento/active`, `/calculadoras/imc`)
rompen el entry y dejan la app nativa en pantalla negra.

### 2.5 Estado de la sesión activa

`src/store/activeWorkoutStore.ts` (Zustand + persist):

- Acciones: `startWorkout`, `loadRoutineDay`, `addExercise`, `removeExercise`,
  `completeExercise`, `addSet`, `removeSet`, `updateSet`, `applyWeightToRemaining`,
  `applyEscalada`, `addWarmupSet`, `setRestMode`, `startRest`, `reconcileRest`,
  `stopRest`, `pushUndo`, `undo`, `reset`.
- **Persistencia diferida**: cada tecla no escribe localStorage; se agrupa con un timer y
  se fuerza el flush al cerrar u ocultar la pestaña.
- **Undo** con snapshot y mensaje i18n (`eliminated` / `added`).

### 2.6 i18n y unidades

- `es` y `en` completos, con claves tipadas: `es` define la forma y `en` debe cumplirla.
- **Default del producto: inglés.** La preferencia guardada siempre gana.
- Almacenamiento **siempre en kg**; la UI muestra kg o lb según `settings.units`.
- Fechas de negocio en local `YYYY-MM-DD`, no UTC.

---

## 3. Diseño (resumen, capa subjetiva)

Dos capas conviven:

1. **The Iron Lab** (`docs/DESIGN.md`): dark gym-as-laboratory. Carbón `#121214`,
   gunmetal `#242422`, dorado `#D9B384` / `#FDDDB4`, Oswald para cifras y titulares,
   Barlow para cuerpo, profundidad por tono y no por sombras.
2. **Nocturno Minimal** (`docs/design/NOCTURNO-MINIMAL.md`): evolución actual. Un solo
   héroe por pantalla, hairlines en vez de tarjetas, un solo acento semántico (dorado =
   marca/progreso; verde = meta/PR/cumplido; rojo = error), charts de 110 px (donuts
   160), rangos por sección, sin glows.

**Tokens reales** en `src/index.css`: 6 paletas (`gold`, `energy`, `crimson`, `electric`,
`violet`, `gray`) × 2 temas (`night`/`day`), aplicadas con `data-palette` y `data-theme`.

Reglas no negociables: targets ≥ 44 px, gaps ≥ 8 px, scrollbars ocultas, drag-scroll,
`prefers-reduced-motion`, foco visible, roles/aria en tabs y charts.

> Esta sección es contexto. **No es la que hay que auditar**: cambia con el rediseño y es
> una decisión de producto. La sección 6 es la que define si la app dice la verdad.

---

## 4. Assets

| Asset | Detalle |
|---|---|
| Fuentes | 7 woff2 self-hosted: Oswald 500/600/700, Barlow 400/500/600/700 |
| Logos | `logo.svg`, `logo_completo.svg`, `logo_letras.svg`, `logo_simbolo.svg`, `logo.jpg` |
| Iconos PWA | `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `icons.svg` |
| Imágenes de rutinas | 68 portadas + `home-hero.jpg` + `default.jpg` (~70 archivos) |
| Fotos de ejercicios | 1.746 JPG en `public/exercises/*/0.jpg` y `1.jpg` (**~94 MB**) |
| Placeholders | SVG propios en `public/exercises/placeholders/` |
| Catálogo | `public/catalog/exercises-v2.json` (294 KB) |
| Legal | `legal/privacidad.html` + pantallas de Términos/Privacidad |

---

## 5. Contenido y datos semilla

| Bloque | Volumen | Fuente |
|---|---|---|
| Ejercicios | **873** (52 curados + 821 extra) | `src/data/seed/exercises.ts` + `exercisesExtra/` |
| Rutinas | **68** | `src/data/seed/routines/routines.ts` |
| Días de rutina | **220** | `routines/days.ts` |
| Items de rutina | **1.042** | `routines/items.ts` |
| Guías | **36** | `src/data/seed/guides/*.ts` |
| Papers | **6** con fuentes reales | `src/data/seed/papers.ts` |
| Alimentos | **171** | `src/domain/nutrition.ts` (`FOOD_SEED`) |
| Retos | **14** | `src/domain/challenges.ts` (`CHALLENGES`) |
| Logros | **36** | `src/domain/achievements.ts` |
| Biblioteca fuente | 6 carpetas markdown (~170 KB) | `content/training-library/` |

Categorías de guías: técnica, progresión, deload, lesiones, HIIT vs LISS, nutrición,
mujer/glúteo, recuperación, suplementos y perfiles históricos. Los papers cubren
hipertrofia, nutrición, descanso, frecuencia, sueño y sobrecarga progresiva.

**Taxonomía:** 10 grupos musculares (`pecho`, `espalda`, `biceps`, `triceps`, `hombro`,
`pierna`, `gluteo`, `abdomen`, `trapecios`, `antebrazo`), 18 zonas corporales, 6 objetivos,
4 niveles y un conjunto de equipamiento declarado por ejercicio (barra + banco son
requisitos simultáneos, no alternativas).

---

## 6. Cálculos y algoritmos

> Todo lo de esta sección vive en `src/domain/` salvo que se indique lo contrario.

### 6.1 Fuerza, e1RM y PR

**e1RM (Brzycki)** — `domain/prs.ts`

```
1RM = peso × 36 / (37 − reps)
reps = 1  → 1RM = peso
reps ≥ 37 → 0   (la fórmula se vuelve indefinida/negativa)
redondeo: 1 decimal
```

**Epley** — `domain/calculators/oneRepMax.ts`

```
1RM = peso × (1 + reps / 30)
reps ≤ 1 → peso redondeado a 0,5 kg
redondeo: 0,5 kg
```

**Detección de PR** (`detectPRsFromSets`): recorre las series guardadas, calcula el e1RM
de cada una y conserva el mejor por ejercicio. Solo crea PR si supera el `estimated1RM`
existente. El PR se persiste con `date = createdAt` de la serie, que al guardar la sesión
es el `finishedAt` de la sesión.

**Recomputo al borrar** (`bestPRFromSets`): al eliminar una sesión se recalcula el mejor
PR que queda con las series restantes; si no queda ninguna válida, el PR se elimina. Es
idempotente.

**Comparador de calculadora** (`oneRepMaxLabel`): devuelve Epley, Brzycki y la diferencia
en kg.

### 6.2 Volumen y estadísticas

- **Volumen de serie:** `peso × reps` (`domain/volume.ts`).
- **Volumen total:** suma de series completadas.
- **Formato:** `k` / `M` para cifras grandes.
- **Frecuencia semanal:** sesiones por semana con lunes como inicio.
- **Duración media:** solo sesiones con `finishedAt`.
- **Volumen por músculo:** agrupa por `exercise.muscleGroup`.
- **Velas OHLC de carga:** por sesión de un ejercicio, `open` = primera serie,
  `close` = última, `high`/`low` = máximo/mínimo. Sin calentamientos.
- **Velas OHLC de volumen:** por semana, con el volumen de cada día entrenado.
- **Serie de e1RM:** por fecha, el mejor e1RM del día.
- **Comparador de sesiones:** volumen, duración, calorías, series, reps, ejercicios, PRs,
  intensidad (`volumen / reps`), peso medio por serie, e1RM medio y volumen por músculo.
  Deltas absolutos y porcentuales; `pct = null` si la base es 0.

### 6.3 Recuperación, rachas y fatiga

**Recovery score** — `domain/recoveryScore.ts`

| Factor | Peso | Escala |
|---|---|---|
| Días sin entrenar | 0,40 | 0 días = 100; 7+ días = 0 |
| Sueño | 0,25 | 1 = 0; 5 = 100 |
| Dolor | 0,20 | 1 = mucho dolor = 0; 5 = sin dolor = 100 |
| Racha | 0,15 | 0 días = 0; 7+ = 100 |
| Pasos | 0,15 | ratio pasos/meta, tope 100 |

Los pesos se **renormalizan** sobre los factores disponibles. Si no hay ningún dato, el
score es 0 y la clasificación es `rest`. Umbrales: `rest < 40 ≤ maybe < 70 ≤ ready`.

**Racha** — `domain/streak.ts`

- Una semana cuenta si tiene **≥ 3 sesiones** (`MIN_WEEKLY_SESSIONS`).
- La racha actual exige que la última semana cumplida esté a ≤ 7 días de la semana actual.
- `longestStreak` recorre todas las semanas cumplidas.
- Insignias: 4, 8 y 16 semanas.

**Fatiga muscular** — `domain/muscleFatigue.ts`

```
< 18 h  → sore
< 48 h  → fatigued
< 72 h  → warm
≥ 72 h  → fresh
```

**Frecuencia objetivo** — `domain/muscleFrequency.ts`: 2 sesiones/semana por grupo;
abdomen 3; trapecios y antebrazo 1. Alerta si la desviación supera ±20 %.

**Balance push/pull/legs** — `domain/pushPullBalance.ts`: clasificación por grupo y alerta
si la diferencia entre push y pull supera 20 puntos porcentuales.

### 6.4 Deload

`domain/deload.ts`

| Señal | Puntos |
|---|---|
| Caída de volumen ≥ 15 % | 30 |
| RPE promedio ≥ 8 en la última semana | 25 |
| Caída de reps vs. semana anterior | 25 |
| > 8 semanas seguidas entrenando | 10 |
| Semana del programa coincide con `deloadWeek` | 10 |

Score máximo 100. Se sugiere deload desde **60**. Durante la semana de deload el peso se
reduce un **10 %** y se redondea a 0,5 kg.

### 6.5 Estancamiento y proyección

**Estancamiento** — `domain/plateauDetector.ts`

- Compara el e1RM promedio de los últimos 28 días contra los 28 anteriores.
- Si la mejora es < 2 %, busca semanas consecutivas sin mejora.
- Alerta desde **3 semanas**; sugiere volumen (3), variante (4) o deload (6+).

**Proyección de objetivos** — `domain/goalProjection.ts`

- e1RM actual: promedio de los últimos 28 días.
- Tasa semanal: promedio de las tasas de las últimas 4 semanas.
- Fallback: comparación mensual o **0,5 kg/semana** por defecto.
- Tasa mínima: **0,1 kg/semana**.
- `weeksToTarget = ceil(gap / tasa)`; fecha estimada = hoy + semanas × 7.

### 6.6 Benchmarks y estándares de fuerza

`domain/benchmark.ts` y `domain/strengthStandards.ts`

- Tests: sentadilla, banca, peso muerto y press militar.
- Re-test recomendado cada **6 semanas**.
- Tablas de percentiles por peso corporal (60–120 kg) para hombres:
  `[p25, p50, p75, p90]` = principiante, intermedio, avanzado, élite.
- Interpolación lineal entre pesos.
- Nivel: `elite` ≥ p90, `avanzado` ≥ p75, `intermedio` ≥ p50, resto `principiante`.
- Percentil aproximado por tramos entre p25/p50/p75/p90.

### 6.7 Calculadoras de salud

**IMC** — `domain/calculators/imc.ts`

```
IMC = kg / m²
OMS: < 18,5 bajo peso · < 25 normal · < 30 sobrepeso · ≥ 30 obesidad
```

**BMR / TDEE** — `domain/calculators/tdee.ts`

```
Mifflin-St Jeor:
  hombre: 10w + 6,25h − 5a + 5
  mujer:  10w + 6,25h − 5a − 161
TDEE = BMR × factor de actividad (1,2 / 1,375 / 1,55 / 1,725 / 1,9)
Déficit = 20 % del TDEE, con tope duro de 500 kcal/día
Superávit = +15 %
```

**Macros** — `domain/calculators/macros.ts`

```
Proteína: 1,8 g/kg (volumen y mantenimiento) · 2,2 g/kg (definición)
Grasas:   0,8 g/kg
Carbohidratos: (kcal objetivo − proteína×4 − grasas×9) / 4, mínimo 0
kcal objetivo: TDEE × 1,1 (volumen) · TDEE (mantenimiento) · déficit (definición)
```

**Agua** — `domain/calculators/water.ts`

```
litros = (peso × 30 ml) / 1000 + (minutos / 30) × 0,5
vasos = ceil(litros / tamaño del vaso)
```

**Discos** — `domain/calculators/plates.ts`

- Platos: 25 / 20 / 15 / 10 / 5 / 2,5 / 1,25 kg.
- Barra por defecto: 20 kg.
- Greedy: el plato más grande que todavía entra por lado.
- Tope de peso: 1.000 kg.
- `exact` si la diferencia con el objetivo es < 0,01 kg.

**Conversión** — `domain/calculators/converter.ts`

```
1 lb = 0,45359237 kg
redondeo a 1 decimal
redondeo a placa: múltiplo de 2,5 kg por defecto
```

**Navy** — `domain/calculators/navy.ts`

```
Hombre: 495 / (1,0324 − 0,19077·log10(cintura − cuello) + 0,15456·log10(altura)) − 450
Mujer:  495 / (1,29579 − 0,35004·log10(cintura + cadera − cuello) + 0,22100·log10(altura)) − 450
medidas en pulgadas
```

**Jackson-Pollock + Siri** — `domain/calculators/bodyComposition.ts`

```
3 pliegues hombre: pectoral, abdominal, muslo
3 pliegues mujer:  tríceps, suprailíaco, muslo
7 pliegues:         pectoral, axilar, tríceps, subescapular, abdominal, suprailíaco, muslo

Densidad (7, hombre): 1,112 − 0,00043499·Σ + 0,00000055·Σ² − 0,00028826·edad
Densidad (7, mujer):  1,097 − 0,00046971·Σ + 0,00000056·Σ² − 0,00012828·edad
Densidad (3, hombre): 1,10938 − 0,0008267·Σ + 0,0000016·Σ² − 0,0002574·edad
Densidad (3, mujer):  1,0994921 − 0,0009929·Σ + 0,0000023·Σ² − 0,0001392·edad

% grasa (Siri) = 495 / densidad − 450
Masa grasa = peso × %grasa / 100
Masa magra = peso × (1 − %grasa / 100)
Hueso (Matiegka simplificado) = altura × 0,128 + peso × 0,245 − 2,95
Músculo = masa magra − hueso
```

**Ratios** — `domain/calculators/bodyComposition.ts`

```
WHtR = cintura / altura
  saludable ≤ 0,5 · riesgo aumentado ≤ 0,6 · riesgo alto > 0,6
WHR = cintura / cadera
  hombre: < 0,9 bajo · < 1,0 moderado · ≥ 1,0 alto
  mujer:  < 0,8 bajo · < 0,9 moderado · ≥ 0,9 alto
Simetría = |izq − der| / ((izq + der) / 2) × 100
```

### 6.8 Cardio y pasos

**Cardio** — `domain/cardio.ts`

```
Calorías = MET × peso(kg) × horas
Ritmo (min/km) = (segundos / 60) / km
Velocidad (km/h) = km / horas
```

MET por subcadena del slug: running 8,0 · cycling 6,0 · rowing 7,0 · swimming 8,0 ·
jumping rope 10,0 · elliptical 5,0 · walking 3,5 · stair climbing 9,0 · boxing 7,5 ·
genérico 5,0.

**Pasos** — `domain/stepsTracker.ts`

```
Distancia (km) = pasos × zancada(cm) / 100 / 1000
Zancada por defecto = altura × 0,415 (70 cm si no hay altura)
Calorías = pasos × 0,04   (independiente del peso)
Racha = días consecutivos cumpliendo la meta
Heatmap: 0 / ≥25 % / ≥50 % / ≥100 % de la meta
```

Meta por defecto: 7.000 pasos.

### 6.9 Nutrición

`domain/nutrition.ts`

- Alimentos definidos por 100 g, salvo `baseGrams`.
- Macros proporcionales: `valor × gramos / baseGrams`.
- Totales diarios: suma de kcal, proteína, carbohidratos y grasas de todos los items.
- Stats para medallas: comidas registradas, días consecutivos, pico de proteína diaria,
  días distintos.
- TDEE ajustado por pasos: `TDEE + pasos × 0,04`.

### 6.10 Planificación de rutinas

**Resolución** — `domain/routineResolution.ts`

- Equipamiento requerido por rutina = unión del equipamiento de sus ejercicios.
- Match de rutina predefinida: objetivo y nivel **exactos**, equipamiento requerido
  **⊆** equipamiento declarado. Si no hay días exactos, la más cercana; desempate por
  días y luego por id.
- Generación de plan por split: 2 días superior/inferior; 3 días push/pull/legs; 4 días
  con pierna intercalada para no repetir grupos en días consecutivos.
- Ranking de candidatos y reporte de cobertura (`omittedGroups`, `droppedDays`).

**Ajuste a duración** — `domain/planDuration.ts`

- Tolerancia ±5 minutos por sesión.
- Recorta desde el final sin dejar un grupo sin representación.
- Expande con candidatos del mismo grupo que no se hayan usado en **todo el plan**.
- Una sola pasada de recorte y una de expansión, sin ping-pong.

**Periodización** — `domain/periodization.ts` y `autoPeriodization.ts`

- Mesociclos: volumen, hipertrofia, fuerza, deload, potencia.
- Semana actual = semanas transcurridas desde `startDate`, acotada al total.
- Auto-plan por señales de las últimas 12 semanas: tendencia de volumen, frecuencia alta
  sostenida y estancamientos. Sin datos, plan estándar de 12 semanas.

### 6.11 Retos y logros

**Retos** — `domain/challenges.ts`

- 14 retos, 6 tipos (frecuencia, volumen, PR, consistencia, pasos, cardio) y 4 duraciones
  (1 semana, 2 semanas, 1 mes, 2 meses).
- Nivel derivado del historial.
- Progreso con reset automático al terminar el periodo.
- Filtro por periodo con `isInPeriod` compartido por workouts, PRs y series.

**Logros** — `domain/achievements.ts` + `achievementProgress.ts`

- **36 logros** con tier bronce/plata/oro/platino.
- `ACHIEVEMENT_PROGRESS` es la fuente única de `current`, `target` y `completed`.
- El conteo de “veces conseguido” solo incrementa en la transición no-cumplido → cumplido.
- Bag dividido en `core` (entrenos, comidas, cuerpo, fotos) y `steps` para no recalcular
  todo cuando cambia `dailySteps`.

### 6.12 Insights

- **Volumen semanal:** semana actual vs. anterior. `+5 %` positivo, `−10 %` alerta,
  intermedio neutral.
- **Resumen semanal:** sesiones, volumen, PRs, mejor día, comparación y racha.
- **Narrativa de progreso:** bloques de 4 semanas vs. 4 anteriores para fuerza,
  frecuencia y volumen; dirección `up`/`down`/`stable` con umbral ±5 %.

---

## 7. Mapa de cálculos: archivo → función → consumidor

| Archivo | Función clave | Consumidores |
|---|---|---|
| `domain/prs.ts` | `estimate1RM`, `detectPRsFromSets`, `bestPRFromSets` | guardado de sesión, borrado, import, UI de serie |
| `domain/e1rm.ts` | `buildE1rmSeries` | gráficos de fuerza |
| `domain/volume.ts` | `calcSetVolume`, `calcTotalVolume` | sesión, stats, comparador |
| `domain/trainingStats.ts` | `weeklyFrequency`, `volumeByMuscleGroup`, `buildLoadRangeSeries`, `buildVolumeRangeSeries` | Estadísticas |
| `domain/setStats.ts` | `avgE1rmInRange`, `groupSetsByExercise` | estancamiento, objetivos, comparación |
| `domain/workingProgression.ts` | `workingBase`, `hasMargin`, `decideStep`, `planDayProposal` | sugerencia de escalada |
| `domain/loadRecommendation.ts` | `recentTopSetAverage`, `recommendLoad` | carga sugerida |
| `domain/sessionSuggestions.ts` | `generateSuggestions` | chips de sesión |
| `domain/recoveryScore.ts` | `computeRecoveryScore` | home, perfil |
| `domain/deload.ts` | `calcDeloadScore`, `generateDeloadGuidance` | home, sesión, perfil |
| `domain/plateauDetector.ts` | `detectPlateaus` | home, planificación |
| `domain/goalProjection.ts` | `buildGoalProjections` | `/objetivos` |
| `domain/strengthStandards.ts` | `getStrengthThresholds`, `getStrengthLevel`, `getStrengthPercentile` | Fuerza, benchmarks |
| `domain/benchmark.ts` | `estimate1RM`, `calcImprovement` | benchmark repo y UI |
| `domain/calculators/*` | IMC, TDEE, macros, agua, discos, conversión, Navy, composición | calculadoras |
| `domain/cardio.ts` | `calcCalories`, `calcPace`, `calcSpeed` | sesión, comparador |
| `domain/stepsTracker.ts` | `calculateDistance`, `calculateCalories`, `getStreak`, `getMonthlyHeatmap` | `/pasos`, logros |
| `domain/nutrition.ts` | `calculateFoodMacros`, `calculateDailyTotals`, `deriveMealStats` | `/nutricion` |
| `domain/routineResolution.ts` | `findPredefinedRoutine`, `planRoutine` | planificador |
| `domain/planDuration.ts` | `fitPlanToDuration` | planificador |
| `domain/periodization.ts` | `getCurrentWeek`, `getMesocycleProgress` | Periodización |
| `domain/autoPeriodization.ts` | `generateSmartPlan` | Periodización |
| `domain/challenges.ts` | `computeChallengeStats`, `currentForChallenge` | home, logros |
| `domain/achievementProgress.ts` | `progressForAll` | `/logros`, host global |

### Tests de referencia

`tests/unit/domain/` contiene suites específicas para casi todo lo anterior:
`prs`, `loadRecommendation`, `workingProgression`, `deload`, `recoveryScore`, `streak`,
`muscleFatigue`, `muscleFrequency`, `pushPullBalance`, `goalProjection`, `plateauDetector`
(implícito en `goalProjection`/`trainingStats`), `strengthStandards`, `benchmark`,
`bodyComposition`, `nutrition`, `stepsTracker`, `cardio`, `routineResolution`,
`planDuration`, `challenges`, `achievements`, `setStats`, `sessionComparison`.

---

## 8. Constantes mágicas y su justificación

Esta tabla es el corazón de la auditoría: **cada número que decide algo debería tener una
fuente o estar marcado como heurística**.

| Constante | Valor | Ubicación | Estado |
|---|---|---|---|
| `RECENT_SESSIONS_N` | 5 | `loadRecommendation`, `workingProgression` | Heurística declarada (“no un óptimo calibrado”) |
| `REPS_MARGIN` | 2 reps | `workingProgression` | Sin fuente citada |
| `MICRO_STEP_PCT` | 2,5 % | `workingProgression` | Atado al plato mínimo |
| `KNOWN_STEP_MAX_PCT` | 15 % | `workingProgression` | Sin fuente citada |
| `VELOCITY_THRESHOLD_PCT_PER_WEEK` | 2,5 % | `workingProgression` | Sin fuente citada |
| `VELOCITY_WINDOW_DAYS` | 21 | `workingProgression` | Sin fuente citada |
| `MIN_SESSIONS_AT_BASE` | 3 | `workingProgression` | Sin fuente citada |
| `FRESH_WINDOW_DAYS` | 28 (mín. 2 sesiones) | `workingProgression` | Sin fuente citada |
| `WARMUP_E1RM_THRESHOLD` | 0,70 | `sessionSuggestions` | Sin fuente citada |
| `WARMUP_WEIGHT_RATIO` | 0,45 | `sessionSuggestions` | Sin fuente citada |
| Bajar peso | 2,5 kg si RPE ≥ 9,5 o RIR ≤ 0,5 | `sessionSuggestions` | Sin fuente citada |
| Descanso extra | RPE ≥ 8 y ≥ 3 series | `sessionSuggestions` | Sin fuente citada |
| `RECOVERY_*` | pesos 40/25/20/15/15 | `recoveryScore` | Sin fuente citada |
| `RECOVERY_MAYBE_MIN` / `READY_MIN` | 40 / 70 | `recoveryScore` | Sin fuente citada |
| Fatiga | 18 / 48 / 72 h | `muscleFatigue` | “Umbrales empíricos” en el propio comentario |
| `FREQUENCY_TARGETS` | 2 / 3 / 1 | `muscleFrequency` | Sin fuente citada |
| `PUSH_PULL_ALERT_PCT` | 20 pp | `pushPullBalance` | Sin fuente citada |
| Deload score | 30/25/25/10/10, umbral 60 | `deload` | Sin fuente citada |
| Deload reducción | 10 % | `deload` | Decisión de producto |
| Estancamiento | < 2 % en 4 semanas, alerta ≥ 3 | `plateauDetector` | Sin fuente citada |
| Proyección | mínimo 0,1 kg/sem; default 0,5 | `goalProjection` | Sin fuente citada |
| `MIN_WEEKLY_SESSIONS` | 3 | `streak` | Decisión de producto (F93 #6) |
| `MAX_DEFICIT_KCAL` | 500 | `tdee` | Comentario cita evidencia |
| `BASE_ML_PER_KG` | 30 ml | `water` | Cita EFSA/Popkin |
| Recarga ejercicio | 0,5 L / 30 min (= 1 L/h) | `water` | **Contradice el rango citado (0,4–0,8 L/h)** |
| `calculateCalories` pasos | 0,04 kcal/paso | `stepsTracker` | Sin peso; aproximación |
| Zancada | 41,5 % de la altura | `stepsTracker` | Decisión F84a |
| MET | tabla fija | `cardio` | Valores estándar, clasificación por subcadena |
| `MAX_WEIGHT_KG` | 1.000 kg | `plates` | Tope de producto |
| Benchmarks | re-test cada 6 semanas | `benchmark` | Sin fuente citada |
| Estándares de fuerza | tablas 60–120 kg, solo hombres | `strengthStandards` | Fuente declarada (IPF/ExRx/Strength Level), sin tabla femenina |
| Masa ósea | `h×0,128 + peso×0,245 − 2,95` | `bodyComposition` | Cita blogs, no literatura primaria |

---

## 9. Hallazgos y riesgos de datos

> Repetido: esto sale de **leer el código**, no de reproducirlo. Cada hallazgo debería
> convertirse en un test rojo antes de corregirse.

### 9.1 Lo que está bien resuelto

- Dominio puro: se puede testear sin React ni Dexie.
- Fuente única para PR, carga y progresión.
- Backup atómico de las 28 tablas.
- Migraciones versionadas que no reescriben el pasado.
- Tests de dominio muy por encima de la media (89 archivos solo en `tests/unit/domain/`).
- i18n tipado y unidades internas consistentes en kg.

### 9.2 Inconsistencias detectadas

#### H1. Los calentamientos pueden generar PR (y el recomputo los ignora)

- `detectPRsFromSets` filtra `completed` y `weightKg > 0`, pero **no** `isWarmup`.
- `bestPRFromSets`, que se usa al borrar una sesión, **sí** filtra `isWarmup`.
- `saveWorkoutSession` le pasa todas las series guardadas, incluidos los warmups.
- Consecuencia: un calentamiento con muchas reps puede superar en e1RM al trabajo real
  (por Brzycki, 40 kg × 20 = 84,7 kg de e1RM) y crear un PR; al borrar esa sesión, el PR
  desaparece porque el recomputo excluye warmups.
- Riesgo: dato de PR inconsistente y no reproducible.

#### H2. Brzycki explota antes del guard

- `estimate1RM` devuelve 0 recién en `reps ≥ 37`. Con `reps = 36` devuelve `peso × 36`.
- Un set de 36 reps con 20 kg daría 720 kg de e1RM.
- La fórmula de Brzycki está validada para rangos bajos (≈1–10 reps); fuera de ahí no es
  una estimación defendible.
- Riesgo: PR absurdo, gráficos y proyecciones contaminados.

#### H3. Dos implementaciones distintas de `estimate1RM`

- `domain/prs.ts`: guarda `reps ≥ 37`, devuelve 0, redondea a 1 decimal.
- `domain/benchmark.ts`: **sin guarda**, sin redondeo. Con `reps = 37` divide por cero
  (`Infinity`); con `reps = 38` devuelve negativo.
- `benchmarkRepo.add` usa la versión sin guarda y el formulario no limita reps.
- Riesgo: benchmark con `Infinity` o negativo; percentil y nivel de fuerza corruptos.

#### H4. Política de warmups inconsistente entre métricas

| Métrica | Incluye warmups |
|---|---|
| `Workout.totalVolume` (al guardar) | Sí |
| `volumeByMuscleGroup` | Sí |
| `buildE1rmSeries` | Sí |
| `sessionComparison` | No |
| `deload.recentAvgRpe` | Sí |
| `setStats` (estancamiento, objetivos) | No |
| `workingProgression` | No |
| `loadRecommendation` | No |

Consecuencia: la misma sesión puede mostrar un volumen en la home y otro en el
comparador; el e1RM del gráfico puede incluir un calentamiento que el PR ignora.

#### H5. `detectPRsFromSets` no exige `reps > 0`

- Solo exige `completed` y `weightKg > 0`.
- Con `reps = 0`, `estimate1RM` devuelve 0; si no había PR previo, se crea un PR con
  `estimated1RM = 0`.
- Riesgo: PR “fantasma” si la UI permite guardar una serie con peso y 0 reps.

#### H6. La racha es incompatible con programas de 2 días

- `MIN_WEEKLY_SESSIONS = 3` es fijo.
- Las rutinas de 2 días del seed (Starting Strength, 5×5, mujer 2 días) nunca pueden
  completar una semana.
- Riesgo: el usuario hace todo bien y la app le muestra racha 0.

#### H7. La fatiga muscular ignora la hora del entrenamiento

- `fatigueMap` estima `horas = días × 24 + hora actual`.
- Si entrenaste ayer a las 20:00 y son las 09:00, calcula 33 h en vez de 13 h.
- Riesgo: un músculo pasa de `sore` a `fatigued` (o al revés) sin corresponder con la
  realidad.

#### H8. La proyección de objetivos siempre proyecta mejora

- `weeklyImprovement = Math.max(avgRate, 0,1)`.
- Si el usuario está retrocediendo, la app igual proyecta +0,1 kg/semana y una fecha.
- Riesgo: promesa optimista sobre datos negativos.

#### H9. El promedio de e1RM mezcla series, no sesiones

- `avgE1rmInRange` / `avgE1rmInGroupRange` promedian **cada serie**.
- Una sesión con 10 series pesa 10 veces más que una con 2; un set de 20 reps inflado
  por Brzycki arrastra el promedio.
- Afecta estancamiento, proyección de objetivos y narrativa de progreso.

#### H10. `importBackup` no limpia tablas vacías en el backup

- `if (rows.length === 0) continue` deja intacta la tabla actual.
- Un restore de un backup con una tabla vacía **no borra** los datos actuales de esa
  tabla: es un merge parcial, no un reemplazo.
- `parseBackup` valida `app === 'GymLab'` y que exista `tables`, pero no la versión ni el
  schema.
- Riesgo: datos viejos sobreviven a un “restore” y el usuario cree que restauró todo.

#### H11. Duplicación de `buildWeeklyVolumeSeries`

- `domain/weeklyVolume.ts`: rellena semanas intermedias con 0 y marca `isCurrent`.
- `domain/trainingStats.ts`: no rellena; solo devuelve semanas con datos.
- Mismo nombre, comportamiento distinto.
- Riesgo: dos gráficos que dicen cosas diferentes con el mismo dato.

#### H12. Umbrales de grasa corporal distintos entre calculadoras

| % grasa | Navy | Jackson-Pollock |
|---|---|---|
| 17,5 % (hombre) | Fitness | Promedio |
| 24,5 % (hombre) | Promedio | Elevado |

- Navy usa `< 18` para Fitness y `< 25` para Promedio; JP usa `≤ 17` y `≤ 24`.
- Misma persona, dos etiquetas distintas según la calculadora.
- Riesgo: contradicción visible en la app.

#### H13. Estándares de fuerza solo masculinos

- `MALE_STANDARDS` es la única tabla; `getStrengthPercentile` no recibe sexo.
- La app pregunta sexo en el onboarding y lo guarda, pero el percentil se calcula igual.
- Riesgo: una mujer ve un percentil calculado contra una tabla de hombres.

#### H14. Masa ósea con fuente débil y altura inventada

- La fórmula se atribuye a Matiegka, pero el comentario cita dos blogs, no literatura
  primaria.
- `buildBodyCompSeries` usa `heightCm` o **170 cm por defecto** si falta altura.
- Riesgo: masa ósea y masa muscular inventadas cuando no hay altura.

#### H15. `adjustTdeeForSteps` puede duplicar el gasto

- Suma `pasos × 0,04` al TDEE.
- El TDEE ya incluye un factor de actividad (1,2–1,9). Si el usuario eligió “activo”
  porque camina, los pasos se cuentan dos veces.
- Riesgo: superávit o déficit mal calculado.

#### H16. La recarga de agua contradice su propia fuente

- Fórmula: 0,5 L por cada 30 min = **1,0 L/h**.
- Comentario: “acorde a ACSM 0,4–0,8 L/h”.
- Riesgo: recomendación por encima del rango citado.

#### H17. Volumen de peso corporal = 0

- `calcSetVolume = peso × reps`.
- Dominadas, fondos, flexiones y planchas aportan 0 al volumen.
- No es un bug, es una decisión de producto; pero invisibiliza el entrenamiento con
  peso corporal en todas las estadísticas.

### 9.3 Deuda de datos (no errores)

- 94 MB de fotos dentro de `public/`.
- Archivos semilla enormes (`pierna.ts` 93 KB, `items.ts` 123 KB).
- Tablas sociales heredadas en el backup aunque el MVP no tenga social.
- `/wearables` es un estado vacío provisional, sin integración real.

---

## 10. Preguntas para profundizar

> **Cómo usar esta sección.** Cada pregunta tiene un identificador, una prioridad
> (P1 = puede cambiar un número que el usuario ve; P2 = afecta consistencia; P3 = deuda
> o producto) y la evidencia que la responde. La idea no es responderlas todas hoy: es
> elegir las P1 y convertirlas en tests.

### Top 10 para responder primero

1. ¿Un calentamiento puede crear un PR? (H1)
2. ¿Qué pasa con Brzycki en 36 reps? (H2)
3. ¿Por qué hay dos `estimate1RM`? (H3)
4. ¿Qué métricas incluyen warmups y cuáles no? (H4)
5. ¿La racha debe exigir 3 sesiones o adaptarse al plan? (H6)
6. ¿La fatiga debe usar la hora real del entreno? (H7)
7. ¿La proyección debe proyectar mejora cuando hay regresión? (H8)
8. ¿El promedio de e1RM debe ser por sesión o por serie? (H9)
9. ¿Un restore debe borrar tablas vacías? (H10)
10. ¿Qué tabla de estándares aplica a mujeres? (H13)

---

### A. PR, e1RM y fórmulas de fuerza

**Q-A1 (P1). ¿Un calentamiento puede generar un PR?**
- Por qué: `detectPRsFromSets` no filtra `isWarmup`; `bestPRFromSets` sí.
- Evidencia: test con warmup 40×20 y trabajo 60×5; comparar PR antes y después de borrar
  la sesión.

**Q-A2 (P1). ¿Cuál es el rango de reps válido para Brzycki en este producto?**
- Por qué: a 36 reps devuelve `peso × 36`; a 37 devuelve 0. No hay zona intermedia.
- Evidencia: tabla de e1RM para 1, 5, 10, 20, 30, 36 y 37 reps.

**Q-A3 (P1). ¿Deben convivir Brzycki y Epley en la misma app?**
- Por qué: la calculadora muestra las dos; los PRs usan Brzycki. El usuario ve dos
  números para el mismo set.
- Evidencia: `oneRepMaxLabel` vs. `estimate1RM`; decidir si se muestra una sola o se
  explica la diferencia.

**Q-A4 (P1). ¿Por qué hay dos implementaciones de `estimate1RM`?**
- Por qué: `prs.ts` tiene guarda y redondeo; `benchmark.ts` no tiene ninguna.
- Evidencia: `benchmarkRepo.add` con 37 y 38 reps; ver `Infinity`/negativo.

**Q-A5 (P1). ¿Qué pasa con una serie completada con peso y 0 reps?**
- Por qué: se puede crear un PR con `estimated1RM = 0` si no había PR previo.
- Evidencia: `detectPRsFromSets` con `[{ completed: true, weightKg: 50, reps: 0 }]`.

**Q-A6 (P2). ¿El redondeo debe ser 0,1 kg o 0,5 kg?**
- Por qué: Brzycki redondea a 0,1; Epley a 0,5; benchmark no redondea.
- Evidencia: comparar los tres valores para el mismo set.

**Q-A7 (P2). ¿El PR debe guardar el peso y las reps reales o solo el e1RM?**
- Por qué: el PR actual guarda `weightKg`, `reps` y `estimated1RM`; el peso real es el
  que el usuario levantó, no el estimado.
- Evidencia: revisar cómo se muestra el PR en la ficha y si el peso mostrado es el real.

**Q-A8 (P2). ¿Qué pasa si el usuario cambia de unidad (kg ↔ lb)?**
- Por qué: el almacenamiento es kg y la UI convierte; el PR no debería moverse.
- Evidencia: test de round-trip kg → lb → kg en el PR y en las series.

**Q-A9 (P2). ¿El e1RM de un set de calentamiento debe aparecer en el gráfico?**
- Por qué: `buildE1rmSeries` no filtra `isWarmup`.
- Evidencia: sesión con warmup alto y trabajo bajo; comparar gráfico vs. PR.

**Q-A10 (P3). ¿Qué fórmula usa el benchmark y por qué no la misma que los PRs?**
- Por qué: un benchmark es una medición de fuerza; debería hablar el mismo idioma que
  el resto de la app.
- Evidencia: `benchmark.ts` vs. `prs.ts`.

---

### B. Volumen, warmups y estadísticas

**Q-B1 (P1). ¿El volumen total debe incluir calentamientos?**
- Por qué: `computeSessionStats` los incluye; el comparador los excluye.
- Evidencia: sesión con 3 warmups y 3 series de trabajo; comparar `Workout.totalVolume`
  contra `compareSessions().volume`.

**Q-B2 (P1). ¿Qué definición de volumen usa cada pantalla?**
- Por qué: home, estadísticas, comparador y perfil pueden mostrar números distintos.
- Evidencia: matriz de consumidores (sección 7) + un test de integración con una sesión
  conocida.

**Q-B3 (P2). ¿El volumen por músculo debe incluir warmups?**
- Por qué: `volumeByMuscleGroup` no filtra `isWarmup`.
- Evidencia: mismo test que B1, mirando el desglose por grupo.

**Q-B4 (P2). ¿Cómo se cuenta el volumen de peso corporal?**
- Por qué: dominadas y flexiones suman 0.
- Evidencia: decidir si se cuenta por reps, por tiempo o por peso corporal del usuario.

**Q-B5 (P2). ¿Las series de cardio deben contar como volumen?**
- Por qué: tienen peso 0 y reps 0; entran por la rama de duración.
- Evidencia: revisar `computeSessionStats` y `calcTotalVolume` con series de cardio.

**Q-B6 (P2). ¿La duración de sesión debe ser tiempo real o tiempo en pantalla?**
- Por qué: se calcula `finishedAt − startedAt`, incluyendo pausas y tiempo fuera de la
  app.
- Evidencia: sesión con pausa larga; comparar con la suma de descansos.

**Q-B7 (P3). ¿La semana empieza lunes en todos los cálculos?**
- Por qué: `weekStartKey` usa lunes; el usuario podría esperar domingo.
- Evidencia: test con fechas de domingo y lunes.

**Q-B8 (P3). ¿Cómo se manejan los cambios de hora (DST)?**
- Por qué: las fechas de negocio son locales; un cálculo de días con `24 h` puede fallar.
- Evidencia: test en una zona con DST en el cambio de mes.

---

### C. Progresión y carga

**Q-C1 (P1). ¿La base de progresión debe ser promedio de 5 sesiones o la última?**
- Por qué: `workingBase` promedia los tops de las últimas 5; `loadRecommendation` hace
  lo mismo. Una sesión mala baja la base y frena la progresión.
- Evidencia: simular 5 sesiones con una mala y ver el escalón propuesto.

**Q-C2 (P1). ¿Qué pasa si el usuario cambia de ejercicio o de equipamiento?**
- Por qué: el historial se agrupa por `exerciseId`; un cambio de barra a mancuernas
  mantiene el mismo id.
- Evidencia: revisar si el catálogo distingue variantes y cómo afecta la base.

**Q-C3 (P1). ¿El freno de velocidad debe mirar 21 días o 2 sesiones?**
- Por qué: `workingVelocityPctPerWeek` usa el primer y el último top de la ventana; con
  dos sesiones muy juntas, `weeks = max(días/7, 1)` infla la velocidad.
- Evidencia: dos sesiones separadas por 1 día con +5 % de peso → ver si frena.

**Q-C4 (P2). ¿La progresión debe considerar el RIR de la sesión anterior?**
- Por qué: `recommendLoad` reduce el paso con RIR ≤ 1, pero `planDayProposal` no usa RIR.
- Evidencia: comparar ambos caminos con el mismo historial.

**Q-C5 (P2). ¿La escalada debe repartir el salto o mantener el mismo peso en todas las series?**
- Por qué: `buildEscalada` interpola entre base y objetivo; la última serie cae exacta.
- Evidencia: test con 3 y 5 series; validar que no haya saltos negativos ni picos.

**Q-C6 (P2). ¿Qué pasa si el PR es menor que la base?**
- Por qué: el PR es techo; si la base ya lo supera, `decideStep` devuelve el PR y la
  escalada podría bajar el peso.
- Evidencia: historial con base 100 y PR 90.

**Q-C7 (P2). ¿La progresión debe exigir 3 sesiones en la base?**
- Por qué: un usuario nuevo con 2 sesiones nunca recibe propuesta.
- Evidencia: simular 2 sesiones y ver el silencio.

**Q-C8 (P3). ¿La sugerencia de calentamiento debe usar 45 % o un porcentaje de la serie?**
- Por qué: `WARMUP_WEIGHT_RATIO = 0,45` es fijo; no considera el e1RM ni el tipo de
  ejercicio.
- Evidencia: revisar la recomendación en ejercicios pesados vs. ligeros.

---

### D. Recuperación, rachas, fatiga y deload

**Q-D1 (P1). ¿La racha debe exigir 3 sesiones por semana?**
- Por qué: los planes de 2 días no pueden cumplirla.
- Evidencia: `streak.test.ts` + una rutina de 2 días; ¿racha 0 para siempre?

**Q-D2 (P1). ¿La fatiga debe usar la hora real del entrenamiento?**
- Por qué: `fatigueMap` usa `días × 24 + hora actual`, no `startedAt`.
- Evidencia: sesión de ayer 20:00, consulta 09:00 → comparar 13 h vs. 33 h.

**Q-D3 (P1). ¿La recuperación debe contar la racha cuando no hay más datos?**
- Por qué: la racha siempre pesa 0,15, incluso si es 0 y no hay sueño/dolor.
- Evidencia: `computeRecoveryScore` con solo `daysSince` y `streak = 0`.

**Q-D4 (P2). ¿Los pesos 40/25/20/15/15 tienen respaldo?**
- Por qué: definen un número que el usuario ve como “recuperación”.
- Evidencia: buscar fuente; si no hay, documentarlo como heurística.

**Q-D5 (P2). ¿El deload debe sumar señales que vienen del mismo fenómeno?**
- Por qué: caída de volumen (30) y caída de reps (25) pueden dispararse por la misma
  causa y sumar 55.
- Evidencia: sesión con caída de volumen y reps; ver score.

**Q-D6 (P2). ¿La semana de deload debe calcularse por semana calendario o por semanas desde el inicio?**
- Por qué: `currentProgramWeek` usa días desde `startDate`; `deloadWeek` usa módulo.
- Evidencia: programa que empieza un miércoles; ver qué semana cuenta.

**Q-D7 (P2). ¿El deload debe aplicar −10 % también a peso corporal?**
- Por qué: `deloadSuggestedWeight` devuelve 0 si el peso es 0.
- Evidencia: revisar la UI de series de peso corporal en deload.

**Q-D8 (P3). ¿La frecuencia objetivo debe ser la misma para todos los objetivos?**
- Por qué: 2/semana para hipertrofia y para fuerza no es lo mismo; el seed tiene rutinas
  de 1 día por músculo.
- Evidencia: cruzar `FREQUENCY_TARGETS` con las rutinas del seed.

---

### E. Calculadoras de salud

**Q-E1 (P1). ¿Qué tabla de grasa corporal es la canónica?**
- Por qué: Navy y Jackson-Pollock clasifican distinto en los bordes (17,5 % y 24,5 %).
- Evidencia: test con los mismos porcentajes en ambas calculadoras.

**Q-E2 (P1). ¿La masa ósea tiene una fuente primaria?**
- Por qué: la fórmula se atribuye a Matiegka con dos blogs como referencia.
- Evidencia: buscar la ecuación original y validar coeficientes; si no hay, marcarla como
  estimación cruda.

**Q-E3 (P1). ¿Qué altura se usa cuando falta el dato?**
- Por qué: `buildBodyCompSeries` asume 170 cm.
- Evidencia: serie sin altura; ver masa ósea y muscular.

**Q-E4 (P1). ¿El déficit debe tener un piso calórico?**
- Por qué: el tope es 500 kcal, pero no hay mínimo (ej. 1.200 kcal).
- Evidencia: TDEE 1.400 → objetivo 1.120; revisar si es aceptable.

**Q-E5 (P1). ¿Los macros deben validar que proteína + grasas no superen las kcal objetivo?**
- Por qué: con peso alto y déficit, los carbohidratos quedan en 0 pero los macros suman
  más que el objetivo.
- Evidencia: 100 kg, definición, TDEE bajo.

**Q-E6 (P2). ¿La recarga de agua debe ser 0,5 L/30 min (1 L/h) o 0,4–0,8 L/h?**
- Por qué: la fórmula contradice el rango citado.
- Evidencia: decidir el rango y actualizar fórmula o comentario.

**Q-E7 (P2). ¿El TDEE debe ajustarse por pasos si ya hay factor de actividad?**
- Por qué: posible doble conteo.
- Evidencia: usuario “activo” con 10.000 pasos; comparar TDEE y gasto real estimado.

**Q-E8 (P2). ¿La fórmula Navy debe validar medidas imposibles?**
- Por qué: si `cintura ≤ cuello` devuelve 0; si los valores son extremos, el resultado
  puede ser negativo y se clampea a 0.
- Evidencia: casos límite.

**Q-E9 (P2). ¿El IMC histórico debe recalcularse con la altura actual?**
- Por qué: `buildImcSeries` usa la altura guardada hoy para todos los registros.
- Evidencia: cambiar altura y ver la serie histórica.

**Q-E10 (P3). ¿La simetría debe ser porcentaje o diferencia absoluta?**
- Por qué: `calcSymmetryPct` normaliza por la media; un brazo de 30 vs. 33 da 9,5 %.
- Evidencia: decidir el umbral de alerta.

---

### F. Pasos, cardio y nutrición

**Q-F1 (P1). ¿0,04 kcal por paso es defendible sin peso?**
- Por qué: la constante ignora peso, altura y velocidad.
- Evidencia: comparar con MET × peso × tiempo para una caminata de 30 min.

**Q-F2 (P1). ¿La zancada de 41,5 % es válida para todos?**
- Por qué: depende de altura y biomecánica; hay usuarios con zancada muy distinta.
- Evidencia: permitir zancada manual y comparar.

**Q-F3 (P1). ¿La clasificación MET por subcadena es segura?**
- Por qué: `metForSlug` busca substrings (`bici`, `remo`, `jump`); un slug ambiguo puede
  caer en el MET equivocado.
- Evidencia: recorrer los 873 slugs y listar los que caen en `generic`.

**Q-F4 (P2). ¿Las calorías de cardio deben usar el peso de la fecha de la sesión?**
- Por qué: `sessionComparison` busca el peso anterior a la sesión; otras vistas usan el
  peso actual.
- Evidencia: comparar una sesión vieja antes y después de registrar peso nuevo.

**Q-F5 (P2). ¿La racha de pasos debe cortarse si hoy no hay registro?**
- Por qué: `getStreak` permite que la racha siga viva desde ayer si hoy no hay dato.
- Evidencia: decidir si “sin dato” es neutral o rompe.

**Q-F6 (P2). ¿Los alimentos deben guardar la unidad cruda/cocida?**
- Por qué: el seed es “raw” y los macros cambian al cocinar.
- Evidencia: revisar `raw` y `baseGrams`; ¿la UI avisa?

**Q-F7 (P3). ¿El pico de proteína diaria debe sumar todas las comidas o solo las registradas?**
- Por qué: `deriveMealStats` suma lo registrado; un día incompleto puede parecer bajo.
- Evidencia: día con una sola comida.

---

### G. Planificación y periodización

**Q-G1 (P1). ¿El generador debe respetar el equipamiento del usuario al 100 %?**
- Por qué: `fits` exige que el equipo requerido sea subconjunto del declarado; si el
  usuario no declara “banco”, se descartan rutinas que lo necesitan.
- Evidencia: plan con solo mancuernas; ver cobertura.

**Q-G2 (P1). ¿El ajuste a duración puede dejar un grupo sin trabajar?**
- Por qué: `fitPlanToDuration` recorta desde el final sin dejar grupos huérfanos, pero
  puede eliminar el último ejercicio de un grupo si hay otro del mismo grupo.
- Evidencia: plan de 60 → 30 min; ver cobertura.

**Q-G3 (P2). ¿La expansión debe usar ejercicios de todo el plan o solo del día?**
- Por qué: `usedPlanWide` evita repetir ids en todo el plan; puede agotar candidatos.
- Evidencia: plan de 6 días y 873 ejercicios; ver si se queda sin candidatos.

**Q-G4 (P2). ¿La periodización automática debe usar el volumen de la semana o el de 4 semanas?**
- Por qué: `volumeTrend` compara los últimos 3 vs. los anteriores.
- Evidencia: serie con una semana atípica.

**Q-G5 (P2). ¿La semana actual del plan debe contar desde `startDate` o desde el primer entreno?**
- Por qué: `getCurrentWeek` usa `startDate`.
- Evidencia: plan creado y no iniciado.

**Q-G6 (P3). ¿El plan debe adaptarse si el usuario falta 2 semanas?**
- Por qué: no hay lógica de re-entrada; el plan sigue corriendo.
- Evidencia: revisar `getCurrentWeek` y `deload`.

---

### H. Datos, backup y migraciones

**Q-H1 (P1). ¿Un restore debe borrar las tablas vacías del backup?**
- Por qué: `importBackup` salta tablas sin filas.
- Evidencia: backup con `bodyWeight: []`; ver si borra los pesos actuales.

**Q-H2 (P1). ¿El backup debe validar la versión del schema?**
- Por qué: `parseBackup` no mira `version`.
- Evidencia: backup con `version: 99`; ver si se importa igual.

**Q-H3 (P1). ¿Qué pasa si el backup tiene una tabla nueva que el schema no conoce?**
- Por qué: `ALL_TABLES` es una lista explícita; una tabla nueva no se importa.
- Evidencia: comparar `ALL_TABLES` con el schema de Dexie.

**Q-H4 (P2). ¿Las migraciones son reversibles?**
- Por qué: Dexie migra hacia adelante; no hay rollback.
- Evidencia: revisar `db.ts` y el plan de recuperación.

**Q-H5 (P2). ¿El seed pisa datos del usuario?**
- Por qué: el reseeder se dispara al cambiar `SEED_VERSION`; ¿borra rutinas custom?
- Evidencia: `reseeder.ts` y `factoryReset.ts`.

**Q-H6 (P3). ¿El export de fotos incluye los blobs?**
- Por qué: las fotos de progreso pueden ser grandes; el backup JSON las incluye.
- Evidencia: `exportBackup` con `progressPhotos`.

---

### I. Producto y evidencia

**Q-I1 (P1). ¿Qué número de la app es “la verdad” para el usuario?**
- Por qué: volumen, e1RM, PR y grasa pueden tener definiciones distintas según pantalla.
- Evidencia: definir un contrato de datos por métrica y testearlo.

**Q-I2 (P1). ¿Qué fórmulas están validadas y cuáles son heurísticas?**
- Por qué: la app mezcla ecuaciones publicadas (Mifflin, Brzycki, JP, Navy) con umbrales
  de ingeniería (18/48/72 h, 2 %, 15 %, 60 puntos).
- Evidencia: completar la tabla de la sección 8 con “fuente” o “heurística”.

**Q-I3 (P1). ¿La app debe mostrar incertidumbre?**
- Por qué: un e1RM estimado no es un 1RM real; una proyección no es una promesa.
- Evidencia: revisar copy de calculadoras y proyecciones; agregar rango o disclaimer.

**Q-I4 (P2). ¿Los estándares de fuerza deben separar por sexo y edad?**
- Por qué: la tabla actual es solo masculina y sin edad.
- Evidencia: `strengthStandards.ts`; decidir si se agregan tablas o se oculta el
  percentil.

**Q-I5 (P2). ¿La app debe explicar por qué cambia una sugerencia?**
- Por qué: un chip que dice “subí 2,5 kg” sin explicar la evidencia se percibe arbitrario.
- Evidencia: `sessionSuggestions` + copy i18n; agregar “porque completaste +2 reps en 3
  sesiones”.

**Q-I6 (P3). ¿Qué pasa cuando el usuario no tiene datos suficientes?**
- Por qué: la app dice “sin datos” en algunos lugares y proyecta con defaults en otros.
- Evidencia: recorrer estados vacíos de home, objetivos y estadísticas.

---

## 11. Plan de auditoría de cálculos

### Fase 0 — Contrato de datos

1. Definir por métrica: nombre, fórmula, insumos, filtros (warmup sí/no), redondeo y
   pantallas que la muestran.
2. Crear una tabla `docs` con la fuente de cada constante (sección 8).
3. Acordar qué es “la verdad” para: volumen, e1RM, PR, grasa, TDEE y pasos.

### Fase 1 — Tests de caracterización (sin cambiar código)

Para cada hallazgo H1–H17, escribir un test que replique el comportamiento actual. Si el
test demuestra el bug, queda rojo y se documenta; si no, se cierra el hallazgo.

Prioridad:

1. H1/H5 (PR y warmups).
2. H2/H3 (Brzycki y benchmark).
3. H4 (warmups en métricas).
4. H6/H7 (racha y fatiga).
5. H10 (restore).
6. H8/H9 (proyección y promedio).
7. H12/H13 (grasa y fuerza).
8. H14–H17 (masa ósea, TDEE, agua, peso corporal).

### Fase 2 — Correcciones con test rojo → verde

- Un cambio por hallazgo, con test que falle antes y pase después.
- Si el cambio altera un número visible, actualizar copy y CHANGELOG.
- Si el cambio afecta datos persistidos, plan de migración.

### Fase 3 — Verificación

- `npm test` completo.
- `npm run build`.
- E2E de las pantallas afectadas.
- Revisión de los números en la app con un dataset conocido (el `fake-data.json` sirve).

---

## 12. Glosario de fórmulas

| Métrica | Fórmula | Archivo |
|---|---|---|
| e1RM Brzycki | `peso × 36 / (37 − reps)` | `domain/prs.ts` |
| e1RM Epley | `peso × (1 + reps/30)` | `domain/calculators/oneRepMax.ts` |
| Volumen | `peso × reps` | `domain/volume.ts` |
| IMC | `kg / m²` | `domain/calculators/imc.ts` |
| BMR | `10w + 6,25h − 5a ± 5/−161` | `domain/calculators/tdee.ts` |
| TDEE | `BMR × factor` | `domain/calculators/tdee.ts` |
| Déficit | `TDEE − min(20 %, 500)` | `domain/calculators/tdee.ts` |
| Macros | proteína `g/kg`, grasas `0,8 g/kg`, carbs resto | `domain/calculators/macros.ts` |
| Agua | `30 ml/kg + 0,5 L/30 min` | `domain/calculators/water.ts` |
| Discos | greedy por lado | `domain/calculators/plates.ts` |
| Navy | `495 / (...) − 450` | `domain/calculators/navy.ts` |
| Densidad JP | `a − b·Σ + c·Σ² − d·edad` | `domain/calculators/bodyComposition.ts` |
| Siri | `495 / densidad − 450` | `domain/calculators/bodyComposition.ts` |
| Hueso | `h×0,128 + peso×0,245 − 2,95` | `domain/calculators/bodyComposition.ts` |
| WHtR | `cintura / altura` | `domain/calculators/bodyComposition.ts` |
| WHR | `cintura / cadera` | `domain/calculators/bodyComposition.ts` |
| Calorías cardio | `MET × kg × h` | `domain/cardio.ts` |
| Calorías pasos | `pasos × 0,04` | `domain/stepsTracker.ts` |
| Distancia pasos | `pasos × zancada / 100000` | `domain/stepsTracker.ts` |
| Recovery | media ponderada 40/25/20/15/15 | `domain/recoveryScore.ts` |
| Racha | semanas con ≥ 3 sesiones | `domain/streak.ts` |
| Fatiga | 18/48/72 h | `domain/muscleFatigue.ts` |
| Deload | score 0–100, umbral 60 | `domain/deload.ts` |
| Estancamiento | < 2 % en 4 semanas | `domain/plateauDetector.ts` |
| Proyección | `gap / max(tasa, 0,1)` | `domain/goalProjection.ts` |

---

## 13. Comandos y verificación

```bash
cd gymlab-app

npm install
npm run dev          # desarrollo
npm test             # Vitest
npm run build        # typecheck real (tsc -b) + build
npm run lint         # oxlint

# Un dominio concreto
npx vitest run tests/unit/domain/prs.test.ts
npx vitest run tests/unit/domain/workingProgression.test.ts
npx vitest run tests/unit/domain/bodyComposition.test.ts

# E2E (Python + Playwright)
python tests/e2e/scripts/with_server.py tests/e2e/test_<fase>.py

# Nativo
npm run android:sync
npm run android:open
```

**Regla del repo:** `npx tsc --noEmit` **no** verifica nada porque el `tsconfig.json` raíz
tiene `"files": []` y solo referencias. El typecheck real es `npm run build`.

---

### Cierre

Este documento no reemplaza los tests: los ordena. La parte visual puede discutirse; los
números de la sección 6 y las inconsistencias de la sección 9 se ganan o se pierden con
evidencia. El siguiente paso lógico es elegir **una** de las preguntas P1, escribir el test
que la responde y recién después tocar código.
