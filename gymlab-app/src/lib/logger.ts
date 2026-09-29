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
