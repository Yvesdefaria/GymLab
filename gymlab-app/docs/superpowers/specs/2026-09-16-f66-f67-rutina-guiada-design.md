# F66 + F67 — Rutina guiada por equipamiento (diseño)

> Fecha: 2026-09-16 · Estado: propuesto · Fuente: fusión de F66 y F67 de `PLAN.md`
> Antecede: F66 entregada en `b04de0d` · F67 sin ruta ni persistencia

## Contexto

`PLAN.md` tenía F66 y F67 como dos fases separadas. La auditoría muestra que son **una sola cosa contada en dos partes**, y que el nudo real no es ninguno de los dos checkboxes pendientes.

### Lo que ya está hecho (F66, `b04de0d`)

«Mi equipamiento» existe y **es alcanzable**: chips multi-selección persistidos en `localStorage` (`gymlab-equipment`) que limitan el catálogo de `/ejercicios` a los ejercicios que el usuario declaró poder hacer. Detalles entregados:

- `filterExercises` sigue **puro**: la disponibilidad entra como 4º parámetro (`availableEquipment`, vacío = sin filtro).
- La consulta efímera del selector de sesión se renombró `equipment` → `equipmentQuery`; es ortogonal a la disponibilidad y nunca conviven en la misma pantalla.
- `ExerciseFilterBar` gana `hideEquipment`; el catálogo lo usa y el selector de sesión **no filtra a propósito**.
- `EquipmentFilter` reescrito sobre `Chip` + `HScroll` (ganó `aria-pressed` y 44 px).
- Verificado: 873 tests, build limpio, e2e `test_f66_equipamiento.py` (incluye persistencia tras recarga).

### Los hallazgos que definen esta fase

**Tres entradas de equipamiento. Dos estaban muertas.**

| Fuente | Forma | Estado |
|---|---|---|
| `answers.material` | 4 buckets (`Gimnasio`, `Mancuernas en casa`, `Solo peso corporal`, `Lo que sea`) | Se valida y se persiste en `onboardingAnswers`, y tiene **0 consumidores** |
| `equipmentStore.selected` | 9 equipos, multi-select | Vivo en el catálogo (F66), **no lo lee el planner** |
| `equipmentQuery` | 1 equipo | Vivo y efímero; es otra cosa y está bien que lo sea |

**Dos motores de rutina. Ninguno completo.**

- **`suggestRoutine`** (onboarding, vivo): elige una rutina **predefinida** por cercanía de `objective` + `daysCount`. **Ignora `level` y `material`**, que el propio onboarding acaba de preguntar. Un usuario que contestó «Solo peso corporal» + «principiante» puede recibir una rutina de barra de nivel avanzado: es un **bug de producto vivo**, no una feature faltante.
- **`generateRoutine`** (planner, inalcanzable): sí usa `level` + `objective` + `equipment` + `days`, pero emite `PlannedExercise` **abstractos sin `exerciseId`**, así que `routineRepo.createRoutine` no puede persistirlos. Además emite **un solo** ejercicio por grupo muscular y su fallback es `equipment[0]`.

### La evidencia que decide el diseño

1. **`Routine` no tiene campo de equipamiento.** Campos reales: `id, slug, title, objective, level, description, daysCount, isCustom?, imageUrl?, basedOnId?`. «Elegí la predefinida que calce con tu equipamiento» **no era implementable** sin agregar el dato.
2. **Cobertura medida sobre el seed real** (`objetivo × nivel × días 2-6`): **30 / 75 = 40%**. 45 combos sin ninguna rutina, con distribución muy sesgada (`3 días` tiene 28 de 68 rutinas; `6 días` tiene 3). Y eso es **antes** de filtrar por equipamiento.
3. **El equipamiento requerido por una rutina es derivable**: `seedRoutineDays` → `routineDayId` → `seedRoutineItems` → `exerciseId` → `catalog.equipment`. No hace falta curar el dato a mano.
4. **«Ampliar el catálogo hasta cubrir todos los casos» no es viable**: 75 combos semanales × perfiles de equipamiento = cientos de rutinas curadas. Y no hace falta: derivar + generar cubre el espacio.
5. **El tag de equipamiento ya existe, pero es single-valued y tiene fuga.** `Exercise.equipment: Equipment` es un campo **requerido**: 821 / 821 ejercicios taggeados, 9 valores, ya localizado y ya consumido por el filtro del catálogo. El problema no es que falte, es su **forma**:

   | Evidencia | Número |
   |---|---|
   | Ejercicios que mencionan banco (slug o instrucciones) | **106 de 821 (13%)** |
   | De esos, taggeados `banco` | **0** |
   | Cómo están taggeados | mancuernas 33 · barra 28 · peso corporal 17 · maquina 10 · otro 9 · polea 8 · banda 1 |

   Prueba concreta: `press-inclinado-mancuernas` está taggeado `mancuernas` y sus **propias instrucciones** dicen «Banco inclinado 30-45°». Un usuario con mancuernas y sin banco lo recibe igual. Y **esto no se arregla taggeando**: un press de banca necesita barra **y** banco, y un campo de un solo valor no puede declarar ambos. Es un problema de **modelo**, no de datos.

   Consecuencia directa: la promesa de esta fase («esta rutina entra en tu equipo») es exactamente tan verdadera como este tag. Sin WP0, la fase miente en el 13% del catálogo.

   Nota que baja el ruido: los 237 ejercicios con `otro` (29%) son mayormente estiramientos, movilidad y máquinas raras («Círculos con codos», «Estiramiento de columna», «Pellizco de disco»). El generador filtra a `category === 'strength'`, así que la mayoría nunca entra a una rutina.

## Decisiones (aprobadas por el usuario)

1. **Predefinida primero, generar como fallback.** Se busca una rutina del catálogo curado que calce; si no hay ninguna, se genera contra el catálogo real.
2. **Match exacto, relajando solo días.** Objetivo exacto y equipamiento requerido ⊆ el declarado (estricto); días exactos primero y, si no hay, la más cercana. **Nunca** se relaja el nivel ni el equipamiento. Si nada calza, se genera.
3. **Una sola fuente de equipamiento: `equipmentStore`.** `material` deja de ser campo propio; los 4 buckets pasan a ser **presets que siembran el store**, con los chips de `EquipmentFilter` debajo para afinar.
4. **El resultado se persiste como rutina propia** (`routines` con `isCustom`, vía `routineRepo.createRoutine`), con `basedOnId` cuando proviene de una predefinida. En el onboarding, además, se fija el programa activo (`activeProgramRepo.set` + `weekdaysForDays`).
5. **El onboarding entrega la rutina en el resumen**, no una predefinida elegida. `suggestRoutine` se retira.
6. **Cobertura vacía no se disimula.** Si el equipamiento deja un grupo muscular sin ejercicios, el grupo se **omite y se reporta**; si un día queda sin ejercicios, cae el día. La UI lo muestra y ofrece ampliar equipamiento. Nunca se relaja el filtro en silencio para que cierre — eso es exactamente el bug que esta fase arregla.
7. **`Exercise.equipment` pasa a ser un conjunto (`Equipment[]`) antes de empezar (WP0).** Es la condición para que la promesa de la fase sea verdadera, y el código que lo consume (F66) está fresco. La migración mecánica es scriptable; el trabajo real es el pase de `banco` sobre los ~106 ejercicios afectados.

## Arquitectura

```
Onboarding paso 2                     Rutina propia (Dexie)
  buckets (presets) ─┐                        ▲
                     ├─► equipmentStore ──────┤
  chips (afinar) ────┘         │              │
                               ▼              │
  nivel + objetivo + días ──► planRoutine(request, routines, catalogo, reqByRoutineId)
                               │              │
                               │              │
                    ┌──────────┴──────────┐   │
                    ▼                     ▼   │
          findPredefinedRoutine    generateRoutinePlan
            (predefinida)             (fallback)
                    └──────────┬──────────┘
                               ▼
                       RoutinePlan ──────────┘  routineRepo.createRoutine(draft)
                       (+ coverage)              + activeProgramRepo.set(...)
```

Toda la cadena de persistencia **ya existe** (`RoutineDraft` → `createRoutine` → `activeProgramRepo.set`). El eslabón que falta es producir un `RoutineDraft` con `exerciseId` reales.

## Contratos nuevos (dominio puro)

Todos reciben el catálogo por parámetro, igual que `filterExercises`. Nada de React, Dexie ni i18n.

```ts
// Equipamiento que una rutina predefinida exige (unión de los equipment de sus ejercicios).
requiredEquipmentOf(routineId, days, items, exercisesById): Equipment[]

// Busca la predefinida que calza. Devuelve undefined si ninguna lo hace.
findPredefinedRoutine(
  { objective, level, daysPerWeek, equipment },
  routines,
  requiredEquipmentByRoutineId,
): Routine | undefined

// Genera un plan contra el catálogo real. Sustituye a generateRoutine.
generateRoutinePlan(request, catalog): RoutinePlan

// Orquestador: intenta la predefinida y cae al generador.
// Recibe días e ítems porque la predefinida hay que CONVERTIRLA a PlannedDay[].
planRoutine(
  request,
  routines,
  catalog,
  requiredEquipmentByRoutineId,
  routineDays,
  routineItems,
): RoutinePlan

interface RoutinePlan {
  source: 'predefined' | 'generated'
  basedOnId?: number          // id de la predefinida cuando source === 'predefined'
  title: string               // predefinida: su título; generada: ver más abajo
  objective: Objective
  level: Level
  daysPerWeek: number
  days: PlannedDay[]          // con exerciseId REALES
  coverage: CoverageReport    // grupos omitidos y por qué
}

// Misma forma que RoutineDraftDay/RoutineItemDraft para que la conversión a
// RoutineDraft sea directa y sin transformaciones intermedias.
interface PlannedDay {
  dayNumber: number
  name: string
  items: PlannedItem[]
}

interface PlannedItem {
  exerciseId: number          // REAL: resuelto contra el catálogo
  targetSets: number
  targetReps: number
  restSec: number
}

interface CoverageReport {
  omittedGroups: MuscleGroup[]   // sin ningún ejercicio con tu equipamiento
  droppedDays: number[]          // días que quedaron vacíos y cayeron
}
```

**Convenciones de la parte generada** (explícitas para que no queden ambiguas):

- `title`: `Plan ${objetivo} · ${n} días`, con la etiqueta del objetivo ya localizada por el caller. La predefinida conserva su título.
- `name` de cada día: `Día ${dayNumber}` — la **misma convención que ya usa `useRoutineDraft`** (`addDay` produce `Día ${n}`). No se introduce deuda de i18n nueva; cuando el builder localice sus nombres, esto viene detrás.
- La predefinida reutiliza los nombres de día reales de `RoutineDay.name`.
- `coverage` en el camino predefinido es `{ omittedGroups: [], droppedDays: [] }`: si matcheó, por construcción el usuario puede hacerla entera.

### Semántica del equipamiento multi-valor (WP0)

Cambiar `Equipment` por `Equipment[]` **no es un rename**: invierte dos comparaciones que hoy son igualdades, y hay que hacerlo bien o el filtro miente al revés.

| Intención | Hoy (single) | Después (conjunto) |
|---|---|---|
| **Disponibilidad** («¿puedo hacerlo con mi gym?») | `available.includes(ex.equipment)` | `ex.equipment.every(e => available.includes(e))` — **subconjunto**, no intersección |
| **Consulta** («mostrame los de mancuernas») | `ex.equipment === query` | `ex.equipment.includes(query)` — al menos uno |
| **Etiqueta** (ficha, filas del catálogo) | `localizeEquipment(ex.equipment, lang)` | join de la lista (helper `localizeEquipmentList`) |

El caso que obliga al `every`: con barra pero sin banco, un press de banca (`['barra','banco']`) **no** debe aparecer como disponible. Con `some` aparecería — que es la fuga actual, solo que más difícil de ver.

`available: []` sigue significando **sin filtro** (se ve todo), como en F66.

### Derivación del equipamiento de una predefinida

```
seedRoutineDays        seedRoutineItems        catálogo
 {routineId, dayIndex}  {routineDayId,          {id, equipment}
      │                   exerciseId}                 │
      └──► routineDayIds ──► exerciseIds ──► equipment ┘
                                     └──► unión = equipamiento requerido
```

Sin curación manual. Si el catálogo cambia, el requerimiento se recalcula solo.

### Orden de selección del generador

Para cada grupo muscular del split del día:

1. Candidatos = catálogo filtrado por `muscleGroup === grupo` **y** `category === 'strength'` (nunca se arma una rutina con cardio, estiramientos o movilidad) **y** equipamiento disponible como **subconjunto** (`ex.equipment.every(...)`, con vacío = todo).
2. Orden: pertenencia a `COMMON_EXERCISE_SLUGS` (la lista curada «más relevante y reclutable» que ya existe desde F93 #18) y desempate por `slug`. El desempate es por slug y **no** por nombre localizado: el dominio es i18n-free por regla del repo, y el slug es igual de estable y además independiente del idioma.
3. Cantidad K = `clamp(round(volumenSemanal / díasQueTocanElGrupo / 3.5), 1, 4)`, con el volumen de `volumeByLevel[level][objective]`.
4. Series por ejercicio = `round(volumenSemanal / díasQueTocanElGrupo / K)`; reps y descanso de `repsByObjective` / `restByObjective`.

Reusa la curaduría que ya está en el repo en vez de inventar un criterio nuevo, y es determinista: la misma entrada da siempre la misma rutina.

## Paquetes de trabajo

Cada WP es un commit propio, con su verificación. El repo ya usa este patrón (F96 tuvo 4 slices, F97 tres).

### WP0 — `equipment` multi-valor (prerrequisito)

**Entregable**: `Exercise.equipment: Equipment[]`, con el banco incorporado, el catálogo migrado y re-sembrado. **Va antes que todo lo demás**: sin esto la promesa de la fase es falsa en el 13% del catálogo.

- Tipo `Exercise` + helper `localizeEquipmentList` en `src/i18n/catalog`.
- **Migración mecánica** (script, nunca a mano): las 52 filas de `src/data/seed/exercises.ts` y las 821 de `src/data/seed/exercisesCatalog.ts` pasan de `equipment: 'barra'` a `equipment: ['barra']`.
- **Pase de `banco`** — el trabajo real, y es juicio, no mecánica: los ~106 ejercicios que mencionan banco en slug o instrucciones se revisan y se les **agrega** `'banco'` **sin quitar** el tag existente. `press-inclinado-mancuernas` → `['mancuernas','banco']`. `fondos-en-banco` → `['peso corporal','banco']` (el cuerpo va sobre un banco; no es equipo de banco).
- **Consumidores**: `useExerciseCatalog.ts` (las dos comparaciones — ver la tabla de semántica arriba; es el punto donde es fácil equivocarse), `EjercicioDetailPage`, `ExercisePicker` y las filas de `EjerciciosPage` (etiqueta).
- **Publicación**: bump de `CATALOG_VERSION` a `v2` (URL nueva → ningún cliente se queda con el JSON viejo en caché) y **bump de `SEED_VERSION`** en `db.ts`, que dispara la re-siembra atómica de `reseeder.ts` preservando las rutinas custom del usuario. Se borra el JSON `v1`.
- **Tests**: los fixtures de `filterExercises.test.ts` y `useExerciseCatalog.test.ts` pasan a arrays; casos nuevos de **subconjunto** (con barra y sin banco, un `['barra','banco']` NO es disponible) y de **consulta** (`includes`, al menos uno).
- **Verificación**: `npm test`, `npm run build`, y el e2e ya entregado `test_f66_equipamiento.py` sigue verde. Ese e2e es la red que prueba que el cambio de modelo no rompió F66.

### WP1 — Derivación y matcher de predefinidas

**Entregable**: `requiredEquipmentOf` + `findPredefinedRoutine`, puros, con tests.

- `src/domain/routineResolution.ts`: `requiredEquipmentOf`, `findPredefinedRoutine`, y el tipo `RoutineMatch = { objective, level, daysPerWeek, equipment }` (la forma que recibe el matcher; es también la del `request` del plan).
- `MaterialBucket` (unión de los 4 ids) y `MATERIAL_PRESETS: Record<MaterialBucket, Equipment[]>` en `src/domain/onboarding.ts`, en lugar de la whitelist `MATERIALS` de strings sueltos. Los presets son:<br>`Gimnasio` → los 9 equipos · `Mancuernas en casa` → `['mancuernas','banco','banda','peso corporal']` · `Solo peso corporal` → `['peso corporal']` · `Lo que sea` → `[]` (sin filtro).
- Test de **cobertura de la matriz**: mide y afirma cuántos de los 75 combos tienen predefinida con equipamiento vacío. Es el número que dice cuántas veces va a ganar el camino curado; queda fijado en un test en vez de asumido.
- Casos de test: equipamiento ⊆ exacto, equipamiento faltante (no matchea), objetivo distinto (no matchea), nivel distinto (no matchea), días exactos primero y más cercano después, empate de días.

**Verificación**: `npx vitest run tests/unit/domain/routineResolution.test.ts`.

### WP2 — Generador contra el catálogo real

**Entregable**: `generateRoutinePlan` + `planRoutine`, con `exerciseId` reales y `coverage`.

- Reemplaza a `src/domain/routinePlanner.ts` (que se retira).
- Conserva `splitByDays`, `volumeByLevel`, `repsByObjective`, `restByObjective` (movidos, no reescritos).
- Tests: determinismo (misma entrada, misma salida), un grupo sin candidatos → omitido y reportado, día que queda vacío → cae, `category` cardio/estire no se elige nunca, equipamiento vacío = todo el catálogo, respeto del equipamiento declarado, volumen repartido coherente (Σ series ≈ objetivo semanal).

### WP3 — Onboarding

**Entregable**: el onboarding entrega la rutina.

- Paso 2 (`steps.tsx`): los 4 buckets de `material` pasan a ser presets que siembran el store, con `EquipmentFilter` debajo. `material` sale de `OnboardingAnswers` y de la whitelist `MATERIALS`.
- `SummaryStep`: muestra el `RoutinePlan` (días, ejercicios, y el `coverage` cuando hay omisiones) en lugar de la predefinida de `suggestRoutine`.
- `finish(true)`: `routineRepo.createRoutine(draft)` desde el plan y, con eso, `activeProgramRepo.set(...)`. La `basedOnId` se guarda si el plan vino de una predefinida.
- Se retira `suggestRoutine` de `src/domain/onboarding.ts`.
- i18n es/en: títulos, cobertura, avisos de grupos omitidos.

**Verificación**: e2e `tests/e2e/test_f66_f67_rutina_guiada.py` — onboarding completo con «Solo peso corporal» → la rutina generada no contiene ningún ejercicio con equipamiento no declarado → queda persistida como rutina propia → es el programa activo → 0 errores de consola.

### WP4 — Página del planificador y retiros

**Entregable**: el planner es alcanzable fuera del onboarding.

- Página `/rutinas/planificador` reusando el wizard + `planRoutine` + guardado como rutina propia; entrada desde `RutinasPage` junto a «Nueva» (`/rutinas/nueva`).
- Se retiran `src/components/planner/RoutinePlanner.tsx` y `src/domain/routinePlanner.ts`.
- i18n es/en de la página.

**Verificación**: e2e de la página + `npm test` + `npm run build` + `npx tsc --noEmit`.

## Riesgos y límites conocidos

- **WP0 es un cambio de modelo con migración de datos.** El `SEED_VERSION` bump re-siembra el catálogo en una transacción atómica y preserva las rutinas custom, pero es un punto de no retorno: si el pase de `banco` se hace mal, la fase hereda etiquetas incorrectas y ahora con más confianza. El e2e de F66 es el seguro mínimo; conviene revisar el pase por muestreo antes de commitear.
- **El generador va a dispararse seguido.** Con 40% de cobertura base y el filtro estricto de equipamiento encima, la predefinida pierde en muchos casos. No es un fallo del diseño: es el motivo por el que el generador no es opcional.
- **Una rutina generada no tiene la curaduría de una escrita a mano.** Las 68 predefinidas quedan intactas en `/rutinas`, pero el usuario nuevo ya no aterriza en ellas. Es el precio de respetar su equipamiento, y es el que se eligió.
- **La calidad del generador es un techo real.** Reusar `COMMON_EXERCISE_SLUGS` como ranking es razonable pero grueso: no distingue compuesto de aislamiento por dato, solo por la lista curada. WP2 debe dejar el ranking aislado en una función para poder afinarlo después sin tocar el resto.
- **`material` como campo persistido**: sale del tipo, pero las instalaciones existentes siguen teniendo la clave en `onboardingAnswers`. Es ruido inerte, no requiere migración.

## Fuera de alcance

- Sustitución automática de ejercicios cuando falta el equipamiento (ej.: reemplazar barra por mancuernas). Con el match estricto, un grupo sin candidatos se omite; no se inventa un sustituto.
- Recomendación de pesos/cargas: es territorio de `loadRecommendation.ts` (F97) y no se toca.
- Ampliar el catálogo **curado de rutinas**. La medición de WP1 dirá si algún combo concreto vale la pena curarlo a mano; hasta entonces, no.
- Re-taggeo fino de los 237 ejercicios en `otro`: se quedan como `['otro']`. WP0 solo agrega `banco` donde corresponde; no se amplía el vocabulario de `EQUIPMENT_OPTIONS` (nada de «fitball», «pelota medicinal», «rodillo») ni se re-clasifican los `otro`.
