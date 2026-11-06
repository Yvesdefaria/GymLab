import { describe, expect, it } from 'vitest'
import {
  shouldEnableTelemetry,
  describeTelemetryState,
  scrubTelemetryProperties,
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

// El contrato es "pantallas y acciones, nunca contenido". La query puede llevar
// texto libre (buscador), así que se recorta antes de enviar; los valores de
// formulario y el texto de elementos se descartan enteros.
describe('scrubTelemetryProperties', () => {
  it('recorta la query de path y de las URLs por defecto', () => {
    expect(
      scrubTelemetryProperties({
        path: '/rutinas?q=hernia+discal',
        $current_url: 'https://app.gymlab.dev/rutinas?q=rodilla#top',
        $pathname: '/rutinas',
      }),
    ).toEqual({
      path: '/rutinas',
      $current_url: 'https://app.gymlab.dev/rutinas',
      $pathname: '/rutinas',
    })
  })

  it('descarta las claves con contenido de usuario, también anidadas', () => {
    expect(
      scrubTelemetryProperties({
        text: 'peso muerto',
        value: '80',
        href: '/perfil',
        name: 'journal',
        $el_text: 'nota',
        attr__aria: 'x',
        nested: { text: 'secreto', ok: 1 },
        list: [{ value: 'borrar', ok: true }],
      }),
    ).toEqual({ nested: { ok: 1 }, list: [{ ok: true }] })
  })

  it('no toca strings que no son URLs', () => {
    const props = { reason: 'client_timeout', kind: 'fitness', message: '¿todo bien?' }
    expect(scrubTelemetryProperties(props)).toEqual(props)
  })
})