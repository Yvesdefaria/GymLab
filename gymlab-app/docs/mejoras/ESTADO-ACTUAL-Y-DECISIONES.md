# GymLab — Estado, decisiones e implementación

> **Qué es este documento.** Registro único y detallado de la sesión del **2026-10-26**:
> las decisiones cerradas con el usuario, el modelo de convivencia entre datos y
> prescripción, el primer corte de correcciones implementado, la evidencia de verificación
> y lo que queda. Es autónomo: no hace falta leer los otros documentos para entenderlo.
>
> **Documentos hermanos.**
> - `docs/ARQUITECTURA-Y-CALCULOS.md` — radiografía técnica y auditoría H1–H17.
> - `docs/GYMLAB-VS-OPENGYM.md` — comparación con openGym.
> - `docs/PLAN-MEJORAS.md` — plan de 8 fases con tareas `P0-01`…`P7-05`.
>
> **Estado del árbol.** Los cambios de código están en el workspace, **sin commitear**.
> 12 archivos modificados, 158 inserciones, 31 eliminaciones. La suite completa pasa:
> **202 archivos / 1889 tests**. `npm run build` termina con **exit 0**.

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Decisiones cerradas](#2-decisiones-cerradas)
3. [Modelo de convivencia: datos vs prescripción](#3-modelo-de-convivencia-datos-vs-prescripción)
4. [Implementación P0](#4-implementación-p0)
5. [Evidencia de verificación](#5-evidencia-de-verificación)
6. [Lo que falta](#6-lo-que-falta)
7. [Comparación con openGym](#7-comparación-con-opengym)
8. [Roadmap A → B → C](#8-roadmap-a--b--c)
9. [Riesgos y decisiones pendientes](#9-riesgos-y-decisiones-pendientes)
10. [Próximos pasos](#10-próximos-pasos)
11. [Apéndice](#11-apéndice)

---

## 1. Resumen ejecutivo

GymLab tiene una base sólida: dominio puro, repositorios detrás de interfaces, i18n
tipado, 873 ejercicios, 68 rutinas, 36 guías y una suite de 1889 tests. El problema no es
la arquitectura: es que **algunos números visibles podían mentir**.

En esta sesión se cerraron trece decisiones de producto y se corrigió el bloque más
peligroso:

- Un calentamiento podía generar un PR.
- Brzycki aceptaba 36 reps y devolvía `peso × 36`.
- Había dos implementaciones distintas de `estimate1RM`; el benchmark podía guardar
  `Infinity` o un número negativo.
- Los promedios de e1RM se diluían con sets fuera de rango.

Las cuatro correcciones están implementadas y verificadas. La quinta (warmups en todas
las métricas, H4) queda para el siguiente corte porque cambia números históricos y
necesita migración.

La dirección acordada es **A → B → C**:

1. **A**: tienda Android con datos correctos.
2. **B**: motor de precisión y guía (ensemble, fatiga, deload, prescripción completa).
3. **C**: sync multi-dispositivo.

---

## 2. Decisiones cerradas

### 2.1 Decisiones de producto

| ID | Decisión final |
|---|---|
| **D1** | Las tres olas, en orden **A → B → C** |
| **D2** | Warmups **fuera de todas** las métricas de entrenamiento |
| **D3** | Precisión máxima: ensemble + confianza + RIR automático + precarga editable + explicación |
| **D4** | Readiness + fatiga por músculo **sin RIR** primero; modelo completo después |
| **D5** | Backup/export ahora; sync multi-dispositivo al final |
| **D6** | Telemetría **opt-in**, default **OFF**, un solo toggle maestro |
| **D7** | Peso corporal = métrica separada de reps; no se mezcla con kg |
| **D8** | Pulir los 873 ejercicios y las guías antes de expandir el catálogo |
| **D9** | Android primero (Play Store); iOS después |
| **D10** | Prescripción de **sesión completa**, editable, con modos para desactivarla |
| **D11** | RIR/RPE **visibles por defecto**, con estimación automática; nunca bloquean |
| **D12** | IDs estables y `updatedAt` **antes** del release |
| **D13** | Contenido: calidad antes que cantidad |

### 2.2 Rondas de grilling

| Pregunta | Respuesta | Recomendación aplicada |
|---|---|---|
| **Q1** Objetivo 90 días | Las tres, empezando por A | A → B → C |
| **Q2** Warmups | (a) fuera de todo | `isWorkingSet` en todas las métricas |
| **Q3** 1RM | Precisión máxima + guía + cero cálculo manual | Ensemble + confianza + prescripción |
| **Q4** Telemetría | Lo más fácil para Google, pero activa | Opt-in con toggle maestro y consentimiento claro |
| **Q5** Automatización | Precarga editable | Modo guiado por defecto |
| **Q6** Fatiga | Readiness + fatiga por músculo sin RIR | Fase A sin RIR, Fase B después |
| **Q7** Sync | IDs estables ahora, servidor después | `uid` + `updatedAt` antes del release |
| **Q8** Peso corporal | Métrica separada de reps | `repsVolume` separado de `loadVolume` |
| **Q9** Telemetría | Un solo opt-in maestro | Default OFF |
| **Q10** Tienda | Android primero | Play Store, iOS después |
| **Q11** Guía | Sesión completa, con opción de desactivar | Modos `guided` / `suggest` / `manual` |
| **Q12** RIR | Visible por defecto + auto-estimación | `showRpe/showRir = true` en la nueva versión |

---

## 3. Modelo de convivencia: datos vs prescripción

### 3.1 Las dos capas

| Capa | Qué hace | ¿Se puede desactivar? | ¿Dónde vive? |
|---|---|---|---|
| **Datos** | PR, e1RM, volumen, fatiga, rachas, estadísticas | **No** | `src/domain/` + repositorios |
| **Prescripción** | Peso, reps, series, descanso, warmups, deload y discos para la próxima sesión | **Sí** | `src/domain/prescription.ts` + UI de sesión |

La regla es simple: **desactivar la prescripción no degrada los datos**. El usuario puede
apagar las sugerencias y la app sigue calculando PR, volumen, e1RM y fatiga con la misma
calidad.

### 3.2 Modos de prescripción

| Modo | Qué hace | Para quién |
|---|---|---|
| **Guiado** (default) | Precarga la sesión completa. Todo editable. Cada valor tiene `why[]` y `confidence` | Quien quiere que la app piense por él |
| **Sugerencias** | No precarga; muestra chips con la sugerencia y un botón “aplicar” | Quien quiere control pero acepta ayuda |
| **Manual** | No precarga y no muestra chips. Solo registra y calcula. “Repetir última sesión” sigue disponible | Quien no quiere que la app opine |

### 3.3 Flujo técnico

```
historial + rutina + ajustes
        ↓
domain/prescription.buildSessionPrescription()
        ↓
SessionPrescription {
  exercises: [{ exerciseId, sets, reps, weightKg, restSec, warmups[], plates, why[], confidence, cappedByPR }],
  source: 'history' | 'routine' | 'default',
  deload,
  generatedAt
}
        ↓
UI (guided)  → activeWorkoutStore.prefill(prescription) → filas editables
UI (suggest) → chips “aplicar”                          → filas editables
UI (manual)  → nada                                     → filas vacías
```

### 3.4 Reglas de borde

1. **Nunca auto-aplicación silenciosa.** El motor devuelve una prescripción; la UI la
   aplica como borrador. El usuario confirma o corrige.
2. **No pisar lo escrito.** `prefill` solo completa filas vacías o no completadas.
3. **Override por ejercicio.** `prescription: 'inherit' | 'off'`.
4. **Cambio en medio de la sesión.** Aplica a series nuevas; las ya cargadas no se tocan.
   Toast: “Las sugerencias quedan desactivadas; tus datos se siguen registrando”.
5. **Sin historial suficiente.** La prescripción queda vacía y se muestra “Sin datos para
   prescribir”. No inventa un peso.
6. **PR como techo.** Si el objetivo supera el PR, se recorta y se marca `cappedByPR`.
7. **RIR estimado.** Si falta, se calcula y se muestra como “estimado”; el usuario puede
   corregirlo.
8. **Deload.** La prescripción aplica el factor de deload y lo explica; no lo aplica en
   silencio.

### 3.5 Dónde se configura

- **Ajustes → Entrenamiento → Asistente de progresión**: `Guiado` / `Sugerencias` /
  `Manual`.
- **Por ejercicio** (en el detalle del ejercicio o en la rutina): `Heredar` / `Apagado`.
- **RIR/RPE**: visibles por defecto; se pueden ocultar en Ajustes → Series.

---

## 4. Implementación P0

### 4.1 Qué se corrigió

| ID | Problema | Corrección |
|---|---|---|
| **H1** | `detectPRsFromSets` no filtraba warmups; un calentamiento podía generar PR | Se agregó `!set.isWarmup` |
| **H2** | Brzycki a 36 reps devolvía `peso × 36`; a 37 devolvía 0 | Cap en **12 reps**; `estimate1RMValue` devuelve `null` |
| **H3** | Dos `estimate1RM`: PR con guarda, benchmark sin guarda | `benchmark.ts` delega en `prs.ts`; una sola fórmula |
| **H4** | Warmups inconsistentes entre volumen, e1RM, PR y comparador | **Pendiente** (siguiente corte): `setFilters` + migración v16 |
| **H5** | Un set con peso y 0 reps podía crear PR con e1RM 0 | `reps > 0` obligatorio |
| **H6** | Racha exige 3 sesiones; los planes de 2 días no pueden cumplirla | **Pendiente** |
| **H7** | Fatiga estima horas con `días × 24 + hora actual` | **Pendiente** |
| **H10** | `importBackup` no limpia tablas vacías | **Pendiente** |

### 4.2 Cambios por archivo

| Archivo | Cambio |
|---|---|
| `src/domain/prs.ts` | `MAX_E1RM_REPS = 12`; `estimate1RMValue`; `averageE1rm`; filtros de warmups/0 reps; `isPR` estricto |
| `src/domain/benchmark.ts` | Elimina su fórmula propia; delega en `prs.ts`; exporta `estimate1RMOrNull` |
| `src/data/repositories/dexie/benchmarkRepo.ts` | Rechaza un benchmark fuera de rango en vez de guardar `e1rm` 0 |
| `src/domain/setStats.ts` | `avgE1rmInRange` y `avgE1rmInGroupRange` usan `averageE1rm` |
| `src/domain/pastComparison.ts` | `avgE1rmWindow` usa `averageE1rm` |
| `src/domain/sessionComparison.ts` | `avgE1rm` usa `averageE1rm` |
| `src/domain/e1rm.ts` | Ignora estimaciones inválidas |
| `src/domain/prs.ts` | `bestPRFromSets` exige `reps > 0` |
| `vite.config.ts` | `testTimeout: 10_000` por la carga de la suite completa |
| `tests/unit/domain/prs.test.ts` | 9 casos nuevos |
| `tests/unit/domain/benchmark.test.ts` | 2 casos nuevos |
| `tests/unit/domain/setStats.test.ts` | 1 caso nuevo |
| `CHANGELOG.md` | Entrada `Fixed` bajo `[Unreleased]` |

### 4.3 Antes y después

| Caso | Antes | Ahora |
|---|---|---|
| `100 kg × 12` | 144,0 | **144,0** |
| `100 kg × 13` | 150,0 | **0 / null** |
| `100 kg × 20` | 211,8 | **0 / null** |
| `100 kg × 36` | **3600,0** | **0 / null** |
| `100 kg × 37` | 0 | **0 / null** |
| Warmup `40 × 20` (84,7) + trabajo `60 × 5` (67,5) | PR = 84,7 (warmup) | **PR = 67,5 (trabajo)** |
| Set `50 kg × 0 reps` sin PR previo | PR con e1RM 0 | **sin PR** |
| Benchmark `100 × 37` | `Infinity` | **rechazado** |
| Benchmark `100 × 38` | negativo | **rechazado** |
| Promedio con `100×5` + `20×20` | diluido por el set de 20 | **solo 112,5** |
| `isPR(100, 20, undefined)` | `true` | **`false`** |

### 4.4 Contrato de la API

```ts
// domain/prs.ts
export const MAX_E1RM_REPS = 12

// Núcleo: null cuando el set no permite estimar.
export const estimate1RMValue = (weightKg: number, reps: number): number | null

// Compatibilidad: 0 = sin estimación.
export const estimate1RM = (weightKg: number, reps: number): number

// Promedio que ignora sets sin estimación.
export const averageE1rm = (sets: WorkoutSet[]): number

// PR: solo series completadas, de trabajo, con peso y reps > 0, dentro del rango.
export const detectPRsFromSets = (
  sets: WorkoutSet[],
  existingPRs: Map<number, PRRecord>
): PRRecord[]
```

```ts
// domain/benchmark.ts
export const estimate1RM = estimate1RMFromPrs
export const estimate1RMOrNull = estimate1RMValue
```

```ts
// benchmarkRepo.add
const e1rm = estimate1RMOrNull(result.weightKg, result.reps)
if (e1rm === null) throw new Error('Benchmark fuera del rango fiable (1–12 reps)')
```

---

## 5. Evidencia de verificación

| Check | Comando | Resultado |
|---|---|---|
| Tests focales | `npx vitest run tests/unit/domain/prs.test.ts tests/unit/domain/benchmark.test.ts tests/unit/domain/setStats.test.ts` | **67/67** |
| Suite completa | `npm test` | **202 archivos / 1889 tests** |
| Build real | `npm run build` | **exit 0** |
| Review assess | `gentle-ai review assess --cwd . --agent opencode --json` | **medium**, `review_due: false` (`under_budget`) |
| Diff | `git diff --stat` | 12 archivos, 158 inserciones, 31 eliminaciones |

**Nota sobre el timeout:** la suite completa en paralelo hacía que
`tests/unit/pages/profilePages.test.tsx` superara los 5 s (tardaba ~9 s bajo carga; ~2,4 s
en aislamiento). Se subió `testTimeout` a 10 s en `vite.config.ts`. No se ocultó un fallo:
el test pasa en aislamiento y con el timeout anterior solo fallaba por carga.

---

## 6. Lo que falta

### 6.1 Inmediato (cerrar Fase 0)

| Tarea | Qué implica | Esfuerzo |
|---|---|---|
| **H4** | `setFilters.ts` + warmups fuera de volumen, e1RM charts, `recentAvgRpe` y comparador; migración v16 para `Workout.totalVolume` | 2–3 días |
| **H6** | Racha adaptada al plan (`min(3, daysPerWeek)`) o configurable | 1 día |
| **H7** | Fatiga con `startedAt` real, no `días × 24 + hora` | 0,5–1 día |
| **H10** | `importBackup` con `mode: replace/merge`, versión y validación | 1 día |
| **P0-09** | `uid` + `updatedAt` + migración v17 (sync-ready) | 2–3 días |

### 6.2 Después (Ola B)

- Ensemble de 7 fórmulas + confianza.
- `why[]` en cada sugerencia.
- Deload con optimizador.
- Stalls.
- Fatiga por músculo con RIR.
- Discos con DP e inventario.
- Prescripción completa (`guided`/`suggest`/`manual`).
- RIR visible + auto-estimación.

### 6.3 Después (Ola C)

- Sync multi-dispositivo.
- Backend y auth.
- Merge de conflictos.

---

## 7. Comparación con openGym

> Detalle completo en `docs/GYMLAB-VS-OPENGYM.md`. Acá va lo que importa para decidir.

| Dimensión | GymLab | openGym | Quién está más maduro |
|---|---|---|---|
| Producto | Local-first, consumo | Self-hosted, multi-usuario | Distintos |
| Sync | No | `_rev`/`_wid`/stamps/tombstones | openGym |
| 1RM | Brzycki + Epley (corregido) | 7 fórmulas + ensemble + confianza | openGym |
| Progresión | 1 motor observacional | 6 políticas prescriptivas | openGym |
| Fatiga | Readiness | Series efectivas + RIR + vida media | openGym |
| Discos | Greedy | Greedy + DP + inventario | openGym |
| Balance estructural | No | Poliquin/Thibaudeau/ATG | openGym |
| Calculadoras de salud | IMC, TDEE, macros, agua, Navy, JP, ratios | No tiene | GymLab |
| Nutrición/pasos/logros | Sí | No tiene | GymLab |
| Catálogo | 873 | 5.632 + 922 variantes | openGym |
| Tests | 202 archivos / 1889 tests | 446 archivos / 66k líneas | openGym |
| CI | No hay | 8 workflows + GitLab + SBOM | openGym |
| TypeScript | Sí, estricto | No | GymLab |

**Advertencia de licencia:** openGym es **AGPL-3.0**. Las ideas y fórmulas se estudian;
el código **no se copia** a un producto propietario. Todo lo que se adopte se reimplementa.

**Lo que GymLab debe tomar:** cap de reps, confianza, fatiga por músculo, deload con
optimizador, discos con DP, balance estructural, `why[]`, oráculo numérico y CI.

**Lo que openGym podría tomar de GymLab:** TypeScript, capas, calculadoras, nutrición,
pasos, logros y migraciones versionadas.

---

## 8. Roadmap A → B → C

| Semana | Ola | Foco | Entregable |
|---|---|---|---|
| 1 | **A** | Fase 0 | H1–H7 + H10 corregidos |
| 2 | **A** | Fase 1 | `DATA-CONTRACT.md` + oráculo + IDs/`updatedAt` |
| 3 | **A** | Fase 4 | CI + cobertura + golden tests |
| 4 | **A** | Fase 6 | Telemetría opt-in + privacidad + Data Safety |
| 5 | **A** | Release candidate | APK firmado + smoke en emulador |
| 6–7 | **B** | 1RM + `why[]` + deload | Motor de precisión |
| 8–9 | **B** | Stalls + fatiga + discos + RIR | Motor completo |
| 10 | **B** | Prescripción + balance + mancuernas | Sesión precargada |
| 11 | **B** | Backup + CSV + UX honesta | Cierre de datos |
| 12 | **B** | Regresiones + performance + docs | Cierre de ola |
| Después | **C** | Sync | Multi-dispositivo |

**Regla:** no se abre B hasta que A tenga release candidate. No se abre C hasta que B esté
estable. La excepción es la migración de IDs, que se hace en A.

---

## 9. Riesgos y decisiones pendientes

### 9.1 Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Cambiar volumen histórico (H4) | Números viejos distintos | Migración v16 + backup + CHANGELOG |
| Cambiar PR puede afectar logros | Chapas ya ganadas | No revocar; recalcular solo hacia adelante |
| Cap de 12 reps oculta sets altos | Usuario ve “—” | Explicar “fuera de rango fiable” |
| Fatiga sin RIR | Datos incompletos | Fase A sin RIR; RIR auto-estimado |
| AGPL | Contaminación de licencia | Reimplementar, nunca copiar |
| Scope creep | No se llega a tienda | Gate por fase |
| Migración Dexie | Pérdida de datos | Backup + transacción + test |

### 9.2 Decisiones que todavía necesitan confirmación

1. **H4: ¿el “total de sesión” se conserva como dato informativo o se elimina?**
   Recomendación: conservarlo, pero separado del volumen de entrenamiento.
2. **H6: ¿la racha se adapta al plan o se deja configurable?**
   Recomendación: `min(3, daysPerWeek)` automático, con opción manual.
3. **P0-09: ¿ULID o UUID v7?**
   Recomendación: UUID v7 (ordenable, estándar, sin dependencia).
4. **Prescripción: ¿el modo manual oculta también el “repetir última sesión”?**
   Recomendación: no; es una acción explícita del usuario, no una sugerencia.

---

## 10. Próximos pasos

### Corte actual (hecho)

- H1, H2, H3, H5 implementados.
- 12 tests nuevos.
- Suite y build verdes.
- Review assess: `medium`, `under_budget`.

### Siguiente corte (recomendado)

1. **H4** — `src/domain/setFilters.ts`:
   ```ts
   export const isWorkingSet = (s) =>
     s.completed && !s.isWarmup && s.weightKg > 0 && s.reps > 0
   ```
   Aplicarlo en `volumeByMuscleGroup`, `buildE1rmSeries`, `recentAvgRpe`,
   `sessionComparison` y `computeSessionStats`.
2. Migración Dexie **v16**: recalcular `Workout.totalVolume` desde `workoutSets`.
3. Test cruzado: misma sesión, mismo volumen en home, Estadísticas y comparador.
4. **H6**, **H7**, **H10**.
5. **P0-09**: `uid` + `updatedAt`.

### Antes de commitear

- Correr `npm test` y `npm run build`.
- Revisar el diff completo.
- Decidir si se commitea como work-unit `fix: corregir PR y 1RM...`.
- Si se commitea, hacerlo **sin push** y actualizar el CHANGELOG (ya está).

---

## 11. Apéndice

### 11.1 Archivos modificados

```
gymlab-app/CHANGELOG.md
gymlab-app/src/data/repositories/dexie/benchmarkRepo.ts
gymlab-app/src/domain/benchmark.ts
gymlab-app/src/domain/e1rm.ts
gymlab-app/src/domain/pastComparison.ts
gymlab-app/src/domain/prs.ts
gymlab-app/src/domain/sessionComparison.ts
gymlab-app/src/domain/setStats.ts
gymlab-app/tests/unit/domain/benchmark.test.ts
gymlab-app/tests/unit/domain/prs.test.ts
gymlab-app/tests/unit/domain/setStats.test.ts
gymlab-app/vite.config.ts
```

### 11.2 Comandos

```bash
cd gymlab-app

# Tests focales del corte
npx vitest run tests/unit/domain/prs.test.ts \
  tests/unit/domain/benchmark.test.ts \
  tests/unit/domain/setStats.test.ts

# Suite completa
npm test

# Typecheck real + build
npm run build

# Review (read-only)
gentle-ai review assess --cwd . --agent opencode --json
```

### 11.3 Glosario

| Término | Significado |
|---|---|
| **e1RM** | 1RM estimado a partir de peso y reps |
| **PR** | Récord personal por e1RM |
| **Warmup** | Serie de calentamiento; no cuenta para PR/volumen |
| **Working set** | Serie completada, sin warmup, con peso y reps > 0 |
| **Cap** | Límite de reps donde la fórmula sigue siendo defendible |
| **Readiness** | Score 0–100 de disposición (sueño, dolor, racha, pasos) |
| **Fatiga** | Estímulo acumulado por músculo, con vida media |
| **Deload** | Semana de descarga; reduce carga o volumen |
| **Stall** | Sesión fallida consecutiva que dispara deload |
| **Prescripción** | Propuesta de pesos/reps/series para la próxima sesión |
| **Guided** | Modo que precarga la sesión completa |
| **Suggest** | Modo que muestra chips, sin precargar |
| **Manual** | Modo sin sugerencias; solo registro y cálculo |

### 11.4 Fórmulas

```
Brzycki:      1RM = peso × 36 / (37 − reps), válido hasta 12 reps
Epley:        1RM = peso × (1 + reps / 30)
Volumen:      peso × reps
Promedio:     media de e1RM de sets válidos, ignorando fuera de rango
PR:           mejor e1RM de sets de trabajo completados
```

### 11.5 Registro de la sesión

- **Fecha:** 2026-10-26.
- **Rama:** `main`.
- **Estado:** cambios en workspace, sin commit.
- **Suite:** 202 archivos / 1889 tests.
- **Build:** exit 0.
- **Review:** medium / under_budget.
- **Siguiente:** H4 + migración v16.
