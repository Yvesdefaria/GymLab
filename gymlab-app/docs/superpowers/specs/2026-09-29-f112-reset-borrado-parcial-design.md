# F112 — Reset de fábrica y borrado parcial de datos (diseño)

- **Fase**: F112 de `PLAN.md` (notas origen #19, #20).
- **Estado**: diseño cerrado — grilling con el usuario el 2026-09-29. La implementación no arranca hasta que esta spec quede aprobada y exista plan de implementación.
- **Worktree**: `f112` (sesión aislada; cierre con rebase + `merge --ff-only` + `worktree.ps1 close f112`, como indica `AGENTS.md` → «Sesiones paralelas»).

## 1. Contexto y diagnóstico previo

Qué existe hoy (verificado en código y en runtime):

- **Borrado de una sesión concreta (F98.6)**: `src/data/workoutDeletion.ts` → `deleteWorkoutSession()` borra `workoutSets` + `sessionJournals` + `workouts` en **una transacción atómica** y recalcula los PRs afectados. La UI vive en el detalle del entreno (`WorkoutDetail.tsx`, ruta `/entrenamiento/:id`), alcanzable desde Perfil → historial.
- **Diagnóstico del reporte "borré y quedó data"**: se reprodujo el flujo en dev server (2 corridas; `test_f98_delete.py` + script de diagnóstico con snapshot de las 28 tablas), se inspeccionó la DB real del emulador (read-only: cero huérfanos, cero referencias a workouts inexistentes) y se ejecutó el borrado **en el emulador con eventos touch reales** (workout inyectado → eliminado de IndexedDB, verificado antes y después de recargar; calendario desmarcado; 0 errores). **No se reprodujo ningún residuo de datos del entreno.** Lo único que sobrevive a un borrado es el estado de **logros/chapas** en `meta` (los desbloqueos nunca se revocan) — eso explica la percepción de "quedó data" y es lo que ataca 112.2.
- **Backup (F27)**: `src/data/backup.ts` exporta **19 de 28** tablas; faltan 9 tablas de usuario (ver §6). `downloadBackup()` usa un anchor `a[download]` → **no-op en Android** (WebView sin handler de descargas) y el WebView de Android **no implementa `navigator.share`** (verificado en el emulador: Chrome 149, `undefined`), por lo que el "share nativo" de las imágenes de sesión (F75/F105) tampoco funciona en Android — hallazgo compartido, **fuera de alcance** de F112.
- **No existe reset de fábrica**: no hay ninguna superficie que devuelva la app a estado de instalación limpia.

## 2. Alcance

**Dentro:**

1. **112.1** — Botón de reset de fábrica en Ajustes, con confirmación fuerte y sugerencia de backup previo.
2. **112.2** — Borrado parcial por sesión (flujo existente) **+ recálculo de logros/chapas** cuando los datos que los sostenían desaparecen.
3. Extensión del backup a las 28 tablas (requisito de honestidad del punto 1: el backup sugerido debe cubrir todo lo que el reset borra).
4. Entrega del backup en Android vía share sheet (2 plugins oficiales nuevos).

**Fuera (explícito):**

- Fix del share de sesiones (F105) — mismo root cause encontrado, otro alcance.
- Cambio de la semántica de `importBackup` (se mantiene tal cual, ver §6).
- Borrado de las copias guardadas en la galería del sistema (`@capacitor-community/media`).
- Desconectar Health Connect (los pasos pueden repoblarse; es dato externo del usuario).
- `android:allowBackup` del manifest.

## 3. Decisiones congeladas (grilling 2026-09-29)

| # | Decisión | Por qué |
|---|----------|---------|
| D1 | Reset **total** ("como recién instalada": datos + ajustes + logros + perfil) | Pedido del usuario; estado de fábrica real. |
| D2 | Confirmación con **type-to-confirm `BORRAR`** + haptics | Evita resets accidentales; apto móvil. |
| D3 | Backup **sugerido antes** del reset (no obligatorio) | Lo pide el plan; no bloquea. |
| D4 | Wipe **ordenado** (notificaciones → stores → Dexie → storage → reload) | Evita resurrección de estado por writers debounced. |
| D5 | Aviso si hay **sesión activa**; permite igual | Ajustes es alcanzable con sesión activa y no hay guardas; bloquear molesta. |
| D6 | **Reconciliación global** de logros en la evaluación (no solo al borrar) | Un mecanismo para toda pérdida de datos; idempotente. |
| D7 | Re-bloqueo con **contadores frescos** (re-ganar = ×1; el modal vuelve a celebrar) | Coherente con "limpiar datos de prueba de verdad". |
| D8 | `importBackup` **sin cambios** | Cero riesgo de regresión; el backup nuevo ya cubre las 28 tablas. |
| D9 | Backup en Android con **`@capacitor/share` + `@capacitor/filesystem`** | Mecanismo estándar, sin código nativo propio. |

## 4. Reset de fábrica (112.1)

### 4.1 UI

- Nueva sección `DangerZoneSection` **después de `DataSection`** en `AjustesPage.tsx`; patrón existente (`panel-light rounded-2xl p-4` + `SectionLabel`); export en `components/settings/index.ts`.
- Botón destructivo: **"Resetear a estado de fábrica"**.

### 4.2 Flujo (3 pasos)

1. **Sheet informativo**: lista de lo que se borra (entrenos, medidas, fotos, pasos, nutrición, suplementos, logros, rutinas propias, ajustes y perfil) + **botón primario "Descargar backup"** + secundario "Continuar sin backup" + aviso si hay sesión activa ("si tenés una sesión en curso, se pierde"). Copy del paso: "guardá el archivo antes de continuar" (no se verifica la entrega — no es verificable).
2. **Confirmación fuerte**: input type-to-confirm; comparación `trim()` + case-insensitive contra `BORRAR`; solo con coincidencia exacta se habilita el botón destructivo **"Resetear todo"**.
3. **Ejecución**: estado busy; si algo falla → mensaje de error y se puede reintentar (la transacción es atómica: o se borra todo o nada); si sale bien → reload con `window.location.replace('/')`.

### 4.3 Wipe — orden exacto (importa)

1. **Cancelar notificaciones programadas del OS** (ids `9601` descanso + `9602`–`9604`) con `localNotificationsBackend.cancel(id)`.
2. **Resetear stores en memoria** (antes de tocar storage, para que ningún writer debounced resucite estado): `activeWorkoutStore.reset()`, `equipmentStore.clear()`, reset del goal store.
3. **Dexie**: una única transacción `rw` que limpia **las 28 tablas** (usar `db.tables` → nombres reales; **no** reutilizar `ALL_TABLES`, que está desactualizado). Incluye `meta` (seedVersion, onboardingDone, settings, theme, achievements, favoritos, perfil).
4. **localStorage**: `gymLab-activeWorkout`, `gymlab-goals`, `gymlab-equipment`, `gymlab.theme`, `gymlab.palette`, `gymlab.recentCalculators`, `gymlab-pending-photo-angle`. **sessionStorage**: `gymLab-preloadReload`.
5. **Reload** → `providers.boot()` re-siembra (meta vacía ⇒ seed completo + `profileRepo.ensure()`) y el overlay de **Onboarding** vuelve solo (`ONBOARDING_DONE` default `false` + 0 workouts ⇒ visible sobre `/`).

### 4.4 Módulo y testabilidad

- `src/data/factoryReset.ts` — `performFactoryReset(deps)` con **dependencias inyectables** (patrón `workoutDeletion`): backend de notificaciones, storage, reload y acceso a tablas Dexie. La sección UI lo invoca vía hook delgado (estado busy/error).
- Unit tests con deps dobles: orden de pasos, las 28 tablas, claves exactas.

### 4.5 Notas

- Fotos: viven como **base64 dentro de IndexedDB** (no hay archivos sueltos de la app) → el reset las borra con la DB y no queda nada por limpiar en disco.
- Los pasos pueden repoblarse desde **Health Connect** al visitar `/pasos` (fuente externa; aceptado).

## 5. Borrado parcial + reconciliación de logros (112.2)

### 5.1 Sin UI nueva

Se mantiene el borrado del detalle del entreno. Único cambio de copy: el mensaje del `ConfirmSheet` de borrado agrega la línea **"también se recalcularán tus logros"** (es/en).

### 5.2 Reconciliación de logros (global)

- Nueva **función pura** en `src/domain/`: `reconcileAchievementState(state, earnedIds) → state'` con `state = { unlocked, counts, snapshot, collectibles }`, aplicando:
  - `unlocked := unlocked ∩ earned` — los ids no sostenidos se re-bloquean.
  - `counts := counts restringido a earned` — un re-bloqueo pierde su contador (queda fresco para un futuro re-logro).
  - `snapshot := earned`.
  - `collectibles := grantedCollectibles(nextCounts)` — **retroceso determinístico** (en este camino reemplaza al merge append-only).
- Integración en `useAchievements` dentro del effect debounced, **después** de calcular `earnedIds`; escrituras solo-si-cambió (idempotente). `freshIds` se calcula contra `savedIds` **pre-reconciliación**: re-bloquear no dispara modal; volver a ganarlo más adelante sí (es un logro nuevo).
- `counts` **no** entra a la signature del effect (evita loops de escritura).
- Aplica a cualquier pérdida de datos (borrado manual de un entreno, import, etc.). **`deleteWorkoutSession` no cambia**: la re-evaluación hace el trabajo.
- **Logros de pasos (8) y guías quedan intactos**: no usan las 4 claves de `meta` (son derivados en vivo de `dailySteps`/`guides`, sin persistencia propia).

### 5.3 Riesgos y mitigaciones

- *Race* entre la transacción de borrado y la evaluación: debounce de 600 ms + gating de "ready" del hook; tests unitarios con estados parciales.
- Re-ganancia de chapas tras el retroceso: `mergeCollectibles` dedupea pares `id:variant`; el retroceso usa `grantedCollectibles` recomputado (determinístico).
- Reconciliar sobre un estado transitorio: el effect ya espera data lista; el reconcile es idempotente.

## 6. Backup (parte de 112.1)

- `ALL_TABLES`: 19 → **28**. Se agregan: `dailySteps`, `sessionJournals`, `benchmarkResults`, `foods`, `mealEntries`, `supplements`, `progressPhotos`, `workoutTemplates`, `periodizationPlans`.
- `version` del archivo queda en **1** (cambio aditivo; `parseBackup` no compara versión). Compatibilidad: backups viejos → código nuevo OK (claves ausentes ⇒ `?? []`); backups nuevos → código viejo: claves extra ignoradas.
- `importBackup`: **sin cambios** (por tabla presente: `clear()` + `bulkAdd()`; tablas ausentes/vacías no se tocan).
- **Entrega nativa**: agregar `@capacitor/share` + `@capacitor/filesystem`. `downloadBackup` ramifica:
  - **Nativo**: `Filesystem.writeFile` (directorio Cache, base64) → `Share.share({ files: [uri] })` (sheet de Android: guardar/compartir donde el usuario elija).
  - **Web**: anchor download actual (sin cambios).
- Requiere `npm install` + `npx cap sync android` + rebuild/instalar el APK para la verificación en emulador.

## 7. i18n

- Claves nuevas en el namespace `ajustes` (es/en, `core.ts`): sección, botón, sheets (título, lista, aviso de sesión activa), botón de backup, continuar sin backup, palabra de confirmación, estados busy/error.
- `workout.eliminarSesionMensaje` extendido con la línea de logros (es/en). La paridad EN la fuerza `EsSchema` (build).

## 8. Verificación

- **Unit**: `reconcileAchievementState` (re-bloqueo, contadores frescos, chapas retroceden, idempotencia, sin flood de modales); `performFactoryReset` (28 tablas + claves + orden + deps inyectadas); backup (`exportBackup` con 28 tablas; `importBackup` de archivo viejo no rompe; tablas vacías no se tocan).
- **e2e Playwright (Python, canal oficial del repo)**: flujo de reset (backup visible, gate de palabra, wipe → onboarding + catálogo sembrado, 0 `pageerror`); borrado → logro re-bloqueado sin flood; re-ganar → modal + contador ×1.
- **Emulador**: smoke post-build con los plugins nuevos (la app monta, el share sheet del backup abre con el JSON, el reset completo deja la app como recién instalada; 0 `pageerror`).
- **Build**: `npm run build` (typecheck real) + `npm test` verdes. **Ciclo de review por tarea antes de cada commit** (RDD encendido; `--cwd` del worktree). Commits convencionales **sin push**.

## 9. Entrega y bosquejo de tareas

Unidades de trabajo (una por commit; el plan de implementación detalla pasos y verificación de cada una):

1. `feat`: reconciliación de logros (domain + `useAchievements` + copy del confirm) + tests.
2. `feat`: `factoryReset` + sección de Ajustes (sheets, type-to-confirm) + i18n + tests.
3. `feat`: backup 28 tablas + entrega nativa (plugins + `cap sync`) + tests.
4. `test` / `docs`: e2e + smoke en emulador + `PLAN.md` (marcar 112.1/112.2) + `CHANGELOG.md`.

Cierre del worktree: rebase + `merge --ff-only` en main (otras sesiones idle) + `.\scripts\worktree.ps1 close f112`.
