# F93 #27 — Telemetría anónima de uso (Sentry + PostHog) (diseño)

> Fecha: 2026-09-05 · Estado: aprobado · Fuente: tarea #27 de F93 · «recopilar datos de uso de la app para corregir errores o aplicar mejoras»

## Contexto

Hoy GymLab es **local-first**: no hay backend y la política de privacidad (#26) declara que no se recopilan datos. El usuario (desarrollador) necesita **saber cómo se usa la app** (qué pantallas, qué acciones, dónde se abandona, qué errores ocurren) para corregir errores y aplicar mejoras.

El plan original (`PLAN.md` #27) preveía «telemetría **local** (Dexie, sin servidor)». En la conversación de brainstorming el usuario la **reemplaza**: el dato **sale del dispositivo** hacia un servicio de terceros, y **solo** contiene datos de uso de la app (nunca contenido personal, de salud ni de entrenamiento). Esto obliga a un modelo de **consentimiento** y a **retocar la política/privacidad** (#26, texto alojado en `legal`), que queda reabierto solo en el texto de analítica.

## Decisiones (aprobadas por el usuario)

1. **Terceros**: errores → **Sentry** (plan Developer free: 5.000 errores/mes); eventos y heatmap → **PostHog** (free: 1M eventos/mes). Ninguna requiere tarjeta en este volumen.
2. **Granularidad — ambas**:
   - **Eventos manuales** (~15) con propiedades anónimas (ids, rutas), controlados y auditables.
   - **Autocaptura de PostHog** (heatmap literal de clics) con **masking agresivo**: `maskAllInputs: true` y `masked_element_properties = ['text', 'innerText']` → los clics se registran por tipo de elemento/selector/coordenadas, **nunca** por el texto visible (el heatmap no necesita el texto).
3. **Consentimiento**: toggle **«Enviar datos de uso anónimos»** en Ajustes, **por defecto ON**, con aviso en el onboarding (última tarjeta). El cambio surte efecto **inmediato** (ON/OFF silencian el envío al instante). Al apagarlo no se reenvía.
4. **Gating**: la integración se inicializa **solo** cuando `import.meta.env.PROD` + claves presentes (`VITE_POSTHOG_PROJECT_KEY`, `VITE_SENTRY_DSN`) + consentimiento ON. Sin claves o en dev/tests → **no-op total** (sin SDK cargado, sin peticiones). Carga dinámica `import()` para no inflar el bundle.
5. **Sin feature flags ni session replay** en este hito (YAGNI).
6. **Claves en `.env`** (no commiteable, ya en `.gitignore`); el código funciona sin ellas.

## Paquetes de trabajo

### WP1 — Capa de consentimiento (dominio puro, TDD)
- `src/domain/telemetry.ts`:
  - `type TelemetryKeys = { posthogKey?: string; sentryDsn?: string }`.
  - `shouldEnableTelemetry({ prod, keys, consent }) → boolean` (AND de los tres).
  - `describeTelemetryState(...) → 'on' | 'off-no-consent' | 'off-not-configured' | 'off-debug'` (para UI/debug).
  - Claves, marca de config y pureza: sin imports de runtime.
- Setting persistida: `settings.telemetry` (`boolean`, default `true`) vía el mecanismo existente de `db.meta` / `useSettings` (mismo patrón que `settings: { units }`).
- `src/hooks/useTelemetryConsent.ts` (o integrado en `useSettings`): expone `consent` y `setConsent` que **aplican el efecto en runtime** (PostHog `opt_out/opt_in_capturing`, Sentry `close()` / re-init) y persisten el valor.

### WP2 — Integración perezosa y wrapper (`src/lib/telemetry.ts`)
- `track(event: TelemetryEvent, props?: object)`: no-op salvo gating; propiedades planas/JSON-safe, sin contenido.
- `initTelemetry()`:
  - Guard **idempotente** (doble init HMR).
  - Loaders dinámicos (`import('posthog-js')`, `import('@sentry/react')` o vanilla).
  - PostHog: `autocapture: true`, `maskAllInputs: true`, `masked_element_properties: ['text','innerText']`, `persistence: 'localStorage'` (anon), `capture_pageview: false` (se hace el `screen_view` manual vía router para no duplicar).
  - Sentry: `dsn`, `sampleRate: 1.0`, desactiva eventos de telemetría de Sentry. `captureException` envuelto en `reportError(err, context)` (no-op si no aplica).
- `reportError(err, context?)`: no-op salvo gating; reusa estructura de `src/domain/report.ts` para contexto.
- **Router**: `useEffect` en el layout raíz observa `useLocation()` → `track('screen_view', { path })`, con throttle/debounce innecesario en este volumen (YAGNI) pero **snapshot del consentimiento** por si se apaga a mitad de sesión.

### WP3 — Instrumentación manual (~15 eventos)
| Evento | Dónde | Props (sin contenido) |
|---|---|---|
| `screen_view` | Router (todas las rutas) | `path` |
| `workout_started` | `useActiveSession`/`EntrenamientoPage` al arrancar sesión | `routineId` opcional |
| `workout_completed` | Al completar sesión | `nGroups`, `durationMin` |
| `workout_cancelled` | Al cancelar/abandonar sesión | — |
| `entry_saved` | SessionJournal (`journals`) | `type` |
| `weight_logged` | Peso corporal (Perfil/Agua/Cálculos) | — |
| `measurement_logged` | Medidas de cinta / pliegues | `type` (`body`/`skinfold`) |
| `photo_added` | Progreso de fotos | — |
| `calculator_opened` | Hub/salida de cada calculadora | `slug` |
| `routine_favorited` | Detalle de rutina | — |
| `goal_updated` | Perfil (objetivo/semanas) | `goal` (enum anónimo) |
| `onboarding_completed` | Último paso del onboarding | — |
| `report_bug_submitted` | `ReportBugSection` (tras validar) | `type` |
| `data_exported` | Export/import de datos | `kind` |
| `settings_changed` | Ajustes (unidades, `telemetry`) | `key` |

### WP4 — UI (toggle + aviso onboarding)
- `AjustesPage`: sección (junto a `DataSection`/`ReportBugSection`) con toggle `useTelemetryConsent`. Subtítulo: «Datos anónimos de uso (pantallas y acciones) que ayudan a mejorar la app». Badge `role="switch"` accesible (patrón de los toggles existentes).
- `steps.tsx` onboarding: última tarjeta con el aviso, enlace a `/privacidad` (ya existe) y texto «puedes desactivarlo en Ajustes».
- Claves i18n nuevas es/en: `ajustes.telemetry*` (titulo, descripcion, on/off), `onboarding.telemetry*`.

### WP5 — Privacidad (#26 reabierto solo en texto)
- `src/i18n/locales/{es,en}/features.ts` grupo `privacidad`, sección **Analítica**: sustituir la nota «se activará en versiones futuras» por descripción de envío **anónimo** de uso a **Sentry + PostHog**, desactivable en Ajustes, sin contenido personal/entrenamiento.
- `legal/privacidad.html`: mismo cambio en la sección de analítica + añadir Sentry/PostHog a la lista de proveedores (`sección 7`), precisar que el usuario puede desactivar el envío desde Ajustes.
- Nota para usuario: actualizar **Data Safety de Play** → «App diagnostics» recopilado/compartido.

### WP6 — Verificación
- TDD dominio: `tests/unit/domain/telemetry.test.ts` (~6 casos: consent default, AND gating, off por cada causa, `describeTelemetryState`).
- E2E `tests/e2e/test_f93_t27_telemetry.py`:
  - Ajustes: toggle visible y por defecto ON; cambiar → persiste tras recarga.
  - **0 peticiones** a `posthog`/`sentry` en dev (Playwright intercepta `**/i.e**` y `https://*.posthog.com/*`; sin claves en tests el gating lo garantiza).
  - Antes/después del toggle: sin `console.error`.
- Verificación completa: `tsc --noEmit`, `npm run build`, lint, **392+ tests**, `with_server.py` ALL OK.

## Dependencia externa (usuario)

Crear proyectos **Sentry** (Developer free) y **PostHog** (free) y pegar las claves en `.env` (`VITE_POSTHOG_PROJECT_KEY`, `VITE_SENTRY_DSN`). **No se commitean.** La implementación queda cerrada con gating; el envío real se valida al construir `build` + `preview` (o `dev` con claves) cuando el usuario las añada.

## Fueras de alcance (YAGNI)

- Session replay (PostHog). Feature flags. Funnels/insights propios en la app (se ven en los dashboards de terceros). Telemetría local/SQL en Dexie. Consentimiento por país (mismo flujo para todos).