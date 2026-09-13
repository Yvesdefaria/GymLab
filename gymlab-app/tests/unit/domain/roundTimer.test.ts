// Timer de rondas anclado a un deadline absoluto (F96, D6): el intervalo sólo
// repinta y el restante se deriva del deadline, nunca de un decremento por tick.
import { describe, expect, it } from 'vitest'
import {
  initialTimerState,
  pauseTimer,
  reconcileTimer,
  startTimer,
  type RoundConfig,
  type TimerState,
} from '@/domain/roundTimer'

const T0 = 1_000_000

const config: RoundConfig = {
  mode: 'custom',
  workSeconds: 90,
  restSeconds: 30,
  rounds: 0,
  totalRounds: 3,
  timeCap: 0,
}

const started = (): TimerState => startTimer(initialTimerState(config), T0)

describe('initialTimerState', () => {
  it('deriva el restante del total y arranca sin deadline', () => {
    const state = initialTimerState(config)
    expect(state.secondsRemaining).toBe(90)
    expect(state.totalSeconds).toBe(90)
    expect(state.phaseEndsAt).toBeNull()
    expect(state.pausedRemainingMs).toBeNull()
    expect(state.isRunning).toBe(false)
    expect(state.phase).toBe('work')
  })
})

describe('startTimer', () => {
  it('ancla el deadline a now + total de la fase', () => {
    const state = started()
    expect(state.phaseEndsAt).toBe(T0 + 90_000)
    expect(state.isRunning).toBe(true)
    expect(state.secondsRemaining).toBe(90)
  })
})

describe('reconcileTimer', () => {
  it('deriva el restante del deadline, no de ticks acumulados', () => {
    const state = reconcileTimer(started(), config, T0 + 30_000)
    expect(state.secondsRemaining).toBe(60)
    expect(state.elapsed).toBe(30)
    expect(state.phase).toBe('work')
    expect(state.isRunning).toBe(true)
  })

  it('no pierde tiempo cuando se saltan ticks (un salto de 55 s)', () => {
    const state = reconcileTimer(started(), config, T0 + 55_000)
    expect(state.secondsRemaining).toBe(35)
    expect(state.elapsed).toBe(55)
  })

  it('al vencer work pasa a rest y reancla el deadline en el instante observado', () => {
    const state = reconcileTimer(started(), config, T0 + 90_000)
    expect(state.phase).toBe('rest')
    expect(state.secondsRemaining).toBe(30)
    expect(state.totalSeconds).toBe(30)
    expect(state.currentRound).toBe(2)
    expect(state.totalRoundsCompleted).toBe(1)
    expect(state.phaseEndsAt).toBe(T0 + 90_000 + 30_000)
    expect(state.isRunning).toBe(true)
  })

  it('al vencer rest vuelve a work', () => {
    const onRest = reconcileTimer(started(), config, T0 + 90_000)
    const onWork = reconcileTimer(onRest, config, T0 + 120_000)
    expect(onWork.phase).toBe('work')
    expect(onWork.secondsRemaining).toBe(90)
    expect(onWork.currentRound).toBe(2)
    expect(onWork.phaseEndsAt).toBe(T0 + 120_000 + 90_000)
  })

  it('termina exactamente al completar las rondas totales', () => {
    const oneRound: RoundConfig = { ...config, totalRounds: 1 }
    const state = reconcileTimer(startTimer(initialTimerState(oneRound), T0), oneRound, T0 + 90_000)
    expect(state.phase).toBe('finished')
    expect(state.isRunning).toBe(false)
    expect(state.secondsRemaining).toBe(0)
    expect(state.totalRoundsCompleted).toBe(1)
    expect(state.phaseEndsAt).toBeNull()
  })

  it('pausado no reconcilia ni avanza de fase', () => {
    const paused = pauseTimer(started(), T0 + 30_000)
    const state = reconcileTimer(paused, config, T0 + 999_000)
    expect(state.secondsRemaining).toBe(60)
    expect(state.phase).toBe('work')
    expect(state.isRunning).toBe(false)
  })
})

describe('pauseTimer / startTimer', () => {
  it('pausar congela el restante y borra el deadline', () => {
    const state = pauseTimer(started(), T0 + 30_000)
    expect(state.isRunning).toBe(false)
    expect(state.phaseEndsAt).toBeNull()
    expect(state.pausedRemainingMs).toBe(60_000)
    expect(state.secondsRemaining).toBe(60)
  })

  it('reanudar fija un deadline nuevo a partir del restante pausado', () => {
    const paused = pauseTimer(started(), T0 + 30_000)
    const resumed = startTimer(paused, T0 + 100_000)
    expect(resumed.isRunning).toBe(true)
    expect(resumed.phaseEndsAt).toBe(T0 + 160_000)
    expect(resumed.secondsRemaining).toBe(60)
    expect(resumed.pausedRemainingMs).toBeNull()
  })
})
