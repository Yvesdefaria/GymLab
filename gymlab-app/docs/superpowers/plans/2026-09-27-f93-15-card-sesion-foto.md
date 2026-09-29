# F93 #15 — Card de sesión con foto de fondo estilo Strava — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la tarjeta de sesión (`SessionImageExport`) pueda usar una foto propia como fondo (card D2, 1080×1080), y que Compartir/Descargar funcionen de verdad en Android: hoja de compartir nativa real y guardado del card en la galería.

**Architecture:** Modo foto como estado de UI del componente existente (chip adicional primero en la fila, la foto vive en memoria de la pantalla), con dos piezas nuevas y aisladas: `src/domain/sessionPhotoCard.ts` (puro: recorte cover + línea de stats, TDD unit) y `src/components/session/sessionPhotoTemplate.ts` (renderer canvas D2, patrón `sessionTemplates.ts`). T2 reemplaza la lógica inline de share por `src/lib/shareImage.ts` (plugins `@capacitor/share` + `@capacitor/filesystem` en nativo; Web Share API/descarga en web) y reusa `savePhotosToGallery` (F106) para el guardado en galería en Android. Sin foto, las 3 plantillas actuales no cambian (regresión cero).

**Tech Stack:** Vite 8 + React 19 + TypeScript 6 + Tailwind v4, Dexie, react-i18next, Vitest 4 (env node, sin jsdom: canvas/componentes no se unit-testean), Playwright (librería Python), Capacitor 8 (Android + iOS), lucide-react.

**Spec:** `docs/superpowers/specs/2026-09-27-f93-15-card-sesion-foto-design.md`

---

## ESTADO DE AVANCE

- [x] Task 1 (F93 #15 · T1) — card D2 + UI V1 (web completo) — commit `651f350`, review aprobado (`review-7fe52e973f2b281a`)
- [x] Task 2 (F93 #15 · T2) — **SUPERSEDED por F105** (share nativo + `@capacitor/share`/`@capacitor/filesystem` ya en main: `51a6a87`/`9d83baa`); integrado por rebase, sin duplicación

(El orquestador actualiza esta sección al cerrar cada tarea, en el mismo commit de la tarea.)

## Global Constraints

Copiadas de la spec, del plan F106 y de `AGENTS.md`. Aplican a **todas** las tareas.

- **Worktree**: todo corre con cwd en `.worktrees\f93-15\gymlab-app`: dev server, tests, build y review salen de acá.
- **Android-first**: ningún cambio puede degradar Android; la web mantiene su comportamiento (input file para elegir foto; descarga del navegador).
- UI en es-ES; **paridad es/en obligatoria** (`en` está tipado como `EsSchema` en `src/i18n/locales/en/index.ts`: una key que falte en inglés rompe `npm run build`). Las claves nuevas de `share.*` van en ambos idiomas.
- Touch targets ≥ 44×44 px; gap ≥ 8 px; `touch-action: manipulation`; respetar `prefers-reduced-motion` (esta feature no agrega animaciones); sin scrollbars visibles.
- **Contrato visual D2 congelado**: los valores de la spec (degradado, tamaños, colores, `letter-spacing`) se copian exactos; no “mejorar” el diseño. Las separaciones intermedias que la spec no fija quedan como constantes con nombre en el renderer (ver Gotchas).
- **Regresión cero sin foto**: sin foto elegida, las 3 plantillas actuales y la plantilla por defecto (`classic`) no cambian; el canvas sigue siendo 1080×1080.
- `npm run build` es el typecheck REAL (`tsc -b`); **nunca** usar `npx tsc --noEmit` como evidencia (con `tsconfig.json` raíz `"files": []` no chequea nada y da falso verde).
- `npm test` y `npm run lint` verdes antes de cada commit.
- **El implementador NO commitea**: no ejecutar `git add`/`git commit`/`git stash`/`git checkout` ni nada que mute git. El orquestador corre el review cycle (Gentle AI, receipt-driven) sobre el diff del workspace y commitea. El workspace debe quedar con SOLO los cambios de la tarea.
- Un commit por tarea, mensaje convencional **sin acentos**, **sin push**.
- **Solo 2 dependencias nuevas aprobadas** (y solo en T2): `@capacitor/share@^8` + `@capacitor/filesystem@^8`. Prohibido sumar cualquier otra.
- **`cap sync`**: `assets/public`, `capacitor.config.json` y `capacitor.plugins.json` están gitignored; `android/capacitor.settings.gradle` y `android/app/capacitor.build.gradle` SÍ se commitean (van en el diff de T2).
- iOS: estos dos plugins no requieren claves de `Info.plist`; no ejecutar `cap sync ios` (no hay Mac; la validación física de F93 #15 sigue encolada como gate de release).
- La foto es **transitoria** (vive en memoria de la pantalla); si Android mata la app con la cámara abierta, esta foto no se recupera (limitación aceptada en la spec).

### Receta de emulador (obligatoria en T2 — plugins nuevos)

El emulador `emulator-5554` (API 37) suele estar conectado; si no está encendido: `& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Pixel_10`. `adb` **no está en PATH**: usar la ruta completa. Correr desde `gymlab-app`:

```powershell
# 0) adb no está en PATH: definir la ruta completa
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
# 1) copiar el build a android/ (corre `npm run build` + `npx cap sync android`)
npm run android:sync
# 2) compilar el APK (JAVA_HOME al JBR de Android Studio; usar timeout largo, 600000 ms)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\android\gradlew.bat -p .\android assembleDebug
# 3) instalar y arrancar
& $adb install -r android\app\build\outputs\apk\debug\app-debug.apk
& $adb shell am force-stop com.gymlab.app
& $adb shell am start -n com.gymlab.app/.MainActivity
Start-Sleep -Seconds 6
$appPid = (& $adb shell pidof com.gymlab.app).Trim()
& $adb forward --remove-all
& $adb forward tcp:9222 localabstract:webview_devtools_remote_$appPid
```

**Criterio de aceptación**: `document.getElementById('root').children.length > 0`, body con texto y **0 `pageerror`**. Si `root children === 0` es pantalla negra: la app no montó, aunque el e2e web diga verde (caso real del `base: './'`). La **hoja de compartir nativa NO es automatizable por CDP** (es un chooser del sistema): se verifica con **chequeo manual visible** en el emulador y se reporta el resultado exacto. La galería SÍ se verifica por `adb shell content query` (patrón F106):

```powershell
& $adb shell content query --uri content://media/external/images/media --projection _display_name --where "_display_name LIKE 'gymlab%'"
```

Expected: al menos una fila `gymlab-...png` (el card es PNG). Si el `content query` no está permitido o la cuota falla, reportarlo como no verificable (anotar el motivo, no inventar éxito).

---

## Gotchas técnicos y regresiones (ya verificados — no repetir errores)

1. **`import { Image }` de lucide-react pisa el constructor global `Image`** que se usa para decodificar la foto (`new Image()`). Importar siempre como `Image as ImageIcon`.
2. **`data.date` es `localDate` `'YYYY-MM-DD'`**: `new Date('2026-09-26')` parsea como UTC y en zonas UTC− (ej. Argentina) muestra el día anterior. Formatear con `` `${data.date}T12:00:00` `` (mismo truco que `formatDayShort` en `src/lib/intl.ts`).
3. **`ctx.letterSpacing`** existe desde Chromium 99 pero no en todos los WebViews: feature-detect (`'letterSpacing' in ctx`) + **fallback por carácter** centrado manualmente; resetear `letterSpacing = '0px'` después de cada texto espaciado.
4. **`resizeImageToDataUrl(src, 1080)` devuelve JPEG**; el PNG del card sale del propio canvas (`canvas.toDataURL('image/png')`), tanto para descargar como para compartir.
5. **`navigator.share` no existe en el WebView de Android** (Chromium 765923; Capacitor #3213): por eso el plugin `@capacitor/share` es obligatorio para compartir de verdad (causa raíz de F105.1).
6. **`Share.share({ files })` exige URIs `file://`**: grabar el PNG primero con `Filesystem.writeFile` en `Directory.Cache`.
7. **El `.jpg` hardcodeado del branch web de `saveToGallery.ts`** (`a.download` con `${fileName}.jpg`): no afecta al card porque en web se sigue usando `downloadCanvas` (PNG) y el branch web de `savePhotosToGallery` no se usa para el card.
8. **`tests/e2e/test_f95.py` cuenta chips**: hoy exige exactamente 3 (`chips.count() != 3`). Con el chip Foto pasan a ser 4 → hay que actualizar la aserción (el diseño lo ordena). `data-photo-template` sigue siendo `classic` por defecto; `[data-template="hero"]` sigue existiendo.
9. **`tests/e2e/test_f75.py`**: exige `canvas[role="img"]` + botón Descargar, y que **todos** los botones midan ≥ 40 px de alto. Los chips/atajos nuevos llevan `min-h-[44px]` para no romperlo.
10. **Memoria del canvas**: 1080² + foto decodificada; mitigado con resize a ~1080 **antes** de decodificar/dibujar.
11. **Canvas y componentes no se unit-testean** en este repo (Vitest corre en env node sin jsdom, `vite.config.ts` solo incluye `tests/unit/**`): la verificación de UI es el e2e + el smoke de emulador.
12. **Cancelación del share en Android**: si descartar el chooser resuelve la promesa (en vez de rechazarla), `shareImage` devuelve `'shared'` y no hay nada que silenciar; los rechazos de cancelación (iOS/Web Share) sí caen en `'cancelled'` y están cubiertos por los unit tests. El smoke manual del emulador debe anotar qué hace el chooser al descartarse (no debe quedar ningún error visible).

---

## File Structure

| Archivo | Tarea | Responsabilidad |
|---|---|---|
| `src/domain/sessionPhotoCard.ts` | T1 | Puro: `computeCoverCrop` + `buildStatsLine` (stats con PRs condicional y plural inyectado) |
| `tests/unit/domain/sessionPhotoCard.test.ts` | T1 | Tests unitarios del contrato puro (TDD rojo→verde) |
| `src/components/session/sessionPhotoTemplate.ts` | T1 | Renderer canvas D2 (`drawPhotoHero`): cover + degradado + bloque hero |
| `src/components/session/sessionTemplates.ts` | T1 | Solo pasa a `export` `volumeText` y `fitText` (reuso del renderer D2) |
| `src/components/session/SessionImageExport.tsx` | T1, T2 | Estado/modo foto, chip, sheet/input, atajo, preview (T1); share/download delegados + toast (T2) |
| `src/i18n/locales/es/features.ts` + `en/features.ts` | T1, T2 | Claves `share.*` nuevas (paridad es/en) |
| `tests/e2e/test_f93_15_card_foto.py` | T1 | e2e web: chip Foto → input file → preview → cambiar/quitar → descarga |
| `tests/e2e/test_f95.py` | T1 | Ajuste de regresión: 3 → 4 chips (Foto primero) |
| `src/lib/shareImage.ts` | T2 | Helper único de share (nativo Cache+Share; web Share API/descarga; nunca lanza) |
| `tests/unit/lib/shareImage.test.ts` | T2 | Tests unitarios de las ramas nativo/web/cancelación/error |
| `package.json`, `package-lock.json`, `android/capacitor.settings.gradle`, `android/app/capacitor.build.gradle` | T2 | Deps nuevas + `cap sync` |
| `CHANGELOG.md`, `PLAN.md`, este plan | T1, T2 | Docs de cierre de cada tarea |
| `tests/e2e/test_f75.py` | — | Solo regresión (no se modifica) |

---

### Task 1 (T1) — Card D2 + UI V1 (web completo)

**Files:**
- Create: `src/domain/sessionPhotoCard.ts`
- Create: `src/components/session/sessionPhotoTemplate.ts`
- Create: `tests/unit/domain/sessionPhotoCard.test.ts`
- Create: `tests/e2e/test_f93_15_card_foto.py`
- Modify: `src/components/session/sessionTemplates.ts:34,41` (`volumeText` y `fitText` → `export`)
- Modify: `src/components/session/SessionImageExport.tsx` (migración completa)
- Modify: `src/i18n/locales/es/features.ts` + `src/i18n/locales/en/features.ts` (sección `share`)
- Modify: `tests/e2e/test_f95.py:227-229` (chips 3 → 4)
- Modify: `CHANGELOG.md`, este plan (estado)

**Interfaces (Produces — los consumen T2 y los e2e):**
- `type CoverCrop = { sx: number; sy: number; sw: number; sh: number }`
- `computeCoverCrop(srcW: number, srcH: number, size: number): CoverCrop` — recorte cuadrado centrado (cover); `size` se valida como destino (`size <= 0` → recorte vacío)
- `type StatsLineParts = { volume: string; prs: string | null }`
- `type StatsLineLabels = { volume: string; prOne: string; prMany: string }`
- `buildStatsLine(volumeText: string, prCount: number, labels: StatsLineLabels): StatsLineParts` — `prs` es `null` si `prCount <= 0`; singular con 1
- `type PhotoCanvasLabels = { date: string; volume: string; prs: string | null }`
- `drawPhotoHero(ctx: CanvasRenderingContext2D, data: SessionImageData, labels: PhotoCanvasLabels, photo: HTMLImageElement | null): void`
- `volumeText(data: SessionImageData, units: Units): string` y `fitText(ctx, text, maxWidth): string` exportados desde `sessionTemplates.ts`
- UI: chip `data-template="photo"` (primero), contenedor `data-photo-template="photo"` en modo foto, input oculto `data-photo-input`

**Interfaces (Consumes — ya existen):**
- `capturePhoto(source: PhotoSource): Promise<string | null>`, `isNativePlatform()`, `readFileAsDataUrl(file)`, `resizeImageToDataUrl(src, maxPx)` (`src/lib/photoCapture.ts`)
- `PhotoSourceSheet({ onSelect, onClose })` y `type PhotoSource` (`src/components/photos/PhotoSourceSheet.tsx` / `photoCapture.ts`)
- `SessionImageData`, `SESSION_IMAGE_TEMPLATES`, `DEFAULT_PHOTO_TEMPLATE`, `PhotoTemplateId`, `renderSessionCanvas`, `formatDate`

- [ ] **Step 1: Escribir los tests que fallan** (`tests/unit/domain/sessionPhotoCard.test.ts`)

```ts
// Tests del contrato puro del card con foto (F93 #15): recorte cover y línea de stats.
import { describe, expect, it } from 'vitest'
import { buildStatsLine, computeCoverCrop } from '@/domain/sessionPhotoCard'

describe('computeCoverCrop', () => {
  it('imagen cuadrada: recorte completo sin desplazamiento', () => {
    expect(computeCoverCrop(1080, 1080, 1080)).toEqual({ sx: 0, sy: 0, sw: 1080, sh: 1080 })
  })

  it('imagen apaisada: recorta los costados y centra', () => {
    expect(computeCoverCrop(4000, 3000, 1080)).toEqual({ sx: 500, sy: 0, sw: 3000, sh: 3000 })
  })

  it('imagen vertical: recorta arriba/abajo y centra', () => {
    expect(computeCoverCrop(3000, 4000, 1080)).toEqual({ sx: 0, sy: 500, sw: 3000, sh: 3000 })
  })

  it('imagen menor al destino: igual se recorta a cuadrado (el escalado lo hace el canvas)', () => {
    expect(computeCoverCrop(800, 600, 1080)).toEqual({ sx: 100, sy: 0, sw: 600, sh: 600 })
  })

  it('dimensiones o destino inválidos: recorte vacío', () => {
    expect(computeCoverCrop(0, 100, 1080)).toEqual({ sx: 0, sy: 0, sw: 0, sh: 0 })
    expect(computeCoverCrop(100, -5, 1080)).toEqual({ sx: 0, sy: 0, sw: 0, sh: 0 })
    expect(computeCoverCrop(100, 100, 0)).toEqual({ sx: 0, sy: 0, sw: 0, sh: 0 })
  })
})

describe('buildStatsLine', () => {
  const esLabels = { volume: 'de volumen', prOne: 'PR', prMany: 'PRs' }

  it('arma volumen + PRs en plural', () => {
    expect(buildStatsLine('4.800 kg', 2, esLabels)).toEqual({
      volume: '4.800 kg de volumen',
      prs: '2 PRs',
    })
  })

  it('usa singular con 1 PR', () => {
    expect(buildStatsLine('4.800 kg', 1, esLabels)).toEqual({
      volume: '4.800 kg de volumen',
      prs: '1 PR',
    })
  })

  it('omite el segmento de PRs sin PRs', () => {
    expect(buildStatsLine('4.800 kg', 0, esLabels)).toEqual({
      volume: '4.800 kg de volumen',
      prs: null,
    })
  })

  it('inyecta las etiquetas en inglés sin cambiar el número', () => {
    expect(buildStatsLine('4,800 kg', 3, { volume: 'volume', prOne: 'PR', prMany: 'PRs' })).toEqual({
      volume: '4,800 kg volume',
      prs: '3 PRs',
    })
  })
})
```

- [ ] **Step 2: Correr los tests y verlos fallar**

Run: `npx vitest run tests/unit/domain/sessionPhotoCard.test.ts`
Expected: FAIL — `Cannot find module '@/domain/sessionPhotoCard'`.

- [ ] **Step 3: Implementar `src/domain/sessionPhotoCard.ts`**

```ts
// Contrato puro del card con foto (F93 #15): recorte cover centrado y armado de
// la línea de stats. Sin React, sin canvas, sin i18n (las etiquetas se inyectan).
export interface CoverCrop {
  sx: number
  sy: number
  sw: number
  sh: number
}

// Recorte cuadrado centrado tipo object-fit: cover. El destino solo se valida:
// el canvas escala el recorte a 1080 (imágenes menores también, suavidad aceptada).
export const computeCoverCrop = (srcW: number, srcH: number, size: number): CoverCrop => {
  if (size <= 0 || srcW <= 0 || srcH <= 0) return { sx: 0, sy: 0, sw: 0, sh: 0 }
  const side = Math.min(srcW, srcH)
  return { sx: (srcW - side) / 2, sy: (srcH - side) / 2, sw: side, sh: side }
}

export interface StatsLineParts {
  volume: string
  prs: string | null
}

export interface StatsLineLabels {
  volume: string
  prOne: string
  prMany: string
}

// '{volumen} de volumen' + PRs solo con N > 0; singular con exactamente 1.
// Se devuelven las partes separadas para que el renderer pinte los PRs en dorado.
export const buildStatsLine = (
  volumeText: string,
  prCount: number,
  labels: StatsLineLabels,
): StatsLineParts => ({
  volume: `${volumeText} ${labels.volume}`,
  prs: prCount > 0 ? `${prCount} ${prCount === 1 ? labels.prOne : labels.prMany}` : null,
})
```

- [ ] **Step 4: Correr los tests y verlos pasar**

Run: `npx vitest run tests/unit/domain/sessionPhotoCard.test.ts`
Expected: PASS (9/9).

- [ ] **Step 5: Escribir el e2e de aceptación y el ajuste de regresión F95**

`tests/e2e/test_f93_15_card_foto.py` (patrón `with_server.py`, selectores por `data-*`, 0 errores de consola):

```python
"""F93 #15 — card de sesión con foto de fondo: chip Foto, preview por píxel, cambiar/quitar y descarga."""
import base64
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# PNG 2x2 rojo puro (generado con System.Drawing): permite verificar por píxel que la foto se dibujó.
PNG_ROJO = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAARSURBVBhXYzghIvIfhBlgDABEZAe95nGcWwAAAABJRU5ErkJggg=="
)

# Entreno con datos + meta de logros pre-desbloqueados: evita el modal de F95 que intercepta clics.
SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'workouts', 'workoutSets', 'prs', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 99001, slug: 'sentadilla-f93', name: 'Sentadilla F93', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    tx.objectStore('workouts').put({ id: 9501, startedAt: '2026-08-24T09:00:00.000Z', finishedAt: '2026-08-24T10:15:00.000Z', routineId: null, routineDayId: null, localDate: '2026-08-24', notes: '', totalVolume: 4800 });
    tx.objectStore('workoutSets').put({ id: 95001, workoutId: 9501, exerciseId: 99001, setNumber: 1, weightKg: 100, reps: 5, completed: true, createdAt: '2026-08-24T09:05:00.000Z' });
    tx.objectStore('workoutSets').put({ id: 95002, workoutId: 9501, exerciseId: 99001, setNumber: 2, weightKg: 100, reps: 5, completed: true, createdAt: '2026-08-24T09:08:00.000Z' });
    tx.objectStore('prs').put({ exerciseId: 99001, weightKg: 100, reps: 5, date: '2026-08-24T10:15:00.000Z', estimated1RM: 112.5 });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    const ids = ['primer-paso', 'inaugural', 'primera-marca'];
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(ids) });
    tx.objectStore('meta').put({ key: 'achievementCounts', value: JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))) });
    tx.objectStore('meta').put({ key: 'achievementSnapshot', value: JSON.stringify(ids) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812}, accept_downloads=True)
        page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(800)
            assert page.evaluate(SEED_JS) is True, "seed fallo"
            page.goto(f"{BASE}/entrenamiento/9501", wait_until="networkidle")
            page.wait_for_timeout(1200)

            card = page.locator("[data-photo-template]").first
            assert card.count() > 0, "no se renderizó el export de sesión"

            chips = page.locator("[data-template]")
            assert chips.count() == 4, f"chips != 4 (Foto + 3): {chips.count()}"
            assert chips.first.get_attribute("data-template") == "photo", "el primer chip no es Foto"

            # Foto (web): el chip abre el input file; se selecciona un PNG rojo.
            with page.expect_file_chooser() as fc:
                page.locator('[data-template="photo"]').first.click()
            fc.value.set_files({"name": "foto-card.png", "mimeType": "image/png", "buffer": PNG_ROJO})
            page.wait_for_timeout(900)

            assert card.get_attribute("data-photo-template") == "photo", "el modo foto no se activó"
            assert page.locator('[data-template="photo"]').first.get_attribute("aria-checked") == "true"
            assert page.locator("text=Cambiar foto").count() > 0, "falta el atajo Cambiar foto"
            assert page.locator("text=Quitar foto").count() > 0, "falta el atajo Quitar foto"

            # La foto se dibujó: píxel (100, 300) rojo (ahí no hay texto y el degradado es casi nulo).
            pixel = page.evaluate("""() => {
              const c = document.querySelector('canvas');
              const d = c.getContext('2d').getImageData(100, 300, 1, 1).data;
              return [d[0], d[1], d[2], d[3]];
            }""")
            if not (pixel[3] == 255 and pixel[0] > 150 and pixel[1] < 80 and pixel[2] < 80):
                errors.append(f"foto: el píxel (100,300) no es rojo de la foto: {pixel}")

            # Quitar foto vuelve a la plantilla previa (Clásica por defecto).
            page.locator("text=Quitar foto").first.click()
            page.wait_for_timeout(400)
            assert card.get_attribute("data-photo-template") == "classic", "Quitar foto no volvió a Clásica"
            assert page.locator('[data-template="photo"]').first.get_attribute("aria-checked") == "false"

            # Volver a poner foto (la anterior se descartó) y descargar el PNG.
            with page.expect_file_chooser() as fc2:
                page.locator('[data-template="photo"]').first.click()
            fc2.value.set_files({"name": "foto-card.png", "mimeType": "image/png", "buffer": PNG_ROJO})
            page.wait_for_timeout(900)
            assert card.get_attribute("data-photo-template") == "photo", "no se reactivó el modo foto"

            with page.expect_download() as dl:
                page.locator("button", has_text="Descargar").first.click()
            download = dl.value
            assert download.suggested_filename == "gymlab-2026-08-24.png", download.suggested_filename
            print("OK: card con foto (chip, preview, cambiar/quitar y descarga)")
        except Exception as e:  # noqa: BLE001
            errors.append(str(e))
        finally:
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F93 #15 card con foto")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

Ajuste en `tests/e2e/test_f95.py` (el chip nuevo cambia el contrato DOM a propósito):

```python
# ANTES (líneas 227-229):
        chips = page.locator("[data-template]")
        if chips.count() != 3:
            errors.append(f"foto: selector de plantillas no tiene 3 chips: {chips.count()}")

# DESPUÉS:
        chips = page.locator("[data-template]")
        if chips.count() != 4:
            errors.append(f"foto: selector de plantillas no tiene 4 chips (Foto + 3): {chips.count()}")
        if chips.first.get_attribute("data-template") != "photo":
            errors.append(f"foto: el primer chip no es Foto: {chips.first.get_attribute('data-template')}")
```

- [ ] **Step 6: Correr el e2e nuevo y verlo fallar**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f93_15_card_foto.py`
Expected: FAIL — no existe `[data-template="photo"]` (timeout del `expect_file_chooser`). Este es el “rojo” de la UI (canvas/componentes no se unit-testean en este repo).

- [ ] **Step 7: i18n es/en**

En `src/i18n/locales/es/features.ts`, dentro de `share` (después del bloque `template`):

```ts
    photo: 'Foto',
    changePhoto: 'Cambiar foto',
    removePhoto: 'Quitar foto',
    statsVolume: 'de volumen',
    prsOne: 'PR',
    prsMany: 'PRs',
```

En `src/i18n/locales/en/features.ts`, dentro de `share`:

```ts
    photo: 'Photo',
    changePhoto: 'Change photo',
    removePhoto: 'Remove photo',
    statsVolume: 'volume',
    prsOne: 'PR',
    prsMany: 'PRs',
```

- [ ] **Step 8: Crear el renderer D2 `src/components/session/sessionPhotoTemplate.ts` y exportar helpers**

En `src/components/session/sessionTemplates.ts` solo cambian dos declaraciones (el resto del archivo queda intacto):

```ts
// ANTES (línea 34):  const volumeText = (data: SessionImageData, units: Units): string =>
// DESPUÉS:           export const volumeText = (data: SessionImageData, units: Units): string =>
// ANTES (línea 41):  const fitText = (ctx: Ctx, text: string, maxWidth: number): string => {
// DESPUÉS:           export const fitText = (ctx: Ctx, text: string, maxWidth: number): string => {
```

`src/components/session/sessionPhotoTemplate.ts`:

```ts
// Pintado del card con foto de fondo (D2, 1080×1080): foto cover + degradado y
// bloque hero anclado al pie. UI-side puro sin React, como sessionTemplates.ts.
import type { SessionImageData } from '@/domain/sessionImage'
import { computeCoverCrop } from '@/domain/sessionPhotoCard'
import { CANVAS_HEIGHT, CANVAS_WIDTH, fitText } from './sessionTemplates'

type Ctx = CanvasRenderingContext2D

// Paleta/fuente compartidas con las plantillas existentes.
const BG = '#121214'
const GOLD = '#D9B384'
const WHITE = '#FFFFFF'
const FONT = 'system-ui, sans-serif'

// Baselines del D2 congelados (spec 2026-09-27): bloque centrado y anclado al pie,
// con la marca a ~47 px del borde inferior. La spec fija tamaños, colores y pie;
// estas separaciones intermedias son el layout del renderer.
const BRAND_BASELINE = 1033
const STATS_BASELINE = 952
const DURATION_BASELINE = 852
const NAME_BASELINE = 706
const DATE_BASELINE = 628

export interface PhotoCanvasLabels {
  date: string // fecha localizada ('vie, 26 sept 2026'); se pinta en mayúsculas
  volume: string // segmento volumen ya armado ('4.800 kg de volumen')
  prs: string | null // segmento PRs ya armado ('2 PRs' | '1 PR' | null)
}

interface CtxWithLetterSpacing extends Ctx {
  letterSpacing: string
}

// ctx.letterSpacing existe desde Chromium 99; sin soporte se espacia carácter por carácter.
const hasLetterSpacing = (ctx: Ctx): ctx is CtxWithLetterSpacing => 'letterSpacing' in ctx

const drawSpacedCentered = (ctx: Ctx, text: string, spacingPx: number, y: number): void => {
  if (hasLetterSpacing(ctx)) {
    ctx.letterSpacing = `${spacingPx}px`
    ctx.textAlign = 'center'
    ctx.fillText(text, CANVAS_WIDTH / 2, y)
    ctx.letterSpacing = '0px'
    return
  }
  // Fallback: avance manual por carácter, centrado sobre el ancho total.
  const chars = [...text]
  const widths = chars.map((ch) => ctx.measureText(ch).width)
  const total = widths.reduce((sum, w) => sum + w, 0) + spacingPx * (chars.length - 1)
  ctx.textAlign = 'left'
  let x = CANVAS_WIDTH / 2 - total / 2
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, y)
    x += widths[i] + spacingPx
  })
}

// Línea de stats bicolor: volumen en blanco y PRs en dorado extrabold, centrados.
const drawStats = (ctx: Ctx, labels: PhotoCanvasLabels, y: number): void => {
  ctx.font = `500 28px ${FONT}`
  const volumeWidth = ctx.measureText(labels.volume).width
  const separator = labels.prs ? ' · ' : ''
  ctx.font = `800 28px ${FONT}`
  const prsWidth = labels.prs ? ctx.measureText(`${separator}${labels.prs}`).width : 0
  let x = CANVAS_WIDTH / 2 - (volumeWidth + prsWidth) / 2
  ctx.textAlign = 'left'
  ctx.fillStyle = WHITE
  ctx.font = `500 28px ${FONT}`
  ctx.fillText(labels.volume, x, y)
  if (labels.prs) {
    x += volumeWidth
    ctx.fillStyle = GOLD
    ctx.font = `800 28px ${FONT}`
    ctx.fillText(`${separator}${labels.prs}`, x, y)
  }
}

export const drawPhotoHero = (
  ctx: Ctx,
  data: SessionImageData,
  labels: PhotoCanvasLabels,
  photo: HTMLImageElement | null,
): void => {
  const canvas = ctx.canvas
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Foto con recorte cover centrado; si es menor se escala igual (spec).
  if (photo) {
    const crop = computeCoverCrop(photo.naturalWidth, photo.naturalHeight, CANVAS_WIDTH)
    if (crop.sw > 0 && crop.sh > 0) {
      ctx.drawImage(photo, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }
  }

  // Degradado exacto del contrato D2 (transparente arriba, oscuro al pie).
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
  gradient.addColorStop(0, 'rgba(18,18,20,.30)')
  gradient.addColorStop(0.36, 'rgba(18,18,20,0)')
  gradient.addColorStop(0.66, 'rgba(18,18,20,.50)')
  gradient.addColorStop(1, 'rgba(18,18,20,.95)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Fecha: dorada, bold 23 px, mayúsculas, letter-spacing ~.20em.
  ctx.fillStyle = GOLD
  ctx.font = `bold 23px ${FONT}`
  drawSpacedCentered(ctx, labels.date.toUpperCase(), 23 * 0.2, DATE_BASELINE)

  // Nombre: blanco bold 50 px (truncado si no entra), fallback ya resuelto por el hook.
  ctx.fillStyle = WHITE
  ctx.font = `bold 50px ${FONT}`
  ctx.textAlign = 'center'
  ctx.fillText(fitText(ctx, data.workoutName, CANVAS_WIDTH - 160), CANVAS_WIDTH / 2, NAME_BASELINE)

  // Duración: el número héroe (extrabold 104 px).
  ctx.font = `800 104px ${FONT}`
  ctx.fillText(data.duration, CANVAS_WIDTH / 2, DURATION_BASELINE)

  drawStats(ctx, labels, STATS_BASELINE)

  // Marca: GYMLAB dorada, extrabold 34 px, letter-spacing .36em.
  ctx.fillStyle = GOLD
  ctx.font = `800 34px ${FONT}`
  drawSpacedCentered(ctx, data.appName.toUpperCase(), 34 * 0.36, BRAND_BASELINE)
}
```

- [ ] **Step 9: Migrar `src/components/session/SessionImageExport.tsx`** (archivo completo)

```tsx
// Exportar sesión como imagen: tarjeta 1080×1080 con plantillas seleccionables,
// modo foto con recorte cover (D2), vista previa en vivo y descarga/compartir.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Image as ImageIcon, Share2 } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { PhotoSourceSheet } from '@/components/photos/PhotoSourceSheet'
import {
  DEFAULT_PHOTO_TEMPLATE,
  SESSION_IMAGE_TEMPLATES,
  type PhotoTemplateId,
  type SessionImageData,
} from '@/domain/sessionImage'
import { buildStatsLine } from '@/domain/sessionPhotoCard'
import {
  capturePhoto,
  isNativePlatform,
  readFileAsDataUrl,
  resizeImageToDataUrl,
  type PhotoSource,
} from '@/lib/photoCapture'
import { formatDate } from '@/lib/intl'
import type { AppLanguage } from '@/domain/onboarding'
import { renderSessionCanvas, volumeText } from './sessionTemplates'
import { drawPhotoHero } from './sessionPhotoTemplate'

interface SessionImageExportProps {
  data: SessionImageData
  // Plantilla inicial; sin valor usa la del dominio (clásica).
  initialTemplate?: PhotoTemplateId
}

const pngBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))

const downloadCanvas = (canvas: HTMLCanvasElement, filename: string): void => {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export const SessionImageExport = ({ data, initialTemplate = DEFAULT_PHOTO_TEMPLATE }: SessionImageExportProps) => {
  const { t, i18n } = useTranslation()
  const { settings } = useSettings()
  const lang = i18n.language as AppLanguage
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [template, setTemplate] = useState<PhotoTemplateId>(initialTemplate)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoMode, setPhotoMode] = useState(false)
  const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const labels = useMemo(
    () => ({
      duration: t('share.durationLabel'),
      volume: t('share.volumeLabel'),
      prs: t('share.prsLabel'),
      exercises: t('share.exercisesLabel'),
      footer: t('share.footer'),
    }),
    [t]
  )

  // Línea del D2 armada en dominio puro con las etiquetas localizadas (plural incluido).
  const photoLabels = useMemo(() => {
    const stats = buildStatsLine(volumeText(data, settings.units), data.prCount, {
      volume: t('share.statsVolume'),
      prOne: t('share.prsOne'),
      prMany: t('share.prsMany'),
    })
    return {
      // localDate es 'YYYY-MM-DD': el T12:00:00 evita corrimiento de día por zona horaria.
      date: formatDate(`${data.date}T12:00:00`, lang, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      volume: stats.volume,
      prs: stats.prs,
    }
  }, [data, settings.units, t, lang])

  // La foto se decodifica aparte para poder dibujarla sincrónicamente en el canvas.
  useEffect(() => {
    if (!photoUrl) {
      setPhotoImage(null)
      return
    }
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setPhotoImage(img)
    }
    img.src = photoUrl
    return () => {
      cancelled = true
    }
  }, [photoUrl])

  // La tarjeta se re-renderiza al cambiar plantilla, datos o modo foto.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (photoMode && photoImage) {
      const ctx = canvas.getContext('2d')
      if (ctx) drawPhotoHero(ctx, data, photoLabels, photoImage)
      return
    }
    if (!photoMode) {
      renderSessionCanvas(canvas, data, labels, settings.units, template)
    }
  }, [data, labels, photoLabels, photoImage, photoMode, settings.units, template])

  const handleDownload = useCallback(() => {
    if (canvasRef.current) downloadCanvas(canvasRef.current, `gymlab-${data.date}.png`)
  }, [data.date])

  // Share nativo con fallback a descarga; los fallos del share (p. ej. cancelación
  // del usuario) se tragan para no dejar rechazos sin manejar.
  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const filename = `gymlab-${data.date}.png`
    if (!navigator.share) {
      downloadCanvas(canvas, filename)
      return
    }
    try {
      const blob = await pngBlob(canvas)
      if (!blob) return
      await navigator.share({ files: [new File([blob], filename, { type: 'image/png' })] })
    } catch {
      // El usuario canceló o la plataforma no lo soportó: no se propaga.
    }
  }, [data.date])

  // Foto: se guarda redimensionada (~1080) en memoria; sigue disponible al cambiar
  // de plantilla y se descarta solo con «Quitar foto».
  const applyPhoto = useCallback(async (src: string) => {
    setPhotoUrl(await resizeImageToDataUrl(src, 1080))
    setPhotoMode(true)
  }, [])

  const requestPhoto = useCallback(() => {
    if (isNativePlatform()) {
      setSheetOpen(true)
      return
    }
    fileInputRef.current?.click()
  }, [])

  const handlePhotoChip = () => {
    if (photoUrl) {
      setPhotoMode(true)
      return
    }
    requestPhoto()
  }

  const handleSheetSelect = useCallback(
    async (source: PhotoSource) => {
      setSheetOpen(false)
      try {
        const webPath = await capturePhoto(source)
        if (!webPath) return
        await applyPhoto(webPath)
      } catch {
        // Error real de captura: se descarta en silencio; el usuario puede reintentar.
      }
    },
    [applyPhoto]
  )

  const handleFileChange = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      await applyPhoto(await readFileAsDataUrl(file))
    },
    [applyPhoto]
  )

  const handleRemovePhoto = () => {
    setPhotoUrl(null)
    setPhotoMode(false)
  }

  return (
    <div
      className="flex flex-col gap-3"
      data-photo-pr={data.prCount}
      data-photo-template={photoMode ? 'photo' : template}
    >
      {/* Selector: chip Foto primero + las 3 plantillas; semántica de radios. */}
      <div className="flex gap-1.5" role="radiogroup" aria-label={t('share.templateLabel')}>
        <button
          type="button"
          onClick={handlePhotoChip}
          role="radio"
          aria-checked={photoMode}
          data-template="photo"
          className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium transition-colors ${
            photoMode ? 'bg-accent text-accent-fg' : 'bg-bg-elevated/50 text-muted'
          }`}
        >
          <ImageIcon className="size-4" aria-hidden />
          {t('share.photo')}
        </button>
        {SESSION_IMAGE_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            type="button"
            onClick={() => {
              setTemplate(tmpl.id)
              setPhotoMode(false)
            }}
            role="radio"
            aria-checked={!photoMode && template === tmpl.id}
            data-template={tmpl.id}
            className={`min-h-[44px] flex-1 rounded-xl px-2 text-sm font-medium transition-colors ${
              !photoMode && template === tmpl.id ? 'bg-accent text-accent-fg' : 'bg-bg-elevated/50 text-muted'
            }`}
          >
            {t(tmpl.labelKey)}
          </button>
        ))}
      </div>

      {/* Atajo de modo foto (solo con la foto activa). */}
      {photoMode && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={requestPhoto}
            aria-label={t('share.changePhoto')}
            className="min-h-[44px] flex-1 rounded-xl bg-bg-elevated/50 px-3 text-sm text-muted"
          >
            {t('share.changePhoto')}
          </button>
          <button
            type="button"
            onClick={handleRemovePhoto}
            aria-label={t('share.removePhoto')}
            className="min-h-[44px] flex-1 rounded-xl bg-bg-elevated/50 px-3 text-sm text-muted"
          >
            {t('share.removePhoto')}
          </button>
        </div>
      )}

      {/* Tarjeta 1080×1080 renderizada en vivo (escalada con CSS). */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${t('share.preview')} — ${data.workoutName || data.date}`}
        className="w-full max-w-sm self-center rounded-2xl border border-border"
      />

      {/* Entrada de archivo (web) para elegir la foto del card. */}
      <input
        ref={fileInputRef}
        data-photo-input
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={t('share.photo')}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          void handleFileChange(file)
        }}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-bg-elevated/50 px-4 py-3 min-h-[44px] text-sm text-muted"
        >
          <Download className="size-4" /> {t('share.download')}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 min-h-[44px] text-sm font-medium text-accent-fg"
        >
          <Share2 className="size-4" /> {t('share.share')}
        </button>
      </div>

      {sheetOpen && <PhotoSourceSheet onSelect={handleSheetSelect} onClose={() => setSheetOpen(false)} />}
    </div>
  )
}
```

- [ ] **Step 10: Verificación completa (typecheck real + suite + lint)**

```powershell
npm run build     # tsc -b + vite build (typecheck REAL)
npm test          # suite vitest (incluye los 9 casos nuevos)
npm run lint      # oxlint
```

- [ ] **Step 11: e2e verde (nuevo + regresión F95/F75)**

```powershell
python tests/e2e/scripts/with_server.py tests/e2e/test_f93_15_card_foto.py
python tests/e2e/scripts/with_server.py tests/e2e/test_f95.py
python tests/e2e/scripts/with_server.py tests/e2e/test_f75.py
```

Expected: los 3 `ALL OK`. F75 no debe romperse: `canvas[role="img"]`, Descargar y la altura de botones siguen intactos. F95 ahora exige 4 chips con Foto primero.

- [ ] **Step 12: Docs de la tarea**

- `CHANGELOG.md` (bajo `[Unreleased]` → `Added`): entrada del card con foto, siguiendo el estilo de la casa (incluir conteo real de la suite y resultado de los e2e, como el resto del archivo):

```markdown
- **Card de sesión con foto de fondo estilo Strava (F93 #15, `feat`)**: `SessionImageExport` gana el chip **Foto** (primero de la fila `[Foto][Clásica][Hero][Compacta]`, `data-template="photo"`, ícono `Image` de lucide) que convierte la tarjeta 1080×1080 en un hero sobre la foto elegida: en nativo abre el `PhotoSourceSheet` de F106 (`capturePhoto` → `resizeImageToDataUrl` a ~1080) y en web un input file oculto; atajo «Cambiar foto / Quitar foto» (44 px) visible solo en modo foto, preview en vivo y vuelta a la plantilla previa con Quitar (la foto queda en memoria al cambiar de plantilla y se descarta con Quitar). Contrato puro nuevo `src/domain/sessionPhotoCard.ts` (`computeCoverCrop` cover centrado + `buildStatsLine` con segmento de PRs condicional y plural inyectado) y renderer nuevo `src/components/session/sessionPhotoTemplate.ts` (`drawPhotoHero`: degradado D2 exacto, fecha dorada en mayúsculas, duración héroe, línea volumen·PRs bicolor, marca GYMLAB con `letterSpacing` nativo y fallback por carácter). i18n es/en `share.photo|changePhoto|removePhoto|statsVolume|prsOne|prsMany`. e2e nuevo `tests/e2e/test_f93_15_card_foto.py` + ajuste de `test_f95.py` (3 → 4 chips). Verificado: TDD rojo→verde (`tests/unit/domain/sessionPhotoCard.test.ts`), `npm run build`, `npm test`, `npm run lint` y los e2e nuevo/F75/F95 en verde.
```

- Actualizar "ESTADO DE AVANCE" de este plan (Task 1 → `[x]`).
- Commit (**lo hace el orquestador** tras el review RDD del workspace): `feat: card de sesion con foto de fondo estilo Strava (F93 #15)`

---

### Task 2 (T2) — Share nativo real + guardar a galería

**Files:**
- Modify: `package.json` + `package-lock.json` (deps nuevas)
- Modify (por `cap sync`): `android/capacitor.settings.gradle`, `android/app/capacitor.build.gradle`
- Create: `src/lib/shareImage.ts`
- Create: `tests/unit/lib/shareImage.test.ts`
- Modify: `src/components/session/SessionImageExport.tsx` (share/download + toast)
- Modify: `src/i18n/locales/es/features.ts` + `en/features.ts` (`share.savedToGallery`, `share.saveError`)
- Modify: `CHANGELOG.md`, `PLAN.md`, este plan (estado)

**Interfaces:**
- Consumes: `SessionImageExport` de T1 (canvas 1080 con el card dibujado), `savePhotosToGallery` (F106), `isCaptureCancel` (`src/lib/photoCapture.ts`).
- Produces:
  - `type ShareResult = 'shared' | 'downloaded' | 'cancelled' | 'failed'`
  - `shareImage(canvas: HTMLCanvasElement, filename: string): Promise<ShareResult>` — nunca lanza: cancelación → `'cancelled'`; error real → `'failed'`; web sin Web Share API → `'downloaded'`.

- [ ] **Step 1: Instalar los dos plugins aprobados y sincronizar**

```powershell
npm install @capacitor/share@^8.0.0 @capacitor/filesystem@^8.0.0
npx cap sync android
git status --short   # esperado: package.json, package-lock.json, android/capacitor.settings.gradle, android/app/capacitor.build.gradle
```

`assets/public`, `capacitor.config.json` y `capacitor.plugins.json` quedan gitignored (no aparecen). No ejecutar `cap sync ios`.

- [ ] **Step 2: Escribir los tests que fallan** (`tests/unit/lib/shareImage.test.ts`)

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => 'android'),
  },
}))

// photoCapture importa el plugin Camera: se mockea para poder usar su isCaptureCancel real.
vi.mock('@capacitor/camera', () => ({
  Camera: { takePhoto: vi.fn(), chooseFromGallery: vi.fn() },
}))

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: { writeFile: vi.fn() },
}))

vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn() } }))

const { Capacitor } = await import('@capacitor/core')
const { Filesystem } = await import('@capacitor/filesystem')
const { Share } = await import('@capacitor/share')
const { shareImage } = await import('@/lib/shareImage')

const isNative = Capacitor.isNativePlatform as unknown as ReturnType<typeof vi.fn>
const writeFile = Filesystem.writeFile as unknown as ReturnType<typeof vi.fn>
const share = Share.share as unknown as ReturnType<typeof vi.fn>

// Canvas falso: el helper solo necesita toDataURL (nativo/descarga) y toBlob (share web).
const fakeCanvas = (): HTMLCanvasElement =>
  ({
    toDataURL: () => 'data:image/png;base64,QUJD',
    toBlob: (cb: (blob: Blob | null) => void) => cb(new Blob(['png'], { type: 'image/png' })),
  }) as unknown as HTMLCanvasElement

describe('shareImage (nativo)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isNative.mockReturnValue(true)
    writeFile.mockResolvedValue({ uri: 'file:///cache/gymlab.png' })
    share.mockResolvedValue({})
  })

  it('escribe el PNG en Cache y comparte el file uri', async () => {
    await expect(shareImage(fakeCanvas(), 'gymlab-2026-08-24.png')).resolves.toBe('shared')
    expect(writeFile).toHaveBeenCalledWith({
      path: 'gymlab-2026-08-24.png',
      data: 'QUJD',
      directory: 'CACHE',
    })
    expect(share).toHaveBeenCalledWith({ files: ['file:///cache/gymlab.png'] })
  })

  it('cancelación del usuario: cancelled en silencio', async () => {
    share.mockRejectedValue({ message: 'User cancelled' })
    await expect(shareImage(fakeCanvas(), 'gymlab.png')).resolves.toBe('cancelled')
  })

  it('error real del plugin: failed sin lanzar', async () => {
    share.mockRejectedValue({ code: 'OS-PLUG-SHAR-0001', message: 'boom' })
    await expect(shareImage(fakeCanvas(), 'gymlab.png')).resolves.toBe('failed')
  })

  it('fallo de Filesystem también cae en failed', async () => {
    writeFile.mockRejectedValue(new Error('disk full'))
    await expect(shareImage(fakeCanvas(), 'gymlab.png')).resolves.toBe('failed')
  })
})

describe('shareImage (web)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isNative.mockReturnValue(false)
  })

  it('usa navigator.share con un File PNG', async () => {
    const navigatorShare = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share: navigatorShare })
    await expect(shareImage(fakeCanvas(), 'gymlab.png')).resolves.toBe('shared')
    const arg = navigatorShare.mock.calls[0][0]
    expect(arg.files[0].name).toBe('gymlab.png')
    expect(arg.files[0].type).toBe('image/png')
  })

  it('cancelación de navigator.share (AbortError): cancelled', async () => {
    const abort = Object.assign(new Error('Share canceled'), { name: 'AbortError' })
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(abort) })
    await expect(shareImage(fakeCanvas(), 'gymlab.png')).resolves.toBe('cancelled')
  })

  it('sin navigator.share: descarga con <a download>', async () => {
    vi.stubGlobal('navigator', {})
    const click = vi.fn()
    const anchor = { href: '', download: '', click }
    vi.stubGlobal('document', { createElement: vi.fn(() => anchor) })
    await expect(shareImage(fakeCanvas(), 'gymlab.png')).resolves.toBe('downloaded')
    expect(anchor.download).toBe('gymlab.png')
    expect(click).toHaveBeenCalledTimes(1)
  })

  it('error real del share web: failed', async () => {
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new Error('NotAllowedError')) })
    await expect(shareImage(fakeCanvas(), 'gymlab.png')).resolves.toBe('failed')
  })
})
```

- [ ] **Step 3: Correr los tests y verlos fallar**

Run: `npx vitest run tests/unit/lib/shareImage.test.ts`
Expected: FAIL — `Cannot find module '@/lib/shareImage'`.

- [ ] **Step 4: Implementar `src/lib/shareImage.ts`**

```ts
// Compartir la tarjeta renderizada: hoja nativa real en Android (el WebView no
// tiene navigator.share) y Web Share API/descarga en web. Nunca lanza: la
// cancelación se ignora y un error real se reporta como 'failed'.
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { isCaptureCancel } from '@/lib/photoCapture'

export type ShareResult = 'shared' | 'downloaded' | 'cancelled' | 'failed'

const downloadDataUrl = (dataUrl: string, filename: string): void => {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

const pngBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))

// Cancelación: códigos/mensajes del plugin Share o AbortError del share web.
const isShareCancel = (err: unknown): boolean => {
  if (isCaptureCancel(err)) return true
  if (typeof err === 'object' && err !== null && (err as { name?: unknown }).name === 'AbortError') {
    return true
  }
  return false
}

// Nativo: el PNG va a Cache y se comparte su file:// (Share.share exige URIs).
const shareNative = async (canvas: HTMLCanvasElement, filename: string): Promise<ShareResult> => {
  const dataUrl = canvas.toDataURL('image/png')
  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: dataUrl.split(',')[1] ?? '',
    directory: Directory.Cache,
  })
  await Share.share({ files: [uri] })
  return 'shared'
}

// Web: Web Share API si existe; si no, descarga del navegador.
const shareWeb = async (canvas: HTMLCanvasElement, filename: string): Promise<ShareResult> => {
  const dataUrl = canvas.toDataURL('image/png')
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    downloadDataUrl(dataUrl, filename)
    return 'downloaded'
  }
  const blob = await pngBlob(canvas)
  if (!blob) return 'failed'
  await navigator.share({ files: [new File([blob], filename, { type: 'image/png' })] })
  return 'shared'
}

export const shareImage = async (canvas: HTMLCanvasElement, filename: string): Promise<ShareResult> => {
  try {
    return Capacitor.isNativePlatform() ? await shareNative(canvas, filename) : await shareWeb(canvas, filename)
  } catch (err) {
    return isShareCancel(err) ? 'cancelled' : 'failed'
  }
}
```

- [ ] **Step 5: Correr los tests y verlos pasar**

Run: `npx vitest run tests/unit/lib/shareImage.test.ts`
Expected: PASS (8/8).

- [ ] **Step 6: i18n**

En `src/i18n/locales/es/features.ts`, dentro de `share`:

```ts
    savedToGallery: 'Card guardado en tu galería',
    saveError: 'No se pudo guardar. Revisá los permisos de galería.',
```

En `src/i18n/locales/en/features.ts`, dentro de `share`:

```ts
    savedToGallery: 'Card saved to your gallery',
    saveError: "Couldn't save. Check gallery permissions.",
```

- [ ] **Step 7: Migrar `share`/`download` en `SessionImageExport.tsx`**

Imports: agregar `savePhotosToGallery` y `shareImage` (y **eliminar** el helper `pngBlob`, que se muda a `shareImage.ts`):

```tsx
import { savePhotosToGallery } from '@/lib/saveToGallery'
import { shareImage } from '@/lib/shareImage'
```

Estados y auto-hide del toast (patrón `ProgressPhotosPage`):

```tsx
  const [galleryToast, setGalleryToast] = useState<'ok' | 'error' | null>(null)

  // El toast de guardado se oculta solo a los 2,5 s (patrón de ProgressPhotosPage).
  useEffect(() => {
    if (!galleryToast) return
    const id = setTimeout(() => setGalleryToast(null), 2500)
    return () => clearTimeout(id)
  }, [galleryToast])
```

Reemplazo de `handleShare` (borrar `pngBlob` y la lógica inline de `navigator.share`):

```tsx
  // Share real vía helper: nativo = Cache + hoja de Android; web = Web Share API
  // o descarga. La cancelación es silencio y un error real no crashea (contrato).
  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    await shareImage(canvas, `gymlab-${data.date}.png`)
  }, [data.date])
```

Reemplazo de `handleDownload` (nativo → galería con toast; web sigue igual):

```tsx
  // Descargar: en nativo guarda el card en la galería (álbum GymLab, F106) con
  // confirmación; en web se mantiene la descarga PNG del navegador.
  const handleDownload = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const filename = `gymlab-${data.date}.png`
    if (!isNativePlatform()) {
      downloadCanvas(canvas, filename)
      return
    }
    try {
      const { failed } = await savePhotosToGallery([
        { dataUrl: canvas.toDataURL('image/png'), fileName: `gymlab-${data.date}` },
      ])
      setGalleryToast(failed === 0 ? 'ok' : 'error')
    } catch {
      setGalleryToast('error')
    }
  }, [data.date])
```

Toast (`role="status"`), antes del `{sheetOpen && ...}`:

```tsx
      {galleryToast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[120] -translate-x-1/2 rounded-xl border border-border/30 bg-bg-elevated px-4 py-2 text-sm text-fg shadow-lg"
        >
          {galleryToast === 'ok' ? t('share.savedToGallery') : t('share.saveError')}
        </div>
      )}
```

- [ ] **Step 8: Verificación completa**

```powershell
npm run build
npm test
npm run lint
```

- [ ] **Step 9: e2e de regresión (el nuevo + F95 + F75)**

```powershell
python tests/e2e/scripts/with_server.py tests/e2e/test_f93_15_card_foto.py
python tests/e2e/scripts/with_server.py tests/e2e/test_f95.py
python tests/e2e/scripts/with_server.py tests/e2e/test_f75.py
```

Expected: los 3 `ALL OK` (en web no cambia el comportamiento: Descargar sigue siendo descarga PNG y Compartir cae a descarga; el e2e no toca Compartir porque `navigator.share` no está garantizado en Chromium headless).

- [ ] **Step 10: Emulador (obligatorio: plugins nuevos) — receta global + smoke del card**

Script CDP `C:\Users\Yves De Faria\AppData\Local\Temp\opencode\f93-15\cdp_card.py` (crear el directorio con `New-Item -ItemType Directory -Force` antes):

```python
# Smoke del card en el WebView de la app por CDP. Uso: python cdp_card.py
from playwright.sync_api import sync_playwright

SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'workouts', 'workoutSets', 'prs', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 99001, slug: 'sentadilla-f93', name: 'Sentadilla F93', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    tx.objectStore('workouts').put({ id: 9501, startedAt: '2026-08-24T09:00:00.000Z', finishedAt: '2026-08-24T10:15:00.000Z', routineId: null, routineDayId: null, localDate: '2026-08-24', notes: '', totalVolume: 4800 });
    tx.objectStore('workoutSets').put({ id: 95001, workoutId: 9501, exerciseId: 99001, setNumber: 1, weightKg: 100, reps: 5, completed: true, createdAt: '2026-08-24T09:05:00.000Z' });
    tx.objectStore('prs').put({ exerciseId: 99001, weightKg: 100, reps: 5, date: '2026-08-24T10:15:00.000Z', estimated1RM: 112.5 });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp("http://localhost:9222")
    page = browser.contexts[0].pages[0]
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.wait_for_timeout(1500)
    children = page.evaluate("document.getElementById('root').children.length")
    assert children > 0, "PANTALLA NEGRA: la app no montó"

    page.evaluate(SEED_JS)
    page.reload()
    page.wait_for_timeout(2500)
    page.evaluate("window.history.pushState({}, '', '/entrenamiento/9501'); window.dispatchEvent(new PopStateEvent('popstate'))")
    page.wait_for_timeout(1500)

    assert page.locator("[data-photo-template]").count() > 0, "el card no monta en el detalle del entreno"
    assert page.locator("canvas").first.evaluate("(el) => el.width") == 1080, "canvas != 1080"

    # Descargar en nativo = guardar en galería + toast (verificable por CDP).
    page.locator("button", has_text="Descargar").first.click()
    page.wait_for_timeout(2500)
    assert page.locator('[role="status"]').count() > 0, "no apareció el toast de guardado"

    # La hoja de compartir nativa NO es automatizable por CDP: se abre para el chequeo manual.
    page.locator("button", has_text="Compartir").first.click()
    page.wait_for_timeout(2000)
    print("CHEQUEO MANUAL: mirar el emulador y confirmar que se abrió la hoja de compartir de Android con el PNG")
    print({"children": children, "errors": errors, "body": page.evaluate("document.body.innerText.slice(0, 200)")})
    assert not errors, f"pageerrors: {errors}"
    print("OK: smoke CDP del card (0 pageerror)")
```

Verificación de galería (con el emulador aún conectado):

```powershell
& $adb shell content query --uri content://media/external/images/media --projection _display_name --where "_display_name LIKE 'gymlab%'"
```

Expected: al menos una fila `gymlab-2026-08-24.png`. Reportar el resultado exacto del `content query` y del chequeo manual de la hoja (si no hay humano mirando la pantalla, reportarlo como “no verificado manualmente”, no inventar éxito).

- [ ] **Step 11: Docs de la tarea**

- `CHANGELOG.md` (`Added`):

```markdown
- **Compartir nativo real y guardado del card en la galería (F93 #15, `feat`)**: `SessionImageExport` deja de depender de `navigator.share` (inexistente en el WebView de Android, causa raíz de F105.1) y delega en el helper nuevo `src/lib/shareImage.ts`: en nativo escribe el PNG en `Directory.Cache` (`@capacitor/filesystem@8`) y abre la hoja real con `@capacitor/share@8` (`Share.share({ files: [uri] })`); en web usa la Web Share API si existe y si no descarga. Cancelación = silencio; error real = resultado `'failed'` sin crash. Descargar en nativo guarda el card en la galería reutilizando `savePhotosToGallery` (álbum «GymLab», F106) con toast `role="status"` auto-oculto; en web la descarga `.png` no cambia. i18n es/en `share.savedToGallery|saveError`. Verificado: TDD rojo→verde (`tests/unit/lib/shareImage.test.ts`), `npm run build`, `npm test`, `npm run lint`, e2e nuevo + regresión, y emulador Pixel_10 (0 pageerror, toast, archivo del card en la galería por `content query`, hoja de compartir nativa).
```

- `PLAN.md` (sección «Tareas de Fase 93 pendientes», `#15`): reemplazar la línea

```markdown
- [ ] (Nuevo) Foto shareable de progreso: exportar/compartir la foto de progreso (patrón `SessionImageExport` F75).
```

por

```markdown
- [x] (F93 #15) Card de sesión con foto de fondo estilo Strava: chip Foto (cámara/galería en nativo, archivo en web), card D2 1080×1080, share nativo real (`@capacitor/share` + `@capacitor/filesystem`) y Descargar en nativo → galería. Commits: `feat: card de sesion con foto de fondo estilo Strava (F93 #15)` + `feat: compartir nativo real y guardado del card en galeria (F93 #15)`.
```

  La línea de «Probar la captura de fotos en **móvil real**» **queda sin marcar** (sigue encolada como gate de release) y el encabezado `#### [ ] #15` también queda abierto por eso mismo.
- Actualizar "ESTADO DE AVANCE" de este plan (Task 2 → `[x]`).
- Commit (**lo hace el orquestador** tras el review RDD del workspace): `feat: compartir nativo real y guardado del card en galeria (F93 #15)`

---

## Cierre de fase (después de la última tarea)

1. `npm run build` limpio + `npm test` verde + `npm run lint` (regla del repo).
2. `CHANGELOG.md` y `PLAN.md` al día (se hace por tarea).
3. Resumen al usuario: qué quedó hecho, verificaciones observadas (incluidos el resultado real del emulador, el `content query` de la galería y el chequeo manual de la hoja de compartir) y próximo paso.
4. Lo que NO se puede verificar localmente (queda anotado, sin inventar éxito): validación física en teléfono real (F93 #15) e iOS sin Mac. La hoja de compartir nativa se abre y se observa manualmente; no es automatizable por CDP.

---

## Follow-ups del review nativo (informativos, no bloqueantes)

Review aprobado vía CLI (`review-7fe52e973f2b281a`, lens `review-reliability`, authority burned). Findings del recibo, **resueltos** en el fix de robustez posterior:

- **R3-001 (WARNING)** — `SessionImageExport.tsx` (rama web de selección): `handleFileChange` hace `await` de `readFileAsDataUrl`/`applyPhoto` sin `try/catch` y se invoca con `void`; un archivo no decodificable deja la promesa sin manejar (sin señal al usuario). La rama nativa sí captura. → **Resuelto**: `handleFileChange` envuelve `readFileAsDataUrl` + `applyPhoto` en `try/catch` con descarte silencioso (mismo patrón que `handleSheetSelect`), y el e2e suma el caso de archivo `.png` con bytes basura.
- **R3-002 (SUGGESTION)** — `applyPhoto` confirma estado tras el `await` sin guard de vigencia: una resolución tardía reactiva el modo foto después de «Quitar foto» o de cambiar de plantilla; dos selecciones seguidas resuelven por orden de finalización, no de elección. → **Resuelto**: token de vigencia `photoRequestRef` (`useRef<number>`) — `applyPhoto` lo incrementa al ARRANCAR y solo aplica `setPhotoUrl`/`setPhotoMode(true)` si el id sigue siendo el último; «Quitar foto» y el click de cada plantilla lo invalidan antes de cambiar de estado. La foto en memoria se conserva al cambiar de plantilla (contrato intacto).
- **R3-003 (SUGGESTION)** — el e2e no cubre la rama de foto retenida (`if (photoUrl)` en el chip y la retención al cambiar de plantilla): proponer foto → cambiar plantilla → chip Foto → verificar `data-photo-template === 'photo'` y el píxel del canvas. → **Resuelto**: el caso nuevo en `test_f93_15_card_foto.py` hace exactamente esa secuencia (foto activa → Clásica → chip Foto → `data-photo-template === 'photo'` + píxel rojo del canvas), más el caso de archivo inválido (0 `pageerror`, el chip Foto no se activa).

Los findings no bloquearon el review del candidato original y no se re-corre ese review; los tres quedaron resueltos en el cambio de robustez posterior.




