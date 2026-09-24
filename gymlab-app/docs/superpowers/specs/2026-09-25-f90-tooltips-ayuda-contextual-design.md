# F90 — Tooltips de ayuda contextual: catálogo central, InfoTip accesible, estadísticas y RIR/RPE

- **Fecha:** 2026-09-25
- **Estado:** Diseño aprobado por el usuario (secciones 1 y 2, + añadido RIR/RPE); pendiente revisión del spec antes de writing-plans
- **Origen:** PLAN.md Fase 90 (reencuadre de la exploración SDD 2026-09-15) · 90.3 y el fix de copy de 90.4 ya entregados (`1b26abc`) · Añadido del usuario (2026-09-25): información para RIR y RPE
- **Worktree:** directorio normal (`gymlab-app`), rama `main`, sin aislamiento (default del repo)

## Contexto (diagnóstico verificado 2026-09-25)

F90 quedó a medias: 90.3 (tip del Recovery Score con rangos reales) y el fix de copy del deload (40–50% → 10%) están entregados en `1b26abc`, pero sus checkboxes en PLAN.md siguen sin tildar. Falta:

- **90.1** — `InfoTip` (`src/components/ui/InfoTip.tsx`, 89 líneas) existe y se usa en 6 archivos, pero le falta: trigger táctil (hoy 24 px, `InfoTip.tsx:73` `size-6`), botón de cerrar, manejo de foco, y copy por id con catálogo central (hoy `label` + children inline).
- **90.2** — las estadísticas no tienen ninguna ayuda contextual: el único texto explicativo es `stats.cargasPie` (`LoadRangeChart.tsx:83`). El punto dorado (PR) no se explica en ningún lado; los umbrales de `RatiosChart` tampoco; 7 cards con `actions` ocupado por sliders/selects.

Hallazgos del mapeo (exploración 2026-09-25):

- `/estadisticas` tiene 4 tabs (Entreno, Cuerpo, Fuerza, Periodización) y ~20 cards/gráficos en total.
- `ChartCard` (`src/components/stats/ChartCard.tsx:4-11`) acepta `subtitle` hoy casi sin uso; su slot `actions` está ocupado en 7 cards.
- Tips existentes (7 fijos + 1 dinámico): `RecoveryScoreCard.tsx:125`, `DeloadCard.tsx:88`, `InsightCard.tsx:27,50,72`, `GrasaCorporalPage.tsx:147`, `MedidasCorporalesPage.tsx:113`, y `MeasurementField.tsx:42` (dinámico, guías por zona/pliegue).
- RIR/RPE aparecen en sesión (`ExerciseBlock.tsx:289-294` cabecera de columnas; `SetRow.tsx:206-236` inputs) y en Ajustes (`SessionSection.tsx:102-103` toggles).
- El repo NO tiene jsdom ni testing-library: el comportamiento de UI se verifica con Playwright (Python) e2e; los unit tests son de lógica pura.
- `en/index.ts` está tipado como `EsSchema` → la paridad es/en de claves i18n la exige el compilador.

## Decisiones aprobadas (usuario, 2026-09-25)

1. **Cobertura 90.2**: solo métricas no obvias (~8), no todas las cards de stats.
2. **Catálogo**: registro tipado por id + claves i18n en namespace `help.*`; migrar los tips fijos existentes.
3. **Añadido del usuario**: información (tips) para RIR y RPE.
4. **Entrega**: 90.1 + 90.2 en una pasada, commits separados.

## Diseño

### 1. Catálogo central

- **`src/i18n/locales/es/help.ts`** + **`src/i18n/locales/en/help.ts`** (nuevos): namespace `help` con `{ <id>: { label, body } }`; se mergean en los índices de locales. `en` tipado `EsSchema` → id sin traducción no compila.
- **`src/i18n/help.ts`** (nuevo): registro tipado.
  - `HELP_IDS` (array), `HelpId` (union), `HELP: Record<HelpId, { label: I18nKey; body: I18nKey }>`.
  - Un id sin claves i18n reales no compila (`I18nKey` = `ParseKeys`); F101 puede iterar `HELP_IDS`.

**Ids migrados** (los textos se mueven, no se duplican; las claves viejas se eliminan):

| id | Claves de origen | Dónde se usa |
|---|---|---|
| `recovery` | `home.recovery.tipLabel/tipCuerpo` (core.ts:500-502) | RecoveryScoreCard (home) |
| `deload` | `home.deloadTipLabel/deloadTipCuerpo` (core.ts:480-481) | DeloadCard (Perfil) |
| `insightAlza` | `insights.alzaTipLabel/alzaTipCuerpo` (features.ts:21-22) | InsightCard |
| `insightDescenso` | `insights.descensoTipLabel/descensoTipCuerpo` (features.ts:25-26) | InsightCard |
| `insightEstable` | `insights.estableTipLabel/estableTipCuerpo` (features.ts:29-30) | InsightCard |
| `grasa` | `grasa.comoSeCalcula/comoSeCalculaDesc` (core.ts:405-406) | GrasaCorporalPage + SkinfoldChart (stats) |
| `medidasCorporales` | `cuerpo.medidas.infoTipLabel/infoTipCuerpo` (core.ts:322-323) | MedidasCorporalesPage |

**Ids nuevos de estadísticas** (90.2):

| id | Cards | Fuente de verdad a verificar (regla de copy) |
|---|---|---|
| `volumen` | VolumeChart + VolumeRangeChart | `domain/trainingStats.ts` (`buildWeeklyVolumeSeries`), `domain/volume.ts` |
| `volumenMuscular` | VolumeByMuscleChart + VolumeByMuscleDonut | `volumeByMuscleGroup` (trainingStats) |
| `carga` | LoadRangeChart | `buildLoadRangeSeries` (trainingStats) |
| `e1rm` | E1rmChart | `domain/e1rm.ts` (`buildE1rmSeries`) |
| `frecuencia` | MuscleFrequencyView | `domain/muscleFrequency.ts` |
| `pushPull` | PushPullBalanceView | `domain/pushPullBalance.ts` |
| `imc` | ImcChart | `domain/calculators/bodyComposition.ts` (`buildImcSeries`) |
| `ratios` | RatiosChart | `buildRatiosSeries` (umbrales: interpolar constantes si existen; si son literales, exportarlas) |

**Ids nuevos de sesión** (añadido RIR/RPE):

| id | Dónde | Notas |
|---|---|---|
| `rpe` | Cabecera de columnas de `ExerciseBlock` + toggle de Ajustes | Rango efectivo 4–10 (`SetRow.tsx:211`); explicar escala |
| `rir` | Ídem | Rango efectivo 0–6 (`SetRow.tsx:224`); explicar reserva y relación con RPE (verificar contra las escalas del código) |

### 2. InfoTip (90.1)

- **API nueva**: `id: HelpId` + `values?: Record<string, string | number>` (interpolación); resuelve `HELP[id]` y hace `t(label)` / `t(body, values)`.
- **Vía legada** `label` + children: queda SOLO para `MeasurementField` (guías dinámicas por zona/pliegue: label interpolado + texto de dominio en español, ver `domain/bodyMeasurements.ts:19-138`). No migrar: no aporta y ensuciaría el catálogo.
- **Comportamiento**:
  - Área táctil ≥44×44 px sin agrandar el círculo visual (mismo footprint de layout: pseudo-elemento o márgenes negativos). E2e verifica que los controles vecinos no pierden taps.
  - Foco: al abrir va al botón de cerrar; al cerrar con Escape o con la X vuelve al trigger; el cierre por tap afuera o scroll NO roba foco.
  - Botón de cerrar (X) dentro del popover, área 44 px, `aria-label` reusando `layout.confirm.close`.
  - Aria: trigger con `aria-expanded` + `aria-controls`; popover `role="dialog"` con `aria-label` del catálogo; id del popover vía `useId`.
  - Se conserva: cierre por pointerdown afuera y Escape (vía `useCloseOnEscape`), reposicionamiento en scroll/resize.
- **Función pura extraída**: `computePopoverPos(anchor, viewport, popover)` → `{ top, left, maxHeight }` en `src/components/ui/popoverPosition.ts`; unit-testeable (flip horizontal/vertical, clamp a bordes, viewport 320×568).
- **Tests unit nuevos**: `computePopoverPos` + integridad del catálogo (cada id de `HELP_IDS` resuelve label/body no vacíos en es y en).

### 3. Estadísticas (90.2)

- **`ChartCard` gana `help?: HelpId`** (opcional) → renderiza `<InfoTip id={help} />` junto al título (fila del `<h3>`), conviviendo con el slot `actions` ocupado.
- **Cards sin `ChartCard`** (VolumeChart, MuscleFrequencyView, PushPullBalanceView): `<InfoTip>` manual junto al encabezado.
- **Leyenda mini `● PR`** en los 2 gráficos con punto dorado (`LoadRangeChart`, `E1rmChart`) — hoy el marcador no se explica. Reusar clave i18n existente de "PR" si aplica.
- Las ayudas de stats NO reemplazan subtítulos ni footers existentes (p. ej. `stats.cargasPie` se conserva).

### 4. RIR/RPE (sesión y Ajustes)

- **`ExerciseBlock.tsx:289-294`**: `?` junto a cada label de columna (`RPE ?`, `RIR ?`), solo cuando su toggle está activo. Cuidado con la expansión de hit-area entre labels vecinos (no deben solaparse).
- **`SessionSection.tsx:102-103`**: `Toggle` de `SettingsUI` gana prop opcional `help?: HelpId` → `?` junto al label; se usa en los toggles de RPE y RIR.
- Fuera: la vista read-only de sesión guardada (`WorkoutExerciseBlock`) no lleva `?`.

### 5. i18n

- Nuevas claves: `help.<id>.label` y `help.<id>.body` para los 17 ids (es/en).
- Claves movidas (se eliminan de `core.ts`/`features.ts`): las 7 filas de la tabla de migrados. `cuerpo.medidas.comoMedir` y `grasa.comoMedir` NO se mueven (las usa `MeasurementField`).

### 6. Regla de copy (obligatoria)

- Todo número que aparezca en un `body` se **interpola desde constantes del dominio** cuando existan (precedente: el deload decía 40–50% y el código recorta 10%).
- Cada id nuevo se verifica contra su archivo de dominio antes de escribir el texto (tabla de arriba). Si el umbral es un literal no exportado, se exporta como constante (cambio de dominio mínimo + test si aplica).
- Copy en es-ES (tuteo, como el resto de la app) + traducción en.

## Paquetes de trabajo (4 — un commit cada uno)

### T1 — 90.1: catálogo + InfoTip accesible + migración

- `help.ts` (es/en) + registro + InfoTip (API, 44 px, foco, X, aria) + `computePopoverPos` + migración de los 7 tips fijos + unit tests.
- e2e: comportamiento de InfoTip con el tip migrado de recovery (home): abrir/cerrar (X, Escape, tap afuera), foco, viewports 375×812 y 320×568.

### T2 — 90.2: ayudas de estadísticas

- `ChartCard.help` + placements (tabla) + leyenda `● PR` + copy verificado contra dominio + e2e de 2-3 tips representativos (p. ej. `imc` en tab Cuerpo, `carga`/`volumen` en tab Entreno).

### T3 — RIR/RPE

- `ExerciseBlock` + `Toggle.help` + `SessionSection` + copy + e2e (sesión con toggles activos y Ajustes).

### T4 — docs de cierre

- PLAN.md: tildar 90.1–90.4, agregar 90.6 (RIR/RPE, añadido 2026-09-25) tildado; CHANGELOG.md con las entradas.
- Commit `docs: cierre de F90 (PLAN + CHANGELOG)`.

## Verificación (regla del repo, por tarea)

1. `npm run build` (typecheck REAL: `tsc -b`; nunca `npx tsc --noEmit`).
2. `npm test` (vitest) + `npm run lint`.
3. e2e: `python tests/e2e/scripts/with_server.py tests/e2e/test_f90.py` (se crea el de la fase).
4. Review cycle Gentle AI antes de cada commit (candidato = diff del workspace). Commit sin push.
5. **Emulador NO hace falta**: no hay cambios nativos ni de router (ni `vite.config.ts`).

## Riesgos

- **Saturación de `?` en sesión** (uno por bloque × 2): mitigado porque solo aparecen con los toggles activos; si molesta, se puede quitar la repetición por bloque (seguimiento post-entrega).
- **Dual API en InfoTip** (id + legado para MeasurementField): deuda menor documentada; el catálogo sigue siendo la vía principal.
- **Divergencia de copy numérico**: mitigada con interpolación desde dominio + revisión por tarea.
- **e2e de foco** puede ser más frágil en headless: usar esperas robustas (patrón ya usado en el repo).
- **Hit-area 44 px** puede robar taps de vecinos: e2e lo cubre explícitamente.

## Mejoras futuras (sugeridas, fuera de alcance)

1. Diferenciar los títulos de VolumeByMuscleChart y VolumeByMuscleDonut (hoy comparten `stats.volumenMuscular`).
2. Selector de ejercicio en LoadRangeChart (hoy grafica el primero con peso).
3. Reutilizar los ids `imc`, `grasa`, etc. en calculadoras y fichas de ejercicio.
4. Migrar las guías de `MeasurementField` a i18n + catálogo (requiere traducir los textos de dominio, hoy es-only).
5. Reutilizar `Toggle.help` en otras secciones de Ajustes.

## Fuera de alcance

- Tour/onboarding guiado (F101) y persistencia "ya visto" (90.5, descartado).
- Tooltips en Periodización, home (salvo lo ya entregado), calculadoras y fichas.
- Rediseños de layout de estadísticas.
