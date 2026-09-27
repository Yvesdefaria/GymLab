# F93 #15 — Card de sesión con foto de fondo (share estilo Strava)

- **Fecha:** 2026-09-27
- **Estado:** Diseño aprobado por el usuario (mockups D2 + V1, 2026-09-27); pendiente revisión del spec antes de writing-plans
- **Origen:** F93 #15 — **reencuadrado por el usuario**: el entregable es el **card de sesión con foto de fondo**, no «compartir la foto de progreso» como decía la nota original del PLAN
- **Overlap:** F75/F95.2 (`SessionImageExport` + plantillas) · F106 (`PhotoSourceSheet`, `photoCapture`, `saveToGallery`) · F105.1 (el «compartir» que no aparece en redes — este cambio ataca su causa raíz: el mismo botón)
- **Worktree:** `.worktrees\f93-15` (rama `f93-15`) — multisesión pedida por el usuario

## Contexto (diagnóstico verificado 2026-09-27)

1. **El card de sesión existe** (F75 + plantillas F95.2): `SessionImageExport` dibuja un canvas 1080×1080 (3 plantillas: Clásica/Hero/Compacta) y ofrece Descargar/Compartir. Montado en `SessionSummaryView` y `WorkoutDetail`.
2. **No existe opción de foto**: las plantillas son gráficas puras; no hay forma de usar una imagen propia como fondo.
3. **El «Compartir» está roto en el teléfono**: usa `navigator.share`, que **no existe en el WebView de Android** (Chromium bug 765923; confirmado por Capacitor). En Android el botón cae a descarga silenciosa; en iOS WebView el soporte es parcial. Por eso «no aparece para compartir en redes» (F105.1). No hay plugins `@capacitor/share`/`filesystem` ni helper de share compartido; la lógica está inline en el componente.
4. **La captura de fotos ya está resuelta** (F106): `PhotoSourceSheet` (Tomar/Elegir) + `photoCapture.ts` (`capturePhoto`, `resizeImageToDataUrl`, `isNativePlatform`, `isCaptureCancel`) + `savePhotosToGallery` (álbum «GymLab»; web = descarga).

## Decisiones aprobadas (usuario, 2026-09-27)

| # | Decisión |
|---|---|
| D1 | Alcance: **card de sesión** (compartir un entreno) con **foto de fondo**; las fotos de progreso **no** son fuente por ahora; sin antes/después |
| D2 | Fuente de la foto: **galería/cámara del teléfono**, con el sheet existente (nativo) y selector de archivos (web) |
| D3 | Diseño del card: **hero central** (mockup D2) — fecha, nombre, duración gigante, línea volumen·PRs, marca GYMLAB **protagonista en dorado** (`#D9B384`, `letter-spacing .36em`) |
| D4 | Integración UI: **«Foto» como chip adicional de Plantilla**, primero en la fila `[Foto][Clásica][Hero][Compacta]` (mockup V1) + atajo «Cambiar foto · Quitar foto» cuando el modo foto está activo |
| D5 | **Share nativo real**: sumar `@capacitor/share` + `@capacitor/filesystem` (oficiales, v8); en web todo igual que hoy |
| D6 | **Descargar en nativo** guarda el card en la galería (reusa `savePhotosToGallery` de F106) con confirmación breve; en web, descarga del navegador como hoy |

## El card D2 (contrato visual)

Canvas 1080×1080 PNG. Fondo: foto con **recorte cover centrado** al cuadrado. Sin foto: las 3 plantillas actuales no cambian (regresión cero).

| Elemento | Valor (a 1080 px; mockup validado a ~320 px, escala ×3.375) |
|---|---|
| Degradado | lineal a bottom: `rgba(18,18,20,.30)` 0% → `0` 36% → `rgba(18,18,20,.50)` 66% → `rgba(18,18,20,.95)` 100% |
| Foto | cover-crop centrado; si la imagen es menor se escala igual (suavidad aceptada) |
| Fecha | `#D9B384`, bold, ~23 px, mayúsculas, `letter-spacing ~.20em`; formato localizado del repo (`formatDate`, es: «vie 26 sep 2026») |
| Nombre | `#FFFFFF`, bold, ~50 px; fallback «Entreno libre» (ya existe `resolveWorkoutName`) |
| Duración | `#FFFFFF`, extrabold, ~104 px — el número héroe (`data.duration` ya calculado) |
| Línea stats | `{volumen} de volumen` + ` · {N} PRs` (solo si N > 0; plural i18n) — ~28 px; segmento PRs en `#D9B384` extrabold; volumen = `data.volume` ya formateado |
| Marca | `GYMLAB` en `#D9B384`, extrabold, ~34 px, `letter-spacing .36em`, centrada abajo |
| Composición | Todo el bloque centrado, pegado al pie (~47 px reales) |

## Contratos y piezas

### Nuevas dependencias

| Paquete | Versión | Rol | Permisos |
|---|---|---|---|
| `@capacitor/share` | ^8 (Capacitor 8) | Hoja de compartir nativa | ninguno |
| `@capacitor/filesystem` | ^8 (Capacitor 8) | PNG temporal en `Directory.Cache` para compartir `files: [uri]` | ninguno |

### Código nuevo

- **`src/domain/sessionPhotoCard.ts`** (puro, TDD unit): recorte cover (`computeCoverCrop(srcW, srcH, size) → { sx, sy, sw, sh }`) y armado de la línea de stats (segmento PRs condicional + plural). Sin React/Dexie.
- **`src/components/session/sessionPhotoTemplate.ts`**: `drawPhotoHero(ctx, data, labels, photo)` — renderer canvas del D2 (patrón `sessionTemplates.ts`; comparte paleta/fuente).
- **`src/lib/shareImage.ts`**: helper único de share. Nativo: `Filesystem.writeFile(Cache, base64)` → `Share.share({ files: [uri] })`; web: `navigator.share({ files })` si existe, si no `<a download>`; cancelación → silencio; error real → resuelve `'failed'` sin crash. Reemplaza la lógica inline de `SessionImageExport` y arregla el camino nativo (F105.1).

### Migraciones

- **`src/components/session/SessionImageExport.tsx`**: estado de foto (`dataUrl | null`), modo `photo` (chip con `data-template="photo"`, ícono lucide `Image`), `PhotoSourceSheet`/input file, atajo «Cambiar/Quitar foto», integración con el renderer, `handleShare`/`handleDownload` delegando al helper, toast `role="status"` al guardar a galería (patrón `ProgressPhotosPage`).
- **i18n `es`/`en`** (`features.ts`): `share.photo`, `share.changePhoto`, `share.removePhoto`, `share.savedToGallery`, `share.saveError` (+ plural PRs).
- **Native projects**: `@capacitor/share@8` + `@capacitor/filesystem@8` + `npx cap sync` (Android; iOS según proyecto).

### Detalles técnicos verificados

- `navigator.share` **no existe** en WebView Android (Chromium 765923; Capacitor #3213) → el plugin es obligatorio para compartir de verdad en el teléfono.
- `Share.share({ files })` exige **URIs `file://`** → grabar primero el PNG con `Filesystem.writeFile` en `Cache` (doc oficial + capacitor-plugins#2459).
- `PhotoSourceSheet({ onSelect(source), onClose })`; `capturePhoto(source) → webPath | null | throws`; `resizeImageToDataUrl(src, maxPx)` acepta dataURL y `webPath`; `isCaptureCancel(err)` cubre códigos reales.
- Canvas: `ctx.letterSpacing` (Chromium 99+) con feature-detect y fallback por carácter; fuente `system-ui, sans-serif`; paleta compartida (`BG #121214`, `GOLD #D9B384`, `CREAM #FDDDB4`, `MUTED #8A8A8A`).
- La foto es **transitoria**: vive en memoria de la pantalla; no se persiste. Si el sistema mata la app durante la cámara (caso F106), esta foto no se recupera (limitación aceptada).

## Paquetes de trabajo (2 — un commit cada uno)

### T1 — Card D2 con foto + UI V1 (web completo)

1. Módulo puro + unit tests (TDD rojo→verde): recorte cover y línea de stats.
2. Renderer `drawPhotoHero` + integración en `SessionImageExport` (estado foto, chip, sheet/input, atajo, preview en vivo).
3. i18n es/en.
4. e2e web nuevo `tests/e2e/test_f93_15_card_foto.py`: chip Foto → input file (web) → preview con foto (`data-template="photo"`, canvas no vacío) → «Cambiar»/«Quitar» → Descargar.
5. Verificación: `npm run build`, `npm test`, `npm run lint`, e2e nuevo + regresión `test_f75.py`/`test_f95.py`.
6. Review RDD del candidato + commit `feat: card de sesión con foto de fondo estilo Strava (F93 #15)` + CHANGELOG.

### T2 — Share nativo real + guardar a galería

1. Instalar `@capacitor/share` + `@capacitor/filesystem` + `cap sync`.
2. `shareImage.ts` + migración de `handleShare`/`handleDownload` + toast de guardado + i18n.
3. Verificación: build/test/lint + e2e regresión + **emulador** (picker nativo → card D2; hoja de compartir real operativa; Descargar → archivo en galería; 0 `pageerror`).
4. Review RDD + commit `feat: compartir nativo real y guardado del card en galería (F93 #15)` + CHANGELOG + PLAN.md.

## Verificación (regla del repo, por tarea)

1. `npm run build` (typecheck REAL: `tsc -b`; **nunca** `npx tsc --noEmit`).
2. `npm test` + `npm run lint`.
3. e2e: `python tests/e2e/scripts/with_server.py tests/e2e/test_<fase>.py`.
4. **Emulador obligatorio** (plugins nuevos): receta de `AGENTS.md` (Pixel_10; `root children > 0`, texto, 0 `pageerror`) + hoja de compartir y galería.
5. Review cycle Gentle AI **antes de cada commit** (candidato = diff del workspace); commit sin push.
6. CHANGELOG y PLAN.md al cierre de la fase (F93 #15 marcado según lo entregado).

## Riesgos

- **Memoria del canvas**: 1080² + foto decodificada; mitigado con resize a ~1080 antes de dibujar.
- **`letterSpacing` en canvas**: soporte variable según WebView; fallback por carácter.
- **Solape con F105** (mismo componente, otra fase/worktree): merge con cuidado al cerrar; este cambio arregla la causa raíz de F105.1, no la fase entera.
- **iOS sin Mac**: mismas limitaciones que F106; se configura por doc y se difiere la prueba física.
- **Validación en teléfono físico** (F93 #15, primera nota): sigue encolada como gate de release; no bloquea este entregable.

## Fuera de alcance (documentado)

- Fotos de progreso como fuente; cards antes/después; más plantillas con foto; zoom/ajustes de encuadre; validación física; el resto de F105.
