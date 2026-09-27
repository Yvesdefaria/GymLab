# F105 — Compartir sesión: share nativo roto + tarjeta fuera del plano (diseño)

> Fecha: 2026-09-27 · Estado: aprobado — enfoque A aprobado por el usuario el 2026-09-27 · Fuente: ítems 105.1/105.2 de `PLAN.md` (notas #6/#7) + exploración de código de esta fase
> Antecede: F75 (export como imagen, archivada) y F95.2 (foto shareable en resumen y `WorkoutDetail`). El share nunca se verificó en nativo y el layout nunca se midió en pantallas chicas.

## Contexto

Los dos ítems del PLAN son el mismo síntoma desde dos pantallas. `SessionImageExport` (detalle de sesión desde el historial y resumen post-guardado) dibuja la tarjeta 1080×1080, la muestra en canvas y ofrece **Compartir**/**Descargar**, pero en la app nativa **Compartir no hace nada**; además, en el resumen la tarjeta **se sale del ancho** y el `AppShell` (`overflow-x-clip`) la recorta a los costados.

Diagnóstico (evidencia estática; la reproducción en emulador se hace en la verificación):

1. **Share muerto en nativo**: el WebView de Android no expone `navigator.share`. El fallback actual — `<a download>` con dataURL (`SessionImageExport.tsx:24-29,65-67`) — no dispara nada porque el WebView no tiene `DownloadListener`. No hay plugin de share instalado (`package.json`: media/camera/app/haptics/…, sin `@capacitor/share` ni `@capacitor/filesystem`).
2. **Share frágil en web**: no se consulta `navigator.canShare({files})`; si `share()` rechaza, el `catch` vacío (L73-75) no cae a descarga.
3. **Overflow**: el root de `SessionImageExport` no tiene ancho (L79) y vive en un padre `items-center` (`SessionSummaryView.tsx:101`) → el canvas `max-w-sm` (384 px) gobierna el ancho del bloque; a 375 px de viewport hay ~335 útiles → el bloque sobresale y `AppShell.tsx:48` (`overflow-x-clip`) lo recorta. `SwipeRow.tsx:31` (mismo resumen, stats) tiene el mismo patrón sin ancho — se mide y se arregla solo si la medición lo confirma.

## Decisiones aprobadas por el usuario (2026-09-27)

1. **Enfoque A — share nativo canónico**: sumar `@capacitor/share` + `@capacitor/filesystem` (v8, alineados a Capacitor 8). En nativo el PNG se escribe al cache y se abre la hoja de compartir de Android. En web: `navigator.canShare` + `navigator.share`, con fallback a descarga.
2. **"Descargar" en nativo pasa a "Guardar en galería"**, reutilizando el patrón existente `src/lib/saveToGallery.ts` (`Media.savePhoto`, plugin `@capacitor-community/media` ya instalado). En web el botón sigue siendo "Descargar".
3. **105.2 = mismo bug que 105.1**: el share del detalle (perfil → historial → entreno) y el del resumen post-sesión no funcionan por el mismo motivo. No se agrega ningún menú "…" nuevo.

## Contratos

### `src/lib/shareImage.ts` (nuevo)

- `type ShareTarget = 'native' | 'web' | 'download'`
- `pickShareTarget({ native, canShare }): ShareTarget` — **puro** (TDD): nativo → `native`; si no, `canShare` → `web`; si no → `download`.
- `canShareFiles(file): boolean` — guard sobre `navigator.canShare?.({ files })`.
- `shareCanvasNative(canvas, filename, dialogTitle)` — `toDataURL('image/png')` → base64 → `Filesystem.writeFile({ directory: Directory.Cache })` → `Share.share({ files: [uri], dialogTitle })`.
- `shareCanvasWeb(canvas, filename): Promise<boolean>` — blob → `File` → si `canShareFiles` → `navigator.share({ files })`; `false` si no hay soporte (para caer a descarga).
- Cancelación ≠ error: se traga solo `AbortError`/cancelación; en web un fallo real cae a descarga.

### `SessionImageExport.tsx`

- `handleShare` rutea por `pickShareTarget` (`Capacitor.isNativePlatform()` + `canShareFiles`).
- Botón secundario: web → `downloadCanvas` (como hoy); nativo → guardar en galería con el patrón de `saveToGallery`.
- **Layout**: root con `w-full` (L79). El canvas ya es `w-full max-w-sm self-center`; con el root acotado, el bloque se achica y centra.
- `SwipeRow.tsx`: medición a 360 px; fix mínimo **sin cambiar la API** solo si desborda.

### Config nativa

- Seguir el README versionado de `@capacitor/share` tras instalarlo: si exige `FileProvider`/`file_paths.xml` para compartir archivos en Android, agregar en `android/app/src/main/AndroidManifest.xml` + `res/xml/file_paths.xml` (ya tiene `cache-path`). Cambio nativo → verificación en emulador obligatoria.

### i18n (`src/i18n/locales/{es,en}/features.ts`)

- Nueva clave `share.saveGallery` ("Guardar en galería" / "Save to gallery"). `share.download` se mantiene para web.

### Tests

- **Unit (TDD, rojo→verde)**: `tests/unit/lib/shareImage.test.ts` — `pickShareTarget` (native / web / download) y `canShareFiles` con stubs.
- **e2e**: `tests/e2e/test_f105.py` —
  - A 360×800, en el resumen: la tarjeta y sus botones **caben** (bounding boxes dentro del viewport; **no** confiar en `scrollWidth` del documento, que `overflow-x-clip` enmascara).
  - En web sin share nativo: **Compartir cae a descarga** (evento `download`).
- Regresión: `test_f75.py` y `test_f95.py` verdes.

## Paquetes de trabajo (un commit cada uno)

- **WP1 — Share (nativo + web robusto)**: deps (`@capacitor/share`, `@capacitor/filesystem`), `shareImage.ts` + unit tests, refactor de `handleShare`, i18n `saveGallery`, botón secundario nativo/galería, config nativa del plugin si el README la pide. Gates: unit + suite + `npm run build`.
- **WP2 — Layout**: `w-full` en el root; medición a 360 px del resumen; fix de `SwipeRow` solo si aplica; `test_f105.py` de encaje. Gates: e2e F105 + regresión F75/F95.
- **WP3 — Verificación nativa (emulador)**: `npm run android:sync` → `assembleDebug` → instalar; CDP: `root.children > 0`, texto, **0 pageerror**; documentar `typeof navigator.share`/`canShare` del WebView; tocar Compartir y confirmar que aparece el chooser (evidencia por `adb shell dumpsys`); resumen a 360 sin recorte. La prueba final en teléfono físico queda para el usuario (F93 #15).
- **Cierre**: checkboxes de `PLAN.md` (105.1/105.2), `CHANGELOG.md`, resumen al usuario; merge + `worktree.ps1 close f105` cuando el usuario lo pida (otras sesiones idle).

Orden: WP1 → WP2 → WP3 → cierre.

## Riesgos

- **node_modules compartido (junction)**: `npm install` de las 2 deps impacta el node_modules físico del repo principal; las otras sesiones ganan los paquetes sin declararlos (inocuo). `package.json`/lock se commitean en la rama `f105`.
- **Chooser de Android no verificable al 100 % por CDP** (UI nativa): evidencia best-effort (`dumpsys`) + teléfono físico como paso humano.
- **Cancelación del share nativo**: si el plugin rechaza al cancelar, el catch debe distinguirlo; se comprueba en emulador.
- **Regresión del resumen**: los e2e F75/F95 y la medición a 360 cubren el layout.
- **`AppShell` queda como está** (`overflow-x-clip` es intencional); el fix es por ancho de contenido, no por clip.

## Fuera de alcance

- Menú "…" por fila en historial (no existía; 105.2 era el share roto).
- Compartir foto de progreso (nota ya asentada en `PLAN.md:377`).
- Prueba en teléfono físico (encolada en F93 #15).
- iOS (la rama nativa usa plugins oficiales; validación iOS en su momento).
