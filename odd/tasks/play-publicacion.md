# Publicación en Play Store — checklist y bloqueadores

- Feature: play-publicacion
- Estado: en curso (prioridad declarada por el owner el 2026-10-22)
- Depende de: Fase 126 (legal + Data safety), firma release
- Reemplaza como prioridad a: Fase 125 y Fase 129 (quedan documentadas, no urgentes)

## Objetivo

Publicar GymLab en Google Play (track de producción) desde una cuenta **de organización**, con firma propia, AAB, ficha completa y declaraciones coherentes con el código real.

## Verificado el 2026-10-22

| Ítem | Estado |
|---|---|
| `applicationId` | `com.gymlab.app` |
| `versionCode` / `versionName` | `1` / (definido en `android/app/build.gradle`) |
| `minSdk` / `compileSdk` / `targetSdk` | 26 / 36 / **36** — cumple el requisito de API de Play para apps nuevas en 2026 |
| Firma release | **NO EXISTE**: sin `gymlab-release.jks`, sin `keystore.properties`, sin `signingConfigs` en `build.gradle` |
| AAB | no configurado; solo se generó APK debug hasta ahora |
| Icono 512 | `public/icon-512.png` ✓ (y `icon-maskable-512.png`) |
| Feature graphic 1024×500 | **FALTA** |
| Screenshots | existen en WebP para la web; Play pide **JPEG o PNG** |
| Política de privacidad | live en `gymlab.dev/privacidad` (301 → `/es/privacidad/`); nombra Sentry y PostHog, explica el toggle de Ajustes |
| Términos | live en `gymlab.dev/terminos` |
| Email de contacto | `gymlab@gymlab.dev` con Email Routing verificado |
| Rationale de Health Connect | `PermissionsRationaleActivity` apunta a la política publicada (verificado en emulador) |
| Cuenta | personal; en conversión a organización |

## Bloqueadores (sin esto no hay publicación)

### B1 — Firma release con keystore propia

- Crear `android/gymlab-release.jks` (**nunca commitear**; `*.jks` ya está ignorado).
- `android/keystore.properties` con las credenciales (agregar al `.gitignore` de `android/`).
- **Copia de seguridad del keystore en dos lugares**: sin él no hay actualizaciones posibles.
- Cablear `signingConfigs.release` leyendo `keystore.properties` con fallback a debug si el archivo no existe.
- Decidir **Play App Signing**: Google guarda la clave de distribución y nosotros subimos con una *upload key*. Es el camino recomendado (si se pierde la upload key, se puede resetear; si se pierde la propia, no).

### B2 — AAB de release

- `bundleRelease` → `.aab` firmado. Play exige AAB para apps nuevas (no APK).
- Subir primero a **testing interno** y verificar instalación desde Play.
- Nota: la build release **no es inspeccionable por CDP**; el emulador sigue siendo el banco de pruebas con builds debug.

### B3 — Ficha de tienda completa

- **Feature graphic 1024×500** (falta).
- **Screenshots JPEG/PNG**: mínimo 2, máximo 8 por tipo; teléfono obligatorio. Reutilizar las capturas de `public/screens/`, exportadas a PNG.
- Icono 512×512 ✓, título (≤30), descripción corta (≤80), descripción larga (≤4000), en **ES y EN** (la app ya arranca en inglés por defecto; la ficha no puede quedar solo en español).
- Categoría, etiquetas, datos de contacto y política de privacidad.

## Declaraciones obligatorias en Play Console

### D1 — Health apps declaration

- Declarar acceso a **Health Connect**, tipo «Activity / steps», lectura diaria de pasos + lectura en segundo plano para el widget, uso **solo en el dispositivo**, sin publicidad, sin venta, permiso revocable.
- El rationale ya existe y apunta a la política publicada.

### D2 — Data safety (coherente con la telemetría activa)

| Categoría | Recogido | Opcional | Compartido | En tránsito |
|---|---|---|---|---|
| App activity → App interactions (PostHog) | Sí | Sí (toggle, ON por defecto) | No | Cifrado |
| App info → Crash logs (Sentry) | Sí | Sí | No | Cifrado |
| App info → Diagnostics (Sentry) | Sí | Sí | No | Cifrado |
| Device or other IDs (distinct_id anónimo de PostHog) | Sí | Sí | No | Cifrado |
| Health and fitness | **No** — se lee y queda en el dispositivo | — | — | — |
| Location, Personal info, Financial info, Photos | **No** | — | — | — |

- Ads: **No**. IAP: **No** (hasta la Fase 129 M3).
- **Vía de eliminación de datos**: toggle OFF en Ajustes + desinstalar; y `gymlab@gymlab.dev` como contacto. Play exige declararla.

### D3 — Resto de App content

- Content rating (cuestionario IARC), público objetivo (no infantil), sin noticias, sin COVID, sin funciones financieras, sin apps gubernamentales.
- Si se activan anuncios en el futuro (Fase 129 M5), hay que volver a declarar.

## Cuenta de organización

- Google exige **número D-U-N-S** para cuentas de organización (verificar si aplica en el flujo actual; si no se tiene, el trámite tarda días y no depende del código).
- Datos de la organización: nombre legal, dirección, teléfono, sitio web (`gymlab.dev`) y email de contacto.
- **Ventaja concreta**: los requisitos de *closed testing* con 12 testers durante 14 días aplican a cuentas **personales** nuevas; una cuenta de organización queda exenta. Es un argumento fuerte para la conversión.

## Legal antes de enviar (Fase 126)

- La política ya nombra Sentry y PostHog y el toggle, pero conviene agregar: **región de tratamiento (UE)**, plazo de retención y que son encargados del tratamiento.
- Revisar que las secciones de AdMob e IAP sigan diciendo «versiones futuras» (hoy es cierto) para no declarar algo inactivo.
- Términos: no son requisito de Play, pero ya están publicados.

## Check-list de salida

- [ ] B1 keystore + `signingConfigs.release` + backup del keystore
- [ ] B1 decisión de Play App Signing
- [ ] B2 `bundleRelease` firmado, instalado desde testing interno
- [ ] B3 feature graphic, screenshots PNG, ficha ES/EN
- [ ] D1 Health apps declaration
- [ ] D2 Data safety con las filas de arriba
- [ ] D3 content rating + público objetivo
- [ ] Cuenta de organización verificada (D-U-N-S si aplica)
- [ ] Fase 126: precisión de la política (región, retención)
- [ ] `versionCode` incrementado si ya se subió un build
- [ ] Revisión final en dispositivo real: instalación desde Play, onboarding, entreno completo, export de backup

## Criterio de aceptación

La app se instala desde el track de producción en un dispositivo real, arranca, completa onboarding y un entreno, exporta un backup, y la ficha + declaraciones coinciden con lo que el código hace (telemetría opcional, sin anuncios, sin cuentas).

## Riesgos

- **Perder el keystore** = no más actualizaciones. Backup obligatorio antes de subir.
- **Data safety inexacta** es la causa más común de suspensión; con telemetría recién activada, la declaración hay que escribirla mirando el código, no de memoria.
- **Ficha solo en español** con la app arrancando en inglés: incoherente para revisión y para el usuario.
- **iOS**: el proyecto sigue siendo scaffolding; no entra en esta fase.

---

## Cómo retomar en otra sesión

**Estado al cerrar la sesión del 2026-10-22**: fase documentada, nada ejecutado todavía. Los commits de documentación están **locales, sin pushear** (el push dispara build; no hacía falta).

**El único paso que bloquea todo lo demás es el keystore, y lo tiene que ejecutar el owner** (la contraseña no debe pasar por el chat):

```powershell
cd "C:\Users\Yves De Faria\Desktop\ProyectoGymLab\gymlab-app"
keytool -genkeypair -v -keystore android\gymlab-release.jks -alias gymlab -keyalg RSA -keysize 2048 -validity 10000
```

Cuando exista `android/gymlab-release.jks`, la sesión siguiente debe:

1. Crear `android/keystore.properties` (gitignoreado) con `storeFile`, `storePassword`, `keyAlias`, `keyPassword`.
2. Cablear `signingConfigs.release` en `android/app/build.gradle` leyendo ese archivo, **con fallback a debug** si no existe (para no romper builds de desarrollo ni el emulador).
3. `./gradlew bundleRelease` → verificar que el `.aab` está firmado (`jarsigner -verify` o el output de Gradle).
4. Decidir y ejecutar **Play App Signing** (recomendado: Google guarda la clave de distribución; el `.jks` local pasa a ser *upload key*).
5. Subir el AAB al **testing interno** y verificar instalación desde Play en un dispositivo real.
6. Continuar con B3 (feature graphic + screenshots PNG + ficha ES/EN) y las declaraciones D1–D3 del check-list.

**Lo que necesito del owner para no bloquear**: confirmar la contraseña guardada en un gestor, la copia del `.jks` en dos lugares, y si tiene **D-U-N-S** (si no, iniciar el trámite porque tarda días).

**Dónde está la evidencia de lo ya verificado**: tabla «Verificado el 2026-10-22» de este documento, y `gymlab-app/PLAN.md` → Fase 130.

