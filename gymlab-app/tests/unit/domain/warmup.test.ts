// Calentamiento anclado al mismo deadline que rondas y descanso (F96, D6): cada
// ejercicio deriva su restante de un deadline y los ticks saltados no acumulan error.
import { describe, expect, it } from 'vitest'
import {
  generalWarmup,
  initialWarmupState,
  nextWarmupExercise,
  pauseWarmup,
  reconcileWarmup,
  startWarmup,
  type WarmupState,
} from '@/domain/warmup'

const T0 = 2_000_000
const first = generalWarmup.exercises[0].durationSeconds // 45
const second = generalWarmup.exercises[1].durationSeconds // 45

const started = (): WarmupState => startWarmup(initialWarmupState(), T0)

describe('initialWarmupState', () => {
  it('deriva el restante del primer ejercicio y arranca sin deadline', () => {
    const state = initialWarmupState()
    expect(state.currentIndex).toBe(0)
    expect(state.secondsRemaining).toBe(first)
    expect(state.totalSeconds).toBe(first)
    expect(state.phaseEndsAt).toBeNull()
    expect(state.isRunning).toBe(false)
  })
})

describe('startWarmup', () => {
  it('ancla el deadline del ejercicio actual', () => {
    const state = started()
    expect(state.phaseEndsAt).toBe(T0 + first * 1000)
    expect(state.isRunning).toBe(true)
  })
})

describe('reconcileWarmup', () => {
  it('deriva el restante del deadline, no de ticks acumulados', () => {
    const state = reconcileWarmup(started(), T0 + 20_000)
    expect(state.secondsRemaining).toBe(first - 20)
    expect(state.elapsed).toBe(20)
    expect(state.currentIndex).toBe(0)
  })

  it('no pierde tiempo cuando se saltan ticks', () => {
    const state = reconcileWarmup(started(), T0 + 44_000)
    expect(state.secondsRemaining).toBe(1)
    expect(state.elapsed).toBe(44)
  })

  it('al vencer avanza al siguiente ejercicio con deadline nuevo', () => {
    const state = reconcileWarmup(started(), T0 + first * 1000)
    expect(state.currentIndex).toBe(1)
    expect(state.totalSeconds).toBe(second)
    expect(state.secondsRemaining).toBe(second)
    expect(state.phaseEndsAt).toBe(T0 + first * 1000 + second * 1000)
    expect(state.isRunning).toBe(true)
    expect(state.elapsed).toBe(first)
  })

  it('al vencer el último ejercicio termina el flujo', () => {
    const last = generalWarmup.exercises.length - 1
    const duration = generalWarmup.exercises[last].durationSeconds
    const state: WarmupState = {
      ...initialWarmupState(),
      currentIndex: last,
      totalSeconds: duration,
      secondsRemaining: duration,
      isRunning: true,
      phaseEndsAt: T0 + duration * 1000,
    }
    const finished = reconcileWarmup(state, T0 + duration * 1000)
    expect(finished.isFinished).toBe(true)
    expect(finished.isRunning).toBe(false)
    expect(finished.secondsRemaining).toBe(0)
    expect(finished.phaseEndsAt).toBeNull()
  })
})

describe('nextWarmupExercise', () => {
  it('saltar avanza y reancla el deadline en el instante del salto', () => {
    const state = nextWarmupExercise(started(), T0 + 5_000)
    expect(state.currentIndex).toBe(1)
    expect(state.secondsRemaining).toBe(second)
    expect(state.phaseEndsAt).toBe(T0 + 5_000 + second * 1000)
    // El tiempo consumido del ejercicio saltado no se pierde del contador global.
    expect(state.elapsed).toBe(5)
  })
})

describe('pauseWarmup / startWarmup', () => {
  it('pausar congela el restante y reanudar reancla el deadline', () => {
    const paused = pauseWarmup(started(), T0 + 15_000)
    expect(paused.isRunning).toBe(false)
    expect(paused.phaseEndsAt).toBeNull()
    expect(paused.secondsRemaining).toBe(first - 15)

    const resumed = startWarmup(paused, T0 + 60_000)
    expect(resumed.isRunning).toBe(true)
    expect(resumed.phaseEndsAt).toBe(T0 + 60_000 + (first - 15) * 1000)
    expect(resumed.secondsRemaining).toBe(first - 15)
  })
})
