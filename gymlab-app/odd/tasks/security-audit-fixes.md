# Security audit fixes — gymlab-app run-1

Objetivo: cerrar los hallazgos del run-1 de `security-audit` (2026-11-06) con tests de regresión, sin ampliar alcance. Branch: `main` (commits work-unit, **sin push**). Runner: `vitest` (`npm test`), typecheck real `npm run build`, lint `npm run lint`.

Reporte completo del audit (fuera del repo, generado por la skill): `security-audit-skill/gymlab-app/run-1/REPORT.md`, con `findings.json`, `NEEDS-VALIDATION.md` y `FINDINGS-DETAIL.md`.

## Specs

- **S1** — Ningún evento de telemetría puede llevar texto libre del usuario. `screen_view` registra solo `pathname` (sin query ni fragmento) y el redactor de `before_send` descarta `text`, `innerText`, `value`, `href`, `name`, `$el_text` y `attr__*`, y recorta query/fragmento de las claves URL (`path`, `url`, `$current_url`, `$pathname`, `$referrer`, `referrer`). Cubre `gymlab/telemetry/screen-view-path-query-leak`.
- **S2** — Restaurar un backup no cambia el consentimiento de telemetría vigente. `importBackup` fija `settings.telemetry` al valor que existía antes del restore (o descarta la clave). Cubre `src/data/backup.ts:meta-settings-restore-enables-telemetry`.
- **S3** — Toda URL renderizada desde datos restaurados pertenece a los assets empaquetados o es un `data:image/*` permitido; si no, se usa el fallback. Cubre `src/data/backup.ts:restored-url-fields-render-as-image-src` y `gymlab/dom-sink/maspage-avatar-uri-unvalidated`.
- **S4** — `savePhotosToGallery` solo acepta `data:image/(jpeg|png|webp|gif);base64,…`, tanto en la rama nativa (`Media.savePhoto`) como en la web (`downloadOnWeb` → `a.href`/`a.click()`). Esto cierra además el lead `downloadonweb-imperative-javascript-href`. Cubre `gymlab-app/src/lib/saveToGallery.ts:media-save-unvalidated-source`.
- **S5** — La fecha importada por CSV se normaliza a `YYYY-MM-DD` y debe representar un día real; el nombre de archivo de la tarjeta de sesión se normaliza. Cubre `src/domain/importParsers.ts:csv-localDate-native-filename`.
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
| T6 | S5 | inline | done | RED 7 fallos → GREEN 59/59; suite 2287 passed; build limpio |

## Log

**L1 (pedido original, 2026-11-06):** «https://github.com/cloudflare/security-audit-skill, instala esta skill y usala para auditar» y luego «ve arreglando los puntos uno a uno».

**L2 (decisión):** el audit corre sin sandbox OS-enforced, así que la evidencia es source-only. Los fixes se implementan igual: son cambios de código con tests deterministas, no requieren ejecutar el target bajo sandbox.

**L3 (T1):** el redactor se movió de `src/lib/telemetry.ts` a `src/domain/telemetry.ts` para poder testearlo puro, sin cargar PostHog. `AppShell` deja de concatenar `search`; el redactor queda como segunda capa. Tests nuevos: 3. Suite 246 archivos / 2257 passed + 1 skipped.

**L4 (T2):** `importBackup` lee el consentimiento vigente de `meta` con `toArray()` (el `get` por key no sirve en el mock y tampoco hace falta) y vuelve a fijar `telemetry` en la fila importada. Cubre otorgar y revocar: en ambos sentidos manda el valor previo. Tests nuevos: 3 (15 en el archivo). Suite 2260 passed + 1 skipped.

**L5 (T3):** `MasPage` usa `isSafeAvatarUri` igual que `ProfileUserCard`; el test nuevo renderiza `/mas` con un avatar remoto y con `javascript:` y exige que no haya `<img>`. Tests nuevos: 3. Suite 2263 passed + 1 skipped.

**L6 (T5):** `savePhotosToGallery` filtra con `^data:image/(jpeg|png|webp|gif);base64,` antes de la rama nativa y de la web. Una URI restaurada no llega a `Media.savePhoto` ni a `a.href`; cuenta como `failed` para que la UI lo muestre. Cierra el hallazgo nativo y el lead del `a.href` imperativo. Tests nuevos: 3 (8 en el archivo). Suite 2266 passed + 1 skipped.

**L7 (T4):** allowlist pura en `src/domain/safeAssetUrl.ts`: rutina solo `/images/routines/*`, media de ejercicio assets locales o `data:image/*`, foto solo `data:image/*;base64`. Se aplica en `routineCover` (incluido el fallback), el pool de `RutinasPage`, el hero de `EntrenarPage`, `ExerciseMedia` y `useProgressPhotoList`. Los tests se escribieron después de la implementación (no hubo RED observado); se registra como desvío de TDD.

**L8 (T6):** `normalizeImportDate` acepta `YYYY-MM-DD`, `YYYY/MM/DD` y `MM/DD/YYYY`, valida el día real y devuelve ISO; una fecha inválida descarta la fila con error de línea. `sessionImageStem` normaliza el nombre del archivo (solo `[0-9A-Za-z-]`) y lo usan descarga, share y galería. Tests nuevos: 7 (59 en los dos archivos). Suite 2287 passed + 1 skipped.

## Cierre de sesión (2026-11-06)

### Commits

| Commit | Mensaje | Tarea |
|---|---|---|
| `8314721a` | `fix: no enviar el texto del buscador en la telemetria` | T1 |
| `9a3157ad` | `fix: no restaurar el consentimiento de telemetria desde un backup` | T2 |
| `bac753cc` | `fix: validar el avatar de /mas con isSafeAvatarUri` | T3 |
| `0e66897b` | `fix: validar el origen de las fotos antes de guardarlas en la galeria` | T5 |
| `fe803990` | `fix: validar las urls restauradas antes de renderizarlas` | T4 |
| `c994d08f` | `fix: validar la fecha del CSV y normalizar el nombre de la tarjeta` | T6 |

Base del rango: `c0e03ab0b648279710a0744b762970c4344c2c7d`.

### Evidencia de verificación

- **Suite completa:** 246 archivos, **2287 passed + 1 skipped** (antes de la sesión: 2254 passed + 1 skipped). +33 tests nuevos.
- **Build:** `npm run build` (tsc -b + Vite) limpio después de cada tarea.
- **Lint:** `npm run lint` sin warnings nuevos en `src/`; los warnings que quedan son preexistentes (`.agents/skills/*`, `ElapsedClock`, `CountUp`, `InfoTip`, `HScroll`).
- **Working tree:** limpio de cambios de esta sesión; quedan solo los cambios previos (`COMPLETED.md`, `PLAN.md`) y `skills-lock.json` por la instalación de la skill.

### Mapa audit → estado

| Hallazgo | Severidad audit | Estado | Commit |
|---|---|---|---|
| Telemetría con texto de búsqueda | medium | cerrado | `8314721a` |
| Restore re-otorga consentimiento | medium | cerrado | `9a3157ad` |
| `/mas` avatar sin validar | low | cerrado | `bac753cc` |
| URLs restauradas → `<img src>` externo | low | cerrado | `fe803990` |
| Fotos restauradas → sink nativo | low | cerrado | `0e66897b` |
| Lead: `a.href` imperativo con `javascript:` | needs_validation | cerrado por S4 | `0e66897b` |
| Lead: fecha CSV → filename nativo | needs_validation | cerrado por S5 | `c994d08f` |
| Claim: `papers.sourceUrl` ejecutable | rejected | sin acción (React 19.3 sanea `href`) | — |

### Pendientes antes de dar por cerrada la entrega

1. **Review nativo de Gentle AI (RDD):** ✅ corrido el 2026-11-07 en tres ciclos, los tres aprobados y quemados. Detalle en «Cierre de sesión (2026-11-07)».

2. **Prueba en emulador (obligatoria por cambios nativos):** los fixes tocan `savePhotosToGallery` (plugin Media) y `SessionImageExport` (share/galería), así que la suite web no alcanza. Receta:
   ```powershell
   # desde gymlab-app
   npm run android:sync
   $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
   .\android\gradlew.bat -p .\android assembleDebug
   $adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
   & $adb install -r android\app\build\outputs\apk\debug\app-debug.apk
   & $adb shell am force-stop com.gymlab.app
   & $adb shell am start -n com.gymlab.app/.MainActivity
   ```
   Casos a mirar:
   - Importar un backup con `progressPhotos.frontUri = "https://collector.example/x.png"`: `/progreso-fotos` debe mostrar placeholder y **no** pedir la imagen; "Guardar en galería" no debe copiar nada.
   - Importar un backup con `routines[0].imageUrl = "https://collector.example/x.png"`: `/rutinas` y `/` deben caer a la portada default.
   - Importar un CSV con `date = ../../x`: la fila se rechaza con error de fecha; con `2024/01/02` entra como `2024-01-02`.
   - Compartir/guardar una tarjeta de sesión: el archivo se llama `gymlab-<fecha>.png` y no rompe.

3. **Push:** los nueve commits del rango `c0e03ab..HEAD` están locales; el push lo hace el owner.

### Desvíos y límites registrados

- El audit se corrió **sin sandbox OS-enforced** (Docker apagado, WSL sin Node): evidencia source-only y los leads runtime quedaron como `needs_validation`, no como confirmados.
- Los **validadores nativos de la skill no corren en win32** (`O_NOFOLLOW`); se usaron dos checkers equivalentes, declarados como chequeo suplementario, no como PASS nativo.
- **T4 no tuvo RED previo** (tests después de implementar); el resto siguió RED → GREEN.
- No se agregó un `CSP` ni se tocó la política de headers: quedó como hardening en el reporte del audit, fuera del alcance de estos fixes.

## Follow-up: avisos del review nativo (2026-11-07)

Review `review-a726229bb515b9ff`: **approved**, autoridad quemada (`gentle-ai.review-acknowledged/v1`), 0 bloqueantes y 13 advisories no bloqueantes. Se abrió un candidato nuevo (no se reabrió el review) para cerrar los de bajo riesgo.

### Cerrados

| Advisory | Cambio |
|---|---|
| `R1-URL-TAB-NEWLINE-BYPASS` | `isSafeLocalAssetUrl` rechaza C0/DEL/C1 antes de mirar el resto: `/\t/evil.example` ya no pasa. |
| `R3-001` (no-string lanza) | Las cuatro predicates reciben `unknown` y exigen `typeof value === 'string'`. |
| `R2-gallery-allowlist-dup` | `saveToGallery` importa `isSafePhotoUri`; se borró el regex y el export duplicados. |
| `R2-import-date-format-contract` | El regex ISO exige el mismo separador en ambos lugares (`\2`); `2024-01/02` se rechaza. |
| `R4-date-gate-format` | Se acepta **solo** una hora bien formada (`HH:MM[:SS]`) además de la fecha, se validan sus componentes y se rechaza cualquier otro sufijo; `2024-01-02 basura` y `T99:99` ya no pasan. |
| `R2-importbackup-doc-comment` | El comentario de `importBackup` volvió a quedar pegado a la función. |
| `R2-safe-photo-uri-names` | `safePhotoUri` → `normalizePhotoUri`. |
| `R3-002` (hook sin test) | Nuevo `tests/unit/hooks/useProgressPhotos.test.tsx`: prueba el cableado, no solo la función pura. |
| `R3-003` (bisiesto) | Tests `2024-02-29` válido y `2023-02-29` inválido. |
| `R3-004` (query global) | El test de MasPage consulta el `container`, no `document`. |
| `R1-DOC-ABSOLUTE-USER-PATH` | El doc ya no hardcodea el path del perfil del usuario. |

### Sin cerrar (fuera de este candidato)

- **`R4-consent-pin-gap`** (preexistente): si el backup trae `meta` sin la fila `settings`, el `replace` borra la fila actual y el consentimiento cae a off. Requiere reinsertar la fila vigente cuando falte; es un cambio de contrato de restore, no un endurecimiento.
- **`R4-photo-sanitize-scan`**: la lista de fotos revalida cada data URL multi-MB en cada emisión. Sanitizar al escribir/importar es una decisión de producto y rendimiento; se deja medido como deuda.
- Formatos de fecha locale no listados: hacen falta muestras reales de Strong/Hevy/JEFIT antes de ampliar el parser.

### Verificación del follow-up

- **Suite:** 246 archivos, **2297 passed + 1 skipped** (+10 sobre 2287).
- **Build:** limpio. **Lint:** sin warnings nuevos en los archivos tocados (el regex de control chars lleva un disable acotado con motivo).

## Cierre de sesión (2026-11-07): ciclo de review

### Commits del ciclo

| Commit | Mensaje | Qué cierra |
|---|---|---|
| `7008895d` | `fix: cerrar los avisos del review de seguridad` | tab/CR/LF, `typeof` no-string, dedupe del gate de galería, fecha con hora, tests del hook |
| `aa0493cf` | `fix: validar la hora del import CSV y rechazar otros sufijos` | sobre-aceptación de `2024-01-02 basura` / `T99:99` |
| `c827cb89` | `docs: corregir el conteo de la suite en el changelog` | conteo 2295 → 2297 y +8 → +10 tests |

### Reviews nativos

| # | Lineage | Alcance | Resultado | Advisories |
|---|---|---|---|---|
| 1 | `review-a726229bb515b9ff` | 26 archivos / 767 líneas | **approved**, `authority: burned` | 13 |
| 2 | `review-6f07f1cef979cf35` | 11 archivos / 229 líneas | **approved**, `authority: burned` | 6 |
| 3 | `review-25e92c25f04b69e0` | 4 archivos / 66 líneas | **approved**, `authority: burned` | 8 |

Los tres cerraron con `gentle-ai.review-acknowledged/v1`. **Cero bloqueantes** en los tres. El review es informativo: no autoriza push, PR ni release.

### Deuda que queda (toda no bloqueante)

- **`R4-import-date-suffix-row-loss` (review 3, WARNING):** al anclar los regex, se rechazan timestamps realistas con `Z`, offset (`+02:00`), fracción de segundos, `AM/PM`, tab o doble espacio; la fila se pierde con «fecha inválida». Es el trade-off opuesto al `R4-date-gate-format` del review 2. **Decisión pendiente:** ampliar el patrón con muestras reales de Strong/Hevy/JEFIT, o mantener estricto y documentar los formatos aceptados.
- **`R2-001` / `R3-002` (WARNING):** los grupos de captura son posicionales (`iso[5]`, `us[4]`); un cambio futuro en el patrón puede remapear qué campo se valida. Named groups lo harían explícito.
- **`R3-001` (WARNING):** los tests de hora solo cubren `hour > 23`; minuto y segundo fuera de rango no están aislados.
- **`R4-consent-pin-gap` (preexistente):** backup con `meta` sin fila `settings` borra la fila vigente y el consentimiento cae a off. Requiere reinsertar la fila actual cuando falte.
- **`R4-photo-sanitize-scan`:** la lista de fotos revalida cada data URL multi-MB en cada emisión; sanitizar al escribir/importar es una decisión de producto/rendimiento.
- **`R4-clock-reject-same-sentinel`:** una hora inválida y una fecha irreconocible devuelven el mismo `null` y el mismo mensaje; no se distinguen en el reporte de import.

### Verificación final

- **Suite:** 246 archivos, **2297 passed + 1 skipped**.
- **Build:** `npm run build` limpio. **Lint:** sin warnings nuevos en los archivos tocados.
- **Working tree:** limpio de los cambios de estas sesiones; quedan solo los cambios previos (`COMPLETED.md`, `PLAN.md`), `skills-lock.json` por la skill instalada y los untracked preexistentes.

### Pendientes de entrega

1. **Emulador (obligatorio por cambios nativos):** sigue vigente la receta y los casos de «Cierre de sesión (2026-11-06)» → `savePhotosToGallery` y `SessionImageExport` no están cubiertos por la suite web.
2. **Push:** todos los commits del rango `c0e03ab..HEAD` están locales; el push lo hace el owner.
3. **Opcional:** ampliar el parser de fechas con un CSV real de cada app (ver deuda arriba).
