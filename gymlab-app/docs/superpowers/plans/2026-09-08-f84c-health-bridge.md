# F84c — Puente de salud (HealthKit/Health Connect) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sincronizar pasos diarios desde el sistema de salud (HealthKit en iOS / Health Connect en Android) hacia `stepRepo` (Dexie), con degradación segura en web/PWA y activación nativa diferida a F84d.

**Architecture:** Una función pura en `domain/` define la fusión (health > 0 gana siempre; health 0 nunca pisa). Un adapter `healthBridge.ts` envuelve `capacitor-health` con impl nativa condicionada a `Capacitor.isNativePlatform()` e impl nula en web. Un orquestador `stepsSync.ts` hace backfill incremental (90 días la primera vez, luego desde `lastHealthSyncAt`) y un hook `useHealthSync.ts` + banner alimentan la UI de `/pasos` just-in-time.

**Tech Stack:** Capacitor 8.5 (ya instalado), `@capacitor-community/health`, React 19, Dexie (vía `stepRepo`), i18next, vitest 4, Vite 8.

**Spec:** `gymlab-app/docs/superpowers/specs/2026-09-08-f84c-health-bridge-design.md`

## Global Constraints

- La app es **local-first**: un fallo del sync nunca toca datos locales existentes; la UI no crashea por ausencia de salud.
- Regla de fusión (domain puro): `healthSteps > 0` → el día pasa a health (source `'phone'`); `healthSteps <= 0` → **null** (no escribir, nunca pisar con 0).
- En web/dev (`!Capacitor.isNativePlatform()`) todo degrada a `unavailable` / `[]` — nunca lanza errores.
- `npx tsc --noEmit` es **vacuo** en GymLab (tsconfig solution-style con `files: []`). El gate real de tipos es `npm run build` (`tsc -b && vite build`).
- ¿`cap add` o configuración nativa? **NO** en esta fase: solo `npm i @capacitor-community/health`; el manifest/entitlements queda documentado en `PLAN.md`.
- UI copy en español (es-ES); claves i18n siempre en `es` y `en`.
- 1 commit por tarea, mensaje convencional (`feat:`/`test:`/`docs:`/`chore:`), **sin push**.
- Archivos < ~200 líneas, componentes < ~80 líneas, early returns, arrow functions.
- Telemetría vía `track(event, props)` de `@/lib/telemetry` (no-op sin gating).

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/domain/stepsFusion.ts` (nuevo) | Fusión pura: `mergeHealthSample`. Sin React/Dexie/imports de runtime. |
| `src/data/healthBridge.ts` (nuevo) | Interfaz `HealthBridge`, impl nativa sobre `capacitor-health`, impl nula, factory `getHealthBridge()`. |
| `src/data/stepsSync.ts` (nuevo) | Orquestador `syncStepsFromHealth(bridge)`, meta `healthLastSyncAt`, telemetría, esqueleto `registerBackgroundSync()`. |
| `src/hooks/useHealthSync.ts` (nuevo) | Hook de estado `idle\|syncing\|granted\|denied\|unavailable\|error` + `connect()`. |
| `src/components/steps/HealthSyncBanner.tsx` (nuevo) | Banner condicional según estado. |
| `src/pages/StepsPage.tsx` (modificar) | Monta el hook + banner. |
| `src/i18n/locales/es/features.ts`, `.../en/features.ts` (modificar) | Keys `steps.health*`. |
| `tests/unit/domain/stepsFusion.test.ts` (nuevo) | TDD fusión. |
| `tests/unit/data/healthBridge.test.ts` (nuevo) | Adapter con mocks de módulos. |
| `tests/unit/data/stepsSync.test.ts` (nuevo) | Orquestador con bridge fake (DI). |
| `tests/unit/hooks/useHealthSync.test.ts` (nuevo) | Hook: mapeo puro `mapSyncStatus` (convención del repo, sin render). |
| `PLAN.md`, `CHANGELOG.md` (modificar) | Marcado de fase + docs de activación. |

---

### Task 1: Instalar `@capacitor-community/health`

**Files:**
- Modify: `gymlab-app/package.json`, `gymlab-app/package-lock.json`

**Interfaces:**
- Consumes: nada.
- Produces: dependencia `capacitor-health` disponible para Task 3 (`import { Health } from 'capacitor-health'`).

- [ ] **Step 1: Instalar la dependencia**

Run (en `gymlab-app/`):
```bash
npm i @capacitor-community/health
```

- [ ] **Step 2: Verificar que el build sigue limpio**

Run: `npm run build`
Expected: `tsc -b` sin errores + `vite build` termina OK.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: dependencia @capacitor-community/health para F84c (HealthKit/Health Connect)"
```

---

### Task 2: Fusión pura `mergeHealthSample` (domain, TDD)

**Files:**
- Create: `gymlab-app/src/domain/stepsFusion.ts`
- Test: `gymlab-app/tests/unit/domain/stepsFusion.test.ts`

**Interfaces:**
- Consumes: `DailyStepsEntry` de `@/domain/types`, `calculateDistance`, `calculateCalories` de `@/domain/stepsTracker`.
- Produces (firma exacta que usan Task 4 y sus tests):
  ```ts
  export const mergeHealthSample = (
    localDate: string,
    day: DailyStepsEntry | undefined,
    healthSteps: number,
    strideLengthCm: number,
    appliedAt: string,
  ): DailyStepsEntry | null
  ```
  Semántica: `healthSteps > 0` → devuelve entry `{ id: day?.id ?? 0, localDate, steps: healthSteps, distanceKm, calories, source: 'phone', syncedAt: appliedAt }`; `healthSteps <= 0` → devuelve `null` (no tocar).

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/unit/domain/stepsFusion.test.ts
import { describe, expect, it } from 'vitest'
import { mergeHealthSample } from '@/domain/stepsFusion'
import type { DailyStepsEntry } from '@/domain/types'

const APPLIED = '2026-09-08T10:15:00.000Z'
// Entrada fixture: día manual existente (no debe pisarse con health=0).
const manualDay = (localDate: string): DailyStepsEntry => ({
  id: 7,
  localDate,
  steps: 500,
  distanceKm: 0.35,
  calories: 20,
  source: 'manual',
  syncedAt: '2026-09-08T09:00:00.000Z',
})

describe('mergeHealthSample', () => {
  it('health > 0 reemplaza el día, con source phone y métricas recalculadas', () => {
    const out = mergeHealthSample('2026-09-08', manualDay('2026-09-08'), 8_000, 70, APPLIED)
    expect(out).toEqual({
      id: 7,
      localDate: '2026-09-08',
      steps: 8_000,
      distanceKm: 5.6, // 8000 × 70 / 100 / 1000
      calories: 320, // 8000 × 0.04
      source: 'phone',
      syncedAt: APPLIED,
    })
  })

  it('health > 0 reemplaza incluso si ya existía un registro manual', () => {
    const out = mergeHealthSample('2026-09-08', manualDay('2026-09-08'), 8_000, 70, APPLIED)
    expect(out?.source).toBe('phone')
    expect(out?.steps).toBe(8_000)
  })

  it('health = 0 nunca pisa: devuelve null (no tocar)', () => {
    const out = mergeHealthSample('2026-09-08', manualDay('2026-09-08'), 0, 70, APPLIED)
    expect(out).toBeNull()
  })

  it('sin registro y sin health → null', () => {
    const out = mergeHealthSample('2026-09-08', undefined, 0, 70, APPLIED)
    expect(out).toBeNull()
  })

  it('sin registro previo y health > 0 → crea el día con id 0', () => {
    const out = mergeHealthSample('2026-09-08', undefined, 12_000, 70, APPLIED)
    expect(out).toEqual({
      id: 0,
      localDate: '2026-09-08',
      steps: 12_000,
      distanceKm: 8.4,
      calories: 480,
      source: 'phone',
      syncedAt: APPLIED,
    })
  })

  it('usa la zancada recibida (no hardcodeada) para distancia y calorías', () => {
    const out = mergeHealthSample('2026-09-08', undefined, 10_000, 90, APPLIED)
    expect(out?.distanceKm).toBeCloseTo(9, 4)
    expect(out?.calories).toBe(400)
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run tests/unit/domain/stepsFusion.test.ts`
Expected: FAIL — `Cannot find module '@/domain/stepsFusion'` (el archivo no existe).

- [ ] **Step 3: Implementar la función mínima para pasar**

```ts
// src/domain/stepsFusion.ts
// Regla de fusión de pasos (F84c): el sistema de salud es la fuente de verdad.
// health > 0 → ese número gana (source phone); health <= 0 → null = no tocar
// el registro existente (nunca pisar con 0). Sin imports de runtime.
import { calculateCalories, calculateDistance } from './stepsTracker'
import type { DailyStepsEntry } from './types'

export const mergeHealthSample = (
  localDate: string,
  day: DailyStepsEntry | undefined,
  healthSteps: number,
  strideLengthCm: number,
  appliedAt: string,
): DailyStepsEntry | null => {
  if (healthSteps <= 0) return null
  return {
    id: day?.id ?? 0,
    localDate,
    steps: healthSteps,
    distanceKm: calculateDistance(healthSteps, strideLengthCm),
    calories: calculateCalories(healthSteps, 0),
    source: 'phone',
    syncedAt: appliedAt,
  }
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run tests/unit/domain/stepsFusion.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/stepsFusion.ts tests/unit/domain/stepsFusion.test.ts
git commit -m "feat: fusion pura de pasos de salud en domain (F84c)"
```

---

### Task 3: Adapter `healthBridge.ts` (impl nativa + nula)

**Files:**
- Create: `gymlab-app/src/data/healthBridge.ts`
- Test: `gymlab-app/tests/unit/data/healthBridge.test.ts`

**Interfaces:**
- Consumes: `@/domain/dates` → `toLocalDateStr`; módulos `@capacitor/core` (`Capacitor.isNativePlatform`), `capacitor-health` (`Health`).
- Produces (firma exacta que usa Task 4):
  ```ts
  export interface HealthDaySample { localDate: string; steps: number }
  export interface HealthBridge {
    isAvailable(): Promise<boolean>
    requestPermission(): Promise<'granted' | 'denied'>
    fetchStepsByDay(from: string, to: string): Promise<HealthDaySample[]>
  }
  export const getHealthBridge = (): Promise<HealthBridge>
  ```
  Web (`!isNativePlatform`): bridge nulo con `isAvailable → false`, `requestPermission → 'denied'`, `fetchStepsByDay → []`. Nunca lanza.

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/unit/data/healthBridge.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getHealthBridge } from '@/data/healthBridge'

// Mock de los módulos nativos antes de importar la impl.
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
}))
vi.mock('capacitor-health', () => ({
  Health: {
    isHealthAvailable: vi.fn(),
    requestHealthPermissions: vi.fn(),
    queryAggregated: vi.fn(),
  },
}))

// Import después de los mocks (hoisted por vitest igualmente, pero explícito).
const { Health } = await import('capacitor-health')
const { Capacitor } = await import('@capacitor/core')

const mockIsAvailable = Health.isHealthAvailable as unknown as ReturnType<typeof vi.fn>
const mockRequest = Health.requestHealthPermissions as unknown as ReturnType<typeof vi.fn>
const mockQuery = Health.queryAggregated as unknown as ReturnType<typeof vi.fn>

describe('healthBridge (nativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('isAvailable delega en Health.isHealthAvailable', async () => {
    mockIsAvailable.mockResolvedValue({ available: true })
    const bridge = await getHealthBridge()
    expect(await bridge.isAvailable()).toBe(true)
    expect(mockIsAvailable).toHaveBeenCalledTimes(1)
  })

  it('requestPermission mapea READ_STEPS concedido → granted', async () => {
    mockRequest.mockResolvedValue({ permissions: { READ_STEPS: true } })
    const bridge = await getHealthBridge()
    expect(await bridge.requestPermission()).toBe('granted')
  })

  it('requestPermission mapea READ_STEPS denegado → denied', async () => {
    mockRequest.mockResolvedValue({ permissions: { READ_STEPS: false } })
    const bridge = await getHealthBridge()
    expect(await bridge.requestPermission()).toBe('denied')
  })

  it('fetchStepsByDay agrupa muestras del plugin por localDate y suma', async () => {
    mockQuery.mockResolvedValue({
      aggregatedData: [
        { startDate: '2026-09-08T00:00:00.000Z', endDate: '2026-09-08T01:00:00.000Z', value: 100 },
        { startDate: '2026-09-08T01:00:00.000Z', endDate: '2026-09-08T02:00:00.000Z', value: 150 },
        { startDate: '2026-09-09T00:00:00.000Z', endDate: '2026-09-10T00:00:00.000Z', value: 900 },
      ],
    })
    const bridge = await getHealthBridge()
    const samples = await bridge.fetchStepsByDay('2026-09-08', '2026-09-09')
    // Las 2 muestras del 08 (horarias) se suman; el 09 queda aparte.
    expect(samples).toEqual([
      { localDate: '2026-09-08', steps: 250 },
      { localDate: '2026-09-09', steps: 900 },
    ])
  })
})

describe('healthBridge (web)', () => {
  it('no importa capacitor-health y devuelve el bridge nulo', async () => {
    const nativeSpy = vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false)
    const bridge = await getHealthBridge()
    expect(await bridge.isAvailable()).toBe(false)
    expect(await bridge.requestPermission()).toBe('denied')
    expect(await bridge.fetchStepsByDay('2026-09-08', '2026-09-09')).toEqual([])
    nativeSpy.mockRestore()
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run tests/unit/data/healthBridge.test.ts`
Expected: FAIL — `Cannot find module '@/data/healthBridge'`.

- [ ] **Step 3: Implementar el adapter**

```ts
// src/data/healthBridge.ts
// Puente hacia el ecosistema de salud (F84c): impl nativa vía capacitor-health
// (HealthKit iOS / Health Connect Android) bajo Capacitor.isNativePlatform();
// en web devuelve un bridge nulo para que la app siga siendo local-first.
import { Capacitor } from '@capacitor/core'
import { toLocalDateStr } from '@/domain/dates'

export interface HealthDaySample {
  localDate: string
  steps: number
}

export interface HealthBridge {
  isAvailable(): Promise<boolean>
  requestPermission(): Promise<'granted' | 'denied'>
  fetchStepsByDay(from: string, to: string): Promise<HealthDaySample[]>
}

// La impl nativa se carga perezosa: solo importa capacitor-health en runtime nativo,
// para no inflar el bundle web ni romper el tree-shake.
const createNativeBridge = async (): Promise<HealthBridge> => {
  const { Health } = await import('capacitor-health')

  const dayKey = (iso: string): string => toLocalDateStr(new Date(iso))

  return {
    isAvailable: async () => {
      const { available } = await Health.isHealthAvailable()
      return available
    },
    requestPermission: async () => {
      const { permissions } = await Health.requestHealthPermissions({
        permissions: ['READ_STEPS'],
      })
      return permissions['READ_STEPS'] ? 'granted' : 'denied'
    },
    fetchStepsByDay: async (from, to) => {
      const { aggregatedData } = await Health.queryAggregated({
        startDate: new Date(from + 'T00:00:00').toISOString(),
        endDate: new Date(to + 'T23:59:59').toISOString(),
        dataType: 'steps',
        bucket: 'day',
      })
      // El plugin puede devolver varias muestras por día (bucket horario en iOS):
      // agrupar por localDate y sumar.
      const byDay = new Map<string, number>()
      for (const sample of aggregatedData) {
        const key = dayKey(sample.startDate)
        byDay.set(key, (byDay.get(key) ?? 0) + sample.value)
      }
      return [...byDay.entries()].map(([localDate, steps]) => ({ localDate, steps }))
    },
  }
}

const createNullBridge = (): HealthBridge => ({
  isAvailable: async () => false,
  requestPermission: async () => 'denied',
  fetchStepsByDay: async () => [],
})

export const getHealthBridge = async (): Promise<HealthBridge> =>
  Capacitor.isNativePlatform() ? createNativeBridge() : createNullBridge()
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run tests/unit/data/healthBridge.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/healthBridge.ts tests/unit/data/healthBridge.test.ts
git commit -m "feat: adapter de salud con impl nativa y degradacion web (F84c)"
```

---

### Task 4: Orquestador `stepsSync.ts`

**Files:**
- Create: `gymlab-app/src/data/stepsSync.ts`
- Test: `gymlab-app/tests/unit/data/stepsSync.test.ts`

**Interfaces:**
- Consumes: `getHealthBridge` de `@/data/healthBridge` (Task 3), `mergeHealthSample` de `@/domain/stepsFusion` (Task 2), `stepRepo` de `@/data/repositories`, `metaRepo` de `@/data/repositories`, `track` de `@/lib/telemetry`, `toLocalDateStr`/`addLocalDays` de `@/domain/dates`.
- Produces (firma exacta que usa Task 5):
  ```ts
  export type SyncStatus = 'unavailable' | 'denied' | 'synced' | 'error'
  export interface SyncResult { status: SyncStatus; days?: number }
  export const syncStepsFromHealth = async (bridge?: HealthBridge): Promise<SyncResult>
  export const registerBackgroundSync = (handler: () => Promise<void>): void
  ```
  `syncStepsFromHealth` sin `bridge` → usa `await getHealthBridge()`. DI explícita para tests.
  Meta key: `healthLastSyncAt` (string ISO). Backfill: si no hay `healthLastSyncAt` → from = `addLocalDays(toLocalDateStr(), -89)` (90 días incluido hoy); si hay → from = ese valor (después se avanza).

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/unit/data/stepsSync.test.ts
import { describe, expect, it, vi } from 'vitest'
import { syncStepsFromHealth, registerBackgroundSync } from '@/data/stepsSync'
import type { HealthBridge, HealthDaySample } from '@/data/healthBridge'

// Bridge fake: control total sobre disponibilidad/permiso/muestras.
const makeBridge = (overrides: Partial<HealthBridge> = {}): HealthBridge => ({
  isAvailable: async () => true,
  requestPermission: async () => 'granted',
  fetchStepsByDay: async (): Promise<HealthDaySample[]> => [],
  ...overrides,
})

// Spy del repo + meta: se reasignan por test.
const upsertSpy = vi.fn(async () => 1)
const getByDateSpy = vi.fn(async () => undefined)
const getJsonSpy = vi.fn(async () => 0)
const setJsonSpy = vi.fn(async () => undefined)

vi.mock('@/data/repositories', () => ({
  stepRepo: {
    getByDate: (...args: unknown[]) => getByDateSpy(...args),
    upsert: (...args: unknown[]) => upsertSpy(...args),
  },
  metaRepo: {
    getJson: (...args: unknown[]) => getJsonSpy(...args),
    setJson: (...args: unknown[]) => setJsonSpy(...args),
  },
}))
vi.mock('@/lib/telemetry', () => ({ track: vi.fn() }))
const { track } = await import('@/lib/telemetry')
const tracked = track as unknown as ReturnType<typeof vi.fn>

describe('syncStepsFromHealth', () => {
  it('bridge no disponible → status unavailable, sin tocar datos', async () => {
    const result = await syncStepsFromHealth(makeBridge({ isAvailable: async () => false }))
    expect(result).toEqual({ status: 'unavailable' })
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it('permiso denegado → status denied, sin tocar datos', async () => {
    const result = await syncStepsFromHealth(
      makeBridge({ requestPermission: async () => 'denied' }),
    )
    expect(result).toEqual({ status: 'denied' })
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it('sin lastHealthSyncAt hace backfill desde hace 89 días y persiste la meta', async () => {
    getJsonSpy.mockResolvedValue(0)
    const samples: HealthDaySample[] = [{ localDate: '2026-09-08', steps: 8_000 }]
    const result = await syncStepsFromHealth(
      makeBridge({ fetchStepsByDay: async () => samples }),
    )
    expect(result.status).toBe('synced')
    // La consulta del bridge se hizo con el rango de backfill (90 días).
    expect(setJsonSpy).toHaveBeenCalledWith('healthLastSyncAt', expect.any(String))
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ localDate: '2026-09-08', steps: 8_000, source: 'phone' }),
    )
  })

  it('health con 0 no escribe (fusión manda)', async () => {
    getJsonSpy.mockResolvedValue(0)
    const result = await syncStepsFromHealth(
      makeBridge({ fetchStepsByDay: async () => [{ localDate: '2026-09-08', steps: 0 }] }),
    )
    expect(result.status).toBe('synced')
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it('con lastHealthSyncAt hace incremental desde esa fecha (solo la parte de día)', async () => {
    getJsonSpy.mockResolvedValue('2026-09-07T12:00:00.000Z')
    const fetchSpy = vi.fn(async (): Promise<HealthDaySample[]> => [])
    await syncStepsFromHealth(makeBridge({ fetchStepsByDay: fetchSpy }))
    // El ISO con hora se normaliza a YYYY-MM-DD: el bridge construye
    // new Date(from + 'T00:00:00') y un ISO con hora rompería el parse.
    const [from, to] = fetchSpy.mock.calls[0] as unknown as [string, string]
    expect(from).toBe('2026-09-07')
    expect(to).toBe('2026-09-08')
  })

  it('registra steps_synced con la cantidad de días', async () => {
    getJsonSpy.mockResolvedValue('2026-09-07T12:00:00.000Z')
    await syncStepsFromHealth(
      makeBridge({
        fetchStepsByDay: async () => [{ localDate: '2026-09-08', steps: 5_000 }],
      }),
    )
    expect(tracked).toHaveBeenCalledWith('steps_synced', { days: 1 })
  })

  it('error del bridge → status error, sin tocar datos', async () => {
    const result = await syncStepsFromHealth(
      makeBridge({
        fetchStepsByDay: async () => {
          throw new Error('health api down')
        },
      }),
    )
    expect(result.status).toBe('error')
    expect(upsertSpy).not.toHaveBeenCalled()
  })
})

describe('registerBackgroundSync', () => {
  it('es un esqueleto no-op (activacion diferida a F84d)', () => {
    const handler = vi.fn()
    expect(() => registerBackgroundSync(handler)).not.toThrow()
    expect(handler).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run tests/unit/data/stepsSync.test.ts`
Expected: FAIL — `Cannot find module '@/data/stepsSync'`.

- [ ] **Step 3: Implementar el orquestador**

```ts
// src/data/stepsSync.ts
// Orquestador del sync de pasos de salud (F84c): verifica disponibilidad y
// permiso, trae el rango (backfill 90 días o incremental desde lastHealthSyncAt),
// fusiona por día con la regla del dominio y persiste la meta de última sync.
import { addLocalDays, toLocalDateStr } from '@/domain/dates'
import { mergeHealthSample } from '@/domain/stepsFusion'
import { getHealthBridge, type HealthBridge } from './healthBridge'
import { metaRepo, stepRepo } from './repositories'
import { track } from '@/lib/telemetry'

export type SyncStatus = 'unavailable' | 'denied' | 'synced' | 'error'

export interface SyncResult {
  status: SyncStatus
  days?: number
}

const HEALTH_LAST_SYNC_KEY = 'healthLastSyncAt'

export const syncStepsFromHealth = async (bridge?: HealthBridge): Promise<SyncResult> => {
  const active = bridge ?? (await getHealthBridge())

  try {
    if (!(await active.isAvailable())) return { status: 'unavailable' }
    if ((await active.requestPermission()) !== 'granted') return { status: 'denied' }

    // Rango: backfill 90 días si nunca se sincronizó; si no, incremental desde la última.
    const lastSync = await metaRepo.getJson<string>(HEALTH_LAST_SYNC_KEY, '')
    // Normalizar a YYYY-MM-DD: el bridge construye new Date(from + 'T00:00:00'),
    // así que un ISO con hora (como lastSyncAt) rompería el parse.
    const lastParsed = lastSync ? toLocalDateStr(new Date(lastSync)) : ''
    const from = lastParsed || addLocalDays(toLocalDateStr(), -89)
    const to = toLocalDateStr()

    // Si la meta quedó en el pasado (salto de días), lo mejor es volver a cubrir
    // hasta hoy completo; conservamos el «from» original como ancla inclusiva.
    const samples = await active.fetchStepsByDay(from, to)

    const strideLengthCm = await stepRepo.getStrideLengthCm()
    let written = 0
    for (const sample of samples) {
      const day = await stepRepo.getByDate(sample.localDate)
      const merged = mergeHealthSample(sample.localDate, day, sample.steps, strideLengthCm, new Date().toISOString())
      if (merged) {
        await stepRepo.upsert(merged)
        written++
      }
    }

    await metaRepo.setJson(HEALTH_LAST_SYNC_KEY, new Date().toISOString())
    track('steps_synced', { days: written })
    return { status: 'synced', days: written }
  } catch {
    track('steps_sync_failed', { reason: 'error' })
    return { status: 'error' }
  }
}

// Esqueleto documentado: se activa en F84d cuando exista el widget nativo.
// Registra un callback que corra el sync en background; hoy es no-op por YAGNI.
export const registerBackgroundSync = (_handler: () => Promise<void>): void => {
  // no-op intencional hasta F84d
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run tests/unit/data/stepsSync.test.ts`
Expected: 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/stepsSync.ts tests/unit/data/stepsSync.test.ts
git commit -m "feat: orquestador de sync de pasos con backfill incremental (F84c)"
```

---

### Task 5: Hook `useHealthSync` + banner + anclaje en `/pasos`

**Files:**
- Create: `gymlab-app/src/hooks/useHealthSync.ts`
- Create: `gymlab-app/src/components/steps/HealthSyncBanner.tsx`
- Modify: `gymlab-app/src/pages/StepsPage.tsx`
- Test: `gymlab-app/tests/unit/hooks/useHealthSync.test.ts`

**Interfaces:**
- Consumes: `syncStepsFromHealth` de `@/data/stepsSync` (Task 4), `Capacitor.isNativePlatform` de `@capacitor/core`, `App` de `@capacitor/app`, `useTranslation` de `react-i18next`, `Button` de `../ui/Button`.
- Produces (usado por `StepsPage` y por el test):
  ```ts
  export type HealthSyncStatus = 'idle' | 'syncing' | 'granted' | 'denied' | 'unavailable' | 'error'
  export const mapSyncStatus = (status: SyncStatus): HealthSyncStatus
  export const useHealthSync = (): { status: HealthSyncStatus; connect: () => Promise<void> }
  // <HealthSyncBanner status={status} onAction={connect} />  → null si status es idle/granted/unavailable
  ```
- **Convención de test del repo:** no hay `@testing-library/react` instalado; los hooks del repo se testean exportando y probando su lógica pura (patrón `useExerciseCatalog.test.ts` → `filterExercises`). El test de Task 5 cubre `mapSyncStatus`; el pegamento React (`connect`) queda bajo regresión e2e.

- [ ] **Step 1: Escribir el test que falla**

```ts
// tests/unit/hooks/useHealthSync.test.ts
// Convención del repo: se testea la lógica pura exportada del hook
// (ver useExerciseCatalog.test.ts → filterExercises); el glue React se
// cubre con la regresión e2e de /pasos.
import { describe, expect, it } from 'vitest'
import { mapSyncStatus } from '@/hooks/useHealthSync'

describe('mapSyncStatus', () => {
  it('synced → granted (la UI deja de mostrar el banner)', () => {
    expect(mapSyncStatus('synced')).toBe('granted')
  })

  it('denied → denied (pide conectar salud)', () => {
    expect(mapSyncStatus('denied')).toBe('denied')
  })

  it('unavailable → unavailable (web/no compatible; banner silencioso)', () => {
    expect(mapSyncStatus('unavailable')).toBe('unavailable')
  })

  it('error → error (banner con reintentar)', () => {
    expect(mapSyncStatus('error')).toBe('error')
  })
})
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run tests/unit/hooks/useHealthSync.test.ts`
Expected: FAIL — `Cannot find module '@/hooks/useHealthSync'`.

- [ ] **Step 3: Implementar el hook**

```ts
// src/hooks/useHealthSync.ts
// Estado del sync de pasos de salud para /pasos (F84c): en runtime nativo pide
// permiso just-in-time y sincroniza al montar y al volver al primer plano; en
// web degrada a unavailable (sin listener, sin errores). El mapeo de estado es
// pure para testearlo sin infra de render (convención del repo).
import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { syncStepsFromHealth, type SyncStatus } from '@/data/stepsSync'

export type HealthSyncStatus = 'idle' | 'syncing' | 'granted' | 'denied' | 'unavailable' | 'error'

export const mapSyncStatus = (status: SyncStatus): HealthSyncStatus =>
  status === 'synced' ? 'granted' : status

export const useHealthSync = () => {
  const [status, setStatus] = useState<HealthSyncStatus>('idle')

  const connect = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setStatus('unavailable')
      return
    }
    setStatus('syncing')
    const result = await syncStepsFromHealth()
    setStatus(mapSyncStatus(result.status))
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setStatus('unavailable')
      return
    }
    void connect()
    // Re-sincronizar al volver al primer plano para no quedarse atrás.
    let active = true
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (active && isActive) void connect()
    })
    return () => {
      active = false
      void listener.then((l) => l.remove())
    }
  }, [connect])

  return { status, connect }
}
```

- [ ] **Step 4: Implementar el banner**

```tsx
// src/components/steps/HealthSyncBanner.tsx
// Banner de estado del puente de salud: solo se muestra para estados que el
// usuario debe ver (syncing/denied/error); idle/granted/unavailable → null.
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import type { HealthSyncStatus } from '@/hooks/useHealthSync'

interface Props {
  status: HealthSyncStatus
  onAction: () => void
}

const VISIBLE: HealthSyncStatus[] = ['syncing', 'denied', 'error']

export const HealthSyncBanner = ({ status, onAction }: Props) => {
  const { t } = useTranslation()
  if (!VISIBLE.includes(status)) return null

  if (status === 'syncing') {
    return (
      <p className="flex items-center gap-2 text-xs text-muted" aria-live="polite">
        <RefreshCw className="size-4 animate-spin" aria-hidden />
        {t('steps.healthSyncing')}
      </p>
    )
  }

  const denied = status === 'denied'
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-bg-elevated/50 p-3">
      <p className="text-xs text-muted">{denied ? t('steps.healthDenied') : t('steps.healthError')}</p>
      <Button variant="outline" size="sm" onClick={onAction}>
        {denied ? t('steps.healthDeniedAction') : t('steps.healthRetry')}
      </Button>
    </div>
  )
}
```

- [ ] **Step 5: Anclar hook + banner en `StepsPage.tsx`**

En `src/pages/StepsPage.tsx`:
1. Añadir imports:
```ts
import { useHealthSync } from '@/hooks/useHealthSync'
import { HealthSyncBanner } from '../components/steps/HealthSyncBanner'
```
2. Dentro del componente, tras `const { ... } = useStepData()`:
```ts
const health = useHealthSync()
```
3. Renderizar el banner como **primer hijo** del contenedor `.space-y-4 p-4` (línea 44, antes del bloque `flex flex-col items-center gap-3`):
```tsx
<HealthSyncBanner status={health.status} onAction={() => void health.connect()} />
```

- [ ] **Step 6: Correr tests del hook y regresión de StepsPage**

Run: `npx vitest run tests/unit/hooks/useHealthSync.test.ts`
Expected: 4 tests PASS.
Run: `npm run build`
Expected: build limpio (StepsPage compila con el banner).

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useHealthSync.ts src/components/steps/HealthSyncBanner.tsx src/pages/StepsPage.tsx tests/unit/hooks/useHealthSync.test.ts
git commit -m "feat: sync de pasos de salud just-in-time en /pasos con banner (F84c)"
```

---

### Task 6: i18n + PLAN.md + CHANGELOG

**Files:**
- Modify: `gymlab-app/src/i18n/locales/es/features.ts`, `gymlab-app/src/i18n/locales/en/features.ts`
- Modify: `gymlab-app/PLAN.md` (sección F84c, ~línea 2172)
- Modify: `gymlab-app/CHANGELOG.md`

**Interfaces:**
- Consumes: claves `steps.*` existentes en features.ts (grupo `steps` ya abierto con `recordAction`, etc.).

- [ ] **Step 1: Añadir las claves es en `features.ts` grupo `steps`** (junto a `sourceWatch`; solo las claves que el banner usa — `healthUnavailable` sería clave muerta, no añadirla)

```ts
healthSyncing: 'Sincronizando con tu sistema de salud…',
healthDenied: 'Sin acceso a pasos del sistema',
healthDeniedAction: 'Conectar salud',
healthError: 'No pudimos sincronizar los pasos',
healthRetry: 'Reintentar',
```

- [ ] **Step 2: Añadir las claves en en en `features.ts` grupo `steps`**

```ts
healthSyncing: 'Syncing with your health system…',
healthDenied: 'No access to system steps',
healthDeniedAction: 'Connect health',
healthError: 'Could not sync steps',
healthRetry: 'Retry',
```

- [ ] **Step 3: Marcar F84c en `PLAN.md` y añadir la sección de activación nativa**

En `gymlab-app/PLAN.md`:
1. Marcar `[x]` las 7 tareas de F84c (líneas ~2173–2179).
2. Añadir al final de la sección F84c un bloque `#### Activación nativa (F84d)` con pasos exactos:
   - Android: tras `npx cap add android`, añadir en `android/app/src/main/AndroidManifest.xml`:
     ```xml
     <queries><package android:name="com.google.android.apps.healthdata" /></queries>
     <uses-permission android:name="android.permission.health.READ_STEPS" />
     ```
   - iOS: en Xcode, capability HealthKit (`com.apple.developer.healthkit` entitlement).
   - Publicación: declarar Health Connect en Play Console (policy Data safety).

- [ ] **Step 4: Actualizar `CHANGELOG.md` bajo `[Unreleased]` → `Added`**

```md
- Contador de pasos: puente de salud (HealthKit/Health Connect) con sync just-in-time en `/pasos` (F84c). La activación nativa (`cap add` + Health Connect) se completa en F84d.
```

- [ ] **Step 5: Verificación**

Run: `npm run build`
Expected: build limpio.
Run: `npx vitest run tests/unit/domain/stepsFusion.test.ts tests/unit/data/healthBridge.test.ts tests/unit/data/stepsSync.test.ts tests/unit/hooks/useHealthSync.test.ts`
Expected: todos PASS (23 tests nuevos: 6 fusión + 5 bridge + 8 sync + 4 hook).

- [ ] **Step 6: Commit**

```bash
git add src/i18n/locales/es/features.ts src/i18n/locales/en/features.ts PLAN.md CHANGELOG.md
git commit -m "docs: i18n y activacion nativa documentada para el puente de salud (F84c)"
```

---

### Task 7: Verificación final y regresión

**Files:**
- Ninguno (solo comandos).

**Interfaces:**
- Consumes: todo lo de Tasks 1–6.

- [ ] **Step 1: Suite completa de unit**

Run: `npm test`
Expected: todos los tests PASS (483 + 23 nuevos ≈ 506).

- [ ] **Step 2: Build de producción**

Run: `npm run build`
Expected: `tsc -b` sin errores + `vite build` OK.

- [ ] **Step 3: E2E F84b (regresión del dashboard de pasos)**

Run (en `gymlab-app/`):
```bash
python tests/e2e/scripts/with_server.py tests/e2e/test_f84b_pasos.py
```
Expected: ALL OK — el dashboard sigue funcionando con el banner `null` en web.

- [ ] **Step 4: Verificar que ningún artifact indebido se commiteó**

Run: `git status --short`
Expected: árbol limpio (nada de `android/`, `ios/`, `dist/`, `.env*`).

- [ ] **Step 5: Commit final si queda algo pendiente del gatekeeper**

Solo si `git status` muestra cambios: commitearlos con mensaje descriptivo del repo (`chore:`/`fix:`) y SIN push.

---

## Self-Review (realizado por el autor del plan)

1. **Spec coverage:** WP1 (fusión) → Task 2; WP2 (adapter) → Task 3; WP3 (orquestador + meta + telemetría + esqueleto background) → Task 4; WP4 (hook + banner + /pasos) → Task 5; WP5 (i18n + dependencia + docs activación + PLAN/CHANGELOG) → Tasks 1 y 6; WP6 (verificación + regresión) → Task 7. Sin huecos.
2. **Placeholder scan:** sin "TBD"/"implement later"; cada paso de código trae el contenido real; el único esqueleto es `registerBackgroundSync` documentado como no-op intencional por YAGNI (consistente con el spec). OK.
3. **Type consistency:** `mergeHealthSample` firma idéntica en Tasks 2/4; `HealthBridge`/`HealthDaySample` idénticas en 3/4; `SyncStatus`/`SyncResult`/`syncStepsFromHealth` idénticas en 4/5; `HealthSyncStatus`/`mapSyncStatus` idénticas en 5. `upsert` acepta `Pick<DailyStepsEntry,'localDate'|'steps'|'distanceKm'|'calories'|'source'>` — el entry completo de `mergeHealthSample` cumple. OK.
4. **Nota de interface (verificación de campo en el repo):** `stepRepo.getStrideLengthCm()` existe (`src/data/repositories/types.ts:163`, impl `stepRepo.ts:65`). `metaRepo.getJson<T>/setJson<T>` existen (`metaRepo.ts:9-10`). `track` existe en `@/lib/telemetry`. `toLocalDateStr`, `addLocalDays` existen en `@/domain/dates`. `Button` NO tiene variante `secondary` → el plan usa `outline`/`sm` (verificado `ui/Button.tsx`). `bg-bg-elevated`, `text-muted`, `border-border` son tokens reales de los temas (`index.css`).
5. **Corrección aplicada por self-review de campo (bug de rango):** en Task 4, el `from` incremental era el ISO completo con hora (`2026-09-07T12:00:00.000Z`), y `fetchStepsByDay` concatena `from + 'T00:00:00'` → `Invalid Date` → error. Corregido: normalizar con `toLocalDateStr(new Date(lastSync))` en el orquestador; el test espera `from === '2026-09-07'`.
6. **Convención de tests del repo:** `@testing-library/react` NO está en `package.json`; el repo testea hooks vía su lógica pura exportada (`useExerciseCatalog.test.ts` → `filterExercises`). Task 5 usa el mismo patrón con `mapSyncStatus` (4 casos) y no añade dependencias nuevas.