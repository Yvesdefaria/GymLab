# F66 + F67 — Pulido: duración, días coherentes y rediseño visual (diseño)

> Fecha: 2026-09-26 · Estado: propuesto para revisión · Fuente: bloque «[ ] F66/F67 — Pulido pendiente» de `PLAN.md` (commit `e647593`) + advisories del review del MVP + mediciones de esta fase
> Antecede: F66/F67 entregadas, mergeadas y aprobadas (`d82e5d7`, review `review-336782e7c5d7f7e2`)

## Contexto

El bloque de pulido tenía 3 ítems: **duración de sesión** (se elige en el onboarding y nadie la lee), **días coherentes** (las mezclas raras vienen del seed) y **rediseño visual** (el MVP funciona). Esta fase suma los advisories que dejó el review del MVP y un bug del onboarding.

Mediciones de esta fase (script numérico sobre los datos reales; verificadas, no inferidas):

1. **Coherencia del seed**: 48/68 rutinas repiten algún grupo en días consecutivos. La mayoría son legítimas por diseño — **32 exentas** (Anexo B); **11** se arreglan con movimientos mínimos de ítems; **5** piden reestructuración alineada a los nombres de sus días (Anexo A). `espalda` en los 3 días: **r26, r42, r62** (+r67); r48 en 2.
   - Artefacto detectable: `exerciseId 48` (`gemelo-de-pie`) usado como slot de cardio en r39/r49/r51/r53; r38 usa 32/28 y r52 usa 27 (sin artefacto).
2. **Duración**: `sessionDurationMin` tiene exactamente 5 referencias en `src/` y **0 consumidores**; el blob `onboardingAnswers` es write-only. Ya existe un estimador puro — `estimateWorkoutMinutes` (`src/domain/calendar.ts`) — que usa la ficha de rutina y **no tiene tests**.
3. **Generador**: el split de 4 días repite pierna en días seguidos; cuando un grupo se repite en el split, ambos días usan **los mismos ejercicios** (sin dedupe cross-day); `generateRoutinePlan` clampa 2→3 mientras el onboarding ofrece 2 días (y `weekdaysForDays(2)` queda inconsistente con un plan de 3).
4. **Advisories del review del MVP** (no bloqueantes, registrados para trabajo posterior): R3-001 `PlanificadorPage.save()` sin `catch` (rechazo sin error visible); R3-002 el onboarding persiste un plan de 0 días como éxito; R3-003 nombres de día/título generados hardcodeados en español y persistidos.
5. **Proceso**: los mockups se mostraron con el compañero visual del brainstorming (el usuario lo eligió y pidió documentarlo: `AGENTS.md` + `1ea2684`).

## Decisiones aprobadas por el usuario

1. **Curación del seed caso por caso** (no regla automática en el matcher). Criterio medible: **ningún grupo muscular en días consecutivos** en rutinas no exentas. Las 32 exentas se documentan con motivo; las 11 se arreglan con los movimientos verificados; **las 5 restantes se reestructuran** (aprobado en dos pasos: lote → reestructura).
2. **La duración ajusta SIEMPRE** (plan predefinido incluido), con estimado **visible por día** y regla dura: **nunca se quita el último ítem de un grupo del día** (sin grupos huérfanos). El ajuste es por **cantidad de ejercicios** (recorta y expande).
3. **UI: solo lo visual** — el flujo no cambia. Dirección **A (cards de día)**: tarjeta por día con borde acento, ejercicios con series×reps alineadas, pill de duración, CTA primario. Misma piel en el resultado del planificador, los pasos del wizard y el resumen del onboarding. El **encabezado de la tarjeta de día muestra los músculos del día** (derivados de sus ítems; el dato ya existe).
4. **Se incluyen en la fase** los 3 advisories y el bug de 2 días.
5. El seed curado y su test de coherencia van en el **mismo commit**; al tocar el seed se bumpea `SEED_VERSION`.

## Contratos

### Dominio (`src/domain/routineResolution.ts` + `calendar.ts`)

- `PlanRequest` gana `sessionDurationMin?: number` (default **60**; no rompe llamadas existentes).
- `PlannedDay` gana `estimatedMinutes: number` — calculado con `estimateWorkoutMinutes` (una sola fuente de estimación).
- `fitPlanToDuration(plan, sessionDurationMin, catalog)` — puro. Por día: si el estimado **supera** el objetivo, quita ítems de menor rango (`COMMON_EXERCISE_SLUGS`) mientras ningún grupo del día quede sin representación; si está **por debajo**, agrega candidatos del mismo grupo que aún no estén en el día (rango siguiente). Corta al llegar a ±5 min del objetivo o al agotar candidatos. No modifica `targetSets/targetReps/restSec`.
- `PlanRequest` gana `naming?: PlanNaming` (`{ dayName(n): string; title(objective, days): string }`) — inyectado por la UI con i18n para no persistir strings en español hardcodeados (R3-003). Sin `naming` se mantiene el comportamiento actual (retrocompatible con los tests).
- `SPLIT_BY_DAYS`: se agrega **2 días** (`superior / inferior`: `[pecho, espalda, hombro, biceps, triceps] / [pierna, gluteo, abdomen]`) y se reordena el de **4** para que pierna no quede en días seguidos (`pecho+hombro | pierna+glúteo | espalda+bíceps | pierna+abdomen`). Clamp 2–6.
- **Dedupe cross-day**: cuando un grupo se repite en el split, cada día usa un tramo **distinto** del ranking (primera aparición: posiciones 0..K-1; segunda: K..2K-1) en vez de repetir los mismos ejercicios.

### Seed (`src/data/seed/routines/items.ts` + `db.ts`)

- Se aplican los **movimientos verificados** del Anexo A (11 + 5 rutinas). Al aplicarlos, se eliminan **copias exactas** (mismo `exerciseId` + `targetSets` + `targetReps` + `restSec` + `supersetGroup`) **dentro del mismo día**, conservando una; los duplicados con esquema distinto se conservan. Aplica solo a las **16 rutinas tocadas**.
- Bump de `SEED_VERSION` (re-siembra atómica, preserva rutinas custom).

### Test de coherencia (medida, no supuesta)

- Nuevo `tests/unit/domain/seedCoherence.test.ts`: para cada rutina no exenta del seed, **0 grupos en días consecutivos**; la lista de **exentas** (32 ids + motivo, Anexo B) vive en el test como documentación ejecutable.
- Se extiende al generador: con 2–6 días, los planes generados no repiten grupo en días consecutivos y no repiten ejercicios entre días del mismo grupo (con equipamiento vacío y no vacío).

## Paquetes de trabajo (un commit cada uno)

- **WP1 — Curación del seed**: Anexo A (16 rutinas) + dedupe exacto intradía; bump `SEED_VERSION`; test de coherencia; CHANGELOG. Gates: test nuevo, suite completa, build. Verificar que los fences existentes (30/75 y 70/75) sigan verdes.
- **WP2 — Duración + generador**: `sessionDurationMin` + `estimatedMinutes` + `fitPlanToDuration` + `naming` i18n; splits 2 días / reorder 4 / dedupe cross-day. TDD rojo→verde: recorte, expansión, «no quitar el último ítem del grupo», tolerancia ±5, predefinida también ajustada, naming inyectado, split de 2 sin colisiones.
- **WP3 — UI dirección A**: `PlanificadorPage` (resultado en cards + selector 30/45/60/90 dentro del paso de días, con default leído del blob de onboarding — primer consumidor real de `sessionDurationMin`), resumen del onboarding (cards + músculos + pill de duración), piel del wizard (filas de opción con acento, progreso); i18n es/en; e2e actualizado/nuevo.
- **WP4 — Advisories**: R3-001 (catch + error visible en `save`), R3-002 (guard: no persistir plan sin días), R3-003 (cerrado por `naming` de WP2 + claves i18n), e2e de los caminos tristes.

Orden: WP1 → WP2 → WP3 → WP4.

## Riesgos

- **Rebalanceo limitado**: sin añadir/quitar ítems (salvo dedupe exacto), algunas rutinas quedan con días grandes y días flacos (p.ej. r43 d2, r64 d1=2 ítems). Aceptado y anotado en el CHANGELOG; se puede re-balancear después.
- **Re-siembra**: el bump de `SEED_VERSION` borra y re-crea el catálogo en una transacción atómica preservando custom; probar con datos existentes (e2e/emulador).
- **Dedupe exacto**: cubierto por comparación (no debe tocar repeticiones legítimas tipo 5/3/1+BBB; r17 no está en las 16).
- **`fitPlanToDuration` cambia el plan mostrado**: cubierto por tests de dominio + e2e del planificador/onboarding.
- **`naming` inyectado**: sin el parámetro se conserva el comportamiento actual; los tests viejos siguen válidos.

## Fuera de alcance

- I18n de los nombres del seed (rutinas/días del seed siguen en español).
- Re-autoría total de rutinas más allá de los movimientos del Anexo A.
- Re-clasificar los 237 ejercicios `otro`; ampliar `EQUIPMENT_OPTIONS`.
- Recomendación de pesos (F97); sustitución automática de ejercicios por equipamiento.
- Cambios de flujo (la fase es visual + funcionamiento puntual).

## Anexo A — movimientos verificados (script numérico: 0 colisiones, sin días vacíos, órdenes 1..n)

Formato: `[exerciseId (slug), díaOrigen→díaDestino, ordenDestino]`. Los días son `routineDayId` del seed actual; el implementador los re-verifica contra el archivo antes de aplicar.

### 11 con movimientos mínimos

- **r26**: [12 peso-muerto, 65→64, #2]
- **r28**: [36 plancha, 71→72, #3]
- **r40**: [36 plancha, 120→121, #3]
- **r41**: [36 plancha, 123→124, #3] · [27 sentadilla-con-barra, 126→123, #3]
- **r42**: [12 peso-muerto, 128→127, #5] · [32 zancadas, 127→128, #6] · [31 curl-femoral, 129→128, #4]
- **r44**: [38 hanging-leg-raise, 137→140, #2]
- **r45**: [31 curl-femoral, 142→141, #5] · [20 fondos-en-banco, 142→143, #3] · [2 press-inclinado-mancuernas, 142→143, #7]
- **r46**: [36 plancha, 144→145, #4] · [37 crunch-en-maquina, 146→145, #3] · [38 hanging-leg-raise, 146→145, #2]
- **r55**: [5 fondos-en-paralelas, 176→177, #2] · [5 fondos-en-paralelas, 176→177, #3] · [47 sentadilla-bulgara, 177→176, #2]
- **r62**: [12 peso-muerto, 197→196, #4] · [27 sentadilla-con-barra, 198→197, #2]
- **r63**: [12 peso-muerto, 201→200, #2]

### 5 reestructuradas (alineadas a los nombres de sus días)

- **r43**: [48 gemelo-de-pie, 130→132, #4] · [20 fondos-en-banco, 130→134, #4] · [32 zancadas, 131→132, #1] · [22 press-militar, 131→132, #6] · [42 flexiones, 132→133, #1] · [16 curl-en-polea, 132→133, #2] · [12 peso-muerto, 132→134, #6] · [21 extension-mancuerna-detras-cabeza, 132→134, #7] · [9 remo-con-mancuerna, 133→134, #1] · [25 elevaciones-frontales, 133→132, #2] · [43 pullover, 133→134, #3] · [48 gemelo-de-pie, 133→132, #8] · [11 jalon-al-pecho, 133→134, #5] · [24 elevaciones-laterales, 134→132, #3] · [14 curl-con-mancuernas, 134→133, #3] · [38 hanging-leg-raise, 134→131, #3] · [22 press-militar, 134→132, #10]
- **r48**: [6 cruces-en-polea, 154→155, #1] · [38 hanging-leg-raise, 154→156, #2] · [16 curl-en-polea, 154→155, #4] · [31 curl-femoral, 154→156, #5] · [32 zancadas, 154→156, #7] · [52 plancha-lateral, 154→156, #9] · [36 plancha, 154→156, #11] · [9 remo-con-mancuerna, 155→154, #1] · [52 plancha-lateral, 155→156, #10] · [36 plancha, 155→156, #12] · [12 peso-muerto, 156→154, #2] · [21 extension-mancuerna-detras-cabeza, 156→155, #8]
- **r64**: [11 jalon-al-pecho, 204→207, #3] · [16 curl-en-polea, 204→207, #8] · [36 plancha, 204→205, #2] · [27 sentadilla-con-barra, 205→203, #2] · [7 dominadas, 205→207, #4] · [12 peso-muerto, 205→207, #9] · [12 peso-muerto, 206→207, #1] · [21 extension-mancuerna-detras-cabeza, 203→207, #7]
- **r65**: [11 jalon-al-pecho, 209→211, #2] · [12 peso-muerto, 210→211, #1] · [38 hanging-leg-raise, 211→212, #1] · [27 sentadilla-con-barra, 212→208, #2] · [7 dominadas, 212→211, #4] · [33 peso-muerto-rumano, 213→210, #1] · [29 prensa-de-piernas, 213→210, #5]
- **r67**: [11 jalon-al-pecho, 218→217, #2] · [9 remo-con-mancuerna, 218→217, #5] · [7 dominadas, 219→217, #6] · [16 curl-en-polea, 219→218, #5] · [22 press-militar, 219→218, #2]

Nota de calidad declarada: la consolidación concentra copias del mismo ejercicio en un día (p.ej. r43 d1 abdomen×2, d2 pierna×3). El dedupe exacto de WP1 las reduce conservando una; los casos con esquema distinto se conservan y se anotan.

## Anexo B — exenciones documentadas (32 rutinas, no se tocan)

- **Fuerza con repetición declarada (el programa ES la repetición)**: r4 (StrongLifts), r7 (Starting Strength), r17 (5/3/1), r29 (PHUL), r30 (nSuns), r31 (PPL 6 con face pull), r33 (GZCLP), r34 (Smolov Jr), r35 (Sheiko).
- **Full-body / circuito / alternancia estructural**: r12, r14, r37, r47 (alta frecuencia declarada), r59, r66, r68 (superseries torso-pierna), r70.
- **Objetivo específico**: r16, r36, r69 (glúteos); r5, r11 (estructura de 2 días con pierna integrada); r54, r56, r57, r58 (deportes).
- **Cardio / artefacto de datos**: r38 (HIIT), r39, r49, r51, r53 (slot de cardio = `gemelo-de-pie`), r52 (Tabata con sentadilla legítima).

El test de coherencia codifica esta lista con el motivo; cualquier rutina nueva que colisione sin estar exenta hace fallar el test.
