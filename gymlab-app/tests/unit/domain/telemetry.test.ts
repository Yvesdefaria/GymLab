import { describe, expect, it } from 'vitest'
import {
  shouldEnableTelemetry,
  describeTelemetryState,
  type TelemetryKeys,
} from '@/domain/telemetry'

const KEYS: TelemetryKeys = { posthogKey: 'phc_x', sentryDsn: 'https://a@b.ingest.sentry.io/1' }
const GATE = { prod: true, keys: KEYS, consent: true }

describe('shouldEnableTelemetry', () => {
  it('on con prod+claves+consentimiento', () => {
    expect(shouldEnableTelemetry(GATE)).toBe(true)
  })
  it('off si falta prod (dev/tests)', () => {
    expect(shouldEnableTelemetry({ ...GATE, prod: false })).toBe(false)
  })
  it('off sin consentimiento', () => {
    expect(shouldEnableTelemetry({ ...GATE, consent: false })).toBe(false)
  })
  it('off si falta cualquiera de las dos claves', () => {
    expect(shouldEnableTelemetry({ ...GATE, keys: { posthogKey: 'phc_x', sentryDsn: undefined } })).toBe(false)
    expect(shouldEnableTelemetry({ ...GATE, keys: { posthogKey: undefined, sentryDsn: 'dsn' } })).toBe(false)
  })
  it('off con claves vacías', () => {
    expect(shouldEnableTelemetry({ ...GATE, keys: {} })).toBe(false)
  })
})

describe('describeTelemetryState', () => {
  it('on', () => expect(describeTelemetryState(GATE)).toBe('on'))
  it('off-debug en dev', () => expect(describeTelemetryState({ ...GATE, prod: false })).toBe('off-debug'))
  it('off-not-configured sin claves', () =>
    expect(describeTelemetryState({ ...GATE, keys: {} })).toBe('off-not-configured'))
  it('off-no-consent con claves pero sin consentimiento', () =>
    expect(describeTelemetryState({ ...GATE, consent: false })).toBe('off-no-consent'))
})