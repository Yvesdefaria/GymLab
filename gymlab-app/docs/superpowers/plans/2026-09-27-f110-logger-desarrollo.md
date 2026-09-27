# F110 — Logger de desarrollo: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un logger de desarrollo (consola, 4 niveles, gate memoizado de 3 estados) e instrumentar los 11 caminos que hoy fallan en silencio, más un log de arranque — sin superficie de usuario y sin coste de rendimiento cuando está apagado.

**Architecture:** Política pura en `src/domain/logger.ts` (niveles, estados del flag, `shouldLog`, `formatCategory`) + implementación en `src/lib/logger.ts` (sink a consola, estado memoizado, helpers `window.__gymlabLog` para CDP). Los 11 sitios existentes reemplazan `console.*` o catches mudos por llamadas `logger.*`.

**Tech Stack:** Vite + React 18 + TypeScript · Vitest 4 (node env, sin globals) · Playwright Python e2e (`with_server.py`) · worktree aislado `.worktrees/f110` (rama `f110`).

**Spec:** `docs/superpowers/specs/2026-09-27-f110-logger-desarrollo-design.md`

## Global Constraints

- **Worktree:** todo corre con cwd en `C:\Users\Yves De Faria\Desktop\ProyectoGymLab\.worktrees\f110\gymlab-app` (rama `f110`). Commits convencionales **sin push**.
- **Lazy / rendimiento:** el gate se memoiza al importar el módulo (UNA lectura de `localStorage`); apagado = un chequeo booleano, cero I/O y cero allocations por llamada.
- **Política:** `error` sale siempre (cualquier estado/entorno); `debug/info/warn` salen con estado `'on'` o `'auto'`+dev; `'off'` los silencia incluso en dev. `error` **no** depende del gate.
- **Contenido:** mensajes cortos en español; `data` solo error técnico + ids/keys; **nunca** contenido de usuario (nombres, notas, textos, valores de campos).
- **Estados del flag** (`gymlab.debug`): `'1'` = on, `'0'` = off, ausente = `'auto'`. Helpers: `enable()`→`'1'`, `disable()`→`'0'`, `reset()`→limpia.
- **Fuera de alcance:** `routinePersistence.ts`; ring/export; Sentry/`reportError`; hooks globales; UI.
- **Gates de cada tarea (antes del commit):** `npm test` verde + `npm run build` verde + **ciclo de review** de AGENTS.md («Gentle AI») sobre el diff del workspace — lo corre el orquestador; corrige y normaliza antes de commitear.
- **Convenciones de código:** early returns; arrow functions; comentarios breves de «por qué»; archivos < ~200 líneas; imports con alias `@/`.
- El orden de tareas importa: la Tarea 2 crea `src/lib/logger.ts` — antes de que la Tarea 3 lo importe desde `stepsSync.ts`.

## File Structure

- **Create** `src/domain/logger.ts` — política pura (Tarea 1)
- **Create** `tests/unit/domain/logger.test.ts` — matriz de política (Tarea 1)
- **Create** `src/lib/logger.ts` — sink consola + gate memoizado + helpers (Tarea 2)
- **Create** `tests/unit/lib/logger.test.ts` — gate, formato, thunk, helpers (Tarea 2)
- **Modify** `src/components/layout/AppErrorBoundary.tsx`, `src/data/stepsSync.ts`, `tests/unit/data/stepsSync.test.ts`, `src/main.tsx` (Tarea 3)
- **Modify** `src/app/providers.tsx`, `src/store/activeWorkoutStore.ts`, `src/hooks/useActiveSession.ts` (Tarea 4)
- **Modify** `src/data/repositories/dexie/metaRepo.ts`, `src/data/backup.ts`, `src/data/catalogLoader.ts`, `src/data/localNotificationsBackend.ts`, `src/data/restAlertBridge.ts`, `src/lib/saveToGallery.ts`, `tests/unit/lib/saveToGallery.test.ts` (Tarea 5)
- **Create** `tests/e2e/test_f110_logger.py` (Tarea 6)
- **Modify** `CHANGELOG.md`, `PLAN.md` (Tarea 7)

---

### Task 1: Política pura del logger (domain)

**Files:**
- Create: `src/domain/logger.ts`
- Test: `tests/unit/domain/logger.test.ts`

**Interfaces:**
- Consumes: nada (puro).
- Produces (usado por Tarea 2 y tests): `type LogLevel = 'debug' | 'info' | 'warn' | 'error'`; `type LogFlagState = 'on' | 'off' | 'auto'`; `const LOG_FLAG_KEY = 'gymlab.debug'`; `parseFlagState(raw: string | null): LogFlagState`; `interface LoggerGate { dev: boolean; state: LogFlagState }`; `shouldLog(level: LogLevel, gate: LoggerGate): boolean`; `formatCategory(category: string): string`.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/unit/domain/logger.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { LOG_FLAG_KEY, formatCategory, parseFlagState, shouldLog } from '@/domain/logger'

describe('parseFlagState', () => {
  it("'1' → on, '0' → off, cualquier otra cosa → auto", () => {
    expect(parseFlagState('1')).toBe('on')
    expect(parseFlagState('0')).toBe('off')
    expect(parseFlagState(null)).toBe('auto')
    expect(parseFlagState('')).toBe('auto')
    expect(parseFlagState('true')).toBe('auto')
  })
})

describe('shouldLog', () => {
  const LEVELS = ['debug', 'info', 'warn', 'error'] as const

  it('error siempre sale (cualquier estado y entorno)', () => {
    for (const dev of [true, false]) {
      for (const state of ['on', 'off', 'auto'] as const) {
        expect(shouldLog('error', { dev, state })).toBe(true)
      }
    }
  })

  it("'off' silencia debug/info/warn incluso en dev", () => {
    for (const level of ['debug', 'info', 'warn'] as const) {
      expect(shouldLog(level, { dev: true, state: 'off' })).toBe(false)
      expect(shouldLog(level, { dev: false, state: 'off' })).toBe(false)
    }
  })

  it("'on' habilita todo, también sin dev", () => {
    for (const level of LEVELS) {
      expect(shouldLog(level, { dev: false, state: 'on' })).toBe(true)
    }
  })

  it("'auto' decide por el entorno", () => {
    for (const level of LEVELS) {
      expect(shouldLog(level, { dev: true, state: 'auto' })).toBe(true)
      expect(shouldLog(level, { dev: false, state: 'auto' })).toBe(level === 'error')
    }
  })
})

describe('formatCategory', () => {
  it('prefija con [gymlab:…] para poder grepear en consola/logcat', () => {
    expect(formatCategory('stepsSync')).toBe('[gymlab:stepsSync]')
  })
})

describe('LOG_FLAG_KEY', () => {
  it('mantiene la clave de storage acordada', () => {
    expect(LOG_FLAG_KEY).toBe('gymlab.debug')
  })
})
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npx vitest run tests/unit/domain/logger.test.ts`
Expected: FAIL — «Cannot find module '@/domain/logger'» (no existe todavía).

- [ ] **Step 3: Implementación mínima**

Crear `src/domain/logger.ts`:

```ts
// Política pura del logger de desarrollo (F110): sin imports de runtime (regla domain/).
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogFlagState = 'on' | 'off' | 'auto'

export const LOG_FLAG_KEY = 'gymlab.debug'

// Tres estados: '1' fuerza on, '0' fuerza off (incluso en dev), ausente = automático.
export const parseFlagState = (raw: string | null): LogFlagState =>
  raw === '1' ? 'on' : raw === '0' ? 'off' : 'auto'

export interface LoggerGate {
  dev: boolean
  state: LogFlagState
}

// error siempre sale; el resto con 'on' o (auto y dev). 'off' los silencia también en dev.
export const shouldLog = (level: LogLevel, { dev, state }: LoggerGate): boolean =>
  level === 'error' || state === 'on' || (state === 'auto' && dev)

// Prefijo estable para grep en consola/logcat.
export const formatCategory = (category: string): string => `[gymlab:${category}]`
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npx vitest run tests/unit/domain/logger.test.ts`
Expected: PASS (4 archivos de describe, ~9 tests).

- [ ] **Step 5: Verificación de gates + review + commit**

Run: `npm test` (suite completa verde) y `npm run build` (exit 0).
Ciclo de review del orquestador (AGENTS.md «Gentle AI») sobre el diff; luego:

```bash
git add src/domain/logger.ts tests/unit/domain/logger.test.ts
git commit -m "feat: política pura del logger de desarrollo (F110)"
```

---

### Task 2: Logger de consola (gate memoizado + thunk + helpers CDP)

**Files:**
- Create: `src/lib/logger.ts`
- Test: `tests/unit/lib/logger.test.ts`

**Interfaces:**
- Consumes: todo lo exportado por `src/domain/logger.ts` (Tarea 1).
- Produces (usado por Tareas 3–6): `const logger = { debug, info, warn, error }` con firma `(category: string, message: string, data?: unknown | (() => unknown)) => void`; `interface GymlabLogHelpers { enable(): string; disable(): string; reset(): string; status(): { state: LogFlagState; dev: boolean; active: boolean } }`; side-effect: instala `window.__gymlabLog` si `typeof window !== 'undefined'`.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/unit/lib/logger.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LOG_FLAG_KEY } from '@/domain/logger'

// storage en memoria: el gate memoiza UNA lectura al importar el módulo.
const makeStorage = (initial: Record<string, string> = {}) => {
  const memory = new Map<string, string>(Object.entries(initial))
  return {
    getItem: vi.fn((key: string) => memory.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      memory.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
      memory.delete(key)
    }),
  }
}

// Cada escenario importa el módulo FRESCO (resetModules) con los globals ya stubeados.
const importLogger = async (
  storage: ReturnType<typeof makeStorage>,
  win?: Record<string, unknown>,
) => {
  vi.stubGlobal('localStorage', storage)
  if (win) vi.stubGlobal('window', win)
  vi.resetModules()
  return import('@/lib/logger')
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('logger — gate y formato', () => {
  it('en dev (auto) imprime con formato [gymlab:categoria] y payload', async () => {
    vi.stubEnv('DEV', true)
    const { logger } = await importLogger(makeStorage())
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.warn('prueba', 'hola', { a: 1 })
    expect(warn).toHaveBeenCalledWith('[gymlab:prueba]', 'hola', { a: 1 })
  })

  it('mapea cada nivel a su método de consola', async () => {
    vi.stubEnv('DEV', true)
    const { logger } = await importLogger(makeStorage())
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.debug('x', 'd')
    logger.info('x', 'i')
    logger.warn('x', 'w')
    logger.error('x', 'e')
    expect(debug).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledTimes(1)
  })

  it('sin data no agrega argumento extra', async () => {
    vi.stubEnv('DEV', true)
    const { logger } = await importLogger(makeStorage())
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.warn('x', 'm')
    expect(warn).toHaveBeenCalledWith('[gymlab:x]', 'm')
  })

  it('lee localStorage una sola vez (gate memoizado, cero I/O por llamada)', async () => {
    vi.stubEnv('DEV', true)
    const storage = makeStorage()
    const { logger } = await importLogger(storage)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (let i = 0; i < 10; i += 1) logger.warn('x', `m${i}`)
    expect(storage.getItem).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledTimes(10)
  })

  it('producción sin flag: debug/info/warn mudos; error sale siempre', async () => {
    vi.stubEnv('DEV', false)
    const { logger } = await importLogger(makeStorage())
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.debug('x', 'd')
    logger.info('x', 'i')
    logger.warn('x', 'w')
    logger.error('x', 'e')
    expect(debug).not.toHaveBeenCalled()
    expect(info).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledTimes(1)
  })

  it("estado 'off' silencia en dev (pero error sigue)", async () => {
    vi.stubEnv('DEV', true)
    const { logger } = await importLogger(makeStorage({ [LOG_FLAG_KEY]: '0' }))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.warn('x', 'm')
    logger.error('x', 'm')
    expect(warn).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledTimes(1)
  })

  it('thunk: no se evalúa si el log no sale', async () => {
    vi.stubEnv('DEV', false)
    const { logger } = await importLogger(makeStorage())
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const build = vi.fn(() => ({ caro: true }))
    logger.warn('x', 'm', build)
    expect(build).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  it('thunk: se evalúa y se pasa el resultado cuando el log sale', async () => {
    vi.stubEnv('DEV', true)
    const { logger } = await importLogger(makeStorage())
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logger.warn('x', 'm', () => ({ caro: true }))
    expect(warn).toHaveBeenCalledWith('[gymlab:x]', 'm', { caro: true })
  })
})

describe('helpers de consola (window.__gymlabLog)', () => {
  it('enable/disable/reset actualizan memoria y storage; status los refleja', async () => {
    vi.stubEnv('DEV', false)
    const storage = makeStorage()
    const win: Record<string, unknown> = {}
    const { logger } = await importLogger(storage, win)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const helpers = win.__gymlabLog as {
      enable: () => string
      disable: () => string
      reset: () => string
      status: () => { state: string; dev: boolean; active: boolean }
    }

    expect(helpers.status()).toEqual({ state: 'auto', dev: false, active: false })
    logger.warn('x', 'm')
    expect(warn).not.toHaveBeenCalled()

    expect(helpers.enable()).toContain('ON')
    expect(storage.setItem).toHaveBeenCalledWith(LOG_FLAG_KEY, '1')
    expect(helpers.status()).toEqual({ state: 'on', dev: false, active: true })
    logger.warn('x', 'm')
    expect(warn).toHaveBeenCalledTimes(1)

    helpers.disable()
    expect(storage.setItem).toHaveBeenCalledWith(LOG_FLAG_KEY, '0')
    expect(helpers.status()).toEqual({ state: 'off', dev: false, active: false })

    helpers.reset()
    expect(storage.removeItem).toHaveBeenCalledWith(LOG_FLAG_KEY)
    expect(helpers.status()).toEqual({ state: 'auto', dev: false, active: false })
  })
})
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

Run: `npx vitest run tests/unit/lib/logger.test.ts`
Expected: FAIL — «Cannot find module '@/lib/logger'».

- [ ] **Step 3: Implementación mínima**

Crear `src/lib/logger.ts`:

```ts
// Logger de desarrollo (F110). Sink a consola con niveles; el gate se memoiza al importar
// (cero I/O por llamada) y los helpers de consola lo actualizan al instante, sin UI.
import {
  LOG_FLAG_KEY,
  formatCategory,
  parseFlagState,
  shouldLog,
  type LogFlagState,
  type LogLevel,
} from '@/domain/logger'

export type LogData = unknown | (() => unknown)
export type LogFn = (category: string, message: string, data?: LogData) => void

const readStoredState = (): LogFlagState => {
  try {
    return parseFlagState(localStorage.getItem(LOG_FLAG_KEY))
  } catch {
    return 'auto' // sin localStorage (node/tests): automático
  }
}

// Memoizado: una sola lectura de storage; los helpers actualizan esta variable.
let cachedState: LogFlagState = readStoredState()

const writeStoredState = (state: LogFlagState): void => {
  try {
    if (state === 'auto') localStorage.removeItem(LOG_FLAG_KEY)
    else localStorage.setItem(LOG_FLAG_KEY, state === 'on' ? '1' : '0')
  } catch {
    // Sin storage: el estado en memoria igual aplica.
  }
}

// Thunk perezoso: un `data` función se evalúa solo cuando el log efectivamente sale.
const resolveData = (data: LogData): unknown =>
  typeof data === 'function' ? (data as () => unknown)() : data

const sinks: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: (...args) => console.debug(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
}

const write = (level: LogLevel, category: string, message: string, data?: LogData): void => {
  if (!shouldLog(level, { dev: import.meta.env.DEV, state: cachedState })) return
  if (data === undefined) sinks[level](formatCategory(category), message)
  else sinks[level](formatCategory(category), message, resolveData(data))
}

export const logger = {
  debug: (category: string, message: string, data?: LogData) =>
    write('debug', category, message, data),
  info: (category: string, message: string, data?: LogData) =>
    write('info', category, message, data),
  warn: (category: string, message: string, data?: LogData) =>
    write('warn', category, message, data),
  error: (category: string, message: string, data?: LogData) =>
    write('error', category, message, data),
} satisfies Record<LogLevel, LogFn>

// Helpers ocultos para depurar builds instaladas por CDP (sin UI; no a nivel usuario).
export interface GymlabLogHelpers {
  enable: () => string
  disable: () => string
  reset: () => string
  status: () => { state: LogFlagState; dev: boolean; active: boolean }
}

const setState = (state: LogFlagState): string => {
  cachedState = state
  writeStoredState(state)
  const label = state === 'on' ? 'ON' : state === 'off' ? 'OFF' : 'AUTO'
  return `[gymlab] logs ${label}`
}

if (typeof window !== 'undefined') {
  const helpers: GymlabLogHelpers = {
    enable: () => setState('on'),
    disable: () => setState('off'),
    reset: () => setState('auto'),
    status: () => ({
      state: cachedState,
      dev: import.meta.env.DEV,
      active: shouldLog('info', { dev: import.meta.env.DEV, state: cachedState }),
    }),
  }
  ;(window as unknown as { __gymlabLog?: GymlabLogHelpers }).__gymlabLog = helpers
}
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

Run: `npx vitest run tests/unit/lib/logger.test.ts`
Expected: PASS (~9 tests).

- [ ] **Step 5: Gates + review + commit**

Run: `npm test` y `npm run build` (verdes). Ciclo de review del orquestador, luego:

```bash
git add src/lib/logger.ts tests/unit/lib/logger.test.ts
git commit -m "feat: logger de consola con gate memoizado y helpers de CDP (F110)"
```

---

### Task 3: Reemplazos existentes + log de arranque (boundary, stepsSync, main)

**Files:**
- Modify: `src/components/layout/AppErrorBoundary.tsx` (catch en `componentDidCatch`, línea ~21)
- Modify: `src/data/stepsSync.ts` (catch en `syncStepsFromHealth`, líneas 52–59)
- Modify: `tests/unit/data/stepsSync.test.ts` (mock del logger + aserción)
- Modify: `src/main.tsx` (log de arranque antes de `createRoot`)

**Interfaces:**
- Consumes: `logger` de `@/lib/logger` (Tarea 2).
- Produces: los primeros consumidores reales del logger; mensajes `[gymlab:errorBoundary]`, `[gymlab:stepsSync]`, `[gymlab:boot]`.

- [ ] **Step 1: Actualizar el test de stepsSync (falla primero)**

En `tests/unit/data/stepsSync.test.ts`, junto al mock de telemetría (línea ~31) agregar:

```ts
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }))
const { logger } = await import('@/lib/logger')
const loggedError = logger.error as unknown as ReturnType<typeof vi.fn>
```

Y en el test `'error del bridge → status error, sin tocar datos'` añadir la aserción:

```ts
    expect(loggedError).toHaveBeenCalledWith(
      'stepsSync',
      'fallo al sincronizar pasos de salud',
      { error: expect.any(Error) },
    )
```

- [ ] **Step 2: Ejecutar para verificar que falla**

Run: `npx vitest run tests/unit/data/stepsSync.test.ts`
Expected: FAIL — `logger.error` no fue llamado (el source todavía usa `console.error`).

- [ ] **Step 3: Editar `src/data/stepsSync.ts`**

Agregar import tras el de telemetría:

```ts
import { logger } from '@/lib/logger'
```

Reemplazar el bloque del catch (líneas 52–59):

```ts
  } catch (error) {
    // El fallo queda en consola (logcat en el dispositivo) manteniendo el retorno de error.
    logger.error('stepsSync', 'fallo al sincronizar pasos de salud', { error })
    track('steps_sync_failed', { reason: 'error' })
    return { status: 'error' }
  }
```

- [ ] **Step 4: Ejecutar para verificar que pasa**

Run: `npx vitest run tests/unit/data/stepsSync.test.ts`
Expected: PASS.

- [ ] **Step 5: Editar `src/components/layout/AppErrorBoundary.tsx`**

Agregar import (tras `import { i18n } from '@/i18n'`):

```ts
import { logger } from '@/lib/logger'
```

Reemplazar `componentDidCatch`:

```ts
  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Queda en consola (logcat en el dispositivo) con contexto para diagnosticar.
    logger.error('errorBoundary', 'error de render capturado', {
      error,
      componentStack: info.componentStack,
    })
  }
```

- [ ] **Step 6: Editar `src/main.tsx` (log de arranque)**

Agregar import (tras `import { AppErrorBoundary } ...`):

```ts
import { logger } from './lib/logger'
```

Insertar antes del bloque de comentario de `StrictMode` (entre el listener de `vite:preloadError` y `createRoot`):

```ts
// Marcador de sesión en consola (visible solo en dev o con el switch `gymlab.debug`).
logger.info('boot', 'arrancando GymLab', { mode: import.meta.env.MODE })
```

- [ ] **Step 7: Gates + review + commit**

Run: `npm test` y `npm run build` (verdes; el boot log no rompe ninguna suite). Ciclo de review del orquestador, luego:

```bash
git add src/components/layout/AppErrorBoundary.tsx src/data/stepsSync.ts tests/unit/data/stepsSync.test.ts src/main.tsx
git commit -m "feat: trazas del logger en boundary, stepsSync y arranque (F110)"
```

---

### Task 4: Errores silenciosos de datos y sesión (providers, store, hook)

**Files:**
- Modify: `src/app/providers.tsx` (catch del boot, línea ~40)
- Modify: `src/store/activeWorkoutStore.ts` (catch del persist, líneas 52–56)
- Modify: `src/hooks/useActiveSession.ts` (catch del guardado, líneas 222–225)

**Interfaces:**
- Consumes: `logger` (Tarea 2).
- Produces: mensajes `[gymlab:boot]`, `[gymlab:activeWorkout]`, `[gymlab:session]`.

- [ ] **Step 1: Editar `src/app/providers.tsx`**

Agregar el import `import { logger } from '@/lib/logger'` junto al resto de imports del archivo y reemplazar el catch:

```ts
      } catch (error) {
        logger.error('boot', 'falló la preparación inicial', { error })
        if (!cancelled) setError(error instanceof Error ? error.message : 'Error al cargar')
      }
```

- [ ] **Step 2: Editar `src/store/activeWorkoutStore.ts`**

Agregar el import de `logger` (`import { logger } from '@/lib/logger'`) y reemplazar el catch del flush:

```ts
  try {
    localStorage.setItem(pendingName, JSON.stringify(pendingValue))
  } catch (error) {
    // Cuota u otro error de storage: se ignora (como Zustand), pero queda traza.
    logger.error('activeWorkout', 'no se pudo persistir el entreno activo', { error })
  }
```

- [ ] **Step 3: Editar `src/hooks/useActiveSession.ts`**

Agregar el import `import { logger } from '@/lib/logger'` y reemplazar el catch del guardado:

```ts
    } catch (error) {
      logger.error('session', 'no se pudo guardar la sesión', { error })
      setSaving(false)
      window.alert(t('session.guardarError'))
    }
```

- [ ] **Step 4: Gates + review + commit**

Run: `npm test` y `npm run build` (verdes). Ciclo de review del orquestador, luego:

```bash
git add src/app/providers.tsx src/store/activeWorkoutStore.ts src/hooks/useActiveSession.ts
git commit -m "feat: trazas del logger en errores silenciosos de datos y sesión (F110)"
```

---

### Task 5: Degradaciones silenciosas (6 sitios + test de galería)

**Files:**
- Modify: `src/data/repositories/dexie/metaRepo.ts` (catch línea ~21)
- Modify: `src/data/backup.ts` (catch línea ~68)
- Modify: `src/data/catalogLoader.ts` (catch línea ~30)
- Modify: `src/data/localNotificationsBackend.ts` (catch línea ~86)
- Modify: `src/data/restAlertBridge.ts` (catch línea ~65)
- Modify: `src/lib/saveToGallery.ts` (catch línea ~44)
- Modify: `tests/unit/lib/saveToGallery.test.ts` (mock del logger + aserción)

**Interfaces:**
- Consumes: `logger` (Tarea 2).
- Produces: mensajes `[gymlab:meta]`, `[gymlab:backup]`, `[gymlab:catalog]`, `[gymlab:notifications]`, `[gymlab:restAlert]`, `[gymlab:gallery]`.

- [ ] **Step 1: Actualizar el test de galería (falla primero)**

En `tests/unit/lib/saveToGallery.test.ts` agregar (junto a los mocks existentes del archivo):

```ts
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }))
const { logger } = await import('@/lib/logger')
const loggedWarn = logger.warn as unknown as ReturnType<typeof vi.fn>
```

Y en el test `'cuenta los fallos por foto sin cortar el resto'` añadir:

```ts
    expect(loggedWarn).toHaveBeenCalledWith(
      'gallery',
      'no se pudo guardar la foto',
      { error: expect.objectContaining({ code: 'accessDenied' }) },
    )
```

(Si el archivo no limpia mocks entre tests y la aserción queda sucia, agregar `loggedWarn.mockClear()` al inicio de ese test.)

- [ ] **Step 2: Ejecutar para verificar que falla**

Run: `npx vitest run tests/unit/lib/saveToGallery.test.ts`
Expected: FAIL — `logger.warn` no fue llamado (el source todavía traga el error).

- [ ] **Step 3: Editar `src/lib/saveToGallery.ts`**

Agregar import `import { logger } from '@/lib/logger'` y reemplazar el catch del loop:

```ts
    } catch (error) {
      logger.warn('gallery', 'no se pudo guardar la foto', { error })
      failed++
    }
```

- [ ] **Step 4: Ejecutar para verificar que pasa**

Run: `npx vitest run tests/unit/lib/saveToGallery.test.ts`
Expected: PASS.

- [ ] **Step 5: Editar `src/data/repositories/dexie/metaRepo.ts`**

Agregar import `import { logger } from '@/lib/logger'` y reemplazar el catch:

```ts
    } catch (error) {
      logger.warn('meta', 'JSON corrupto en meta: uso el fallback', { key, error })
      return fallback
    }
```

- [ ] **Step 6: Editar `src/data/backup.ts`**

Agregar import `import { logger } from '@/lib/logger'` y reemplazar el catch de `parseBackup`:

```ts
  } catch (error) {
    logger.warn('backup', 'backup ilegible: JSON inválido', { error })
    return null
  }
```

- [ ] **Step 7: Editar `src/data/catalogLoader.ts`**

Agregar import `import { logger } from '@/lib/logger'` y reemplazar el catch:

```ts
  } catch (error) {
    // offline o JSON inválido: seguimos con el seed embebido.
    logger.warn('catalog', 'catálogo remoto inaccesible: uso el seed embebido', { error })
  }
```

- [ ] **Step 8: Editar `src/data/localNotificationsBackend.ts`**

Agregar import `import { logger } from '@/lib/logger'` y reemplazar SOLO el catch de `getLocalNotificationsBackend` (línea ~86; el de `checkExactAlarm` queda como está):

```ts
  } catch (error) {
    logger.warn('notifications', 'backend nativo no disponible: uso el no-op', { error })
    return NULL_BACKEND
  }
```

- [ ] **Step 9: Editar `src/data/restAlertBridge.ts`**

Agregar import `import { logger } from '@/lib/logger'` y reemplazar SOLO el catch de `scheduleRestAlert` (línea ~65; `cancelRestAlert` queda como está):

```ts
    } catch (error) {
      logger.warn('restAlert', 'no se pudo programar la alerta de descanso', { error })
      return { scheduled: false, warning: null }
    }
```

- [ ] **Step 10: Gates + review + commit**

Run: `npm test` y `npm run build` (verdes). Ciclo de review del orquestador, luego:

```bash
git add src/data/repositories/dexie/metaRepo.ts src/data/backup.ts src/data/catalogLoader.ts src/data/localNotificationsBackend.ts src/data/restAlertBridge.ts src/lib/saveToGallery.ts tests/unit/lib/saveToGallery.test.ts
git commit -m "feat: trazas del logger en degradaciones silenciosas (F110)"
```

---

### Task 6: E2E del logger (3 estados + boot log + silencio real)

**Files:**
- Create: `tests/e2e/test_f110_logger.py`

**Interfaces:**
- Consumes: `window.__gymlabLog` (`status/enable/disable/reset`), boot log `[gymlab:boot]`, clave `gymlab.debug` en localStorage.

- [ ] **Step 1: Crear el test e2e**

Crear `tests/e2e/test_f110_logger.py`:

```python
# F110 — Logger de desarrollo: helpers de CDP, boot log y switch de 3 estados.
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"
BOOT_PREFIX = "[gymlab:boot]"


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()

        console_all = []
        console_errors = []
        page.on("console", lambda m: console_all.append(f"{m.type}: {m.text}"))
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}")
            if m.type == "error"
            else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            # A) Dev: helpers presentes, estado automático activo y boot log visible.
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(800)

            status = page.evaluate("() => window.__gymlabLog?.status?.()")
            assert status == {"state": "auto", "dev": True, "active": True}, (
                f"status inesperado: {status}"
            )
            assert any(BOOT_PREFIX in line for line in console_all), (
                "no apareció el boot log en dev"
            )
            print("OK: estado auto + boot log visibles en dev")

            # B) disable() → '0' persistido y silencio real tras reload.
            confirm = page.evaluate("() => window.__gymlabLog.disable()")
            assert "OFF" in confirm, f"disable() devolvió: {confirm}"
            console_all.clear()
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(800)
            assert not any(BOOT_PREFIX in line for line in console_all), (
                "el boot log debería estar silenciado con disable()"
            )
            status = page.evaluate("() => window.__gymlabLog?.status?.()")
            assert status == {"state": "off", "dev": True, "active": False}, (
                f"status tras disable: {status}"
            )
            assert page.evaluate("() => localStorage.getItem('gymlab.debug')") == "0"
            print("OK: disable() silencia en dev (persistido + reload)")

            # C) reset() → vuelve al automático y el boot log reaparece.
            console_all.clear()
            page.evaluate("() => window.__gymlabLog.reset()")
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(800)
            assert any(BOOT_PREFIX in line for line in console_all), (
                "el boot log debería volver tras reset()"
            )
            assert page.evaluate("() => localStorage.getItem('gymlab.debug')") is None
            print("OK: reset() vuelve al automático")

        except AssertionError as e:
            errors.append(f"AssertionError: {e}")
        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            page.close()
            context.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F110 logger (3 estados + boot log + silencio real)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Ejecutar el e2e**

Run (desde `gymlab-app`): `python tests/e2e/scripts/with_server.py tests/e2e/test_f110_logger.py`
Expected: `ALL OK: F110 logger (3 estados + boot log + silencio real)` y exit 0. (Si el puerto 5173 ya está ocupado, `with_server.py` reutiliza el server existente.)

- [ ] **Step 3: Gates + review + commit**

Run: `npm test` y `npm run build` (sin regresión). Ciclo de review del orquestador, luego:

```bash
git add tests/e2e/test_f110_logger.py
git commit -m "test(e2e): smoke del logger de desarrollo (F110)"
```

---

### Task 7: Cierre documental (CHANGELOG + PLAN)

**Files:**
- Modify: `CHANGELOG.md` (bajo `[Unreleased]` → `Added`)
- Modify: `PLAN.md` (marcar el checkbox de 110.1, línea ~584)

- [ ] **Step 1: Actualizar `CHANGELOG.md`**

En la sección `[Unreleased]` → `Added`, agregar:

```md
- **F110 — logger de desarrollo**: `src/domain/logger.ts` (política pura: niveles, estados `on/off/auto`, `shouldLog`) + `src/lib/logger.ts` (sink a consola con gate memoizado — cero I/O por llamada apagada —, payload thunk opcional y helpers `window.__gymlabLog.enable/disable/reset/status` para CDP). Instrumentados 11 fallos silenciosos (boundary, arranque, quota del entreno activo, guardado de sesión, stepsSync, meta, backup, catálogo, notificaciones, alerta de descanso, galería) + log de arranque; `error` sale siempre, `debug/info/warn` solo en dev o con el flag oculto `gymlab.debug`. e2e `test_f110_logger.py`.
```

- [ ] **Step 2: Actualizar `PLAN.md`**

Reemplazar la línea del checkbox:

```md
- [ ] **110.1 — Poner un logger en la app para ayudar a depurar si es posible, a nivel de desarrollo, no a nivel de usuario**.
```

por:

```md
- [x] **110.1 — Poner un logger en la app para ayudar a depurar si es posible, a nivel de desarrollo, no a nivel de usuario**. Implementado: `src/domain/logger.ts` + `src/lib/logger.ts` (3 estados `gymlab.debug`, gate memoizado, helpers CDP), 11 integraciones + log de arranque, e2e `test_f110_logger.py`. Spec: `docs/superpowers/specs/2026-09-27-f110-logger-desarrollo-design.md`.
```

- [ ] **Step 3: Gates finales + commit**

Run: `npm test` y `npm run build` (verdes). Luego:

```bash
git add CHANGELOG.md PLAN.md
git commit -m "docs: cerrar F110 (CHANGELOG + PLAN)"
```

---

## Cierre de rama (orquestador, post-tareas)

1. Smoke de emulador **recomendado, no bloqueante**: `npm run android:sync` → APK debug → CDP → `__gymlabLog.enable()` → verificar log en consola/logcat.
2. `git -C .worktrees/f110 rebase main` → `git merge --ff-only f110` desde el repo principal (otras sesiones idle) → `.\scripts\worktree.ps1 close f110`.
3. Registrar el hito en Engram cuando el MCP esté disponible (no bloquear el cierre por ello).
