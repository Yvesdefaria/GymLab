# Play Store — Data Safety y declaraciones de salud

> Documento de trabajo para completar **Play Console → App content**.
> No es asesoramiento legal. Las respuestas deben reflejar el build que se publica,
> no una versión futura.
>
> Build de referencia: **1.0.0 (versionCode 1)**, Android, sin firma todavía.
> Última revisión: **2026-10-29**.

---

## 1. Resumen ejecutivo

GymLab es **local-first**: no tiene backend, no tiene cuenta y no envía a servidores
propios los entrenamientos, el peso, las medidas, las fotos ni los datos de salud.
La única salida de datos es la **telemetría opcional** (Sentry + PostHog), que está
**apagada por defecto** y solo se activa si el usuario la prende en Ajustes.

Para el formulario de Data Safety, la consecuencia práctica es:

| Pregunta | Respuesta |
|---|---|
| ¿La app recopila o comparte datos? | **Sí**, solo telemetría opcional |
| ¿Todos los datos se cifran en tránsito? | **Sí** (HTTPS a Sentry y PostHog) |
| ¿Hay mecanismo de borrado? | **Sí** (reset de fábrica, desinstalación y correo) |
| ¿Se comparten datos con terceros? | **No** (Sentry/PostHog como encargados, con DPA) |
| ¿Hay anuncios? | **No** en este build |
| ¿Hay compras integradas? | **No** en este build |
| ¿Se accede a salud? | **Sí**, solo pasos vía Health Connect (local) |
| ¿Se accede a ubicación? | **No** (ver bloqueante de GPS más abajo) |

**No seleccionar** en Data Safety: Health and fitness, Personal info, Photos, Files
and docs, Financial info, Messages, Contacts, Calendar, Audio, Web browsing, Precise
location. Esos datos existen en el dispositivo, pero no se transmiten fuera de él.
Play define “collect” como **transmitir datos fuera del dispositivo**; el
procesamiento local no se declara como recolección.

Los tres bloqueantes de configuración ya están corregidos y verificados: permisos de
Health Connect, Auto Backup y almacenamiento de IP en PostHog/Sentry. Quedan **tres
bloqueantes** que no son del formulario pero lo vuelven inexacto: copy de la política
(pseudónima y OFF por defecto), avatares remotos de Unsplash y GPS sin permiso. Están
detallados en la sección 7.

---

## 2. Definiciones de Play que aplican

- **Collect**: transmitir datos desde la app fuera del dispositivo. Incluye SDKs y
  librerías. El acceso o procesamiento **solo local** no se declara como recolección.
- **Shared**: transferir datos de usuario a un tercero. Los **service providers**
  (encargados que procesan en nombre del desarrollador) no cuentan como sharing.
- **Optional**: el usuario puede optar por dar el dato o por apagarlo. La telemetría
  es opcional porque el toggle existe para todos los usuarios.
- **Global**: el formulario describe la suma de versiones publicadas. Si una versión
  puede enviar telemetría, se declara aunque esté apagada por defecto.

---

## 3. Qué hace el build (evidencia)

### 3.1 Datos locales (no salen del dispositivo)

| Dato | Dónde vive | Sale del dispositivo |
|---|---|---|
| Entrenamientos, series, reps, pesos, PRs | IndexedDB (Dexie) | No |
| Peso corporal, medidas, pliegues, composición | IndexedDB | No |
| Nutrición, calorías, pasos, rachas, logros | IndexedDB | No |
| Fotos de progreso | IndexedDB; galería solo si el usuario toca “Guardar” | No por la app |
| Diario, notas, benchmark, ajustes | IndexedDB / localStorage | No |
| Backup JSON/CSV | Archivo/share que elige el usuario | Solo por acción del usuario |

Evidencia: `src/data/repositories/dexie/db.ts` (28 tablas), `src/data/factoryReset.ts`
(wipe de todas las tablas), `src/lib/saveToGallery.ts` (guardado en galería por acción
del usuario).

### 3.2 Health Connect: solo pasos

La app **solo pide `READ_STEPS`** y el permiso de lectura en segundo plano:

- `src/data/healthBridge.ts:82-91` — `checkHealthPermissions` y
  `requestHealthPermissions` con `permissions: ['READ_STEPS']`.
- `src/data/healthBridge.ts:93-123` — `queryAggregated` con `dataType: 'steps'`.
- `android/app/src/main/java/com/gymlab/app/GymLabHealthPlugin.kt:78` — pide
  `READ_HEALTH_DATA_IN_BACKGROUND` para el widget.
- `src/i18n/locales/es/features.ts:508` — la política in-app dice, correctamente, que
  el único dato de salud es el recuento de pasos.

**Resuelto:** el manifest del plugin `capacitor-health` declara 13 permisos de lectura
(`node_modules/capacitor-health/android/src/main/AndroidManifest.xml`), pero
`android/app/src/main/AndroidManifest.xml` elimina los 12 que no se usan con
`tools:node="remove"`. El manifest fusionado solo tiene `READ_STEPS` +
`READ_HEALTH_DATA_IN_BACKGROUND` (verificado el 2026-10-29). Ver 5.2 y 7.1.

### 3.3 Telemetría opcional

- **Default OFF**: `src/domain/settings.ts:93` (`telemetry: false`).
- **Gate**: `src/domain/telemetry.ts:17-18`; solo se enciende con build de producción,
  claves configuradas y consentimiento.
- **PostHog**: `src/lib/telemetry.ts:88-100`.
  - Host `https://eu.i.posthog.com` (UE).
  - `disable_session_recording: true`, `autocapture: false`,
    `capture_performance: false`.
  - `before_send` borra `text`, `innerText`, `value`, `href`, `name`, `$el_text` y
    todo `attr__*`.
  - Eventos: `screen_view {path}`, `workout_started`, `workout_completed`
    (`durationMin`, `exerciseCount`, `prCount`), `weight_logged`, `measurement_logged`,
    `photo_added`, `data_exported`, `data_imported`, `onboarding_completed`,
    `settings_changed {key}`, `steps_synced`, etc. No se envían textos, pesos ni
    contenido de las pantallas.
- **Sentry**: `src/lib/telemetry.ts:102-113`.
  - `tracesSampleRate: 0`, `replaysSessionSampleRate: 0`,
    `replaysOnErrorSampleRate: 0`.
  - Solo errores/excepciones y contexto técnico del dispositivo.
  - Proyecto `gymlab-app` (org `yvesdefaria`, DE) con **Prevent Storing of IP
    Addresses** ON.
- **Ajustes del proyecto PostHog (316300)**: `anonymize_ips: true`,
  `autocapture_opt_out: true`, `autocapture_exceptions_opt_in: false`,
  `session_recording_opt_in: false`, `capture_performance_opt_in: false`,
  `capture_console_log_opt_in: false`, `surveys_opt_in: false`,
  `heatmaps_opt_in: false`. No se envía `$web_vitals`; no aplica Diagnostics.
- **Consentimiento**: `src/components/settings/TelemetrySection.tsx` y
  `src/hooks/useTelemetryConsent.ts`; el toggle se aplica al arrancar
  (`src/components/layout/AppShell.tsx:51-58`).

### 3.4 Red externa que no es telemetría

- **Avatares preset**: `src/components/profile/AvatarPicker.tsx:19-30` carga 12
  imágenes de `images.unsplash.com`. Al mostrarlas, el dispositivo hace una petición a
  Unsplash (IP y user-agent). No se envía contenido del usuario, pero **no está
  declarado en la política de privacidad**. Ver bloqueante 7.5.
- **Catálogo**: `src/data/catalogLoader.ts` carga un JSON local de la app; no es una
  API externa.
- **Papers**: los `sourceUrl` son enlaces que el usuario abre; no se consultan solos.
- **No hay** backend, auth, sync, push ni llamadas a APIs de GymLab.

### 3.5 Permisos del APK fusionado

| Permiso | Para qué | Dato de usuario |
|---|---|---|
| `health.READ_STEPS` | Pasos | Salud (local) |
| `health.READ_HEALTH_DATA_IN_BACKGROUND` | Widget de pasos | Salud (local) |
| `INTERNET`, `ACCESS_NETWORK_STATE` | Assets, telemetría | IP en las salidas |
| `POST_NOTIFICATIONS` | Descanso y recordatorios | No |
| `SCHEDULE_EXACT_ALARM` | Timers/recordatorios exactos | No |
| `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `FOREGROUND_SERVICE` | Widget/worker | No |
| `VIBRATE` | Feedback | No |

> Verificado: el manifest fusionado solo tiene los dos permisos de salud de la tabla;
> la app elimina los 12 restantes con `tools:node="remove"`. El detalle está en 5.2.

**No hay** `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `CAMERA`,
`RECORD_AUDIO`, contactos, calendario ni SMS.

---

## 4. Data Safety — respuestas exactas

### 4.1 Data collection and security

1. **Does your app collect or share any of the required user data types?**
   → **Yes**.
2. **Is all of the user data collected by your app encrypted in transit?**
   → **Yes**. PostHog y Sentry usan HTTPS; el resto no sale.
3. **Do you provide a way for users to request that their data is deleted?**
   → **Yes**:
   - Ajustes → Zona de peligro → Reset de fábrica: borra las 28 tablas de Dexie,
     localStorage/sessionStorage y notificaciones (`src/data/factoryReset.ts:101-118`).
   - Desinstalar la app o limpiar sus datos desde Android.
   - Correo `gymlab@gymlab.dev` para datos de telemetría ya enviados.

### 4.2 Data types — selección

| Categoría Play | Tipo | ¿Seleccionar? | Motivo |
|---|---|---|---|
| App activity | **App interactions** | **Sí** | PostHog: pantallas y acciones, solo con telemetría |
| App info and performance | **Crash logs** | **Sí** | Sentry: errores/excepciones, solo con telemetría |
| Device or other IDs | **Device or other IDs** | **Sí** | PostHog distinct ID / contexto técnico; solo con telemetría |
| Location | Approximate location | **No** (PostHog `anonymize_ips: true`; Sentry *Prevent Storing of IP Addresses* ON) | Ninguno de los dos almacena IP |
| Location | Precise location | **No** | No hay permiso de ubicación |
| Health and fitness | Health info / Fitness info | **No** | Pasos locales; no se transmiten (ver sección 5) |
| Personal info | Name, email, user IDs, etc. | **No** | Solo local; no hay cuenta |
| Photos and videos | Photos | **No** | Solo local; galería por acción del usuario |
| Files and docs | Files and docs | **No** | Backup por acción del usuario |
| Financial info | Cualquiera | **No** | Sin anuncios ni compras en este build |
| Messages, contacts, calendar, audio, web browsing | Cualquiera | **No** | No se accede |

> PostHog tiene `capture_performance: false` y `capture_performance_opt_in: false`;
> no se declara **Diagnostics**. Solo quedan App interactions + Crash logs + Device IDs.

### 4.3 Data usage and handling (para cada tipo seleccionado)

Para **App interactions**, **Crash logs** y **Device or other IDs**:

| Pregunta | Respuesta |
|---|---|
| ¿Se recopila, se comparte o ambos? | **Collected** |
| ¿Se procesa efímeramente? | **No** |
| ¿Es obligatorio o el usuario puede elegir? | **Optional** (toggle de telemetría) |
| ¿Para qué? | **Analytics** |
| ¿Se comparte? | **No** (Sentry/PostHog son service providers) |
| ¿Cifrado en tránsito? | **Sí** |
| ¿Borrado? | **Sí** (ver 4.1) |

PostHog y Sentry descartan la IP; no se declara **Approximate location**.

### 4.4 Store listing preview esperado

- “Data may be collected: App activity, App info and performance, Device or other IDs.”
- “Data is optional and encrypted in transit.”
- “You can request data deletion.”
- “No health, fitness, photo or personal data is collected by the developer.”

---

## 5. Health Connect — declaración de salud

### 5.1 Qué declarar

| Pregunta | Respuesta |
|---|---|
| ¿La app usa Health Connect? | **Sí** |
| Tipos de dato | **Steps** (lectura) |
| Lectura en segundo plano | **Sí**, para el widget de pasos |
| ¿Escribe datos? | **No** |
| ¿Se transmiten fuera del dispositivo? | **No** |
| ¿Se comparten con terceros? | **No** |
| ¿Se usan para publicidad? | **No** |
| ¿Se venden? | **No** |
| ¿Se usan para perfilar? | **No** |
| Finalidad | Mostrar pasos, rachas, logros y widget |
| Revocación | Health Connect → Permisos; la app sigue funcionando sin pasos |
| Borrado | Reset de fábrica, desinstalación o limpiar datos |
| Política de privacidad | URL pública (ver 7.4) |

### 5.2 Permisos eliminados (verificado)

El manifest de la app elimina estos permisos que **no usa**; el fusionado ya no los
declara:

```
health.READ_EXERCISE
health.READ_DISTANCE
health.READ_ACTIVE_CALORIES_BURNED
health.READ_TOTAL_CALORIES_BURNED
health.READ_FLOORS_CLIMBED
health.READ_HEART_RATE
health.READ_EXERCISE_ROUTE
health.READ_WEIGHT
health.READ_HEIGHT
health.READ_BODY_FAT
health.READ_LEAN_BODY_MASS
health.READ_NUTRITION
```

Implementación: en `android/app/src/main/AndroidManifest.xml`, cada uno tiene
`tools:node="remove"`, dejando solo `READ_STEPS` y
`READ_HEALTH_DATA_IN_BACKGROUND`:

```xml
<uses-permission android:name="android.permission.health.READ_EXERCISE" tools:node="remove" />
<!-- repetir para los 11 restantes -->
```

Después:

```powershell
npm run android:sync
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\android\gradlew.bat -p .\android assembleDebug
# verificar que el manifest fusionado solo tenga READ_STEPS + background
```

Verificado: el manifest fusionado de debug y `adb shell dumpsys package
com.gymlab.app` solo listan `READ_STEPS` + `READ_HEALTH_DATA_IN_BACKGROUND`.

Si en el futuro se leen más tipos, hay que actualizar la declaración de Health Connect
y el Data Safety **antes** de publicar.

---

## 6. Otras declaraciones de Play Console

| Sección | Respuesta para este build |
|---|---|
| **Ads** | **No**; no hay SDK de AdMob en `package.json` |
| **In-app purchases** | **No**; no hay SDK de Billing en `package.json` |
| **Target audience** | 14+ (la política dice 14+); no está diseñada para niños; no marcar Families |
| **Health apps** | **Sí** (Health Connect, solo pasos) |
| **Photo/video permissions** | Photo Picker / intent de cámara; no hay permiso `CAMERA`; acceso solo cuando el usuario elige una foto |
| **Exact alarms** | `SCHEDULE_EXACT_ALARM` para timers/recordatorios; completar la declaración si Play la pide |
| **Data deletion** | Reset de fábrica + desinstalación + correo |
| **Privacy policy URL** | Ver 7.4; debe ser pública y coincidir con la app |

---

## 7. Bloqueantes antes de enviar

### 7.1 Permisos de Health Connect — resuelto

**Corregido:** el manifest declara 13 tipos de lectura, pero la app los elimina con
`tools:node="remove"` y solo pide pasos. Verificado en el manifest fusionado y en
`dumpsys package`: solo `READ_STEPS` + `READ_HEALTH_DATA_IN_BACKGROUND`. Build
`assembleDebug` y smoke nativo de 7 rutas OK.

### 7.2 Auto Backup — resuelto

**Corregido:** `android:allowBackup="false"` y
`android:dataExtractionRules="@xml/data_extraction_rules"` excluyen root, file,
database, sharedpref y external tanto en `cloud-backup` como en `device-transfer`.
La app ya tiene su propio export/import. Verificado en el manifest fusionado.

### 7.3 IP en PostHog y Sentry — resuelto

**PostHog:** proyecto 316300 con `anonymize_ips: true` (MCP, 2026-10-29).
**Sentry:** proyecto `gymlab-app` (org `yvesdefaria`, región DE) con **Prevent Storing
of IP Addresses** activo (confirmado por el usuario el 2026-10-29). Ninguno almacena
IP; no se declara **Approximate location**.
**DPA:** mantener contratos de encargado de tratamiento con Sentry y PostHog; sin DPA,
Play podría considerarlos terceros y habría que declarar **Shared**.

### 7.4 Política de privacidad — copy pendiente (medio)

La URL pública es **`https://gymlab.dev/privacidad`** (live, 21/10/2026). Ya coincide
con la in-app en correo (`gymlab@gymlab.dev`), Health Connect/HealthKit y fecha. La
copia `legal/privacidad.html` del repo está atrasada (5/9/2026, correo viejo) y **no
es la que se publica**.

Queda:
1. Cambiar **“datos anónimos”** por **“datos pseudónimos”** en la app y en WebGymLab.
2. Aclarar que la telemetría está **OFF por defecto** y solo se envía con
   consentimiento.
3. Decidir Unsplash: empaquetar los avatares o mencionarlo en la política.

### 7.5 Avatares remotos de Unsplash (medio)

**Qué pasa:** `src/components/profile/AvatarPicker.tsx:19-30` carga 12 imágenes desde
`images.unsplash.com`. La petición envía IP y user-agent a Unsplash; no está en la
política.
**Acción (recomendada):** empaquetar las 12 imágenes en `public/` y servirlas locales.
Alternativa: declarar Unsplash como tercero y su finalidad en la política. Para un
producto que se vende como local-first, lo primero es más coherente.

### 7.6 GPS de cardio sin permiso (medio)

**Qué pasa:** `src/hooks/useCardioTracking.ts:171` usa
`navigator.geolocation.watchPosition`, pero el manifest no tiene
`ACCESS_FINE_LOCATION` ni `ACCESS_COARSE_LOCATION`. En Android el modo GPS no puede
funcionar; la UI puede ofrecerlo y fallar.
**Acción:** elegir una:
- **Ocultar el modo GPS** en Android y dejar solo podómetro/acelerómetro (no agrega
  ubicación a Data Safety).
- **Habilitar GPS** con permisos, disclosure y declarar **Precise location** en Data
  Safety y en la política.
No dejarlo como está: es una función visible que no funciona y una promesa de
privacidad ambigua.

### 7.7 Firma y versionado (release, no Data Safety)

- Falta `android/keystore.properties` + keystore; el AAB actual está sin firmar.
- `versionCode 1` / `versionName 1.0.0`: confirmar antes de subir. Si ya existe un
  build en Play, subir el `versionCode`.
- El AAB pesa ~111 MB; está dentro del límite, pero conviene revisar el tamaño de los
  assets (94 MB de fotos de ejercicios) antes de la primera subida.

---

## 8. Checklist de completado

- [x] Quitar los 12 permisos de Health Connect no usados; verificar manifest fusionado.
- [x] `allowBackup="false"` + `dataExtractionRules`; rebuild + smoke.
- [x] PostHog `anonymize_ips: true` y Sentry “Prevent Storing of IP Addresses” ON.
- [x] PostHog sin `$web_vitals`; no se declara Diagnostics.
- [x] URL pública confirmada (`https://gymlab.dev/privacidad`); falta copy pseudónima/OFF por defecto y Unsplash.
- [ ] Decir “pseudónima” y “OFF por defecto”; agregar Unsplash o empaquetar avatares.
- [ ] Decidir GPS: ocultar o habilitar con permisos + declaración.
- [ ] Completar Data Safety con la tabla de la sección 4.
- [ ] Completar Health apps declaration con la sección 5.
- [ ] Ads: No; IAP: No; Target audience: 14+.
- [ ] Firmar el AAB y subirlo al track interno.
- [ ] Revisar la vista previa de la ficha y probar el flujo de borrado.

---

## 9. Evidencia consultada

> Rutas relativas a `gymlab-app/`; `legal/privacidad.html` está en la raíz del repo.

| Archivo | Qué se verificó |
|---|---|
| `src/domain/settings.ts:93` | `telemetry: false` por defecto |
| `src/domain/telemetry.ts:17-18` | Gate prod + claves + consentimiento |
| `src/lib/telemetry.ts:88-113` | PostHog EU, sin grabación, Sentry sin trazas/replays |
| `src/data/healthBridge.ts:82-123` | Solo `READ_STEPS` y `dataType: 'steps'` |
| `src/data/stepsSync.ts:49-118` | Backfill/merge local de pasos |
| `android/app/src/main/AndroidManifest.xml` | `tools:node="remove"` para 12 permisos; `allowBackup=false`; `dataExtractionRules` |
| `android/app/src/main/res/xml/data_extraction_rules.xml` | Exclusión total de cloud-backup y device-transfer |
| `android/app/build/intermediates/merged_manifests/debug/...` | Solo `READ_STEPS` + background; `allowBackup=false` |
| `adb shell dumpsys package com.gymlab.app` | Solo 2 permisos de salud, ambos granted |
| PostHog proyecto 316300 (MCP) | `anonymize_ips: true`, `autocapture_opt_out: true`, `session_recording_opt_in: false`, `capture_performance_opt_in: false`, `capture_console_log_opt_in: false`, `surveys_opt_in: false`, `heatmaps_opt_in: false` |
| Sentry org `yvesdefaria` / proyecto `gymlab-app` | **Prevent Storing of IP Addresses** ON (confirmado por el usuario) |
| `node_modules/capacitor-health/android/src/main/AndroidManifest.xml` | 13 permisos de lectura |
| `src/data/factoryReset.ts:101-118` | Wipe de todas las tablas |
| `src/components/profile/AvatarPicker.tsx:19-30` | Avatares remotos Unsplash |
| `src/hooks/useCardioTracking.ts:171` | Geolocation sin permiso Android |
| `src/config/contact.ts` | `gymlab@gymlab.dev` |
| `src/i18n/locales/es/features.ts:508-543` | Política in-app: solo pasos, telemetría, permisos |
| `legal/privacidad.html:59,84,158,173` | Política estática y correo viejo |
| `package.json` | Sin AdMob/Billing; Sentry/PostHog/Camera/Media/Share |

---

## 10. Riesgo

**Riesgo del release si se envía sin corregir: alto.** 7.1, 7.2 y 7.3 ya están
corregidos y verificados; quedan 7.4 (política), 7.5 (Unsplash) y 7.6 (GPS), que
pueden producir una declaración de privacidad inexacta.

**Riesgo del cambio nativo:** item 2 (seguridad/permisos) y item 5 (entrega). Se
verificó con `assembleDebug`, manifest fusionado, `dumpsys package` y smoke nativo de
7 rutas; no se publicó ni se firmó nada.
