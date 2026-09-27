# F110 — Logger de desarrollo (diseño)

> Fecha: 2026-09-27 · Estado: aprobado · Fuente: fase F110 de `PLAN.md` (nota #16) · «Poner un logger en la app para ayudar a depurar si es posible, a nivel de desarrollo, no a nivel de usuario»

## Contexto

- Hoy **no hay infraestructura de logs**: solo 2 `console.*` en todo `src` (`AppErrorBoundary.tsx:21` y `stepsSync.ts:56`).
- La telemetría existente (Sentry/PostHog, F93 #27) es **de producto**: solo-producción + consentimiento; su `reportError` (único `captureException`) **no tiene llamadores**. No cubre depuración de desarrollo.
- **46 `catch`** en `src`; **~24 tragan el error en silencio** — varios con pérdida de datos real (quota del entreno activo, `meta` corrupto, backup ilegible, catálogo, notificaciones, sync).
- El emulador/dispositivo corre **builds de producción** (`android:sync`): un logger atado solo a `import.meta.env.DEV` no se vería ahí — justo donde duele depurar (pantalla negra, notificaciones, sync).

## Decisiones (aprobadas por el usuario)

1. **Alcance estándar**: módulo logger + instrumentar los caminos que hoy fallan en silencio (~11 puntos).
2. **Activación**: `DEV` automático + **switch oculto** en build instalada (`localStorage['gymlab.debug']='1'` vía helper `window.__gymlabLog`), **sin UI**, apagado por defecto. Nada a nivel usuario.
3. **Estructura (enfoque A)**: espejo del patrón de telemetría — política pura en `domain/logger.ts` + implementación/sink en `lib/logger.ts`.
4. **Política por nivel**: `error` **siempre** sale (preserva el diagnóstico actual por consola/logcat); `debug/info/warn` solo con dev o flag.
5. **YAGNI**: sin ring buffer/export; sin conectar Sentry (`reportError` sigue sin llamarse — decisión aparte de telemetría de producto); sin hooks globales `onerror`/`unhandledrejection`.

## Diseño

### WP1 — `src/domain/logger.ts` (puro, TDD)

```ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export const LOG_FLAG_KEY = 'gymlab.debug'
export const parseFlag = (raw: string | null): boolean => raw === '1'
export interface LoggerGate { dev: boolean; flag: boolean }
// Política: error siempre; debug/info/warn solo con dev o flag (no hay superficie de usuario).
export const shouldLog = (level: LogLevel, { dev, flag }: LoggerGate): boolean =>
  level === 'error' || dev || flag
// Prefijo estable para grep en consola/logcat.
export const formatCategory = (category: string): string => `[gymlab:${category}]`
```

Sin imports de runtime (regla `domain/`).

### WP2 — `src/lib/logger.ts` (sink consola + activación)

- API: `logger.debug|info|warn|error(category: string, message: string, data?: unknown)` → `console[level](formatCategory(category), message, …(data === undefined ? [] : [data]))`.
- Gate **por llamada** (sin memo → el switch aplica al instante, sin reload): `dev = import.meta.env.DEV`; `flag = parseFlag(localStorage.getItem(LOG_FLAG_KEY))` envuelto en try/catch (tests/node).
- Helpers ocultos para CDP (instalados por el módulo al importarse; guard `typeof window !== 'undefined'`; idempotente/HMR-safe):
  - `window.__gymlabLog.enable()` → escribe el flag; devuelve confirmación legible.
  - `window.__gymlabLog.disable()` → quita el flag.
  - `window.__gymlabLog.status()` → `{ dev, flag, active }` (`active` = `debug/info/warn` habilitados; `error` sale siempre, no depende del gate).
- Cuando no aplica: early return (no-op barato).

### WP3 — Integraciones (11 puntos silenciosos)

| # | Punto | Hoy | Nivel | Extra |
|---|-------|-----|-------|-------|
| 1 | `AppErrorBoundary.tsx:21` | `console.error` del error de render | error | `{ error, componentStack }` (reemplaza el console) |
| 2 | `app/providers.tsx:40` | fallo de boot (seed/settings) → solo texto en UI | error | — |
| 3 | `store/activeWorkoutStore.ts:54` | quota → entreno activo no persistido (se traga) | error | capturar `e` (hoy `catch {`) |
| 4 | `hooks/useActiveSession.ts:222` | guardado de sesión → solo `window.alert` | error | capturar `e`; mantener el alert |
| 5 | `data/stepsSync.ts:56` | `console.error('[stepsSync] …')` | error | `track()` intacto |
| 6 | `data/repositories/dexie/metaRepo.ts:21` | JSON corrupto → fallback silencioso | warn | key |
| 7 | `data/backup.ts:68` | backup ilegible → `null` | warn | — |
| 8 | `data/catalogLoader.ts:30` | catálogo inaccesible → seed embebido | warn | — |
| 9 | `data/localNotificationsBackend.ts:86` | plugin nativo → `NULL_BACKEND` | warn | — |
| 10 | `data/restAlertBridge.ts:65` | alerta de descanso no programada | warn | — |
| 11 | `lib/saveToGallery.ts:44` | foto no guardada (`failed++`) | warn | — |

Reglas:

- Mensajes cortos **en español** (mismo patrón que el `[stepsSync] fallo al…` actual).
- `data` = error técnico + ids/keys; **nunca contenido del usuario** (nombres, notas, textos ni valores de campos).
- Categorías: `errorBoundary`, `boot`, `activeWorkout`, `session`, `stepsSync`, `meta`, `backup`, `catalog`, `notifications`, `restAlert`, `gallery`.

Queda afuera salvo pedido explícito: `data/routinePersistence.ts:36` (devuelve `{ok:false, error}` y el caller la convierte en booleano; la causa se podría loggear si se quiere reforzar).

### WP4 — Tests (TDD)

- `tests/unit/domain/logger.test.ts`: matriz de `shouldLog` (dev × flag × 4 niveles; `error` siempre), `parseFlag`, `formatCategory`.
- `tests/unit/lib/logger.test.ts`: con `vi.stubEnv('DEV', …)` y stub de `localStorage`/`window` (node env); formato, payload, silencio por gate, y `enable/disable/status` (escriben/leen el flag y reportan estado).
- `tests/e2e/test_f110_logger.py`: `window.__gymlabLog` presente; `status()` activo en dev; roundtrip `disable()/enable()` (localStorage) — patrón `with_server.py`.

### WP5 — Verificación y cierre

- Gates del repo: `npm run build` (typecheck real vía `tsc -b`) + `npm test` + e2e F110.
- Smoke de emulador (**recomendado, no bloqueante**): `android:sync` → CDP → `__gymlabLog.enable()` → log visible en consola/logcat (es el caso de uso que motivó el switch).
- `CHANGELOG.md` bajo `[Unreleased]`, `PLAN.md` (marcar 110.1), commits por tarea en la rama `f110` (sin push).

## Criterio de aceptación

1. En `npm run dev` los logs salen solos; en build de producción solo `error`, salvo `gymlab.debug=1` (activado con `__gymlabLog.enable()` desde CDP), sin UI involucrada.
2. Los 11 puntos dejan traza con categoría + error técnico; cero contenido de usuario.
3. `AppErrorBoundary` y `stepsSync` conservan su diagnóstico actual en logcat (paridad) y ganan contexto.
4. `npm run build` + `npm test` + e2e verdes; `CHANGELOG.md` y `PLAN.md` al día.

## Fuera de alcance (YAGNI)

- Ring buffer en memoria, export de logs, overlay de depuración.
- Sentry: conectar `reportError` (posible fase futura de telemetría de producto).
- Hooks globales de errores no capturados (la consola nativa ya los muestra).
- Cambios de UI o del flujo de consentimiento de telemetría.
