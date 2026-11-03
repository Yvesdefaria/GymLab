# Release 1.0.0 — validación física + firma

Objetivo: cerrar «Pendientes de release (validación física + firma)» de `gymlab-app/PLAN.md` sobre un APK release firmado construido desde `main`.
Rama: `main` (HEAD `7e0071dd`). Entrega: sin PR (operación local de release). Runner: `adb` + `apksigner`.

## Specs

- **S1 — Migración debug → release sin pérdida de datos** en el teléfono físico (RMX5085, Android 16): exportar backup JSON, desinstalar la build debug, instalar la release firmada, importar el backup. Fuente: `PLAN.md` L24 («migración única (~2 min, datos se conservan)»).
- **S2 — F73 «Frecuencia muscular vs objetivo»**: en Estadísticas → tab Entreno, la sección muestra barras por grupo y la alerta de desbalance (>20 %). Fuente: `PLAN.md` L19 + `COMPLETED.md` L171.
- **S3 — F84c «frescura real de Health Connect»**: en `/pasos`, el contador refleja pasos reales de Health Connect con la app abierta. Fuente: `PLAN.md` L19.
- **S4 — F93 #15 «foto en móvil real»**: en una sesión guardada, Compartir como imagen → plantilla Foto → capturar/elegir foto → preview correcta, hoja de compartir y guardado en galería. Fuente: `PLAN.md` L19 + `COMPLETED.md` L680.
- **S5 — F101 «teclado IME»**: con Gboard real, en el wizard de onboarding el campo enfocado queda visible, la CTA no queda tapada y el scroll funciona. Fuente: `PLAN.md` L19.
- **S6 — Sin regresiones en release**: la app monta con contenido propio, sin crashes, y las rutas multi-segmento navegan (el build release no es inspeccionable por CDP: verificación manual).

## Tasks

| ID | Tarea | Specs | Ruta | Estado |
|----|-------|-------|------|--------|
| T1 | Build release desde `main` + verificación de firma (v2, `CN=GymLab`) | S6 | inline | **hecho** — SHA-256 `FB6EA1F0…66021` |
| T2 | Backup + desinstalar debug + instalar release + importar | S1 | inline + usuario | **hecho** — 27 entrenos, 64 PRs, perfil restaurados |
| T3 | Smoke de arranque y rutas multi-segmento | S6 | inline | parcial — arranca sin crash, TabBar y rutas OK |
| T4 | F73 en Estadísticas → Entreno | S2 | inline | **hecho** — Pecho 1/2, banner y barras OK |
| T5 | `/pasos` con Health Connect real | S3 | inline | **parcial** — permisos OK y «Sistema de salud conectado»; el detalle por hora no puede dibujar (bug 136.3) |
| T6 | Card con foto + compartir/guardar | S4 | inline | **falla** — cámara abre y confirma, la foto no se aplica (136.4) |
| T7 | Wizard con Gboard real | S5 | inline | **hecho (proxy)** — Gboard en la búsqueda de biblioteca: campo visible, escritura y lista OK; el wizard no es replayable |
| T8 | Cierre: podar `PLAN.md`, CHANGELOG, commit | — | inline | en curso |
| T9 | **136.3** — agregación horaria nativa + revalidación | S3 | inline | **hecho** — el gráfico dibuja 12.683 (pico 9 h · 2.181) en release |

## Log

L1 — Pedido del usuario (2026-11-03), verbatim: «vamos a ir con este punto:Pendientes de release (validación física + firma) / voy a conectar mi dispositivo fisico, solo tienes permiso para ver cosas referentes a la app, si necesitas algo mas alla debes consultarmelo.»

L2 — Auditoría read-only (2026-11-03): **F84c** prácticamente cubierto — `d63b3620` verificó en teléfono real (realme Android 16) la lectura real de pasos de Health Connect con el proceso muerto (snapshot 10.731 → 10.742); falta solo el refresco en foreground del bridge web. **F73** no está obsoleto: `MuscleFrequencyView` sigue montado en `EntrenoTab` y se rediseñó en C1 (`6cb1940f`); solo falta verlo en pantalla real. **F93 #15** y **F101 (IME)** siguen pendientes de verdad. **Firma**: keystore (`android/gymlab-release.jks`, 2249 B), `keystore.properties`, `signingConfigs.release` con fallback a debug ya existen; falta solo la migración.

L3 — Estado del dispositivo (2026-11-03): `RMX5085` (realme, Android 16), autorizado. App instalada **debug** (`flags=[ DEBUGGABLE … ]`), `versionCode 1`, `versionName 1.0.0`, `lastUpdateTime 2026-11-02 21:27`, `firstInstallTime 2026-08-11 15:27` → hay datos de usuario desde agosto; el backup es obligatorio antes de desinstalar.

L4 — El APK del Escritorio (`GymLab-1.0.0-release.apk`, 112.926.791 B, 30-10 15:05) está **desactualizado**: `main` tiene 17 commits posteriores, incluido `d63b3620` (código nativo de permisos de salud + Ajustes → Permisos) y la Fase 134. La validación se hace sobre un release reconstruido desde `7e0071dd`.

L5 — Ejecución (2026-11-03):
- **T1**: `npm run android:sync` 0 → `assembleRelease` 0 (45 s). APK 112.935.853 B, firma **v2** `CN=GymLab`, SHA-256 `FB6EA1F08988DBBCA3E02A7EBF499DC568791A54888C07917EF358C6BA266021`. El **AAB quedó viejo** (29-10): si se sube a Play hay que correr `bundleRelease`.
- **T2**: backup exportado por el usuario (`gymlab-backup-2026-11-03.json`, 774.697 B, schema 18, 18 tablas con datos) + copia propia desde el cache por `run-as` y validada con `ConvertFrom-Json`. `adb uninstall` → `adb install` release: `flags=[ HAS_CODE … ]` (sin `DEBUGGABLE`). Import OK: home con racha, «último entreno hace 2 días» y 27 entrenos; Estadísticas con 27 totales.
- **T4 (F73, validado)**: con datos reales, Pecho 1/2 con barra al 50 % y ⚠; el resto `0/N` porque el único entreno de la semana fue el domingo 1 (13 series, solo pecho). Banner «Grupos musculares con desbalance (>20 %)» y filas hairline correctos. La semántica de ventana queda como hallazgo en `PLAN.md` **Fase 136.1**.
- **T5 (en curso)**: tras reinstalar, el permiso de Health Connect se pierde (es por paquete). El usuario lo volvió a conceder: `READ_STEPS` y `READ_HEALTH_DATA_IN_BACKGROUND` `granted=true` con `USER_SET`; `/pasos` pasa a «● Sistema de salud conectado». El 12.682 del día proviene del backup (`dailySteps.source = phone`, 3 últimas filas `phone`); falta la captura del detalle por hora ya conectado.
- **Descartado (no es bug)**: el bloque de cuenta ausente en `/mas` era scroll — `AppHeader` queda fijo y la fila de cuenta se va con el contenido.
- **Hallazgo de copy** → `PLAN.md` **Fase 136.2**: el vacío del detalle por hora dice «El alta manual guarda solo el total del día» aunque la fila tenga `source: phone`.

L6 — Resultado de las validaciones físicas (2026-11-03):
- **S3 (F84c) — parcial**: con `READ_STEPS` y `READ_HEALTH_DATA_IN_BACKGROUND` concedidos, `/pasos` muestra «● Sistema de salud conectado». Pero el bloque «HOY · por hora» sigue en estado «sin permiso» con botón Conectar. **Causa raíz confirmada en el plugin**: `capacitor-health` solo soporta `bucket: "day"` y `fetchStepsByHour` pide `bucket: "hour"` (`HealthPlugin.kt:375-378`), así que la promesa se rechaza siempre y el hook la mapea a `available: false`. Anotado como **136.3**. El sync diario sí funciona (el 12.682 vino de Health Connect, `source: phone`).
- **S4 (F93 #15) — falla**: el flujo nativo abre la cámara del OEM, la foto se toma y se confirma, y al volver la app **no aplica nada** (chip en «Clásica», sin preview, sin mensaje). Repetido una vez. El `catch` de `handleSheetSelect` es silencioso y `resizeImageToDataUrl` no tiene `onerror` ni timeout → anotado como **136.4** con hipótesis (`webPath` null vs imagen que no carga) y fix mínimo.
- **S5 (F101, IME) — pass (proxy)**: con Gboard real en la búsqueda de `/ejercicios`, el campo queda visible sobre el teclado, la escritura a ritmo humano entra completa («pres»), el filtro responde (98 de 873) y la lista se navega con el teclado abierto. El wizard de onboarding no es replayable, así que la verificación se hizo sobre un input equivalente.
  - Observación no concluyente: un `adb input text` en ráfaga (5 chars sin delay) dejó solo el último carácter; a 700 ms/char entra completo. No se registra como bug.
- **Hallazgo menor** → **136.5**: con búsqueda activa en `/ejercicios` aparece dos veces seguidas el encabezado «A · 3 EJERCICIOS»; falta aislar si es sticky + sección o doble render.
- **Sin regresiones de release (S6)**: arranque sin crash, TabBar, sesión guardada, Perfil, Calendario, Estadísticas y Biblioteca operativos. El header de `AppHeader` es fijo (motivo por el que el héroe de cuenta «desaparece» al scrollear: no es bug).
- **Pendiente al cierre**: corregir 136.3 y 136.4 antes de dar la release por validada; regenerar el **AAB** (`bundleRelease`) cuando se vaya a Play; la build release no es inspeccionable por CDP, así que los arreglos necesitan build debug para diagnóstico y luego release para la captura final.
