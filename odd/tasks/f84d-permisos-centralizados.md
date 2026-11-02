# F84d-followup 2 — Permisos centralizados y refresco real del widget

- **Objetivo**: que el widget de pasos se actualice sin abrir la app y que todos los permisos del sistema vivan en un solo lugar de Ajustes.
- **Rama**: `main` (directo, sin worktree — regla del repo).
- **Entrega**: commit work-unit local, sin push.
- **Test runner**: Vitest (`npm test`) para la capa web; JUnit + `assembleDebug` para lo nativo.

## Specs

- **S1** — El pedido automático de `READ_HEALTH_DATA_IN_BACKGROUND` ocurre **una sola vez** por instalación y el estado se persiste **después** del pedido: un "cancelar" no deja el permiso inalcanzable para siempre.
- **S2** — El usuario puede elegir **«No volver a preguntar»** (`never`); con eso el arranque no interrumpe más. El botón explícito de Ajustes sigue disponible siempre.
- **S3** — `Ajustes → Permisos` muestra en un solo lugar: Salud (Health Connect), lectura en segundo plano del widget y notificaciones, cada uno con estado y acción.
- **S4** — El estado del permiso de background se re-chequea al volver del sistema (`visibilitychange`), sin diálogo.
- **S5** — En web/PWA la sección no se renderiza (los permisos son nativos).
- **S6** — El plugin nativo no decide cuándo preguntar: expone `getBackgroundReadStatus` (sin diálogo) y `requestBackgroundRead` (repetible).

## Tasks

- [x] **T1** — `domain/healthBackgroundPrompt` (política pura) + tests RED→GREEN — ✅ 7/7.
- [x] **T2** — Plugin `GymLabHealth`: estado sin diálogo, pedido repetible, sin flag nativo — ✅ `compileDebugKotlin`.
- [x] **T3** — Bridge + preferencia en Dexie + `ensureHealthBackgroundRead` con la política — ✅ `healthSyncController` actualizado.
- [x] **T4** — Hook `useHealthBackgroundPermission` + `PermissionsSection` en Ajustes + i18n es/en — ✅.
- [x] **T5** — Verificación: `npm test` 225 archivos / 2037 passed + 1 skipped, `npm run build` limpio, `assembleDebug` OK, `assess` nativo medium/under_budget.
- [x] **T6** — Prueba en teléfono real (realme RMX5085, Android 16): permiso concedido, app matada y snapshot actualizado por el worker sin abrir la app.

## Log

- **L1** — Pedido del usuario (verbatim): «y por que no mejor colocamos todos los permisos en un solo lado en lugar de por cada seccion, haz la opcion 1 imagino que habra una opcion de no preguntar mas en caso de que al usuario le resulte molesto».
- **L2** — Diagnóstico verificado en hardware: `READ_HEALTH_DATA_IN_BACKGROUND: granted=false` y `backgroundReadAsked=true`; el worker corría cada ~15 min y salía por `HealthStepsReader.kt:33-37`. Snapshot congelado desde la última apertura de la app.
- **L3** — Prueba end-to-end: 21:13:43 proceso muerto (`kill -9`); 21:26:35 el worker escribió `steps=10742` con la app cerrada; 21:27:31 (tras reinstalar) volvió a escribir `10745`.
- **L4** — Commit: ver `git log -- odd/tasks/f84d-permisos-centralizados.md`.
