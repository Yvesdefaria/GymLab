# F84d — Native Android Steps Widget — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use the `subagent-driven-development` skill (recommended) or the `executing-plans` skill to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship two Android home-screen widgets ("GymLab · Steps" 2×2 and "GymLab · Steps mini" 2×1) fed by the app's steps data, refreshed instantly by a tiny Capacitor plugin and re-rendered every ~30 min by the system, with tap-through to `/pasos`.

**Architecture:** The web layer pushes a `{steps, goal, date}` snapshot to a local Java Capacitor plugin, which stores it in `SharedPreferences` and triggers `AppWidgetManager.updateAppWidget` for both widget providers. Providers render `RemoteViews` from the stored snapshot (day-guard: not-today → 0). Tap launches `MainActivity` with `com.gymlab.app://pasos`; the web registers an `appUrlOpen`/`getLaunchUrl` handler that routes to `/pasos`.

**Tech Stack:** React 18 + TypeScript + Vite, Dexie (`useLiveQuery`), Vitest 4, Capacitor 8 (core + `@capacitor/app`), Java (no Kotlin toolchain), Android Gradle Plugin with `compileSdk 36` / `minSdk 26`.

**Spec:** `docs/superpowers/specs/2026-10-09-f84d-widget-nativo-design.md` (read it before starting; the plan argues from the spec).

## Global Constraints

- Work in `gymlab-app/` in the MAIN worktree. Do NOT create a worktree (repo policy: isolation only when explicitly requested).
- Widget UI copy is in **English** (product decision): `STEPS`, `of {{goal}}`, numbers with English grouping (`8,432` via `Locale.US`). The rest of the app stays es-ES. Code identifiers in English; code comments follow the repo convention (Spanish, brief, explaining "why").
- Fixed colors: bg `#121214`, text `#F4F4F2`, muted `#9C9C97`, accent gold `#D9B384`, success green `#22C55E`, track `#2A2A28`.
- Goal-met condition is strictly `steps >= goal`; bar fill caps at 100%; percent is real and rounded (`Math.round`), may exceed 100 (e.g. `120%`).
- Native: **Java only** — do not add the Kotlin Gradle plugin. No new npm dependencies (only `@capacitor/core` and `@capacitor/app`, already installed). No new Android permissions.
- Both widgets: fixed size (`resizeMode="none"`), `updatePeriodMillis="1800000"`, no preview image.
- Web/PWA builds must keep working: every native-facing helper no-ops off-Android (`Capacitor.getPlatform() !== 'android'`).
- Repo workflow per task: implement → build/tests → **pre-commit review cycle** (repo `AGENTS.md` §Gentle AI: candidate = workspace diff, run before committing) → stage **exact paths** → commit **without push**. Conventional commit messages in Spanish (repo style).
- Native changes REQUIRE emulator verification (repo `AGENTS.md`). Web unit tests use `npx vitest run <path>` (Vitest 4, alias `@` → `src`, tests under `tests/unit/`).

### Emulator verification recipe (used by Task 7)

```powershell
# 0) adb is not on PATH — use the full path. AVDs: Pixel_10, Small_Phone.
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
# 1) copy the web build into android/ and sync plugins — FROM gymlab-app, not from android/
npm run android:sync
# 2) compile the APK (Gradle needs the Android Studio JBR; the PATH java is unusable)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\android\gradlew.bat -p .\android assembleDebug
# 3) install and start
& $adb install -r android\app\build\outputs\apk\debug\app-debug.apk
& $adb shell am force-stop com.gymlab.app
& $adb shell am start -n com.gymlab.app/.MainActivity
# 4) inspect the WebView over CDP (Playwright python: connect_over_cdp("http://localhost:9222"))
& $adb forward tcp:9222 localabstract:webview_devtools_remote_$(& $adb shell pidof com.gymlab.app)
# Screenshots (PowerShell 5.1 corrupts binary redirects — copy via /sdcard):
& $adb shell screencap -p /sdcard/widget.png; & $adb pull /sdcard/widget.png .
```

---

### Task 1: Web — snapshot builder + push bridge (TDD)

**Files:**
- Create: `src/data/widgetBridge.ts`
- Test: `tests/unit/data/widgetBridge.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_STEPS_GOAL` from `@/domain/stepsTracker` (already exists, value `10_000`).
- Produces: `WidgetSnapshot { steps: number; goal: number; date: string }`; `buildWidgetSnapshot(stepsToday: number | undefined | null, goal: number, today: string): WidgetSnapshot`; `pushWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void>`; `GymLabWidgetPlugin` type. Tasks 2 uses `buildWidgetSnapshot`/`pushWidgetSnapshot`; the plugin name string `'GymLabWidget'` must match Task 6's `@CapacitorPlugin(name = "GymLabWidget")`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/data/widgetBridge.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mocks hoisted (patrón de healthBridge.test.ts): registerPlugin se llama al importar la impl.
const { updateSpy, getPlatformSpy } = vi.hoisted(() => ({
  updateSpy: vi.fn(async () => undefined),
  getPlatformSpy: vi.fn(() => 'web'),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: getPlatformSpy },
  registerPlugin: () => ({ update: updateSpy }),
}))

import { DEFAULT_STEPS_GOAL } from '@/domain/stepsTracker'
import { buildWidgetSnapshot, pushWidgetSnapshot } from '@/data/widgetBridge'

describe('buildWidgetSnapshot', () => {
  it('sin registro del día usa 0 pasos y conserva la meta', () => {
    expect(buildWidgetSnapshot(undefined, 10_000, '2026-10-09')).toEqual({
      steps: 0,
      goal: 10_000,
      date: '2026-10-09',
    })
  })

  it('redondea los pasos y nunca baja de 0', () => {
    expect(buildWidgetSnapshot(8432.6, 10_000, '2026-10-09').steps).toBe(8433)
    expect(buildWidgetSnapshot(-5, 10_000, '2026-10-09').steps).toBe(0)
  })

  it('meta inválida cae al default', () => {
    expect(buildWidgetSnapshot(10, 0, '2026-10-09').goal).toBe(DEFAULT_STEPS_GOAL)
    expect(buildWidgetSnapshot(10, -1, '2026-10-09').goal).toBe(DEFAULT_STEPS_GOAL)
  })
})

describe('pushWidgetSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no hace nada en web/PWA', async () => {
    getPlatformSpy.mockReturnValue('web')
    await pushWidgetSnapshot({ steps: 1, goal: 10_000, date: '2026-10-09' })
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('llama al plugin nativo en Android', async () => {
    getPlatformSpy.mockReturnValue('android')
    const payload = { steps: 8432, goal: 10_000, date: '2026-10-09' }
    await pushWidgetSnapshot(payload)
    expect(updateSpy).toHaveBeenCalledWith(payload)
  })

  it('no explota si el plugin falla (fire-and-forget)', async () => {
    getPlatformSpy.mockReturnValue('android')
    updateSpy.mockRejectedValueOnce(new Error('boom'))
    await expect(
      pushWidgetSnapshot({ steps: 1, goal: 10_000, date: '2026-10-09' }),
    ).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/data/widgetBridge.test.ts`
Expected: FAIL — cannot resolve `@/data/widgetBridge` (module does not exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/data/widgetBridge.ts`:

```ts
// Puente web → widget nativo (F84d): empaqueta el snapshot de pasos y lo empuja al
// plugin Android. En web/PWA es no-op: la feature existe solo en la app nativa.
import { Capacitor, registerPlugin } from '@capacitor/core'
import { DEFAULT_STEPS_GOAL } from '@/domain/stepsTracker'

export interface WidgetSnapshot {
  steps: number
  goal: number
  /** Fecha local YYYY-MM-DD del dato; el widget muestra 0 si no es la de hoy. */
  date: string
}

export interface GymLabWidgetPlugin {
  update(options: WidgetSnapshot): Promise<void>
}

// Plugin local de Android; el nombre debe coincidir con @CapacitorPlugin(name = "GymLabWidget").
const GymLabWidget = registerPlugin<GymLabWidgetPlugin>('GymLabWidget')

export const buildWidgetSnapshot = (
  stepsToday: number | undefined | null,
  goal: number,
  today: string,
): WidgetSnapshot => ({
  steps: Math.max(0, Math.round(stepsToday ?? 0)),
  goal: goal > 0 ? Math.round(goal) : DEFAULT_STEPS_GOAL,
  date: today,
})

// Fire-and-forget: si el plugin falla, el widget se queda con el último snapshot.
export const pushWidgetSnapshot = async (snapshot: WidgetSnapshot): Promise<void> => {
  if (Capacitor.getPlatform() !== 'android') return
  try {
    await GymLabWidget.update(snapshot)
  } catch (error) {
    console.warn('[widget] push failed', error)
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/data/widgetBridge.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Verify build and commit**

Run: `npm run build`
Expected: exit 0.

Repo flow: review cycle (candidate = workspace diff) → stage exact paths → commit:

```bash
git add src/data/widgetBridge.ts tests/unit/data/widgetBridge.test.ts
git commit -m "feat: puente web del widget de pasos (F84d)"
```

---

### Task 2: Web — WidgetSyncHost + AppShell wiring

**Files:**
- Create: `src/hooks/useWidgetSyncHost.ts`
- Modify: `src/components/layout/AppShell.tsx` (inside `DataHosts`, lines 32-36)

**Interfaces:**
- Consumes: `buildWidgetSnapshot`, `pushWidgetSnapshot` (Task 1); `stepRepo.getByDate/getGoal` (`@/data/repositories`); existing hook `useTodayStepEntry` is NOT reused here because the host also needs `goal`.
- Produces: `useWidgetSyncHost(): void` — mounted once in `AppShell`'s `DataHosts`; this is the single snapshot write path.

- [ ] **Step 1: Write the hook**

Create `src/hooks/useWidgetSyncHost.ts`:

```ts
// Host global (F84d): empuja el snapshot de pasos al widget nativo cuando cambian
// los datos de hoy o la meta, y al volver a primer plano. Una sola vía de envío.
import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { stepRepo } from '@/data/repositories'
import { toLocalDateStr } from '@/domain/dates'
import { buildWidgetSnapshot, pushWidgetSnapshot } from '@/data/widgetBridge'

const PUSH_DEBOUNCE_MS = 1000

export const useWidgetSyncHost = (): void => {
  const entry = useLiveQuery(() => stepRepo.getByDate(toLocalDateStr()), [])
  const goal = useLiveQuery(() => stepRepo.getGoal(), [])

  // Debounce: un sync + un registro seguidos generan un solo push.
  useEffect(() => {
    if (goal === undefined) return
    const timer = window.setTimeout(() => {
      void pushWidgetSnapshot(buildWidgetSnapshot(entry?.steps, goal, toLocalDateStr()))
    }, PUSH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [entry?.steps, goal])

  // Al volver a la app: re-empuja (cubre el cambio de día con la app en background).
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void pushWidgetSnapshot(buildWidgetSnapshot(entry?.steps, goal, toLocalDateStr()))
      }
    })
    return () => {
      void listener.then((handle) => handle.remove())
    }
  }, [entry?.steps, goal])
}
```

- [ ] **Step 2: Wire it into AppShell**

In `src/components/layout/AppShell.tsx`:
- Add import: `import { useWidgetSyncHost } from '@/hooks/useWidgetSyncHost'`
- Inside the existing `DataHosts` component (which already calls `useNotificationScheduling()` and `useHealthSyncHost()`), add one line:

```tsx
const DataHosts = () => {
  useNotificationScheduling()
  useHealthSyncHost()
  useWidgetSyncHost()
  return null
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: exit 0 (tsc + vite).

- [ ] **Step 4: Commit**

Repo flow: review cycle → exact paths → commit:

```bash
git add src/hooks/useWidgetSyncHost.ts src/components/layout/AppShell.tsx
git commit -m "feat: host que empuja los datos al widget de pasos (F84d)"
```

---

### Task 3: Web — deep link parse + handler (TDD)

**Files:**
- Create: `src/data/widgetDeepLinks.ts`
- Create: `src/hooks/useWidgetDeepLinks.ts`
- Modify: `src/components/layout/AppShell.tsx` (component body, near the other effects)
- Test: `tests/unit/data/widgetDeepLinks.test.ts`

**Interfaces:**
- Consumes: `@capacitor/app` (`getLaunchUrl`, `appUrlOpen`), `@capacitor/core` platform check, `react-router-dom` `useNavigate`.
- Produces: `WIDGET_PASSOS_URL = 'com.gymlab.app://pasos'` (string used by the native side too — keep it in sync with `WidgetRender.PASSOS_URL`, Task 5); `extractWidgetRoute(url: string | null | undefined): '/pasos' | null`; `useWidgetDeepLinks(): void`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/data/widgetDeepLinks.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { extractWidgetRoute } from '@/data/widgetDeepLinks'

describe('extractWidgetRoute', () => {
  it('reconoce el deep link del widget', () => {
    expect(extractWidgetRoute('com.gymlab.app://pasos')).toBe('/pasos')
    expect(extractWidgetRoute('com.gymlab.app:///pasos')).toBe('/pasos')
  })

  it('ignora URLs ajenas, vacías o inválidas', () => {
    expect(extractWidgetRoute('https://localhost/')).toBeNull()
    expect(extractWidgetRoute('')).toBeNull()
    expect(extractWidgetRoute(null)).toBeNull()
    expect(extractWidgetRoute(undefined)).toBeNull()
    expect(extractWidgetRoute('not a url')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/data/widgetDeepLinks.test.ts`
Expected: FAIL — cannot resolve `@/data/widgetDeepLinks`.

- [ ] **Step 3: Write the pure parser**

Create `src/data/widgetDeepLinks.ts`:

```ts
// Parseo del deep link del widget (F84d): com.gymlab.app://pasos → /pasos.
// Contraparte nativa: WidgetRender.PASSOS_URL (android/.../WidgetRender.java).
export const WIDGET_PASSOS_URL = 'com.gymlab.app://pasos'

export const extractWidgetRoute = (url: string | null | undefined): '/pasos' | null => {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const marker = `${parsed.host}${parsed.pathname}`.toLowerCase()
    return marker.includes('pasos') ? '/pasos' : null
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/data/widgetDeepLinks.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write the hook**

Create `src/hooks/useWidgetDeepLinks.ts`:

```ts
// Deep link del widget (F84d): al abrir la app desde el widget, navega a /pasos.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { extractWidgetRoute } from '@/data/widgetDeepLinks'

export const useWidgetDeepLinks = (): void => {
  const navigate = useNavigate()

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return
    const open = (url?: string | null) => {
      const route = extractWidgetRoute(url)
      if (route) navigate(route, { replace: true })
    }
    // Arranque en frío (la app se abrió desde el widget) + app ya corriendo (onNewIntent).
    void CapacitorApp.getLaunchUrl()
      .then((result) => open(result?.url))
      .catch(() => undefined)
    const listener = CapacitorApp.addListener('appUrlOpen', (event) => open(event.url))
    return () => {
      void listener.then((handle) => handle.remove())
    }
  }, [navigate])
}
```

- [ ] **Step 6: Wire it into AppShell**

In `src/components/layout/AppShell.tsx` (the `AppShell` component, after the `useLocation`/`useSettings` hooks):
- Add import: `import { useWidgetDeepLinks } from '@/hooks/useWidgetDeepLinks'`
- Call `useWidgetDeepLinks()` once in the component body (it only uses router context; does not depend on seeding).

- [ ] **Step 7: Verify build, then commit**

Run: `npm run build`
Expected: exit 0.

Repo flow: review cycle → exact paths → commit:

```bash
git add src/data/widgetDeepLinks.ts src/hooks/useWidgetDeepLinks.ts tests/unit/data/widgetDeepLinks.test.ts src/components/layout/AppShell.tsx
git commit -m "feat: deep link del widget hacia /pasos (F84d)"
```

---

### Task 4: Native — widget resources (colors, drawable, layouts, strings, provider info)

**Files:**
- Modify: `android/app/src/main/res/values/colors.xml`
- Modify: `android/app/src/main/res/values/strings.xml`
- Create: `android/app/src/main/res/drawable/widget_bg.xml`
- Create: `android/app/src/main/res/layout/widget_steps.xml`
- Create: `android/app/src/main/res/layout/widget_steps_mini.xml`
- Create: `android/app/src/main/res/xml/widget_steps_info.xml`
- Create: `android/app/src/main/res/xml/widget_steps_mini_info.xml`

**Interfaces:**
- Produces (resource IDs used by Task 5): layout ids `widget_root`, `widget_steps`, `widget_goal`, `widget_progress`, `widget_pct`, `widget_mini_root`, `widget_mini_steps`; colors `widget_bg/widget_text/widget_muted/widget_accent/widget_success/widget_track`; strings `widget_steps_name`, `widget_steps_mini_name`, `widget_label_steps`; info XMLs `@xml/widget_steps_info`, `@xml/widget_steps_mini_info` (referenced by Task 5's manifest).

- [ ] **Step 1: Add colors**

In `android/app/src/main/res/values/colors.xml`, inside `<resources>` (after `splash_background`):

```xml
    <!-- F84d: colores del widget nativo de pasos (fijos por decisión de producto). -->
    <color name="widget_bg">#121214</color>
    <color name="widget_text">#F4F4F2</color>
    <color name="widget_muted">#9C9C97</color>
    <color name="widget_accent">#D9B384</color>
    <color name="widget_success">#22C55E</color>
    <color name="widget_track">#2A2A28</color>
```

- [ ] **Step 2: Add strings**

In `android/app/src/main/res/values/strings.xml`, inside `<resources>`:

```xml
    <!-- F84d: widget de pasos. Copy en inglés por decisión de producto (la app sigue en es-ES). -->
    <string name="widget_steps_name">GymLab · Steps</string>
    <string name="widget_steps_mini_name">GymLab · Steps mini</string>
    <string name="widget_label_steps">STEPS</string>
    <string name="widget_steps_description">Steps today and goal progress</string>
    <string name="widget_steps_mini_description">Just today\'s step count</string>
```

- [ ] **Step 3: Create the background drawable**

Create `android/app/src/main/res/drawable/widget_bg.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="@color/widget_bg" />
    <corners android:radius="20dp" />
</shape>
```

- [ ] **Step 4: Create the big widget layout (2×2, layout A)**

Create `android/app/src/main/res/layout/widget_steps.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="14dp"
    android:background="@drawable/widget_bg">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="@string/widget_label_steps"
        android:textSize="9sp"
        android:textStyle="bold"
        android:textColor="@color/widget_muted"
        android:letterSpacing="0.12" />

    <TextView
        android:id="@+id/widget_steps"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="4dp"
        android:textSize="30sp"
        android:textStyle="bold"
        android:textColor="@color/widget_text" />

    <TextView
        android:id="@+id/widget_goal"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:textSize="11sp"
        android:textColor="@color/widget_muted" />

    <ProgressBar
        android:id="@+id/widget_progress"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="6dp"
        android:layout_marginTop="10dp"
        android:max="100"
        android:progressTint="@color/widget_accent"
        android:progressBackgroundTint="@color/widget_track" />

    <TextView
        android:id="@+id/widget_pct"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="6dp"
        android:gravity="end"
        android:textSize="12sp"
        android:textStyle="bold"
        android:textColor="@color/widget_accent" />
</LinearLayout>
```

- [ ] **Step 5: Create the mini widget layout (2×1)**

Create `android/app/src/main/res/layout/widget_steps_mini.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_mini_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="8dp"
    android:background="@drawable/widget_bg">

    <TextView
        android:id="@+id/widget_mini_steps"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="center"
        android:textSize="24sp"
        android:textStyle="bold"
        android:textColor="@color/widget_text" />
</FrameLayout>
```

- [ ] **Step 6: Create both provider-info XMLs**

Create `android/app/src/main/res/xml/widget_steps_info.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:initialLayout="@layout/widget_steps"
    android:description="@string/widget_steps_description"
    android:minWidth="110dp"
    android:minHeight="110dp"
    android:targetCellWidth="2"
    android:targetCellHeight="2"
    android:updatePeriodMillis="1800000"
    android:resizeMode="none"
    android:widgetCategory="home_screen" />
```

Create `android/app/src/main/res/xml/widget_steps_mini_info.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:initialLayout="@layout/widget_steps_mini"
    android:description="@string/widget_steps_mini_description"
    android:minWidth="110dp"
    android:minHeight="40dp"
    android:targetCellWidth="2"
    android:targetCellHeight="1"
    android:updatePeriodMillis="1800000"
    android:resizeMode="none"
    android:widgetCategory="home_screen" />
```

- [ ] **Step 7: Verify resources compile**

Run:

```powershell
npm run android:sync
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\android\gradlew.bat -p .\android assembleDebug
```

Expected: `BUILD SUCCESSFUL` (resources are compiled even before the providers exist; malformed XML fails here).

- [ ] **Step 8: Commit**

Repo flow: review cycle → exact paths → commit:

```bash
git add android/app/src/main/res/values/colors.xml android/app/src/main/res/values/strings.xml android/app/src/main/res/drawable/widget_bg.xml android/app/src/main/res/layout/widget_steps.xml android/app/src/main/res/layout/widget_steps_mini.xml android/app/src/main/res/xml/widget_steps_info.xml android/app/src/main/res/xml/widget_steps_mini_info.xml
git commit -m "feat: recursos nativos del widget de pasos (F84d)"
```

Note: if `npm run android:sync` rewrites `android/capacitor.settings.gradle` / `android/app/capacitor.build.gradle` with real `node_modules` paths, revert those files (`git checkout -- android/capacitor.settings.gradle android/app/capacitor.build.gradle`) — build noise, never committed (repo rule).

---

### Task 5: Native — shared renderer + both providers + manifest receivers

**Files:**
- Create: `android/app/src/main/java/com/gymlab/app/WidgetRender.java`
- Create: `android/app/src/main/java/com/gymlab/app/StepsWidgetProvider.java`
- Create: `android/app/src/main/java/com/gymlab/app/StepsMiniWidgetProvider.java`
- Modify: `android/app/src/main/AndroidManifest.xml` (inside `<application>`)

**Interfaces:**
- Consumes: Task 4 resources; `MainActivity.class` (exists).
- Produces: `WidgetRender.saveSnapshot(Context, int, int, String)`, `WidgetRender.refreshAll(Context)`, `WidgetRender.buildBigViews(Context)`, `WidgetRender.buildMiniViews(Context)` — Task 6's plugin calls `saveSnapshot` + `refreshAll`. `StepsWidgetProvider.ACTION_REFRESH = "com.gymlab.app.action.REFRESH_WIDGETS"` — used by Task 7's adb verification.

- [ ] **Step 1: Create the shared renderer**

Create `android/app/src/main/java/com/gymlab/app/WidgetRender.java`:

```java
package com.gymlab.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.net.Uri;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

// Render compartido de los widgets de pasos (F84d): resuelve el snapshot guardado
// (con guarda de día) y arma los RemoteViews de ambos tamaños desde un solo lugar.
final class WidgetRender {
    private static final String PREFS = "gymlab_widget";
    private static final String KEY_STEPS = "steps";
    private static final String KEY_GOAL = "goal";
    private static final String KEY_DATE = "date";
    private static final String KEY_UPDATED_AT = "updatedAt";
    private static final int DEFAULT_GOAL = 10_000;
    private static final int COLOR_GOLD = 0xFFD9B384;
    private static final int COLOR_GREEN = 0xFF22C55E;
    private static final int COLOR_TEXT = 0xFFF4F4F2;
    private static final int COLOR_TRACK = 0xFF2A2A28;
    // Contraparte web: WIDGET_PASSOS_URL en src/data/widgetDeepLinks.ts.
    private static final String PASSOS_URL = "com.gymlab.app://pasos";

    private WidgetRender() {}

    // Único punto de escritura del snapshot (lo llama el plugin; los providers solo leen).
    static void saveSnapshot(Context context, int steps, int goal, String date) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putInt(KEY_STEPS, steps)
            .putInt(KEY_GOAL, goal)
            .putString(KEY_DATE, date)
            .putLong(KEY_UPDATED_AT, System.currentTimeMillis())
            .apply();
    }

    // Redibuja ambos widgets desde el snapshot guardado (push del plugin y refresco manual).
    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        manager.updateAppWidget(new ComponentName(context, StepsWidgetProvider.class), buildBigViews(context));
        manager.updateAppWidget(new ComponentName(context, StepsMiniWidgetProvider.class), buildMiniViews(context));
    }

    static RemoteViews buildBigViews(Context context) {
        Resolved r = resolve(context);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_steps);
        int color = r.met ? COLOR_GREEN : COLOR_GOLD;
        views.setTextViewText(R.id.widget_steps, formatNumber(r.steps));
        views.setTextViewText(R.id.widget_goal, "of " + formatNumber(r.goal));
        views.setTextViewText(R.id.widget_pct, String.format(Locale.US, "%d%%", r.displayPct));
        views.setTextColor(R.id.widget_pct, color);
        views.setProgressBar(R.id.widget_progress, 100, r.fillPct, false);
        views.setProgressTintList(R.id.widget_progress, ColorStateList.valueOf(color));
        views.setProgressBackgroundTintList(R.id.widget_progress, ColorStateList.valueOf(COLOR_TRACK));
        views.setOnClickPendingIntent(R.id.widget_root, openAppIntent(context));
        return views;
    }

    static RemoteViews buildMiniViews(Context context) {
        Resolved r = resolve(context);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_steps_mini);
        views.setTextViewText(R.id.widget_mini_steps, formatNumber(r.steps));
        views.setTextColor(R.id.widget_mini_steps, r.met ? COLOR_GREEN : COLOR_TEXT);
        views.setOnClickPendingIntent(R.id.widget_mini_root, openAppIntent(context));
        return views;
    }

    // Lee el snapshot y aplica las reglas del spec (fecha vieja → 0; meta inválida → default).
    private static Resolved resolve(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        boolean fresh = today.equals(prefs.getString(KEY_DATE, null));
        int steps = fresh ? prefs.getInt(KEY_STEPS, 0) : 0;
        int goal = prefs.getInt(KEY_GOAL, DEFAULT_GOAL);
        if (goal <= 0) goal = DEFAULT_GOAL;
        return new Resolved(steps, goal);
    }

    // Formato inglés para el copy del widget (decisión de producto), sin importar el locale del device.
    private static String formatNumber(int value) {
        return String.format(Locale.US, "%,d", value);
    }

    // Tap → abrir la app en /pasos (el scheme ya está declarado en strings.xml y el manifest).
    private static PendingIntent openAppIntent(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(Uri.parse(PASSOS_URL));
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    // Valores ya resueltos para pintar: tope 100% en la barra, % real, verde si steps >= goal.
    private static final class Resolved {
        final int steps;
        final int goal;
        final int fillPct;
        final int displayPct;
        final boolean met;

        Resolved(int steps, int goal) {
            this.steps = steps;
            this.goal = goal;
            this.met = steps >= goal;
            this.fillPct = Math.min(100, Math.round(steps * 100f / goal));
            this.displayPct = Math.round(steps * 100f / goal);
        }
    }
}
```

- [ ] **Step 2: Create the big widget provider**

Create `android/app/src/main/java/com/gymlab/app/StepsWidgetProvider.java`:

```java
package com.gymlab.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;

// Widget grande 2×2 (F84d). Todo el render vive en WidgetRender.
public class StepsWidgetProvider extends AppWidgetProvider {
    // Refresco manual (debug/e2e):
    // adb shell am broadcast -n com.gymlab.app/.StepsWidgetProvider -a com.gymlab.app.action.REFRESH_WIDGETS
    static final String ACTION_REFRESH = "com.gymlab.app.action.REFRESH_WIDGETS";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetRender.refreshAll(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_REFRESH.equals(intent.getAction())) {
            WidgetRender.refreshAll(context);
        }
    }
}
```

- [ ] **Step 3: Create the mini widget provider**

Create `android/app/src/main/java/com/gymlab/app/StepsMiniWidgetProvider.java`:

```java
package com.gymlab.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;

// Widget mini 2×1 (F84d): solo el número de pasos. Todo el render vive en WidgetRender.
public class StepsMiniWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetRender.refreshAll(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (StepsWidgetProvider.ACTION_REFRESH.equals(intent.getAction())) {
            WidgetRender.refreshAll(context);
        }
    }
}
```

- [ ] **Step 4: Register both receivers in the manifest**

In `android/app/src/main/AndroidManifest.xml`, inside `<application>`, right after the `MainActivity` `</activity>` closing tag (line 22):

```xml
        <!-- F84d: widgets nativos de pasos (provider + metadata por tamaño). -->
        <receiver
            android:name=".StepsWidgetProvider"
            android:exported="true"
            android:label="@string/widget_steps_name">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_steps_info" />
        </receiver>
        <receiver
            android:name=".StepsMiniWidgetProvider"
            android:exported="true"
            android:label="@string/widget_steps_mini_name">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/widget_steps_mini_info" />
        </receiver>
```

- [ ] **Step 5: Verify it compiles**

Run:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\android\gradlew.bat -p .\android assembleDebug
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 6: Commit**

Repo flow: review cycle → exact paths → commit:

```bash
git add android/app/src/main/java/com/gymlab/app/WidgetRender.java android/app/src/main/java/com/gymlab/app/StepsWidgetProvider.java android/app/src/main/java/com/gymlab/app/StepsMiniWidgetProvider.java android/app/src/main/AndroidManifest.xml
git commit -m "feat: render y providers nativos del widget de pasos (F84d)"
```

---

### Task 6: Native — push plugin + MainActivity registration + deep-link intent-filter

**Files:**
- Create: `android/app/src/main/java/com/gymlab/app/GymLabWidgetPlugin.java`
- Modify: `android/app/src/main/java/com/gymlab/app/MainActivity.java`
- Modify: `android/app/src/main/AndroidManifest.xml` (intent-filter inside `MainActivity`)

**Interfaces:**
- Consumes: `WidgetRender.saveSnapshot/refreshAll` (Task 5); plugin name must match Task 1's `registerPlugin<GymLabWidgetPlugin>('GymLabWidget')`; JS method `update({steps, goal, date})`.
- Produces: the running push path and the deep-link entry point used by Task 7.

- [ ] **Step 1: Create the Capacitor plugin**

Create `android/app/src/main/java/com/gymlab/app/GymLabWidgetPlugin.java`:

```java
package com.gymlab.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Puente JS → nativo (F84d): recibe el snapshot y redibuja ambos widgets al instante.
@CapacitorPlugin(name = "GymLabWidget")
public class GymLabWidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        Integer steps = call.getInt("steps");
        Integer goal = call.getInt("goal");
        String date = call.getString("date");
        if (steps == null || goal == null || date == null) {
            call.reject("steps, goal and date are required");
            return;
        }
        WidgetRender.saveSnapshot(getContext(), steps, goal, date);
        WidgetRender.refreshAll(getContext());
        call.resolve();
    }
}
```

- [ ] **Step 2: Register the plugin in MainActivity**

Modify `android/app/src/main/java/com/gymlab/app/MainActivity.java` — add the registration as the FIRST line of `onCreate` (must run before `super.onCreate`):

```java
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // F84d: plugin local del widget (debe registrarse antes de super.onCreate).
        registerPlugin(GymLabWidgetPlugin.class);
        super.onCreate(savedInstanceState);
        // ... resto del método existente SIN cambios (long-press del WebView)
    }
```

Do not touch the existing long-press code.

- [ ] **Step 3: Add the deep-link intent-filter**

In `android/app/src/main/AndroidManifest.xml`, INSIDE the `MainActivity` `<activity>` element, after the existing MAIN/LAUNCHER `<intent-filter>` (line 21):

```xml
            <!-- F84d: deep link del widget (com.gymlab.app://pasos) → la web navega a /pasos. -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="com.gymlab.app" android:host="pasos" />
            </intent-filter>
```

- [ ] **Step 4: Build, install and boot**

Run the recipe from "Emulator verification recipe" (steps 1-3).
Expected: `BUILD SUCCESSFUL`; app boots; `document.getElementById('root').children.length > 0` via CDP; 0 `pageerror`.

- [ ] **Step 5: Commit**

Repo flow: review cycle → exact paths → commit:

```bash
git add android/app/src/main/java/com/gymlab/app/GymLabWidgetPlugin.java android/app/src/main/java/com/gymlab/app/MainActivity.java android/app/src/main/AndroidManifest.xml
git commit -m "feat: plugin nativo y deep link del widget (F84d)"
```

---

### Task 7: Emulator end-to-end verification

**Files:**
- No new files expected. Fixes go into the files from Tasks 1-6 (new commits).

**Interfaces:**
- Consumes: everything above; `ACTION_REFRESH` broadcast (Task 5).

- [ ] **Step 1: Rebuild + reinstall with the final web bundle**

Run the full recipe (`npm run android:sync` → `assembleDebug` → `install -r` → launch).

- [ ] **Step 2: Place both widgets and verify the empty state**

On the emulator home screen: long-press an empty area → Widgets → drag **GymLab · Steps** and **GymLab · Steps mini** onto the home screen.
Expected (before the app has pushed anything): big widget shows `STEPS` / `0` / `of 10,000` / bar empty / `0%`; mini shows `0`.
Capture a screenshot via the recipe's screencap+pull to confirm.

- [ ] **Step 3: Verify the push path**

Open the app, wait for seeding, then register steps manually in `/pasos` (or let the health sync write). Within ~1 second the widgets must show the new numbers (no waiting for 30 min).
Also inspect the stored snapshot:

```powershell
& $adb shell run-as com.gymlab.app cat shared_prefs/gymlab_widget.xml
```

Expected: `steps`, `goal`, `date` (today), `updatedAt`.

- [ ] **Step 4: Verify the goal-met state**

Set today's steps ≥ goal (e.g. 12,000 via manual entry).
Expected: big widget shows `12,000` / bar full / `120%` with bar and percent in green `#22C55E`; mini shows `12,000` in green.

- [ ] **Step 5: Verify the fallback refresh path (no 30-min wait)**

```powershell
& $adb shell am broadcast -n com.gymlab.app/.StepsWidgetProvider -a com.gymlab.app.action.REFRESH_WIDGETS
```

Expected: both widgets re-render from the stored snapshot (values unchanged; no crash). This simulates the `updatePeriodMillis` wake.

- [ ] **Step 6: Verify day-guard (stale snapshot → 0)**

Optional but recommended: change the emulator date to tomorrow (Settings → System → Date & time, disable automatic), then run the broadcast from Step 5.
Expected: both widgets show `0` / `0%` (not yesterday's numbers). Restore the date and refresh again.

- [ ] **Step 7: Verify the deep link (tap → /pasos)**

a) App running on another route: tap either widget → the app comes to the foreground at `/pasos` (verify `location.pathname` via CDP).
b) Cold start: force-stop (`am force-stop`), then tap the widget → app opens directly at `/pasos`.
c) Direct intent check:

```powershell
& $adb shell am start -a android.intent.action.VIEW -d "com.gymlab.app://pasos" com.gymlab.app
```

Expected: `/pasos` active, 0 `pageerror`.

- [ ] **Step 8: Record results and commit any fixes**

Write the observed results (values, screenshots) in the task notes. If anything needed fixing, commit the fix with its own `fix: ... (F84d)` commit after the repo review flow. If no fixes, no commit in this task.

---

### Task 8: Docs close — PLAN, CHANGELOG, follow-ups

**Files:**
- Modify: `PLAN.md` (section "Fase 84 — … (archivada salvo 84d — widget)" and the pending table row at line 33, plus `#21` reference at line 74)
- Modify: `CHANGELOG.md` (`[Unreleased]` → `Added`)
- Modify: `COMPLETED.md` (line 119 note: 84d no longer pending)
- Modify: `docs/superpowers/specs/2026-10-09-f84d-widget-nativo-design.md` (status → Implemented, if the phase closes)

**Interfaces:**
- Consumes: final verification results from Task 7.
- Produces: closed phase 84 (Android side).

- [ ] **Step 1: Update PLAN.md**

- `### [ ] Fase 84d — Widget Nativo` → `### [x] Fase 84d — Widget Nativo (Android)`; check the Android items (`AppWidgetProvider` + `RemoteViews`, tap → `/pasos`, tsc + build + commit). The iOS item stays unchecked with an explicit `(bloqueado: sin macOS)` note.
- Line 33 table row for `84d — widget nativo`: remove it (no longer pending) or leave a done reference.
- Line 74 (`#21` item): `F84d ⛔ (widget, bloqueado)` → `F84d ✅ (Android)`.
- Add follow-ups: "editor de meta de pasos (futura implementación)" and "widget se adapta al tema/paleta del usuario (futuro)".

- [ ] **Step 2: Update CHANGELOG.md**

Under `[Unreleased]` → `Added`: entry for F84d — two Android home-screen widgets (2×2 with steps/goal/progress/percent + goal-met green; 2×1 steps-only), instant push via local Capacitor plugin + 30-min system fallback, tap opens `/pasos`; English widget copy; commits list.

- [ ] **Step 3: Update COMPLETED.md**

Update the F84 note (line ~119) so it no longer says 84d is pending; reference the new commits.

- [ ] **Step 4: Commit**

Database/docs-only change (passive): stage exact paths → commit:

```bash
git add PLAN.md CHANGELOG.md COMPLETED.md docs/superpowers/specs/2026-10-09-f84d-widget-nativo-design.md
git commit -m "docs: cierra F84d - widget nativo Android (F84)"
```

---

## Self-review notes (for the implementer)

- Spec coverage: data flow (Tasks 1-2, 6), refresh fallback (Tasks 4-5, 7 step 5), deep link (Tasks 3, 6, 7 step 7), visual rules incl. goal-met green (Tasks 4-5, 7 step 4), edge cases (Task 5 `resolve()` + Task 7 steps 2/6), testing/verification (Tasks 1/3 unit + Task 7 emulator).
- Manual step allowance: placing widgets on the launcher (Task 7 step 2) may be done by hand on the emulator; everything else is scriptable.
- No placeholders: every code file and XML is complete in its task; commands include expected results.
