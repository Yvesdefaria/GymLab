# F84d — Native Android Steps Widget (Design)

- **Date:** 2026-10-09
- **Status:** Implemented (2026-10-09): per-candidate reviews + emulator E2E complete; see the plan and `PLAN.md`. Design approved by the product owner (brainstorming + grill, 2026-10-09).
- **Phase:** F84d — last open item of Phase 84 (84a–84c, 84e, 84f, 84g are archived in `COMPLETED.md`; 84d was left parked pending design).
- **Scope decision:** **Android only.** iOS (WidgetKit) remains blocked (no macOS to build/verify) and stays documented as out of scope.

## 1. Context

GymLab is a local-first fitness app (React 18 + Vite + TypeScript) wrapped with Capacitor 8 for Android. The steps pipeline already exists:

- Dexie v15 store `dailySteps` (`src/data/repositories/dexie/db.ts`); record shape `DailyStepsEntry` (`src/domain/types.ts:252-263`): `{ id, localDate, steps, distanceKm, calories, source, syncedAt }`.
- Writes: manual via `useStepData.recordSteps` → `stepRepo.upsert` (`src/hooks/useStepData.ts:47-53`); health sync via `src/data/stepsSync.ts` (`bulkUpsert` at `:105-108`), triggered on app open/foreground (F108 design; `src/data/healthSyncController.ts`, `src/hooks/useHealthSyncHost.ts`).
- Goal: meta key `stepsGoal`, default `DEFAULT_STEPS_GOAL = 10_000` (`src/domain/stepsTracker.ts:8`); `stepRepo.getGoal/setGoal` (`src/data/repositories/dexie/stepRepo.ts:84-89`). **No screen edits the goal today** (`setGoal` has no UI consumer).
- The app defines "goal met" as `steps >= goal`; the ring in `/pasos` clamps at 100% while the center number shows the real value (`src/components/steps/StepCircularProgress.tsx:31-36,81-83`).
- Native project: `android/` is **Java-only** (`MainActivity.java`), no Kotlin toolchain, `minSdk 26` / `targetSdk 36`, `appcompat 1.7.1` available. There is **no widget/receiver/preferences infrastructure** today. `custom_url_scheme=com.gymlab.app` exists in `res/values/strings.xml` but is unused; there is no deep-link handling anywhere.

## 2. Goal & locked product decisions

Two home-screen widgets (Android):

1. **GymLab · Steps** — fixed 2×2 ("layout A"): top label `STEPS`; steps number (real value); `of {{goal}}`; horizontal progress bar; percent.
2. **GymLab · Steps mini** — fixed 2×1: only the steps number, centered.

Copy is in **English** by explicit product decision (the rest of the app remains es-ES): `STEPS`, `of 10,000`; numbers use English grouping (`8,432`). No "updated at" timestamp.

Visual rules (fixed style; no app-side configuration in v1):

- Dark background `#121214`; near-white primary text; accent gold `#d9b384` (bar fill and percent while the goal is not met); muted gray for secondary text.
- Goal met (`steps >= goal`): bar fill and percent (big widget) and the number (mini widget) turn success green `#22c55e`. **Amendment (2026-10-09):** on API 26–30 the bar keeps the static gold tint (RemoteViews tint transport via `setColorStateList` requires API 31+); the percent text is green on all APIs. Accepted carve-out.
- Bar fill caps at 100%; steps number and percent show real values (percent may exceed 100%, e.g. `120%`; percent is rounded to integer, mirroring the app's `Math.round`).
- Both widgets have fixed size (no user resize), and no preview image in v1 (the launcher falls back to the app icon).
- Tapping anywhere on either widget opens the app at `/pasos`.

Data & refresh model:

- **Push:** a tiny native Capacitor plugin receives a snapshot whenever the app writes data and redraws the widgets **immediately** (host debounce ~1 s; end-to-end redraw measured ~1–2 s on the emulator; the product requirement is ≤30 s).
- **Fallback:** the system wakes each widget ~every 30 min (`updatePeriodMillis = 1800000`) and it re-renders from the last stored snapshot. This is not a data source — it is robustness (day rollover, reboot, launcher restarts).
- Accepted boundary: with the app closed, no new data exists (health sync only runs when the app opens/foregrounds — F108 decision); widgets keep showing the last snapshot until the app runs again.

Out of scope for this phase, recorded as future work: steps-goal editor UI; widget adapting to the user's theme/palette; iOS; background health reader; widget preview images; resize support; streak or extra metrics.

## 3. Architecture

```
┌──────────────────────── App (WebView) ─────────────────────────┐
│ Dexie liveQuery (today's entry + goal)                         │
│    └─> WidgetSyncHost ──(debounced ~1s)──> widgetBridge.push() │
└─────────────────────────────┬──────────────────────────────────┘
                              │ Capacitor plugin call
┌─────────────────────────────▼──────────────────────────────────┐
│ Android (app process)                                          │
│ GymLabWidgetPlugin.update({steps, goal, date})                 │
│   ├─ writes SharedPreferences                                  │
│   └─ AppWidgetManager.updateAppWidget(both providers)          │
│ StepsWidgetProvider / StepsMiniWidgetProvider (RemoteViews)    │
│   └─ read prefs → render (date-guard, goal-met color)          │
└────────────────────────────────────────────────────────────────┘
Tap: PendingIntent → MainActivity (VIEW, com.gymlab.app://pasos)
     → web: appUrlOpen / getLaunchUrl → router navigate('/pasos')
```

### 3.1 Snapshot storage (native)

App-private `SharedPreferences` (e.g. name `gymlab_widget`): `steps:int`, `goal:int`, `date:String` (local `YYYY-MM-DD`), `updatedAt:Long` (epoch millis; debug-only — the renderer never reads it; amendment 2026-10-09). If absent, widgets render `0` with the default goal `10,000`.

Render rules (shared by both providers):

- `date != today(local)` → render `0` steps, `0%`.
- `met = steps >= goal`; bar fill = `min(steps/goal, 1)`; percent display = `round(steps/goal*100)`, uncapped.
- Numbers are formatted with `Locale.US` grouping (`8,432`) regardless of device locale.

### 3.2 Push plugin

- Java class `GymLabWidgetPlugin` (`@CapacitorPlugin(name = "GymLabWidget")`), registered in `MainActivity.onCreate` via `registerPlugin(...)`. Single method `update({ steps, goal, date })` that:
  1. persists the snapshot to SharedPreferences, and
  2. calls a shared renderer for both providers and `updateAppWidget`.
- A small shared helper (e.g. `WidgetRender`) builds the `RemoteViews` for each layout from the stored snapshot; the providers also call it from `onUpdate` (fallback wake).
- Failure behavior: fire-and-forget from the web side; JS guards with `Capacitor.getPlatform() === 'android'` and logs/swallows errors (widget keeps the last snapshot).

### 3.3 Web side

- `src/data/widgetBridge.ts` — `pushWidgetSnapshot({ steps, goal, date })`: no-op on web; calls the plugin on Android. Uses `toLocalDateStr` from `src/domain/dates.ts` for `date`.
- `src/hooks/useWidgetSyncHost.ts` (name indicative) — mounted with the other data hosts in `AppShell`:
  - Dexie liveQuery: today's entry (`stepRepo.getByDate(today)`) + goal (`stepRepo.getGoal()`).
  - On change: debounce ~1 s → push.
  - On `appStateChange` resume: push (cheap; keeps the widget fresh across day changes).
- This is the **single write path**, so it automatically covers manual entries, health-sync writes, and any future goal editor.

### 3.4 Deep link (tap → /pasos)

- `AndroidManifest.xml`: add an intent-filter to `MainActivity` for `VIEW` + `DEFAULT` + `BROWSABLE` with `scheme="com.gymlab.app"` and `host="pasos"` (the scheme string already exists as `custom_url_scheme`).
- Each widget's root view gets a `PendingIntent` (immutable) launching `MainActivity` with data URI `com.gymlab.app://pasos` (explicit component for reliability).
- Web: a small handler mounted in `AppShell` calls `App.getLaunchUrl()` once and subscribes to `App.addListener('appUrlOpen', ...)`; when the URL refers to `pasos`, it navigates with the router to `/pasos` (`replace`). No-op on web/PWA. Uses `@capacitor/app` (already installed).

### 3.5 Native resources

- Layouts: `res/layout/widget_steps.xml` (2×2), `res/layout/widget_steps_mini.xml` (2×1).
- Provider info: `res/xml/widget_steps_info.xml`, `res/xml/widget_steps_mini_info.xml` — `updatePeriodMillis=1800000`; sizes (`minWidth/minHeight` ≈ 110dp/110dp and 110dp/40dp; `targetCellWidth/Height` = 2/2 and 2/1 for API 31+); fixed resize; `widgetCategory="home_screen"`.
- `res/values/strings.xml`: widget picker names `GymLab · Steps` and `GymLab · Steps mini`.
- Manifest: two `<receiver>` entries with the `APPWIDGET_UPDATE` intent-filter, plus the deep-link intent-filter on `MainActivity`.

## 4. Edge cases

| Case | Behavior |
|---|---|
| No snapshot (app never opened) | `0`, goal `10,000`, `0%`, gold |
| Snapshot from a previous day | `0`, `0%`, gold |
| `steps >= goal` | bar 100%, percent real (e.g. `120%`), green state |
| Percent rounding near the goal (e.g. 9,950/10,000) | displays `100%` (round) but the state stays "not met" (strict `>=`) — accepted; mirrors app rounding |
| Goal ≤ 0 | impossible via repo (clamped ≥ 1); renderer treats invalid/absent goal as `10,000` |
| Reboot / app update | prefs persist; the 30-min wake re-renders |
| App data cleared | no prefs → `0` |
| Multiple instances of a widget | all render the same snapshot |
| Web/PWA (no native) | every piece no-ops; nothing breaks |
| App closed | last snapshot; updates within ~1 s after the app opens again |

## 5. Testing & verification

Unit (vitest, web):

- Payload builder for the bridge: normalization (missing entry → `0`; goal fallback `10,000`; `date` from `toLocalDateStr`) and rounding rules (percent `round`, bar cap).
- Deep-link URL parsing (with `@capacitor/app` mocked).

Emulator (mandatory — native change, per repo `AGENTS.md`):

1. `npm run android:sync` + `gradlew assembleDebug` + install on the running AVD.
2. Place both widgets on the home screen; verify rendering (screenshot) against the app's `/pasos` data.
3. Push test: register steps in the app → widget updates within ~1 s (no waiting).
4. Goal-met test: data ≥ goal → green state on both widgets.
5. Day-guard test: stale `date` renders `0`.
6. Fallback test: force a widget update via `adb shell am broadcast -n com.gymlab.app/.StepsWidgetProvider -a android.appwidget.action.APPWIDGET_UPDATE` (exact component names finalized in the implementation plan) instead of waiting 30 min.
7. Deep link: tap the widget → app opens at `/pasos`; also cold-start check; CDP verifies the route and zero `pageerror`.

Standard gates: `npm run build`, `npm test`, clean exact-path staging; commit without push (repo convention).

## 6. Risks & notes

- `updatePeriodMillis` is inexact under Doze — fallback only, by design.
- Editing `MainActivity.java` coexists with the pending R3-001 mailto advisory (`PLAN.md:27`) — keep the edit minimal.
- Java-only is deliberate: no Kotlin toolchain will be added (one less build surface).
- `cap sync` can regenerate `android/capacitor.settings.gradle` paths — build noise, never committed.
- Push update is immediate while the app process is alive; "under 1 s" is a device expectation, not a guarantee under system pressure.
