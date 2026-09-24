# F106 — Fotos de progreso: cámara, guardar en galería y comparador — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la captura de fotos de progreso (y el avatar del perfil) use la cámara y la galería reales en Android/iOS, que el usuario pueda guardar sus fotos a la galería del teléfono, y que el comparador pase a una página dedicada con vista dividida y alternada.

**Architecture:** Plugin oficial `@capacitor/camera` para captura con sheet propio de elección de fuente (nativo) y fallback a input file (web); `@capacitor-community/media` para exportar a la galería (álbum "GymLab"); página nueva `/progreso-fotos/comparar` reusando `useProgressPhotos`. El pipeline de almacenamiento NO cambia: Dexie, base64 JPEG, resize 800 px (avatar 400 px).

**Tech Stack:** Vite + React 18 + TypeScript, Tailwind v4, Dexie, react-router-dom, react-i18next, Vitest (node env, sin DOM), Playwright (librería Python), Capacitor 8 (Android + iOS).

**Spec:** `docs/superpowers/specs/2026-09-23-f106-fotos-camara-comparador-design.md`

---

## ESTADO DE AVANCE

- [x] Task 1 (106.1) — captura cámara + galería
- [x] Task 2 — guardar en galería
- [ ] Task 3 (106.2) — comparador rediseñado

(El orquestador actualiza esta sección al cerrar cada tarea, en el mismo commit de la tarea.)

## Global Constraints

Copiadas de la spec y de `gymlab-app/AGENTS.md`. Aplican a **todas** las tareas.

- **Android-first**: ningún cambio puede degradar Android; la web mantiene su comportamiento (fallback a input file).
- UI en es-ES; **paridad es/en obligatoria** (el tipo `EsSchema` la impone: una key que falte en `en` rompe `npm run build`).
- Touch targets ≥ 44×44 px; gap ≥ 8 px; respetar `prefers-reduced-motion`; sin scrollbars visibles.
- `npm run build` es el typecheck REAL (`tsc -b`); **nunca** usar `npx tsc --noEmit` como evidencia.
- `npm test` y `npm run lint` verdes antes de cada commit.
- **El implementador NO commitea**: no ejecutar `git add`/`git commit`/`git stash` ni nada que mute git. El orquestador corre el review cycle (Gentle AI) sobre el diff del workspace y commitea. El workspace debe quedar con SOLO los cambios de la tarea.
- Un commit por tarea, mensaje convencional, **sin push**.
- No agregar dependencias fuera de las dos aprobadas (`@capacitor/camera`, `@capacitor-community/media`).
- `npx cap sync` no ensucia git: `assets/public`, `capacitor.config.json`, `capacitor.plugins.json` están gitignored; `android/capacitor.settings.gradle` y `android/app/capacitor.build.gradle` SÍ se commitean (los actualiza el sync — incluirlos en el diff de la tarea).
- iOS: solo se edita `Info.plist` a mano; el pod/SPM del plugin se resuelve al abrir en Mac (fuera de alcance, no ejecutar `cap sync ios`).

### Receta de emulador (obligatoria en las 3 tareas)

El emulador `emulator-5554` YA está conectado. `adb` **no está en PATH**: usar la ruta completa.

```powershell
# Desde gymlab-app
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
npm run android:sync
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\android\gradlew.bat -p .\android assembleDebug        # usar timeout largo (600000 ms)
& $adb install -r android\app\build\outputs\apk\debug\app-debug.apk
& $adb shell am force-stop com.gymlab.app
& $adb shell am start -n com.gymlab.app/.MainActivity
Start-Sleep -Seconds 6
$appPid = (& $adb shell pidof com.gymlab.app).Trim()
& $adb forward tcp:9222 localabstract:webview_devtools_remote_$appPid
```

Script CDP base (`C:\Users\Yves De Faria\AppData\Local\Temp\opencode\f106\cdp_check.py`; cada tarea le agrega su propia acción):

```python
# Inspecciona el WebView de la app por CDP. Uso: python cdp_check.py
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp("http://localhost:9222")
    page = browser.contexts[0].pages[0]
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.wait_for_timeout(1500)
    children = page.evaluate("document.getElementById('root').children.length")
    body = page.evaluate("document.body.innerText.slice(0, 300)")
    print({"children": children, "errors": errors, "body": body})
    assert children > 0, "PANTALLA NEGRA: la app no montó"
    assert not errors, f"pageerrors: {errors}"
```

Para navegar a una ruta interna desde el WebView:

```python
page.evaluate("window.history.pushState({}, '', '/progreso-fotos'); window.dispatchEvent(new PopStateEvent('popstate'))")
page.wait_for_timeout(1200)
```

**Criterio de aceptación**: `children > 0`, body con texto, **0 `pageerror`**. Los pickers nativos (cámara/galería) no son automatizables por CDP: el smoke verifica que la app monta, navega y que el sheet abre sin errores; el flujo completo de selección se valida en teléfono físico (queda anotado, como en F79).

## File Structure

| Archivo | Tarea | Responsabilidad |
|---|---|---|
| `src/lib/photoCapture.ts` | T1 | Núcleo de captura: plataforma, `capturePhoto`, cancelación, resize, ángulo pendiente |
| `src/components/photos/PhotoSourceSheet.tsx` | T1 | Sheet "Tomar foto / Elegir de la galería" (nativo) |
| `src/hooks/usePhotoRestore.ts` | T1 | Recupera foto si Android mata la app con la cámara abierta (`appRestoredResult`) |
| `src/pages/ProgressPhotosPage.tsx` | T1, T2, T3 | Captura (T1), botón guardar en timeline (T2), botón → link al comparador (T3) |
| `src/components/profile/AvatarPicker.tsx` | T1 | Avatar: mismo flujo de captura, resize 400 px |
| `src/App.tsx` | T1 | Monta `usePhotoRestore()` |
| `src/lib/saveToGallery.ts` | T2 | Exporta data URLs a la galería (álbum "GymLab"; web = descarga) |
| `src/pages/ProgressPhotosComparePage.tsx` | T3 | Página de comparación (dividida / alternar) |
| `src/pages/ProgressPhotosCompareRoute.tsx` | T3 | Wrapper que cablea `useProgressPhotos` |
| `src/app/router.tsx` | T3 | Ruta lazy `progreso-fotos/comparar` |
| `android/app/src/main/AndroidManifest.xml` | T1 | `xmlns:tools` + service de backport del Photo Picker |
| `ios/App/App/Info.plist` | T1 | 3 usage descriptions |
| `src/i18n/locales/{es,en}/core.ts` | T1 | `photoSource.*` |
| `src/i18n/locales/{es,en}/features.ts` | T1, T2, T3 | Keys de `progressPhotos.*` |
| `tests/unit/lib/photoCapture.test.ts` | T1 | Tests unitarios del núcleo |
| `tests/unit/lib/saveToGallery.test.ts` | T2 | Tests unitarios del export |
| `tests/e2e/test_f106_camara.py` | T1 | e2e web: captura por input file |
| `tests/e2e/test_f106_guardar.py` | T2 | e2e web: descarga |
| `tests/e2e/test_f106_comparar.py` | T3 | e2e web: comparador |
| `CHANGELOG.md`, `PLAN.md`, este plan | T1, T2, T3 | Docs de cierre de cada tarea |

---

### Task 1 (106.1) — Captura con cámara y galería reales

**Files:**
- Create: `src/lib/photoCapture.ts`
- Create: `src/components/photos/PhotoSourceSheet.tsx`
- Create: `src/hooks/usePhotoRestore.ts`
- Modify: `src/pages/ProgressPhotosPage.tsx` (solo la sección de captura)
- Modify: `src/components/profile/AvatarPicker.tsx`
- Modify: `src/App.tsx` (montar el hook)
- Modify: `src/i18n/locales/es/core.ts` + `en/core.ts` (agregar `photoSource`)
- Modify: `src/i18n/locales/es/features.ts` + `en/features.ts` (agregar `progressPhotos.captureError`)
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `ios/App/App/Info.plist`
- Modify: `package.json` + `package-lock.json` (dep nueva)
- Modify (por `cap sync`): `android/capacitor.settings.gradle`, `android/app/capacitor.build.gradle`
- Create: `tests/unit/lib/photoCapture.test.ts`
- Create: `tests/e2e/test_f106_camara.py`
- Modify: `CHANGELOG.md`, `PLAN.md`, este plan (estado)

**Interfaces (Produces — las consumen T2/T3 y la restauración):**
- `type PhotoSource = 'camera' | 'gallery'` · `type PhotoAngle = 'frontUri' | 'sideUri' | 'backUri'`
- `isNativePlatform(): boolean`
- `capturePhoto(source: PhotoSource): Promise<string | null>` — devuelve `webPath`; `null` si el usuario canceló; lanza en error real
- `isCaptureCancel(err: unknown): boolean`
- `readFileAsDataUrl(file: File): Promise<string>`
- `resizeImageToDataUrl(src: string, maxPx: number): Promise<string>` — JPEG 0.8
- `setPendingPhotoAngle(angle: PhotoAngle): void` · `getPendingPhotoAngle(): PhotoAngle | null` · `clearPendingPhotoAngle(): void`
- `PhotoSourceSheet({ onSelect, onClose }: { onSelect: (s: PhotoSource) => void; onClose: () => void })`
- `usePhotoRestore(): void`

- [ ] **Step 1: Instalar el plugin y sincronizar**

```powershell
npm install @capacitor/camera@^8.0.0
npx cap sync android
git status --short   # esperado: package.json, package-lock.json, android/capacitor.settings.gradle, android/app/capacitor.build.gradle
```

- [ ] **Step 2: Escribir los tests que fallan** (`tests/unit/lib/photoCapture.test.ts`)

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => 'android'),
  },
}))

vi.mock('@capacitor/camera', () => ({
  Camera: {
    takePhoto: vi.fn(),
    chooseFromGallery: vi.fn(),
  },
}))

const { Capacitor } = await import('@capacitor/core')
const { Camera } = await import('@capacitor/camera')
const {
  capturePhoto,
  clearPendingPhotoAngle,
  getPendingPhotoAngle,
  isCaptureCancel,
  isNativePlatform,
  setPendingPhotoAngle,
} = await import('@/lib/photoCapture')

const isNative = Capacitor.isNativePlatform as unknown as ReturnType<typeof vi.fn>
const takePhoto = Camera.takePhoto as unknown as ReturnType<typeof vi.fn>
const chooseFromGallery = Camera.chooseFromGallery as unknown as ReturnType<typeof vi.fn>

describe('isNativePlatform', () => {
  it('delega en Capacitor.isNativePlatform', () => {
    isNative.mockReturnValue(false)
    expect(isNativePlatform()).toBe(false)
    isNative.mockReturnValue(true)
    expect(isNativePlatform()).toBe(true)
  })
})

describe('isCaptureCancel', () => {
  it('reconoce los códigos de cancelación del plugin', () => {
    expect(isCaptureCancel({ code: 'OS-PLUG-CAMR-0006' })).toBe(true)
    expect(isCaptureCancel({ code: 'OS-PLUG-CAMR-0013' })).toBe(true)
    expect(isCaptureCancel({ code: 'OS-PLUG-CAMR-0020' })).toBe(true)
  })

  it('reconoce mensajes con "cancel" (case-insensitive)', () => {
    expect(isCaptureCancel(new Error('User cancelled photos app'))).toBe(true)
  })

  it('no confunde errores reales', () => {
    expect(isCaptureCancel({ code: 'OS-PLUG-CAMR-0003' })).toBe(false)
    expect(isCaptureCancel(null)).toBe(false)
    expect(isCaptureCancel('otra cosa')).toBe(false)
  })
})

describe('capturePhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isNative.mockReturnValue(true)
  })

  it('cámara: usa takePhoto con quality 90 y devuelve webPath', async () => {
    takePhoto.mockResolvedValue({ webPath: 'capacitor://foto.jpg' })
    await expect(capturePhoto('camera')).resolves.toBe('capacitor://foto.jpg')
    expect(takePhoto).toHaveBeenCalledWith({ quality: 90 })
  })

  it('galería: usa chooseFromGallery y devuelve el primer webPath', async () => {
    chooseFromGallery.mockResolvedValue({ results: [{ webPath: 'capacitor://g1.jpg' }] })
    await expect(capturePhoto('gallery')).resolves.toBe('capacitor://g1.jpg')
    expect(chooseFromGallery).toHaveBeenCalledWith({ quality: 90 })
  })

  it('galería sin selección devuelve null', async () => {
    chooseFromGallery.mockResolvedValue({ results: [] })
    await expect(capturePhoto('gallery')).resolves.toBeNull()
  })

  it('cancelación devuelve null (no lanza)', async () => {
    takePhoto.mockRejectedValue({ code: 'OS-PLUG-CAMR-0006' })
    await expect(capturePhoto('camera')).resolves.toBeNull()
  })

  it('error real se propaga', async () => {
    takePhoto.mockRejectedValue({ code: 'OS-PLUG-CAMR-0003' })
    await expect(capturePhoto('camera')).rejects.toMatchObject({ code: 'OS-PLUG-CAMR-0003' })
  })
})

describe('ángulo pendiente (localStorage)', () => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v)
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
  })

  it('guarda, lee y limpia un ángulo válido', () => {
    setPendingPhotoAngle('sideUri')
    expect(getPendingPhotoAngle()).toBe('sideUri')
    clearPendingPhotoAngle()
    expect(getPendingPhotoAngle()).toBeNull()
  })

  it('ignora valores corruptos', () => {
    localStorage.setItem('gymlab-pending-photo-angle', 'hack')
    expect(getPendingPhotoAngle()).toBeNull()
  })
})
```

- [ ] **Step 3: Correr los tests y verlos fallar**

Run: `npx vitest run tests/unit/lib/photoCapture.test.ts`
Expected: FAIL — `Cannot find module '@/lib/photoCapture'`.

- [ ] **Step 4: Implementar `src/lib/photoCapture.ts`**

```ts
// Captura de fotos: plugin Camera en nativo (cámara/galería) y fallback a input file en web.
import { Capacitor } from '@capacitor/core'
import { Camera } from '@capacitor/camera'

export type PhotoSource = 'camera' | 'gallery'
export type PhotoAngle = 'frontUri' | 'sideUri' | 'backUri'

// Códigos de cancelación del plugin Camera (el usuario cerró cámara/galería/editor).
const CANCEL_CODES = ['OS-PLUG-CAMR-0006', 'OS-PLUG-CAMR-0013', 'OS-PLUG-CAMR-0020']
const PENDING_KEY = 'gymlab-pending-photo-angle'

export const isNativePlatform = (): boolean => Capacitor.isNativePlatform()

// Cancelación = código conocido o mensaje con "cancel" (case-insensitive).
export const isCaptureCancel = (err: unknown): boolean => {
  if (typeof err !== 'object' || err === null) return false
  const e = err as { code?: unknown; message?: unknown }
  if (typeof e.code === 'string' && CANCEL_CODES.includes(e.code)) return true
  return typeof e.message === 'string' && /cancel/i.test(e.message)
}

// Abre cámara o galería nativas y devuelve el webPath de la foto.
// null = el usuario canceló; lanza si el error es real.
export const capturePhoto = async (source: PhotoSource): Promise<string | null> => {
  try {
    if (source === 'camera') {
      const result = await Camera.takePhoto({ quality: 90 })
      return result.webPath ?? null
    }
    const { results } = await Camera.chooseFromGallery({ quality: 90 })
    return results[0]?.webPath ?? null
  } catch (err) {
    if (isCaptureCancel(err)) return null
    throw err
  }
}

// Lee un File del input web como data URL.
export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })

// Redimensiona (máx. maxPx) y devuelve JPEG base64. Acepta data URL o webPath nativo.
export const resizeImageToDataUrl = (src: string, maxPx: number): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.src = src
  })

// Ángulo pendiente: sobrevive si Android mata la app con la cámara abierta (appRestoredResult).
export const setPendingPhotoAngle = (angle: PhotoAngle) =>
  localStorage.setItem(PENDING_KEY, angle)

export const getPendingPhotoAngle = (): PhotoAngle | null => {
  const v = localStorage.getItem(PENDING_KEY)
  return v === 'frontUri' || v === 'sideUri' || v === 'backUri' ? v : null
}

export const clearPendingPhotoAngle = () => localStorage.removeItem(PENDING_KEY)
```

- [ ] **Step 5: Correr los tests y verlos pasar**

Run: `npx vitest run tests/unit/lib/photoCapture.test.ts` → Expected: PASS (10/10).

- [ ] **Step 6: Crear el sheet + i18n**

`src/components/photos/PhotoSourceSheet.tsx`:

```tsx
// Sheet de elección de fuente de foto (cámara o galería) para flujos nativos.
import { useTranslation } from 'react-i18next'
import { Camera, Image as ImageIcon, X } from 'lucide-react'
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape'
import type { PhotoSource } from '@/lib/photoCapture'

const optionCls =
  'flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-border/30 bg-bg-elevated/50 px-4 py-3 text-left text-sm font-medium text-fg transition-colors hover:border-cta'

export const PhotoSourceSheet = ({
  onSelect,
  onClose,
}: {
  onSelect: (source: PhotoSource) => void
  onClose: () => void
}) => {
  const { t } = useTranslation()
  useCloseOnEscape(onClose)
  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('photoSource.title')}
        onClick={(e) => e.stopPropagation()}
        className="panel-floating w-full max-w-md rounded-t-3xl p-5 sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-base font-semibold text-fg">{t('photoSource.title')}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('layout.confirm.close')}
            className="flex size-11 items-center justify-center rounded-xl text-muted transition-colors hover:text-accent-soft"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <button type="button" onClick={() => onSelect('camera')} className={optionCls}>
            <Camera className="size-5 text-accent" aria-hidden />
            {t('photoSource.camera')}
          </button>
          <button type="button" onClick={() => onSelect('gallery')} className={optionCls}>
            <ImageIcon className="size-5 text-accent" aria-hidden />
            {t('photoSource.gallery')}
          </button>
        </div>
      </div>
    </div>
  )
}
```

i18n — en `es/core.ts` agregar una sección nueva de nivel raíz (junto a las existentes):

```ts
photoSource: {
  title: 'Elegir foto',
  camera: 'Tomar foto',
  gallery: 'Elegir de la galería',
},
```

en `en/core.ts`:

```ts
photoSource: {
  title: 'Choose photo',
  camera: 'Take photo',
  gallery: 'Choose from gallery',
},
```

- [ ] **Step 7: Migrar la captura en `src/pages/ProgressPhotosPage.tsx`**

El resto de la página (comparador inline y timeline) NO se toca en esta tarea. Cambios:

```tsx
// imports nuevos
import { PhotoSourceSheet } from '@/components/photos/PhotoSourceSheet'
import {
  capturePhoto,
  clearPendingPhotoAngle,
  isNativePlatform,
  readFileAsDataUrl,
  resizeImageToDataUrl,
  setPendingPhotoAngle,
  type PhotoAngle,
  type PhotoSource,
} from '@/lib/photoCapture'

// estados nuevos (junto a los existentes)
const [sheetAngle, setSheetAngle] = useState<PhotoAngle | null>(null)
const [captureError, setCaptureError] = useState(false)

// REEMPLAZA al viejo resizeImage + handleCapture
const savePhoto = async (angle: PhotoAngle, dataUrl: string) => {
  const today = new Date().toISOString().slice(0, 10)
  const existing = photos.find((p) => p.localDate === today)
  if (existing) onAdd({ ...existing, [angle]: dataUrl })
  else onAdd({ localDate: today, frontUri: null, sideUri: null, backUri: null, [angle]: dataUrl })
}

const handleWebFile = async (angle: PhotoAngle, file: File) => {
  const src = await readFileAsDataUrl(file)
  await savePhoto(angle, await resizeImageToDataUrl(src, 800))
}

const handleAngleClick = (angle: PhotoAngle) => {
  if (isNativePlatform()) {
    setSheetAngle(angle)
    return
  }
  const input = angle === 'frontUri' ? frontRef : angle === 'sideUri' ? sideRef : backRef
  input.current?.click()
}

const handleSheetSelect = async (source: PhotoSource) => {
  const angle = sheetAngle
  setSheetAngle(null)
  if (!angle) return
  setCaptureError(false)
  try {
    setPendingPhotoAngle(angle)
    const webPath = await capturePhoto(source)
    if (!webPath) return
    await savePhoto(angle, await resizeImageToDataUrl(webPath, 800))
  } catch {
    setCaptureError(true)
  } finally {
    clearPendingPhotoAngle()
  }
}
```

En el JSX: cada botón de ángulo pasa a `onClick={() => handleAngleClick('frontUri')}` (ídem `'sideUri'` y `'backUri'`); los 3 inputs web quedan igual salvo el handler:

```tsx
<input
  ref={frontRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={(e) => {
    const f = e.target.files?.[0]
    if (f) void handleWebFile('frontUri', f)
  }}
/>
```

Al final del contenedor de captura, agregar:

```tsx
{captureError && (
  <p role="alert" className="mt-2 text-xs text-danger">
    {t('progressPhotos.captureError')}
  </p>
)}
```

Y al final de la página (al mismo nivel que el resto, fuera del bloque condicional), montar el sheet:

```tsx
{sheetAngle && (
  <PhotoSourceSheet onSelect={handleSheetSelect} onClose={() => setSheetAngle(null)} />
)}
```

i18n — en `es/features.ts` dentro de `progressPhotos`: `captureError: 'No se pudo obtener la foto. Intentá de nuevo.'`; en `en/features.ts`: `captureError: 'Could not get the photo. Try again.'`

- [ ] **Step 8: Migrar `src/components/profile/AvatarPicker.tsx`**

- Importar `PhotoSourceSheet`, `capturePhoto`, `isNativePlatform`, `resizeImageToDataUrl` y `type PhotoSource`; agregar `const [sheetOpen, setSheetOpen] = useState(false)`.
- El botón "Subir foto" queda:

```tsx
<Button
  variant="outline"
  size="md"
  className="w-full"
  onClick={() => (isNativePlatform() ? setSheetOpen(true) : fileRef.current?.click())}
>
```

- El `handleFile` web pasa a redimensionar 400 px antes de validar:

```tsx
const handleFile = (file: File | undefined) => {
  setError(null)
  if (!file) return
  if (!ALLOWED_MIME.has(file.type)) {
    setError(t('perfil.avatarFormatoError'))
    return
  }
  if (file.size > MAX_FILE_BYTES) {
    setError(t('perfil.avatarTamanoError'))
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    void (async () => {
      const uri = await resizeImageToDataUrl(reader.result as string, 400)
      if (isSafeAvatarUri(uri)) {
        setSelected(uri)
        onSelect(uri)
        onClose()
      }
    })()
  }
  reader.readAsDataURL(file)
}

// Nativo: misma fuente de foto que las fotos de progreso, resize 400 px y misma validación.
const handleSheetSelect = async (source: PhotoSource) => {
  setSheetOpen(false)
  setError(null)
  try {
    const webPath = await capturePhoto(source)
    if (!webPath) return
    const uri = await resizeImageToDataUrl(webPath, 400)
    if (isSafeAvatarUri(uri)) {
      setSelected(uri)
      onSelect(uri)
      onClose()
    }
  } catch {
    setError(t('perfil.avatarFormatoError'))
  }
}
```

- Montar el sheet dentro del overlay del picker (al final del JSX):

```tsx
{sheetOpen && (
  <PhotoSourceSheet onSelect={handleSheetSelect} onClose={() => setSheetOpen(false)} />
)}
```

- [ ] **Step 9: Crear `src/hooks/usePhotoRestore.ts` y montarlo**

```ts
// Recupera la foto si Android mató la app con la cámara abierta (appRestoredResult).
import { useEffect } from 'react'
import { App } from '@capacitor/app'
import {
  clearPendingPhotoAngle,
  getPendingPhotoAngle,
  resizeImageToDataUrl,
} from '@/lib/photoCapture'
import { progressPhotoRepo } from '@/data/repositories'

type RestoredResult = {
  pluginId?: string
  success?: boolean
  data?: { webPath?: string }
}

export const usePhotoRestore = () => {
  useEffect(() => {
    const listener = App.addListener('appRestoredResult', (result) => {
      void (async () => {
        const data = result as unknown as RestoredResult
        const angle = getPendingPhotoAngle()
        if (data.pluginId !== 'Camera' || !data.success || !data.data?.webPath || !angle) return
        clearPendingPhotoAngle()
        try {
          const dataUrl = await resizeImageToDataUrl(data.data.webPath, 800)
          const today = new Date().toISOString().slice(0, 10)
          const existing = await progressPhotoRepo.getByDate(today)
          await progressPhotoRepo.upsert(
            existing
              ? { ...existing, [angle]: dataUrl }
              : { localDate: today, frontUri: null, sideUri: null, backUri: null, [angle]: dataUrl },
          )
        } catch {
          // La foto restaurada no se pudo procesar: se descarta en silencio.
        }
      })()
    })
    return () => {
      void listener.then((l) => l.remove())
    }
  }, [])
}
```

En `src/App.tsx`: importar y llamar `usePhotoRestore()` junto a `useGlobalDragScroll()`.

- [ ] **Step 10: Android + iOS**

`android/app/src/main/AndroidManifest.xml` — agregar `xmlns:tools` al `<manifest>`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
```

Y dentro de `<application>` (después del `FileProvider`):

```xml
<!-- Photo Picker backport (Android 11-12 sin módulo del sistema): lo instala Google Play services. -->
<service android:name="com.google.android.gms.metadata.ModuleDependencies"
    android:enabled="false"
    android:exported="false"
    tools:ignore="MissingClass">
    <intent-filter>
        <action android:name="com.google.android.gms.metadata.MODULE_DEPENDENCIES" />
    </intent-filter>
    <meta-data android:name="photopicker_activity:0:required" android:value="" />
</service>
```

`ios/App/App/Info.plist` — agregar antes del `</dict>` de cierre:

```xml
<key>NSCameraUsageDescription</key>
<string>GymLab usa la cámara para tomar tus fotos de progreso.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>GymLab accede a tus fotos para elegir las de progreso.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>GymLab guarda tus fotos de progreso en tu galería.</string>
```

- [ ] **Step 11: e2e web `tests/e2e/test_f106_camara.py`**

```python
"""F106.1 — captura web: el input file sigue funcionando tras el refactor a plugin Camera."""
import base64
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# PNG 1x1 válido para set_input_files.
PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        page.on(
            "console",
            lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(700)
            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(600)
            page.goto(f"{BASE}/progreso-fotos", wait_until="networkidle")
            page.wait_for_timeout(800)

            assert page.locator("text=Frente").count() > 0, "no está la captura de Frente"

            page.locator('input[type="file"]').first.set_input_files(
                {"name": "frente.png", "mimeType": "image/png", "buffer": PNG_1X1}
            )
            page.wait_for_timeout(800)

            assert page.locator("img").count() > 0, "la foto capturada no apareció en el timeline"
            print("OK: captura web por input file")
        except Exception as e:  # noqa: BLE001
            errors.append(str(e))
        finally:
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F106.1 captura web")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f106_camara.py` → Expected: `ALL OK`.

- [ ] **Step 12: Verificación completa**

```powershell
npm run build     # typecheck real (tsc -b) + vite build
npm test          # suite vitest
npm run lint      # oxlint
```

- [ ] **Step 13: Smoke de emulador (receta global + esta acción)**

Variante del `cdp_check.py` para esta tarea (navega, abre el sheet y lo cierra con Escape):

```python
page.evaluate("window.history.pushState({}, '', '/progreso-fotos'); window.dispatchEvent(new PopStateEvent('popstate'))")
page.wait_for_timeout(1500)
page.click("text=Frente")
page.wait_for_timeout(800)
assert page.locator("text=Tomar foto").count() > 0, "el sheet de fuente no abrió"
assert page.locator("text=Elegir de la galería").count() > 0, "falta la opción de galería"
page.keyboard.press("Escape")
page.wait_for_timeout(500)
assert page.locator("text=Tomar foto").count() == 0, "el sheet no cerró con Escape"
```

Expected: `children > 0`, 0 `pageerror`, sheet visible y cierre OK. Reportar el resultado exacto. Si el emulador no tiene cámara virtual usable, la selección real se valida en teléfono físico (anotarlo).

- [ ] **Step 14: Docs de la tarea**

- `CHANGELOG.md` (bajo `[Unreleased]` → `Added`): captura con cámara/galería nativas vía `@capacitor/camera` (fotos de progreso + avatar), sheet de fuente, permisos iOS y backport del Photo Picker en Android, recuperación `appRestoredResult`.
- `PLAN.md`: marcar `- [x] **106.1 ...**`.
- Actualizar "ESTADO DE AVANCE" de este plan.
- Commit (**lo hace el orquestador** tras el review): `feat: captura de fotos de progreso con cámara y galería nativas (F106.1)`

---

### Task 2 — Guardar en galería

**Files:**
- Create: `src/lib/saveToGallery.ts`
- Modify: `src/pages/ProgressPhotosPage.tsx` (timeline: botón + toast)
- Modify: `src/i18n/locales/es/features.ts` + `en/features.ts` (`progressPhotos.saveToGallery`, `savedToGallery`, `saveError`)
- Modify: `package.json` + `package-lock.json` + gradle files (sync)
- Create: `tests/unit/lib/saveToGallery.test.ts`
- Create: `tests/e2e/test_f106_guardar.py`
- Modify: `CHANGELOG.md`, este plan (estado)

**Interfaces:**
- Consumes: nada de T1 (independiente).
- Produces: `savePhotosToGallery(photos: GalleryPhoto[]): Promise<{ saved: number; failed: number }>` con `interface GalleryPhoto { dataUrl: string; fileName: string }`.

- [ ] **Step 1: Instalar el plugin y sincronizar**

```powershell
npm install @capacitor-community/media@^9.0.0
npx cap sync android
git status --short   # esperado: package.json, package-lock.json, android/capacitor.settings.gradle, android/app/capacitor.build.gradle
```

- [ ] **Step 2: Escribir los tests que fallan** (`tests/unit/lib/saveToGallery.test.ts`)

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => 'android'),
  },
}))

vi.mock('@capacitor-community/media', () => ({
  Media: {
    getAlbums: vi.fn(),
    createAlbum: vi.fn(),
    savePhoto: vi.fn(),
  },
}))

const { Capacitor } = await import('@capacitor/core')
const { Media } = await import('@capacitor-community/media')
const { savePhotosToGallery } = await import('@/lib/saveToGallery')

const isNative = Capacitor.isNativePlatform as unknown as ReturnType<typeof vi.fn>
const getPlatform = Capacitor.getPlatform as unknown as ReturnType<typeof vi.fn>
const getAlbums = Media.getAlbums as unknown as ReturnType<typeof vi.fn>
const createAlbum = Media.createAlbum as unknown as ReturnType<typeof vi.fn>
const savePhoto = Media.savePhoto as unknown as ReturnType<typeof vi.fn>

const PHOTO = { dataUrl: 'data:image/jpeg;base64,AAA', fileName: 'gymlab-2026-09-23-front' }

describe('savePhotosToGallery (nativo Android)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isNative.mockReturnValue(true)
    getPlatform.mockReturnValue('android')
    getAlbums.mockResolvedValue({ albums: [{ identifier: 'gymlab-id', name: 'GymLab', type: 'user' }] })
    savePhoto.mockResolvedValue({})
  })

  it('usa el álbum existente y guarda con fileName', async () => {
    await expect(savePhotosToGallery([PHOTO])).resolves.toEqual({ saved: 1, failed: 0 })
    expect(savePhoto).toHaveBeenCalledWith({
      path: PHOTO.dataUrl,
      albumIdentifier: 'gymlab-id',
      fileName: PHOTO.fileName,
    })
    expect(createAlbum).not.toHaveBeenCalled()
  })

  it('crea el álbum "GymLab" si no existe', async () => {
    getAlbums
      .mockResolvedValueOnce({ albums: [] })
      .mockResolvedValueOnce({ albums: [{ identifier: 'nuevo-id', name: 'GymLab', type: 'user' }] })
    await savePhotosToGallery([PHOTO])
    expect(createAlbum).toHaveBeenCalledWith({ name: 'GymLab' })
    expect(savePhoto).toHaveBeenCalledWith(expect.objectContaining({ albumIdentifier: 'nuevo-id' }))
  })

  it('cuenta los fallos por foto sin cortar el resto', async () => {
    savePhoto.mockRejectedValueOnce({ code: 'accessDenied' }).mockResolvedValueOnce({})
    const r = await savePhotosToGallery([PHOTO, { ...PHOTO, fileName: 'dos' }])
    expect(r).toEqual({ saved: 1, failed: 1 })
  })
})

describe('savePhotosToGallery (iOS)', () => {
  it('no pide álbum (permiso add-only)', async () => {
    vi.clearAllMocks()
    isNative.mockReturnValue(true)
    getPlatform.mockReturnValue('ios')
    savePhoto.mockResolvedValue({})
    await savePhotosToGallery([PHOTO])
    expect(getAlbums).not.toHaveBeenCalled()
    expect(savePhoto).toHaveBeenCalledWith({
      path: PHOTO.dataUrl,
      albumIdentifier: undefined,
      fileName: PHOTO.fileName,
    })
  })
})

describe('savePhotosToGallery (web)', () => {
  it('descarga cada foto y no toca el plugin', async () => {
    vi.clearAllMocks()
    isNative.mockReturnValue(false)
    const click = vi.fn()
    const anchor = { href: '', download: '', click }
    vi.stubGlobal('document', { createElement: vi.fn(() => anchor) })
    await expect(savePhotosToGallery([PHOTO, { ...PHOTO, fileName: 'dos' }])).resolves.toEqual({
      saved: 2,
      failed: 0,
    })
    expect(click).toHaveBeenCalledTimes(2)
    expect(savePhoto).not.toHaveBeenCalled()
    expect(anchor.download).toBe('dos.jpg')
  })
})
```

- [ ] **Step 3: Correr y ver fallar**

Run: `npx vitest run tests/unit/lib/saveToGallery.test.ts` → Expected: FAIL (módulo inexistente).

- [ ] **Step 4: Implementar `src/lib/saveToGallery.ts`**

```ts
// Exporta fotos (data URL base64) a la galería del teléfono.
// Nativo: plugin Media (álbum "GymLab" en Android; en iOS permiso add-only, sin álbum).
// Web: descarga directa con <a download>.
import { Capacitor } from '@capacitor/core'
import { Media } from '@capacitor-community/media'

export interface GalleryPhoto {
  dataUrl: string
  fileName: string
}

// Álbum propio en Android (el plugin lo exige); en iOS no hace falta.
const ensureGymLabAlbum = async (): Promise<string | undefined> => {
  if (Capacitor.getPlatform() !== 'android') return undefined
  const { albums } = await Media.getAlbums()
  const existing = albums.find((a) => a.name === 'GymLab')
  if (existing) return existing.identifier
  await Media.createAlbum({ name: 'GymLab' })
  const { albums: after } = await Media.getAlbums()
  return after.find((a) => a.name === 'GymLab')?.identifier
}

const downloadOnWeb = (photo: GalleryPhoto) => {
  const a = document.createElement('a')
  a.href = photo.dataUrl
  a.download = `${photo.fileName}.jpg`
  a.click()
}

export const savePhotosToGallery = async (
  photos: GalleryPhoto[],
): Promise<{ saved: number; failed: number }> => {
  if (!Capacitor.isNativePlatform()) {
    photos.forEach(downloadOnWeb)
    return { saved: photos.length, failed: 0 }
  }
  const albumIdentifier = await ensureGymLabAlbum()
  let saved = 0
  let failed = 0
  for (const photo of photos) {
    try {
      await Media.savePhoto({ path: photo.dataUrl, albumIdentifier, fileName: photo.fileName })
      saved++
    } catch {
      failed++
    }
  }
  return { saved, failed }
}
```

- [ ] **Step 5: Correr y ver pasar**

Run: `npx vitest run tests/unit/lib/saveToGallery.test.ts` → Expected: PASS (5/5).

- [ ] **Step 6: Botón + toast en el timeline (`ProgressPhotosPage.tsx`)**

- Agregar `useEffect` al import de react, `ImageDown` al import de lucide-react, y `import { savePhotosToGallery } from '@/lib/saveToGallery'`.
- Estados nuevos:

```tsx
const [savingDate, setSavingDate] = useState<string | null>(null)
const [galleryToast, setGalleryToast] = useState<'ok' | 'error' | null>(null)
```

- Auto-ocultar el toast:

```tsx
useEffect(() => {
  if (!galleryToast) return
  const id = setTimeout(() => setGalleryToast(null), 2500)
  return () => clearTimeout(id)
}, [galleryToast])
```

- Handler:

```tsx
const handleSaveToGallery = async (entry: ProgressPhotoEntry) => {
  const items = (['frontUri', 'sideUri', 'backUri'] as const)
    .filter((a) => entry[a])
    .map((a) => ({
      dataUrl: entry[a]!,
      fileName: `gymlab-${entry.localDate}-${a.replace('Uri', '').toLowerCase()}`,
    }))
  if (items.length === 0) return
  setSavingDate(entry.localDate)
  try {
    const { failed } = await savePhotosToGallery(items)
    setGalleryToast(failed === 0 ? 'ok' : 'error')
  } catch {
    setGalleryToast('error')
  } finally {
    setSavingDate(null)
  }
}
```

- En el header de cada tarjeta del timeline, antes del botón de borrar:

```tsx
<button
  onClick={() => void handleSaveToGallery(p)}
  disabled={savingDate === p.localDate}
  aria-label={t('progressPhotos.saveToGallery')}
  className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:text-accent disabled:opacity-50"
>
  <ImageDown className="size-4" />
</button>
```

- Toast al final de la página:

```tsx
{galleryToast && (
  <div
    role="status"
    className="fixed bottom-24 left-1/2 z-[120] -translate-x-1/2 rounded-xl border border-border/30 bg-bg-elevated px-4 py-2 text-sm text-fg shadow-lg"
  >
    {galleryToast === 'ok' ? t('progressPhotos.savedToGallery') : t('progressPhotos.saveError')}
  </div>
)}
```

i18n (`es/features.ts`, dentro de `progressPhotos`): `saveToGallery: 'Guardar en galería'`, `savedToGallery: 'Fotos guardadas en tu galería'`, `saveError: 'No se pudieron guardar. Revisá los permisos de galería.'`
(`en/features.ts`): `saveToGallery: 'Save to gallery'`, `savedToGallery: 'Photos saved to your gallery'`, `saveError: "Couldn't save. Check gallery permissions."`

- [ ] **Step 7: e2e web `tests/e2e/test_f106_guardar.py`**

Mismo esqueleto que T1 (skip onboarding, console errors, `errors` accumulator, `accept_downloads=True` en `new_page`), con este cuerpo:

```python
page.goto(f"{BASE}/progreso-fotos", wait_until="networkidle")
page.wait_for_timeout(800)
# Sembrar una entrada directa en Dexie para no depender de la captura.
page.evaluate("""() => new Promise((resolve) => {
  const req = indexedDB.open('GymLabDB');
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction('progressPhotos', 'readwrite');
    tx.objectStore('progressPhotos').put({
      id: 9901, localDate: '2026-01-01',
      frontUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      sideUri: null, backUri: null, createdAt: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve(true);
  };
})""")
page.reload(wait_until="networkidle")
page.wait_for_timeout(900)
with page.expect_download() as dl:
    page.click('[aria-label="Guardar en galería"]')
download = dl.value
assert download.suggested_filename.endswith(".jpg"), download.suggested_filename
page.wait_for_timeout(400)
assert page.locator("text=Fotos guardadas").count() > 0, "no apareció el toast de guardado"
print("OK: descarga web + toast")
```

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f106_guardar.py` → Expected: `ALL OK`.

- [ ] **Step 8: Verificación completa**

```powershell
npm run build
npm test
npm run lint
```

- [ ] **Step 9: Smoke de emulador (receta global + esta acción)**

Variante del `cdp_check.py`: navegar a `/progreso-fotos`, sembrar una entrada con `page.evaluate` (igual que el e2e), recargar la vista (`page.reload()`), tocar el botón guardar y verificar el toast:

```python
page.evaluate("window.history.pushState({}, '', '/progreso-fotos'); window.dispatchEvent(new PopStateEvent('popstate'))")
page.wait_for_timeout(1500)
# sembrar entrada (mismo JS que el e2e) y recargar
page.reload()
page.wait_for_timeout(2000)
page.click('[aria-label="Guardar en galería"]')
page.wait_for_timeout(2500)
assert page.locator("text=Fotos guardadas").count() > 0, "no apareció el toast en nativo"
```

Y verificar en el dispositivo que la foto llegó a la galería:

```powershell
& $adb shell content query --uri content://media/external/images/media --projection _display_name --where "_display_name LIKE 'gymlab%'"
```

Expected: al menos una fila `gymlab-...jpg`. Si el `content query` no está permitido o la cuota falla, reportarlo como no verificable (anotar el motivo, no inventar éxito).

- [ ] **Step 10: Docs de la tarea**

- `CHANGELOG.md` (`Added`): botón "Guardar en galería" por fecha en fotos de progreso (álbum "GymLab" en Android; descarga en web).
- Actualizar "ESTADO DE AVANCE" de este plan.
- Commit (**lo hace el orquestador** tras el review): `feat: botón para guardar fotos de progreso en la galería del teléfono (F106)`

---

### Task 3 (106.2) — Página de comparación rediseñada

**Files:**
- Create: `src/pages/ProgressPhotosComparePage.tsx`
- Create: `src/pages/ProgressPhotosCompareRoute.tsx`
- Modify: `src/app/router.tsx` (lazy import + ruta)
- Modify: `src/pages/ProgressPhotosPage.tsx` (el modo comparar inline se elimina; el botón pasa a ser `Link`)
- Modify: `src/i18n/locales/es/features.ts` + `en/features.ts`
- Create: `tests/e2e/test_f106_comparar.py`
- Modify: `CHANGELOG.md`, `PLAN.md`, este plan (estado)

**Interfaces:**
- Consumes: `useProgressPhotos()` (existente), `ProgressPhotoEntry` (existente).
- Produces: ruta `/progreso-fotos/comparar`.

- [ ] **Step 1: i18n**

En `es/features.ts` dentro de `progressPhotos`: agregar `compareTitle: 'Comparar fotos'`, `modeSplit: 'Dividida'`, `modeAlternate: 'Alternar'`, `noPhoto: 'Sin foto'`, `needTwoDates: 'Necesitás al menos 2 fechas con fotos para comparar'`. **Eliminar** `selectDates` (era solo del inline).
En `en/features.ts`: `compareTitle: 'Compare photos'`, `modeSplit: 'Split'`, `modeAlternate: 'Alternate'`, `noPhoto: 'No photo'`, `needTwoDates: 'You need at least 2 dates with photos to compare'`. **Eliminar** `selectDates`.

- [ ] **Step 2: Crear `src/pages/ProgressPhotosComparePage.tsx`**

```tsx
// Página de comparación de fotos de progreso: A|B por ángulo, en modo dividido o alternado.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProgressPhotoEntry } from '@/domain/types'
import { AppHeader } from '@/components/layout/AppHeader'
import { BackLink } from '@/components/ui/BackLink'

const ANGLES = ['frontUri', 'sideUri', 'backUri'] as const
type Angle = (typeof ANGLES)[number]
type Mode = 'split' | 'toggle'

interface ProgressPhotosComparePageProps {
  photos: ProgressPhotoEntry[]
}

export const ProgressPhotosComparePage = ({ photos }: ProgressPhotosComparePageProps) => {
  const { t } = useTranslation()
  const dates = [...new Set(photos.map((p) => p.localDate))].sort().reverse()
  const [dateA, setDateA] = useState('')
  const [dateB, setDateB] = useState('')
  const [angle, setAngle] = useState<Angle>('frontUri')
  const [mode, setMode] = useState<Mode>('split')
  const [showB, setShowB] = useState(false)

  // Por defecto, las dos fechas más recientes; la elección del usuario no se pisa.
  const selA = dateA || dates[0] || ''
  const selB = dateB || dates[1] || ''
  const srcA = photos.find((p) => p.localDate === selA)?.[angle] ?? null
  const srcB = photos.find((p) => p.localDate === selB)?.[angle] ?? null

  const selectCls =
    'flex-1 min-h-[44px] rounded-xl border border-border/30 bg-bg-elevated/50 px-3 py-2 text-sm text-fg'
  const tabCls = (active: boolean) =>
    `min-h-[44px] flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
      active ? 'bg-accent text-accent-fg' : 'bg-accent/10 text-accent'
    }`

  if (dates.length < 2) {
    return (
      <div>
        <AppHeader title={t('progressPhotos.compareTitle')} />
        <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
          <BackLink to="/progreso-fotos" />
          <p className="text-sm text-muted">{t('progressPhotos.needTwoDates')}</p>
        </div>
      </div>
    )
  }

  const placeholder = (
    <div className="flex aspect-[3/4] w-full items-center justify-center rounded-xl bg-bg-elevated/50">
      <span className="text-xs text-muted">{t('progressPhotos.noPhoto')}</span>
    </div>
  )

  return (
    <div>
      <AppHeader title={t('progressPhotos.compareTitle')} />
      <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
        <BackLink to="/progreso-fotos" />

        {/* Fechas A y B: cada lado usa UNA fecha para los 3 ángulos. */}
        <div className="flex gap-3">
          <select
            value={selA}
            onChange={(e) => setDateA(e.target.value)}
            aria-label={t('progressPhotos.dateA')}
            className={selectCls}
          >
            {dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={selB}
            onChange={(e) => setDateB(e.target.value)}
            aria-label={t('progressPhotos.dateB')}
            className={selectCls}
          >
            {dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Ángulo activo */}
        <div className="flex gap-2">
          {ANGLES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAngle(a)}
              aria-pressed={angle === a}
              className={tabCls(angle === a)}
            >
              {t(`progressPhotos.${a}`)}
            </button>
          ))}
        </div>

        {/* Modo de vista */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('split')}
            aria-pressed={mode === 'split'}
            className={tabCls(mode === 'split')}
          >
            {t('progressPhotos.modeSplit')}
          </button>
          <button
            type="button"
            onClick={() => setMode('toggle')}
            aria-pressed={mode === 'toggle'}
            className={tabCls(mode === 'toggle')}
          >
            {t('progressPhotos.modeAlternate')}
          </button>
        </div>

        {mode === 'split' ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { src: srcA, label: selA, side: 'A' },
              { src: srcB, label: selB, side: 'B' },
            ].map(({ src, label, side }) => (
              <div key={side} className="flex flex-col gap-1.5">
                <p className="text-center text-xs text-muted">
                  {side} · {label}
                </p>
                {src ? (
                  <img
                    src={src}
                    alt=""
                    className="aspect-[3/4] w-full rounded-xl bg-bg-elevated/50 object-contain"
                    loading="lazy"
                  />
                ) : (
                  placeholder
                )}
              </div>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowB((v) => !v)}
            aria-label={t('progressPhotos.modeAlternate')}
            className="relative w-full"
          >
            {(showB ? srcB : srcA) ? (
              <img
                src={(showB ? srcB : srcA)!}
                alt=""
                className="aspect-[3/4] w-full rounded-xl bg-bg-elevated/50 object-contain"
              />
            ) : (
              placeholder
            )}
            <span className="absolute left-3 top-3 rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-fg">
              {(showB ? 'B' : 'A') + ' · ' + (showB ? selB : selA)}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Crear `src/pages/ProgressPhotosCompareRoute.tsx`**

```tsx
import { useProgressPhotos } from '@/hooks/useProgressPhotos'
import { ProgressPhotosComparePage } from './ProgressPhotosComparePage'

export const ProgressPhotosCompareRoute = () => {
  const { photos } = useProgressPhotos()
  return <ProgressPhotosComparePage photos={photos} />
}
```

- [ ] **Step 4: Router (`src/app/router.tsx`)**

```tsx
const ProgressPhotosCompareRoute = lazy(() =>
  import('../pages/ProgressPhotosCompareRoute').then((m) => ({ default: m.ProgressPhotosCompareRoute })),
)
```

y debajo de la ruta existente:

```tsx
<Route path="progreso-fotos" element={<ProgressPhotosRoute />} />
<Route path="progreso-fotos/comparar" element={<ProgressPhotosCompareRoute />} />
```

- [ ] **Step 5: `ProgressPhotosPage.tsx` — el inline se elimina y el botón navega**

- Importar `Link` de `react-router-dom` (el import de `ArrowLeftRight` se mantiene).
- **Eliminar**: estado `compareMode`/`dateA`/`dateB`, las constantes `dates`/`photoA`/`photoB`, y el bloque completo `{compareMode && ( ... comparador inline ... )}`.
- El bloque de captura deja de estar condicionado (era `{!compareMode && (...)}` → queda siempre visible).
- El botón "Comparar" se reemplaza por:

```tsx
<div className="flex items-center justify-end">
  <Link
    to="/progreso-fotos/comparar"
    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-accent/10 px-3 py-2 text-sm font-medium text-accent"
  >
    <ArrowLeftRight className="size-4" /> {t('progressPhotos.compare')}
  </Link>
</div>
```

- [ ] **Step 6: e2e web `tests/e2e/test_f106_comparar.py`**

Mismo esqueleto que T1. Cuerpo:

```python
page.goto(BASE, wait_until="networkidle")
page.wait_for_timeout(700)
skip_ob = page.locator("button", has_text="Ya entreno aquí")
if skip_ob.count() > 0:
    skip_ob.first.click(timeout=5000)
    page.wait_for_timeout(600)
page.goto(f"{BASE}/progreso-fotos/comparar", wait_until="networkidle")
page.wait_for_timeout(800)

# Sembrar 2 fechas: A con frontal + lateral, B solo frontal.
page.evaluate("""() => new Promise((resolve) => {
  const req = indexedDB.open('GymLabDB');
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction('progressPhotos', 'readwrite');
    const store = tx.objectStore('progressPhotos');
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    store.put({ id: 9901, localDate: '2026-01-01', frontUri: png, sideUri: png, backUri: null, createdAt: new Date().toISOString() });
    store.put({ id: 9902, localDate: '2026-02-01', frontUri: png, sideUri: null, backUri: null, createdAt: new Date().toISOString() });
    tx.oncomplete = () => resolve(true);
  };
})""")
page.reload(wait_until="networkidle")
page.wait_for_timeout(1000)

assert page.locator("select").count() == 2, "faltan los selects de fecha"
assert page.locator("img").count() >= 2, "el modo dividido no muestra las dos fotos"
assert page.locator("text=Dividida").count() > 0

page.click("text=Lateral")
page.wait_for_timeout(400)
assert page.locator("text=Sin foto").count() > 0, "no aparece el placeholder sin foto"

page.click("text=Alternar")
page.wait_for_timeout(400)
page.click('[aria-label="Alternar"]')
page.wait_for_timeout(300)
assert page.locator("text=B ·").count() > 0, "el toggle A/B no cambió a B"
print("OK: comparador (fechas, ángulos, modos)")
```

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f106_comparar.py` → Expected: `ALL OK`.

- [ ] **Step 7: Verificación completa**

```powershell
npm run build
npm test
npm run lint
```

- [ ] **Step 8: Smoke de emulador (receta global + esta acción) — ruta MULTI-SEGMENTO**

```python
page.evaluate("window.history.pushState({}, '', '/progreso-fotos/comparar'); window.dispatchEvent(new PopStateEvent('popstate'))")
page.wait_for_timeout(1500)
assert page.locator("text=Comparar fotos").count() > 0, "la página de comparar no montó"
assert page.evaluate("document.getElementById('root').children.length") > 0
```

Expected: `children > 0`, 0 `pageerror`, título visible. Esta es la ruta multi-segmento que la regla del repo exige probar en emulador (caso real: 17 pantallas negras por un `base: './'`).

- [ ] **Step 9: Docs de la tarea**

- `CHANGELOG.md` (`Added`): página de comparación de fotos de progreso (`/progreso-fotos/comparar`) con vista dividida A|B y modo alternar.
- `PLAN.md`: marcar `- [x] **106.2 ...**`.
- Actualizar "ESTADO DE AVANCE" de este plan.
- Commit (**lo hace el orquestador** tras el review): `feat: página de comparación de fotos de progreso con vista dividida y alternar (F106.2)`

---

## Cierre de fase (después de la última tarea)

1. `npm run build` limpio + `npm test` verde + `npm run lint` (regla del repo).
2. `CHANGELOG.md` y `PLAN.md` al día (se hace por tarea).
3. Resumen al usuario: qué quedó hecho, verificaciones observadas (incluido el resultado real del emulador) y próximo paso del plan.
4. Lo que NO se puede verificar localmente (queda anotado, sin inventar éxito): selección real de cámara/galería en teléfono físico (F79) e iOS sin Mac.
