# F112 — Reset de fábrica y borrado parcial (reconciliación de logros) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar el reset de fábrica de Ajustes (con sugerencia de backup, type-to-confirm y wipe ordenado), la reconciliación global de logros tras cualquier pérdida de datos, el backup completo de las 28 tablas y su entrega nativa por share sheet en Android.

**Architecture:** Una función pura nueva de dominio (`reconcileAchievementState`) se integra en el effect debounced de `useAchievements` con escrituras solo-si-cambió; la reconciliación re-bloquea logros no sostenidos, restringe contadores, actualiza snapshot y retrocede chapas de forma determinística. El wipe vive en un módulo de datos con dependencias inyectables (`src/data/factoryReset.ts`, patrón `workoutDeletion`) que cancela notificaciones → resetea stores → limpia `db.tables` en una transacción → borra claves de storage → recarga; la UI es una sección nueva de Ajustes con dos sheets. El backup pasa a 28 tablas y ramifica su entrega: nativo (`@capacitor/filesystem` Cache UTF-8 → `@capacitor/share`) y web (anchor actual). Sin cambios de modelo Dexie, sin tocar el seed.

**Tech Stack:** React + Vite + TypeScript (dominio puro), Zustand, Dexie, Tailwind v4 con tokens, vitest, e2e Python/Playwright (`python tests/e2e/scripts/with_server.py <test>`), Capacitor 8 (`@capacitor/share@8.0.2`, `@capacitor/filesystem@8.1.3`), lucide-react.

**Spec:** `docs/superpowers/specs/2026-09-29-f112-reset-borrado-parcial-design.md` (leer ANTES de empezar: §4 trae el orden exacto del wipe, §5 la semántica de reconciliación y §6 la lista de las 9 tablas que faltan en el backup).

## Global Constraints

- **Verificación por tarea**: `npm test` (suite vitest completa) + `npm run build` (corre `tsc -b`, ES el typecheck real; `npx tsc --noEmit` es un falso verde y NO se usa) ejecutados desde `.worktrees/f112/gymlab-app`. E2e cuando la tarea toque UI/flujo: `python tests/e2e/scripts/with_server.py <test>`. El emulador se usa SOLO en WP4/WP5 (en este plan, Task 5; la receta vive en `gymlab-app/AGENTS.md`).
- **TDD**: test rojo → implementación → verde. Los pasos ya están escritos en ese orden.
- **Commits**: convencionales, **sin push** (el usuario pushea a mano). Un commit por tarea, stagear **rutas exactas** (worktree compartido: nunca `git add -A` / `git add .` / `git stash`); `git diff --cached --name-only` antes de cada commit.
- **Review RDD (Gentle AI, switch global ON)**: antes de commitear, correr el ciclo (`gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition`) y rutear SOLO por su `next_transition`. Si el transporte devuelve vacío (falla conocida del modelo flash en esta máquina), anotarlo en el commit como `[no revisado]` siguiendo la costumbre reciente del repo. El review corre ANTES del commit: el candidato es el diff del workspace.
- **i18n**: toda clave nueva va en `es` **y** `en` (`src/i18n/locales/*`); el build fuerza paridad (`EsSchema`). Copy de UI en español (es-ES, tuteo como el resto de la app), código en inglés.
- **UI**: touch targets ≥44px, iconos lucide (nunca emoji), tokens del tema (no hex sueltos), `prefers-reduced-motion` respetado (los haptics del reset ya lo honran vía `lib/haptics`).
- **Dominio puro**: `src/domain/` sin React/Dexie/UI.
- **Seed intocable**: no tocar `src/data/seed/**` ni `SEED_VERSION` (`'23'`).
- **Dependencias**: solo las 2 aprobadas (`@capacitor/share`, `@capacitor/filesystem`). Ninguna más.
- **Wipe**: el reset limpia con `db.tables` (28 tablas reales del schema) — **nunca** `ALL_TABLES`, que es la lista del backup y no refleja el schema.
- **Entrega del backup no verificada**: el copy del flujo pide «guardar el archivo antes de continuar»; no hay comprobación programática de que el usuario lo guardó.
- **cwd**: `.worktrees/f112/gymlab-app` para todo comando (dev server, tests, build, review, commits).

---

## File Structure

**Dominio**
- Create: `src/domain/achievementReconcile.ts` — reconciliación pura de las 4 claves de logros: `reconcileAchievementState`, `freshAchievementIds`, `newCollectibleDelta`, `achievementStatePatch` (+ tipos).
- Create: `src/domain/resetConfirmation.ts` — palabra canónica `BORRAR` + comparación trim/case-insensitive.
- Create: `tests/unit/domain/achievementReconcile.test.ts` — re-bloqueo, contadores frescos, chapas, idempotencia, sin flood.
- Create: `tests/unit/domain/resetConfirmation.test.ts` — gate de la palabra.

**Datos / stores**
- Create: `src/data/factoryReset.ts` — `performFactoryReset(deps)` con el orden congelado (D4) y deps inyectables.
- Create: `tests/unit/data/factoryReset.test.ts` — orden, 28 tablas, claves exactas, fallos.
- Modify: `src/store/goalStore.ts` — acción `reset()` (el goal store no la tenía).
- Modify: `src/data/backup.ts` — `ALL_TABLES` 19 → 28 (exportada) + `downloadBackup` asíncrona con rama nativa.
- Create: `tests/unit/data/backup.test.ts` — 28 tablas, import de archivo viejo, tablas vacías, entrega nativa.

**Hook / UI de Ajustes**
- Modify: `src/hooks/useAchievements.ts` — reconciliación integrada tras `earnedIds` (escrituras solo-si-cambió, `freshIds` pre-reconciliación).
- Create: `src/hooks/useFactoryReset.ts` — hook delgado busy/error.
- Create: `src/components/settings/DangerZoneSection.tsx` — sección + máquina de estados de sheets.
- Create: `src/components/settings/ResetInfoSheet.tsx` — sheet informativo (lista, aviso de sesión, backup primario, continuar).
- Create: `src/components/settings/ResetConfirmSheet.tsx` — type-to-confirm `BORRAR` + busy/error.
- Modify: `src/components/settings/index.ts` — export de `DangerZoneSection`.
- Modify: `src/pages/AjustesPage.tsx` — monta `DangerZoneSection` después de `DataSection`.
- Modify: `src/components/settings/DataSection.tsx` — `await downloadBackup(...)` (ahora es async).

**i18n**
- Modify: `src/i18n/locales/es/workout.ts` / `src/i18n/locales/en/workout.ts` — línea de logros en `eliminarSesionMensaje`.
- Modify: `src/i18n/locales/es/core.ts` / `src/i18n/locales/en/core.ts` — 24 claves `ajustes.*` del reset.

**E2E / docs / nativo**
- Create: `tests/e2e/test_f112_reset.py` — flujo completo del reset.
- Create: `tests/e2e/test_f112_reconcile.py` — borrado → re-bloqueo sin flood → re-logro ×1.
- Modify: `PLAN.md` — marcar 112.1 y 112.2.
- Modify: `CHANGELOG.md` — `[Unreleased]`.
- Modify (generados por `cap sync`): `android/capacitor.settings.gradle`, `android/app/capacitor.build.gradle`; `package.json` + `package-lock.json` por `npm install`.

**Qué NO se toca:** `src/data/seed/**`, `SEED_VERSION`, `src/data/workoutDeletion.ts` (el borrado por sesión ya existe y NO cambia: la re-evaluación de logros hace el trabajo), la semántica de `importBackup`, `vite.config.ts`, el router.

---

### Task 1 (WP1): Reconciliación de logros (dominio + hook + copy)

**Files:**
- Create: `src/domain/achievementReconcile.ts`
- Create: `tests/unit/domain/achievementReconcile.test.ts`
- Modify: `src/hooks/useAchievements.ts` (imports + cuerpo del effect, hoy líneas ~10-22 y ~137-161)
- Modify: `src/i18n/locales/es/workout.ts` (línea 74)
- Modify: `src/i18n/locales/en/workout.ts` (línea 74)

**Interfaces:**
- Consumes: `grantedCollectibles`/`Collectible` (`src/domain/achievementCollectibles.ts`), `nextAchievementCounts` (`src/domain/achievements.ts`), las 4 claves `meta.*` y `metaRepo` (hook).
- Produces (lo usa Task 5 indirectamente vía la app, y el hook): `AchievementState`, `reconcileAchievementState(state, earnedIds)`, `freshAchievementIds(earnedIds, savedIds)`, `newCollectibleDelta(prev, next)`, `achievementStatePatch(prev, next)`, `AchievementStatePatch`.

**Decisión:** la reconciliación vive en su propio archivo `src/domain/achievementReconcile.ts` en vez de sumarse a `achievements.ts` (que ya está en el cap de ~200 líneas del repo). Alternativa: agregarla a `achievements.ts` y extraer otra cosa — se descarta por riesgo de tocar más de lo necesario.

- [ ] **Step 1: Write the failing test**

Crea `tests/unit/domain/achievementReconcile.test.ts`:

```ts
// Reconciliación de logros (F112 §5.2, D6/D7): re-bloqueo de lo no sostenido,
// contadores restringidos a earned, snapshot := earned, chapas retrocedidas de
// forma determinística y escrituras solo-si-cambió (idempotentes).
import { describe, expect, it } from 'vitest'
import {
  achievementStatePatch,
  freshAchievementIds,
  newCollectibleDelta,
  reconcileAchievementState,
  type AchievementState,
} from '@/domain/achievementReconcile'

const state = (over: Partial<AchievementState> = {}): AchievementState => ({
  unlocked: [],
  counts: {},
  snapshot: [],
  collectibles: [],
  ...over,
})

describe('reconcileAchievementState', () => {
  it('re-bloquea los ids que ya no se sostienen y conserva los sostenidos', () => {
    const next = reconcileAchievementState(
      state({
        unlocked: ['primer-paso', 'inaugural'],
        counts: { 'primer-paso': 1, inaugural: 1 },
        snapshot: ['primer-paso', 'inaugural'],
      }),
      ['primer-paso'],
    )
    expect(next.unlocked).toEqual(['primer-paso'])
    expect(next.counts).toEqual({ 'primer-paso': 1 })
    expect(next.snapshot).toEqual(['primer-paso'])
  })

  it('un re-bloqueo pierde su contador: el re-logro arranca fresco ×1', () => {
    const lost = reconcileAchievementState(
      state({ unlocked: ['volumen-semanal'], counts: { 'volumen-semanal': 3 }, snapshot: ['volumen-semanal'] }),
      [],
    )
    expect(lost.counts).toEqual({})
    expect(lost.unlocked).toEqual([])
  })

  it('las chapas retroceden de forma determinística al perderse el contador', () => {
    const withVariants = state({
      unlocked: ['primer-paso'],
      counts: { 'primer-paso': 3 },
      snapshot: ['primer-paso'],
      collectibles: [
        { achievementId: 'primer-paso', variantId: 'polished' },
        { achievementId: 'primer-paso', variantId: 'radiant' },
      ],
    })
    const lost = reconcileAchievementState(withVariants, [])
    expect(lost.collectibles).toEqual([])
    // Contador fresco ×1 ⇒ sin variantes; ×2 vuelve a conceder la primera.
    const regained = reconcileAchievementState({ ...lost, counts: { 'primer-paso': 1 } }, ['primer-paso'])
    expect(regained.collectibles).toEqual([])
    const again = reconcileAchievementState({ ...regained, counts: { 'primer-paso': 2 } }, ['primer-paso'])
    expect(again.collectibles).toEqual([{ achievementId: 'primer-paso', variantId: 'polished' }])
  })

  it('es idempotente: aplicarlo dos veces da el mismo estado', () => {
    const first = reconcileAchievementState(state({ unlocked: ['a', 'b'], counts: { a: 1, b: 2 } }), ['b'])
    const second = reconcileAchievementState(first, ['b'])
    expect(second).toEqual(first)
  })
})

describe('freshAchievementIds (sin flood de modales)', () => {
  it('no anuncia nada al re-bloquear', () => {
    expect(freshAchievementIds(['primer-paso'], ['primer-paso', 'inaugural'])).toEqual([])
  })

  it('anuncia solo los ids ganados que no estaban persistidos', () => {
    expect(freshAchievementIds(['primer-paso', 'inaugural'], ['primer-paso'])).toEqual(['inaugural'])
  })

  it('tras un re-logro, el id vuelve a anunciarse (ya no está en savedIds)', () => {
    expect(freshAchievementIds(['primer-paso'], [])).toEqual(['primer-paso'])
  })
})

describe('newCollectibleDelta', () => {
  it('sin cambios respecto del estado previo no anuncia nada', () => {
    const granted = [{ achievementId: 'primer-paso', variantId: 'polished' }]
    expect(newCollectibleDelta(granted, granted)).toEqual([])
  })

  it('anuncia la variante re-concedida tras un retroceso', () => {
    expect(newCollectibleDelta([], [{ achievementId: 'primer-paso', variantId: 'polished' }])).toEqual([
      { achievementId: 'primer-paso', variantId: 'polished' },
    ])
  })

  it('con retroceso sin re-logro no hay delta (no anuncia variantes perdidas)', () => {
    const before = [
      { achievementId: 'primer-paso', variantId: 'polished' },
      { achievementId: 'primer-paso', variantId: 'radiant' },
    ]
    expect(newCollectibleDelta(before, [])).toEqual([])
  })
})

describe('achievementStatePatch (escrituras solo-si-cambió)', () => {
  it('estado idéntico ⇒ patch vacío (sin loops de escritura)', () => {
    const s = state({
      unlocked: ['a'],
      counts: { a: 1 },
      snapshot: ['a'],
      collectibles: [{ achievementId: 'a', variantId: 'polished' }],
    })
    expect(
      achievementStatePatch(s, {
        ...s,
        unlocked: [...s.unlocked],
        counts: { ...s.counts },
        snapshot: [...s.snapshot],
        collectibles: [...s.collectibles],
      }),
    ).toEqual({})
  })

  it('marca cada clave que cambió', () => {
    const prev = state({ unlocked: ['a', 'b'], counts: { a: 1, b: 1 }, snapshot: ['a', 'b'] })
    const next = state({ unlocked: ['a'], counts: { a: 1 }, snapshot: ['a'] })
    expect(achievementStatePatch(prev, next)).toEqual({ unlocked: ['a'], counts: { a: 1 }, snapshot: ['a'] })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/domain/achievementReconcile.test.ts`
Expected: **FAIL** — no existe `src/domain/achievementReconcile.ts` (error de resolución).

- [ ] **Step 3: Implement the pure module**

Crea `src/domain/achievementReconcile.ts`:

```ts
// Reconciliación de logros (F112, D6/D7): función pura que ajusta el estado
// persistido a los logros realmente sostenidos por los datos actuales. Se aplica
// en la evaluación de useAchievements para CUALQUIER pérdida de datos (borrado
// manual de un entreno, import, reset), no solo al borrar (D6).
//
// Fidelidad a la spec §5.2: `unlocked := unlocked ∩ earned` es el RECORTE; el alta
// de los recién ganados (que no están en savedIds) la une el hook antes de
// persistir. El estado persistido resultante es exactamente earnedIds.
import { grantedCollectibles, type Collectible } from './achievementCollectibles'

// Estado persistido de logros: espejo de las 4 claves de meta que usa el hook.
export interface AchievementState {
  unlocked: string[]
  counts: Record<string, number>
  snapshot: string[]
  collectibles: Collectible[]
}

// Re-bloqueo: un id persistido que ya no se sostiene sale de unlocked.
// Contadores: un re-bloqueo pierde su contador (queda fresco para un futuro re-logro).
// Snapshot: pasa a ser earnedIds, para que la próxima transición no-cumplido →
// cumplido vuelva a contar ×1 (D7).
// Chapas: retroceso determinístico (grantedCollectibles recomputado; en este camino
// reemplaza al merge append-only de F95.1).
export const reconcileAchievementState = (
  state: AchievementState,
  earnedIds: readonly string[],
): AchievementState => {
  const earned = new Set(earnedIds)
  const counts: Record<string, number> = {}
  for (const [id, count] of Object.entries(state.counts)) {
    if (earned.has(id)) counts[id] = count
  }
  return {
    unlocked: state.unlocked.filter((id) => earned.has(id)),
    counts,
    snapshot: [...earnedIds],
    collectibles: grantedCollectibles(counts),
  }
}

// Ids que se anuncian con modal: los ganados en ESTA evaluación que no estaban
// persistidos ANTES (savedIds pre-reconciliación). Re-bloquear no anuncia nada;
// volver a ganarlo más adelante sí (es un logro nuevo, D7).
export const freshAchievementIds = (
  earnedIds: readonly string[],
  savedIds: readonly string[],
): string[] => {
  const saved = new Set(savedIds)
  return earnedIds.filter((id) => !saved.has(id))
}

const collectibleKey = (c: Collectible): string => `${c.achievementId}:${c.variantId}`

// Variantes nuevas de esta evaluación: las del conjunto recomputado que no existían
// antes. Con retroceso + re-logro, la variante vuelve a anunciarse (D7); con el
// conjunto sin cambios, el delta es vacío (sin flood de anuncios).
export const newCollectibleDelta = (
  prev: readonly Collectible[],
  next: readonly Collectible[],
): Collectible[] => {
  const seen = new Set(prev.map(collectibleKey))
  return next.filter((c) => !seen.has(collectibleKey(c)))
}

// Escrituras solo-si-cambió: cada clave presente en el patch cambió respecto del
// estado previo. Estado idéntico ⇒ patch vacío (idempotencia, sin loops).
export interface AchievementStatePatch {
  unlocked?: string[]
  counts?: Record<string, number>
  snapshot?: string[]
  collectibles?: Collectible[]
}

const sameStringList = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index])

const sameCounts = (
  a: Readonly<Record<string, number>>,
  b: Readonly<Record<string, number>>,
): boolean => {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}

export const achievementStatePatch = (
  prev: AchievementState,
  next: AchievementState,
): AchievementStatePatch => {
  const patch: AchievementStatePatch = {}
  if (!sameStringList(prev.unlocked, next.unlocked)) patch.unlocked = next.unlocked
  if (!sameCounts(prev.counts, next.counts)) patch.counts = next.counts
  if (!sameStringList(prev.snapshot, next.snapshot)) patch.snapshot = next.snapshot
  if (!sameStringList(prev.collectibles.map(collectibleKey), next.collectibles.map(collectibleKey))) {
    patch.collectibles = next.collectibles
  }
  return patch
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/domain/achievementReconcile.test.ts` → **PASS** (12 casos).

- [ ] **Step 5: Integrate into `useAchievements`**

En `src/hooks/useAchievements.ts`, reemplaza el import de logros (hoy líneas 10-18) por:

```ts
import {
  checkAchievements,
  getAchievement,
  nextAchievementCounts,
  type Achievement,
  type Collectible,
} from '@/domain/achievements'
import {
  achievementStatePatch,
  freshAchievementIds,
  newCollectibleDelta,
  reconcileAchievementState,
} from '@/domain/achievementReconcile'
```

`mergeCollectibles` y `grantedCollectibles` dejan de usarse en el hook (el merge append-only lo reemplaza la reconciliación en este camino). **No** borres `mergeCollectibles` del dominio: sigue exportado y cubierto por sus tests.

Luego reemplaza el bloque del effect que va desde `// Contador «veces conseguido»…` hasta el `setUnlocked(...)` (hoy líneas 137-161) por:

```ts
      // 1) Contador «veces conseguido»: transición no-cumplido → cumplido.
      const counted = nextAchievementCounts({ counts, snapshot }, earnedIds)

      // 2) Reconciliación global (F112, D6/D7): re-bloqueo de lo no sostenido,
      //    contadores restringidos a earned, snapshot := earned y chapas
      //    retrocedidas de forma determinística.
      const reconciled = reconcileAchievementState(
        { unlocked: savedIds, counts: counted.counts, snapshot: counted.snapshot, collectibles },
        earnedIds
      )
      // 3) freshIds contra el savedIds PRE-reconciliación: re-bloquear no dispara
      //    modal; volver a ganarlo más adelante sí (es un logro nuevo, D7). Los
      //    recién ganados se unen al set persistido (la reconciliación solo recorta).
      const freshIds = freshAchievementIds(earnedIds, savedIds)
      const nextState = {
        ...reconciled,
        unlocked: [...new Set([...reconciled.unlocked, ...freshIds])],
      }

      // 4) Escrituras solo-si-cambió: un estado idéntico no toca meta. `counts` NO
      //    entra a la firma del effect, así que estas escrituras no lo re-disparan.
      const patch = achievementStatePatch(
        { unlocked: savedIds, counts, snapshot, collectibles },
        nextState
      )
      if (patch.unlocked) void metaRepo.setJson(UNLOCKED_ACHIEVEMENTS_KEY, patch.unlocked)
      if (patch.counts) void metaRepo.setJson(ACHIEVEMENT_COUNTS_KEY, patch.counts)
      if (patch.snapshot) void metaRepo.setJson(ACHIEVEMENT_SNAPSHOT_KEY, patch.snapshot)
      if (patch.collectibles) void metaRepo.setJson(COLLECTIBLES_KEY, patch.collectibles)

      // 5) Variantes nuevas del cálculo (incluye la re-concedida tras un retroceso).
      const delta = newCollectibleDelta(collectibles, nextState.collectibles)
      if (delta.length > 0) setNewGranted(delta)

      if (freshIds.length === 0) return
      // Acumula en vez de sustituir: si ya hay logros en pantalla, los combina.
      const fresh = freshIds.map((id) => getAchievement(id)!).filter(Boolean)
      setUnlocked((prev) => [...prev, ...fresh.filter((a) => !prev.some((p) => p.id === a.id))])
```

No cambies la `signature` del effect (sigue SIN `counts`), ni el debounce, ni el gating de `ready`.

- [ ] **Step 6: Extend the delete-confirm copy**

`src/i18n/locales/es/workout.ts` línea 74:

```ts
    eliminarSesionMensaje: 'Se borrarán la sesión, sus series y su bitácora. También se recalcularán tus logros. Esta acción es permanente y no se puede deshacer.',
```

`src/i18n/locales/en/workout.ts` línea 74:

```ts
    eliminarSesionMensaje: 'The session, its sets and its journal will be removed. Your achievements will also be recalculated. This action is permanent and cannot be undone.',
```

- [ ] **Step 7: Run the full verification**

Run: `npm test` → verde (los tests existentes de `achievementCollectibles`/`achievements` no cambian: `mergeCollectibles` sigue exportado y con sus casos).
Run: `npm run build` → limpio (typecheck real; ojo con `noUnusedLocals`: no deben quedar imports sin usar en el hook).

- [ ] **Step 8: Review + commit**

Review RDD antes de commitear (ver Global Constraints).

```bash
git add src/domain/achievementReconcile.ts tests/unit/domain/achievementReconcile.test.ts src/hooks/useAchievements.ts src/i18n/locales/es/workout.ts src/i18n/locales/en/workout.ts
git commit -m "feat: reconciliacion de logros tras perdida de datos (F112 WP1)"
```

---

### Task 2 (WP2): `performFactoryReset` — wipe ordenado con deps inyectables

**Files:**
- Create: `src/data/factoryReset.ts`
- Create: `tests/unit/data/factoryReset.test.ts`
- Modify: `src/store/goalStore.ts` (líneas 5-9 y 17-24)

**Interfaces:**
- Consumes: `db` (`src/data/repositories/dexie/db.ts`, `db.tables` = 28 tablas reales), `useActiveWorkoutStore.reset()`, `useEquipmentStore.clear()`, `useGoalStore.reset()` (nuevo), `getLocalNotificationsBackend()` (`src/data/localNotificationsBackend.ts`), `REST_NOTIFICATION_ID` (`src/domain/restAlert.ts` = 9601), `NOTIFICATION_IDS` (`src/domain/notifications.ts` = 9602/9603/9604).
- Produces (los usan Task 3 y Task 5): `performFactoryReset(deps?)`, `FactoryResetDeps`, `ResetTable`, `RESET_NOTIFICATION_IDS`, `RESET_LOCAL_STORAGE_KEYS`, `RESET_SESSION_STORAGE_KEYS`.

**Decisión:** el goal store gana una acción `reset()` (como `activeWorkoutStore.reset()` y `equipmentStore.clear()`) en vez de que el orquestador use `useGoalStore.setState({ goals: {} })` desde afuera. Alternativa: `setState` directo — se descarta por consistencia de API de los stores.

**Decisión:** `cancelNotifications` es best-effort por id (`Promise.allSettled`) en las deps reales: una notificación inexistente o un plugin caído no debe bloquear el reset. La orquestación sí aborta si una dep inyectada rechaza (y lo cubre el test de fallos).

- [ ] **Step 1: Add the goal store reset (needed by the module)**

En `src/store/goalStore.ts`, agrega `reset` a la interfaz y a la implementación:

```ts
export interface GoalState {
  goals: Record<number, number> // exerciseId → targetE1rm
  setGoal: (exerciseId: number, targetE1rm: number) => void
  removeGoal: (exerciseId: number) => void
  reset: () => void
}
```

```ts
      reset: () => set({ goals: {} }),
```

(va junto a `removeGoal`, antes del cierre del objeto de estado).

- [ ] **Step 2: Write the failing test**

Crea `tests/unit/data/factoryReset.test.ts`:

```ts
// Reset de fábrica (F112, 112.1): orden congelado (D4), las 28 tablas reales del
// schema, claves exactas de storage y comportamiento ante fallos. Deps dobles;
// del `db` real solo se lee `db.tables` (no requiere IndexedDB).
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Los stores persisten al cargar el módulo: en node hace falta un localStorage
// en memoria ANTES de importar factoryReset.ts (patrón activeWorkoutStore.test.ts).
const memory = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value)
  },
  removeItem: (key: string) => {
    memory.delete(key)
  },
  clear: () => {
    memory.clear()
  },
})

import type { FactoryResetDeps } from '@/data/factoryReset'

const { db } = await import('@/data/repositories/dexie/db')
const {
  performFactoryReset,
  RESET_LOCAL_STORAGE_KEYS,
  RESET_NOTIFICATION_IDS,
  RESET_SESSION_STORAGE_KEYS,
} = await import('@/data/factoryReset')

// Las 28 tablas del schema Dexie en orden de declaración (db.ts v13).
const EXPECTED_TABLES = [
  'exercises',
  'routines',
  'routineDays',
  'routineItems',
  'workouts',
  'workoutSets',
  'papers',
  'guides',
  'profile',
  'activeProgram',
  'prs',
  'meta',
  'socialProfiles',
  'posts',
  'postMedia',
  'bodyWeight',
  'dailySteps',
  'exerciseNotes',
  'bodyMeasurements',
  'skinfolds',
  'sessionJournals',
  'benchmarkResults',
  'foods',
  'mealEntries',
  'supplements',
  'progressPhotos',
  'workoutTemplates',
  'periodizationPlans',
]

const makeHarness = () => {
  const events: string[] = []
  const cleared: string[] = []
  let inTransaction = false
  const tables = EXPECTED_TABLES.map((name) => ({
    name,
    clear: async () => {
      // Toda limpieza debe ocurrir dentro de la transacción única.
      if (!inTransaction) events.push(`clear-outside-transaction:${name}`)
      cleared.push(name)
    },
  }))
  const deps: FactoryResetDeps = {
    cancelNotifications: async (ids) => {
      events.push(`notifications:${ids.join(',')}`)
    },
    resetStores: () => events.push('stores'),
    transaction: async (scope) => {
      events.push('transaction:begin')
      inTransaction = true
      try {
        await scope()
      } finally {
        inTransaction = false
      }
      events.push('transaction:end')
    },
    getTables: () => tables,
    clearStorage: () => events.push('storage'),
    reload: () => events.push('reload'),
  }
  return { deps, events, cleared }
}

describe('performFactoryReset', () => {
  beforeEach(() => {
    memory.clear()
  })

  it('ejecuta el wipe en el orden congelado (D4)', async () => {
    const h = makeHarness()
    await performFactoryReset(h.deps)
    expect(h.events).toEqual([
      'notifications:9601,9602,9603,9604',
      'stores',
      'transaction:begin',
      'transaction:end',
      'storage',
      'reload',
    ])
  })

  it('limpia dentro de una única transacción las 28 tablas reales de Dexie', async () => {
    const h = makeHarness()
    await performFactoryReset(h.deps)
    // La verdad de runtime: db.tables (nunca ALL_TABLES, que es del backup).
    expect(db.tables.map((t) => t.name).sort()).toEqual([...EXPECTED_TABLES].sort())
    expect(h.cleared.slice().sort()).toEqual([...EXPECTED_TABLES].sort())
    expect(h.events.filter((e) => e.startsWith('clear-outside-transaction'))).toEqual([])
  })

  it('usa los ids de notificación y las claves de storage exactas', async () => {
    const h = makeHarness()
    await performFactoryReset(h.deps)
    expect(RESET_NOTIFICATION_IDS).toEqual([9601, 9602, 9603, 9604])
    expect(RESET_LOCAL_STORAGE_KEYS).toEqual([
      'gymLab-activeWorkout',
      'gymlab-goals',
      'gymlab-equipment',
      'gymlab.theme',
      'gymlab.palette',
      'gymlab.recentCalculators',
      'gymlab-pending-photo-angle',
    ])
    expect(RESET_SESSION_STORAGE_KEYS).toEqual(['gymLab-preloadReload'])
  })

  it('si la transacción falla no limpia storage ni recarga (reintentable)', async () => {
    const h = makeHarness()
    h.deps.transaction = async () => {
      throw new Error('boom')
    }
    await expect(performFactoryReset(h.deps)).rejects.toThrow('boom')
    expect(h.events).not.toContain('storage')
    expect(h.events).not.toContain('reload')
  })

  it('si cancelar notificaciones falla no toca la DB (aborta antes)', async () => {
    const h = makeHarness()
    h.deps.cancelNotifications = async () => {
      throw new Error('sin permiso')
    }
    await expect(performFactoryReset(h.deps)).rejects.toThrow('sin permiso')
    expect(h.events).not.toContain('stores')
    expect(h.events).not.toContain('transaction:begin')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/data/factoryReset.test.ts`
Expected: **FAIL** — no existe `src/data/factoryReset.ts`.

- [ ] **Step 4: Implement the module**

Crea `src/data/factoryReset.ts`:

```ts
// Reset de fábrica (F112, 112.1): devuelve la app a estado de instalación limpia.
// El orden importa (D4): notificaciones → stores en memoria → Dexie → storage → reload.
// Dependencias inyectables (patrón workoutDeletion): los tests las sustituyen por dobles.
import { db } from '@/data/repositories/dexie/db'
import { NOTIFICATION_IDS } from '@/domain/notifications'
import { REST_NOTIFICATION_ID } from '@/domain/restAlert'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { useEquipmentStore } from '@/store/equipmentStore'
import { useGoalStore } from '@/store/goalStore'
import { getLocalNotificationsBackend } from './localNotificationsBackend'

// Notificaciones del OS que el reset cancela: descanso (9601) + recordatorios (9602–9604).
export const RESET_NOTIFICATION_IDS: readonly number[] = [
  REST_NOTIFICATION_ID,
  ...Object.values(NOTIFICATION_IDS),
]

// Claves que sobreviven a IndexedDB y no deben sobrevivir al reset (spec §4.3.4).
export const RESET_LOCAL_STORAGE_KEYS: readonly string[] = [
  'gymLab-activeWorkout',
  'gymlab-goals',
  'gymlab-equipment',
  'gymlab.theme',
  'gymlab.palette',
  'gymlab.recentCalculators',
  'gymlab-pending-photo-angle',
]

export const RESET_SESSION_STORAGE_KEYS: readonly string[] = ['gymLab-preloadReload']

// Tabla mínima que el wipe necesita; db.tables las expone en runtime (nunca
// ALL_TABLES, que es la lista del backup y puede estar desactualizada).
export interface ResetTable {
  name: string
  clear: () => Promise<void>
}

export interface FactoryResetDeps {
  cancelNotifications: (ids: readonly number[]) => Promise<void>
  resetStores: () => void
  transaction: (scope: () => Promise<void>) => Promise<void>
  getTables: () => readonly ResetTable[]
  clearStorage: () => void
  reload: () => void
}

const defaultDeps: FactoryResetDeps = {
  cancelNotifications: async (ids) => {
    const backend = await getLocalNotificationsBackend()
    // Best-effort: una notificación que no existe (o un plugin caído) no bloquea el reset.
    await Promise.allSettled(ids.map((id) => backend.cancel(id)))
  },
  resetStores: () => {
    // ANTES de tocar storage: ningún writer debounced debe resucitar estado (D4).
    useActiveWorkoutStore.getState().reset()
    useEquipmentStore.getState().clear()
    useGoalStore.getState().reset()
  },
  // Una única transacción rw sobre TODAS las tablas reales de Dexie.
  transaction: (scope) => db.transaction('rw', db.tables, scope),
  getTables: () => db.tables.map((table) => ({ name: table.name, clear: () => table.clear() })),
  clearStorage: () => {
    for (const key of RESET_LOCAL_STORAGE_KEYS) window.localStorage.removeItem(key)
    for (const key of RESET_SESSION_STORAGE_KEYS) window.sessionStorage.removeItem(key)
  },
  reload: () => window.location.replace('/'),
}

// Ejecuta el wipe completo en el orden congelado. Cualquier fallo se propaga: la
// transacción es atómica (o se borra todo o nada) y la UI permite reintentar.
export const performFactoryReset = async (deps: FactoryResetDeps = defaultDeps): Promise<void> => {
  // 1) Notificaciones del OS: una alerta pendiente no debe sonar tras el reset.
  await deps.cancelNotifications(RESET_NOTIFICATION_IDS)
  // 2) Stores en memoria: evita que un writer diferido repueble storage o Dexie.
  deps.resetStores()
  // 3) Dexie: una sola transacción sobre db.tables (las 28 del schema).
  await deps.transaction(async () => {
    for (const table of deps.getTables()) {
      await table.clear()
    }
  })
  // 4) Claves de localStorage/sessionStorage que Dexie no toca.
  deps.clearStorage()
  // 5) Reload: providers.boot() re-siembra y el onboarding vuelve solo (spec §4.3.5).
  deps.reload()
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/data/factoryReset.test.ts` → **PASS** (5 casos).
Nota de implementación: el test importa el `db` REAL para contrastar `db.tables` contra las 28 esperadas, pero nunca abre IndexedDB (solo lee la lista de tablas declaradas). Si `factoryReset.ts` no importara `db`, este contraste perdería sentido: no lo quites.

- [ ] **Step 6: Run the full verification**

Run: `npm test` → verde. Run: `npm run build` → limpio.

- [ ] **Step 7: Review + commit**

Review RDD antes de commitear (ver Global Constraints).

```bash
git add src/data/factoryReset.ts tests/unit/data/factoryReset.test.ts src/store/goalStore.ts
git commit -m "feat: reset de fabrica ordenado con deps inyectables (F112 WP2)"
```

---

### Task 3 (WP3): "Zona de peligro" en Ajustes (sheets + type-to-confirm + i18n)

**Files:**
- Create: `src/domain/resetConfirmation.ts`
- Create: `tests/unit/domain/resetConfirmation.test.ts`
- Create: `src/hooks/useFactoryReset.ts`
- Create: `src/components/settings/DangerZoneSection.tsx`
- Create: `src/components/settings/ResetInfoSheet.tsx`
- Create: `src/components/settings/ResetConfirmSheet.tsx`
- Modify: `src/components/settings/index.ts` (agrega export)
- Modify: `src/pages/AjustesPage.tsx` (import + montaje tras `<DataSection />`, hoy línea 48)
- Modify: `src/i18n/locales/es/core.ts` (dentro de `ajustes`, tras `reporteErrorDescripcion`, línea 166)
- Modify: `src/i18n/locales/en/core.ts` (mismo punto)

**Interfaces:**
- Consumes: `performFactoryReset` (Task 2); `exportBackup`/`downloadBackup` (`src/data/backup.ts`); `useActiveWorkoutStore` (señal de sesión activa); `haptics` (`src/lib/haptics`); `track` (`src/lib/telemetry`); `Button`, `useCloseOnEscape`, `SectionLabel`.
- Produces (los usa Task 5 vía la UI y sus selectores): `matchesResetConfirmation(value)`, `RESET_CONFIRMATION_WORD = 'BORRAR'`, `DangerZoneSection`, `useFactoryReset()` → `{ run, busy, error, clearError }`.

**Decisión:** el gate de la palabra es un módulo de dominio propio (`src/domain/resetConfirmation.ts`) con test unitario, en vez de un helper local del componente. Alternativa: función privada en `ResetConfirmSheet.tsx` — se descarta porque no sería testeable sin RTL (el repo no tiene jsdom/RTL).

**Decisión:** copy es-ES con tuteo («Guarda el archivo antes de continuar», «Si tienes una sesión en curso…»), consistente con el resto de la app; la spec citaba voseo («guardá…», «tenés…»). Alternativa: copiar el voseo literal de la spec — se descarta por la convención de copy es-ES del repo (`AGENTS.md`).

- [ ] **Step 1: Write the failing test (word gate)**

Crea `tests/unit/domain/resetConfirmation.test.ts`:

```ts
// Gate del reset de fábrica (F112, D2): type-to-confirm con trim + case-insensitive.
import { describe, expect, it } from 'vitest'
import { matchesResetConfirmation, RESET_CONFIRMATION_WORD } from '@/domain/resetConfirmation'

describe('matchesResetConfirmation', () => {
  it('acepta la palabra exacta, con espacios y en cualquier caso', () => {
    expect(matchesResetConfirmation('BORRAR')).toBe(true)
    expect(matchesResetConfirmation('  borrar ')).toBe(true)
    expect(matchesResetConfirmation('Borrar')).toBe(true)
  })

  it('rechaza vacío, parciales y otras palabras', () => {
    expect(matchesResetConfirmation('')).toBe(false)
    expect(matchesResetConfirmation('BORRA')).toBe(false)
    expect(matchesResetConfirmation('borrar todo')).toBe(false)
    expect(matchesResetConfirmation('RESET')).toBe(false)
  })

  it('la palabra canónica es BORRAR', () => {
    expect(RESET_CONFIRMATION_WORD).toBe('BORRAR')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/domain/resetConfirmation.test.ts`
Expected: **FAIL** — no existe `src/domain/resetConfirmation.ts`.

- [ ] **Step 3: Implement the gate + hook**

Crea `src/domain/resetConfirmation.ts`:

```ts
// Palabra de confirmación del reset de fábrica (F112, D2): type-to-confirm para
// evitar resets accidentales. Pura y compartida por la UI y sus tests.
export const RESET_CONFIRMATION_WORD = 'BORRAR'

// Comparación trim + case-insensitive contra la palabra (spec §4.2.2).
export const matchesResetConfirmation = (value: string): boolean =>
  value.trim().toUpperCase() === RESET_CONFIRMATION_WORD
```

Crea `src/hooks/useFactoryReset.ts`:

```ts
// Hook delgado del reset de fábrica (112.1): expone busy/error y dispara el wipe.
import { useCallback, useState } from 'react'
import { performFactoryReset } from '@/data/factoryReset'

export const useFactoryReset = () => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  const clearError = useCallback(() => setError(false), [])

  const run = useCallback(async () => {
    setBusy(true)
    setError(false)
    try {
      // Si sale bien, performFactoryReset recarga la app y este estado se descarta.
      await performFactoryReset()
    } catch {
      // La transacción es atómica: no se borró nada a medias y se puede reintentar.
      setError(true)
      setBusy(false)
    }
  }, [])

  return { run, busy, error, clearError }
}
```

- [ ] **Step 4: Run the gate test**

Run: `npx vitest run tests/unit/domain/resetConfirmation.test.ts` → **PASS** (3 casos).

- [ ] **Step 5: Build the two sheets + section**

Crea `src/components/settings/ResetInfoSheet.tsx`:

```tsx
// Sheet informativo previo al reset (F112, 112.1): lista lo que se borra, avisa si
// hay sesión activa (D5) y ofrece backup primario + continuar sin backup (D3).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'
import { downloadBackup, exportBackup } from '@/data/backup'
import { track } from '@/lib/telemetry'

const RESET_ITEM_KEYS = [
  'resetItemEntrenos',
  'resetItemMedidasFotos',
  'resetItemPasos',
  'resetItemNutricion',
  'resetItemSuplementos',
  'resetItemLogros',
  'resetItemRutinas',
  'resetItemAjustesPerfil',
] as const

interface ResetInfoSheetProps {
  hasActiveSession: boolean
  onContinue: () => void
  onClose: () => void
}

export const ResetInfoSheet = ({ hasActiveSession, onContinue, onClose }: ResetInfoSheetProps) => {
  const { t } = useTranslation()
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupError, setBackupError] = useState(false)
  useCloseOnEscape(onClose)

  const handleBackup = async () => {
    setBackupBusy(true)
    setBackupError(false)
    try {
      // La entrega NO se verifica: el copy pide guardar el archivo antes de continuar.
      await downloadBackup(await exportBackup())
      track('data_exported', {})
    } catch {
      setBackupError(true)
    } finally {
      setBackupBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={t('ajustes.resetTitulo')}
        onClick={(e) => e.stopPropagation()}
        className="panel-floating w-full max-w-md rounded-t-3xl p-5 sm:rounded-3xl"
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-fg">{t('ajustes.resetTitulo')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('layout.confirm.close')}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:text-accent-soft"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <p className="text-sm text-muted">{t('ajustes.resetAvisoBackup')}</p>
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted">
          {RESET_ITEM_KEYS.map((key) => (
            <li key={key}>{t(`ajustes.${key}`)}</li>
          ))}
        </ul>
        {hasActiveSession && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-2 text-xs text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('ajustes.resetAvisoSesion')}
          </p>
        )}
        {backupError && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {t('ajustes.resetBackupError')}
          </p>
        )}
        <p className="mt-3 text-xs text-muted">{t('ajustes.resetBackupAviso')}</p>
        <div className="mt-2 flex flex-col gap-2">
          <Button className="w-full" onClick={() => void handleBackup()} disabled={backupBusy}>
            <Download className="size-4" aria-hidden />
            {t('ajustes.resetDescargarBackup')}
          </Button>
          <Button variant="outline" className="w-full" onClick={onContinue} disabled={backupBusy}>
            {t('ajustes.resetContinuar')}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

Crea `src/components/settings/ResetConfirmSheet.tsx`:

```tsx
// Confirmación fuerte del reset (F112, 112.1): type-to-confirm BORRAR (D2) con
// estado busy/error reintentable (la transacción es atómica: o todo o nada).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'
import { matchesResetConfirmation, RESET_CONFIRMATION_WORD } from '@/domain/resetConfirmation'
import { haptics } from '@/lib/haptics'

interface ResetConfirmSheetProps {
  busy: boolean
  error: boolean
  onConfirm: () => void
  onClose: () => void
}

export const ResetConfirmSheet = ({ busy, error, onConfirm, onClose }: ResetConfirmSheetProps) => {
  const { t } = useTranslation()
  const [word, setWord] = useState('')
  const confirmed = matchesResetConfirmation(word)
  useCloseOnEscape(onClose)

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={t('ajustes.resetConfirmTitulo')}
        onClick={(e) => e.stopPropagation()}
        className="panel-floating w-full max-w-md rounded-t-3xl p-5 sm:rounded-3xl"
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-fg">{t('ajustes.resetConfirmTitulo')}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={t('layout.confirm.close')}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:text-accent-soft disabled:opacity-50"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <label htmlFor="reset-confirm-word" className="text-sm text-muted">
          {t('ajustes.resetConfirmInstruccion', { palabra: RESET_CONFIRMATION_WORD })}
        </label>
        <input
          id="reset-confirm-word"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          aria-label={t('ajustes.resetConfirmPalabraLabel')}
          className="mt-2 h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm text-fg focus:border-danger focus:outline-none"
        />
        {error && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {t('ajustes.resetError')}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="danger"
            className="w-full"
            disabled={!confirmed || busy}
            onClick={() => {
              // Haptics del gesto destructivo (D2); no-op bajo reduced-motion.
              haptics(30)
              onConfirm()
            }}
          >
            {busy ? t('ajustes.resetEnProgreso') : t('ajustes.resetConfirmBoton')}
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose} disabled={busy}>
            {t('ajustes.cancelar')}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

Crea `src/components/settings/DangerZoneSection.tsx`:

```tsx
// Zona de peligro de Ajustes (F112, 112.1): reset de fábrica con backup sugerido
// (D3), type-to-confirm BORRAR (D2) y aviso si hay sesión activa (D5).
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useFactoryReset } from '@/hooks/useFactoryReset'
import { useActiveWorkoutStore } from '@/store/activeWorkoutStore'
import { SectionLabel } from './SettingsUI'
import { ResetInfoSheet } from './ResetInfoSheet'
import { ResetConfirmSheet } from './ResetConfirmSheet'

export const DangerZoneSection = () => {
  const { t } = useTranslation()
  const [sheet, setSheet] = useState<'info' | 'confirm' | null>(null)
  const { run, busy, error, clearError } = useFactoryReset()
  // D5: aviso (no bloqueo) si hay una sesión empezada con ejercicios cargados.
  const hasActiveSession = useActiveWorkoutStore(
    (s) => s.startedAt !== null && s.exercises.length > 0
  )

  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-danger" aria-hidden />
        <SectionLabel>{t('ajustes.zonaPeligro')}</SectionLabel>
      </div>
      <p className="mt-2 text-xs text-muted">{t('ajustes.resetFabricaDesc')}</p>
      <Button
        variant="outline"
        className="mt-2 w-full border-danger/50 text-danger hover:border-danger"
        onClick={() => {
          clearError()
          setSheet('info')
        }}
      >
        {t('ajustes.resetFabrica')}
      </Button>
      {sheet === 'info' && (
        <ResetInfoSheet
          hasActiveSession={hasActiveSession}
          onContinue={() => setSheet('confirm')}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'confirm' && (
        <ResetConfirmSheet
          busy={busy}
          error={error}
          onConfirm={() => void run()}
          onClose={() => {
            clearError()
            setSheet(null)
          }}
        />
      )}
    </section>
  )
}
```

- [ ] **Step 6: Wire the section into Ajustes**

`src/components/settings/index.ts` — agrega la línea (junto a las otras secciones):

```ts
export { DangerZoneSection } from './DangerZoneSection'
```

`src/pages/AjustesPage.tsx`:
- En el import de `@/components/settings` (líneas 8-16) agrega `DangerZoneSection` (después de `DataSection`).
- En el JSX, monta `<DangerZoneSection />` inmediatamente después de `<DataSection />` (hoy línea 48).

- [ ] **Step 7: Add the i18n keys (es/en)**

En `src/i18n/locales/es/core.ts`, dentro de `ajustes` y justo después de `reporteErrorDescripcion` (línea 166), agrega:

```ts
    zonaPeligro: 'Zona de peligro',
    resetFabrica: 'Resetear a estado de fábrica',
    resetFabricaDesc: 'Borra todos tus datos y deja la app como recién instalada.',
    resetTitulo: 'Resetear a estado de fábrica',
    resetAvisoBackup: 'Se borrará todo lo que hay en la app.',
    resetItemEntrenos: 'Entrenos, series y PRs',
    resetItemMedidasFotos: 'Medidas y fotos de progreso',
    resetItemPasos: 'Pasos diarios',
    resetItemNutricion: 'Nutrición',
    resetItemSuplementos: 'Suplementos',
    resetItemLogros: 'Logros y chapas',
    resetItemRutinas: 'Rutinas propias',
    resetItemAjustesPerfil: 'Ajustes y perfil',
    resetAvisoSesion: 'Si tienes una sesión en curso, se pierde.',
    resetBackupAviso: 'Guarda el archivo antes de continuar.',
    resetDescargarBackup: 'Descargar backup',
    resetContinuar: 'Continuar sin backup',
    resetBackupError: 'No se pudo generar el backup.',
    resetConfirmTitulo: 'Confirma el reset',
    resetConfirmInstruccion: 'Escribe {{palabra}} para habilitar el botón.',
    resetConfirmPalabraLabel: 'Palabra de confirmación',
    resetConfirmBoton: 'Resetear todo',
    resetEnProgreso: 'Borrando datos…',
    resetError: 'No se pudo completar el reset. Inténtalo de nuevo.',
```

En `src/i18n/locales/en/core.ts`, en el mismo punto de `ajustes`, agrega el espejo exacto:

```ts
    zonaPeligro: 'Danger zone',
    resetFabrica: 'Reset to factory state',
    resetFabricaDesc: 'Erases all your data and leaves the app as freshly installed.',
    resetTitulo: 'Reset to factory state',
    resetAvisoBackup: 'Everything in the app will be erased.',
    resetItemEntrenos: 'Workouts, sets and PRs',
    resetItemMedidasFotos: 'Measurements and progress photos',
    resetItemPasos: 'Daily steps',
    resetItemNutricion: 'Nutrition',
    resetItemSuplementos: 'Supplements',
    resetItemLogros: 'Achievements and medals',
    resetItemRutinas: 'Custom routines',
    resetItemAjustesPerfil: 'Settings and profile',
    resetAvisoSesion: 'You have a session in progress: resetting now will lose it.',
    resetBackupAviso: 'Save the file before continuing.',
    resetDescargarBackup: 'Download backup',
    resetContinuar: 'Continue without backup',
    resetBackupError: 'Could not generate the backup.',
    resetConfirmTitulo: 'Confirm the reset',
    resetConfirmInstruccion: 'Type {{palabra}} to enable the button.',
    resetConfirmPalabraLabel: 'Confirmation word',
    resetConfirmBoton: 'Reset everything',
    resetEnProgreso: 'Deleting data…',
    resetError: 'Could not complete the reset. Please try again.',
```

- [ ] **Step 8: Run the full verification**

Run: `npx vitest run tests/unit/domain/resetConfirmation.test.ts` → **PASS**.
Run: `npm test` → verde. Run: `npm run build` → limpio (la paridad es/en la fuerza el build; cualquier clave faltante rompe `EsSchema`).

- [ ] **Step 9: Review + commit**

Review RDD antes de commitear (ver Global Constraints).

```bash
git add src/domain/resetConfirmation.ts tests/unit/domain/resetConfirmation.test.ts src/hooks/useFactoryReset.ts src/components/settings/DangerZoneSection.tsx src/components/settings/ResetInfoSheet.tsx src/components/settings/ResetConfirmSheet.tsx src/components/settings/index.ts src/pages/AjustesPage.tsx src/i18n/locales/es/core.ts src/i18n/locales/en/core.ts
git commit -m "feat: zona de peligro con reset de fabrica en ajustes (F112 WP3)"
```

---

### Task 4 (WP4): Backup de 28 tablas + entrega nativa por share sheet

**Files:**
- Modify: `src/data/backup.ts` (lista en líneas 13-33; `downloadBackup` en 50-60)
- Create: `tests/unit/data/backup.test.ts`
- Modify: `src/components/settings/DataSection.tsx` (línea 33, dentro de `handleExport`)
- Modify: `package.json` + `package-lock.json` (por `npm install`)
- Modify (generados por `cap sync`): `android/capacitor.settings.gradle`, `android/app/capacitor.build.gradle`

**Interfaces:**
- Consumes: `db` (mock en tests), `Capacitor.isNativePlatform()` (`@capacitor/core`), `Filesystem.writeFile`/`Directory.Cache`/`Encoding.UTF8` (`@capacitor/filesystem`), `Share.share` (`@capacitor/share`).
- Produces (los usan Task 5 y `DataSection`): `ALL_TABLES` (28 nombres, exportada), `downloadBackup(backup): Promise<void>` (antes síncrona), `exportBackup`/`importBackup`/`parseBackup`/`BackupFile` sin cambios de contrato.

**Decisión:** el archivo se escribe en Cache como texto con `encoding: Encoding.UTF8` (docs de `@capacitor/filesystem`: sin `encoding` el plugin espera base64 de binarios; `Encoding.UTF8` es la forma correcta de escribir texto). Alternativa que mencionaba el borrador: mandar base64 — se descarta porque exige codificar el UTF-8 a mano y el plugin decodifica; Cache es compartible por el FileProvider por defecto (no hay que tocar `file_paths.xml`).

- [ ] **Step 1: Install the two approved plugins**

```bash
npm install @capacitor/share @capacitor/filesystem
```

Expected: `package.json` gana `"@capacitor/share": "^8.0.2"` y `"@capacitor/filesystem": "^8.1.3"` (versiones latest del registro al 2026-09-29; majors 8 compatibles con `@capacitor/core@^8.5.0`). No agregar ninguna otra dependencia.

- [ ] **Step 2: Write the failing test**

Crea `tests/unit/data/backup.test.ts`:

```ts
// Backup (F27 → F112 §6): exporta las 28 tablas del schema, importa archivos
// viejos de 19 tablas sin romper, no toca tablas vacías/ausentes y entrega en
// nativo escribiendo en Cache (UTF-8) + share sheet.
import { beforeEach, describe, expect, it, vi } from 'vitest'

// db doble: registra toArray/clear/bulkAdd por tabla y ejecuta el scope de la transacción.
const dbMock = vi.hoisted(() => {
  const state = {
    rows: {} as Record<string, unknown[]>,
    cleared: [] as string[],
    added: {} as Record<string, unknown[]>,
  }
  return {
    state,
    db: {
      table: (name: string) => ({
        toArray: async () => state.rows[name] ?? [],
        clear: async () => {
          state.cleared.push(name)
        },
        bulkAdd: async (rows: unknown[]) => {
          state.added[name] = rows
        },
      }),
      transaction: async (_mode: string, _tables: unknown, scope: () => Promise<void>) => scope(),
    },
  }
})

vi.mock('@/data/repositories/dexie/db', () => ({ db: dbMock.db }))
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => true) },
}))
vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: { writeFile: vi.fn(async () => ({ uri: 'file:///data/cache/gymlab-backup.json' })) },
}))
vi.mock('@capacitor/share', () => ({
  Share: { share: vi.fn(async () => ({})) },
}))

import type { BackupFile } from '@/data/backup'

const { ALL_TABLES, downloadBackup, exportBackup, importBackup } = await import('@/data/backup')
const { Filesystem } = await import('@capacitor/filesystem')
const { Share } = await import('@capacitor/share')

// Las 28 tablas del schema Dexie (db.ts v13), en orden de declaración.
const EXPECTED_TABLES = [
  'exercises',
  'routines',
  'routineDays',
  'routineItems',
  'workouts',
  'workoutSets',
  'papers',
  'guides',
  'profile',
  'activeProgram',
  'prs',
  'meta',
  'socialProfiles',
  'posts',
  'postMedia',
  'bodyWeight',
  'dailySteps',
  'exerciseNotes',
  'bodyMeasurements',
  'skinfolds',
  'sessionJournals',
  'benchmarkResults',
  'foods',
  'mealEntries',
  'supplements',
  'progressPhotos',
  'workoutTemplates',
  'periodizationPlans',
]

const backupWith = (tables: Record<string, unknown[]>): BackupFile => ({
  app: 'GymLab',
  version: 1,
  exportedAt: '2026-09-29T10:00:00.000Z',
  tables,
})

const writeFile = Filesystem.writeFile as unknown as ReturnType<typeof vi.fn>
const share = Share.share as unknown as ReturnType<typeof vi.fn>

describe('backup (F112 §6)', () => {
  beforeEach(() => {
    dbMock.state.rows = {}
    dbMock.state.cleared = []
    dbMock.state.added = {}
    writeFile.mockClear()
    share.mockClear()
  })

  it('ALL_TABLES cubre exactamente las 28 tablas del schema', () => {
    expect(ALL_TABLES).toHaveLength(28)
    expect([...ALL_TABLES].sort()).toEqual([...EXPECTED_TABLES].sort())
  })

  it('exportBackup vuelca las 28 tablas aunque estén vacías', async () => {
    const backup = await exportBackup()
    expect(Object.keys(backup.tables).sort()).toEqual([...EXPECTED_TABLES].sort())
    expect(backup.app).toBe('GymLab')
    expect(backup.version).toBe(1)
  })

  it('importBackup de un archivo viejo (19 tablas) no rompe y solo toca las presentes', async () => {
    const count = await importBackup(
      backupWith({ workouts: [{ id: 1 }], meta: [{ key: 'a', value: '1' }] }),
    )
    expect(count).toBe(2)
    expect(dbMock.state.cleared).toEqual(['workouts', 'meta'])
    expect(dbMock.state.added['workouts']).toEqual([{ id: 1 }])
  })

  it('las tablas ausentes o vacías no se limpian', async () => {
    await importBackup(backupWith({ workouts: [], foods: [{ id: 7 }] }))
    expect(dbMock.state.cleared).toEqual(['foods'])
  })

  it('en nativo escribe el JSON en Cache (UTF-8) y abre el share sheet con el archivo', async () => {
    await downloadBackup(backupWith({ workouts: [{ id: 1 }] }))
    expect(writeFile).toHaveBeenCalledTimes(1)
    const args = writeFile.mock.calls[0][0] as {
      path: string
      data: string
      directory: string
      encoding: string
    }
    expect(args.directory).toBe('CACHE')
    expect(args.encoding).toBe('utf8')
    expect(args.path).toMatch(/^gymlab-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(args.data).toContain('"app": "GymLab"')
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ files: ['file:///data/cache/gymlab-backup.json'] }),
    )
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/data/backup.test.ts`
Expected: **FAIL** — `ALL_TABLES` no está exportada y tiene 19 (no 28); `downloadBackup` no llama a `Filesystem.writeFile` ni a `Share.share`.

- [ ] **Step 4: Implement the 28-table list + native delivery**

En `src/data/backup.ts`, reemplaza el encabezado de imports y la lista `ALL_TABLES` (hoy líneas 3 y 13-33), y `downloadBackup` (hoy líneas 49-60):

```ts
// Backup/restore completo de la base (IndexedDB) a un archivo JSON.
// La entrega ramifica: en nativo se escribe en Cache y se abre el share sheet
// del sistema (el WebView de Android no maneja descargas ni navigator.share);
// en web se mantiene el <a download> de siempre.
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { db } from './repositories/dexie/db'
```

```ts
// Lista explícita de tablas incluidas en el backup: las 28 del schema Dexie
// (F112 §6). Al agregar una tabla al schema, sumarla acá: exportBackup la cubre
// y las tablas ausentes de un backup viejo se ignoran al importar (?? []).
export const ALL_TABLES = [
  'exercises',
  'routines',
  'routineDays',
  'routineItems',
  'workouts',
  'workoutSets',
  'papers',
  'guides',
  'profile',
  'activeProgram',
  'prs',
  'meta',
  'socialProfiles',
  'posts',
  'postMedia',
  'bodyWeight',
  'bodyMeasurements',
  'skinfolds',
  'exerciseNotes',
  'dailySteps',
  'sessionJournals',
  'benchmarkResults',
  'foods',
  'mealEntries',
  'supplements',
  'progressPhotos',
  'workoutTemplates',
  'periodizationPlans',
] as const
```

```ts
const backupFileName = (): string =>
  `gymlab-backup-${new Date().toISOString().slice(0, 10)}.json`

// Nativo: escribe el JSON como texto UTF-8 en Cache (compartible por el
// FileProvider por defecto) y abre el share sheet para guardar/compartir.
const downloadNative = async (json: string): Promise<void> => {
  const { uri } = await Filesystem.writeFile({
    path: backupFileName(),
    data: json,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })
  await Share.share({ title: 'GymLab', dialogTitle: 'GymLab', files: [uri] })
}

// Entrega del backup: ramifica por plataforma. La entrega NO se verifica; el
// copy del flujo pide guardar el archivo antes de continuar (spec §4.2).
export const downloadBackup = async (backup: BackupFile): Promise<void> => {
  const json = JSON.stringify(backup, null, 2)
  if (Capacitor.isNativePlatform()) {
    await downloadNative(json)
    return
  }
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backupFileName()
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
```

El resto (`exportBackup`, `parseBackup`, `importBackup`) queda **igual**: `parseBackup` no compara versión y `importBackup` ya salta tablas ausentes/vacías (`?? []` + `if (rows.length === 0) continue`).

- [ ] **Step 5: Await the now-async delivery in DataSection**

En `src/components/settings/DataSection.tsx`, `handleExport` (hoy líneas 29-41) pasa a esperar la entrega:

```ts
      const backup = await exportBackup()
      await downloadBackup(backup)
```

(es el único cambio; el `catch` ya muestra `backupExportError`).

- [ ] **Step 6: Run tests + build + sync native**

Run: `npx vitest run tests/unit/data/backup.test.ts` → **PASS** (5 casos).
Run: `npm test` → verde. Run: `npm run build` → limpio.
Run: `npx cap sync android` → debe reportar `capacitor-share` y `capacitor-filesystem` y actualizar los dos gradle.

Comprueba en `android/capacitor.settings.gradle` que aparecen:

```
include ':capacitor-filesystem'
include ':capacitor-share'
```

y en `android/app/capacitor.build.gradle` las dos líneas `implementation project(':capacitor-filesystem')` / `(':capacitor-share')`.

- [ ] **Step 7: Review + commit**

Review RDD antes de commitear (ver Global Constraints).

```bash
git add package.json package-lock.json src/data/backup.ts tests/unit/data/backup.test.ts src/components/settings/DataSection.tsx android/capacitor.settings.gradle android/app/capacitor.build.gradle
git commit -m "feat: backup de 28 tablas con entrega nativa por share sheet (F112 WP4)"
```

---

### Task 5 (WP5): E2E + smoke de emulador + docs de fase

**Files:**
- Create: `tests/e2e/test_f112_reset.py`
- Create: `tests/e2e/test_f112_reconcile.py`
- Modify: `PLAN.md` (líneas 600-601)
- Modify: `CHANGELOG.md` (`[Unreleased]`)

**Interfaces:**
- Consumes: todo lo entregado en Tasks 1-4; helpers del canal e2e (`tests/e2e/scripts/with_server.py`); receta de emulador de `gymlab-app/AGENTS.md`.
- Produces: cobertura e2e de los dos flujos + docs de fase.

**Decisión:** el e2e de reconciliación vive en su propio archivo (`test_f112_reconcile.py`) y no dentro de `test_f112_reset.py`. Motivo: cada flujo siembra y limpia un estado distinto (el reset borra todo; la reconciliación necesita sobrevivir a un borrado con logros persistidos), y mezclarlos haría un test largo y frágil. Alternativa: un único archivo con dos funciones — se descarta por aislamiento de fallos.

- [ ] **Step 1: Write `test_f112_reset.py`**

Crea `tests/e2e/test_f112_reset.py`:

```python
"""Fase 112.1: reset de fábrica desde Ajustes (backup sugerido + type-to-confirm).

Escenarios (viewport 375x812), datos sembrados directamente en IndexedDB:
  R1. La "Zona de peligro" existe en /ajustes; el sheet informativo lista lo que se
      borra, avisa de la sesión activa y muestra backup primario + continuar sin backup.
  R2. "Descargar backup" dispara la descarga web del JSON (gymlab-backup-*.json).
  R3. Gate de palabra: "borra" deja el CTA "Resetear todo" deshabilitado; "  borrar "
      (minúsculas + espacios) lo habilita.
  R4. Confirmar recarga en / con onboarding visible, catálogo sembrado, 0 workouts,
      meta sin datos de usuario, claves de storage eliminadas y 0 pageerror.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

SEED_APP_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'meta'], 'readwrite');
    const ex = tx.objectStore('exercises');
    ex.put({ id: 999, slug: 'sentadilla-f112', name: 'Sentadilla F112', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: JSON.stringify({ units: 'kg', showRpe: true, showRir: true }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Dato de usuario (workout + serie) y claves de storage que el reset debe borrar.
SEED_USER_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const iso = new Date().toISOString();
  await new Promise((res, rej) => {
    const tx = db.transaction(['workouts', 'workoutSets'], 'readwrite');
    tx.objectStore('workouts').put({ id: 9001, startedAt: iso, finishedAt: iso, routineId: null, routineDayId: null, localDate: '2026-09-29', notes: 'F112', totalVolume: 0 });
    tx.objectStore('workoutSets').put({ id: 9101, workoutId: 9001, exerciseId: 999, setNumber: 1, weightKg: 60, reps: 8, completed: true, createdAt: iso });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  window.localStorage.setItem('gymlab-goals', JSON.stringify({ state: { goals: { 999: 120 } }, version: 0 }));
  window.localStorage.setItem('gymlab-equipment', JSON.stringify({ state: { selected: ['barra'] }, version: 0 }));
  window.sessionStorage.setItem('gymLab-preloadReload', '1');
  return true;
}"""

# Sesión activa en memoria (sin tocar Dexie): dispara el aviso del sheet informativo.
START_SESSION_JS = """async () => {
  const { useActiveWorkoutStore } = await import('/src/store/activeWorkoutStore.ts');
  useActiveWorkoutStore.getState().startWorkout();
  useActiveWorkoutStore.getState().addExercise(999, 'Sentadilla F112');
  return useActiveWorkoutStore.getState().exercises.length;
}"""

READ_FRESH_STATE_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const all = (store) => new Promise((res, rej) => {
    const r = db.transaction(store, 'readonly').objectStore(store).getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const [workouts, exercises, meta] = await Promise.all([all('workouts'), all('exercises'), all('meta')]);
  const metaValue = (key) => {
    const row = meta.find((m) => m.key === key);
    return row ? row.value : null;
  };
  return {
    workouts: workouts.length,
    exercises: exercises.length,
    seedVersion: metaValue('seedVersion'),
    unlocked: metaValue('unlockedAchievements'),
    onboardingDone: metaValue('onboardingDone'),
  };
}"""


def dismiss_overlays(page, timeout_ms=6000):
    # Sembrar workouts puede desbloquear logros y abrir su modal (z-50), que
    # intercepta los clics. Avanza la cola hasta que no quede ningún overlay.
    deadline = timeout_ms
    while deadline > 0:
        overlay = page.locator("div.fixed.inset-0.z-50")
        if overlay.count() == 0:
            return
        btn = overlay.locator("button").last
        if btn.count() > 0:
            btn.click(timeout=2000)
        else:
            page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        deadline -= 300


def boot(page):
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(700)
    assert page.evaluate(SEED_APP_JS) is True, "seed app fallo"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(900)
    assert page.evaluate(SEED_USER_JS) is True, "seed de usuario fallo"
    page.goto(f"{BASE}/ajustes", wait_until="networkidle")
    page.wait_for_timeout(1000)
    dismiss_overlays(page)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812}, accept_downloads=True)
        pageerrors = []
        page.on("pageerror", lambda e: pageerrors.append(f"pageerror: {e}"))
        try:
            boot(page)

            # R1 — sesión activa + sheet informativo.
            if page.evaluate(START_SESSION_JS) != 1:
                errors.append("R1: no se pudo sembrar la sesión activa")
            page.locator("button", has_text="Resetear a estado de fábrica").first.click(timeout=5000)
            page.wait_for_selector('div[role="alertdialog"]', state="visible", timeout=5000)
            sheet = page.locator('div[role="alertdialog"]')
            sheet_text = sheet.inner_text()
            if "Entrenos" not in sheet_text:
                errors.append("R1: el sheet no lista lo que se borra")
            if "sesión en curso" not in sheet_text:
                errors.append("R1: falta el aviso de sesión activa")
            if sheet.locator("button", has_text="Continuar sin backup").count() == 0:
                errors.append("R1: falta el botón secundario")
            else:
                print("OK R1: sheet informativo con lista, aviso de sesión y secundario")

            # R2 — backup: descarga web del JSON.
            with page.expect_download() as dl_info:
                sheet.locator("button", has_text="Descargar backup").first.click(timeout=5000)
            download = dl_info.value
            name = download.suggested_filename
            if not name.startswith("gymlab-backup-") or not name.endswith(".json"):
                errors.append(f"R2: nombre de backup inesperado ({name})")
            else:
                print(f"OK R2: backup descargado como {name}")

            # R3 — gate de palabra.
            sheet.locator("button", has_text="Continuar sin backup").first.click(timeout=5000)
            page.wait_for_timeout(300)
            cta = page.locator('div[role="alertdialog"] button', has_text="Resetear todo").first
            page.fill("#reset-confirm-word", "borra")
            page.wait_for_timeout(200)
            if not cta.is_disabled():
                errors.append("R3: con 'borra' el CTA ya está habilitado")
            page.fill("#reset-confirm-word", "  borrar ")
            page.wait_for_timeout(200)
            if cta.is_disabled():
                errors.append("R3: con '  borrar ' el CTA sigue deshabilitado")
                raise AssertionError("R3: el gate no habilita el reset")
            print("OK R3: el gate bloquea 'borra' y habilita '  borrar '")

            # R4 — wipe + reload.
            cta.click(timeout=5000)
            page.wait_for_url(f"{BASE}/", timeout=15000)
            page.wait_for_selector('div[role="dialog"]', state="visible", timeout=30000)
            dialog_text = page.locator('div[role="dialog"]').first.inner_text().lower()
            if "idioma" not in dialog_text:
                errors.append("R4: el overlay visible no parece el onboarding")

            state = None
            for _ in range(60):
                state = page.evaluate(READ_FRESH_STATE_JS)
                if state["seedVersion"] == "23":
                    break
                page.wait_for_timeout(500)
            if state is None or state["seedVersion"] != "23":
                errors.append(f"R4: el catálogo no se re-sembró ({state})")
            elif state["workouts"] != 0 or state["unlocked"] is not None or state["onboardingDone"] is not None:
                errors.append(f"R4: quedó estado de usuario tras el reset ({state})")
            elif state["exercises"] == 0:
                errors.append("R4: catálogo vacío tras el reset")
            else:
                print(f"OK R4: catálogo sembrado ({state['exercises']} ejercicios) y estado limpio")

            goals = page.evaluate("() => window.localStorage.getItem('gymlab-goals')")
            equipment = page.evaluate("() => window.localStorage.getItem('gymlab-equipment')")
            preload = page.evaluate("() => window.sessionStorage.getItem('gymLab-preloadReload')")
            if goals is not None or equipment is not None or preload is not None:
                errors.append(
                    f"R4: claves de storage sin limpiar (goals={goals}, equipment={equipment}, preload={preload})"
                )
            else:
                print("OK R4: claves de localStorage/sessionStorage eliminadas")
        except Exception as e:  # noqa: BLE001
            errors.append(f"Exception: {e}")
        finally:
            errors.extend(pageerrors)
            page.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F112.1 reset de fábrica (sheet, backup, gate de palabra y wipe)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Run the reset e2e**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f112_reset.py`
Expected: **ALL OK** (R1, R2, R3 y R4 impresos). Si algo falla, es un bug real de Tasks 2/3: diagnosticarlo antes de seguir (skill `systematic-debugging`), corregir y re-correr.

- [ ] **Step 3: Write `test_f112_reconcile.py`**

Crea `tests/e2e/test_f112_reconcile.py`:

```python
"""Fase 112.2: borrar una sesión re-bloquea sus logros sin flood de modales y
volver a ganarlos cuenta ×1 (F112 §5, D6/D7).

Escenarios (viewport 375x812), datos sembrados directamente en IndexedDB:
  R1. Con una sesión completada, 'primer-paso' e 'inaugural' se desbloquean (modal
      visible + meta persistida con contadores ×1) y el ConfirmSheet de borrado
      menciona el recálculo de logros.
  R2. Borrar esa única sesión re-bloquea ambos: meta vuelve a [] / {} sin modal nuevo.
  R3. Volver a ganarlos muestra el modal otra vez y el contador queda en ×1 (fresco).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

SEED_APP_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'meta'], 'readwrite');
    const ex = tx.objectStore('exercises');
    ex.put({ id: 999, slug: 'sentadilla-f112r', name: 'Sentadilla F112R', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: JSON.stringify({ units: 'kg', showRpe: true, showRir: true }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Una única sesión con una serie completada: desbloquea primer-paso + inaugural.
SEED_FIRST_WORKOUT_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const iso = new Date().toISOString();
  await new Promise((res, rej) => {
    const tx = db.transaction(['workouts', 'workoutSets'], 'readwrite');
    tx.objectStore('workouts').put({ id: 9001, startedAt: iso, finishedAt: iso, routineId: null, routineDayId: null, localDate: '2026-09-29', notes: '', totalVolume: 0 });
    tx.objectStore('workoutSets').put({ id: 9101, workoutId: 9001, exerciseId: 999, setNumber: 1, weightKg: 60, reps: 8, completed: true, createdAt: iso });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Nueva sesión completada (otro id) para volver a ganar los logros.
SEED_REGAIN_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const iso = new Date().toISOString();
  await new Promise((res, rej) => {
    const tx = db.transaction(['workouts', 'workoutSets'], 'readwrite');
    tx.objectStore('workouts').put({ id: 9004, startedAt: iso, finishedAt: iso, routineId: null, routineDayId: null, localDate: '2026-09-30', notes: '', totalVolume: 0 });
    tx.objectStore('workoutSets').put({ id: 9104, workoutId: 9004, exerciseId: 999, setNumber: 1, weightKg: 65, reps: 8, completed: true, createdAt: iso });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

READ_ACHIEVEMENTS_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const meta = await new Promise((res, rej) => {
    const r = db.transaction('meta', 'readonly').objectStore('meta').getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const parse = (key) => {
    const row = meta.find((m) => m.key === key);
    if (!row || row.value == null) return null;
    try { return JSON.parse(row.value); } catch { return row.value; }
  };
  return {
    unlocked: parse('unlockedAchievements'),
    counts: parse('achievementCounts') || {},
  };
}"""


def dismiss_overlays(page, timeout_ms=6000):
    deadline = timeout_ms
    while deadline > 0:
        overlay = page.locator("div.fixed.inset-0.z-50")
        if overlay.count() == 0:
            return
        btn = overlay.locator("button").last
        if btn.count() > 0:
            btn.click(timeout=2000)
        else:
            page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        deadline -= 300


def read_achievements(page):
    return page.evaluate(READ_ACHIEVEMENTS_JS)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        pageerrors = []
        page.on("pageerror", lambda e: pageerrors.append(f"pageerror: {e}"))
        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(700)
            assert page.evaluate(SEED_APP_JS) is True, "seed app fallo"
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(700)
            assert page.evaluate(SEED_FIRST_WORKOUT_JS) is True, "seed del workout fallo"
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1500)
            dismiss_overlays(page)

            # R1 — desbloqueo inicial persistido ×1.
            meta = None
            for _ in range(20):
                meta = read_achievements(page)
                if meta["unlocked"] and "primer-paso" in meta["unlocked"]:
                    break
                page.wait_for_timeout(300)
            if not meta or not meta["unlocked"] or "inaugural" not in meta["unlocked"]:
                errors.append(f"R1: no se desbloquearon los logros esperados ({meta})")
            elif meta["counts"].get("primer-paso") != 1 or meta["counts"].get("inaugural") != 1:
                errors.append(f"R1: contadores iniciales inesperados ({meta['counts']})")
            else:
                print("OK R1: la sesión completada desbloquea primer-paso e inaugural (x1)")

            # R2 — borrado de la única sesión: re-bloqueo sin flood.
            page.goto(f"{BASE}/entrenamiento/9001", wait_until="networkidle")
            page.wait_for_timeout(1100)
            dismiss_overlays(page)
            page.locator("button", has_text="Eliminar sesión").first.click(timeout=5000)
            page.wait_for_selector('div[role="alertdialog"]', state="visible", timeout=5000)
            if "logros" not in page.locator('div[role="alertdialog"]').first.inner_text():
                errors.append("R2: el confirm de borrado no menciona el recálculo de logros")
            page.locator('div[role="alertdialog"] button', has_text="Eliminar sesión").first.click(timeout=5000)
            page.wait_for_timeout(1500)
            if page.locator("div.fixed.inset-0.z-50").count() != 0:
                errors.append("R2: apareció un modal de logros tras el re-bloqueo (flood)")

            meta = None
            for _ in range(20):
                meta = read_achievements(page)
                if not meta["unlocked"] and not meta["counts"]:
                    break
                page.wait_for_timeout(300)
            if meta["unlocked"]:
                errors.append(f"R2: los logros no se re-bloquearon ({meta['unlocked']})")
            elif meta["counts"]:
                errors.append(f"R2: los contadores no se limpiaron ({meta['counts']})")
            else:
                print("OK R2: re-bloqueo sin modal y contadores limpios")

            # R3 — re-logro: modal de nuevo y contador fresco ×1.
            assert page.evaluate(SEED_REGAIN_JS) is True, "seed de re-logro fallo"
            page.reload(wait_until="networkidle")
            try:
                page.wait_for_selector("div.fixed.inset-0.z-50", state="visible", timeout=8000)
                print("OK R3: el modal volvió a celebrar el re-logro")
            except Exception:  # noqa: BLE001
                errors.append("R3: no reapareció el modal al volver a ganar los logros")
            meta = None
            for _ in range(20):
                meta = read_achievements(page)
                if meta["unlocked"] and meta["counts"]:
                    break
                page.wait_for_timeout(300)
            if meta["counts"].get("primer-paso") != 1 or meta["counts"].get("inaugural") != 1:
                errors.append(f"R3: el contador no quedó fresco x1 ({meta['counts']})")
            elif "primer-paso" not in (meta["unlocked"] or []) or "inaugural" not in (meta["unlocked"] or []):
                errors.append(f"R3: los logros no volvieron a persistirse ({meta})")
            else:
                print("OK R3: re-logro persistido con contador x1")
        except Exception as e:  # noqa: BLE001
            errors.append(f"Exception: {e}")
        finally:
            errors.extend(pageerrors)
            page.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F112.2 reconciliación de logros (re-bloqueo sin flood y re-logro x1)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run the reconcile e2e**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f112_reconcile.py`
Expected: **ALL OK** (R1, R2 y R3). Si falla, diagnosticar en el dominio/hook de Task 1 antes de seguir.

- [ ] **Step 5: Emulator smoke (obligatorio: WP4 tocó plugins nativos)**

Receta de `gymlab-app/AGENTS.md` (emulador `emulator-5554`; `adb` NO está en el PATH):

```powershell
# Desde .worktrees\f112\gymlab-app
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb devices -l          # si no hay device: & "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Pixel_10
npm run android:sync       # build + cap sync (incluye los 2 plugins nuevos)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\android\gradlew.bat -p .\android assembleDebug    # timeout largo (600000 ms)
& $adb install -r android\app\build\outputs\apk\debug\app-debug.apk
& $adb shell pm clear com.gymlab.app   # estado limpio: la app arranca en onboarding (es)
& $adb shell am start -n com.gymlab.app/.MainActivity
Start-Sleep -Seconds 6
$appPid = (& $adb shell pidof com.gymlab.app).Trim()
& $adb forward tcp:9222 localabstract:webview_devtools_remote_$appPid
```

Script CDP 1 — monta, navega a Ajustes y dispara el backup (`C:\Users\Yves De Faria\AppData\Local\Temp\opencode\f112\cdp_backup.py`):

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp("http://localhost:9222")
    page = browser.contexts[0].pages[0]
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.wait_for_timeout(1500)
    children = page.evaluate("document.getElementById('root').children.length")
    assert children > 0, "PANTALLA NEGRA: la app no montó"
    # Tras `pm clear` la app arranca en onboarding: cerrarlo para navegar a Ajustes.
    skip = page.locator("button", has_text="Ya entreno aquí")
    if skip.count() > 0:
        skip.first.click(timeout=5000)
        page.wait_for_timeout(800)
    page.evaluate("window.history.pushState({}, '', '/ajustes'); window.dispatchEvent(new PopStateEvent('popstate'))")
    page.wait_for_timeout(1200)
    assert "Zona de peligro" in page.evaluate("document.body.innerText"), "falta la zona de peligro"
    page.locator("button", has_text="Resetear a estado de fábrica").first.click()
    page.wait_for_selector('div[role="alertdialog"]', state="visible", timeout=5000)
    page.locator('div[role="alertdialog"] button', has_text="Descargar backup").first.click()
    page.wait_for_timeout(2500)
    assert not errors, f"pageerrors: {errors}"
    print("app montada, zona de peligro visible y backup disparado")
```

Con el share sheet abierto, verificar en PowerShell que el foco salió de la app y que el JSON está en Cache:

```powershell
& $adb shell dumpsys window | Select-String "mCurrentFocus"
# Esperado: el resolver del sistema (ChooserActivity / IntentResolver), NO com.gymlab.app/.MainActivity.
& $adb shell run-as com.gymlab.app ls cache | Select-String "gymlab-backup"
# Esperado: gymlab-backup-2026-09-29.json (el JSON quedó escrito en Cache).
& $adb shell run-as com.gymlab.app cat cache/gymlab-backup-2026-09-29.json | Select-Object -First 3
# Esperado: el JSON con "app": "GymLab" (ajustar el nombre del archivo a la fecha real).
& $adb shell input keyevent 4   # BACK: cierra el share sheet
```

Script CDP 2 — reset completo hasta estado limpio (`C:\Users\Yves De Faria\AppData\Local\Temp\opencode\f112\cdp_reset.py`):

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp("http://localhost:9222")
    page = browser.contexts[0].pages[0]
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.wait_for_timeout(1000)
    page.evaluate("window.history.pushState({}, '', '/ajustes'); window.dispatchEvent(new PopStateEvent('popstate'))")
    page.wait_for_timeout(1200)
    page.locator("button", has_text="Resetear a estado de fábrica").first.click()
    page.wait_for_selector('div[role="alertdialog"]', state="visible", timeout=5000)
    page.locator('div[role="alertdialog"] button', has_text="Continuar sin backup").first.click()
    page.wait_for_selector("#reset-confirm-word", state="visible", timeout=5000)
    page.fill("#reset-confirm-word", "BORRAR")
    page.locator('div[role="alertdialog"] button', has_text="Resetear todo").first.click()
    page.wait_for_timeout(6000)
    children = page.evaluate("document.getElementById('root').children.length")
    body = page.evaluate("document.body.innerText")
    assert children > 0, "PANTALLA NEGRA tras el reset"
    assert "idioma" in body.lower(), "el onboarding no volvió tras el reset"
    assert not errors, f"pageerrors: {errors}"
    print({"children": children, "onboarding": True, "errors": errors})
```

Criterio de aceptación del smoke: la app monta (`root children > 0`), el share sheet abre con el JSON en Cache, el reset deja onboarding + catálogo sembrado y **0 `pageerror`** en ambos scripts. Reportar la salida exacta en el resumen de la fase.

- [ ] **Step 6: Update PLAN.md and CHANGELOG.md**

`PLAN.md` (líneas 600-601) — marcar los dos checkboxes:

```markdown
- [x] **112.1 — Colocar un botón de reset de datos en la app en ajustes** para poder ponerlo como de fábrica; debe tener confirmación y debe sugerir hacer un backup antes de realizar.
- [x] **112.2 — Poder borrar data parcialmente** al poder borrar días de entrenos para no tener que hacer reset global, así si hemos metido datos de prueba o por equivocación se puede corregir.
```

`CHANGELOG.md` — en `[Unreleased]`, agregar bajo `### Added`:

```markdown
- **Reset de fábrica, backup completo de 28 tablas y entrega nativa por share sheet (F112, `feat`)**: Ajustes gana la "Zona de peligro" con el botón "Resetear a estado de fábrica"; el flujo es de 3 pasos (sheet informativo con la lista de lo que se borra, aviso si hay sesión activa y backup primario + "Continuar sin backup"; type-to-confirm `BORRAR` con haptics; ejecución con busy/error reintentable). El wipe respeta el orden congelado (D4) — cancela las notificaciones del OS 9601–9604, resetea los stores en memoria (incluido un `reset()` nuevo en `goalStore`), limpia las **28 tablas reales** de Dexie (`db.tables`, nunca `ALL_TABLES`) en una única transacción `rw`, borra las 7 claves exactas de localStorage + `gymLab-preloadReload` de sessionStorage y recarga con `window.location.replace('/')`, con lo que `providers.boot()` re-siembra y el onboarding vuelve solo. El módulo `src/data/factoryReset.ts` usa dependencias inyectables (patrón `workoutDeletion`) y su test fija orden, 28 tablas, claves y fallos. El backup pasa de 19 a 28 tablas (se suman `dailySteps`, `sessionJournals`, `benchmarkResults`, `foods`, `mealEntries`, `supplements`, `progressPhotos`, `workoutTemplates`, `periodizationPlans`; `importBackup` sin cambios: las tablas ausentes/vacías no se tocan) y `downloadBackup` ramifica: en nativo escribe el JSON en Cache (UTF-8) y abre el share sheet del sistema con `@capacitor/share@8.0.2` + `@capacitor/filesystem@8.1.3` (los 2 plugins aprobados; `npx cap sync android` actualiza el proyecto nativo), en web mantiene el anchor de descarga. i18n es/en completa (`ajustes.*`) y `EsSchema` fuerza la paridad. Verificado: TDD rojo→verde en cada módulo, `npm test` con la suite completa y `npm run build` limpios, e2e `test_f112_reset.py` y `test_f112_reconcile.py` ALL OK, y smoke en emulador (Pixel_10): app montada, share sheet abierto con el JSON en Cache, reset completo con onboarding + catálogo y 0 `pageerror`.
```

Y bajo `### Fixed`:

```markdown
- **Los logros y chapas se recalculan cuando los datos que los sostenían desaparecen (F112.2, `fix`)**: borrar una sesión (o importar, o resetear) deja de dejar desbloqueos huérfanos en `meta`. Nueva función pura `reconcileAchievementState` (`src/domain/achievementReconcile.ts`): `unlocked := unlocked ∩ earned`, contadores restringidos a los logros sostenidos (un re-bloqueo pierde su contador y el re-logro vuelve a contar ×1), `snapshot := earned` y chapas retrocedidas de forma determinística (`grantedCollectibles` recomputado). `useAchievements` la integra tras `earnedIds` con **escrituras solo-si-cambió** (estado idéntico ⇒ patch vacío), `freshIds` calculado contra el `savedIds` **pre-reconciliación** (re-bloquear no dispara modal; volver a ganarlo sí, D7) y `counts` fuera de la firma del effect (sin loops). El `ConfirmSheet` del borrado agrega la línea "También se recalcularán tus logros". `deleteWorkoutSession` no cambia: la re-evaluación hace el trabajo. Verificado: TDD rojo→verde (`tests/unit/domain/achievementReconcile.test.ts`), e2e `test_f112_reconcile.py` ALL OK (re-bloqueo sin flood y re-logro ×1) y regresión completa de la suite.
```

Nota: al pegar la entrada, reemplazar «`npm test` con la suite completa» por el conteo real que imprima `npm test` en la corrida (mismo criterio que las entradas recientes del CHANGELOG: la verificación se documenta con la salida observada).

- [ ] **Step 7: Review + commit**

Review RDD antes de commitear (ver Global Constraints).

```bash
git add tests/e2e/test_f112_reset.py tests/e2e/test_f112_reconcile.py PLAN.md CHANGELOG.md
git commit -m "test(e2e): reset de fabrica y reconciliacion de logros; docs de F112 (F112 WP5)"
```

---

## Self-Review (hecho al escribir el plan)

- **Cobertura de la spec**: §4.1 (sección `DangerZoneSection` tras `DataSection`) → Task 3 Step 6; §4.2 (3 pasos del flujo: sheet informativo con backup primario + continuar + aviso de sesión, type-to-confirm, busy/error y reload) → Task 3 Steps 5-7 + Task 2 Step 4 (reload); §4.3 (orden exacto del wipe, 28 tablas, claves exactas, reload + rescate del onboarding) → Task 2 (implementación + test) y Task 5 R4 (e2e); §4.4 (módulo con deps inyectables + tests + hook delgado) → Task 2 + `useFactoryReset` (Task 3); §4.5 (fotos en IndexedDB y pasos de Health Connect: no requieren código) → sin tarea, correcto; §5.1 (copy del confirm) → Task 1 Step 6; §5.2 (reconcile pura, integración tras `earnedIds`, solo-si-cambió, `freshIds` pre-reconciliación, `counts` fuera de la firma, `deleteWorkoutSession` intacto) → Task 1; §5.3 (riesgos: debounce/gating intactos, determinismo de chapas, idempotencia) → Task 1 Step 5 + tests; §6 (ALL_TABLES 19→28, versión 1, import sin cambios, entrega nativa con los 2 plugins y rama web) → Task 4; §7 (i18n es/en) → Task 1 Step 6 + Task 3 Step 7; §8 (verificación unit + e2e + emulador + build/test + review antes de commit) → Global Constraints + Tasks 1-5; §9 (bosquejo de 4 unidades → 5 tareas con un commit cada una) → Tasks 1-5.
- **Decisiones D1-D9**: D1 (reset total) → Task 2 (28 tablas + claves + stores); D2 (type-to-confirm + haptics) → Task 3 (`matchesResetConfirmation` + `haptics(30)`); D3 (backup sugerido, no obligatorio) → Task 3 (`ResetInfoSheet`); D4 (orden) → Task 2 (implementación + test de orden); D5 (aviso de sesión activa, no bloqueo) → Task 3 (`hasActiveSession`); D6 (reconciliación global) → Task 1; D7 (contadores frescos + modal de re-logro) → Task 1 + Task 5 R3; D8 (`importBackup` sin cambios) → Task 4 Step 4 (no se toca) + test de archivo viejo; D9 (share + filesystem) → Task 4 Steps 1/4/6.
- **Placeholders**: ninguno. Todo el código es real y las verificaciones usan comandos existentes del repo. El único dato a completar con la salida real es el conteo de `npm test` en el CHANGELOG (mismo criterio que el plan de F66/F67: la verificación se documenta con lo observado).
- **Consistencia de tipos**: `AchievementState`/`reconcileAchievementState`/`freshAchievementIds`/`newCollectibleDelta`/`achievementStatePatch` se definen en Task 1 y se consumen con la misma firma en el hook; `FactoryResetDeps`/`performFactoryReset`/`RESET_*` se definen en Task 2 y los consumen Task 3 (`useFactoryReset`) y Task 2/5 (tests/e2e usan los ids y claves exactos); `RESET_CONFIRMATION_WORD`/`matchesResetConfirmation` se definen en Task 3 y los consumen el sheet y el test; `ALL_TABLES` y `downloadBackup(backup): Promise<void>` se definen en Task 4 y los consumen `DataSection` y `ResetInfoSheet` (que ya lo espera con `await`, legal antes y después del cambio). Los nombres de las claves i18n usados en los componentes coinciden 1:1 con las claves es/en del Step 7.
- **Nota de ejecución**: el `[no revisado]` del RDD se decide por commit según la salud del transporte (ver Global Constraints). El emulador se usa solo en Task 5 (WP5), que es donde el build nativo con los plugins nuevos existe.

## Execution Handoff

Dos formas de ejecutar (elegir una):

1. **Subagent-Driven (recomendado)** — un subagente fresco por tarea + revisión entre tareas (skill `subagent-driven-development`).
2. **Inline** — ejecutar las tareas en esta sesión con checkpoints (skill `executing-plans`).
