# Security audit fixes — gymlab-app run-1

Objetivo: cerrar los hallazgos del run-1 de `security-audit` (2026-11-06) con tests de regresión, sin ampliar alcance. Branch: `main` (commits work-unit, sin push). Runner: `vitest` (`npm test`), typecheck real `npm run build`, lint `npm run lint`.

## Specs

- **S1** — Ningún evento de telemetría puede llevar texto libre del usuario. `screen_view` registra solo `pathname` (sin query ni fragmento) y el redactor de `before_send` descarta `text`, `innerText`, `value`, `href`, `name`, `$el_text` y `attr__*`, y recorta query/fragmento de las claves URL (`path`, `url`, `$current_url`, `$pathname`, `$referrer`, `referrer`). Cubre el hallazgo `gymlab/telemetry/screen-view-path-query-leak`.
- **S2** — Restaurar un backup no cambia el consentimiento de telemetría vigente. `importBackup` fija `settings.telemetry` al valor que existía antes del restore (o descarta la clave). Cubre `src/data/backup.ts:meta-settings-restore-enables-telemetry`.
- **S3** — Toda URL renderizada desde datos restaurados pertenece a los assets empaquetados o es un `data:image/*` permitido; si no, se usa el fallback. Cubre `src/data/backup.ts:restored-url-fields-render-as-image-src` y `gymlab/dom-sink/maspage-avatar-uri-unvalidated`.
- **S4** — `savePhotosToGallery` solo acepta `data:image/(jpeg|png|webp|gif);base64,…`, tanto en la rama nativa (`Media.savePhoto`) como en la web (`downloadOnWeb` → `a.href`/`a.click()`). Esto cierra además el lead `downloadonweb-imperative-javascript-href`. Cubre `gymlab-app/src/lib/saveToGallery.ts:media-save-unvalidated-source`.
- **S5** — La fecha importada por CSV debe ser `YYYY-MM-DD` y representar un día real; el nombre de archivo de la tarjeta de sesión se normaliza. Cubre `src/domain/importParsers.ts:csv-localDate-native-filename`.
- **S6** — `MasPage` valida `meta.avatarUri` con `isSafeAvatarUri`, igual que `ProfileUserCard`.
- **S7** — Cada fix entra con su test de regresión; `npm test`, `npm run lint` (sin warnings nuevos en `src/`) y `npm run build` verdes antes del commit.

## Tasks

| ID | Spec | Ruta | Estado | Evidencia |
|---|---|---|---|---|
| T1 | S1 | inline | done | RED 3 fallos → GREEN 12/12; suite 2257 passed; build limpio |
| T2 | S2 | inline | done | RED 2 fallos → GREEN 15/15; suite 2260 passed; build limpio |
| T3 | S6 | inline | done | RED 2 fallos → GREEN 3/3; suite 2263 passed; build limpio |
| T4 | S3 | inline | done | tests nuevos 14 (post-implementación, sin RED previo); suite 2280 passed; build limpio |
| T5 | S4 | inline | done | RED 3 fallos → GREEN 8/8; suite 2266 passed; build limpio |
| T6 | S5 | inline | pending | — |

## Log

**L1 (pedido original, 2026-11-06):** «https://github.com/cloudflare/security-audit-skill, instala esta skill y usala para auditar» y luego «ve arreglando los puntos uno a uno».

**L2 (decisión):** el audit corre sin sandbox OS-enforced, así que la evidencia es source-only. Los fixes se implementan igual: son cambios de código con tests deterministas, no requieren ejecutar el target bajo sandbox.

**L3 (T1):** el redactor se movió de `src/lib/telemetry.ts` a `src/domain/telemetry.ts` para poder testearlo puro, sin cargar PostHog. `AppShell` deja de concatenar `search`; el redactor queda como segunda capa. Tests nuevos: 3. Suite 246 archivos / 2257 passed + 1 skipped.

**L4 (T2):** `importBackup` lee el consentimiento vigente de `meta` con `toArray()` (el `get` por key no sirve en el mock y tampoco hace falta) y vuelve a fijar `telemetry` en la fila importada. Cubre otorgar y revocar: en ambos sentidos manda el valor previo. Tests nuevos: 3 (15 en el archivo). Suite 2260 passed + 1 skipped.

**L5 (T3):** \MasPage\ usa \isSafeAvatarUri\ igual que \ProfileUserCard\; el test nuevo renderiza /mas con un avatar remoto y con \javascript:\ y exige que no haya \<img>\. Tests nuevos: 3. Suite 2263 passed + 1 skipped.

**L6 (T5):** \savePhotosToGallery\ filtra con \^data:image/(jpeg|png|webp|gif);base64,\ antes de la rama nativa y de la web. Una URI restaurada no llega a \Media.savePhoto\ ni a \.href\; cuenta como \ailed\ para que la UI lo muestre. Cierra el hallazgo nativo y el lead del \.href\ imperativo. Tests nuevos: 3 (8 en el archivo). Suite 2266 passed + 1 skipped.

**L7 (T4):** allowlist pura en \src/domain/safeAssetUrl.ts\: rutina solo \/images/routines/*\, media de ejercicio assets locales o \data:image/*\, foto solo \data:image/*;base64\. Se aplica en \outineCover\ (incluido el fallback), el pool de \RutinasPage\, el hero de \EntrenarPage\, \ExerciseMedia\ y \useProgressPhotoList\. Los tests se escribieron después de la implementación (no hubo RED observado); se registra como desvío de TDD.
