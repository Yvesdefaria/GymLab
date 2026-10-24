# Spec — Rediseño de «Cuerpo y progreso» (F132.5) con Nocturno Minimal

> Rama `132.5-cuerpo-progreso` (worktree `.worktrees/132.5-cuerpo-progreso`, multisesión pedida por el usuario).
> Referencia visual: `.superpowers/brainstorm/cuerpo-progreso-20261024/content/cuerpo-progreso-v1.html`
> (4 pantallas + estados vacíos).
> Diseño base: `gymlab-app/docs/design/NOCTURNO-MINIMAL.md` §1–§13 y `docs/design/README.md`.
> Doc de ejecución: `odd/tasks/cuerpo-progreso.md`.

## 1. Objetivo

Migrar las cuatro pantallas de **Cuerpo y progreso** al lenguaje Nocturno Minimal sin perder
funcionalidad ni datos: `/peso-corporal`, `/cuerpo`, `/progreso-fotos` y
`/progreso-fotos/comparar`. Cada pantalla debe tener **un solo héroe**, secciones con **hairline**
en vez de tarjetas, un solo acento semántico y estados vacíos honestos. El bloque se apoya en
`/cuerpo` como pantalla editorial y no crea una ruta hub nueva.

## 2. Decisiones cerradas (grilling 2026-10-24)

| # | Decisión | Respuesta aprobada |
|---|---|---|
| Q1 | Navegación del bloque | **A** — `/cuerpo` suma dos filas hairline al final («Peso corporal» y «Fotos de progreso»); no hay ruta hub nueva. |
| Q2 | Semántica del mapa | **A** — fatiga (recuperación), escala **neutro → dorado → rojo**. Verde queda reservado a meta/PR/cumplido. Se corrige la inversión actual (`sore` era verde). |
| Q3 | Registro de peso | **A** — inline debajo del héroe (input + «Guardar»), sin sheet. |
| Q4 | Héroe del peso | **A** — peso del último registro + delta del rango activo (30 d por defecto). Sin peso objetivo: la app no tiene ese campo. |
| Q5 | Alcance del rango | **A** — 30 d / 90 d / Todo filtra héroe, gráfica, fila de stats e historial. |
| Q6 | Héroe de fotos | **A** — última sesión de tres ángulos arriba; «Hoy» como fila de captura con tres slots. |
| Q7 | Comparador | **A** — se mantiene dividida/alternar; se suma el delta de peso entre A y B **solo si ambas fechas tienen registro**. |

## 3. Alcance

**Dentro:**

- `PesoCorporalPage`, `CuerpoPage`, `ProgressPhotosPage`, `ProgressPhotosComparePage` y sus rutas.
- `WeightHistoryTimeline`, `MuscleDummy` (redibujo + escala), `PhotoSourceSheet` (sin cambios de contrato).
- Nuevos componentes de presentación: `WeightHero`, `WeightEvolution`, `CuerpoSelected`,
  `CuerpoLinks`, `ProgressPhotosHero`, `ProgressPhotosCapture`, `ProgressPhotosTimeline`,
  `PhotoDateSheet`.
- `domain/bodyProgress.ts` (nuevo): resumen de peso por rango, delta entre fechas, conteo de fatiga,
  orden de fotos. `domain/muscleFatigue.ts` y `domain/muscleColors.ts` actualizados a la nueva escala.
- i18n es/en (incluye etiquetas de fatiga y nombres de músculo; hoy están hardcodeados en español).
- Tests unitarios, de componente y e2e; `f120DataSharing` debe seguir verde.
- `PLAN.md`, `CHANGELOG.md`, `docs/design/README.md` y `NOCTURNO-MINIMAL.md` (§18 nuevo).

**Fuera:**

- Peso objetivo, metas corporales o IMC como héroe (no hay campo de objetivo).
- Cuarta foto o ángulos nuevos; subida a la nube; cambios en el modelo de datos.
- Cambios en `/estadisticas` (la tab Cuerpo conserva `BodyWeightChart` y sus datos).
- Cambios en el maniquí 3D (`fatigueToColor` solo se alinea a la nueva escala).
- Nuevas paletas o tokens.

## 4. Composición

### 4.1 `/peso-corporal`

```text
HEADER  ‹  CUERPO / Peso corporal                 [scale]
rango   Último registro · hoy        30 d · 90 d · Todo
HÉROE   78.4 kg
         ↓ 1.8 kg en 30 d
hairline
REGISTRAR HOY      [ 78.4 kg ]  [ Guardar ]
hairline
EVOLUCIÓN                                    18 registros
gráfica de área 110 px (sin grilla, ejes mínimos de 3 marcas)
Mín. 30 d · Máx. 30 d · Cambio
hairline
HISTORIAL
24 oct   78.4 kg  hoy                     [borrar]
...
[ Ver más ]
```

- **Héroe (`WeightHero`)**: `StatsHero` con eyebrow «Último registro · {fecha}», valor en Oswald
  liviano y delta con signo. El delta se calcula contra el primer registro **del rango activo**; el
  texto se etiqueta con el rango («en 30 d», «en 90 d», «desde el inicio»).
- **Rango**: `RangePills` arriba del héroe, alineado a la derecha. Es el único control de rango de
  la página; no se repite en la gráfica.
- **Registro**: input `DecimalInput` vacío (nunca prellenado) con placeholder «Hoy: {peso}» o
  «Peso»; botón «Guardar»/«Actualizar». Upsert por fecha local (comportamiento actual).
- **Gráfica (`WeightEvolution`)**: `AnimatedAreaChart` de 110 px, sin `CartesianGrid`; `XAxis` e
  `YAxis` sin líneas ni ticks, con 3 marcas de fecha y 3 de peso como máximo. `aria-label` con
  rango, mínimo, máximo y último valor. Si el rango no tiene datos, muestra «Sin registros en este
  rango» sin inventar ceros.
- **Stats**: `StatsStatRow` de 3 columnas (Mín., Máx., Cambio) sobre el rango.
- **Historial**: `WeightHistoryTimeline` sin tarjeta, filas hairline de 46 px, paginación de 10 con
  «Ver más». Borrado con botón de 44 px y `aria-label` actual. Conserva «Historial» y «Ver más»
  (e2e F93 #5).
- **Vacío**: héroe «—», registro visible y `EmptyState` «Registrá tu peso a lo largo del tiempo…».
  Sin gráfica, stats ni historial.

### 4.2 `/cuerpo`

```text
HEADER  ‹  CUERPO / Cuerpo                          [info]
[ Frente | Espalda ]  (segmentado 44 px)
MAPA MUSCULAR (héroe visual 300 px)
leyenda: Recuperado · Activo · Fatigado · Muy reciente · Sin datos
resumen: 5 recuperados · 2 fatigados · 1 sin datos
hairline
SELECCIONADO
Pecho
Fatigado · último entreno hace 1 d
01 Press banca                          ›
02 Press inclinado                      ›
03 Aperturas en polea                   ›
Ver biblioteca →
hairline
MÁS DE CUERPO
Peso corporal                           ›
Fotos de progreso                       ›
```

- **Mapa (`MuscleDummy` redibujado)**: silueta humana reconocible (cabeza, torso, brazos, piernas),
  regiones musculares orgánicas por frente/espalda. Se conservan las props actuales
  (`fatigue`, `view`, `selected`, `onSelect`, `highlight`, `showLegend`) para no romper
  `ExerciseMuscleCard`.
- **Escala**: `fresh` = neutro; `warm` = dorado 28 %; `fatigued` = dorado 55 %; `sore` = rojo 35 %;
  sin dato = relleno base con borde. El grupo seleccionado se resalta en dorado claro (`gold-bright`),
  no en rojo. `fatigueColorClass` y `FATIGUE_HEAT_COLORS` se actualizan.
- **Leyenda**: 5 ítems, siempre con etiqueta (el color no es la única información). Texto i18n.
- **Resumen**: una línea derivada de `fatigueCounts`; si no hay entrenos, «Sin datos de fatiga».
- **Detalle**: nombre del músculo localizado (`localizeMuscleGroup`), estado de fatiga i18n + días
  desde el último entreno, hasta 5 ejercicios del grupo en filas hairline con link a
  `/ejercicios/:slug`. Sin selección: «Toca un músculo para ver detalle».
- **Vínculos**: dos filas de 48 px con icono, label y chevron hacia `/peso-corporal` y
  `/progreso-fotos`.
- **Info**: `InfoTip` o sheet breve que explica los umbrales (18 h / 48 h / 72 h). Sin nuevas rutas.
- **Datos**: `CuerpoPage` sigue leyendo `useAchievementsData()` y llamando
  `lastTrainedByMuscle(workouts, completedSets, exerciseMuscles)` en la página (invariante CB-1).

### 4.3 `/progreso-fotos`

```text
HEADER  ‹  CUERPO / Fotos de progreso        Comparar
ÚLTIMA SESIÓN                       24 oct 2026
[Frente 3:4] [Lateral 3:4] [Espalda 3:4]
3 ángulos · 12 fotos           5 fechas
hairline
HOY                                        capturar
[+ Frente] [+ Lateral] [+ Espalda]
hairline
HISTORIAL
24 oct 2026   3 fotos    [minis]           ›
10 oct 2026   3 fotos    [minis]           ›
[ Ver más ]
```

- **Héroe (`ProgressPhotosHero`)**: última fecha con sus tres ángulos en formato 3:4. Si falta un
  ángulo, placeholder «Sin foto». Meta: `N ángulos · N fotos` y `N fechas`.
- **Captura (`ProgressPhotosCapture`)**: tres slots de 44 px; si hoy ya tiene foto de un ángulo,
  muestra la miniatura y permite reemplazarla. Web: `input[type=file]` oculto (se conserva el
  primero para el e2e F106.1). Nativo: `PhotoSourceSheet`. `text=Frente` visible.
- **Timeline (`ProgressPhotosTimeline`)**: filas hairline de 64 px con fecha formateada, `N fotos`,
  tres miniaturas y chevron; abre `PhotoDateSheet`. Paginación 10 + «Ver más». Cada fila lleva
  `data-photo-date={localDate}` para el e2e.
- **Sheet (`PhotoDateSheet`)**: `BottomSheet` con fecha, tres fotos grandes (o placeholder), acción
  «Guardar en galería» (aria-label exacto), «Eliminar fecha» en danger y cierre. Escape/backdrop.
  El guardado descarga en web y usa la galería en nativo (lógica actual de `savePhotosToGallery`).
- **Vacío**: sin fotos, hero y timeline no se renderizan; slots visibles + `EmptyState` «Tu primera
  sesión» con CTA a capturar. Sin datos inventados.

### 4.4 `/progreso-fotos/comparar`

```text
HEADER  ‹  Fotos de progreso / Comparar
[A] 24 sep 2026                    hace 30 d   ›   (select nativo estilizado)
[B] 24 oct 2026                    hoy         ›
hairline
[ Frente | Lateral | Espalda ]       (44 px)
[ Dividida | Alternar ]              (44 px)
[ A · 24 sep ] [ B · 24 oct ]       (3:4 cada una)
Peso 80.5 → 78.4 kg                 −2.1 kg
```

- **Fechas**: se conservan los dos `<select>` nativos (accesibles y con e2e), pero se estilizan como
  filas hairline: chip A/B, fecha formateada visible, chevron y el select transparente encima.
  Opciones formateadas; `aria-label` «Fecha A»/«Fecha B».
- **Ángulo y modo**: botones de 44 px con `aria-pressed`; textos «Frente», «Lateral», «Espalda»,
  «Dividida», «Alternar».
- **Comparación**: dividida = dos fotos 3:4 con tag A/B y fecha; alternar = una foto con botón
  `aria-label="Alternar"` y badge «A · fecha» / «B · fecha» (formato conservado para e2e).
- **Delta de peso**: si A y B tienen `BodyWeightEntry`, una línea «Peso {A} → {B} kg · {delta}» en
  dorado; si falta una, no se renderiza. Datos de `useAchievementsData().bodyWeights`.
- **Vacío**: menos de 2 fechas → mensaje «Necesitas al menos 2 fechas con fotos para comparar» con
  el estilo de sección, sin controles muertos.

## 5. Dominio y datos

`src/domain/bodyProgress.ts` (puro, sin React/Dexie):

```ts
export type WeightSummary = {
  latest: BodyWeightEntry | null
  deltaKg: number | null
  minKg: number | null
  maxKg: number | null
  changeKg: number | null
  count: number
}
export const weightSummary = (entries: BodyWeightEntry[], range: StatsRange, now?: number): WeightSummary
export const weightDeltaBetween = (entries: BodyWeightEntry[], dateA: string, dateB: string): number | null
export type FatigueCounts = { fresh: number; warm: number; fatigued: number; sore: number; noData: number }
export const fatigueCounts = (fatigue: Partial<Record<MuscleGroup, FatigueLevel>>): FatigueCounts
export const sortPhotosByDateDesc = (photos: ProgressPhotoEntry[]): ProgressPhotoEntry[]
```

- `weightSummary` filtra por `inRange(localDate, range, now)`, ordena ascendente por fecha y usa el
  último como `latest`; `deltaKg`/`changeKg` = último − primero del rango (null con <2 registros).
- `weightDeltaBetween` devuelve `kgB − kgA` o `null` si falta una fecha.
- `fatigueCounts` recorre los 10 grupos de `MUSCLE_GROUP_LABELS_ES`; `noData` = sin nivel.
- `sortPhotosByDateDesc` ordena por `localDate` descendente (estable).

## 6. i18n, accesibilidad y temas

- Todas las cadenas nuevas en `es` y `en` (`core.ts` para peso/cuerpo, `features.ts` para fotos).
- Se elimina `fatigueLabel` hardcodeado de `domain/muscleFatigue.ts`; las etiquetas pasan a
  `cuerpo.fatiga.fresh|warm|fatigued|sore` + `cuerpo.fatiga.noData`.
- `MuscleDummy` usa `localizeMuscleGroup(id, lang)` para el `aria-label` (hoy usa solo ES).
- Touch targets ≥ 44 px; foco visible; `aria-pressed` en segmentados; `aria-label` en charts;
  `prefers-reduced-motion` respetado por `AnimatedAreaChart`/`TabNav` existentes.
- Funciona en noche/día y las 6 paletas: solo tokens (`bg`, `fg`, `muted`, `border`, `gold`,
  `gold-bright`, `danger`, `success`); el scrim de fotos usa colores claros fijos porque el fondo es
  siempre oscuro.

## 7. Tests y verificación

**Unitarios (vitest):**

- `tests/unit/domain/bodyProgress.test.ts`: rango vacío, 1 registro, delta 30/90/Todo, mínimo/máximo,
  último fuera de rango, delta entre fechas (ambas / una), conteo de fatiga (incluye noData), orden
  de fotos.
- `tests/unit/components/body/weightHero.test.tsx`: valor, delta con signo, vacío.
- `tests/unit/components/body/weightHistoryTimeline.test.tsx`: 10 visibles de 15, «Ver más».
- `tests/unit/components/body/muscleDummy.test.tsx`: leyenda es/en, 5 niveles, `aria-label`
  localizado, selección.
- `tests/unit/components/photos/progressPhotosTimeline.test.tsx`: paginación y `data-photo-date`.
- `tests/unit/components/photos/compareWeightDelta.test.tsx`: delta solo con ambas fechas.

**e2e (Playwright Python):**

- Nuevo `tests/e2e/test_f132_5_cuerpo_progreso.py`: las 4 rutas, héroe/rango, mapa, slots, sheet,
  comparador y 0 `pageerror`.
- `test_f120w5_fotos_paginadas.py`: contar filas `[data-photo-date]` (10 de 15) en vez de botones de
  guardado.
- `test_f106_guardar.py`: abrir la fila de fecha y guardar desde el sheet.
- Deben seguir verdes sin cambios: `test_f106_camara.py`, `test_f106_comparar.py`,
  `test_f93_t5_weight_history.py`, `test_f93_t23_inputs.py`, `test_f103_smoke.py`, `test_perf.py`.

**Invariantes de datos (`tests/unit/hooks/f120DataSharing.test.ts`):**

- `PesoCorporalPage.tsx` conserva `useAchievementsData` + `bodyWeights` + `useBodyWeightMutations`
  y no usa `useBodyWeight()`.
- `CuerpoPage.tsx` conserva `useAchievementsData()` y
  `lastTrainedByMuscle(workouts, completedSets, exerciseMuscles)`.
- `ProgressPhotosRoute`/`CompareRoute` conservan `useProgressPhotoList`.

**Verificación por tarea:** `npm test`, `npm run build`; e2e al cerrar cada pantalla y al final.

## 8. Entrega

- Commits work-unit en la rama `132.5-cuerpo-progreso`, uno por pantalla (peso, cuerpo, fotos,
  comparar) + uno de docs/cierre. Conventional Commits, sin atribución de IA, sin push.
- Review nativo (RDD) antes de cada commit; si el ciclo se parkea por el defecto de infra conocido,
  se documenta el linaje y se conserva el worktree.
- `PLAN.md` marca 132.5 al cerrar; `CHANGELOG.md` con la entrada de F132.5; `docs/design/README.md`
  actualiza el estado; `NOCTURNO-MINIMAL.md` suma §18 con la anatomía y los follow-ups.

## 9. Archivos principales

| Pieza | Archivo(s) |
|---|---|
| Peso | `pages/PesoCorporalPage.tsx`, `components/body-log/WeightHero.tsx`, `WeightEvolution.tsx`, `WeightHistoryTimeline.tsx` |
| Cuerpo | `pages/CuerpoPage.tsx`, `components/body/MuscleDummy.tsx`, `CuerpoSelected.tsx`, `CuerpoLinks.tsx` |
| Fotos | `pages/ProgressPhotosPage.tsx`, `components/photos/ProgressPhotosHero.tsx`, `ProgressPhotosCapture.tsx`, `ProgressPhotosTimeline.tsx`, `PhotoDateSheet.tsx` |
| Comparar | `pages/ProgressPhotosComparePage.tsx` (+ `ProgressPhotosCompareRoute.tsx` para bodyWeights) |
| Dominio | `domain/bodyProgress.ts`, `domain/muscleFatigue.ts`, `domain/muscleColors.ts` |
| i18n | `i18n/locales/{es,en}/core.ts`, `i18n/locales/{es,en}/features.ts` |
| Tests | `tests/unit/domain/bodyProgress.test.ts`, `tests/unit/components/{body,photos}/*`, `tests/e2e/test_f132_5_cuerpo_progreso.py` |
