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
