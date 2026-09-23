# F106 — Fotos de progreso: cámara, guardar en galería y comparador rediseñado

- **Fecha:** 2026-09-23
- **Estado:** Diseño aprobado por el usuario; pendiente revisión del spec antes de writing-plans
- **Origen:** PLAN.md Fase 106 (notas #10, #11) · Overlap: F79 (pendiente móvil real) + F93 #15 (cámara en móvil real + foto shareable)
- **Worktree:** directorio normal (`gymlab-app`), rama `main`, sin aislamiento (default del repo)

## Contexto (diagnóstico verificado 2026-09-23)

La página `/progreso-fotos` guarda fotos corporales (frontal/lateral/espalda) por fecha en Dexie como base64 JPEG (resize a 800 px, calidad 0.8). Tres problemas reales:

1. **La captura nunca usa la cámara**: `ProgressPhotosPage.tsx:96-98` usa 3 `<input type="file" accept="image/*">` sin `capture` ni plugin Camera → en Android abre el picker de Google, no la cámara. `AvatarPicker.tsx:97-105` (avatar del perfil) tiene el mismo patrón.
2. **El comparador es ilegible**: dos `<select>` de fechas + grid inline con fotos de `h-24` (~96 px) (`ProgressPhotosPage.tsx:102-130`).
3. **Las fotos quedan encerradas en la app**: no hay forma de sacarlas a la galería del teléfono.

## Decisiones aprobadas (usuario, 2026-09-23)

1. **Captura con el plugin oficial `@capacitor/camera`** (no `capture` en el input). Sheet propio "Tomar foto / Elegir de la galería" en nativo; en web directo al selector de archivos (el plugin cae al `<input type="file">` y el picker del sistema ya ofrece cámara/archivos).
2. **Permisos**: Android sin permisos nuevos (el plugin no requiere para captura; solo `saveToGallery: true` los pediría y no se usa). iOS: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription` en `Info.plist` (obligatorias). Android 11-12/Go: service de backport del Photo Picker (aditivo).
3. **Caso borde Android incluido**: si el sistema mata la app con la cámara abierta, recuperar la foto al reabrir (`appRestoredResult` del plugin App + ángulo pendiente persistido).
4. **Comparador**: se elimina el inline; el botón "Comparar" navega a página dedicada `/progreso-fotos/comparar`. Dos fechas globales (A y B): las 3 fotos de cada lado son de la misma fecha, nunca se mezcla foto por foto. Pestañas de ángulo (Frontal/Lateral/Espalda) + dos modos: "Dividida" (A|B 50/50) y "Alternar" (una foto a pantalla completa, toggle A↔B al tocar).
5. **Sin zoom en v1** → ver Mejoras futuras.
6. **Botón "Guardar en galería"** por fecha en el timeline: guarda las fotos existentes de esa fecha en un álbum "GymLab". Plugin `@capacitor-community/media` v9 (compatible Capacitor 8; Android sin permisos; iOS add-only; web = descarga directa).
7. **Android-first**: ningún cambio puede degradar Android; la web mantiene su comportamiento actual (fallback a input file).

## Contratos y piezas

### Nuevas dependencias

| Paquete | Versión | Rol | Permisos |
|---|---|---|---|
| `@capacitor/camera` | ^8 (Capacitor 8) | Captura cámara/galería nativa | Android: ninguno · iOS: 3 keys |
| `@capacitor-community/media` | ^9 (Capacitor 8) | Guardar en galería | Android: ninguno (solo álbum propio) · iOS: add-only |

### Código nuevo

- **`src/lib/photoCapture.ts`** — núcleo de captura:
  - `isNativePlatform()` — branch por `Capacitor.getPlatform() === 'web'`.
  - `capturePhoto(source: 'camera' | 'gallery'): Promise<string | null>` — nativo: `takePhoto({ quality: 90 })` / `chooseFromGallery({ quality: 90 })`, devuelve `webPath`; web: `null` (el caller usa el input file actual). `null` = cancelado; lanza en error real.
  - `isCaptureCancel(err)` — códigos `OS-PLUG-CAMR-0006/0013/0020`.
- **`src/components/photos/PhotoSourceSheet.tsx`** — sheet "Tomar foto / Elegir de la galería" (patrón visual del repo: 44 px, aria, cierre por overlay/Escape).
- **`src/lib/saveToGallery.ts`** — `savePhotosToGallery(dataUrls: string[]): Promise<{ saved: number; failed: number }>`; Android: asegura álbum "GymLab" (`createAlbum` + `getAlbums`, identifier cacheado); iOS: sin identifier (permiso add-only); web: descarga `<a download>`.
- **`src/pages/ProgressPhotosComparePage.tsx`** + **`src/pages/ProgressPhotosCompareRoute.tsx`** — página de comparación (reusa `useProgressPhotos`).
- **Hook de restauración** (`appRestoredResult`): escucha el plugin App; si hay foto restaurada + ángulo pendiente (`localStorage`), la procesa y guarda.

### Migraciones

- `ProgressPhotosPage.tsx`: botones de captura → sheet/plugin; `resizeImage` se generaliza a `resizeImage(src: string, maxPx)` (acepta `webPath` y dataURL; el camino web sigue leyendo el File); botón "Guardar en galería" por fecha en el timeline; se elimina el modo comparar inline.
- `AvatarPicker.tsx`: "Subir foto" → mismo flujo (resize 400 px para no rebotar contra el límite de 2 MB actual).
- `router.tsx`: ruta lazy `progreso-fotos/comparar` (multi-segmento → emulador obligatorio).
- `AndroidManifest.xml`: service de backport del Photo Picker.
- `ios/App/App/Info.plist`: 3 keys.
- i18n `es`/`en`: textos nuevos (sheet, comparador, guardar, errores).

### Detalles técnicos verificados (docs oficiales)

- Camera v8.1+: `CameraSource.Prompt` eliminado → UI propia. `takePhoto` → `MediaResult { webPath, thumbnail, uri, metadata }`; `chooseFromGallery` → `{ results: MediaResult[] }`. En web el plugin cae a `<input type="file">`.
- Media v9: `savePhoto({ path, albumIdentifier?, fileName? })`; `path` acepta data URI (`data:image/jpeg;base64,...`) — el formato que ya guardamos. Android: `albumIdentifier` **requerido** (álbum propio, sin permisos). iOS: sin identifier → permiso add-only. Web: no soportado. Errores: `accessDenied`, `argumentError`, `downloadError`, `filesystemError`.

### Página de comparación (UX)

- Header + back a `/progreso-fotos`.
- Selectores **Fecha A / Fecha B** (solo fechas con fotos).
- Tabs **Frontal | Lateral | Espalda** (por defecto: Frontal).
- Modo **Dividida** (por defecto): mitad izq A / mitad der B, imágenes grandes, etiqueta con la fecha de cada lado.
- Modo **Alternar**: una foto a pantalla completa; tocar alterna A↔B; badge indicando cuál se ve.
- Estados: ángulo sin foto → recuadro "Sin foto"; menos de 2 fechas → mensaje + link de vuelta.

## Paquetes de trabajo (3 — un commit cada uno)

### T1 — 106.1: captura con cámara + galería

- Instalar `@capacitor/camera` + `npx cap sync`.
- `photoCapture.ts` + `PhotoSourceSheet` + migración de `ProgressPhotosPage` y `AvatarPicker` + permisos + caso borde `appRestoredResult`.
- Verificación: unit (helpers, sin DOM) + e2e web (flujo input) + **emulador** (nativo: sheet → galería → foto visible).

### T2 — Guardar en galería

- Instalar `@capacitor-community/media` + `npx cap sync`.
- `saveToGallery.ts` + botón por fecha en el timeline + feedback + i18n.
- Verificación: unit (branch web vs nativo, errores) + **emulador** (guardar y verificar en la galería del sistema).

### T3 — 106.2: comparador rediseñado

- `ProgressPhotosComparePage` + ruta + eliminar inline + i18n.
- Verificación: e2e web (fechas, ángulos, modos) + **emulador** (ruta multi-segmento, pantalla negra check).

## Verificación (regla del repo, por tarea)

1. `npm run build` (typecheck REAL: `tsc -b`; nunca `npx tsc --noEmit`).
2. `npm test` (vitest) + `npm run lint`.
3. e2e web: `python tests/e2e/scripts/with_server.py tests/e2e/test_<fase>.py` (se crea el de la fase).
4. **Emulador obligatorio** (nativo/rutas): receta de AGENTS.md; criterio `root children > 0`, texto visible, 0 `pageerror`.
5. Review cycle Gentle AI antes de cada commit (candidato = diff del workspace). Commit sin push.

## Riesgos

- **Plugin community (`@capacitor-community/media`)**: dependencia de terceros → mitigado: org capacitor-community, v9 para Capacitor 8, activo (2026-09), Android sin permisos.
- **iOS sin verificación local** (no hay Mac): keys configuradas; prueba diferida.
- **`appRestoredResult` difícil de e2e**: se testea la lógica pura y queda documentado; el escenario real (muerte por RAM) no es reproducible fácil.
- **Cámara del emulador**: si el emulador no tiene cámara virtual usable, la captura se valida por galería y la cámara se prueba en teléfono físico (diferido, anotado).
- **Ruta multi-segmento**: riesgo conocido (17 pantallas negras) → emulador obligatorio incluyendo `/progreso-fotos/comparar`.

## Mejoras futuras (sugeridas, fuera de alcance)

1. **Zoom en el comparador**: tap para pantalla completa y pinch-zoom.
2. **Guardar el original full-res al capturar** (`saveToGallery: true` del plugin Camera) — hoy se guarda la versión de la app (800 px).
3. **Guardar por foto individual** (hoy: por fecha completa).
4. **Guardar en galería desde el comparador**.
5. Compartir foto con `@capacitor/share` (relacionado a F93 #15).

## Fuera de alcance

- Cambiar el pipeline de almacenamiento (Dexie base64, 800 px JPEG 0.8) o migrar fotos existentes.
- PWA Elements para cámara en web (se mantiene el fallback a input file).
- Deep-linking del estado del comparador en la URL.
- Rediseño de la timeline de fotos más allá del botón nuevo.
