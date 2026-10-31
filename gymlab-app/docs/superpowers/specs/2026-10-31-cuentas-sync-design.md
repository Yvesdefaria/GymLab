# Cuentas y sync multi-dispositivo — diseño

> **Rama:** `cuentas-oauth` (worktree `.worktrees/cuentas-oauth`, multisesión pedida por el usuario).
> **Fecha:** 2026-10-31.
> **Estado:** diseño propuesto — pendiente de aprobación del usuario. No hay código de producto todavía.
> **Runner:** `npm run build`, `npm test`, e2e Python (`tests/e2e/scripts/with_server.py`) y Supabase CLI local para los tests de sync.
> **Origen (verbatim):** «activa multisesion, vamos a pensar como implementar el backend y cuentas con oauth con gmail, etc, vamos a planificar».

## Intención

La cuenta existe para una sola cosa: **que los datos del usuario estén en cualquier dispositivo al loguearse**. No es una red social, no es monetización y no es telemetría. El criterio de aceptación que pidió el usuario es **paridad total**: abrís el teléfono o la tablet y ves lo mismo; no hay dispositivo principal.

La app sigue siendo **local-first**: se puede usar sin cuenta y sin red. La cuenta agrega una copia en la nube y reparte cambios entre dispositivos. El servidor **no** es requisito para usar la app; si Supabase se cae, la app sigue funcionando y sincroniza cuando vuelve.

El backend elegido es **Supabase** (Postgres + Auth + Storage futuro), región EU, porque resuelve el riesgo más caro de un backend con cuentas: el login móvil (Google bloquea OAuth dentro del WebView, hay que usar el navegador del sistema y volver por deep link, refresh tokens y revocación).

## Alcance

### S1 — Cuenta opcional

La app funciona sin cuenta exactamente como hoy. El onboarding ofrece crear cuenta **después del primer entrenamiento terminado**, de forma salteable. Sin cuenta no se sube ningún dato.

### S2 — Login con Google, Apple y email

- Google OAuth.
- Apple Sign-In (obligatorio en iOS si se ofrece Google; guideline 4.8).
- Email con link mágico.
- Los tres llegan al mismo `auth.uid()` de Supabase. Un usuario puede vincular más de un proveedor a la misma cuenta.

### S3 — Paridad entre dispositivos

Un usuario logueado en el dispositivo A ve los mismos datos en el dispositivo B después de sincronizar: entrenos, series, rutinas custom, programa activo, peso, medidas, pliegues, pasos, comidas, suplementos, diario, benchmarks, plantillas, periodización, notas de ejercicios, perfil y ajustes.

### S4 — Offline real

Se puede entrenar sin red en A y en B. Al volver la conexión, los hechos de ambos se **suman** (dos entrenos el mismo día son dos entrenos, no un conflicto). El estado único (perfil, programa activo, ajustes) se resuelve por último cambio.

### S5 — Borrados que no resucitan

Borrar un entreno, una serie o una rutina en A lo borra en B tras sincronizar. Un dispositivo desconectado no puede resucitar lo borrado. Los borrados viajan como tombstones con retención de 90 días.

### S6 — Primer login sin pérdida

Si el usuario ya tenía datos locales y loguea por primera vez, esos datos se suben y se mergean con lo que ya exista en la cuenta. Si la cuenta estaba vacía, se sube todo. Si el dispositivo estaba vacío, se baja todo. Nada se pierde y no se duplica lo que ya existe.

### S7 — Sesión robusta

Si el token expira o el refresh falla, la app **sigue funcionando offline** y muestra “reconectá tu cuenta” en el próximo intento de sync. Nunca se pierde un cambio local por un problema de sesión.

### S8 — Logout y borrado de cuenta

- Logout: deja de sincronizar, conserva los datos locales y ofrece “borrar datos locales”.
- Borrar cuenta: elimina los datos de la nube, los locales y la persona en PostHog; limpia el contexto de Sentry. Disponible desde la app y desde una URL web (requisito de Play).

### S9 — Privado por defecto

Ningún dato es público. No hay feed ni perfiles visibles. El diseño deja preparada la capa social futura sin exponer nada hoy.

### S10 — Nada de catálogo ni datos de dispositivo

No viajan `exercises`, `papers`, `guides`, las tablas sociales sin uso, `prs` (se recalcula), `exerciseAlias`, las fotos de progreso ni las claves de `meta` que son del dispositivo (cursor de health, recientes, flags de tour/debug).

### S11 — Estado de sync visible

La UI muestra: sin respaldo, sincronizando, al día (con hora), error. Hay un “forzar sync” manual.

### S12 — Export sigue funcionando

El export/import JSON actual sigue funcionando. Un backup viejo importado en una instalación nueva genera `uid` y `updatedAt` faltantes y puede sincronizarse.

## Fuera de alcance

- **Fotos de progreso**: quedan para cuando la app se autosustente económicamente. Hoy son base64 dentro de IndexedDB y son el dato pesado.
- **Social**: feed, seguidores, comentarios, likes. Es una fase futura; este diseño solo deja la base preparada.
- **Watch / Wear OS**: apps nativas aparte (Swift/Kotlin). El backend queda agnóstico para que se conecten después.
- **Tiempo real**: no hay websockets ni push. Sync al abrir, al volver al foreground, después de escribir (debounce) y manual.
- **CRDT / merge automático de texto**: no se usa Yjs ni Automerge.
- **Cuenta obligatoria**: se evalúa más adelante; hoy es opcional.

## Estado actual y restricciones

- **29 tablas** Dexie, todas detrás de repositorios. La UI no toca `db`.
- **Ya existe la base de sync v18** (`src/data/repositories/dexie/db.ts`): 7 tablas (`workouts`, `workoutSets`, `routines`, `routineDays`, `routineItems`, `bodyWeight`, `profile`) tienen `uid` (UUID), `updatedAt`, índice `&uid` y hooks `creating`/`updating` que los mantienen. Los ids numéricos siguen siendo la PK local.
- `exportBackup`/`importBackup` vuelcan **todas** las tablas a un JSON.
- Deploy actual: Cloudflare Worker con assets en `app.gymlab.dev`. El backend nuevo es solo Supabase; Cloudflare no cambia.
- Seeds deterministas: ejercicios con ids fijos y `slug` estable; rutinas custom con `CUSTOM_ID_BASE` e `isCustom`; `exerciseAlias` resuelve renumeraciones.
- Fotos de progreso: base64 en IndexedDB.
- Telemetría: PostHog y Sentry en EU.
- Legal: Play Store y App Store exigen borrado de cuenta; Play exige además una vía web.

## Decisiones

| # | Decisión | Motivo |
|---|----------|--------|
| D1 | Backend Supabase (Postgres + Auth), región EU (Frankfurt) | Auth móvil resuelto, Postgres para social futuro, misma región que Sentry/PostHog |
| D2 | Login Google + Apple + email link mágico | Email es la identidad portable y la recuperación; Apple lo exige en iOS |
| D3 | Cuenta opcional, prompt después del primer entreno | Sin fricción en el primer uso; el usuario decide después |
| D4 | Local-first; el servidor no es requisito | La app debe funcionar en el sótano del gym sin señal |
| D5 | Sync por outbox + cursor + LWW + tombstones | Simple, predecible y suficiente para el conjunto de tablas de usuario |
| D6 | Identidad global `uid` (UUID); ids numéricos quedan locales | Evita colisiones entre dispositivos sin migrar las PK de Dexie |
| D7 | Referencias al catálogo por `slug` / `foodKey`, nunca por id numérico | Los ids del seed pueden renumerarse entre versiones |
| D8 | Servidor: tabla genérica `sync_records` + RLS | Un solo esquema y un solo RPC para todas las tablas; menos migraciones |
| D9 | Privado por defecto; `visibility` existe desde el día uno | Sumar social después no obliga a migrar las tablas grandes |
| D10 | Borrados por tombstone, retención 90 días | Evita resurrección sin ensuciar todas las lecturas con `deletedAt` |
| D11 | Logout conserva lo local | El usuario puede seguir usando la app sin cuenta |
| D12 | Fotos, social y Watch/Wear fuera de esta fase | Control de alcance y costo |
| D13 | Social futuro: `user_id` + `visibility` + perfil público separado + namespaces `/me` y `/users/:handle` | Evita reescribir el modelo cuando llegue el feed |

## Arquitectura

### Capas

```
UI → hooks → repositories (interface) → Dexie (local)
                                      ↘ sync engine (nuevo) → Supabase (RPC)
```

La UI no cambia de contrato: sigue leyendo repositorios. El sync engine es un decorador que escucha cambios locales y aplica cambios remotos. Ningún componente sabe que existe Supabase.

### Modelo local (Dexie v19)

Se extiende `SYNC_TABLES` a todas las tablas de usuario:

`workouts`, `workoutSets`, `routines`, `routineDays`, `routineItems`, `bodyWeight`, `profile`, `bodyMeasurements`, `skinfolds`, `sessionJournals`, `benchmarkResults`, `dailySteps`, `mealEntries`, `supplements`, `workoutTemplates`, `periodizationPlans`, `activeProgram`, `exerciseNotes`, `foods`.

Cada una recibe `uid` (UUID), `updatedAt` (ISO) e índice. Las 7 que ya lo tienen no se tocan; el upgrade solo backfillea las nuevas.

Tablas nuevas, **no sincronizadas**:

- `syncOutbox`: `++id, tableName, uid, queuedAt` — cambios locales pendientes de push.
- `syncTombstones`: `++id, tableName, uid, deletedAt` — borrados locales pendientes de push.
- `syncState`: `key` — `deviceId`, `cursor`, `lastSyncAt`, `lastError`, `status`.

Campos aditivos:

- `exerciseSlug` en `workoutSets`, `routineItems` y `exerciseNotes`. Es la referencia estable al catálogo en el wire. En local se sigue usando `exerciseId`; el slug se mantiene al escribir.
- `visibility?: 'private' | 'friends' | 'public'` en `workouts` y `routines`, default `'private'`. La UI no lo muestra en esta fase.
- `foods` ya tiene `foodKey` estable; `MealFoodEntry` guarda `foodKey` + macros, así que las comidas son autocontenidas.

No se sincronizan: `exercises`, `papers`, `guides`, `prs`, `exerciseAlias`, `progressPhotos`, `socialProfiles`, `posts`, `postMedia`, `meta` (salvo allowlist).

`meta`: se sincronizan solo las claves de usuario. Denylist inicial: `healthLastSyncAt`, `healthPermissionAskedAt`, `seedVersion`, flags de tour/onboarding local, `gymlab.debug`, recientes de calculadoras y cualquier cursor de dispositivo. Allowlist inicial: `settings`, `profileName`, `heightCm`, `bodySex`, `birthDate`, `stepsGoal`, `strideLengthCm`, `avatar`, logros y coleccionables. La lista final se cierra en el plan de implementación con un test que falle si aparece una clave nueva sin clasificar.

### Modelo servidor (Postgres)

Una sola tabla para el sync:

```sql
create table sync_records (
  user_id     uuid not null references auth.users(id) on delete cascade,
  table_name  text not null,
  uid         uuid not null,
  data        jsonb not null default '{}'::jsonb,
  deleted     boolean not null default false,
  updated_at  timestamptz not null,
  device_id   text not null,
  revision    bigint not null default nextval('sync_revision_seq'),
  primary key (user_id, table_name, uid)
);

create index sync_records_pull_idx on sync_records (user_id, revision);
```

- `revision` es global y monótona. El cursor del cliente es el máximo `revision` visto.
- RLS: `auth.uid() = user_id` para `select`, `insert`, `update`, `delete`. Sin políticas públicas.
- RPC `sync_push(p_records jsonb)` y `sync_pull(p_since bigint, p_limit int)`, `security invoker` para que RLS siga aplicando.
- El cliente **nunca** usa la service role. El borrado de cuenta va por Edge Function con service role.

Por qué genérica y no una tabla por entidad: el sync no necesita consultas por campo; el cliente es el dueño del esquema. Una tabla + un RPC reduce el backend a una migración y hace el motor agnóstico de tabla. La capa social futura agrega tablas públicas tipadas (proyecciones), no reescribe el sync.

### Protocolo

**Push** (cliente → servidor):

```json
[
  {
    "table": "workouts",
    "uid": "…",
    "data": { "...": "..." },
    "updatedAt": "2026-10-31T12:00:00.000Z",
    "deviceId": "…",
    "deleted": false
  }
]
```

- Lotes de hasta 500 filas o 1 MB.
- Orden de dependencia dentro del lote: `routines` → `routineDays` → `routineItems`; `workouts` → `workoutSets`; `foods` → `mealEntries`; `activeProgram` al final.
- El servidor aplica upsert por `(user_id, table_name, uid)` y gana el mayor `updated_at`; empate por `device_id` lexicográfico.
- Guarda de reloj: si `updated_at` está más de 5 minutos en el futuro, se rechaza la fila (error `clock_skew`) y el cliente la reenvía con la hora corregida.
- Respuesta: `{ revision, applied: [...], rejected: [...] }`.

**Pull** (servidor → cliente):

```sql
select table_name, uid, data, deleted, updated_at, revision
from sync_records
where user_id = auth.uid() and revision > p_since
order by revision
limit p_limit;
```

- Lotes de 500.
- El cliente ordena el lote por dependencia antes de aplicar (no por revisión), para que un hijo nunca se inserte antes que su padre.
- Cursor = máximo `revision` del lote. Si el lote vino lleno, se repite hasta vaciar.
- Aplicar remoto **no** encola outbox (flag `isApplyingRemote`).

**Disparadores del sync**: arranque, foreground, después de una escritura (debounce 3 s), y “forzar sync”. Nada de polling agresivo.

**Errores**: offline → estado `offline` sin borrar la cola; 401/refresh fallido → `needs_reauth`; 429/5xx → backoff exponencial con jitter (máx. 5 min); 413 → partir el lote.

### Merge y conflictos

- **Hechos** (workouts, sets, peso, medidas, comidas, pasos, diario, benchmarks, suplementos, plantillas, periodización, foods): unión por `uid`. Dos filas distintas nunca se pisan.
- **Estado único** (`profile`, `activeProgram`, `meta` por clave): gana el `updatedAt` más alto; empate por `deviceId`.
- **Rutinas custom**: LWW por rutina; días e ítems por `uid`. Las rutinas del seed no viajan (`isCustom === true` es el filtro).
- **Series**: cada serie es una fila. Editar una serie en A y otra en B no es conflicto. Borrar una serie en A y editarla en B: gana el tombstone si `deletedAt >= updatedAt`; si la edición es posterior, gana la edición (se documenta y se testea).
- **Sin UI de conflicto en v1**: los casos raros se resuelven por LWW. Se registra en el log de sync para poder diagnosticar.

### Borrados

- Toda operación de borrado local escribe un tombstone (`tableName`, `uid`, `deletedAt`) y borra la fila.
- El hook `deleting` de Dexie es el punto único: cubre `delete`, `bulkDelete` y los borrados en cascada de los repositorios.
- El push manda el tombstone con `deleted: true` y `data: {}`.
- El pull aplica el tombstone borrando la fila local por `uid`, con supresión de outbox.
- Retención server-side: 90 días; después se purgan. Un dispositivo que estuvo más de 90 días offline puede resucitar datos; se acepta y se documenta (el caso realista es mucho menor).
- Borrado de cuenta: Edge Function `delete-account` borra `sync_records` y el usuario de `auth.users`; el cliente limpia Dexie, `syncState`, PostHog (`reset` + borrado de persona) y Sentry (`setUser(null)`).

### Referencias al catálogo

- El wire usa `exerciseSlug` y `foodKey`; nunca `exerciseId` ni `foodId` numéricos.
- En push, el motor resuelve `exerciseId` → `slug` con el catálogo local.
- En pull, resuelve `slug` → `exerciseId`. Si el slug no existe en la versión actual, la fila se guarda con `exerciseId = 0` y `exerciseSlug` seteado; la UI muestra “ejercicio no disponible” en vez de perder el dato.
- `routines.basedOnId` se traduce a `basedOnSlug` en el wire; si no se puede resolver, se omite (es solo un badge).
- `activeProgram.routineId` se traduce a `routineUid`.

### Preparación para social (sin implementarlo)

Lo que se deja listo ahora:

1. **`user_id` en cada registro** del servidor. Sin eso, sumar social obliga a reescribir todas las tablas.
2. **`visibility` default `private`** en `workouts` y `routines`. Cuando llegue el feed, es una política de lectura, no una migración.
3. **Perfil público separado del privado.** El perfil privado (edad, sexo, peso, objetivos) nunca se publica; el público (nombre, avatar, handle) será otra tabla. `profile.userId` hoy es un stub sin uso: al loguear se setea con `auth.uid()` o se depreca.
4. **Namespaces de API**: `/me/*` para lo privado; `/users/:handle/*` para lo público. Nada de ids numéricos en URLs públicas: `uid` o handle.
5. **Borrado en cascada por `user_id`**, incluidas las tablas sociales futuras.
6. **`deleted_at` en lo compartible** (moderación y auditoría lo van a necesitar).

No se crean tablas de follows, likes, comentarios, reportes ni bloqueos en esta fase.

### Auth

**Web (PWA y `app.gymlab.dev`)**

- `signInWithOAuth({ provider, options: { redirectTo: origin + '/auth/callback' } })`.
- `flowType: 'pkce'`, `detectSessionInUrl: true`.
- Magic link: `signInWithOtp({ email, options: { emailRedirectTo } })`.

**Nativo (Capacitor iOS/Android)**

- `detectSessionInUrl: false`, `autoRefreshToken: true`, `persistSession: true`.
- `signInWithOAuth({ ..., options: { skipBrowserRedirect: true } })` → abrir la URL con `@capacitor/browser` (navegador del sistema; Google prohíbe WebView embebido).
- Callback por deep link `gymlab://auth/callback` → `@capacitor/app` `appUrlOpen` → `exchangeCodeForSession(code)`.
- Android: `intent-filter` con el scheme. iOS: `CFBundleURLTypes`. Universal links (`https://app.gymlab.dev/auth/callback`) quedan como endurecimiento posterior.
- Magic link en nativo: `emailRedirectTo: 'gymlab://auth/callback'`.
- Sesión en almacenamiento seguro (Keychain/Keystore) con adaptador de Supabase; fallback a `@capacitor/preferences` solo si el plugin no es compatible con Capacitor 8. La elección exacta se cierra en el plan.
- Apple en Android: el flujo web de Apple funciona en cualquier navegador, así que **sí** se puede ofrecer Apple también en Android (mejor que Hevy, que lo limita a dispositivos Apple).

**Vinculación de proveedores**

- Un usuario puede vincular Google, Apple y email a la misma cuenta (`linkIdentity`).
- Se evita crear cuentas duplicadas: si el email verificado ya existe, se vincula en vez de crear. La configuración de auto-linking de Supabase se revisa explícitamente por riesgo de takeover.
- No se promete merge de cuentas duplicadas: se previene. (Strong no puede mergear y es soporte eterno.)

**Sesión y refresh**

- `onAuthStateChange` actualiza el estado de la app.
- Si el refresh falla: estado `needs_reauth`, banner en Ajustes y en el indicador de sync. Los cambios locales quedan en el outbox.
- Logout: `signOut({ scope: 'local' })`, conserva Dexie.

### UX

- **Onboarding**: después del primer entreno terminado, sheet “Tus datos, en todos tus dispositivos” con Google / Apple / email y “Ahora no”. Salteable y no repetitivo (se recuerda la decisión).
- **Ajustes > Cuenta**: estado de sesión, proveedores vinculados, “forzar sync”, “cerrar sesión”, “borrar cuenta”.
- **Indicador de sync** en Perfil: “Sin respaldo” (sin cuenta), “Sincronizando”, “Al día hace X”, “Error, reintentar”, “Reconectá tu cuenta”.
- **Borrar cuenta**: doble confirmación con texto explícito de qué se borra. También accesible por URL web.
- Sin modales bloqueantes ni prompts repetidos.

## Flujos

1. **Primera instalación sin cuenta**: onboarding → app normal → después del primer entreno, prompt de cuenta.
2. **Primer login con datos locales**: sube todo, baja lo remoto, merge por `uid`/LWW.
3. **Dispositivo nuevo con cuenta**: login → pull completo → app con todos los datos.
4. **Dos dispositivos offline**: cada uno crea hechos; al sincronizar se suman.
5. **Borrado en A**: tombstone → B lo aplica y desaparece.
6. **Token expirado**: la app sigue offline; el sync se detiene con `needs_reauth`; al re-loguear continúa la cola.
7. **Borrado de cuenta**: nube + local + telemetría.
8. **Cambio de teléfono**: login en el nuevo, pull completo, el viejo puede seguir o cerrar sesión.

## Migración y compatibilidad

- **Dexie v19**: agregar `uid`/`updatedAt` a las tablas nuevas, backfill con `newUid()` y `createdAt ?? startedAt ?? localDate ?? now`; agregar `exerciseSlug` resolviendo `exerciseId`; agregar `visibility: 'private'`; crear `syncOutbox`, `syncTombstones` y `syncState`; extender los hooks.
- **Hooks**: `creating` asigna `uid`/`updatedAt` y encola outbox; `updating` actualiza `updatedAt` y encola; `deleting` encola tombstone. Un flag global suprime el encolado al aplicar remoto.
- **Backups viejos**: `importBackup` sigue aceptando filas sin `uid`; el hook de `creating` las completa. El export incluye los campos nuevos.
- **Seeds**: los slugs son la identidad estable. `exerciseAlias` sigue resolviendo renumeraciones locales.
- **Cross-version**: un dispositivo con una versión vieja puede bajar slugs que no conoce; se guardan con `exerciseId = 0` y `exerciseSlug`, sin perder el dato.

## Seguridad y privacidad

- RLS de dueño único en `sync_records`; sin políticas públicas.
- La service role vive solo en la Edge Function de borrado; nunca en el cliente.
- Tokens en almacenamiento seguro del dispositivo.
- Región EU; sin transferencia internacional adicional.
- Política de privacidad: qué se recoge (email, nombre, id, datos de entrenamiento), para qué (sync), dónde (EU), retención y borrado.
- Play Data safety: datos **vinculados a la identidad** para usuarios con cuenta; los anónimos siguen pseudónimos.
- Borrado de cuenta in-app + URL web.
- Telemetría: `identify` con `user.id` (sin email salvo necesidad), `reset` al cerrar sesión, borrado de persona en PostHog al borrar cuenta, `setUser(null)` en Sentry.

## Costos

- Supabase Free para desarrollo; el plan free pausa proyectos inactivos. Para producción publicada, **Pro ~US$25/mes** (verificar límites al contratar).
- SMTP propio para magic links en producción (Resend free tier alcanza para empezar); el SMTP integrado de Supabase tiene límites muy bajos.
- Egress bajo: sin fotos, solo JSON.
- Apple Developer ya es necesario para publicar en App Store.

## Verificación

- **Unitarios**: LWW con empate por `deviceId`, unión de hechos, tombstones, guarda de reloj, orden padre→hijo, mapeo `exerciseId`↔`slug`, allowlist/denylist de `meta`.
- **Integración**: Supabase CLI local; dos usuarios; RLS (A no puede leer ni escribir lo de B); push/pull idempotente; lote partido por 413.
- **E2E web**: dos contextos de navegador como dos dispositivos, misma cuenta; crear en A → aparece en B; offline en ambos → merge; borrar en A → desaparece en B.
- **Nativo**: emulador Android; login Google/Apple/email; deep link; sync; matar la app y reabrir; token expirado.
- **Legal**: checklist de Play Data safety, App Privacy, política y borrado de cuenta.
- **Regresión**: `npm run build`, `npm test`, export/import JSON, y que la app sin cuenta siga funcionando igual.

## Fases de implementación

| Fase | Contenido | Backend |
|------|-----------|---------|
| F1 | Preparación local: v19, `uid`/`updatedAt` en todas, `exerciseSlug`, outbox, tombstones, `syncState`, hooks, tests | No |
| F2 | Supabase + Auth: proyecto EU, proveedores, deep links, sesión segura, UI de cuenta, logout, borrado de cuenta | Sí |
| F3 | Motor de sync: RPC, push/pull, merge, tombstones, estado visible, forzar sync | Sí |
| F4 | Endurecimiento: refresh, backoff, export, telemetría de identidad, legal, emulador | Sí |
| F5 | Social (futuro): perfiles públicos, feed, moderación | Sí |

F1 se puede mergear sin backend y sin cambiar el comportamiento visible. F2 y F3 van juntas para poder probar el flujo completo.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| OAuth en WebView / deep links rotos | Navegador del sistema + deep link; probar en emulador desde F2 |
| Reloj del dispositivo desfasado | Guarda de 5 min y rechazo explícito |
| IDs de catálogo que cambian entre versiones | Wire por `slug`; fallback `exerciseId = 0` |
| Tombstone mal aplicado (resurrección o pérdida) | Tests dedicados + log de sync + retención 90 días |
| Refresh de token silencioso (bug de Strong) | Estado `needs_reauth` visible y re-login explícito |
| Costo / pausa de Supabase | Free para dev; Pro al publicar; monitorear uso |
| Scope creep (social, fotos, Watch) | Fuera de alcance explícito en esta spec |
| Duplicación de cuentas | Vinculación de proveedores + auto-linking revisado; no merge |

## Decisiones abiertas (se cierran en el plan de implementación)

1. Plugin de almacenamiento seguro para la sesión en Capacitor 8.
2. Proveedor SMTP para magic links en producción.
3. Lista final de claves de `meta` sincronizadas (allowlist/denylist).
4. Apple: flujo web vs nativo en iOS (v1: web; nativo si la UX lo exige).
5. Workflow de Supabase local para tests (CLI + migraciones versionadas en el repo).
6. Límites exactos de lote y política de reintentos.
7. Si `activeProgram` y `profile` necesitan una regla de merge por campo en vez de LWW por fila.

> Los conflictos **C1–C14** (C1–C8 son las 8 preguntas del builder check del 2026-10-31) están registrados en la **Fase 133** de `PLAN.md`; se resuelven en la próxima sesión, antes de escribir código.
