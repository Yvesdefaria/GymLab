# F118 — Sugerencia de carga adaptativa alcanzable (diseño)

> Fecha: 2026-10-16 · Estado: propuesto · Fuente: F118 de `PLAN.md` (origen: reporte del usuario del 2026-09-29, «no veo el peso sugerido adaptativo mientras entreno»)
> Antecede: F97 (motor `recommendLoad` + ajuste `showLoadSuggestion`) · F98.2 (chip por bloque) · F63 (motor de sugerencias) · F113 (carrusel, cerrada — cada bloque ya monta su chip)
> Brainstorming + grilling: 2026-10-15/16. Las capas 2 y 3 del rediseño de progresión quedaron separadas en **F122** (`PLAN.md`).

## Contexto

### El motor hoy, en tres piezas

1. **Precarga** (`src/domain/session.ts`): copia el último peso/reps del ejercicio a **todas** las series de trabajo (modo default: exacto). Corre una sola vez, al armar la sesión. La escalera de calentamiento (50/70/90 % configurable del peso de trabajo) se genera marcada `isWarmup` y queda **excluida** del motor.
2. **Motor de carga** (`src/domain/loadRecommendation.ts`): base = promedio del *top set* de las últimas 5 sesiones (ventana de 90 días) → sesión viva → PR; paso = el `loadProgressionPct` **global** (default 2,5 %), reducido a la mitad si RIR ≤ 1; redondeo a placa (2,5 kg); el PR es **techo estricto** (`capped`).
3. **Superficies**: botón «Sugerido» (solo antes de la primera serie de trabajo, gate `!hasWorkingSet`) y chip en vivo por bloque (`generateSuggestions`, desde la primera serie completada). Deload manual aparte (`deload.ts`).

### Los cinco gaps (verificados en código, no inferidos)

- **G1 (el grave)** — con `showRpe=false` (**default**), `avgRpe` se inventa como 7 (`sessionSuggestions.ts:147`) y la puerta de «increase» es `avgRpe <= 6` (`:152`): la señal nunca puede dispararse. Arrastra «decrease» (`:169`) y «rest» (`:183`). Con defaults, el chip solo puede mostrar calentamiento o caída de rendimiento.
- **G2** — si la recomendación == peso precargado (típico cuando el PR topa el objetivo), `ExerciseBlock.tsx:177` oculta todo el bloque, incluido el aviso «Limitado por tu PR» (`:214`). `workout.cappedByPr` es la **única** superficie que explica el techo.
- **G3** — apagar «Sugerir carga» silencia solo el botón: el chip en vivo se calcula aparte (`useActiveSession.ts:249-268`) y sigue sugiriendo. La descripción del ajuste («según tu PR y RIR») tampoco describe lo que hace.
- **G4** — `completedSetsForSuggestions` (`sessionSuggestions.ts:71-96`) filtra solo `completed && weightKg > 0`: los calentamientos completados entran al motor, rompen la igualdad first/last, ensucian promedios y umbrales. El tipo de entrada ni siquiera recibe `isWarmup`.
- **G5 (bug en uso real, 2026-10-15)** — el botón «Aplicar +X kg» del chip **suma el delta al peso de cada serie pendiente** (`activeWorkoutStore.ts:390`, `s.weightKg + amountKg`) en vez de aplicar el objetivo absoluto: con series pendientes vacías escribe solo el delta (caso real: prensa a 200 kg, chip «+70» → dejó **70** en lugar de 270). Mismo agujero en «Baja −2,5 kg» (sobre 0 es no-op). Sin cobertura: ningún test referencia `applyWeightToRemaining`.

### La regla de diseño (aprobada en el brainstorming)

**El motor debe funcionar completo con RPE/RIR desactivados** (default de fábrica). Con RPE/RIR cargados la sugerencia es más fina, pero **en ningún caso la app puede comportarse mal ni bloquear sugerencias por falta de esfuerzo**:

- **No bloquear lo que sí se puede saber**: el historial (pesos/reps) y el PR bastan para decir «podés subir» y cuánto. RPE/RIR, cuando existen, solo modulan.
- **No afirmar lo que no se puede saber**: sin esfuerzo cargado no se inventa fatiga; los chips de descanso/bajar no se muestran.
- Los defaults **no se tocan**; el par inventado (`rpe ?? 7` con `rir ?? 2`) no puede ser fuente de permiso.

## Decisiones aprobadas por el usuario

1. **Chip «sube» (G1)**: dispara cuando el objetivo del motor supera **el top de las series de trabajo completadas de la sesión** — desde la primera serie, **sin** el guard de consistencia de F63. Se oculta cuando las series pendientes ya están **en el objetivo o por encima** (no se «sube» hacia abajo). Ancla en el top (no en la última serie), igual que la base del motor.
2. **Evidencia mínima**: el chip exige **historial real** (`recentTopSetAvg > 0`). Con PR solo (sin historial reciente) **no aparece**: el PR es techo, no prueba de fuerza.
3. **Supresión con RPE real**: con datos de esfuerzo cargados y `avgRpe >= 8` (o `avgRir <= 1`), el «sube» se **suprime** (el motor puede seguir diciendo que el objetivo es más alto, pero afirmar «sube» al límite sería mentir).
4. **Copy sin esfuerzo**: sin RPE/RIR el mensaje es **neutro** («Tu objetivo para las siguientes series: {{weight}} kg»). El nudge «tienes margen» se reserva a cuando el esfuerzo real lo confirma.
5. **Otros chips**: «baja» (`avgRpe >= 9.5` o `avgRir <= 0.5`), «descanso» (`avgRpe >= 8` con ≥3 series) y sus umbrales se evalúan **solo con datos reales**; sin esfuerzo cargado esos chips no aparecen. «Rendimiento bajó» (reps) queda como está.
6. **Aviso del récord (G2)**: se muestra **siempre** que el PR recorte el objetivo —aunque el peso sugerido coincida con el precargado— y **también junto al chip** cuando el objetivo del chip está recortado. El texto informa en vez de sonar a veto.
7. **Toggle «Sugerir carga» (G3)**: gobierna **toda propuesta de peso** del motor — botón «Sugerido» y chips de subir/bajar con su acción—; apagado también oculta el aviso del récord. Calentamiento, descanso y rendimiento quedan **fuera** (son preparación/feedback, no carga de trabajo). Se actualiza la descripción del ajuste.
8. **G4**: calentamientos completados **fuera** del motor de sugerencias (filtro en la fuente).
9. **G5**: la acción del chip lleva el **objetivo absoluto** del motor y rellena **todas las series pendientes de trabajo** del ejercicio (completadas y calentamientos intactos; undo existente). El tap es el usuario pidiéndolo explícitamente; el chip habla «para las siguientes series» en plural.
10. **Precarga**: corre al **armar la sesión** (y al agregar un ejercicio nuevo, que es el armado de ese ejercicio). Recargar en medio de una sesión **no toca nada**. El autocompletado solo ocurre cuando **el usuario lo pide** (botón/chip). Regla dura: **nunca sobrescribir un valor que el usuario escribió**.
11. **Freno con deload activo** (aprobado 2026-10-16): mientras la semana de deload esté activa, las superficies de peso **no proponen subir** (ni el botón «Sugerido» ni el chip de subir): las filas ya muestran el −10 % y sugerir subir sería contradecirse. El chip de bajar (seguridad) y los avisos de calentamiento/descanso/rendimiento quedan igual.

## Contratos

### Dominio — `src/domain/sessionSuggestions.ts`

- `SuggestionSetInput` gana `isWarmup?: boolean`; `completedSetsForSuggestions` filtra calentamientos (G4). El consumidor (`useActiveSession`) ya tiene el dato en el store.
- `avgRpe` / `avgRir` se calculan **solo sobre series con dato**; sin datos → `undefined`. Se elimina `?? 7` / `?? 2` como fuente de decisión.
- **Increase**: condición = `loadTargetByExercise[id] != null && target.weightKg > topWorkingSet` (top = máximo de series de trabajo completadas con peso > 0). Supresión: `avgRpe !== undefined && avgRpe >= 8`, o `avgRir !== undefined && avgRir <= 1`. `data: { amount, target, withMargin }` — `amount = roundToHalf(target − top)`, `withMargin = true` solo si hay esfuerzo real y no suprime.
- **Decrease**: condición = `(avgRpe !== undefined && avgRpe >= 9.5) || (avgRir !== undefined && avgRir <= 0.5)`; objetivo absoluto `roundToHalf(top − 2.5)`.
- **Rest** / **warning** / **warmup**: sin cambios de regla (warmup sigue leyendo `activeSets` + e1RM; warning sigue con reps).

### Contrato de acción (G5)

- `SuggestionAction` pasa a `{ kind: 'applyWeight'; targetKg: number }` (absoluto, para subir y bajar) y `{ kind: 'addWarmupSet'; warmupWeightKg: number }` (sin cambios). `SuggestionChip` y `useActiveSession.handleApplyWeight` son los únicos consumidores (verificado).
- Store: `applyWeightToRemaining(exerciseId, targetKg)` pasa a **fijar** el peso de las series pendientes de trabajo en `targetKg` (redondeo a 0,5 kg), sin tocar completadas ni calentamientos. Renombrar si el nombre engaña (`setWeightForRemaining`).

### Evidencia histórica

- `loadTargetByExercise` (nivel de página, `useActiveSession`) se construye **solo** para ejercicios con historial real (`loadAverages.get(id) > 0`) y cambia de forma a `{ weightKg, capped }` para que las superficies puedan mostrar el aviso del récord.

### Superficies

- **Botón «Sugerido»**: criterio actual (`enabled && suggestion > 0 && nextSet && !hasWorkingSet && suggestion !== nextSet.weightKg`).
- **Aviso del récord**: visible siempre que `capped` y haya serie pendiente de trabajo — independiente del criterio del botón; y junto al chip cuando su objetivo esté recortado por el PR.
- **Chip «sube»**: visible desde la 1ª serie de trabajo completada; oculto si `target <= max(peso de las pendientes de trabajo)` (cubre «ya está en el objetivo» y «ya está por encima»).
- **Toggle**: con `showLoadSuggestion=false` no se renderiza botón, aviso ni chips de subir/bajar. El wireo filtra las sugerencias de peso antes de repartirlas a los bloques.
- **Deload activo**: sin propuestas de subir (ni botón ni chip de subir); el chip de bajar y los avisos de calentamiento/descanso/rendimiento quedan igual. La página pasa `deloadActive` a `useActiveSession`, que reenvía la supresión a `useBlockSuggestions` (solo `increase`), y `ExerciseBlock` gatea el botón con su prop `deloadActive` que ya recibe.
- **i18n es/en**: mensaje neutro con objetivo, mensaje con margen, aviso del récord reformulado, descripción del ajuste reescrita (propone el peso de tus siguientes series según tu historial y tu PR; si cargás RPE/RIR, lo afina).

## Paquetes de trabajo

Un commit por WP, con su verificación. La implementación sigue TDD (test primero, rojo→verde).

### WP1 — Dominio: señal por motor y esfuerzo real (G1, G4)

**Entregable**: `sessionSuggestions.ts` con la nueva señal, la supresión y el filtro de calentamientos.

- Filtro `isWarmup` en `completedSetsForSuggestions` + tipo de entrada.
- `avgRpe`/`avgRir` solo con datos reales; se elimina el par inventado.
- Nuevas condiciones de increase/decrease/rest; `data` con `target` y `withMargin`.
- Tests unitarios (RED primero): sin RPE dispara con objetivo > top; sin objetivo/historial no dispara; `avgRpe >= 8` suprime; con RPE ≤ 6 `withMargin`; calentamientos completados no alteran first/last, promedios ni umbrales; decrease y rest sin datos no aparecen; el warning por reps funciona con calentamientos presentes.

**Verificación**: `npx vitest run tests/unit/domain/sessionSuggestions.test.ts` (+ build).

### WP2 — Acción con objetivo absoluto (G5)

**Entregable**: `SuggestionAction` absoluto + store.

- Tipo de acción con `targetKg`; `generateSuggestions` emite el objetivo absoluto (subir y bajar).
- Store: la acción **fija** las pendientes de trabajo en el objetivo; completadas y calentamientos intactos.
- Tests (RED primero): aplicar sobre series vacías escribe el objetivo (no el delta); sobre series con peso escribe el objetivo; no toca completadas ni calentamientos; «baja» sobre series vacías no es no-op (fija el objetivo calculado).
- `SuggestionChip` y `handleApplyWeight` cableados al nuevo contrato; el undo existente debe cubrir el cambio completo (verificar alcance del snapshot).

**Verificación**: `npx vitest run tests/unit/store/activeWorkoutStore.test.ts` (+ los de sugerencias).

### WP3 — Superficies: aviso, toggle y copy (G2, G3)

**Entregable**: la experiencia visible.

- Aviso del récord desacoplado del botón + versión junto al chip (cuando `capped`).
- Toggle gobernando botón + chips de peso + aviso; calentamiento/descanso/rendimiento intactos.
- i18n es/en: neutro, con margen, aviso reformulado, descripción del ajuste.
- Tests de componente (jsdom + Testing Library, ya en devDeps): aviso visible con `capped` aunque no haya botón; chip ausente con el toggle apagado; chip ausente si las pendientes ≥ objetivo.

**Verificación**: `npx vitest run tests/unit/components/…` + `npm test` + `npm run build`.

### WP4 — Cierre: e2e, emulador y docs (118.3)

**Entregable**: la fase verificada en el canal oficial.

- e2e nuevo `tests/e2e/test_f118_sugerencia_alcanzable.py` (Python Playwright, `with_server.py`): seed de historial + settings de fábrica → botón antes de la primera serie; completar la primera → chip visible; aplicar el chip sobre series vacías → escribe el **objetivo**; caso PR topando → aviso visible; toggle apagado → sin chips de peso; 0 errores de consola.
- Emulador (receta de `AGENTS.md`: `android:sync` → gradle → install → CDP): repetir el guion con settings de fábrica.
- `CHANGELOG.md` (Fixed/Changed), `PLAN.md` (checkboxes 118.1–118.3), memoria Engram.

**Verificación**: e2e ALL OK + `npm test` + `npm run build` + emulador con `root.children > 0` y 0 `pageerror`.

## Riesgos y límites conocidos

- **Saltos grandes del motor** (p. ej. 200 → 270 cuando el historial está lejos de la serie de hoy): F118 aplica el objetivo **fielmente**; cuestionar el tamaño del salto es la capa 3 de F122. No se agrega ningún tope acá.
- **Dependencia del historial**: si la liveQuery de promedios no cargó, no hay chip (silencio, no error). Es preferible a afirmar sin datos.
- **Cambio de contrato de acción**: `SuggestionAction` lo consumen solo `SuggestionChip` y `handleApplyWeight`; el cambio es acotado pero toca dominio + store + UI en un mismo candidato de review (contrato de datos: una sola unidad).
- **Estado previo del undo**: `handleApplyWeight` ya llama `pushUndo`; WP2 debe confirmar que el snapshot cubre el relleno completo de series (si no, corregirlo dentro del WP).
- **e2e nuevo en puerto propio** (evitar colisiones con otras sesiones) y seed que no interfiera con el reseed en background (patrón del boot de `test_f104.py`).

## Fuera de alcance

- **Capas 2 y 3** (objetivo de sesión hacia el PR, rampa de trabajo, velocidad por músculo, adaptación por tendones): declaradas como **F122**. Acá no se toca `loadRecommendation.ts`.
- Reescribir la precarga o re-aplicarla al recargar.
- Unificar el deload con la adaptación por ritmo.
- Sugerencias para cardio (sus series no tienen peso; el motor ya las excluye naturalmente).
