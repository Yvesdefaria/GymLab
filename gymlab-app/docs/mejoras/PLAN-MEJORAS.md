# GymLab — Plan de mejoras paso a paso

> **Qué es este documento.** Plan ejecutable para llevar GymLab de su estado actual a un
> producto con datos confiables, motor de entrenamiento más profundo y release en tiendas.
> Está ordenado por **riesgo de correctness**, no por atractivo visual.
>
> **Base.** Auditoría `docs/ARQUITECTURA-Y-CALCULOS.md` y comparación
> `docs/GYMLAB-VS-OPENGYM.md`. Fecha: 2026-10-26. Rama de referencia: `main`.
>
> **Regla de oro.** Primero se corrige lo que hoy puede mentir. Después se agrega lo que
> falta. Nunca al revés.

---

## Índice

1. [Punto de partida](#1-punto-de-partida)
2. [Principios del plan](#2-principios-del-plan)
3. [Decisiones abiertas](#3-decisiones-abiertas)
4. [Matriz de prioridad](#4-matriz-de-prioridad)
5. [Fase 0 — Correctitud](#5-fase-0--correctitud-semana-1)
6. [Fase 1 — Contrato de datos](#6-fase-1--contrato-de-datos-semana-2)
7. [Fase 2 — Motor de fuerza v2](#7-fase-2--motor-de-fuerza-v2-semanas-3-6)
8. [Fase 3 — Integridad y portabilidad](#8-fase-3--integridad-y-portabilidad-semana-7)
9. [Fase 4 — Infraestructura de calidad](#9-fase-4--infraestructura-de-calidad-semana-8)
10. [Fase 5 — Producto y UX](#10-fase-5--producto-y-ux-semanas-9-10)
11. [Fase 6 — Privacidad y tienda](#11-fase-6--privacidad-y-tienda-semanas-9-10)
12. [Fase 7 — Estratégico](#12-fase-7--estratégico-p3)
13. [Roadmap de 12 semanas](#13-roadmap-de-12-semanas)
14. [Definición de terminado](#14-definición-de-terminado)
15. [Métricas de éxito](#15-métricas-de-éxito)
16. [Riesgos del plan](#16-riesgos-del-plan)
17. [Qué NO hacer](#17-qué-no-hacer)
18. [Primeros cinco pasos](#18-primeros-cinco-pasos)

---

## 1. Punto de partida

| Métrica | Valor |
|---|---|
| Líneas `src` | 60.978 TS/TSX |
| Páginas | 46 |
| Componentes | 262 archivos |
| Hooks | 82 |
| Archivos de dominio | 102 |
| Tablas Dexie | 28 |
| Migraciones | 15 |
| Tests unit | 192 archivos / 20.686 líneas |
| Tests e2e | 109 archivos / 16.449 líneas |
| CI | No hay |
| Ejercicios | 873 (52 curados + 821) |
| Rutinas | 68 / 220 días / 1.042 items |
| Guías / papers | 36 / 6 |
| Alimentos | 171 |
| Logros / retos | 36 / 14 |

Fortalezas a conservar: dominio puro, repositorios detrás de interfaces, i18n tipado,
unidades internas en kg, backup atómico, buena base de tests de dominio.

Deudas que bloquean: H1–H17 de la auditoría, especialmente el bloque PR/e1RM/warmups.

---

## 2. Principios del plan

1. **Un solo dueño por métrica.** Cada número tiene una función, un archivo y un test.
2. **Rojo antes de verde.** Ningún cambio de cálculo sin un test que falle primero.
3. **No romper datos históricos.** Si cambia una política (warmups, volumen), hay
   migración o recomputo explícito.
4. **Explicar el número.** Si la app sugiere un peso, debe poder decir por qué.
5. **No copiar AGPL.** Las ideas de openGym se reimplementan; el código no se copia.
6. **Lo visual después.** No se rediseña una pantalla mientras su cálculo es dudoso.
7. **Un cambio por commit.** Con su test, su doc y su evidencia.

---

## 3. Decisiones cerradas y modelo de convivencia

### 3.1 Decisiones finales

| ID | Decisión final |
|---|---|
| **D1** | Las tres olas, en orden **A → B → C**: tienda con datos correctos → motor de precisión y guía → sync multi-dispositivo |
| **D2** | Warmups **fuera de todas** las métricas de entrenamiento (volumen, e1RM, PR, fatiga, comparador). Se conserva un “total de sesión” separado solo como dato informativo |
| **D3** | Precisión máxima: ensemble de fórmulas + confianza + estimación automática de RIR + precarga editable + explicación de cada sugerencia |
| **D4** | Readiness actual + fatiga por músculo **sin RIR** en la primera versión; modelo completo con RIR después |
| **D5** | Backup y export ahora; sync multi-dispositivo como última ola |
| **D6** | Telemetría **opt-in** con un solo toggle maestro, default **OFF**, y detalle de Sentry/PostHog |
| **D7** | Peso corporal = métrica separada de reps; no se mezcla con kg ni se inventa carga |
| **D8** | Pulir los 873 ejercicios y las guías antes de expandir el catálogo |
| **D9** | Android primero (Play Store); iOS después |
| **D10** | La app prescribe la **sesión completa** (series, reps, peso, descanso, calentamientos, deload y discos), editable, con modos para desactivarla |
| **D11** | RIR/RPE **visibles por defecto**, con estimación automática cuando faltan; nunca bloquean la sesión |
| **D12** | IDs estables y `updatedAt` **antes** del release, no después; migración con backup y tests |
| **D13** | Contenido: calidad antes que cantidad; 873 ejercicios alcanzan para el release |

### 3.2 Modelo de prescripción: cómo convive “guiar” con “no molestar”

La app separa dos capas que hasta ahora estaban mezcladas:

1. **Capa de datos (siempre activa).** Calcula PR, e1RM, volumen, fatiga, rachas y
   estadísticas. **No se puede desactivar**: es el registro de lo que pasó.
2. **Capa de prescripción (opcional).** Decide qué peso/reps/series sugerir para la
   próxima sesión. Se puede desactivar sin degradar los datos.

#### Modos de prescripción

| Modo | Qué hace | Para quién |
|---|---|---|
| **Guiado** (default) | Precarga la sesión completa: series, reps, peso, descanso, calentamientos, deload y discos. Todo editable. Cada valor tiene “por qué” y confianza | Usuario que quiere que la app piense por él |
| **Sugerencias** | No precarga; muestra chips con la sugerencia y un botón “aplicar” | Usuario que quiere control pero acepta ayuda |
| **Manual** | No precarga y no muestra chips. Solo registra y calcula PR/volumen/e1RM. “Repetir última sesión” sigue disponible como acción explícita | Usuario que no quiere que la app opine |

- El modo se elige en **Ajustes → Entrenamiento → Asistente de progresión**.
- Se puede sobrescribir **por ejercicio** (`heredar`, `apagado`).
- El cambio aplica a las series nuevas; las ya cargadas no se pisan.
- Si el usuario desactiva el modo en medio de una sesión, se muestra un toast: “Las
  sugerencias quedan desactivadas; tus datos se siguen registrando”.
- **Nunca hay auto-aplicación silenciosa.** El motor devuelve una `SessionPrescription`;
  la UI la aplica como borrador editable. El usuario siempre confirma o corrige.

#### Flujo técnico

```
historial + rutina + ajustes
        ↓
domain/prescription.buildSessionPrescription()
        ↓
SessionPrescription { exercises[], source, confidence, why[], deload, warmups }
        ↓
UI (guided)  → activeWorkoutStore.prefill(prescription)  → filas editables
UI (suggest) → chips “aplicar”                            → filas editables
UI (manual)  → nada                                       → filas vacías
```

- `prefill` solo completa filas vacías o no completadas. No pisa valores que el usuario ya
  escribió.
- Si el usuario edita un valor precargado, se marca como `overridden` y no se recalcula
  solo.
- La prescripción no se persiste como verdad: se guarda el resultado real de la sesión.

### 3.3 Reglas de convivencia con el resto de decisiones

| Decisión | Cómo convive con la prescripción |
|---|---|
| **D2 warmups fuera** | La prescripción calcula warmups aparte; no entran en volumen, PR ni fatiga |
| **D3 precisión** | La prescripción muestra confianza y rango; si no hay datos suficientes, no inventa |
| **D4 fatiga sin RIR** | La fatiga se calcula con series efectivas; el RIR se estima cuando falta y se marca como estimado |
| **D5 sync después** | La prescripción es local y determinista; no depende de la nube |
| **D6 telemetría opt-in** | La prescripción funciona igual con telemetría apagada |
| **D7 peso corporal** | La prescripción de dominadas/flexiones usa reps, no kg inventados |
| **D9 Android primero** | La prescripción es la misma en web, PWA y Android |
| **D11 RIR visible** | El RIR alimenta la confianza del 1RM y la fatiga; si falta, se estima |
| **D12 IDs antes del release** | La prescripción usa IDs estables; no cambia el esquema después de publicar |

---

## 4. Matriz de prioridad

| Prioridad | Significado | Ejemplos |
|---|---|---|
| **P0** | Puede mostrar un número incorrecto | PR con warmup, Brzycki a 36 reps, dos `estimate1RM`, restore parcial |
| **P1** | Afecta consistencia o confianza | warmups dispares, racha de 2 días, fatiga aproximada, proyección optimista |
| **P2** | Mejora el producto sin urgencia | explicar sugerencias, inventario de discos, balance estructural |
| **P3** | Estratégico o de alto costo | sync, AI coach, MCP, más idiomas |

### 4.1 Orden de ejecución: A → B → C

| Ola | Qué incluye | Fases | Criterio de salida |
|---|---|---|---|
| **A. Tienda con datos correctos** | Correctitud, contrato de datos, CI, privacidad, release candidate Android | 0, 1, 4, 6 | APK firmado, suite verde, Data Safety completo |
| **B. Motor de precisión y guía** | Ensemble de 1RM, confianza, RIR, fatiga, deload, discos, prescripción completa | 2 | Números de oráculo estables y sesión precargada |
| **C. Sync multi-dispositivo** | Diseño de sync, backend, auth, merge | 7 | Dos dispositivos con el mismo estado |

**Regla:** no se abre B hasta que A tenga release candidate. No se abre C hasta que B esté
estable. La única excepción es la migración de IDs (D12), que se hace en A para no migrar
datos reales después.

---

## 5. Fase 0 — Correctitud (semana 1)

**Objetivo:** que ningún número visible sea demostrablemente falso.
**Duración:** 6–9 días de un desarrollador con contexto.
**Gate:** suite verde, build limpio, tests nuevos que fallaban antes.

### P0-01 — Unificar `estimate1RM`

- **Problema:** hay dos implementaciones. `domain/prs.ts` tiene guarda en `reps ≥ 37` y
  redondeo a 0,1; `domain/benchmark.ts` no tiene guarda ni redondeo. Con 37 reps el
  benchmark devuelve `Infinity`; con 38, negativo.
- **Cambio:**
  1. Crear `src/domain/strength/oneRepMax.ts` como fuente única.
  2. Exportar `estimateE1RM({ weightKg, reps, rir?, formula })` con:
     - `reps < 1` → `null`
     - `weightKg <= 0` → `null`
     - `reps > 12` (o `reps + rir > 15` en modo ponderado) → `null`
     - `reps === 1` → peso
     - redondeo a 0,1
  3. `prs.ts` y `benchmark.ts` delegan en ese módulo; no queda ninguna fórmula duplicada.
  4. `benchmarkRepo.add` rechaza el alta si el resultado es `null`; la UI muestra error de
     validación.
- **Archivos:** `src/domain/prs.ts`, `src/domain/benchmark.ts`,
  `src/domain/calculators/oneRepMax.ts`, `src/data/repositories/dexie/benchmarkRepo.ts`,
  `src/components/benchmark/BenchmarkTests.tsx`.
- **Tests:** `tests/unit/domain/prs.test.ts`, `benchmark.test.ts`, nuevo
  `oneRepMax.test.ts`.
  Casos: `1, 5, 10, 12, 13, 15, 16, 20, 36, 37, 38` reps; peso 0; reps 0; NaN; Infinity.
- **Aceptación:** ningún consumidor devuelve `Infinity` o negativo; PR y benchmark
  coinciden para el mismo set válido; el set inválido se rechaza con mensaje.
- **Riesgo:** datos históricos de benchmark con `Infinity`/negativo. Agregar un script de
  auditoría que los detecte y los marque para revisión.
- **Esfuerzo:** 1–2 días.

### P0-02 — Excluir warmups de la detección de PR

- **Problema:** `detectPRsFromSets` no filtra `isWarmup`; `bestPRFromSets` sí. Un
  calentamiento con muchas reps puede crear un PR que desaparece al borrar la sesión.
- **Cambio:** agregar `!set.isWarmup` al filtro de `detectPRsFromSets`.
- **Archivos:** `src/domain/prs.ts`, `src/data/workoutSession.ts`.
- **Tests:** warmup 40×20 + trabajo 60×5; PR debe ser 60×5 (e1RM 69,2) y no 40×20
  (e1RM 71,1). Borrar la sesión y verificar que el PR no cambia.
- **Aceptación:** el PR es el mismo antes y después de borrar; ningún warmup genera PR.
- **Esfuerzo:** 0,5 día.

### P0-03 — Exigir `reps > 0` en PR

- **Problema:** una serie completada con peso y 0 reps puede crear un PR con e1RM 0 si no
  había PR previo.
- **Cambio:** `detectPRsFromSets` exige `set.reps > 0`.
- **Tests:** serie 50 kg × 0 reps; no debe crear PR.
- **Esfuerzo:** 0,25 día.

### P0-04 — Política única de warmups y volumen

- **Problema:** `Workout.totalVolume` incluye warmups; `sessionComparison` los excluye;
  `volumeByMuscleGroup` los incluye; `buildE1rmSeries` los incluye; `setStats` los
  excluye.
- **Decisión D2:** recomendado **excluir warmups de todas las métricas de entrenamiento**
  y conservar un “volumen total de sesión” separado si se quiere mostrar.
- **Cambio:**
  1. Crear `src/domain/setFilters.ts`:
     ```ts
     export const isCompletedSet = (s) => s.completed
     export const isWorkingSet = (s) =>
       s.completed && !s.isWarmup && s.weightKg > 0 && s.reps > 0
     export const isCardioSet = (s) => (s.durationSeconds ?? 0) > 0
     ```
  2. Aplicar `isWorkingSet` en `volumeByMuscleGroup`, `buildE1rmSeries`,
     `recentAvgRpe`, `setStats`, `sessionComparison`.
  3. `computeSessionStats` calcula `workingVolume` y `totalVolume` por separado.
  4. `Workout.totalVolume` se guarda con `workingVolume`; agregar un flag
     `volumePolicyVersion` en `meta`.
  5. Migración Dexie v16: recalcular `totalVolume` de workouts históricos desde sus
     `workoutSets` con la nueva política. Si la migración es costosa, hacer un backfill
     perezoso con `meta.volumeBackfillDone`.
- **Archivos:** nuevo `src/domain/setFilters.ts`; `trainingStats.ts`, `e1rm.ts`,
  `deload.ts`, `sessionProgress.ts`, `sessionComparison.ts`,
  `repositories/dexie/db.ts`, `data/workoutSession.ts`.
- **Tests:** una sesión con 3 warmups + 3 series de trabajo debe dar el mismo volumen en
  home, estadísticas y comparador. Test de migración con un workout viejo.
- **Aceptación:** un solo número de volumen por sesión en todas las pantallas.
- **Riesgo:** cambia números históricos. Comunicar en CHANGELOG y revisar logros que
  dependan de volumen.
- **Esfuerzo:** 2–3 días.

### P0-05 — Fatiga con hora real del entrenamiento

- **Problema:** `fatigueMap` calcula `días × 24 + hora actual`, ignorando la hora del
  entrenamiento. Ayer 20:00 consultado a las 09:00 da 33 h en vez de 13 h.
- **Cambio:**
  1. `lastTrainedByMuscle` devuelve `{ localDate, startedAt }` por músculo.
  2. `fatigueMap` calcula `(now - lastStartedAt) / 36e5`; fallback a `localDate` a las
     12:00 si no hay `startedAt`.
  3. Extraer `hoursSinceLastTrained` para testearlo sin React.
- **Archivos:** `src/domain/muscleFatigue.ts`, consumidores en `CuerpoPage`,
  `MuscleDummy`.
- **Tests:** ayer 20:00 + hoy 09:00 = 13 h → `sore`; ayer 08:00 + hoy 09:00 = 25 h →
  `fatigued`.
- **Aceptación:** el nivel coincide con las horas reales.
- **Esfuerzo:** 0,5–1 día.

### P0-06 — Proyección honesta cuando hay regresión

- **Problema:** `Math.max(avgRate, 0.1)` proyecta mejora incluso si el usuario empeora.
- **Cambio:**
  1. `GoalProjection` agrega `trend: 'up' | 'flat' | 'down'`.
  2. Si `avgRate <= 0`: `estimatedDate = null`, `weeksToTarget = null`,
     `trend = 'down'`.
  3. La UI muestra “Sin progreso reciente” en vez de una fecha inventada.
- **Archivos:** `src/domain/goalProjection.ts`, `ObjetivosPage`, `GoalHero`, `GoalRow`.
- **Tests:** historial con e1RM bajando; no debe haber fecha.
- **Aceptación:** ninguna fecha proyectada sobre una tendencia negativa.
- **Esfuerzo:** 0,5–1 día.

### P0-07 — Restore de backup con semántica clara

- **Problema:** `importBackup` salta tablas vacías, así que un restore no borra los datos
  actuales de esas tablas. `parseBackup` no valida versión.
- **Cambio:**
  1. `BackupFile` agrega `schemaVersion: number`.
  2. `importBackup(backup, { mode })` con `mode: 'replace' | 'merge'`; **default
     `replace`**: limpiar todas las tablas y cargar, incluso las vacías.
  3. `parseBackup` valida `app`, `version`, `tables` y rechaza versiones futuras
     desconocidas.
  4. La UI pide confirmación explícita: “Reemplazar todos los datos” vs “Combinar”.
- **Archivos:** `src/data/backup.ts`, `src/components/settings/DataSection.tsx`.
- **Tests:** backup con `bodyWeight: []` debe borrar los pesos actuales; backup con
  `version: 99` debe rechazarse; la transacción debe ser atómica.
- **Aceptación:** restore = estado exacto del backup.
- **Esfuerzo:** 1 día.

### P0-08 — Tests de regresión del bloque

- Crear `tests/unit/domain/regressionPR.test.ts` con los casos H1–H5.
- Crear `tests/unit/data/backup.test.ts` con H10.
- **Esfuerzo:** incluido en las tareas anteriores.

### P0-09 — Esquema listo para sync (D12)

- **Problema:** hoy los IDs son enteros locales y no hay `updatedAt`. Migrar eso después
  del release obliga a tocar datos de usuarios reales.
- **Cambio:**
  1. Agregar `updatedAt` (ISO) a todas las tablas sincronizables y `deletedAt` opcional
     para tombstones.
  2. Agregar un `uid` estable (ULID o UUID v7) por fila, además del id entero actual.
  3. Migración Dexie v17 que rellena `uid` y `updatedAt` en filas existentes.
  4. Los repositorios escriben `updatedAt` en cada `put`/`add`/`update`.
  5. No se implementa servidor ni merge todavía.
- **Archivos:** `src/data/repositories/dexie/db.ts`, `base.ts`, todos los repos,
  `src/domain/types.ts`.
- **Tests:** migración con una DB v16; cada fila tiene `uid` único y `updatedAt`;
  `bulkAdd`/`update` actualizan `updatedAt`.
- **Aceptación:** el esquema puede exportarse a un formato sync-ready sin cambiar la UI.
- **Riesgo:** migración grande. Gate: backup obligatorio antes de correrla.
- **Esfuerzo:** 2–3 días.

**Gate Fase 0:** `npm test` verde, `npm run build` limpio, los 6 tests nuevos fallaban
antes y pasan después.

---

## 6. Fase 1 — Contrato de datos (semana 2)

**Objetivo:** que cada métrica tenga una definición escrita y un oráculo numérico.
**Duración:** 6–8 días.

### P1-01 — `docs/DATA-CONTRACT.md`

Tabla obligatoria por métrica:

| Campo | Contenido |
|---|---|
| Métrica | Volumen, e1RM, PR, grasa, TDEE, etc. |
| Fórmula | Expresión exacta |
| Entradas | Series, peso, reps, RIR, altura, sexo, edad |
| Filtros | Warmups, series incompletas, cardio, asistidas |
| Redondeo | 0,1 / 0,5 / entero |
| Fuente | Literatura, decisión de producto o heurística |
| Pantallas | Dónde se muestra |
| Test | Archivo que lo cubre |

- **Esfuerzo:** 1 día.

### P1-02 — Oráculo numérico

- Crear `tests/unit/domain/numericOracle.test.ts` con valores calculados a mano, no
  capturados de la app.
- Casos mínimos:
  - 1RM: 100×10 en las 7 fórmulas (125,0–134,7); 100×5; 100×12; 60×8; 140×3.
  - Jackson-Pollock: un set de 3 y uno de 7 con suma conocida.
  - Navy: hombre y mujer con medidas conocidas.
  - Mifflin/TDEE: 80 kg, 180 cm, 30 años, hombre, moderado.
  - Agua: 80 kg, 60 min.
  - Discos: 100 / 102,5 / 101 / 180 / 62,5 kg.
  - Recuperación: 8 series → 0,632; +24 h → 0,393; +48 h → 0,221 (si se adopta el
    modelo de openGym) o el score actual de GymLab.
- **Aceptación:** si el código cambia una fórmula, el oráculo falla.
- **Esfuerzo:** 1–2 días.

### P1-03 — Un solo `buildWeeklyVolumeSeries`

- **Problema:** `domain/weeklyVolume.ts` rellena semanas con 0; `trainingStats.ts` no.
- **Cambio:** una sola función con opción `zeroFill: boolean`; eliminar la otra o
  convertirla en wrapper.
- **Tests:** mismos datos, mismo resultado; el gráfico de 5 semanas zero-fill y el de
  estadísticas sin relleno.
- **Esfuerzo:** 0,5 día.

### P1-04 — Una sola tabla de categorías de grasa

- **Problema:** Navy y Jackson-Pollock clasifican distinto en los bordes (17,5 % y 24,5 %).
- **Cambio:** `src/domain/bodyFatCategories.ts` con umbrales por sexo, usado por ambas.
- **Tests:** 17,5 / 24,5 / 31,5 % hombre y mujer.
- **Esfuerzo:** 0,5 día.

### P1-05 — Estándares de fuerza por sexo

- **Problema:** `MALE_STANDARDS` es la única tabla; el percentil se calcula igual para
  mujeres.
- **Cambio (elegir una):**
  - Agregar `FEMALE_STANDARDS` con la misma estructura.
  - O ocultar el percentil cuando `sex === 'female'` hasta tener datos.
- **Tests:** mismo e1RM y peso corporal, distinto sexo → distinto nivel.
- **Esfuerzo:** 1–2 días (depende de conseguir datos).

### P1-06 — Agua coherente con su fuente

- **Problema:** 0,5 L/30 min = 1,0 L/h, por encima del rango citado 0,4–0,8 L/h.
- **Cambio:** usar 0,5 L/h de ejercicio (o el midpoint 0,6 L/h) y actualizar comentario y
  copy.
- **Tests:** 80 kg + 60 min = 2,4 L base + 0,6 L = 3,0 L.
- **Esfuerzo:** 0,25 día.

### P1-07 — TDEE y pasos sin doble conteo

- **Problema:** `adjustTdeeForSteps` suma 0,04 kcal/paso a un TDEE que ya incluye factor
  de actividad.
- **Cambio:** sumar pasos solo si la actividad es `sedentario` o `ligero`, o agregar un
  toggle “incluir pasos en el gasto”. Mostrar el desglose.
- **Tests:** actividad `moderado` + 10.000 pasos no duplica.
- **Esfuerzo:** 0,5 día.

### P1-08 — Masa ósea con altura obligatoria

- **Problema:** `buildBodyCompSeries` usa 170 cm si falta altura; la fórmula cita blogs.
- **Cambio:** si no hay altura, no calcular hueso/músculo y mostrar “Falta altura”.
  Documentar la fórmula como estimación, no como medición.
- **Tests:** sin altura → `null`, no 170.
- **Esfuerzo:** 0,5 día.

### P1-09 — Peso corporal en volumen

- **Decisión D7.** Recomendado: no mezclar kg con reps. Agregar una métrica separada
  `bodyweightReps` y mostrarla en la sesión; no sumarla al volumen en kg.
- **Cambio:** `volumeByMuscleGroup` devuelve `loadVolume` y `repsVolume`; la UI elige.
- **Tests:** dominadas 3×10 → 30 reps, no 0 kg ni 0 volumen.
- **Esfuerzo:** 1 día.

### P1-10 — Fechas, DST y zona horaria

- **Problema:** las fechas de negocio son locales; los cálculos con `24 h` pueden fallar
  en cambios de hora.
- **Cambio:** tests de `toLocalDateStr`, `diffLocalDays`, `weekStartKey` en una zona con
  DST; usar `addLocalDays` en todos los cálculos.
- **Esfuerzo:** 0,5 día.

**Gate Fase 1:** `DATA-CONTRACT.md` completo, oráculo verde, todos los consumidores
alineados.

---

## 7. Fase 2 — Motor de fuerza v2 (semanas 3–6)

**Objetivo:** subir la calidad del motor sin copiar AGPL.
**Duración:** 12–18 días según alcance.
**Regla:** se implementa por partes; cada parte tiene test y se puede abandonar sin
romper lo anterior.

### P2-01 — 1RM multi-fórmula + confianza (D3)

- **Alcance final:** ensemble de **7 fórmulas** + confianza + cap, con una primera
  entrega de 2 fórmulas para validar el pipeline.
- **Cambio:**
  - `oneRepMax.ts` con `FORMULAS` (Epley, Brzycki, Lombardi, O’Conner, Mayhew, Wathan,
    Lander).
  - `estimateE1RM({ weightKg, reps, rir, formula })` con cap 12/15 y `null` fuera de
    rango.
  - `confidence(reps, rir, formula)` 0–1, con castigo por dispersión entre fórmulas.
  - `bestSetOf(sets)` y `e1rmSeries`.
  - Settings: elegir fórmula o ensemble.
- **Tests:** oráculo; confianza decrece con reps y con RIR; el ensemble no devuelve
  valores absurdos en 12 reps.
- **Esfuerzo:** 2–3 días (2 fórmulas); +3–4 días (7 fórmulas + confianza).

### P2-02 — Explicar cada sugerencia (`why[]`)

- **Problema:** los chips de sugerencia no explican la evidencia.
- **Cambio:** `DayProposal` y `SessionSuggestion` agregan `why: string[]` con claves i18n;
  la UI muestra un tooltip o una línea secundaria.
- **Ejemplo:** “Subí 2,5 kg porque completaste +2 reps en 3 sesiones al mismo peso”.
- **Tests:** cada propuesta tiene al menos una razón; no hay `why` vacío.
- **Esfuerzo:** 1–2 días.

### P2-03 — Deload con optimizador

- **Problema:** GymLab reduce −10 % fijo; openGym resuelve el mejor peso/reps.
- **Cambio:**
  1. `target1RM = epley(pesoActual, repsUpper) × factor`.
  2. Para cada reps en `[bottom..upper]`, `ideal = target1RM / (1 + reps/30)`.
  3. Elegir el peso de la grilla de discos más cercano, con desempate por reps y peso.
  4. Fallback: −10 % redondeado a 0,5 kg.
- **Tests:** 100 kg × 8, factor 0,9, discos 2,5 → resultado esperado calculado a mano.
- **Esfuerzo:** 2–3 días.

### P2-04 — Contador de stalls

- **Problema:** no hay noción de “sesiones fallidas consecutivas”.
- **Cambio:** `stallCount` por ejercicio; se resetea con cambio de peso, cambio de plan o
  sesión que supera el objetivo. Se usa para disparar deload.
- **Tests:** 3 sesiones fallidas → deload; cambio de peso → reset.
- **Esfuerzo:** 2 días.

### P2-05 — Políticas de progresión (opcional)

- **Alcance mínimo:** `linear` (actual) + `double` (doble progresión por reps).
- **Alcance completo:** `greyskull`, `triple`, `time`, bodyweight, asistidas.
- **Recomendación:** empezar por `double`; el resto solo si hay demanda.
- **Esfuerzo:** 2–3 días (mínimo); 6–8 días (completo).

### P2-06 — Fatiga por músculo (D4)

- **Fase A (sin RIR):**
  - 8 series efectivas = 1,0; tope 12 por músculo/sesión.
  - Vida media 24/30/48 h por músculo.
  - `v += sets/8 × 0.5^(Δt/halfLife)`; `fatigue = 1 − e^(−v)`.
  - Estados: `<0.25` listo, `0.25–0.5` recuperando, `>0.5` fatigado.
- **Fase B (con RIR):** peso de serie por RIR; gain agudo/crónico. Como D11 deja el RIR
  visible por defecto con estimación automática, la Fase B puede entrar en la misma ola.
- **Convivir:** el recovery score actual queda como “readiness”; la fatiga por músculo
  va al mapa corporal.
- **Tests:** 8 series → 0,632; 24 h con half-life 24 → 0,393; 48 h → 0,221.
- **Esfuerzo:** 4–6 días (A); +2–3 días (B).

### P2-07 — Discos con DP e inventario

- **Cambio:**
  - `sizesFor(unit)` con inventario por usuario.
  - `plateStack(target, inventory)`: greedy → DP → closest below + `missing`.
  - Granularidad 0,25 kg.
  - Barras: olímpica 20, EZ 10, Smith 9, trap 25 (o configurable).
- **Tests:** 100 / 102,5 / 101 / 180 / 62,5 kg; inventario incompleto.
- **Esfuerzo:** 2–3 días.

### P2-08 — Balance estructural (P2)

- **Alcance:** Poliquin primero; ATG después.
- **Cambio:** templates con ratios, normalización de peso corporal, asistidas y lastradas;
  nueva sección en Estadísticas.
- **Tests:** ejemplo trabajado 80 kg, RDL 60×8 → 67,9 % → débil.
- **Esfuerzo:** 3–4 días.

### P2-09 — Mancuernas: “cada una” vs “total”

- **Problema:** el volumen de mancuernas puede duplicarse o no según cómo registre el
  usuario.
- **Cambio:** `loadMode: 'each' | 'total'` por ejercicio; el volumen multiplica ×2 solo
  en `each`; la UI lo muestra.
- **Tests:** 2×20 kg × 10 “cada una” = 400 kg; “total” = 200 kg.
- **Esfuerzo:** 2 días.

### P2-10 — Prescripción completa de sesión (D10)

- **Problema:** hoy la app sugiere un peso, pero el usuario sigue armando la sesión.
- **Cambio:**
  1. `domain/prescription.ts` produce `SessionPrescription` por ejercicio:
     `sets`, `reps`, `weightKg`, `restSec`, `warmups[]`, `deload`, `plates`, `why[]`,
     `confidence`, `cappedByPR`.
  2. `activeWorkoutStore.prefill(prescription)` completa solo filas vacías.
  3. Modos `guided` / `suggest` / `manual` (ver §3.2).
  4. Ajuste global + override por ejercicio.
  5. Si no hay historial suficiente, la prescripción queda vacía y se muestra
     “Sin datos para prescribir”; no inventa.
- **Archivos:** nuevo `src/domain/prescription.ts`,
  `src/store/activeWorkoutStore.ts`, `src/hooks/useActiveSession.ts`,
  `src/components/workout/*`, `src/components/settings/SessionSection.tsx`,
  i18n es/en.
- **Tests:** guided precarga y no pisa lo escrito; suggest no precarga; manual no muestra
  chips; override por ejercicio; sin historial no inventa.
- **Esfuerzo:** 5–7 días.

### P2-11 — RIR visible con estimación automática (D11)

- **Problema:** el RIR está apagado por defecto, así que el motor de fatiga no tiene datos.
- **Cambio:**
  1. `showRpe`/`showRir` pasan a `true` por defecto.
  2. Si el usuario no carga RIR, se estima desde el ancla de 90 días:
     `maxReps = 30·(anchor/w − 1)`, `RIR = clamp(maxReps − reps, 0, 10)`.
  3. La UI marca el valor como “estimado” y permite corregirlo.
  4. Nunca bloquea la sesión ni el guardado.
- **Tests:** set sin RIR → estimación coherente; set con RIR → se respeta; el estimado se
  distingue del real.
- **Esfuerzo:** 2–3 días.

**Gate Fase 2:** cada subfase tiene su test de oráculo y su comparación antes/después con
un dataset conocido (`fake-data.json`).

---

## 8. Fase 3 — Integridad y portabilidad (semana 7)

**Duración:** 5–7 días.

### P3-01 — Versión de schema en backup

- `BackupFile.schemaVersion` y mapa de migraciones de backup.
- Rechazar backups más nuevos que la app; migrar los viejos.
- **Esfuerzo:** 1–2 días.

### P3-02 — Export CSV

- Workouts, series, peso corporal, medidas.
- Un archivo por entidad o un ZIP; documentar columnas.
- **Esfuerzo:** 1–2 días.

### P3-03 — Import FitNotes y Apple Health

- FitNotes: CSV con fecha, ejercicio, peso, reps.
- Apple Health: XML/ZIP de export; solo peso y pasos.
- **Esfuerzo:** 2–3 días.

### P3-04 — Idempotencia de import

- Clave de sesión = fecha + inicio + nombre; reimportar no duplica.
- **Esfuerzo:** 1 día.

### P3-05 — Fotos en backup

- Medir tamaño; excluir blobs por defecto o comprimir; documentar.
- **Esfuerzo:** 1 día.

### P3-06 — Auditoría de factory reset

- Verificar qué borra y qué conserva; test de “reset deja la app vacía pero funcional”.
- **Esfuerzo:** 0,5 día.

---

## 9. Fase 4 — Infraestructura de calidad (semana 8)

**Duración:** 3–5 días.

### P4-01 — CI en GitHub Actions

- Workflow `ci.yml`: `npm ci`, `npm run lint`, `npm test`, `npm run build`.
- Job e2e smoke con Playwright Python.
- Job Android: `npm run android:sync` + `gradlew assembleDebug` (sin firmar).
- Cache de npm y de Playwright.
- **Esfuerzo:** 1–2 días.

### P4-02 — Cobertura de dominio

- Umbral: 90 % líneas en `src/domain`.
- Reporte en CI, no bloqueante al principio; bloqueante al mes.
- **Esfuerzo:** 0,5 día.

### P4-03 — Golden tests numéricos

- Ejecutar el oráculo en CI y comparar contra un archivo de valores.
- **Esfuerzo:** 0,5 día.

### P4-04 — Convención de tests

- AAA, un assert principal, sin snapshots para matemática.
- Nombres `describe('métrica') > it('caso')`.
- **Esfuerzo:** 0,5 día.

### P4-05 — Performance budget

- Tamaño de bundle inicial, tiempo de carga del catálogo, memoria.
- **Esfuerzo:** 1 día.

---

## 10. Fase 5 — Producto y UX (semanas 9–10)

**Duración:** 5–8 días.

### P5-01 — Explicar sugerencias

- Chip + “por qué” (ver P2-02).
- **Esfuerzo:** incluido.

### P5-02 — Estados vacíos y parciales honestos

- Sin datos → “Sin datos”, no 0.
- Datos parciales → “Con 2 sesiones, la estimación es provisional”.
- **Esfuerzo:** 1–2 días.

### P5-03 — Incertidumbre en 1RM y proyecciones

- Mostrar rango o confianza; no prometer fechas.
- **Esfuerzo:** 1 día.

### P5-04 — Ajustes de esfuerzo y progresión

- RIR/RPE visibles; política por ejercicio; fórmula de 1RM.
- **Esfuerzo:** 1–2 días.

### P5-05 — Auditoría de accesibilidad

- Teclado, foco, aria en tabs/charts, contraste día/noche.
- **Esfuerzo:** 1–2 días.

### P5-06 — Paridad i18n

- Test que compara claves es/en; falla si falta una.
- **Esfuerzo:** 0,5 día.

---

## 11. Fase 6 — Privacidad y tienda (semanas 9–10)

**Duración:** 3–5 días.

### P6-01 — Telemetría opt-in (D6)

- `DEFAULT_SETTINGS.telemetry = false`.
- Pantalla de consentimiento explícito en onboarding y Ajustes.
- **Esfuerzo:** 1 día.

### P6-02 — Privacidad alineada con el código

- Revisar `legal/privacidad.html` y la pantalla de Privacidad: Sentry, PostHog, claves,
  retención, base legal.
- **Esfuerzo:** 1 día.

### P6-03 — PWA: decidir

- Si se publica en tiendas, seguir el plan del comentario de `vite.config.ts`:
  `selfDestroying: true` → release → quitar plugin → verificar caches.
- Si se mantiene la PWA para iOS, documentar el riesgo y no tocarla.
- **Esfuerzo:** 1 día.

### P6-04 — Play Store data safety

- Declarar datos recogidos, cifrado, borrado, telemetría.
- **Esfuerzo:** 0,5 día.

### P6-05 — Checklist de release

- Versión, firma, changelog, backup, migraciones, smoke test en emulador.
- **Esfuerzo:** 0,5 día.

---

## 12. Fase 7 — Estratégico (P3)

No ejecutar sin decisión explícita.

| Tarea | Qué implica | Costo | Recomendación |
|---|---|---|---|
| P7-01 Sync multi-dispositivo | Backend, auth, merge; el modelo de openGym es referencia, no copia | 4–8 semanas | Diseñar, no implementar todavía |
| P7-02 AI Coach | Backend, privacidad, costos, prompts | 4–6 semanas | No ahora |
| P7-03 MCP local | Servidor read-only sobre backup exportado | 1–2 semanas | Evaluar si hay usuarios técnicos |
| P7-04 Expandir catálogo | 873 → 2.000+ con media | semanas de contenido | No antes de corregir datos |
| P7-05 Más idiomas | 2 → 5/17 | 2–4 semanas | Después de tienda |

---

## 13. Roadmap de 12 semanas

| Semana | Ola | Foco | Entregable |
|---|---|---|---|
| 1 | **A** | Fase 0 | PR/e1RM/warmups/backup corregidos |
| 2 | **A** | Fase 1 | `DATA-CONTRACT.md` + oráculo + IDs/`updatedAt` |
| 3 | **A** | Fase 4 | CI + cobertura + golden tests |
| 4 | **A** | Fase 6 | telemetría opt-in + privacidad + Data Safety |
| 5 | **A** | Release candidate | APK firmado, smoke en emulador |
| 6–7 | **B** | Fase 2.1–2.3 | ensemble + confianza + `why[]` + deload |
| 8–9 | **B** | Fase 2.4–2.7 | stalls + fatiga + discos + RIR |
| 10 | **B** | Fase 2.8–2.11 | balance + mancuernas + prescripción + RIR UI |
| 11 | **B** | Fase 3 + 5 | backup versionado + CSV + UX honesta |
| 12 | **B** | Cierre | regresiones, performance, docs |
| Después | **C** | Fase 7 | sync multi-dispositivo |

**Supuesto:** un desarrollador con contexto, medio tiempo. Si es tiempo completo,
comprimir a 8–9 semanas; si son dos, 6–7.

---

## 14. Definición de terminado

Una tarea está terminada cuando:

1. Tiene un test que falla antes y pasa después.
2. `npm test` y `npm run build` están verdes.
3. El número cambió en la app con un dataset conocido y está documentado.
4. `CHANGELOG.md` tiene su entrada.
5. Si toca datos persistidos, hay migración y plan de rollback.
6. Si toca UI, hay revisión visual en 375 px y 768 px.
7. Si toca nativo o rutas, hay prueba en emulador.

---

## 15. Métricas de éxito

| Métrica | Hoy | Objetivo |
|---|---|---|
| Tests unit | 192 archivos / ~1.836 tests | +60 tests de cálculo |
| Cobertura `domain` | Sin medir | ≥ 90 % líneas |
| CI | No hay | 3 jobs verdes por PR |
| Fórmulas duplicadas | 2 `estimate1RM` | 1 |
| Métricas con warmups dispares | 6 | 0 |
| Constantes sin fuente | 20+ | ≤ 5 documentadas como heurística |
| Bugs H1–H10 | 10 abiertos | 0 |
| Tiempo de build | Medir | ≤ 60 s |
| Crash-free sessions | Sin medir | ≥ 99,5 % |

---

## 16. Riesgos del plan

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cambiar volumen histórico | Números viejos distintos | Migración v16 + backfill + CHANGELOG |
| Cambiar PR puede alterar logros | Chapas ya ganadas | No revocar logros; recalcular solo hacia adelante |
| Cap de 1RM oculta sets altos | Usuario ve “—” | Explicar “fuera de rango fiable” |
| Fatiga necesita RIR | Datos incompletos | Fase A sin RIR; fallback |
| AGPL | Contaminación de licencia | Reimplementar, nunca copiar |
| Scope creep | No se llega a tienda | Gate por fase; no abrir fase nueva sin cerrar la anterior |
| Migración Dexie falla | Pérdida de datos | Backup previo + transacción + test |

---

## 17. Qué NO hacer

- **No** copiar código de openGym (AGPL).
- **No** agregar features nuevas antes de cerrar H1–H4.
- **No** construir sync multi-dispositivo antes de tener backup/export sólido.
- **No** expandir el catálogo mientras el motor de PR tenga bugs.
- **No** rediseñar pantallas cuyos números están en discusión.
- **No** usar snapshots para matemática.
- **No** cambiar defaults de usuario existentes sin migración explícita.
- **No** prometer fechas de objetivos sobre tendencias negativas.

---

## 18. Primeros cinco pasos

1. **Crear rama** `fix/calculos-p0` desde `main`.
2. **Escribir los tests rojos** de H1 (warmup que genera PR), H2 (36 reps), H3 (dos
   `estimate1RM`) y H5 (PR con 0 reps).
3. **Implementar P0-01, P0-02, P0-03** en un solo commit pequeño.
4. **Correr** `npm test`, `npm run build` y el e2e de sesión.
5. **Atacar H4** (warmups en todas las métricas) con su helper `setFilters` y su
   migración v16; después seguir con H6, H7 y H10.

**Nota:** H4 no entra en el primer commit porque cambia números históricos y necesita
migración. H1–H3 y H5 son correcciones locales y verificables hoy.

---

### Cierre

El plan no es una lista de deseos: es una secuencia con gates. Si una fase no cierra, no
se abre la siguiente. La tentación va a ser saltar a la fatiga o al balance estructural
porque son más interesantes; el costo de hacerlo es seguir mostrando PRs y volúmenes que
no se pueden defender. Primero la verdad, después la profundidad.
