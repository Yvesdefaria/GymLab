# GymLab vs openGym — Comparativa y plan de mejora

> **Qué es este documento.** Dos partes: (I) comparación técnica entre GymLab y openGym
> centrada en la capa de cálculos, y (II) plan de mejora de GymLab paso a paso, listo
> para ejecutar.
>
> **Método.** Lectura estática de ambos repositorios. Los hallazgos marcados como
> *verificado* fueron confirmados en el código, no tomados de la documentación previa.
> No se ejecutó ninguna de las dos aplicaciones.
>
> **Base.** `gymlab-app/docs/ARQUITECTURA-Y-CALCULOS.md` (2026-10-25, `main` @ `3bc868ca`)
> y `opengym-main/ANALISIS_OPENGYM.md`.

**Índice**

- [Parte I — Comparativa](#parte-i--comparativa)
  - [1. Dos productos, dos problemas distintos](#1-dos-productos-dos-problemas-distintos)
  - [2. El hallazgo central: fallan por motivos opuestos](#2-el-hallazgo-central-fallan-por-motivos-opuestos)
  - [3. Los cálculos, concepto por concepto](#3-los-cálculos-concepto-por-concepto)
  - [4. Hallazgos verificados en el código](#4-hallazgos-verificados-en-el-código)
  - [5. El dato que falta en ambos documentos](#5-el-dato-que-falta-en-ambos-documentos)
  - [6. Dónde gana cada uno](#6-dónde-gana-cada-uno)
- [Parte II — Plan de mejora de GymLab](#parte-ii--plan-de-mejora-de-gymlab)
  - [7. Principios rectores](#7-principios-rectores)
  - [8. Fase 0 — Congelar el terreno](#8-fase-0--congelar-el-terreno)
  - [9. Fase 1 — Integridad de PR y e1RM](#9-fase-1--integridad-de-pr-y-e1rm)
  - [10. Fase 2 — Modelos temporales](#10-fase-2--modelos-temporales)
  - [11. Fase 3 — Datos, backup y clasificaciones](#11-fase-3--datos-backup-y-clasificaciones)
  - [12. Fase 4 — Barreras arquitectónicas](#12-fase-4--barreras-arquitectónicas)
  - [13. Fase 5 — Huecos de producto](#13-fase-5--huecos-de-producto)
  - [14. Orden, esfuerzo y dependencias](#14-orden-esfuerzo-y-dependencias)
  - [15. Grillme — preguntas que bloquean](#15-grillme--preguntas-que-bloquean)
  - [16. Lo que NO hay que hacer](#16-lo-que-no-hay-que-hacer)
  - [Apéndice A — Constantes sin fuente](#apéndice-a--constantes-sin-fuente)
  - [Apéndice B — Contrato de métricas](#apéndice-b--contrato-de-métricas)

---

# Parte I — Comparativa

## 1. Dos productos, dos problemas distintos

| | **openGym** | **GymLab** |
|---|---|---|
| Modelo | Self-hosted, servidor propio | Local-first, sin backend |
| Persistencia | JSON en `./data` | IndexedDB (Dexie), 28 tablas, 15 versiones |
| Multi-dispositivo | Sí: `_rev` + `_wid`, merge por campo | No: export/import JSON |
| Lenguaje | JavaScript puro, sin tipos | TypeScript 7 |
| Catálogo | 5.632 ejercicios, media animada (~190 MB) | 873 ejercicios, 1.746 JPG (~94 MB) |
| Idiomas | 20 | 2 (es/en) |
| Licencia | AGPL-3.0 | Propietaria (`UNLICENSED`) |
| Tamaño | ~90k líneas + ~66k de test | ~61k líneas, 89 suites de dominio |
| Alcance del dominio | Entrenamiento | Entrenamiento **+ salud + nutrición + actividad** |

La diferencia de alcance importa más de lo que parece: GymLab cubre un dominio tres veces
más ancho con la mitad del rigor por concepto. openGym es más profundo en *cómo* calcula y
mucho más pobre en *qué* calcula.

## 2. El hallazgo central: fallan por motivos opuestos

**GymLab falla por divergencia interna.** El mismo concepto está definido más de una vez y
las copias se desincronizan. Es un problema de **definición**.

| Concepto | Implementación A | Implementación B | Consecuencia |
|---|---|---|---|
| `estimate1RM` | `domain/prs.ts` (guarda + redondeo 0,1) | `domain/benchmark.ts` (sin guarda, sin redondeo) | `Infinity` en 37 reps |
| Volumen semanal | `domain/weeklyVolume.ts` (rellena ceros) | `domain/trainingStats.ts` (no rellena) | Dos gráficos, dos verdades |
| Umbral de grasa | Navy (`< 18` fitness) | Jackson-Pollock (`≤ 17`) | Dos etiquetas para el mismo cuerpo |
| Warm-ups | Incluidos en volumen, e1RM y RPE | Excluidos en comparador, `setStats` y progresión | La misma sesión da dos números |

**openGym falla por divergencia temporal.** El concepto está definido **una sola vez**
—y el servidor MCP reimporta los mismos módulos puros— pero hay dos versiones del documento
en vuelo. Es un problema de **convergencia**.

| Riesgo | Ubicación en openGym |
|---|---|
| Un reloj adelantado envenena el `highest` lógico para todo el documento | `api/server.js:477-514` |
| Tombstones con tope de 5.000 por lista: un borrado viejo puede revivir | `api/sync-stamps.js:56-63` |
| `_prior` guarda 6 valores hasheados: el séptimo conflicto pierde memoria | `api/server.js:191-246` |
| `_rev` avanza +2 cuando el stamping cambia el documento: riesgo de loop 409 | `api/server.js:2493-2502` |

**La tesis.** El costo de tener un único lugar donde vive la fórmula es que el problema se
muda al transporte. openGym pagó 1.092 líneas de `sync-merge.js` por esa decisión. GymLab
pagó 15 migraciones de Dexie por la contraria. Ninguno evitó el problema: lo movieron.

La consecuencia práctica para GymLab es directa: **los bugs de la sección 9 de su documento
no son errores de implementación aislados, son el síntoma de no tener un dueño único por
métrica.** Corregir H1 sin corregir la causa raíz garantiza que vuelva a aparecer.

## 3. Los cálculos, concepto por concepto

| Concepto | openGym | GymLab | Veredicto |
|---|---|---|---|
| **1RM** | 7 fórmulas + ensemble ponderado + tabla RIR. Caps de 12/15 reps. Asistidas → `null`. Métrica de confianza por dispersión | Brzycki en `prs.ts` + Epley en `calculators/oneRepMax.ts`. Guarda en 37. Sin cap efectivo | **openGym** |
| **Duplicación de 1RM** | Una sola implementación, reimportada por el MCP | Dos incompatibles (H3) | **openGym** |
| **Filtro de warm-ups** | Centralizado en `metricRowsForEntry` | Inconsistente entre 8 métricas (H4) | **openGym** |
| **Progresión** | Determinista, derivada del historial, con `why[]` explicativo | Sugerencia heurística con 10 constantes sin fuente | **openGym** |
| **Deload** | Optimizador sobre Epley: minimiza error, luego reps, luego prefiere peso | Score 30/25/25/10/10, umbral 60, reducción fija de 10 % | **openGym** |
| **Recuperación** | Modelo fisiológico: series efectivas, decaimiento exponencial, vidas medias 24/30/48 h | Encuesta ponderada 40/25/20/15/15 + buckets fijos 18/48/72 h | **openGym** (más defendible) / **GymLab** (más accionable) |
| **Discos** | Greedy → DP → campo `missing` explícito. Inventario por pares | Greedy puro. Sin inventario, sin `missing` | **openGym** |
| **Volumen** | `w×r + drops`, ×2 mancuernas, excluye warm-ups | `w×r`, incluye warm-ups (H4), peso corporal = 0 (H17) | **openGym** |
| **Balance** | Estructural (Poliquin / Thibaudeau / ATG), 23 ratios | Push/pull/legs con alerta de ±20 pp | **openGym** en profundidad |
| **Estándares de fuerza** | No tiene | Percentiles por peso corporal 60–120 kg | **GymLab** |
| **Salud** | No tiene | IMC, TDEE, macros, agua, Navy, Jackson-Pollock, Siri | **GymLab** |
| **Pasos / cardio** | No tiene | MET, zancada 41,5 %, 0,04 kcal/paso | **GymLab** |
| **Nutrición** | No tiene | 171 alimentos, macros proporcionales | **GymLab** |
| **Planificación** | Rotación + grilla semanal | Generador por split + ajuste a duración + periodización automática | **GymLab** |
| **Sincronización** | Resuelta, con riesgos conocidos | No existe | **openGym** |
| **Versionado de schema** | Ninguno | 15 versiones incrementales | **GymLab** |

## 4. Hallazgos verificados en el código

Los cuatro se confirmaron leyendo los archivos, no el documento de auditoría.

### 4.1 H1 — Un calentamiento puede crear un PR · **CONFIRMADO**

```ts
// src/domain/prs.ts:48-49  → detectPRsFromSets
for (const set of sets) {
  if (!set.completed || set.weightKg <= 0) continue

// src/domain/prs.ts:81-82  → bestPRFromSets
for (const set of sets) {
  if (!set.completed || set.isWarmup || set.weightKg <= 0) continue
```

Dos funciones del mismo archivo, la misma intención declarada, criterios distintos. Es el
patrón exacto de la sección 2.

**Corrección del ejemplo del documento original.** Afirma que `40 kg × 20 ≈ 71 kg` de e1RM.
No reproduce con ninguna de las dos fórmulas del repositorio:

```
Brzycki:  40 × 36 / (37 − 20) = 40 × 36/17 = 84,7 kg
Epley:    40 × (1 + 20/30)      = 40 × 1,667 = 66,7 kg
```

El valor correcto es **84,7 kg**, y el argumento queda *más fuerte*: un calentamiento de
40 kg × 20 (84,7) le gana a una serie de trabajo de 60 kg × 5 (**67,5**).

### 4.2 H2 — Brzycki explota antes del guard · **CONFIRMADO**

```ts
// src/domain/prs.ts:34-37
if (reps >= 37) return 0
return Math.round(weightKg * (36 / (37 - reps)) * 10) / 10
```

En `reps = 36`: `36 / (37 − 36) = 36`. Con 20 kg → **720 kg de e1RM**. El guard corta
exactamente un paso después del desastre.

### 4.3 H3 — Dos `estimate1RM` · **CONFIRMADO**

```ts
// src/domain/benchmark.ts:8-11
export const estimate1RM = (weightKg: number, reps: number): number => {
  if (reps <= 0 || weightKg <= 0) return 0
  if (reps === 1) return weightKg
  return weightKg * (36 / (37 - reps))     // sin guarda, sin redondeo
}
```

Con `reps = 37` → `Infinity`. Con `reps = 38` → negativo. `benchmarkRepo.add` usa esta
versión y el formulario no limita las repeticiones.

### 4.4 Cálculo de discos — greedy puro · **CONFIRMADO**

```ts
// src/domain/calculators/plates.ts:28-33
while (rest >= 0.0001) {
  const plate = sorted.find((p) => p <= rest + 0.0001)
  if (!plate) break
  perSide.push(plate)
  rest -= plate
}
```

Tres limitaciones de modelo, no de implementación:

1. **Sin inventario.** `sorted` es una lista de tamaños; el mismo disco de 25 kg se reutiliza
   infinitas veces. No puede responder "no tenés más discos de 25".
2. **Sin búsqueda óptima.** Greedy falla en casos donde existe solución con menos discos.
3. **Sin `missing`.** Solo devuelve `exact: boolean`. La UI no puede decir "faltan 0,5 kg".

### 4.5 H10 — `importBackup` no reemplaza · **CONFIRMADO**

```ts
// src/data/backup.ts:137-145
// Restaura el backup: limpia y rellena cada tabla en una única transacción atómica.
export const importBackup = async (backup: BackupFile): Promise<number> => {
  let imported = 0
  await db.transaction('rw', ALL_TABLES, async (tx) => {
    for (const name of ALL_TABLES) {
      const rows = backup.tables[name] ?? []
      if (rows.length === 0) continue          // ← la tabla actual sobrevive intacta
```

El comentario dice "limpia y rellena". El código salta las tablas vacías. Un restore de un
backup con `bodyWeight: []` **no borra** los pesos actuales. Es un merge parcial presentado
como reemplazo.

### 4.6 H7 — La fatiga ignora la hora · **CONFIRMADO (y peor de lo documentado)**

```ts
// src/domain/muscleFatigue.ts
import { diffLocalDays, localDateOf, toLocalDateStr } from './dates'
// ...
const workoutDate = new Map(workouts.map((w) => [w.id, localDateOf(w)]))
```

`localDateOf` devuelve una **fecha**, no un instante. No hay `startedAt` en ningún punto de
la cadena. El error no es de una hora mal calculada: la hora del entrenamiento **nunca
entra al modelo**. La precisión máxima posible es de ±24 h.

### 4.7 Schema y tooling · verificado

- `src/data/repositories/dexie/db.ts` — **15 versiones** de schema, con la regla explícita
  en el encabezado: *"Cada versión nueva del schema debe añadirse aquí sin modificar las
  anteriores."*
- `package.json` — `test: vitest run`, `build: tsc -b && vite build`, `lint: oxlint`.
  `license: "UNLICENSED"`.
- `gymlab-app/` **no** es un repositorio git propio: el repo está en el directorio padre y
  hay worktrees activos (`.worktrees/132.9-superficies`, `.worktrees/132.10-cierre`).

### 4.8 — Identidad y agregados dentro del modelo · **VERIFICADO**

`src/domain/types.ts` revela dos decisiones que condicionan cualquier sincronización futura:

```ts
export interface Workout {
  id: number                 // ← autoincremental por dispositivo
  startedAt: string
  finishedAt: string | null
  localDate: string
  totalVolume: number        // ← agregado guardado dentro del hecho crudo
}

export interface WorkoutSet {
  id: number                 // ← autoincremental por dispositivo
  workoutId: number          // ← referencia por id numérico
  createdAt: string
  // ... sin updatedAt, sin deletedAt
}
```

**Problema A.** `id: number` es único dentro de un dispositivo, no entre dispositivos. Dos
aparatos crean el workout `42`. Al conectar, uno de los dos necesita otro número y todas sus
series —que apuntan a `workoutId: 42`— quedan huérfanas o mal asignadas.

**Problema B.** `totalVolume` es una cache escrita dentro de la fila. Tiene una consecuencia
inmediata, **incluso sin sync**: cuando se corrija H4 (política de warm-ups), el volumen
histórico no se recalcula. Home seguirá mostrando el número viejo y el comparador el nuevo, y
la divergencia será permanente. Es H4 agravado por el almacenamiento — y probablemente el
hallazgo con mayor impacto visible de todo el documento.

**Problema C.** No hay `updatedAt` ni `deletedAt`. Un borrado físico es irreversible y no deja
rastro: ningún merge futuro puede distinguir "se borró" de "nunca existió".

## 5. El dato que falta en ambos documentos

Ambos tratan Epley y Brzycki como si difirieran en todo el rango. **Son idénticas
exactamente en 10 repeticiones.**

```
Brzycki: 36 / (37 − r)        Epley: (30 + r) / 30
36/(37 − r) = (30 + r)/30  →  r² − 7r − 30 = 0  →  r = 10
```

Verificación: `36/27 = 1,33333` y `1 + 10/30 = 1,33333`.

| Reps | Brzycki | Epley | Diferencia |
|---|---|---|---|
| 1 | 1,000 | 1,033 | Ambas cortocircuitan a `peso` |
| 5 | 1,125 | 1,167 | Brzycki **−3,6 %** |
| **10** | **1,333** | **1,333** | **0 %** |
| 12 | 1,440 | 1,400 | Brzycki **+2,9 %** |
| 20 | 2,118 | 1,667 | Brzycki **+27 %** |
| 36 | 36,0 | 2,200 | Brzycki **+1.536 %** |

**Consecuencias directas para GymLab:**

1. `oneRepMaxLabel` muestra dos números distintos y el usuario no tiene forma de saber que
   a 10 reps valen lo mismo. La diferencia no es un error: es el rango de validez.
2. Cualquier comparación entre ambas sin fijar las reps es media verdad.
3. El punto de cruce explica por qué Brzycki es aceptable hasta ~10 reps y catastrófica
   después. El cap debería estar cerca de ahí, no en 37.

openGym esquiva el problema con el ensemble: usa la dispersión entre las siete fórmulas como
métrica de confianza en vez de elegir una. A 100 kg × 10 el rango es **125,0 – 134,7 kg**.
Ese rango es la incertidumbre real del cálculo, y es más honesto que cualquiera de las dos
cifras por separado.

## 6. Dónde gana cada uno

### GymLab gana en

1. **El documento de auditoría.** La tabla de constantes con columna de estado
   (`fuente` / `heurística`) es superior a la de openGym, que tiene constantes igual de
   arbitrarias y ninguna tabla que las exponga.
2. **Cobertura de salud.** TDEE, macros, IMC, Navy, Jackson-Pollock, Siri.
3. **Cobertura de actividad.** Pasos, MET, calorías por cardio, nutrición.
4. **Migraciones de schema.** 15 versiones incrementales con una regla clara.
5. **Planificación.** Generador por split, ajuste a duración, periodización automática.
6. **Priorización de hallazgos.** `P1/P2/P3` con "top 10 para responder primero".

### openGym gana en

1. **Una sola fuente de verdad por cálculo**, y el MCP reimporta los módulos puros para no
   divergir. GymLab tiene cuatro duplicaciones activas.
2. **El progreso se explica.** `nextPrescription` devuelve `why[]`. GymLab tiene esto como
   pregunta pendiente (Q-I5).
3. **Recuperación con modelo fisiológico.** `1 − e^(−v)` con decaimiento y vida media por
   músculo es defendible; un score ponderado sobre sueño y dolor es una encuesta.
4. **Discos con `missing`.**
5. **Caps de reps.** Brusco, pero infinitamente mejor que devolver 720 kg.
6. **Sincronización.** GymLab no tiene el problema porque no tiene el feature: eso es deuda
   futura, no una ventaja.

---

# Parte II — Plan de mejora de GymLab

## 7. Principios rectores

Cinco reglas que ordenan todo lo que sigue.

| # | Principio | Traducción operativa |
|---|---|---|
| 1 | **Un cálculo, un dueño, un test** | Cada métrica tiene exactamente un módulo exportador. Si hay dos, uno debe desaparecer |
| 2 | **Rojo antes de verde** | Ningún cambio de fórmula sin un test que falle primero y describa el bug |
| 3 | **Una sola migración** | Los arreglos de cálculo no migran datos. Se acumulan y se migra una vez al final de la fase |
| 4 | **`null` es un valor** | "No hay datos suficientes" es una respuesta válida y debe poder mostrarse. Devolver `0` es mentir |
| 5 | **La app debe poder explicarse** | Toda sugerencia que cambie un número visible lleva su razón adjunta |
| 6 | **Todo derivado es recomputable** | PRs, rachas, estadísticas y fatiga son caches, no verdad. Deben poder reconstruirse desde los hechos crudos en cualquier momento |

**Regla de bloqueo:** no se abre ningún trabajo de Fase 5 (producto) mientras haya un
hallazgo `P1` abierto en Fase 1.

## 8. Fase 0 — Congelar el terreno

Objetivo: que cada corrección posterior sea medible contra un estado conocido. Es la fase
que se saltea siempre y la que hace que todo lo demás sea reversible.

### Paso 0.1 — Fixture de referencia

**Nuevo:** `tests/fixtures/reference-session.ts`

Una sesión canónica con números elegidos para exponer los bordes:

| Serie | Peso | Reps | Tipo | Récord que representa | Notas |
|---|---|---|---|---|---|
| 1 | 40 | 20 | warm-up | ninguno | El caso de H1: e1RM Brzycki = 84,7 |
| 2 | 60 | 5 | trabajo | **5RM = 60** | e1RM Brzycki = 67,5 |
| 3 | 80 | 3 | trabajo | **3RM = 80** | e1RM Brzycki = 85,3 |
| 4 | 60 | 12 | trabajo | **12RM = 60** | e1RM = 86,4 (Brzycki) / 84,0 (Epley) |
| 5 | 40 | 0 | trabajo | ninguno | El caso de H5 |
| 6 | 100 | 1 | trabajo | **1RM = 100** | Single: 1RM = peso |

Este fixture es la razón por la que la definición de récord importa: bajo la definición
actual (mejor e1RM), el mejor registro de la sesión es la serie 4 con 86,4. Bajo la definición
recomendada (mejor peso a N reps), hay **cuatro récords distintos** y ninguno depende de una
fórmula.

**Criterio de aceptación:** el fixture es importable desde cualquier test y exporta tanto
las series crudas como los valores esperados por fórmula.

### Paso 0.2 — Tests de caracterización

**Nuevo:** `tests/characterization/` — un test por hallazgo (`H1` a `H17`).

Estos tests **fijan el comportamiento actual, incluido el bug**. Se marcan con
`describe.skip` mientras el bug siga abierto, para que la suite quede verde. Al corregir,
se invierte: el test deja de estar skipped y pasa a exigir el comportamiento correcto.

Motivo: durante las próximas tres fases, cualquier regresión tiene que ser visible. Sin
esto, se arregla H1 y se rompe H9 sin enterarse.

**Comando:** `npx vitest run tests/characterization`

### Paso 0.3 — Contrato de métricas

**Nuevo:** `docs/METRICS-CONTRACT.md`

La tabla del Apéndice B, versionada. Es el documento que resuelve H4 de raíz: en vez de
decidir en cada consumidor, se decide una vez y se escribe.

**Criterio de aceptación:** toda métrica de la app aparece en la tabla con sus cuatro
columnas completas (fórmula, insumos, filtros, redondeo).

### Paso 0.4 — Línea base

**Comando:** `npm test && npm run build && npm run lint`

Registrar el resultado en el commit inicial. Si algo ya estaba rojo, se documenta antes de
empezar.

**Riesgo:** ninguno. Esta fase no toca código productivo.

---

## 9. Fase 1 — Integridad de PR y e1RM

La fase más importante. Aquí se cierra la clase de bug que hace que la app mienta sobre el
progreso del usuario.

**Orden estricto.** Los cuatro primeros pasos modifican la misma decisión (qué es un PR).
Se hacen seguidos y **se migra una sola vez** al final.

### Paso 1.1 — Unificar `estimate1RM` (H3)

**Problema.** Dos implementaciones con contratos distintos: una redondea, la otra no; una
tiene guarda, la otra no.

**Cambio:**

1. **Nuevo:** `src/domain/oneRepMax.ts` — módulo único con la firma
   `estimate1RM(weightKg: number, reps: number): number | null`.
2. `src/domain/prs.ts` importa de ahí; deja de definir su propia versión.
3. `src/domain/benchmark.ts` importa de ahí; deja de definir su propia versión.
4. `src/domain/calculators/oneRepMax.ts` pasa a ser un adaptador de presentación (Epley
   explícito para la calculadora) que **también** importa del módulo único.

**Test rojo:** `tests/unit/domain/oneRepMax.test.ts`

```ts
it('devuelve el mismo valor desde los tres puntos de entrada', () => {
  expect(estimate1RM(100, 5)).toBe(prsEstimate(100, 5))
  expect(estimate1RM(100, 5)).toBe(benchmarkEstimate(100, 5))
})
it('no devuelve Infinity en 37 reps', () => {
  expect(estimate1RM(100, 37)).not.toBe(Infinity)
})
```

**Criterio de aceptación:** un solo `export const estimate1RM` en todo `src/domain/`.
Verificable con un grep en CI.

### Paso 1.2 — Cap de reps con fundamento (H2)

**Problema.** El guard está en 37, un paso después de que la fórmula deje de tener sentido.

**Cambio.** En `src/domain/oneRepMax.ts`:

```ts
export const REP_CAP = 12          // límite de validez de Brzycki
export const estimate1RM = (weightKg, reps) => {
  if (weightKg <= 0 || reps <= 0) return null
  if (reps === 1) return weightKg
  if (reps > REP_CAP) return null  // no estimar fuera del rango
  ...
}
```

**Por qué 12 y no 10.** El cruce con Epley es en 10 y la diferencia a 12 es de 2,9 %. A 15
ya es del 9 %. 12 es el último punto donde la cifra sigue siendo defendible. Además coincide
con el target más alto del conjunto de rep-maxes (Q2): el techo del e1RM y el techo de los
récords son el mismo número, así que no hay dos verdades que reconciliar.

**Decisión de producto pendiente (ver Grillme Q3):** devolver `null` obliga a la UI a
mostrar "sin dato" para series de 13+ reps. La alternativa es seguir estimando y marcar la
cifra como no fiable. Se implementa `null` y se decide el copy después.

**Test rojo:**

```ts
it.each([[1,100],[5,112.5],[10,133.3],[12,144]])('estima %i reps', ...)
it('devuelve null por encima del cap', () => expect(estimate1RM(100, 13)).toBeNull())
```

**Efecto colateral:** los PR existentes calculados con 13+ reps hay que recalcularlos. Se
resuelve en el paso 1.5, no acá.

### Paso 1.3 — Warm-ups fuera de la detección de PR (H1)

Con la definición de Q2, H1 queda resuelto por construcción: un set de 20 reps no puede ser
récord porque 20 no es un target. **El filtro se agrega igual**, como defensa en profundidad:
un warm-up de 5 reps a 70 kg sí podría superar un trabajo de 65 kg al mismo target.

**Cambio:** `src/domain/prs.ts:49` — agregar `set.isWarmup` al filtro.

```ts
if (!set.completed || set.isWarmup || set.weightKg <= 0) continue
```

**Test rojo:** fixture con warm-up `70 kg × 5` y trabajo `65 kg × 5`. El `5RM` debe ser **65**,
no 70. Bajo la definición anterior el test era otro (20 reps contra 3 reps, diferencia de
0,6 kg); este es más limpio y falla por la razón correcta.

**Por qué mantener el filtro aunque el target lo cubra:** la definición de récord puede
cambiar otra vez. Si mañana se agrega el target de 20 reps, el filtro sigue ahí. Depender
solo del conjunto de targets es frágil por diseño.

### Paso 1.4 — `reps > 0` (H5)

**Cambio:** misma línea. `estimate1RM` ya devuelve `null` para `reps <= 0`, así que el
filtro se vuelve explícito en el llamador para no depender del contrato interno.

**Test rojo:** una serie `{ completed: true, weightKg: 50, reps: 0 }` no debe crear un PR.

### Paso 1.5 — Migración única v16: PRs + preparación de sync

**Nuevo:** `db.version(16)` en `src/data/repositories/dexie/db.ts`

Esta migración tiene dos propósitos y por eso se hace **una sola vez**. Recopilar la
decisión de Q1 (§15) en el mismo salto abarata lo que después sería imposible de recuperar.

**Bloque A — Recalcular récords con la nueva definición.**

Decisión de Q2 aplicada. La tabla `prs` cambia de forma: deja de ser "el mejor e1RM por
ejercicio" y pasa a ser "el mejor peso por ejercicio y por target de reps".

```ts
interface PRRecord {
  exerciseId: number
  reps: number        // target: 1, 3, 5, 8, 10, 12  (clave compuesta)
  weightKg: number    // hecho: el peso realmente levantado
  date: string
  // estimated1RM  ← ELIMINADO: era una estimación dentro de un hecho
}
// índice primario compuesto: [exerciseId+reps]
```

Pasos de la migración:

1. Borrar la tabla `prs`.
2. Recorrer todas las series `completed && !isWarmup && weightKg > 0 && reps > 0`.
3. Filtrar a los targets `[1, 3, 5, 8, 10, 12]`. Un set de 7 reps no crea un 7RM: se ignoran
   los targets no declarados.
4. Agrupar por `[exerciseId, reps]` y quedarse con el mayor `weightKg` de cada grupo.
5. Insertar con `uid` (ver bloque B).

**Eliminar `estimated1RM` del registro es el punto central.** Mientras el récord guarde una
estimación, cualquier cambio de fórmula lo invalida. Guardando el hecho —peso, reps, fecha—
el e1RM se puede recalcular en cualquier momento y el récord sobrevive a todas las
correcciones de la Fase 1.

**Consecuencia en la UI:** el badge de "PR" deja de ser un número único y pasa a ser una
tabla de rep-maxes. Para el usuario nuevo el cambio es visible y hay que explicarlo en
`CHANGELOG.md`. La alternativa —mostrar solo el mejor de todos— está disponible como vista
resumida sin tocar el modelo.

**Bloque B — Preparar la capa de datos para sync.**

Se hace ahora porque son decisiones cuyo costo crece de forma no lineal: un `id` numérico
autoincremental no se puede volver único entre dispositivos de forma retroactiva, y un
borrado físico destruye la evidencia que un merge futuro necesitaría.

| Cambio | Coste ahora | Coste si se difiere |
|---|---|---|
| `uid: string` (UUID) en tablas sincronizables | Bajo: columna nueva, sin tocar queries | Imposible: dos dispositivos ya generaron `id` 1, 2, 3… |
| `updatedAt: string` en las mismas tablas | Bajo | Alto: hay que reconstruir history desde `createdAt` |
| `formulaVersion: string` en agregados **cacheados** (no en `prs`) | Bajo | Medio: no se sabe con qué fórmula se calculó cada valor guardado |
| `deletedAt: string \| null` (borrado lógico) | **Medio**: toca repositorios y queries | **Imposible**: las filas borradas ya no existen |
| `exerciseAlias` (tabla vacía) | Bajo: una tabla sin filas | **Alto**: sin tabla, una renumeración no tiene dónde registrarse |

**Tablas afectadas (alcance acotado, no las 28):** `workouts`, `workoutSets`, `routines`,
`routineDays`, `routineItems`, `bodyWeight`, `profile`. El resto puede esperar.

**Regla de migración:** `uid` se rellena para las filas existentes con
`crypto.randomUUID()` en la misma pasada. Un `uid` generado localmente es válido: no
necesita coordinación con ningún servidor.

**`formulaVersion` NO va en `PRRecord`.** Ese es el punto de la decisión Q2: si el récord
guarda peso y reps en lugar de una estimación, no hay fórmula que versionar. La versión solo
hace falta donde sobreviva un valor **calculado** — un volumen cacheado, una estadística
precomputada. Donde se pueda, la respuesta correcta es derivar en vez de cachear; la versión
es el premio de consolación para lo que no se pueda evitar.

**Por qué una sola migración.** Si se migra después de cada paso, se recalcula tres veces
sobre un universo que cambia. Se hace al final, con las cuatro reglas estabilizadas y las
columnas nuevas en el mismo salto.

**Re-ejecutable por diseño.** Al no guardar estimaciones, `prs` es una función de
`workoutSets`: mismo input, mismo output, sin estado oculto. Eso permite tres cosas que una
migración normal no permite:

1. Si falla a mitad de camino, se borra la tabla y se vuelve a correr.
2. Se puede agregar un target nuevo (por ejemplo `15`) más adelante y reconstruir sin migrar.
3. Se puede auditar **después** del release: recalcular y comparar contra lo almacenado, sin
   tocar la DB del usuario.

Es la ventaja concreta de adoptar Q2 más allá de la semántica: la tabla deja de ser un dato
que hay que preservar y pasa a ser una cache que se puede tirar.

**Riesgo real, en dos partes.** (a) Algunos récords van a **bajar**: los que estaban inflados
por un warm-up o por una fórmula fuera de rango. (b) El badge de PR deja de ser un número y
pasa a ser una tabla de rep-maxes. Lo segundo es más visible que lo primero. Ambos van en
`CHANGELOG.md`, y conviene un texto que explique el cambio antes de que alguien lo reporte
como bug.

**Test de migración:** crear una DB con un PR inválido (creado por warm-up), correr la
migración, verificar que el PR resultante es el del trabajo real **y** que toda fila
existente quedó con `uid` no nulo y único.

### Paso 1.6 — Contrato de warm-ups (H4)

El más tedioso y el que más valor estructural deja.

**Problema.** Ocho métricas deciden por su cuenta si incluyen calentamientos:

| Métrica | Incluye |
|---|---|
| `Workout.totalVolume` | Sí |
| `volumeByMuscleGroup` | Sí |
| `buildE1rmSeries` | Sí |
| `sessionComparison` | No |
| `deload.recentAvgRpe` | Sí |
| `setStats` | No |
| `workingProgression` | No |
| `loadRecommendation` | No |

**Cambio:**

1. **Nuevo:** `src/domain/metricRows.ts` con tres selectores nombrados:

```ts
export const workSetsOnly = (sets) => sets.filter(s => s.completed && !s.isWarmup)
export const allCompletedSets = (sets) => sets.filter(s => s.completed)
export const volumeSets = (sets) => sets.filter(s => s.completed)   // incluye warm-ups a propósito
```

2. Cada consumidor importa el selector que le corresponde **según el contrato**, no según
   lo que hacía antes.
3. La decisión se documenta en `docs/METRICS-CONTRACT.md`.

**Test rojo:** una matriz que recorre la tabla del contrato contra el fixture de referencia
y compara cada métrica con su valor esperado. Ocho filas, ocho asserts.

**Criterio de aceptación:** ningún `filter(s => s.isWarmup)` suelto fuera de
`metricRows.ts`. Verificable con grep.

### Paso 1.7 — Promedio de e1RM por sesión (H9)

**Problema.** `avgE1rmInRange` promedia **series**. Una sesión de 10 series pesa 10 veces
más que una de 2, y un set inflado arrastra todo el promedio.

**Cambio:** agrupar por sesión, tomar el mejor e1RM de cada sesión, promediar sesiones.

**Impacto en cascada:** cambia los valores de estancamiento, proyección de objetivos y
narrativa de progreso. Los umbrales (`< 2 %`, `0,1 kg/semana`) fueron calibrados contra el
promedio por serie y hay que revisarlos **después** de este cambio, no antes.

**Test rojo:** dos sesiones, una con 1 serie de 100 kg y otra con 10 series de 70 kg. El
promedio por serie da 72,7; el correcto por sesión da 85.

---

### Paso 1.8 — Salvaguarda de identidad de ejercicios

**Contexto.** Q5 quedó resuelta con un matiz: los `exerciseId` no deberían cambiar, pero la
salvaguarda se implementa igual. Es la decisión correcta — el coste es de una tarde y el
escenario que evita no tiene vuelta atrás.

**Qué NO es esto.** No es una migración de ids ni un renombrado masivo. Es una **capa de
resolución de lectura** con una tabla vacía por defecto. Si los ids nunca cambian, la tabla
queda vacía y el coste en runtime es cero: un `Map` vacío.

**Cambio:**

1. Tabla `exerciseAlias` creada en `v16` (paso 1.5), vacía:

```ts
interface ExerciseAlias {
  from: number      // id antiguo (clave primaria)
  to: number        // id canónico actual
  reason?: string
  createdAt: string
}
```

2. **Nuevo:** `src/domain/exerciseIdentity.ts`

```ts
export const canonicalId = (
  id: number,
  aliases: ReadonlyMap<number, number>
): number => {
  let cur = id
  for (let hops = 0; aliases.has(cur) && hops < 8; hops++) cur = aliases.get(cur)!
  return cur
}
```

El tope de saltos no es paranoia: sin él, una fila mal cargada (`12 → 34`, `34 → 12`) cuelga
la app en el arranque.

3. **Un único punto de aplicación.** Los loaders de repositorio que alimentan el dominio
   (`loadWorkoutSets`, `loadPRs`) resuelven **al entrar**. El dominio nunca ve un id crudo.

4. **Regla de tabla: append-only.** Una fila de alias no se edita ni se borra. Misma
   disciplina que las versiones de Dexie, y por la misma razón: el historial que la justifica
   ya no existe cuando se quiere revertir.

5. **Ejercicio retirado del catálogo.** Si desaparece sin reemplazo, la tabla lo mapea a un
   id centinela `0` ("retirado") y la UI muestra el nombre congelado que quedó guardado en la
   sesión, no el del catálogo.

**Por qué un solo punto de aplicación.** Si `canonicalId` se llama en cada query, se recrea
exactamente el patrón de H4: ocho implementaciones de la misma regla, divergiendo. La
resolución es un borde, no una utilidad de conveniencia.

**Test rojo:** insertar `{ from: 12, to: 34 }`, crear una sesión con el ejercicio 12 y otra
con el 34, y verificar que PR, progresión y estadísticas las tratan como el mismo ejercicio.

**Test de ciclo:** `{12 → 34, 34 → 12}` termina y devuelve un id válido, sin colgar.

**Criterio de aceptación:** `canonicalId` se llama en exactamente dos lugares, ambos en
`src/data/repositories/`.

## 10. Fase 2 — Modelos temporales

### Paso 2.1 — Fatiga con hora real (H7)

**Problema verificado.** `muscleFatigue.ts` usa `localDateOf(w)` — una fecha, no un
instante. La hora nunca entra al modelo.

**Cambio:**

1. `lastTrainedByMuscle` devuelve el `finishedAt` (o `startedAt`) de la última sesión por
   grupo, no la fecha.
2. `fatigueFromHours` recibe horas reales.
3. Manejar el caso `finishedAt === null` (sesión en curso): usar `startedAt`.

**Test rojo:** sesión de ayer a las 20:00, consulta hoy a las 09:00 → **13 h** → `sore`.
Hoy la app calcula 33 h → `fatigued`.

**Dependencia:** requiere que `Workout` tenga `startedAt`/`finishedAt` poblados. Verificar
que los registros viejos los tengan; si no, fallback a mediodía local (como hace openGym).

### Paso 2.2 — Racha adaptativa (H6)

**Problema.** `MIN_WEEKLY_SESSIONS = 3` es fijo. Las rutinas de 2 días del seed nunca pueden
completar una semana.

**Cambio:**

```ts
const targetForWeek = (plan?: ActiveProgram) =>
  Math.min(MIN_WEEKLY_SESSIONS, plan?.daysPerWeek ?? MIN_WEEKLY_SESSIONS)
```

**Test rojo:** un usuario con rutina de 2 días completa 8 semanas → racha = 8, no 0.

**Riesgo de producto:** cambia un número visible para usuarios existentes. Alguien con racha
0 puede pasar a tener racha 3 de golpe. Es una mejora, pero hay que decidir si se
retro-calcula o empieza a contar desde la próxima semana.

### Paso 2.3 — Proyección honesta (H8)

**Problema.** `weeklyImprovement = Math.max(avgRate, 0.1)` garantiza proyectar mejora incluso
cuando el usuario está retrocediendo.

**Cambio:** devolver un discriminante de tendencia.

```ts
type Projection =
  | { kind: 'projected'; weeks: number; date: string; rate: number }
  | { kind: 'stalled'; reason: 'no-progress' }
  | { kind: 'regression'; rate: number }
  | { kind: 'insufficient-data' }
```

**Test rojo:** historial con tasa negativa → `kind: 'regression'`, sin fecha.

**Por qué importa más de lo que parece:** una fecha prometida sobre datos negativos es el
único lugar de la app donde el usuario puede sentirse engañado por el producto, no por su
entrenamiento.

### Paso 2.4 — Deload sin doble conteo (D5)

**Problema.** Caída de volumen (30) y caída de reps (25) pueden dispararse por la misma
causa y sumar 55 de 100.

**Cambio:** agrupar las señales por fenómeno y quedarse con la más fuerte de cada grupo, en
lugar de sumarlas.

| Grupo | Señales | Peso |
|---|---|---|
| Rendimiento | caída de volumen, caída de reps | máx(30, 25) |
| Esfuerzo | RPE promedio ≥ 8 | 25 |
| Duración | > 8 semanas seguidas | 10 |
| Programa | semana de deload planificada | 10 |

**Test rojo:** sesión con caída de volumen y de reps simultáneas → score ≤ 65, no 80.

---

## 11. Fase 3 — Datos, backup y clasificaciones

### Paso 3.1 — Restore real (H10)

**Cambio** en `src/data/backup.ts:143`:

```ts
const rows = backup.tables[name] ?? []
const hasTable = Object.prototype.hasOwnProperty.call(backup.tables, name)
if (!hasTable) continue        // tabla ausente → no tocar
await db.table(name).clear()   // tabla presente → reemplazar, aunque esté vacía
if (rows.length > 0) await db.table(name).bulkAdd(rows as never[])
```

**Distinción clave:** *tabla ausente* significa "el backup es viejo y no conocía esta tabla"
→ no tocar. *Tabla presente y vacía* significa "el usuario no tenía datos" → borrar.

**Test rojo:** backup con `bodyWeight: []` sobre una DB con 5 pesos → la tabla queda vacía.

### Paso 3.2 — Validar versión del backup (H10, segunda parte)

**Cambio:** `parseBackup` valida `app === 'GymLab'`, `tables` presente **y** `version`
numérica. Si `version > DB_VERSION`, rechazar con un mensaje claro en lugar de importar
datos que el schema no entiende.

**Test rojo:** backup con `version: 99` → `null`, no importación silenciosa.

### Paso 3.3 — Un solo `buildWeeklyVolumeSeries` (H11)

**Cambio:** la implementación de `weeklyVolume.ts` (la que rellena semanas con 0 y marca
`isCurrent`) es la canónica. `trainingStats.ts` reexporta.

**Test rojo:** ambas funciones devuelven el mismo array para el mismo input.

### Paso 3.4 — Estándares de fuerza con sexo (H13)

**Dos caminos, elegir uno:**

| Opción | Coste | Efecto |
|---|---|---|
| A — Añadir `FEMALE_STANDARDS` | Alto: requiere tabla con fuente | Correcto |
| B — Ocultar el percentil si `sex === 'female'` | Bajo | Honesto, pero deja un hueco |

**Recomendación:** B ahora, A cuando haya fuente citable. Mostrar un percentil calculado
contra una tabla masculina es peor que no mostrar percentil.

**Test rojo:** `getStrengthPercentile({ sex: 'female', ... })` → `null` en la opción B.

### Paso 3.5 — Una sola clasificación de grasa (H12)

**Cambio:** `navy.ts` y `bodyComposition.ts` devuelven **solo el porcentaje**. La
clasificación (`fitness`, `promedio`, `elevado`) sale de una única tabla en
`bodyComposition.ts`.

**Test rojo:** mismo porcentaje por ambas calculadoras → misma etiqueta.

### Paso 3.6 — Volumen de peso corporal (H17)

**Decisión de producto, no bug.** Dominadas y flexiones suman 0 al volumen.

**Opción recomendada:** contar como `(peso corporal × factor) × reps`, con el factor
configurable y por defecto 1,0 para dominadas/fondos y 0,6 para flexiones. Alternativa más
simple: contar **reps** como métrica separada y no tocar el volumen.

**Test rojo:** 10 dominadas de un usuario de 80 kg → volumen 800, no 0.

---

### Paso 3.7 — `totalVolume` deja de ser columna

Consecuencia del hallazgo 4.8. Es la corrección más visible de esta fase y la que más
consultas toca.

**Cambio:**

1. `calcTotalVolume(sets)` en `src/domain/volume.ts` pasa a ser la única fuente.
2. `totalVolume` desaparece de `Workout` (`src/domain/types.ts`).
3. Las pantallas que lo leían calculan al vuelo. Es O(n) sobre las series de una sesión:
   irrelevante con los volúmenes reales.
4. Si el rendimiento lo exige más adelante, se reintroduce como cache **con
   `formulaVersion`**, nunca como valor autoritativo.

**Compatibilidad de backup:** los backups viejos traen `totalVolume`. Dexie ignora las
propiedades que no están en el schema, así que no rompe — pero hay que verificar que
`importBackup` no lo use.

**Test rojo:** una sesión histórica con 3 warm-ups y 3 series de trabajo. Corregir la política
de H4 y verificar que el volumen mostrado en Home **cambia** en la misma pasada. Hoy no
cambia: está congelado en la fila.

**Criterio de aceptación:** `grep -r "totalVolume" src/` no devuelve ninguna escritura.

## 12. Fase 4 — Barreras arquitectónicas

Sin esta fase, Fase 1 se deshace sola en seis meses. Es la diferencia entre arreglar y
corregir.

### Paso 4.1 — Fronteras de importación

**Cambio** en la configuración de `oxlint`: reglas de importación restringida.

| Capa | Puede importar | Prohibido |
|---|---|---|
| `src/domain/**` | solo `src/domain/**` y `src/domain/types` | React, Dexie, `src/data/**`, `src/hooks/**` |
| `src/pages/**`, `src/components/**` | hooks, repositorios, dominio | `src/data/repositories/dexie/db` |
| `src/data/repositories/**` | Dexie, dominio | React |

**Criterio de aceptación:** `npm run lint` falla si alguien importa `db` desde una página.

### Paso 4.2 — Prohibir fórmulas inline

**Cambio:** regla de revisión + test de lint. Ningún archivo fuera de `src/domain/` puede
contener `36 / (37` ni `1 + reps / 30`.

Es tosco, pero atrapa exactamente el bug H3 y es trivial de implementar.

### Paso 4.3 — CI mínimo

**Cambio:** pipeline que corre en cada PR:

```bash
npm ci
npm run lint
npm run build      # typecheck real: tsc -b
npm test
```

**Nota del repo:** `npx tsc --noEmit` no verifica nada — el `tsconfig.json` raíz tiene
`"files": []`. El typecheck real es `npm run build`.

### Paso 4.4 — Test de contrato de métricas

**Nuevo:** `tests/contract/metrics.test.ts`

Una tabla de casos derivada de `docs/METRICS-CONTRACT.md`. Cualquier cambio de fórmula que
mueva un número visible rompe el test y obliga a actualizar el contrato en el mismo commit.

Es el mecanismo que hace que el documento no envejezca.

### Paso 4.5 — Versionado de backup atado al schema

**Cambio:** `BackupFile.version` se escribe desde `DB_VERSION`, no desde una constante
suelta. Un backup siempre declara contra qué schema se generó.

---

## 13. Fase 5 — Huecos de producto

Solo después de cerrar Fase 1. Ordenados por relación valor/coste.

| # | Mejora | Por qué | Coste |
|---|---|---|---|
| 5.1 | `why` en las sugerencias | openGym ya lo tiene; convierte una orden en una explicación | Bajo |
| 5.2 | Incertidumbre visible en e1RM | Una estimación no es una medición; mostrar rango en lugar de cifra única | Bajo |
| 5.3 | Benchmarks femeninos | Cierra H13 de verdad | Medio |
| 5.4 | `missing` en la calculadora de discos | "Faltan 0,5 kg" es información; `exact: false` no | Bajo |
| 5.5 | Inventario real de discos | Modelo, no UI: `{size: pairs}` en lugar de lista de tamaños | Medio |
| 5.6 | Sync multi-dispositivo | **Decidido (Q1): cuando exista backend con cuentas.** El diseño base se resuelve en el paso 1.5, no acá | Muy alto |

### Sobre 5.6 — decidido

Q1 quedó respondida: **habrá sincronización, condicionada a que exista un backend con
cuentas reales.** Eso no adelanta la feature, pero sí cambia cómo se construye la Fase 1.

Un sync no se agrega encima de un modelo local: se diseña antes o no se puede. Las 28 tablas
normalizadas con agregados derivados no se sincronizan con stamps por campo de la forma en
que openGym lo hace con un documento único. Y hay dos problemas concretos que ya están en el
código:

**Problema A — los `id` son autoincrementales por dispositivo.**
`Workout` y `WorkoutSet` tienen `id: number` generado por Dexie (`src/domain/types.ts`). Dos
dispositivos crean el workout `42` el mismo día. Cuando se conecten, uno de los dos es 42 y
el otro necesita otro número — y todas las series que apuntaban a `workoutId: 42` ahora
apuntan a la sesión equivocada. Esto no se arregla después: hay que tenerlo antes de que
exista el primer dispositivo.

**Problema B — `Workout.totalVolume` es un agregado guardado en la fila cruda.**

```ts
// src/domain/types.ts
export interface Workout {
  // ...
  // Volumen total (kg × reps) de las series completadas, precalculado para evitar
  // recomputarlo en la UI.
  totalVolume: number
}
```

Es una cache escrita dentro del hecho. Consecuencia inmediata, incluso sin sync: cuando se
corrija H4 (política de warm-ups), **el volumen histórico no cambia**, porque está guardado.
Home seguirá mostrando el número viejo y el comparador el nuevo, y la divergencia será
permanente. Es H4 agravado por el almacenamiento.

**Decisión de arquitectura:** `totalVolume` deja de ser una columna y pasa a ser una función
(`calcTotalVolume(sets)`) o, si el rendimiento lo exige, una cache con `formulaVersion` que
`rebuildDerived()` puede invalidar. La primera opción es más simple y el cálculo es O(n)
sobre series de una sesión.

**Las tres opciones de sync siguen vigentes** para cuando llegue el backend:

- **A (recomendada):** sincronizar solo hechos crudos (`workouts`, `workoutSets`,
  `bodyWeight`, `routines`) con `uid` estable, y recalcular todo lo derivado en cada
  dispositivo.
- **B:** mover los agregados a un documento versionado aparte.
- **C:** no sincronizar y mantener export/import como contrato. **Descartada por Q1.**

La opción A es la que menos rompe y la que hace que H1/H3/H9 dejen de importar: si el PR se
deriva en el dispositivo, no hay PR que se desincronice.

---

## 14. Orden, esfuerzo y dependencias

| Fase | Pasos | Esfuerzo | Riesgo | Bloquea a |
|---|---|---|---|---|
| 0 — Congelar | 4 | S | Ninguno | Todo |
| 1 — PR, e1RM y esquema | 8 | M+ | Medio (migración v16, **reconstruible**) | 2, 3 |
| 2 — Temporales | 4 | M | Bajo | 5 |
| 3 — Datos | 7 | M | Medio (restore + `totalVolume`) | 5 |
| 4 — Barreras | 5 | S | Bajo | Sostiene todo |
| 5 — Producto | 6 | L | Variable | — |

**Ruta crítica:** 0 → 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 4.4.

El paso 1.8 (alias de ejercicios) **no está** en la ruta crítica: no corrige un número que el
usuario ve hoy. Va en el mismo sprint porque comparte la migración `v16`, pero si el tiempo
aprieta se puede diferir sin romper nada.

El paso 1.5 sigue siendo la migración más delicada del plan, pero su riesgo bajó por dos
motivos que se suman: hay pocos usuarios (Q4) y la tabla resultante es **reconstruible** —
`prs` se puede volver a generar desde `workoutSets` en cualquier momento. Una migración que
falla sobre una tabla derivada no es una pérdida de datos: es un reintento.

Con ese escenario, alcanza con una copia real de DB para probar, no hace falta infraestructura
de `dry run`.

**Si el paso 1.5 se complica**, hay una salida ordenada: separar el bloque A (recálculo de
PRs) del bloque B (columnas de sync) en dos migraciones consecutivas — `v16` y `v17` — pero
ambas en el mismo release, para que el usuario vea un solo salto.

Ese es el camino mínimo que hace que la app deje de mentir sobre los récords y no vuelva
atrás. Todo lo demás puede esperar.

**Sugerencia de entrega:** un commit por paso, con el test rojo en el mismo commit que la
corrección. La migración (1.5) va sola, con su propio test y su entrada en `CHANGELOG.md`.

---

## 15. Grillme — preguntas que bloquean

Cada respuesta cambia el plan. Sin ellas, los pasos afectados quedan en el aire.

### Q1 — ¿GymLab va a tener sincronización entre dispositivos? · **RESUELTA**

**Respuesta:** sí, cuando exista un backend con cuentas reales. No antes.

**Consecuencia adoptada.** El sync no se construye ahora, pero el modelo de datos se prepara
ahora. Se materializa en dos cambios concretos:

1. **Paso 1.5** absorbe `uid`, `updatedAt`, `formulaVersion` y `deletedAt` en la misma
   migración `v16` que recalcula los PRs. Son columnas baratas hoy e imposibles o caras
   después.
2. **`Workout.totalVolume` deja de ser una columna.** Es un agregado guardado dentro del
   hecho crudo: con sync, dos dispositivos con versiones distintas de la fórmula escriben
   volúmenes distintos para la misma sesión, y no hay forma de saber cuál es correcto.

**Lo que sigue sin decidirse** (no bloquea la Fase 1): stamps por campo, resolución de
conflictos y qué tablas se sincronizan. Eso se diseña cuando exista el backend.

### Q1.b — ¿El backend será propio del producto o una instancia self-hosted por usuario?

**Por qué bloquea.** Si es propio, el servidor es la autoridad y el merge puede ser
"servidor gana por campo". Si es self-hosted, cada instancia es independiente y el merge
tiene que ser simétrico — dos dispositivos, ninguno con autoridad. El diseño de conflictos
es distinto y openGym ya eligió el simétrico (409 + merge en el cliente), que es el camino
caro pero el único compatible con self-hosting.

**Qué cambia:** el orden de los campos del punto 1.5 no cambia, pero sí la forma del
protocolo futuro.

### Q2 — ¿Qué significa "PR" en GymLab? · **RESUELTA**

**Decisión: definición 3, con una precisión — el récord guarda el hecho, no la estimación.**

Un PR es **el mayor peso levantado para un número de repeticiones dado**, sobre un conjunto
acotado de targets (`1, 3, 5, 8, 10, 12`), calculado solo con series de trabajo.

| | Antes | Después |
|---|---|---|
| Se guarda | `{exerciseId, weightKg, reps, date, estimated1RM}` | `{exerciseId, reps, weightKg, date}` |
| Clave | `exerciseId` | `[exerciseId + reps]` |
| e1RM | almacenado | derivado al leer |

**Por qué esta y no la 2.** La definición 2 (mejor peso levantado) es más barata y también
elimina H1 por construcción. Pero destruye la señal de progreso del usuario intermedio: pasar
de `100 kg × 5` a `100 kg × 8` es una mejora del 12 % que la app no registraría. La 3 sí,
porque "100 kg para 5" y "100 kg para 8" son dos récords distintos y ambos son hechos.

**Por qué no la 1.** Un récord que depende de una fórmula deja de ser un hecho. El día que se
corrija Epley, se cambie el cap o se altere el redondeo, todo el historial de récords se
recalcula y el usuario ve números que se mueven solos. Es exactamente el problema que este
plan intenta cerrar, reintroducido en la tabla de récords.

**Qué se resuelve por construcción:**

- **H1** — un set de 20 reps no puede ser récord: 20 no es un target.
- **H2** — un set de 36 reps tampoco. El cap deja de ser un parche.
- **H5** — `reps = 0` no matchea ningún target.
- **Sync** — un hecho (`100 kg × 5`, 12 de marzo) mergea limpio; una estimación no.

**Qué se resuelve igual con filtro explícito:** el warm-up a un target válido (paso 1.3). La
definición reduce la superficie del bug, no la elimina.

**Coste aceptado:** la tabla `prs` cambia de clave primaria y el badge de PR deja de ser un
número único. Es la parte más visible de la Fase 1 y necesita copy propio en `CHANGELOG.md`.

**Contraargumento que se descartó:** la definición 2 habría costado el 10 % del trabajo. Se
descarta porque obligaría a migrar la tabla dos veces — una ahora y otra cuando se quiera
distinguir por reps.

### Q3 — ¿La app puede decir "no sé"?

Hoy devuelve `0` cuando no puede estimar. `0` es un valor, no una ausencia.

**Por qué bloquea.** El cap de 12 reps del paso 1.2 devuelve `null` para series largas. Si
la UI no puede mostrarlo, hay que inventar un número — que es exactamente el problema.

**Qué cambia:** si la respuesta es sí, el paso 1.2 es directo. Si es no, hay que diseñar un
copy de "fuera de rango" y un estado visual antes de tocar el dominio.

### Q4 — ¿Cuántos usuarios reales tienen datos que migrar? · **RESUELTA**

**Respuesta:** pocos.

**Consecuencia adoptada.** El paso 1.5 no necesita infraestructura de `dry run` ni migración
reversible con rollback completo. Alcanza con:

1. Una copia real de DB para probar la migración antes de release.
2. Un backup automático antes de aplicar `v16` — barato y ya existe la infraestructura.
3. La propiedad de re-ejecución descrita en el paso 1.5: si algo sale mal, se borra `prs` y
   se reconstruye.

**Lo que no cambia:** el backup previo se hace igual. "Pocos usuarios" reduce el impacto de un
error, no la obligación de no perder los datos de esos pocos.

### Q5 — ¿Los `exerciseId` son estables para siempre? · **RESUELTA**

**Respuesta:** no deberían cambiar, pero la salvaguarda se implementa igual.

**Consecuencia adoptada.** `exerciseId` se documenta como invariante —no cambia por diseño—
**y** se implementa la red de seguridad. Las dos cosas conviven sin contradicción: el
invariante dice cuál es la intención, la tabla de alias dice qué pasa cuando la intención
falla.

Se materializa en el **paso 1.8**, con tres decisiones que importan:

1. La tabla `exerciseAlias` se crea **vacía** en la misma migración `v16`. Si nunca se usa,
   no cuesta nada.
2. La resolución es una **capa de borde**, aplicada en dos loaders de repositorio. No se
   dispersa por las queries, porque eso recrearía el patrón de H4.
3. La tabla es **append-only**. Un alias no se edita; si el mapeo cambia, se agrega una fila
   nueva que apunte al canónico actual.

**Lo que sigue siendo riesgo aunque exista la tabla:** si el catálogo renumera *sin* que nadie
registre el mapeo, la salvaguarda no se activa sola. Requiere que el script de build del
catálogo compare ids contra la versión anterior y falle si detecta una renumeración no
declarada. Eso es trabajo del pipeline de catálogo, no de la app, y queda anotado como
pendiente para cuando se toque el seed.

### Q6 — ¿El 94 MB de fotos va a seguir dentro del bundle?

No es un problema de cálculo, pero condiciona el tamaño de la app y el backup.

**Qué cambia:** si se mueve a descarga diferida, el backup deja de pesar lo que pesa y el
export de fotos (Q-H6 del documento original) cambia de naturaleza.

### Q7 — ¿La app es de uso personal o tiene usuarios que no sos vos? · **RESUELTA**

**Respuesta (deducida de Q4):** hay usuarios, pocos.

**Consecuencia.** Cada cambio visible necesita entrada en `CHANGELOG.md` y, cuando altere un
número que el usuario reconoce como propio —un récord, una racha—, copy explicativo. No hace
falta proceso de comunicación masiva, pero sí dejar rastro escrito: con pocos usuarios, cada
reporte de "mi PR bajó" llega directo y sin contexto.

---

## 16. Lo que NO hay que hacer

1. **No agregar features nuevas con `P1` abiertos.** Cada semana con H1 abierto agrega filas
   inválidas a `prs`.
2. **No migrar dos veces.** Los pasos 1.1 a 1.4 se acumulan; la migración es una.
3. **No crear un módulo "temporal" de PR.** Un segundo módulo es exactamente H3 otra vez.
4. **No calibrar umbrales antes de cambiar el promedio (1.7).** Los umbrales de estancamiento
   y proyección están calibrados contra el promedio por serie; ajustarlos antes de mover la
   base es trabajo perdido.
5. **No confundir un hallazgo con un bug confirmado.** Quince de los diecisiete del
   documento original son lecturas de código. Los cuatro verificados en la sección 4 son
   hechos; el resto necesita su test de caracterización antes de tocar nada.
6. **No tocar el rediseño Nocturno.** Es la capa subjetiva. El plan no depende de ella y
   mezclarlas hace imposible saber qué rompió qué.

---

## Apéndice A — Constantes sin fuente

La tabla de la sección 8 del documento original es el mejor instrumento que tiene GymLab.
Estas son las que siguen sin fuente y que afectan un número visible:

| Constante | Valor | Módulo | Estado |
|---|---|---|---|
| `MIN_WEEKLY_SESSIONS` | 3 | `streak` | Decisión de producto |
| `RECOVERY_*` | 40/25/20/15/15 | `recoveryScore` | Sin fuente |
| Umbrales de recovery | 40 / 70 | `recoveryScore` | Sin fuente |
| Fatiga | 18 / 48 / 72 h | `muscleFatigue` | "Empíricos", según el propio comentario |
| `FREQUENCY_TARGETS` | 2 / 3 / 1 | `muscleFrequency` | Sin fuente |
| `PUSH_PULL_ALERT_PCT` | 20 pp | `pushPullBalance` | Sin fuente |
| Deload score | 30/25/25/10/10 | `deload` | Sin fuente |
| Reducción de deload | 10 % | `deload` | Decisión de producto |
| Estancamiento | < 2 % en 4 semanas | `plateauDetector` | Sin fuente |
| Proyección mínima | 0,1 kg/semana | `goalProjection` | Sin fuente |
| `REPS_MARGIN` | 2 reps | `workingProgression` | Sin fuente |
| `VELOCITY_THRESHOLD_PCT_PER_WEEK` | 2,5 % | `workingProgression` | Sin fuente |
| `VELOCITY_WINDOW_DAYS` | 21 | `workingProgression` | Sin fuente |
| `MIN_SESSIONS_AT_BASE` | 3 | `workingProgression` | Sin fuente |
| `FRESH_WINDOW_DAYS` | 28 | `workingProgression` | Sin fuente |
| `WARMUP_E1RM_THRESHOLD` | 0,70 | `sessionSuggestions` | Sin fuente |
| `WARMUP_WEIGHT_RATIO` | 0,45 | `sessionSuggestions` | Sin fuente |
| Calorías por paso | 0,04 kcal | `stepsTracker` | Sin peso ni velocidad |
| Zancada | 41,5 % de la altura | `stepsTracker` | Decisión de producto |
| Masa ósea | `h×0,128 + peso×0,245 − 2,95` | `bodyComposition` | Blogs, no literatura primaria |
| Tabla de fuerza | 60–120 kg, solo hombres | `strengthStandards` | Fuente parcial |

**Regla propuesta:** toda constante de esta tabla recibe un comentario en el código con uno
de tres estados — `fuente: <cita>`, `heurística: <razón>` o `producto: <decisión>`. Es más
barato que buscar la fuente de las veintiuna y elimina la ambigüedad para siempre.

---

## Apéndice B — Contrato de métricas

Plantilla a completar en `docs/METRICS-CONTRACT.md` durante el paso 0.3.

| Métrica | Fórmula | Insumos | Warm-ups | Redondeo | Pantallas |
|---|---|---|---|---|---|
| e1RM | Brzycki, cap 12 reps | peso, reps | No | 0,1 kg | PR, gráficos, benchmarks |
| Volumen de serie | `peso × reps` | peso, reps | **Sí** (por decisión) | 1 decimal | Home, sesión |
| Volumen de sesión | suma de series | series | **Sí** | 1 decimal | Home, stats |
| Volumen por músculo | suma por `muscleGroup` | series, mapa muscular | **Sí** | 1 decimal | Stats |
| Volumen comparado | suma de series | series | **No** | 1 decimal | Comparador |
| e1RM serie temporal | mejor de la sesión | series | **No** | 0,1 kg | Gráfico de fuerza |
| RPE promedio | media simple | series | **Sí** | 0,1 | Deload |
| Fatiga | horas desde `finishedAt` | workout, reloj | N/A | N/A | Home, sesión |
| Racha | semanas con ≥ target sesiones | workouts, plan | N/A | N/A | Home, logros |
| Score de deload | grupos de señales | 12 semanas | **Sí** | N/A | Home, sesión |

**Uso:** cada fila que cambie obliga a actualizar el test de contrato (`tests/contract/`)
en el mismo commit. Es la única forma conocida de que un documento de arquitectura no
envejezca en tres semanas.

---

## Cierre

El documento de auditoría original ya identificó los problemas. Este plan agrega lo que le
faltaba: **el orden**. La secuencia importa porque los arreglos se pisan — cambiar el cap de
reps reescribe la historia de PRs, cambiar el promedio de e1RM invalida los umbrales de
estancamiento, y filtrar warm-ups sin recalcular deja la tabla en un estado que no
corresponde a ninguna regla.

La ruta crítica es corta: Fase 0, pasos 1.1 a 1.5, y la barrera de contratos. Con eso,
GymLab deja de poder mentir sobre un récord y queda estructuralmente protegido contra la
recaída. Todo lo demás —salud, nutrición, planificación— ya está mejor resuelto que en
openGym y no necesita este plan.
