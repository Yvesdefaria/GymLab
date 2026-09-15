/// <reference types="node" />
// Invariantes de arquitectura del sistema de notificaciones. El entorno de vitest es node
// (sin jsdom ni testing-library), así que estos casos auditan los módulos FUENTE: son los
// que atrapan los bugs reales que ya rompieron el sistema.
//   1. La Web Notifications API no existe en el WebView nativo (los 3 recordatorios
//      nunca sonaban).
//   2. El plugin nativo debe tener UN solo dueño; importarlo en otro lado rompe el
//      ownership y reintroduce sistemas paralelos.
//   3. El agendado debe estar montado en AppShell: si vive solo en la pantalla de
//      Ajustes, el usuario que no entra ahí nunca programa nada.
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = fileURLToPath(new URL('../../src', import.meta.url))

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(entry) ? [full] : []
  })

// Quita comentarios para auditar CÓDIGO: la prosa explica justamente los bugs
// («new Notification()», «@capacitor/local-notifications»…) y daría falsos positivos.
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const sourceFiles = walk(SRC)
const relative = (file: string) => path.relative(SRC, file).split(path.sep).join('/')
const readSource = (file: string) => stripComments(readFileSync(file, 'utf8'))

const OWNER = 'data/localNotificationsBackend.ts'
// Solo imports reales: `from '@capacitor/local-notifications'` o `import('...')`.
const PLUGIN_IMPORT = /(?:from|import\()\s*['"]@capacitor\/local-notifications['"]/
// Web Notifications API: `new Notification(...)`, `Notification.requestPermission`, `typeof Notification`.
const WEB_NOTIFICATIONS = /new\s+Notification\s*\(|Notification\.requestPermission|typeof\s+Notification\b/

describe('invariantes del sistema de notificaciones', () => {
  it('solo localNotificationsBackend importa el plugin nativo (dueño único)', () => {
    const importers = sourceFiles
      .filter((file) => PLUGIN_IMPORT.test(readSource(file)))
      .map(relative)

    expect(importers).toEqual([OWNER])
  })

  it('ningún módulo usa la Web Notifications API (no existe en el WebView nativo)', () => {
    const offenders = sourceFiles.filter((file) => WEB_NOTIFICATIONS.test(readSource(file))).map(relative)

    expect(offenders).toEqual([])
  })

  it('AppShell monta useNotificationScheduling (el agendado no puede quedar solo en Ajustes)', () => {
    const shell = readSource(path.join(SRC, 'components/layout/AppShell.tsx'))

    expect(shell).toMatch(
      /import\s*\{[^}]*useNotificationScheduling[^}]*\}\s*from\s*['"]@\/hooks\/useNotifications['"]/,
    )
    expect(shell.match(/useNotificationScheduling\(\)/g) ?? []).toHaveLength(1)
  })

  it('useNotificationScheduling llama a syncTrainingReminder con el id fijo y la hora configurada', () => {
    const hook = readSource(path.join(SRC, 'hooks/useNotifications.ts'))

    expect(hook).toContain('syncTrainingReminder(')
    expect(hook).toContain('id: NOTIFICATION_IDS.training_reminder')
    expect(hook).toContain('hour: settings.trainingReminderHour')
    expect(hook).toContain('minute: settings.trainingReminderMinute')
  })
})
