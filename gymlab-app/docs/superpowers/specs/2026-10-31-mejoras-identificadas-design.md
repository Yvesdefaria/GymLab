# Mejoras identificadas — localización de días y ajustes de notificaciones · diseño

- **Fecha:** 2026-10-31
- **Rama:** `mejoras-identificadas` (worktree `.worktrees/mejoras-identificadas`; multisesión pedida por el usuario).
- **Origen:** `PLAN.md` §«Mejoras identificadas (sin fase asignada)» + pedido del usuario: «vamos a hacer este apartado: Mejoras identificadas (sin fase asignada), activa multisesion».
- **Decisiones del usuario (verbatim):** «Los dos pendientes»; «Solo Android ahora» para el botón de ajustes (iOS queda como follow-up documentado).
- **Runner:** `vitest` (`npm test`) + `npm run build`; verificación nativa en emulador Android; e2e con Playwright Python cuando el caso lo justifique.

---

## 1. Objetivo

Cerrar los dos pendientes abiertos del apartado:

1. **Nombres de día de rutina sin localizar.** La app arranca en inglés, pero varias superficies muestran el nombre del día tal como viene del seed en español.
2. **Notificaciones — permiso bloqueado sin salida.** Con el permiso denegado («no volver a preguntar») Ajustes solo muestra un aviso; falta un botón que abra los ajustes del sistema.

**Fuera de alcance:** cambiar el seed, bumpear `SEED_VERSION` o migrar datos; traducir nombres de rutinas propias (son texto del usuario); implementar el plugin en iOS (no se puede compilar ni probar en esta máquina); abrir ajustes de exactitud de alarmas u otros permisos.

---

## 2. Causa raíz (localización)

`localizeRoutineDay(day, lang)` y `localizeRoutine(routine, lang)` ya existen en `src/i18n/catalog` y cubren los 228 días del seed (`ROUTINE_DAYS_EN`, clave = `RoutineDay.id`) y los slugs de rutina (`ROUTINES_EN`). Hoy **solo** `RutinaDetailPage` los usa. Las demás superficies leen `day.name` / `routine.title` crudos.

Superficies afectadas:

| # | Superficie | Qué muestra hoy | Causa |
|---|---|---|---|
| A1 | Home (`HeroCard`) | `todayDay.name` crudo | `EntrenarPage` no localiza |
| A2 | Selector de día (`DaySelectorSheet`) | `day.name` crudo + título de rutina crudo | el componente no localiza; el caller tampoco |
| A3 | Selector de destino (`RoutineDestinationSheet`) | `day.name` crudo | el componente no localiza |
| A4 | Plan predefinido (`planRoutine`) | `PlannedDay.name` crudo | el dominio convierte el seed sin resolvedor |
| A5 | Clonar rutina predefinida (`handleClone`) | título y días crudos pasan a la rutina propia | `cloneRoutineDraft` recibe datos sin localizar |

**Consecuencia de A4:** el nombre localizado no solo se muestra en el preview del planificador/onboarding: también es lo que se persiste al guardar el plan como rutina propia (`usePlanNaming` ya documenta que «lo que se persiste queda localizado»).

---

## 3. Solución (localización)

No se toca el seed ni la base. Se cablea lo que ya existe:

- **A1 `HeroCard`:** recibe `todayDay: RoutineDay | null` (antes `{ name } | null`) y resuelve el nombre con `localizeRoutineDay(todayDay, lang)`. `lang = i18n.language as AppLanguage`, mismo patrón que `RutinaDetailPage`.
- **A2 `DaySelectorSheet`:** resuelve cada día con `localizeRoutineDay(day, lang)` dentro del componente (ya usa `useTranslation`). El caller pasa el título de rutina ya localizado con `localizeRoutine`.
- **A3 `RoutineDestinationSheet`:** resuelve cada día con `localizeRoutineDay(day, lang)` y el título de cada rutina con `localizeRoutine(routine, lang)` dentro del componente.
- **A4 `planRoutine`:** `PlanNaming` suma `predefinedDayName?: (day: RoutineDay) => string`. En la rama predefinida, `planRoutine` usa ese resolvedor y cae a `day.name` si no se provee (retrocompatible). `usePlanNaming` lo implementa con `localizeRoutineDay(day, lang).name`.
- **A5 `handleClone`:** localiza `routine` y `rDays` antes de `cloneRoutineDraft`, para que la copia propia nazca en el idioma de la UI.

**Invariante:** un día propio (id ≥ `CUSTOM_ID_BASE` o id sin entrada en `ROUTINE_DAYS_EN`) conserva su texto tal cual; nunca se traduce texto del usuario.

---

## 4. Solución (notificaciones)

### 4.1 Plugin nativo Android

Plugin local `GymLabSettingsPlugin` (`android/app/src/main/java/com/gymlab/app/GymLabSettingsPlugin.java`), mismo patrón que `GymLabWidgetPlugin`:

- `@CapacitorPlugin(name = "GymLabSettings")`.
- Método `openNotificationSettings()`:
  1. `Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)` + `Settings.EXTRA_APP_PACKAGE` (API 26+; `minSdkVersion = 26`).
  2. Si falla, fallback a `Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)` con `Uri.parse("package:<package>")`.
  3. Si ambos fallan, `call.reject(...)`.
- Se registra en `MainActivity.onCreate` **antes** de `super.onCreate`, junto a los otros plugins locales.

### 4.2 Wrapper JS

`src/data/appSettings.ts`:

- `canOpenSystemSettings(): boolean` → `Capacitor.getPlatform() === 'android'` (iOS queda oculto hasta su follow-up).
- `openNotificationSettings(): Promise<boolean>` → en web/otros devuelve `false` sin tocar el plugin; en Android invoca el plugin y devuelve `true`; si el plugin lanza, loguea con `logger.warn` y devuelve `false`.

### 4.3 UI y refresco

- `useNotifications` expone `refreshPermission` y re-chequea al volver a primer plano (`visibilitychange`), para que el aviso desaparezca si el usuario concedió el permiso en el sistema.
- `NotificationsSection`: con `permission === 'denied'` y `canOpenSystemSettings()` verdadero, debajo del aviso se muestra una fila con botón de 44 px (`Settings` de lucide) y `t('ajustes.notificacionesAbrirAjustes')`.
- En web el botón no se muestra: no hay ajustes del sistema que abrir.
- i18n: clave nueva en `es` (fuente tipada) y `en`, misma estructura.

---

## 5. i18n

| Clave | es | en |
|---|---|---|
| `ajustes.notificacionesAbrirAjustes` | `Abrir ajustes del sistema` | `Open system settings` |

No se agregan claves para los nombres de día: ya viven en `ROUTINE_DAYS_EN` / `ROUTINES_EN`.

---

## 6. Verificación

1. **TDD:** tests rojos antes de cada implementación.
   - Localización: `localizeRoutineDay` (seed, propio, es), `planRoutine` con `predefinedDayName` inyectado y sin él, `HeroCard` y `DaySelectorSheet` en inglés, `RoutineDestinationSheet` en inglés (hooks mockeados).
   - Notificaciones: `appSettings` (Android invoca, web no, error → `false`), `NotificationsSection` (denegado + Android muestra botón y lo invoca; web lo oculta).
2. **`npm run build`** limpio y **`npm test`** verde.
3. **Emulador Android (obligatorio, cambio nativo):**
   - `npm run android:sync` + `gradlew assembleDebug` + instalar.
   - Revocar `POST_NOTIFICATIONS` por adb, abrir Ajustes, tocar «Abrir ajustes del sistema» y comprobar que la pantalla de Ajustes de la app queda al frente (`dumpsys window`/`dumpsys activity`).
   - Criterio base: `root children > 0`, 0 `pageerror`.
4. **Review nativo** antes de cada commit (RDD encendido, switch del usuario).
5. **Commits work-unit** en la rama, sin push.

---

## 7. Riesgos

- **A4 toca dominio compartido** (`planRoutine`) que consumen planificador y onboarding: se cubre con tests del contrato (con y sin resolvedor) y se mantiene retrocompatible.
- **B es código nativo:** el build y la verificación en emulador son obligatorios; iOS no se toca.
- **Sin migración de datos:** las rutinas propias existentes conservan su texto; solo cambia lo que se muestra/persiste a partir de ahora.
