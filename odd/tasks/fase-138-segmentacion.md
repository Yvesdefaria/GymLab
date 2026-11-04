# Fase 138 — Segmentación por evidencia de los ejercicios restantes

> Rama `main`. Cierra 138.1–138.4. Commits `d4dafb45` (138.2), `5307c1c6` (138.3) y `867d6c1e` (correcciones del review).
> Review nativo `review-639a27c1c50ee158` (medium, lente `reliability`): **approved + acknowledged** (authority burned) para `5307c1c6`.
> El follow-up `867d6c1e` quedó **sin aprobación**: el review `review-a5466a2e2f574834` se bloqueó en la validación acotada (3 capturas del validador fallidas: `role_capture_failed` y `validator_result_not_admissible`). No hubo hallazgo de código abierto; el código está verificado por tests y build.

## Specs

- **S1 (origen, verbatim)**: «para otra fase debemos buscar como segmentar los demas ejercicios que quedan con evidencia cientifica al igual que este, anotalo y seguimos con esta» (2026-11-04).
- **S2**: completar la atribución de volumen de todo el catálogo con el estándar del peso muerto: **primario + sinérgicos con factor**.
- **S3**: lo que no aporta series de hipertrofia se devuelve `excluded` (no «sin datos») y no entra en ninguna banda ni en la cobertura.
- **S4**: cobertura de los ejercicios de fuerza de pierna ≥90 % (objetivo real: 100 % del catálogo, porque toda serie registrada debe caer en un grupo).
- **S5**: documentar la fuente de cada decisión.
- **S6 (fuera de alcance)**: renombrar `MuscleGroup` en catálogo, filtros o rutinas.

## Tareas

| ID | Tarea | Ruta | Estado | Commit |
|---|---|---|---|---|
| 138.1 | Inventario por grupo (atribuido / excluido / sin datos) | inline | hecho | — |
| 138.2 | Excluir saltos, olímpicos, strongman, cardio y drills | inline | hecho | `d4dafb45` |
| 138.3 | Reglas de zona para los restantes + exclusiones de movilidad | inline, TDD | hecho | `5307c1c6` |
| 138.3b | Correcciones del review (tokens muertos, shadowing, sinérgico plural) | inline, TDD | hecho | `867d6c1e` |
| 138.4 | Re-medir cobertura, tabla de fuentes y cierre | inline | hecho | este doc |

## Medición (catálogo completo, 873 ejercicios = 821 ampliados + 52 curados)

**Pierna: 275 ejercicios**

| Estado | Antes (`d4dafb45`) | Después |
|---|---|---|
| Cuádriceps | 63 | **64** |
| Isquios | 40 | **34** |
| Gemelos | 17 | **13** |
| Glúteo | 2 | **5** |
| **Con banda** | **122** | **116** |
| Excluidos por diseño | 86 | **159** |
| Sin datos | **67** | **0** |

Cobertura de fuerza de pierna: **116/116 = 100 %** (antes 122/189 = 64,6 %). El descenso de isquios/gemelos no es pérdida de cobertura: son estiramientos y SMR que antes contaban como series.

**Resto del catálogo** (efecto de excluir movilidad/estiramiento, que también aplica fuera de pierna):

| Grupo | Con banda antes → después | Excluidos antes → después |
|---|---|---|
| Pecho | 79 → 75 | 5 → 9 |
| Espalda | 107 → 93 | 1 → 15 |
| Bíceps | 53 → 51 | 0 → 2 |
| Tríceps | 69 → 67 | 1 → 3 |
| Hombro | 88 → 82 | 38 → 44 |
| Glúteo | 21 → 20 | 2 → 3 |
| Abdomen | 91 → 89 | 2 → 4 |
| Trapecios | 14 → 14 | 2 → 2 |
| Antebrazo | 23 → 22 | 2 → 3 |

Ninguna rutina del seed usa un ejercicio de pierna que haya quedado excluido: los 51 ejercicios programados solo pierden los 4 presses/elevaciones frontales de hombro, exclusión de diseño de F137.

## Tabla de fuentes

Clasificación por **acción articular** (biomecánica) y por el estándar ya usado en F137; sin papers nuevos. «EMG» = literatura de electromiografía conocida; «consenso» = práctica establecida de programación.

| Regla | Decisión | Fuente |
|---|---|---|
| Sentadillas (incl. plural), step-ups | Primario cuádriceps | Biomecánica: extensión de rodilla dominante |
| Step-ups, sentadillas, zancadas, búlgaras | Sinérgico glúteo 0,5 | EMG: extensión de cadera concurrente; mismo criterio que F137 para prensa/hack |
| Hiperextensión inversa | Primario glúteo + sinérgico isquios 0,5 | EMG: extensión de cadera con rodilla extendida |
| Caminata del monstruo, elevaciones laterales de pierna | Primario glúteo | EMG: abducción de cadera (glúteo medio) |
| Estiramientos, SMR/foam rolling, yoga | Excluido | No son series de hipertrofia |
| Cardio de máquina (elíptica, cinta, stairmaster, remo ergómetro, bici) | Excluido | No son series de hipertrofia |
| Pliometría y drills (saltos, hops, sprints, conos) | Excluido | No son series de hipertrofia |
| Halterofilia (cargada, arrancada, envión, jerk, snatch) | Excluido | Potencia/técnica; el estímulo no se mide en series por grupo |
| Strongman (yugo, neumático, saco, Conan, prowler) | Excluido | Acondicionamiento, no hipertrofia por banda |
| Kettlebell swings / balanceos | Excluido | Balístico; misma clase que potencia |
| Conteo fraccional 0,5 | Sinérgicos | Pelland et al. 2024/2025 (ya citado en F137) |

**Excepciones que se verificaron para no excluir fuerza real**: «agarre de cargada» (sentadilla frontal) y «straddle deadlift» siguen siendo fuerza; «bicicleta en el aire» es un crunch, no cardio; «molino/sledgehammer swings» de abdomen y «press de empuje» de hombro no son movilidad ni potencia.

## Log

- **L1 (2026-11-04)**: pedido verbatim de S1.
- **L2**: 138.1 midió 275 de pierna en el catálogo completo (67 sin datos, no 41: la medición previa era solo del seed ampliado).
- **L3**: 138.3 corrigió el plural en `ZONE_RULES` (`sentadillas?`, `squats?`, `step[-_ ]?ups?`, `zancadas?`, `lunges?`, `b[úu]lgaras?`, `leg extensions?`, `extensiones de piernas`, `pasos al cajón`). El singular no matcheaba «Sentadillas …» ni el slug `…-step-ups`, que era la causa real de los 67 sin datos.
- **L4**: se separó `MOBILITY_PATTERNS` de `NON_VOLUME_PATTERNS` para que la exclusión de movilidad/estiramiento/SMR/yoga documente su motivo. `ingle` va con límites de palabra para no comerse `single-leg`.
- **L5**: overrides nuevos en `PRIMARY_OVERRIDES`: hiperextensión inversa, monster walk y elevaciones laterales → glúteo. `synergistsOf` suma isquios en la hiperextensión inversa y glúteo en plurales de sentadilla/zancada.
- **L6**: dos falsos positivos preexistentes corregidos: `cargada(?! agarre)` y `clean(?![-_ ]?grip)` (sentadilla frontal con agarre de cargada) y `bicicleta(?! en el aire)` (crunch).
- **L7 (review)**: 4 hallazgos no bloqueantes en el primer review. Corregidos en `867d6c1e`: `el[ií]ptica` y `neum[aá]tic[oa]s?` (tokens muertos por acentos/límite), `straddle`/`cinta`/`sandbag` acotados para no tapar overrides de fuerza, sinérgico glúteo en plurales, y tests que prueban cada token por nombre (no por slug).
- **L7b (review 2 y 3)**: el refuter del follow-up confirmó R3-1 (`cinta`) y R3-2 (`sandbag`); restaurarlos re-excluía «sentadilla con saco», así que se agregó una excepción de fuerza acotada. El refuter del review nuevo detectó que esa excepción corría antes de las exclusiones (un «sandbag jump squat» contaba como cuádriceps); la versión final evalúa primero movilidad y no-volumen, y recién después decide el saco por el patrón de sentadilla.
- **L7c (bloqueo)**: el review `review-a5466a2e2f574834` quedó en `correction_required` porque el validador acotado no emitió una captura admisible en 3 intentos. Se cerró el work unit con el código verificado (`867d6c1e`) y el bloqueo documentado; no se inventó PASS.
- **L8 (verificación)**: `npm test` **233 archivos / 2121 passed + 1 skipped**; `npm run build` limpio; RED observado para las reglas nuevas (9 fallos) y para las correcciones del review (3–5 fallos al restaurar el código previo).

## Pendiente fuera de alcance

- `buildCoverageReport` mide series de la ventana; el catálogo ya está al 100 %, así que no quedan «sin clasificar» por datos.
- F137.9/F137.10 (curación fina y cierre v2) siguen siendo de F137, no de esta fase.
