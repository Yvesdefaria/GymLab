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
