# Contrato de métricas — GymLab

> **Qué es este documento.** La definición única de cada número que la app muestra o
> persiste. Si una pantalla calcula un número, debe salir de la función listada acá; si
> cambia una fórmula, cambia este contrato y su test en el mismo commit.
>
> **Estado.** 2026-10-28. Cubre los cálculos de entrenamiento, recuperación y salud.
> Los hallazgos abiertos están al final, con la corrección deseada.

---

## Reglas

1. **Un dueño por métrica.** Una función, un archivo, un test. Si hay dos implementaciones,
   una debe desaparecer.
2. **`null` es un valor.** "No hay datos suficientes" no es `0`; la UI puede mostrar "—".
3. **Warmups fuera.** `isWorkingSet` (`domain/setFilters.ts`) es la única definición de
   serie de trabajo: `completed && !isWarmup && weightKg > 0 && reps > 0`.
4. **Hecho vs estimación.** Un PR es un hecho (peso, reps, fecha). El e1RM es una
   estimación derivada; nunca se guarda dentro del récord.
5. **Todo derivado es recomputable.** PRs, volumen, e1RM, fatiga y rachas se pueden
   reconstruir desde `workoutSets` y `workouts`.
6. **El volumen legacy no manda.** `Workout.totalVolume` solo se lee como fallback para
   filas o seeds sin series; si hay series, gana `buildVolumeByWorkout`.

---

## 1. Entrenamiento

| Métrica | Definición | Filtros | Redondeo | Dueño | Pantallas | Test |
|---|---|---|---|---|---|---|
| Serie válida | `completed && !isWarmup && weightKg > 0 && reps > 0` | — | — | `domain/setFilters.ts` | Todas | `setFilters.test.ts` |
| PR | Mayor `weightKg` por ejercicio y reps (1–12) | Serie válida | — | `domain/prs.ts` `detectPRsFromSets` / `bestPRsFromSets` | Sesión, perfil, detalle | `prs.test.ts` |
| e1RM | Brzycki: `w × 36 / (37 − reps)`; `reps = 1 → w`; `reps > 12 → null` | Serie válida | 0,1 kg | `domain/prs.ts` `estimate1RMValue` | Fuerza, calculadora, PR | `prs.test.ts` |
| Volumen de serie | `weightKg × reps` | Serie válida | 1 decimal | `domain/volume.ts` `calcSetVolume` | Sesión | `volume.test.ts` |
| Volumen de entrenamiento | Suma de series válidas | Serie válida | Entero al mostrar | `domain/volume.ts` `calcTotalVolume` / `buildVolumeByWorkout` | Home, stats, perfil, calendario, comparador | `volume.test.ts` |
| Volumen total informativo | Suma de series completadas, incluye warmups | `completed` | 1 decimal | `domain/volume.ts` `calcSessionVolume` | Solo si se muestra rotulado | `volume.test.ts` |
| e1RM medio | Media de e1RM de series válidas | Serie válida | 0,1 kg | `domain/prs.ts` `averageE1rm` | Estancamiento, objetivos | `prs.test.ts` |
| Racha | Semanas con `≥ min(3, daysPerWeek)` sesiones | Workouts por semana local | — | `domain/streak.ts` `calcStreak` | Home, perfil, logros | `streak.test.ts` |
| Fatiga | Horas reales desde `finishedAt ?? startedAt`; `<18 sore`, `<48 fatigued`, `<72 warm`, resto fresh | Serie válida | — | `domain/muscleFatigue.ts` | Cuerpo | `muscleFatigue.test.ts` |
| Discos | Greedy → DP → más cercano por debajo + `missingKg` | Inventario del usuario | 0,25 kg | `domain/calculators/plates.ts` | Calculadora | `plates` (pendiente de oráculo) |
| Comparador | Volumen, series, reps, e1RM, PRs y duración por sesión | Serie válida | Según métrica | `domain/sessionComparison.ts` | Historial | `sessionComparison.test.ts` |

### PR: definición operativa

Un PR es el **mayor peso levantado para un número de repeticiones dado**, no el mejor
e1RM. La tabla `prs` guarda `{ exerciseId, reps, weightKg, date, uid, updatedAt }` con
clave `[exerciseId + reps]`. Un set de 13+ reps no crea récord; uno de 0 reps tampoco.
El e1RM de un PR se muestra derivado (`estimate1RMValue`), nunca persistido.

### Volumen: definición operativa

`buildVolumeByWorkout(sets)` devuelve `Map<workoutId, kg>` sumando solo series válidas.
`volumeOf(workout, volumes)` devuelve el valor derivado; si el workout no tiene entrada
en el mapa, cae al `totalVolume` legacy (filas viejas o seeds sin series). La migración
v18 borra esa cache de la cabecera.

---

## 2. Recuperación

| Métrica | Definición | Dueño | Estado |
|---|---|---|---|
| Readiness | Media ponderada de días/sueño/dolor/racha/pasos, renormalizada sobre los factores disponibles | `domain/recoveryScore.ts` | Fuente: heurística de producto |
| Fatiga por músculo | Horas reales desde el último entreno; umbrales 18/48/72 h | `domain/muscleFatigue.ts` | H7 corregido |
| Deload score | 30/25/25/10/10, umbral 60 | `domain/deload.ts` | Fuente: producto; H5 de double counting pendiente |
| Estancamiento | e1RM medio < 2 % en 28 días vs 28 anteriores; alerta a las 3 semanas | `domain/plateauDetector.ts` | Fuente: heurística |

---

## 3. Salud

| Métrica | Definición | Dueño | Estado |
|---|---|---|---|
| IMC | `kg / m²` | `domain/calculators/imc.ts` | OMS |
| BMR | Mifflin-St Jeor | `domain/calculators/tdee.ts` | Fuente citada |
| TDEE | `BMR × factor` (1,2–1,9) | `domain/calculators/tdee.ts` | Fuente citada |
| Déficit | `20 %` con tope de 500 kcal | `domain/calculators/tdee.ts` | Fuente citada |
| Macros | Proteína 1,8/2,2 g/kg; grasas 0,8 g/kg; carbs resto | `domain/calculators/macros.ts` | Producto |
| Agua | `30 ml/kg + 0,5 L/30 min` | `domain/calculators/water.ts` | H16 abierto: 1,0 L/h vs rango 0,4–0,8 |
| Navy | Fórmula U.S. Navy | `domain/calculators/navy.ts` | Fuente citada |
| Jackson-Pollock | 3/7 pliegues + Siri | `domain/calculators/bodyComposition.ts` | Fuente citada |
| Masa ósea | `h×0,128 + peso×0,245 − 2,95` | `domain/calculators/bodyComposition.ts` | H14 abierto: altura 170 por defecto |
| Percentil de fuerza | Tablas por sexo, interpolación por peso corporal | `domain/strengthStandards.ts` | H13 corregido |

---

## 4. Hallazgos abiertos

| ID | Qué falta | Corrección deseada | Test |
|---|---|---|---|
| **H8** | La proyección usa `Math.max(tasa, 0,1)` y promete fecha con tendencia negativa | `kind: 'regression'` sin fecha; `stalled` sin progreso | `characterizationH1H17.test.ts` (skip) |
| **H9** | El e1RM medio promedia series, no sesiones | Mejor e1RM por sesión y media de sesiones | idem |
| **H11** | `weeklyVolume.buildWeeklyVolumeSeries` rellena ceros; `trainingStats` no | Una sola función con `zeroFill` | idem |
| **H12** | Navy `<18` fitness y JP `≤17` en_forma | Una tabla única de categorías por sexo | idem |
| **H14** | Sin altura usa 170 cm para hueso/músculo | `null` y copy "Falta altura" | idem |
| **H15** | TDEE + pasos × 0,04 puede duplicar el gasto | Sumar pasos solo en actividad sedentaria/ligera o toggle | idem |
| **H16** | 0,5 L/30 min = 1,0 L/h, fuera del rango citado 0,4–0,8 | 0,5 L/h o midpoint 0,6 | idem |
| **H17** | Dominadas/flexiones suman 0 al volumen | `repsVolume` separado de `loadVolume` | idem |

---

## 5. Cómo cambiar una métrica

1. Escribir el test que falla (o el skip que documenta el hallazgo).
2. Cambiar la función dueña, no el consumidor.
3. Actualizar esta tabla y el `CHANGELOG.md` en el mismo commit.
4. Si cambia un dato persistido, agregar migración Dexie y probar una base real.
5. Si toca UI, verificar en 375 y 768 px; si toca rutas o nativo, probar en emulador.

**Regla de oro:** si un número aparece en dos pantallas, sale de la misma función. Si no,
el bug es de definición, no de UI.
