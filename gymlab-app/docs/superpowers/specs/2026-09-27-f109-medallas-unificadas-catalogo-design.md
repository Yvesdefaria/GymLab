# F109 — Medallas unificadas y catálogo

- **Fecha:** 2026-09-27
- **Estado:** Diseño aprobado por el usuario (secciones 1 y 2, 2026-09-27); pendiente revisión del spec antes de writing-plans
- **Origen:** PLAN.md Fase 109 (notas de mejora #12 y #13, sesión 2026-09-20) · Overlap declarado: F78 (logros extendidos), F84f (8 logros de pasos), F68 (retos + `primer-reto`), F95 (chapas y variantes)
- **Worktree:** `.worktrees/f109` (rama `f109`) — aislamiento multisesión pedido por el usuario, desde el minuto cero

## Contexto (diagnóstico verificado 2026-09-27, worktree f109)

Hoy conviven **dos sistemas paralelos** de logros, y eso es lo que hace que `/logros` parezca "dividido en dos tipos":

| Eje | 16 logros "normales" | 8 logros de pasos (F84f) |
|---|---|---|
| Pieza visual | medallón circular con anillo metálico (`AchievementMedal`) | tarjeta `rounded-2xl` con caja de icono cuadrada (`StepAchievementCard`) |
| Estado | ids **persistidos** en `meta.unlockedAchievements` (una vez) | **recalculado en vivo** en cada render |
| Metal/rareza | tier bronce→platino (`ACHIEVEMENT_TIERS`) | no existe |
| Contador ×N / variantes | sí (counts + `achievementCollectibles`) | no |
| Modal de celebración | sí (cola global, confeti) | no (silencioso) |
| Barra de progreso | sí (`ACHIEVEMENT_PROGRESS`, "X de Y") | no (booleano on/off) |
| i18n | `achievements.items.*` (`core.ts`) | `steps.achievements.*` (`features.ts`) |
| En `/logros` | secciones "¡Logro desbloqueado!" / "Pendientes" + contador 16 | bloque aparte al final, grid 2 col, contador N/8 |

**Bugs verificados de datos:**
- `pr-10kg` es **inalcanzable**: `maxPrDeltaKg` (`achievementProgress.ts:109-128`) exige ≥2 filas por ejercicio en `prs`, pero esa tabla tiene PK `exerciseId` (una sola fila por ejercicio, sobrescrita) → el delta es siempre 0. El historial real de fuerza sí existe en `workoutSets`.
- `guias-completas` es **inalcanzable**: `completedGuidesCount` está hardcodeado en 0 (`achievementProgress.ts:159`); el repo no tiene ninguna señal de guía completada (`GuiaDetailPage` solo renderiza).

**Inventario de señales (para 109.2):** la app ya registra datos suficientes para medallas/retos nuevos de nutrición (`mealEntries` por día con macros precalculados), cuerpo (`bodyWeight`, `bodyMeasurements`, `progressPhotos` por día), entreno (`startedAt`/`finishedAt`/`localDate` por sesión), cardio (sets con `durationSeconds`/`distanceMeters`), pasos (`dailySteps` con `distanceKm` y `calories`) y fuerza (historial de `workoutSets`, benchmarks). **No alcanza** para: plantillas/timer/supersets (uso no registrado), guías (sin señal de completado) e intensidad de cardio (sin RPE/RIR).

**Restricciones del repo relevantes:** sin jsdom/testing-library (UI se verifica con e2e Playwright Python; los unit tests son de lógica pura); `en` tipado `EsSchema` → la paridad es/en de claves i18n la exige el compilador; `countEverCompletedChallenges` recalcula stats por cada fecha de evaluación (O(n²) — vigilar al ampliar retos).

## Decisiones aprobadas (usuario, 2026-09-27)

1. **Unificación total**: los 8 logros de pasos pasan al sistema único como medallas de primera clase (tier, contador, barra de progreso, persistencia y celebración igual que el resto). `/logros` queda como UNA sola galería.
2. **Ampliación medallas + retos**, en tanda equilibrada: ~12 medallas nuevas con datos ya disponibles + 4 retos nuevos, sin features nuevas de infraestructura.
3. **Retro-desbloqueo**: quien ya tenga historial desbloquea sus medallas al abrir la app, celebradas en la cola del modal como cualquier logro.
4. **Sin variantes cosméticas** para las medallas nuevas ni las de pasos (quedan permanentes, como ya ocurre con 2 logros actuales).
5. `pr-10kg` **se arregla en esta fase**; `guias-completas` queda fuera de alcance como deuda declarada.
6. Las medallas de pasos también aparecen en la fila "Chapas" del perfil (son medallas como cualquier otra).

## Diseño

### 1. Unificación al sistema único (109.1)

**Catálogo (`src/domain/achievements.ts`):**
- Los 8 ids de pasos (`primeros-pasos`, `diez-mil-dia`, `racha-7-dias`, `racha-30-dias`, `cincuenta-mil-semana`, `doscientos-mil-mes`, `millon-total`, `maraton`) se agregan a `ACHIEVEMENTS` al final, reutilizando sus `titleKey`/`descriptionKey` actuales (`steps.achievements.*`). No se duplican textos.
- `conditionKey` pasa a **opcional** en la interfaz `Achievement` (campo sin consumidor en UI hoy; las entradas nuevas no llenan claves muertas).
- `ACHIEVEMENT_TIERS` suma los 8 con esta escala:

| Medalla | Metal |
|---|---|
| `primeros-pasos`, `diez-mil-dia` | bronce |
| `racha-7-dias`, `cincuenta-mil-semana` | plata |
| `racha-30-dias`, `doscientos-mil-mes`, `maraton` | oro |
| `millon-total` | platino |

- Sin entradas en `ACHIEVEMENT_VARIANTS` → permanentes (sin chapa cosmética), igual que `guias-completas`/`primer-ano`.

**Medidas de pasos (`src/domain/stepAchievements.ts`, quién conserva solo derivación pura):**
- Nuevo `deriveStepStats(days: DailyStepsEntry[]): StepStats` con 5 medidas numéricas, adaptando los helpers existentes (`longestConsecutiveRun` ya es numérico; `hasWeeklyTotal`/`hasMonthlyTotal` se convierten a máximo):
  - `stepsTotal` (suma), `stepsMaxDay` (máximo diario), `steps10kRun` (racha más larga de días ≥10k, umbral fijo de diseño), `steps7dWindow` (mejor ventana de 7 días), `stepsMonth` (mejor mes calendario).
- Se eliminan `STEP_ACHIEVEMENTS`, `getUnlockedStepAchievements` y `getStepAchievementsWithStatus` (los consumidores pasan a la vía unificada).

**Progreso (`src/domain/achievementProgress.ts`):**
- `MeasureKey` suma `stepsTotal | stepsMaxDay | steps10kRun | steps7dWindow | stepsMonth`; `AchievementStats` suma sus 5 campos; `deriveAchievementStats` recibe `stepDays?: DailyStepsEntry[]` (ausente → 0) y los pliega vía `deriveStepStats`.
- `ACHIEVEMENT_PROGRESS` suma las 8 entradas: `primeros-pasos` → `stepsTotal`/1; `diez-mil-dia` → `stepsMaxDay`/10.000; `racha-7-dias` → `steps10kRun`/7; `racha-30-dias` → `steps10kRun`/30; `cincuenta-mil-semana` → `steps7dWindow`/50.000; `doscientos-mil-mes` → `stepsMonth`/200.000; `millon-total` → `stepsTotal`/1.000.000; `maraton` → `stepsMaxDay`/42.000. Todas monótonas → la barra nunca retrocede.

**Hooks (`useAchievements` + `useAchievementProgress`):**
- Ambos suman la lectura viva de `dailySteps` y pasan `stepDays` al bag de stats. Mismos patrones de debounce/signatura ya existentes.
- La persistencia, el conteo y la cola del modal no cambian: los 8 ids entran por el mismo flujo. **Retro-desbloqueo**: en la primera pasada tras el cambio, quien tenga historial recibe hasta 8 medallas en cola (una por pantalla), igual que cualquier otro logro.

**UI:**
- `AchievementsPage`: contador **dinámico** (`unlocked / ACHIEVEMENTS.length`), sin bloque de pasos (se elimina `StepAchievementsGallery` y su contador N/8). Se limpian comentarios obsoletos ("15 barras").
- `AchievementsRoute`: deja de leer/pasar `stepDays`.
- `StepAchievements` (`/pasos`) se reescribe para renderizar las medallas conseguidas con `AchievementMedal` (size `sm`), leyendo los **ids persistidos** (mismo patrón que usa `AchievementsRoute`), no recálculo vivo — misma semántica que hoy (solo las desbloqueadas). `useStepData` deja de calcular logros.
- **Se eliminan**: `src/components/achievements/StepAchievementsGallery.tsx` y `src/components/steps/StepAchievementCard.tsx`.
- `AchievementMedal.ICON_MAP` suma `CalendarRange` y `Mountain` (los otros 6 íconos de pasos ya existen).

**Arreglo `pr-10kg` (mismo dominio):**
- `maxPrDeltaKg` se recalcula desde `completedSets` (historial real): por ejercicio, excluir warmups y peso ≤0; delta = (máximo de peso registrado) − (peso de la primera serie registrada); el logro se concede con el máximo delta ≥10 kg. Test unit dedicado.

### 2. Catálogo nuevo — medallas (109.2)

12 medallas, mismo sistema unificado (barra, tier, persistencia, sin variantes). Se agregan al final de `ACHIEVEMENTS`:

| id | Familia | Título | Condición (medida) | Metal |
|---|---|---|---|---|
| `nutricion-primera` | Nutrición | Primer bocado | 1 comida registrada (`mealsRegisteredCount` ≥1) | bronce |
| `nutricion-semana` | Nutrición | Semana registrada | 7 días seguidos registrando (`consecutiveMealDays` ≥7) | plata |
| `nutricion-proteina` | Nutrición | Día proteico | 150 g de proteína en un día (`maxDailyProteinG` ≥150) | plata |
| `nutricion-30-dias` | Nutrición | Nutrición de hierro | 30 días distintos con registro (`mealDaysDistinct` ≥30) | oro |
| `cuerpo-primer-peso` | Cuerpo | Autoconocimiento | 1 registro de peso (`bodyWeightCount` ≥1) | bronce |
| `cuerpo-30-pesos` | Cuerpo | Báscula fiel | 30 registros de peso (`bodyWeightCount` ≥30) | plata |
| `cuerpo-10-fotos` | Cuerpo | Seguimiento visual | 10 fotos de progreso (`progressPhotoCount` ≥10) | oro |
| `entreno-5-dias` | Entreno | Cinco al hilo | 5 días seguidos entrenando (`longestDailyWorkoutRun` ≥5) | plata |
| `entreno-90min` | Entreno | Sesión maratón | una sesión de ≥90 min (`longestSessionMin` ≥90) | plata |
| `entreno-12-semanas` | Entreno | Trimestre constante | 12 semanas seguidas con sesión (`longestConsistentWeekRun` ≥12) | oro |
| `cardio-60min` | Cardio | Pulmones de acero | 60 min de cardio acumulados (`cardioTotalSeconds` ≥3600) | plata |
| `pasos-50km` | Pasos | Caminante | 50 km acumulados (`stepsDistanceKm` ≥50) | plata |

- Medidas nuevas en `deriveAchievementStats` (una derivación única, sin lógica duplicada en hooks): comidas (`mealEntries`), peso y fotos (`bodyWeight`, `progressPhotos`), entreno (`workouts`: racha diaria de `localDate`, duración máxima vía `workoutDurationMin`), cardio (`completedSets` con el mismo filtro de `cardioSetCount`, sumando `durationSeconds`), distancia de pasos (`deriveStepStats`).
- i18n: claves nuevas `achievements.items.<id>.title/desc` en `core.ts` es/en (es-ES, tuteo), paridad forzada por tipos.
- Iconos lucide provisionales (verificar disponibilidad al implementar): `Utensils`, `CalendarDays`, `Beef`, `Salad`, `Scale`, `CalendarCheck`, `Camera`, `Flame`, `Timer`, `Repeat`, `HeartPulse`, `Route`.

### 3. Catálogo nuevo — retos (109.2)

4 retos nuevos para Home, sin persistencia (se recalculan en vivo, como los actuales):

| id | Título | Objetivo | Duración | Tipo |
|---|---|---|---|---|
| `pasos-100k` | 100.000 pasos | acumular 100.000 pasos en el periodo | 1 semana | `pasos` (nuevo) |
| `cardio-45` | Cardio constante | 45 min de cardio en el periodo | 2 semanas | `cardio` (nuevo) |
| `vol-pierna-5000` | Pierna de acero | 5.000 kg de volumen de pierna en el periodo | 2 semanas | `volumen` + `muscleGroup` |
| `dias-4` | Cuatro al hilo | 4 días seguidos entrenando dentro del periodo | 1 semana | `consistencia` |

- **Motor (`src/domain/challenges.ts`)**: `computeChallengeStats` recibe tres señales nuevas (`stepDays`, mapa ejercicio→grupo muscular) y su salida suma stats (`stepsTotal`, `cardioSeconds`, volumen por grupo muscular, racha diaria de entreno). `ChallengeType` suma `pasos` y `cardio`; `Challenge` suma `muscleGroup?`. `calculateProgress` y el gate por `minLevel` siguen igual.
- **UI (`DynamicChallenges`)**: el mapa de iconos por tipo se extiende; la barra de progreso ya es genérica.
- Vigilar `countEverCompletedChallenges` (O(n²)): si el cambio degrada la evaluación, memoizar por fecha dentro de la planificación (decisión del plan).

### 4. Datos, i18n y efectos

- **Sin cambios de schema Dexie ni migración**: todas las tablas usadas ya existen. La persistencia usa las mismas claves de `meta`.
- **Perfil**: `ChapasSection` ya filtra por ids desbloqueados de `ACHIEVEMENTS` → las medallas de pasos y las nuevas aparecen también ahí (sin cambios de código en esa sección).
- **Modal**: sin cambios; la cola ya soporta N logros.

## Archivos principales afectados

- Dominio: `src/domain/achievements.ts`, `achievementProgress.ts`, `stepAchievements.ts`, `challenges.ts`
- Hooks: `src/hooks/useAchievements.ts`, `useAchievementProgress.ts`, `useStepData.ts`
- UI: `src/pages/AchievementsPage.tsx`, `AchievementsRoute.tsx`, `StepsPage.tsx`; `src/components/achievements/AchievementMedal.tsx`; `src/components/steps/StepAchievements.tsx`; `src/components/challenges/DynamicChallenges.tsx`. **Se eliminan** `StepAchievementsGallery.tsx` y `StepAchievementCard.tsx`.
- i18n: `src/i18n/locales/{es,en}/core.ts` y `features.ts`
- Tests: `tests/unit/domain/{achievements,achievementProgress,stepAchievements,challenges}.test.ts`; `tests/e2e/test_f84b_pasos.py`, `test_f95.py`, `test_f93_16_chapas.py`; nuevo `tests/e2e/test_f109.py`

## Paquetes de trabajo (propuesta — el plan la refina; regla: cada commit deja build+tests verdes)

1. **T1 — Dominio: unificación + fix `pr-10kg`**: medidas de pasos, catálogo de 8 entradas + tiers + progreso, derivación desde sets para `pr-10kg`, unit tests. (Si la rebanada lo exige, conserva temporalmente los helpers viejos de pasos para no romper la UI; se eliminan en T2.)
2. **T2 — Hooks + UI unificada**: lecturas vivas de pasos en ambos hooks; `/logros` con contador dinámico y sin bloque separado; `/pasos` con medallones; borrados; actualización de e2e existentes (`test_f84b_pasos.py`, `test_f95.py`).
3. **T3 — Medallas nuevas**: medidas de familias (comidas, cuerpo, entreno, cardio, pasos), 12 entradas + tiers + i18n es/en + unit tests.
4. **T4 — Retos nuevos**: motor (stats y tipos nuevos) + UI + i18n + unit tests.
5. **T5 — e2e de fase**: `tests/e2e/test_f109.py` (galería unificada, contador 36, medallas nuevas visibles, retos nuevos en Home) + repaso de contadores fijos.
6. **T6 — Docs de cierre**: PLAN.md (tildar 109.1/109.2) + CHANGELOG.md.

## Verificación (regla del repo, por tarea)

1. `npm run build` (typecheck REAL: `tsc -b`; nunca `npx tsc --noEmit`).
2. `npm test` + lint.
3. e2e con la biblioteca Python: `python tests/e2e/scripts/with_server.py tests/e2e/test_f109.py` + los e2e actualizados.
4. Review cycle Gentle AI **antes de cada commit** (candidato = diff del workspace; orden: implementar → normalizar → verificar → review → commit). Commit sin push.
5. **Emulador no requerido**: no hay cambios nativos ni de router/`vite.config.ts`.

## Riesgos

- **Cola retro de modales** (hasta 8 al primer arranque tras el cambio): aceptada por el usuario; si molesta, evaluar un cap en el futuro.
- **Más lecturas vivas en dos hooks** (pasos, comidas, peso, fotos): coste con debounce existente; monitorear; la lentitud general es F103, no esta fase.
- **`countEverCompletedChallenges` O(n²)** con stats nuevas: medir y memoizar si degrada (decisión del plan).
- **e2e con contadores fijos** (16, N/8): actualizar a valores dinámicos derivados del catálogo.
- **Derivaciones duplicadas**: mantener una sola derivación por medida (dominio), nunca en los hooks.

## Fuera de alcance (deuda declarada)

1. **Señal de guías leídas** → `guias-completas` sigue sin concederse hasta instrumentar el marcado (mini-feature propia, fase futura).
2. Variantes cosméticas para medallas nuevas o de pasos.
3. Uso de plantillas/timer/supersets (no se registra hoy).
4. Rediseño adicional de `/logros` más allá de la unificación (sin secciones nuevas).
5. Notificaciones nuevas: se usa el modal existente.
