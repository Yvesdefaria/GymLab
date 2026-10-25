# Spec — 132.4 Actividad: Logros, Objetivos y Wearables (Nocturno Minimal)

> Rama `132.4-actividad` (worktree `.worktrees/132.4-actividad`, multisesión pedida por el usuario).
> Referencia visual: `.superpowers/brainstorm/132.4-actividad-20261024/content/actividad-direcciones-v1.html`
> (logros A, objetivos A) y `.../wearables-direcciones-v2.html` (wearables C).
> Diseño base: `docs/design/NOCTURNO-MINIMAL.md` §10.9, §11, §12 y `docs/design/README.md`.

## 1. Objetivo

Migrar las tres pantallas de **Actividad** (`/logros`, `/objetivos`, `/wearables`) al lenguaje Nocturno Minimal sin perder datos, funciones ni cobertura e2e: un solo héroe por pantalla, hairline en vez de tarjetas, acento dorado para progreso y verde para logro. Logros pasa de 36 tarjetas apiladas a una vitrina de dos columnas con filtros y detalle en sheet; Objetivos pasa a un héroe de «próximo hito» con filas hairline y alta/edición en sheet; Wearables queda como estado vacío honesto y provisional hasta que exista la integración.

## 2. Decisiones cerradas (grilling 2026-10-24)

| # | Decisión | Respuesta |
|---|---|---|
| Q1 | Forma de la galería de logros | **A** — vitrina de 2 columnas: medalla, nombre, `×N`, barra fina y «1 de 50». |
| Q2 | Filtros y detalle de logros | Chips **Todos / Desbloqueados / Pendientes** (Todos por defecto) + bottom sheet con descripción, condición, metal, variante y progreso. |
| Q3 | Héroe de Objetivos | **A** — «próximo hito»: peso meta, recorrido actual→meta, pista, ritmo y ETA; debajo, todos los objetivos en filas. |
| Q4 | Alta/edición de objetivos | **Bottom sheet** reutilizando `ExercisePicker` y `DecimalInput`. |
| Q5 | Wearables | **C** — vacío centrado con anillo punteado, mensaje y dispositivos en chips 2×2. |
| Q6 | Alcance de Wearables | Entra **solo visual**: sin integración, sin permisos, sin enlaces ni rutas nuevas. |
| Q7 | Wearables, forma | **C** confirmada. Provisional hasta que se implemente la feature. |

**Decisiones del agente aceptadas con el «dale» final** (quedan marcadas como mías):

1. Desempate del héroe de Objetivos: menor `weeksToTarget`; a igualdad, mayor porcentaje de avance.
2. Sin objetivos: héroe vacío con CTA de alta.
3. Con todos los objetivos alcanzados: héroe en verde «N de N alcanzados».
4. El héroe es de lectura; se edita desde su fila.
5. Borrar un objetivo vive dentro del sheet de edición, con confirmación.
6. Volver: `/mas` en Logros y Wearables; `/` en Objetivos (como hoy, porque también se entra desde la home).
7. Dentro de cada sección de logros se respeta el orden del catálogo.

## 3. Alcance

**Dentro:** `AchievementsPage`, `ObjetivosPage`, `WearableSyncView`, componentes nuevos de logros y objetivos, i18n es/en, tests unitarios y e2e, actualización de `test_f59_objetivos.py`, docs de diseño, `PLAN.md`, `CHANGELOG.md` y el task doc ODD.

**Fuera:** `AchievementModal` y la cola global de celebración (sheet global, se rediseña con su dueño), `/perfil` y sus miniaturas de chapas, `/pasos` y su sync de salud, integración real de wearables, permisos, rutas nuevas, cambios de router, tokens o paletas. No se toca `WEARABLE_DEVICES`.

## 4. Logros (`/logros`)

### 4.1 Shell

- `AppHeader title={t('achievements.title')}`; contenido `px-4 pb-20 pt-2`.
- `BackLink to="/mas"` en la primera fila.
- Sin tarjetas contenedoras: héroe con hairline inferior, secciones separadas por `border-t border-border/40`.

### 4.2 Héroe

```text
COLECCIÓN
12/36
████████░░░░░░░░░░░░
24 pendientes            3 variantes
```

- Kicker `achievements.hero.kicker` («Colección»).
- Cifra `{unlocked.length}/{ACHIEVEMENTS.length}` en **un solo nodo de texto** (Oswald 300, 46 px, `tabular-nums`): el e2e busca el literal «12/36» en el body.
- Barra general: el `div` actual con `role="progressbar"`, `data-progress="general"`, `aria-label` (`achievements.progress.general`), `aria-valuenow`, `aria-valuemin`, `aria-valuemax` y pista de 2 px. **No se renombra ni se envuelve en otro nodo.**
- Meta: `achievements.progress.pending` («{{count}} pendientes») a la izquierda; `achievements.progress.variants` («{{count}} variantes») en `text-gold-bright` a la derecha, **solo si `variantsCount > 0`**.
- `variantsCount = Object.keys(variants ?? {}).length` = logros con variante vigente, no total de variantes conseguidas. La etiqueta lo dice así a propósito.

### 4.3 Chips

- `FilterChips` existente, `allowDeselect={false}`, `grow`, `ariaLabel={t('achievements.filters.aria')}`.
- Opciones y valores: `all` → `achievements.filters.all` («Todos»), `unlocked` → `achievements.filters.unlocked` («Desbloqueados»), `locked` → `achievements.filters.locked` («Pendientes»).
- Estado local `useState<'all' | 'unlocked' | 'locked'>('all')`. **Nunca se persiste.**
- Filtro `all`: secciones Desbloqueados y Pendientes, en ese orden.
- Filtro `unlocked`: solo Desbloqueados. Filtro `locked`: solo Pendientes. Una sección sin ítems no se renderiza.
- El filtro no altera el héroe: el contador siempre refleja el total.

### 4.4 Vitrina

- `grid grid-cols-2 gap-x-4 gap-y-5`.
- Encabezado de sección: `achievements.unlocked` / `achievements.locked` con el conteo (`· N`), 10 px, mayúsculas, `text-muted`, hairline superior.
- Tarjeta (`AchievementTile`), toda la superficie es un `<button type="button">` con `text-left` y `min-h-[96px]`:
  - Fila superior: `AchievementMedal` con `size="sm"` (48 px) + bloque de texto: nombre 12 px `font-semibold` con `line-clamp-2` y `×N` (10 px, `text-gold-bright`) cuando `count > 0`.
  - Barra: pista de 2 px + relleno `bg-cta`; **el mismo contrato actual**: `role="progressbar"`, `data-progress={achievement.id}`, `aria-label` = título localizado, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax`. Se omite si `progress.target <= 0`.
  - Etiqueta: `achievements.progress.count` («1 de 50»), 9 px, `tabular-nums`, `text-muted`.
  - Bloqueado: la medalla ya aplica `opacity-45 grayscale`; el nombre usa `text-fg/80` y la barra mantiene el dorado (progreso, no logro).
- `data-tour="logros-medalla"` va en la **primera tarjeta renderizada** (desbloqueada si hay; si no, pendiente), igual que hoy. El `key` con sufijo `__tour` se conserva para el re-enganche del tour.
- El primer render con filtro `all` es idéntico al de hoy en cuanto a nodos exigidos por e2e: `primer-paso`, `sesiones-500`, `primera-cardio`, `sesiones-50`, `pr-10kg`, `guias-completas` y sus barras están presentes.

### 4.5 Sheet de detalle

- `BottomSheet` con `title` = título del logro, `subtitle` = metal + estado (`achievements.metal.chapaDesbloqueada` / `chapaBloqueada`) y variante si existe.
- Contenido: descripción (`descriptionKey`), condición si `conditionKey` (`achievements.detail.condition` + texto), barra de progreso de lectura (sin `data-progress`, para no duplicar el contrato del tile), «{{current}} de {{target}}», y «conseguido {{count}} veces» si `count > 0`.
- Sin acciones de juego: solo lectura + botón «Cerrar» (`layout.confirm.close`, ya existe en es/en) de 44 px. Escape y backdrop cierran.

### 4.6 Estados

- **0 desbloqueados:** héroe `0/36`, solo sección Pendientes.
- **Todos desbloqueados:** solo sección Desbloqueados.
- **Filtro sin resultados:** `EmptyState size="sm"` con `achievements.filters.empty`; en la práctica solo ocurre con datos corruptos, pero evita una pantalla en blanco.
- **Sin variantes:** no se muestra el contador de variantes.

## 5. Objetivos (`/objetivos`)

### 5.1 Shell

- `AppHeader title={t('goals.title')}` con `actions` = botón de 44×44 (`Plus`, `aria-label={t('goalSetter.add')}`) que abre el sheet de alta. Es la **única** acción de creación (el botón fantasma del mockup se descarta para no duplicar).
- `BackLink to="/"`; contenido `px-4 pb-20 pt-2 space-y-4`.
- Desaparece el autoenlace «Gestionar objetivos» (apuntaba a la misma página).

### 5.2 Héroe «próximo hito»

Regla de selección (`pickFeaturedGoal`): entre las proyecciones **no alcanzadas**, la de menor `weeksToTarget`; a igualdad, mayor `currentE1rm / targetE1rm`.

```text
PRÓXIMO HITO · PRESS BANCA
150 kg e1RM
112,5 → 150 kg
███████████████░░░░
~75 semanas · 14 feb 2028        +0,5 kg/semana
```

- Kicker: `goals.hero.kicker` con el nombre del ejercicio.
- Cifra: `<strong>{target}</strong> <span>{unit} e1RM</span>` en un contenedor con un **espacio literal** entre ambos: el texto del elemento debe ser `150 kg e1RM` (e2e `exact=True`).
- Recorrido: `goals.current` («112,5 → 150 kg»), un solo nodo.
- Pista de 2 px `aria-hidden` (el dato está en texto), ancho = `goalProgressRatio` (clamp 0..1).
- ETA: `goals.estimated` («~75 semanas · 14 feb 2028»), un solo nodo, y ritmo `goals.rate` («+0,5 kg/semana»), un solo nodo, en `text-gold-bright`.
- **Corrección respecto del mockup:** la fila de tres stats (Semanas / Fecha / Alcanzado) se sustituye por las dos líneas de meta. Motivo: los literales exactos que exige el e2e viven en un nodo cada uno y no se duplican.
- **Fallbacks:**
  - Sin objetivos: héroe vacío `goals.hero.emptyTitle` + `goalSetter.none` + CTA «Agregar objetivo» que abre el sheet.
  - Con objetivos pero sin ninguna proyección (sin series en 28 días): `goals.hero.noProjection` + `goals.hero.noProjectionHint`.
  - Todas las proyecciones alcanzadas **y todos los objetivos proyectados** (`goals.length === projections.length`): `goals.hero.allReached` («{{count}} de {{count}} alcanzados») en `text-success`, sin pista. Si algún objetivo no tiene proyección, no se usa este héroe (caería en un «1 de 1» engañoso).

### 5.3 Filas

- Sección «Tus objetivos · N» (`goals.rows.title`), hairline superior.
- Una fila por **objetivo del store**, aunque no tenga proyección (hoy el `GoalSetter` los lista y la tarjeta de proyección los omite; se unifican).
- Fila = `<button>` de ancho completo (`min-h-[64px]`, `text-left`) que abre el sheet en modo edición; `aria-label` = `goals.rows.editAria` con el nombre del ejercicio.
- Contenido:
  - Nombre (13 px, `font-semibold`) + a la derecha el objetivo `{target} {unit} e1RM` (11 px, `text-muted`).
  - Con proyección: `goals.current`, pista de 2 px, `goals.estimated` a la izquierda y `goals.rate` a la derecha.
  - Alcanzado: icono `CheckCircle` + `goals.reached` («¡Objetivo alcanzado! 150 kg») en `text-success`, pista al 100 % en `bg-success`.
  - Sin proyección: `goals.rows.noRecent` («Sin datos recientes») en `text-muted`, sin pista ni ETA.
  - Icono `Pencil` decorativo (`aria-hidden`) a la derecha.
- Orden: el del store (`Object.entries`), igual que hoy.

### 5.4 Sheet de alta/edición

- `BottomSheet` con `title` = `goalSetter.new` / `goalSetter.edit`.
- **Ejercicio:** botón de 44 px que muestra el nombre o `goalSetter.selectExercise`. En edición queda fijo (no se cambia el ejercicio de un objetivo existente).
- **Orden de capas (hallazgo del builder check):** `ExercisePicker` vive en `z-[100]` y `BottomSheet` en `z-[120]`; abrir el picker desde el sheet lo dejaría **detrás**. Solución: el borrador del sheet (ejercicio + objetivo + modo) se eleva a `ObjetivosPage`; al abrir el picker se **desmonta** el sheet y al elegir se vuelve a montar con la selección. No se cambia el z-index global del picker.
- **Objetivo:** `DecimalInput` con `goalSetter.targetPlaceholder`; en edición precarga el valor convertido a la unidad del usuario (`applyUnits`), como hoy.
- **Guardar:** `parseWeightToKg(target, units)`, exige `> 0`; guarda y cierra. Botones de 44 px.
- **Borrar** (solo edición): acción destructiva al pie, `ConfirmSheet` con `goalSetter.delete` / `goalSetter.deleteConfirm`; al confirmar, borra y cierra.
- El sheet no se cierra al tocar el backdrop mientras el `ExercisePicker` está abierto.

### 5.5 Estados

- **Sin objetivos:** héroe vacío + lista ausente + CTA.
- **Objetivos sin datos recientes:** fila visible con «Sin datos recientes»; nunca se inventa una fecha.
- **Un solo objetivo alcanzado:** héroe `allReached` en verde (1 de 1) y su fila verde.
- Las unidades respetan Ajustes: todos los pesos visibles (héroe, filas, sheet) se convierten con `applyUnits`, se redondean a 1 decimal y se formatean con `formatNumber`. Las claves `goals.current`, `goals.reached` y `goals.rate` ganan `{{unit}}` y en kg producen exactamente los literales de hoy. Los kilogramos internos no cambian.

## 6. Wearables (`/wearables`) — solo visual

```text
[anillo punteado 116 px con icono Watch]
Nada que sincronizar
todavía
Cuando conectes un reloj o una banda, el pulso,
el sueño y los pasos van a caer acá solos.

DISPOSITIVOS PREVISTOS                    pronto
[Apple Watch] [Garmin]
[Fitbit]      [Otro]

Los datos de salud se leen en el dispositivo.
```

- `AppHeader title={t('wearables.title')}`; `BackLink to="/mas"`; contenido `px-4 pb-20 pt-2`.
- Bloque centrado: anillo de 116 px con borde `border-dashed border-gold/40` e icono `Watch` de 42 px en `text-muted`; título `wearables.emptyTitle` en Oswald 400 24 px, dos líneas; copy `wearables.emptyBody` (máx. 250 px, 12 px, `text-muted`).
- Sección «Dispositivos previstos» (`wearables.devicesPlanned`) con `wearables.soon` («pronto») a la derecha; grid 2×2 con los 4 `WEARABLE_DEVICES` como **spans estáticos** (no botones): `min-h-11`, `rounded-xl`, `border border-border/40`, nombre en `text-muted`, icono `Watch` 15 px.
- Pie: `wearables.readOnDevice` («Los datos de salud se leen en el dispositivo.»).
- **Sin** CTA, sin enlaces, sin permisos, sin cambios en `WEARABLE_DEVICES` ni en el dominio. Cuando exista la integración, esta pantalla se rediseña con datos reales.

## 7. Datos y reglas puras

Sin cambios de esquema, stores ni persistencia. Nuevas funciones puras con tests:

**`src/domain/goalProjection.ts`**

```ts
export interface GoalRow {
  exerciseId: number
  exerciseName: string
  targetE1rm: number
  projection: GoalProjection | null
}

// Todos los objetivos del store, en su orden, con o sin proyección.
export function buildGoalRows(
  goals: Record<number, number>,
  projections: GoalProjection[],
  exercises: { id: number; name: string }[]
): GoalRow[]

// Próximo hito: menor weeksToTarget, desempate por mayor avance. null si no hay.
export function pickFeaturedGoal(projections: GoalProjection[]): GoalProjection | null

// true solo si hay objetivos y cada objetivo del store tiene proyección alcanzada.
// Evita el «1 de 1 alcanzados» cuando otro objetivo no tiene datos recientes.
export function isEveryGoalReached(
  goals: Record<number, number>,
  projections: GoalProjection[]
): boolean

// Avance 0..1 con clamp; 0 si target <= 0.
export function goalProgressRatio(p: Pick<GoalProjection, 'currentE1rm' | 'targetE1rm'>): number
```

**`src/domain/achievements.ts`**

```ts
export type AchievementFilter = 'all' | 'unlocked' | 'locked'

// Filtra por estado de desbloqueo conservando el orden del catálogo.
export function filterAchievementsByState(
  achievements: Achievement[],
  filter: AchievementFilter,
  unlockedIds: string[]
): Achievement[]
```

Reglas de borde documentadas: objetivo con `target <= 0` no existe (el store ya lo impide); proyección con `estimatedDate = null` solo ocurre en alcanzados; `weeksToTarget = 0` también solo en alcanzados.

## 8. Componentes y archivos

| Acción | Archivo |
|---|---|
| Reescribir | `src/pages/AchievementsPage.tsx` |
| Nuevo | `src/components/achievements/AchievementTile.tsx` |
| Nuevo | `src/components/achievements/AchievementDetailSheet.tsx` |
| Reescribir | `src/pages/ObjetivosPage.tsx` |
| Nuevo | `src/components/goals/GoalHero.tsx` |
| Nuevo | `src/components/goals/GoalRow.tsx` |
| Nuevo | `src/components/goals/GoalSheet.tsx` |
| Eliminar | `src/components/goals/GoalSetter.tsx` |
| Eliminar | `src/components/home/GoalProjectionCard.tsx` |
| Reescribir | `src/pages/WearableSyncView.tsx` |
| Ampliar | `src/domain/goalProjection.ts`, `src/domain/achievements.ts` |
| i18n | `src/i18n/locales/{es,en}/core.ts` y `features.ts` |
| Tests | `tests/unit/domain/goalProjection.test.ts`, `tests/unit/domain/achievements.test.ts`, `tests/e2e/test_f132_4_actividad.py`, actualizar `tests/e2e/test_f59_objetivos.py` |
| Docs | `docs/design/NOCTURNO-MINIMAL.md` (§18), `docs/design/README.md`, `PLAN.md`, `CHANGELOG.md`, `odd/tasks/f132-4-actividad.md` |

`GoalSetter` y `GoalProjectionCard` solo tienen un consumidor (`ObjetivosPage`), verificado: se eliminan en el mismo candidato que sus reemplazos.

## 9. i18n (es/en)

Nuevas claves (ambos idiomas; el default del producto es inglés):

| Clave | es | en |
|---|---|---|
| `achievements.hero.kicker` | Colección | Collection |
| `achievements.progress.pending` | {{count}} pendientes | {{count}} pending |
| `achievements.progress.variants` | {{count}} variantes | {{count}} variants |
| `achievements.filters.aria` | Filtrar logros | Filter achievements |
| `achievements.filters.all` | Todos | All |
| `achievements.filters.unlocked` | Desbloqueados | Unlocked |
| `achievements.filters.locked` | Pendientes | Locked |
| `achievements.filters.empty` | No hay logros en este filtro. | No achievements in this filter. |
| `achievements.detail.condition` | Condición | Condition |
| `goals.hero.kicker` | Próximo hito · {{exercise}} | Next milestone · {{exercise}} |
| `goals.hero.emptyTitle` | Sin objetivos todavía | No goals yet |
| `goals.hero.noProjection` | Sin proyección todavía | No projection yet |
| `goals.hero.noProjectionHint` | Registrá una sesión reciente de este ejercicio para estimar la fecha. | Log a recent session for this exercise to estimate the date. |
| `goals.hero.allReached` | {{count}} de {{count}} alcanzados | {{count}} of {{count}} reached |
| `goals.rows.title` | Tus objetivos · {{count}} | Your goals · {{count}} |
| `goals.rows.noRecent` | Sin datos recientes | No recent data |
| `goals.rows.editAria` | Editar objetivo de {{exercise}} | Edit {{exercise}} goal |
| `goalSetter.delete` | Eliminar objetivo | Delete goal |
| `goalSetter.deleteConfirm` | Se elimina el objetivo y su proyección. | The goal and its projection will be deleted. |
| `wearables.emptyTitle` | Nada que sincronizar todavía | Nothing to sync yet |
| `wearables.emptyBody` | Cuando conectes un reloj o una banda, el pulso, el sueño y los pasos van a caer acá solos. | When you connect a watch or band, heart rate, sleep and steps will land here on their own. |
| `wearables.devicesPlanned` | Dispositivos previstos | Planned devices |
| `wearables.soon` | pronto | soon |
| `wearables.readOnDevice` | Los datos de salud se leen en el dispositivo. | Health data is read on the device. |

Se conservan sin cambios `achievements.progress.general`, `achievements.progress.count`, `achievements.metal.*`, `goals.none|estimated`, `goalSetter.*` (salvo las nuevas y el placeholder) y `wearables.title`. **Se modifican** (agregan `{{unit}}`; en kg el texto queda idéntico):

| Clave | es | en |
|---|---|---|
| `goals.current` | {{current}} → {{target}} {{unit}} | {{current}} → {{target}} {{unit}} |
| `goals.reached` | ¡Objetivo alcanzado! {{target}} {{unit}} | Goal reached! {{target}} {{unit}} |
| `goals.rate` | +{{rate}} {{unit}}/semana | +{{rate}} {{unit}}/week |
| `goalSetter.targetPlaceholder` | e1RM objetivo ({{unit}}) | Target e1RM ({{unit}}) |

Las claves que queden huérfanas (`goalSetter.title`, `wearables.comingSoon`, `wearables.description`, `wearables.notAvailable`) se eliminan solo si ningún consumidor las usa tras el cambio.

## 10. Accesibilidad y temas

- Touch targets ≥ 44 px: tarjeta de logro 96 px, chips de filtro 44 px, fila de objetivo 64 px, botones del sheet 44 px, chips de wearables 44 px.
- Chips con `aria-pressed` (primitiva existente); sheet con `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape y foco inicial (lo aporta `BottomSheet`). La **devolución del foco al disparador** la implementa la página, porque `BottomSheet` no la trae; tampoco se agrega focus trap nuevo (primitiva existente, fuera de alcance).
- Cada barra conserva `role="progressbar"` + `aria-*`; las pistas decorativas van `aria-hidden`.
- El estado nunca depende solo del color: «Pendientes», «Alcanzado», «Pronto» y «Disponible» son texto.
- Noche y día: se usan tokens (`text-gold-bright`, `bg-cta`, `text-success`, `border-border/40`); los metales de las medallas son los actuales (fijos por diseño).
- `prefers-reduced-motion`: sin animaciones nuevas; la transición de ancho de las barras ya existe y es de color/width, sin movimiento obligatorio.

## 11. Tests (TDD)

**Unitarios (RED antes de implementar):**

1. `buildGoalRows` incluye objetivos sin proyección (con `projection: null`), conserva el orden del store y resuelve nombres.
2. `pickFeaturedGoal` elige el de menor `weeksToTarget`; desempata por mayor avance; devuelve `null` si todas están alcanzadas o no hay proyecciones.
3. `goalProgressRatio` clampa 0..1 y devuelve 0 con `target <= 0`.
4. `isEveryGoalReached` es `false` si falta la proyección de algún objetivo (caso 2 objetivos: 1 alcanzado + 1 sin datos) y `true` solo con todos proyectados y alcanzados.
5. `filterAchievementsByState` respeta `all|unlocked|locked` y el orden del catálogo (incluye el caso sin desbloqueados).

**E2E nuevo `test_f132_4_actividad.py`:**

- `/logros`: héroe «X/36», barra general, chips; con «Pendientes» desaparecen los desbloqueados del body; tocar una medalla abre el sheet con descripción y condición; Escape lo cierra.
- `/objetivos`: héroe con «150 kg e1RM», «112,5 → 150 kg», «~75 semanas · …», «+0,5 kg/semana»; abrir el sheet de alta, elegir ejercicio y guardar; editar y borrar con confirmación; estado vacío sin objetivos; alcanzado en verde.
- `/wearables`: título, anillo, 4 chips de dispositivos, sin botones ni enlaces nuevos.
- Vistas 375×812 y 768×1024, 0 `pageerror`.

**E2E existentes que deben quedar verdes:** `test_f93_16_chapas.py`, `test_f95.py`, `test_f127_tour_logros.py`, `test_f101_tour.py`, `test_t2.py`, `test_f69.py`, `test_f84b_pasos.py`, `test_t10.py`.

**`test_f59_objetivos.py`:** hoy está **rojo en `main`** (comprobado: la home ya no renderiza proyecciones desde el rediseño C; el test sigue buscando «112,5 → 150 kg» y «Gestionar objetivos» en `/`). Se actualiza a la superficie nueva: los escenarios A/B/C se verifican en `/objetivos`; se eliminan las aserciones sobre la home y la de «Gestionar objetivos» (el autoenlace desaparece por diseño).

## 12. Verificación y entrega

1. `npm run build` (typecheck real) y `npm test` verdes.
2. E2E: nuevo de Actividad + `test_f59` actualizado + los existentes listados en §11, con puerto propio (`--port 5245`).
3. Revisión visual a 375 px y tablet; 0 `pageerror`; probar noche y una paleta alternativa.
4. **Sin emulador**: no se tocan rutas, router, `vite.config.ts` ni nada nativo. Si eso cambiara, la prueba de emulador vuelve a ser obligatoria.
5. Review nativo por candidato **antes** de cada commit (el switch está ON y el candidato es el diff del workspace). Docs pasivos: readback estructural.
6. Commits work-unit en `132.4-actividad`: `feat: rediseñar logros…`, `feat: rediseñar objetivos…`, `feat: rediseñar wearables…`, `docs: cerrar 132.4…`. Sin push.
7. Cierre de fase: `PLAN.md` (132.4 → `[x]`), `CHANGELOG.md`, `docs/design/README.md` y §18 de `NOCTURNO-MINIMAL.md`; merge a `main` cuando las otras sesiones estén idle y `.\scripts\worktree.ps1 close 132.4-actividad`.

**Risk: item 3** — cambian contratos que consumen tests (DOM/clases de tres pantallas y el test F59); se preservan `data-achievement`, `data-progress`, `data-tour`, los literales de datos y el contador `X/36`. Alto riesgo → verificador independiente después de los checks propios.

## 13. Riesgos y follow-ups

- **Variantes:** el contador muestra logros con variante vigente, no el total histórico de variantes conseguidas. Si el usuario quiere el total, requiere cambiar `latestVariants` (fuera de alcance).
- **Objetivos sin datos:** pasan a verse en la lista con «Sin datos recientes». Es información honesta, pero es una fila nueva respecto de la tarjeta de proyección anterior.
- **Héroe de objetivos:** depende de `buildGoalProjections`, que exige series en los últimos 28 días; sin datos el héroe cae al fallback y no inventa fechas.
- **Wearables provisional:** la copia promete pulso/sueño/pasos a futuro; cuando llegue la integración, la pantalla se rehace. No agregar enlaces ni estados falsos.
- **Follow-up:** rediseñar el modal global de logros (`AchievementModal`) con su propia fase; hoy queda con el lenguaje anterior, igual que los sheets globales.
