// Primitiva de cuenta atrás anclada a un deadline absoluto (F96, D6): el intervalo
// de 1 Hz sólo repinta; el tiempo restante siempre se deriva del deadline.
import { describe, expect, it } from 'vitest'
import {
  countdownFraction,
  createCountdown,
  pauseCountdown,
  reconcile,
  remainingSeconds,
  resumeCountdown,
  startCountdown,
} from '@/domain/countdown'

const T0 = 1_000_000 // base fija para no depender del reloj real

describe('createCountdown', () => {
  it('arranca sin deadline ni pausa y recuerda el total', () => {
    expect(createCountdown(90)).toEqual({ endsAt: null, pausedRemaining: null, totalSeconds: 90 })
  })
})

describe('startCountdown', () => {
  it('ancla el deadline a now + total y limpia la pausa', () => {
    const started = startCountdown(createCountdown(90), T0)
    expect(started.endsAt).toBe(T0 + 90_000)
    expect(started.pausedRemaining).toBeNull()
  })
})

describe('remainingSeconds', () => {
  const started = startCountdown(createCountdown(90), T0)

  it('deriva el restante del deadline, no de ticks acumulados', () => {
    expect(remainingSeconds(started, T0)).toBe(90)
    expect(remainingSeconds(started, T0 + 30_000)).toBe(60)
    expect(remainingSeconds(started, T0 + 89_000)).toBe(1)
  })

  it('redondea hacia arriba (ceil) los milisegundos sobrantes', () => {
    // A 79.5 s del inicio quedan 10.5 s → debe mostrarse 11, no 10.
    expect(remainingSeconds(started, T0 + 79_500)).toBe(11)
  })

  it('nunca baja de cero pasado el deadline', () => {
    expect(remainingSeconds(started, T0 + 90_000)).toBe(0)
    expect(remainingSeconds(started, T0 + 130_000)).toBe(0)
  })

  it('congela el valor mientras está pausada', () => {
    const paused = pauseCountdown(started, T0 + 30_000)
    expect(remainingSeconds(paused, T0 + 30_000)).toBe(60)
    expect(remainingSeconds(paused, T0 + 999_000)).toBe(60)
  })
})

describe('pauseCountdown / resumeCountdown', () => {
  const started = startCountdown(createCountdown(90), T0)

  it('pausar guarda el restante en ms y borra el deadline', () => {
    const paused = pauseCountdown(started, T0 + 30_000)
    expect(paused.endsAt).toBeNull()
    expect(paused.pausedRemaining).toBe(60_000)
  })

  it('reanudar fija un deadline nuevo a partir del restante pausado', () => {
    const resumed = resumeCountdown(pauseCountdown(started, T0 + 30_000), T0 + 100_000)
    expect(resumed.endsAt).toBe(T0 + 160_000)
    expect(resumed.pausedRemaining).toBeNull()
    expect(remainingSeconds(resumed, T0 + 100_000)).toBe(60)
    expect(remainingSeconds(resumed, T0 + 130_000)).toBe(30)
  })

  it('reanudar una cuenta no pausada no cambia nada', () => {
    expect(resumeCountdown(started, T0 + 5_000)).toBe(started)
  })
})

describe('reconcile', () => {
  const started = startCountdown(createCountdown(90), T0)

  it('antes del deadline mantiene la cuenta y no la marca terminada', () => {
    const { next, finishedNow } = reconcile(started, T0 + 30_000)
    expect(finishedNow).toBe(false)
    expect(next.endsAt).toBe(started.endsAt)
    expect(remainingSeconds(next, T0 + 30_000)).toBe(60)
  })

  it('pasado el deadline asienta en cero y reporta finishedNow', () => {
    const { next, finishedNow } = reconcile(started, T0 + 90_000)
    expect(finishedNow).toBe(true)
    expect(remainingSeconds(next, T0 + 90_000)).toBe(0)
  })

  it('sólo reporta finishedNow una vez', () => {
    const first = reconcile(started, T0 + 95_000)
    expect(first.finishedNow).toBe(true)
    const second = reconcile(first.next, T0 + 96_000)
    expect(second.finishedNow).toBe(false)
    expect(remainingSeconds(second.next, T0 + 96_000)).toBe(0)
  })

  it('una cuenta pausada nunca termina por reconciliación', () => {
    const paused = pauseCountdown(started, T0 + 30_000)
    const { finishedNow } = reconcile(paused, T0 + 999_000)
    expect(finishedNow).toBe(false)
  })
})

describe('countdownFraction', () => {
  it('deriva la fracción consumida por defecto (modo elapsed)', () => {
    expect(countdownFraction(90, 90)).toBe(0)
    expect(countdownFraction(30, 90)).toBeCloseTo(2 / 3, 5)
    expect(countdownFraction(0, 90)).toBe(1)
  })

  it('deriva la fracción restante en modo remaining', () => {
    expect(countdownFraction(90, 90, 'remaining')).toBe(1)
    expect(countdownFraction(30, 90, 'remaining')).toBeCloseTo(1 / 3, 5)
    expect(countdownFraction(0, 90, 'remaining')).toBe(0)
  })

  it('acota la fracción a [0, 1]', () => {
    expect(countdownFraction(-15, 90)).toBe(1)
    expect(countdownFraction(180, 90, 'remaining')).toBe(1)
  })

  it('con total cero no divide por cero', () => {
    expect(countdownFraction(0, 0)).toBe(0)
  })
})
