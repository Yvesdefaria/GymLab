# Design — F95 Gamificación y celebración

## Decision context

- Change: `f95-gamificacion` — three capabilities: `achievement-progress` (95.3), `session-photo-export` (95.2), `achievement-celebration` (95.1).
- Execution mode: `auto`. Artifact store: `both` (this file + Engram topic `sdd/f95-gamificacion/design`).
- Delivery strategy: `ask-on-risk`. Review budget: 800 lines.
- Build order (from exploration): 95.3 → 95.2 → 95.1. 95.1's collectibles effect rides on top of the 95.3 stats refactor, so 95.3 lands first.

## Constraints and non-goals

- Offline-first (Dexie/IndexedDB); no new dependencies (animejs ^3.2.2, @capacitor/haptics ^8.0.2 already installed).
- `prefers-reduced-motion` is mandatory for every animation and every haptic.
- Capability B (AI art, F94) is NON-BLOCKING: variants are CSS-first now; static art can be dropped in later behind the same variant ids.
- Architecture: UI → hooks → repositories → Dexie; `domain/` stays pure (no React, no Dexie, no `Date.now()` without injection, no i18n imports).
- Component < ~80 lines, file < ~200 lines; i18n es-ES is the typed source of truth, `en` mirrors every key.
- Out of scope: tier-weighted gallery, celebration sound, cross-surface template preference persistence (see decisions), per-workout PR history timeline.

## Verified context (source of truth for this design)

- `src/domain/achievements.ts` (266 lines) — `ACHIEVEMENTS` (15 ids), `ACHIEVEMENT_TIERS`, binary `checkAchievements(workouts, prs, completedSets, streak)` with inline literals, `nextAchievementCounts` (counts/signature swap). Bugs found:
  - `primera-cardio` (lines ~228-229) uses the exact condition of `primer-paso` (`sets.some((s) => s.completed)`); the hook feeds "fake" sets (one entry per exercise id, no `exerciseId` source, no category), so it cannot detect cardio. Confirmed by reading the full file.
  - `primer-ano` uses `Date.now()` internally (impure, untestable).
  - `guias-completas` declared but never evaluated (`useGuides` exposes static `getAll`/`getBySlug` only; `Guide` has no completion signal; current = 0).
  - `hasFourConsistentWeeks(dates)` — any week with a session, gap === 7 is consecutive; generalizes into a run counter.
- `src/hooks/useAchievements.ts` — live queries (workouts, prs, completed sets), `calcStreak`, 600 ms debounce, persists `meta.unlockedAchievements` / `achievementCounts` / `achievementSnapshot`, then `setUnlocked`; exposes `{ achievements, dismiss, counts }`. `AchievementsHost` lazily mounts `AchievementModal` with the full array — no queue.
- `src/components/achievements/` — `AchievementModal` (12-piece confetti, animejs pulse loop, popScale, accessible, reduced-motion aware), `AchievementMedal` (CSS/SVG medal per tier + ×N count), no variant support anywhere.
- `src/pages/AchievementsPage.tsx` — unlocked + locked medal lists with ×N; header `unlocked.length/15`; no progress bars. Fed by `AchievementsRoute` (live queries on the two meta keys + step days).
- `src/components/profile/ChapasSection.tsx` + `PerfilPage` — render `AchievementMedal` with `count`; need a `variant`/collectibles path for variants to show in Perfil too.
- `src/domain/sessionImage.ts` — `SessionImageData { date, duration, volume, exercises, prCount, appName }` (NO name); `prepareSessionImage(workout, sets, exerciseNames, prCount)`.
- `src/components/session/SessionImageExport.tsx` — 1080×1080 canvas, single template, download + share.
- `src/components/workout/WorkoutDetail.tsx:119` — hardcodes `prCount = 0` when calling `prepareSessionImage`.
- `src/data/workoutSession.ts:111` — save-time truth: `prCount: newPRs.length` (from `detectPRsFromSets`); consumed by `SessionSummaryView` via `EntrenamientoPage.tsx:91` `summary.prCount`. `SessionSummaryView` does NOT mount the photo exporter today.
- `src/domain/prs.ts` — `detectPRsFromSets(sets, existingPRs)` sets `date: set.createdAt` (sets are persisted with `createdAt = finishedAtISO`). `PRRecord { exerciseId, weightKg, reps, date, estimated1RM }` — one row PER EXERCISE (upsert), no `workoutId`.
- `src/domain/types.ts` — `Workout { id, startedAt, finishedAt, routineId: number | null, routineDayId, localDate, notes, totalVolume }`; `Exercise.category?: ExerciseCategory` (`'strength' | 'stretch' | 'cardio' | 'mobility'`, fallback `'strength'`); `Guide { id, slug, title, ... }` no completion field.
- `src/domain/workouts.ts:18` — `weeklyVolume` is last-7-days; the achievements use CALENDAR-week groups via `weekStartKey`, keep that semantics for `volumen-semanal`.
- `routineRepo.getById` — routine title resolution for the photo name; `metaRepo.getJson/setJson` — JSON key-value (collectibles live here); `exerciseRepo.getByIds` — scoped category lookup; `guideRepo.getAll` — guide count.
- `src/lib/feedback.ts` — haptics/beeps via Capacitor Haptics + WebAudio (reduced-motion guard applied at call site).
- `src/lib/animations.ts` — `prefersReducedMotion()`, `confetti` (12 pieces, already guarded), `pulse`, `popScale`.
- Tests: `tests/unit/domain/*.test.ts` (vitest, factories `makeWorkout`/`makeSet`); e2e `tests/e2e/test_<fase>.py` via `with_server.py`.

---

## 95.3 — achievement-progress

### Decision D95.3.1: declarative progress map in a NEW pure domain file

`achievements.ts` is at 266 lines (near the file cap). Create `src/domain/achievementProgress.ts`:

```ts
export type MeasureKey =
  | 'workoutCount' | 'completedSetCount' | 'prCount' | 'longestStreak'        // count-based
  | 'maxWeeklyVolume' | 'longestConsistentWeekRun'                            // non-monotonic best
  | 'cardioSetCount' | 'uniqueExerciseCount' | 'maxPrDeltaKg'                 // non-monotonic best
  | 'daysSinceFirstWorkout'                                                   // capped running value
  | 'completedGuidesCount'                                                    // guide milestone

export interface AchievementTarget {
  measure: MeasureKey
  target: number
  targetFrom?: 'guideCount'   // dynamic target (guias-completas)
}

// All 15 ids from ACHIEVEMENTS. Single source of truth for current/target/completed.
export const ACHIEVEMENT_PROGRESS: Readonly<Record<string, AchievementTarget>>
```

Rationale: one pure map replaces 15 inline boolean literals and makes `checkAchievements` a mechanical walk over the map. `targetFrom: 'guideCount'` keeps `guias-completas` dynamic without baking repo calls into the domain.

### Decision D95.3.2: `AchievementStats` bag + `deriveAchievementStats` (pure, injected `now`)

```ts
export interface AchievementStats {
  workoutCount: number
  completedSetCount: number
  prCount: number                 // prs.length
  longestStreak: number           // from calcStreak
  maxWeeklyVolume: number         // max over weekStartKey groups of totalVolume
  longestConsistentWeekRun: number
  cardioSetCount: number
  uniqueExerciseCount: number
  maxPrDeltaKg: number            // max over exercises of (best1RM_now − best1RM_before), 0 when no prior
  daysSinceFirstWorkout: number   // clamp(0, 365)
  guideCount: number
  completedGuidesCount: number    // 0 today; no completion signal exists
}

export const deriveAchievementStats: (input: {
  workouts: Workout[]
  prs: PRRecord[]
  completedSets: WorkoutSet[]          // REAL sets, each with exerciseId, completed, weightKg, reps, category resolved
  exerciseCategories: ReadonlyMap<number, ExerciseCategory>   // from exerciseRepo, fallback 'strength'
  guideCount: number
  streak: StreakResult
  now: Date                           // hook passes Date.now(); tests pass a fixed date
}) => AchievementStats
```

Details:
- `longestConsistentWeekRun(dates: string[])` — generalization of `hasFourConsistentWeeks` (same gap === 7 rule) returning the longest run; `hasFourConsistentWeeks` is deleted from `achievements.ts`.
- `maxWeeklyVolume` — calendar-week groups (`weekStartKey` + `localDateOf`), NOT `weeklyVolume` from workouts.ts.
- `maxPrDeltaKg` — same delta algorithm already in `checkAchievements` (best 1RM per exercise now vs first known), moved here; 0 when no prior record.
- `daysSinceFirstWorkout` — floor of `(now − first workout)` days, clamped to 0..365.
- `cardioSetCount` — completed sets whose category === `'cardio'` OR `durationSeconds > 0` (defensive: seeded sets with a missed category). This is the `primera-cardio` fix.
- `exerciseCategories` — built by the CALLER (hook) so the domain stays pure. The hook resolves distinct exercise ids of completed sets via `exerciseRepo.getByIds`, falling back to `'strength'` for missing ids.

### Decision D95.3.3: `achievementProgress` + `checkAchievements` re-slotted on the map

```ts
export interface AchievementProgress {
  id: string
  current: number    // clamped to [0, target] — non-monotonic measures never regress the bar
  target: number     // guideCount when targetFrom === 'guideCount'
  completed: boolean // current >= target
}

export const achievementProgress: (id: string, stats: AchievementStats) => AchievementProgress
export const progressForAll: (stats: AchievementStats) => Record<string, AchievementProgress>
```

`checkAchievements` (kept exported from `achievements.ts` so call sites don't churn) becomes `checkAchievements(stats: AchievementStats): string[]` — walks `ACHIEVEMENT_PROGRESS`, returns ids with `completed` that were still locked per `meta.unlockedAchievements`. `nextAchievementCounts` stays unchanged (counts + signature swap) and evaluates against the same stats.

Hook-side changes (`useAchievements.ts`):
- Build real `completedSets` (the persisted `WorkoutSet[]` — they carry `exerciseId`, `weightKg`, `reps`, `completed`, `durationSeconds`), resolving categories per D95.3.2, instead of the current synthetic per-exercise entries.
- Pass `now: Date` and `guideCount` (from `guideRepo.getAll().length`).
- Persistence order stays: counts → snapshot → (NEW collectibles, see 95.1) → `setUnlocked`.
- Expose `collectibles` and `progress` for consumers; `dismiss` unchanged.

### Decision D95.3.4: gallery bars surface

New hook `src/hooks/useAchievementProgress.ts` — standalone live queries (workouts, prs, completed sets, exercise categories, guides) → `deriveAchievementStats` → `progressForAll`, plus `collectibles` (`meta.collectibles` live query). Used by `AchievementsRoute` only; the page stays presentational:

- `AchievementsPage` gains `progress: Record<string, AchievementProgress>` + `collectibles: Collectible[]`.
- Each card renders progress via `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax={target}`, `aria-valuenow={current}` (WCAG 2.2 pattern already used in `RachasSection`).
- General bar in the header: `unlockedIds.length / ACHIEVEMENTS.length` with the same semantics.
- Locked cards show `current / target`; non-monotonic measures show the historical best (bar never moves backward).
- i18n keys (es source + en mirror): `achievements.progress.aria*`, `achievements.progress.unlockedIn`, `achievements.progress.pending`.

Tests: `tests/unit/domain/achievementProgress.test.ts` — map covers all 15 ids; each measure: empty / partial / complete / cap 365 / dynamic guide target / cardio fix / consecutive-run gaps (6,7,8 days) / non-monotonic never regresses. e2e: gallery bars expose correct aria values for a seeded profile.

---

## 95.2 — session-photo-export

### Decision D95.2.1: photo data gains `workoutName`

`SessionImageData` (domain/sessionImage.ts) adds `workoutName: string`; `prepareSessionImage(workout, sets, exerciseNames, prCount, workoutName)` appends it (default `''` for domain safety).

Callers resolve the name BEFORE calling (domain stays pure):
- `workout.routineId != null` → `routineRepo.getById(workout.routineId)?.title`
- fallback → localized generic label `t('share.freeWorkout')` (new key, both locales).

### Decision D95.2.2: PR count for HISTORY — `countPrsInWorkout` (pure)

`WorkoutDetail.tsx:119` hardcodes 0. Add to `src/domain/prs.ts`:

```ts
// PRs whose record date falls inside the workout window (sets are persisted with PR.date = workout.finishedAt).
export const countPrsInWorkout: (
  workout: { startedAt: string; finishedAt: string | null },
  prs: PRRecord[]
) => number
```

Rationale: `PRRecord` has no `workoutId` (verified); the save-time `detectPRsFromSets` stamps `date: set.createdAt` — exactly the workout's `finishedAt`. Counting records inside `[startedAt, finishedAt]` is exact for the history surface and unit-testable. Limitation (documented in tests): if a LATER workout re-beats the same exercise's PR, the record date moves out of the earlier window — the earlier photo then shows fewer PRs; acceptable because the post-save summary always uses the exact save-time `summary.prCount`.

Usage:
- `SessionSummaryView` (post-save): keep `summary.prCount` prop (exact, already wired at `EntrenamientoPage.tsx:91`).
- `WorkoutDetail` (history): replace hardcoded 0 with `countPrsInWorkout(workout, [...prMap.values()])`.

### Decision D95.2.3: template system (2–3 templates) with per-surface local selection

- `PhotoTemplateId = 'classic' | 'hero' | 'compact'`; domain config `SESSION_IMAGE_TEMPLATES: { id, labelKey }[]` (labelKey → `t('share.template.<id>')`), default `'classic'`.
- `SessionImageExport` keeps its contract (`data` + optional `initialTemplate`); internal `useState<PhotoTemplateId>`; selector renders as chips (≥44×44 tap target), switching re-renders the canvas.
- Persistence decision: component-local state only, `initialTemplate` prop for callers that want a fixed default. NO meta key — cross-surface template memory is out of scope (zero migration, spec only requires a default when none is selected). A future `useSettings`-style preference can adopt it without a schema change.
- Rendering: the three layouts share the existing measuring/asset-helper code inside `SessionImageExport`; layout switch is a pure function of template id. New file stays under ~200 lines; if layout code grows, extract `sessionTemplates.ts` (pure canvas drawing, still UI-side — canvas is not domain).

### Decision D95.2.4: shared data hook `useSessionPhotoData`

Both surfaces need the same assembly (workout + sets + nameById + routine title + prCount). New `src/hooks/useSessionPhotoData.ts`:

```ts
useSessionPhotoData: (workoutId: number, prCount?: number) => SessionImageData | null
```

- Live-loads workout/sets (`useWorkout`), names (`exerciseRepo.getByIds`), routine title; `prCount` prop wins when provided (post-save), otherwise `countPrsInWorkout`.
- `SessionSummaryView` mounts `SessionImageExport` fed by this hook with the existing `summary.prCount`; `WorkoutDetail` mounts it via the same hook (prCount derived). Removes the duplication of two ad-hoc loaders.

Tests: update `tests/unit/domain/sessionImage.test.ts` (name + defaults), new template/layout cases for `prepareSessionImage`; `tests/unit/domain/prs.test.ts` for `countPrsInWorkout` (inside window, outside, null finishedAt, same-day two workouts). e2e `test_f95.py`: post-save photo shows PR count == saved PRs; history photo shows the same for a fresh workout; template switch re-renders and keeps share/download working.

---

## 95.1 — achievement-celebration

### Decision D95.1.1: sequential queue inside the modal

`AchievementsHost` keeps passing the full array; `AchievementModal` gains internal `index` state:
- Renders ONE achievement at a time, in arrival order.
- Every dismiss path (close button, Escape, backdrop, primary action) advances `index`; after the last one, calls `onClose` (parent dismiss).
- No stack, no auto-advance timer (user-driven per spec; reduced-motion users are never force-advanced).

### Decision D95.1.2: amplified celebration, haptics once per modal-open

- `src/lib/animations.confetti` gains a `pieces` param (default keeps current behavior); modal triggers ~28 pieces on each queue item becoming visible.
- Haptics: `vibrate([30, 40, 30])` (from `src/lib/feedback.ts`) fires EXACTLY ONCE per modal-open (one per queue item, on visibility), guarded by `prefersReducedMotion()` at the call site — reduced motion ⇒ no haptics, no confetti.
- Icon pulse: keep the existing animejs loop (it is the announced pulse; already reduced-motion guarded). No new looping animation.
- Existing modal tests + e2e assert: each unlock fires exactly one burst; skip-tap advances; final dismiss closes.

### Decision D95.1.3: CSS-first medal variants, deterministic grants

New pure code (stays near `nextAchievementCounts` in `achievements.ts`):

```ts
export type Collectible = { achievementId: string; variantId: string }
export const ACHIEVEMENT_VARIANTS: Readonly<Record<string, string[]>> // fixed sequence per id (≤3), empty = base only

// Deterministic and idempotent: pure function of counts (re-earn milestones).
export const grantedCollectibles: (counts: Record<string, number>) => Collectible[]
// variant index = count - 2, clamped to the sequence (count 1 ⇒ none, 2 ⇒ index 0, 3 ⇒ 1, …)
```

- Persistence: `meta.collectibles` (JSON array) via `metaRepo.getJson/setJson`; in `useAchievements` the effect writes counts → snapshot → collectibles BEFORE `setUnlocked` (persisted before the modal shows). Because `grantedCollectibles` is a pure function of `counts`, a reload can never double-grant (same counts ⇒ same set ⇒ idempotent union).
- `useAchievements` also returns `newGranted: Collectible[]` (delta computed in the same effect) so the modal can announce "new variant earned".
- `AchievementMedal` gains optional `variant?: string` — tone mapping `VARIANT_TONES: Record<string, string>` (pure CSS classes: border/gradient/sheen by variant id, no images → F94 art can be dropped in later behind the same ids). `aria-label` includes the variant name via `t('achievements.collectibles.<variantId>')`.
- Consumers: `AchievementsPage` (collectibles from `useAchievementProgress`), `ChapasSection`/`PerfilPage` (new `collectibles` prop), `AchievementModal` (variant shown when `newGranted` contains the current id).

Tests: `tests/unit/domain/achievementCollectibles.test.ts` (milestone indexes, clamping, idempotence, empty counts). e2e: re-earn → variant appears in gallery and Perfil; no duplicate grants after reload.

---

## Cross-capability data flow

```
persisted sets + prs + workouts + guides + streak
        │  (hook injects now + exerciseCategories + guideCount)
        ▼
deriveAchievementStats (pure) ──► ACHIEVEMENT_PROGRESS map ──► achievementProgress (bars)
        │                                                          │
        └──► checkAchievements(stats) ──► nextAchievementCounts ──► grantedCollectibles ──► meta.collectibles
                                                                        │
        post-save summary.prCount  ──► useSessionPhotoData ──► SessionImageData(+workoutName) ──► SessionImageExport(templates)
        history: countPrsInWorkout ──┘
```

## Dependency graph

1. `domain/achievementProgress.ts` (+ tests) — no deps.
2. `useAchievements` refactor (stats input, categories, now, guideCount) + `dominio` checkAchievements shrink — depends on 1.
3. `domain/prs.countPrsInWorkout` + `domain/sessionImage` (name, templates config) (+ tests) — no deps.
4. `SessionImageExport` template selector + `useSessionPhotoData` — depends on 3.
5. `WorkoutDetail` + `SessionSummaryView` wiring — depends on 4.
6. `achievements.ts` variants + `grantedCollectibles` (+ tests) — no deps (can start in parallel with 3).
7. `useAchievements` collectibles persistence + `newGranted` — depends on 2 (order) and 6.
8. `AchievementModal` queue + amplification — depends on 7 (for variant announcement) and 1 (no).
9. `AchievementMedal` variant + `AchievementsPage` bars + `ChapasSection` prop — depends on 8 and `useAchievementProgress` (95.3 gallery).
10. i18n keys (es + en) land with each capability.

Execution order: 95.3 (1→2, gallery via `useAchievementProgress`) → 95.2 (3→4→5) → 95.1 (6→7→8→9). Task planner may parallelize 3 and 6 (independent), but commits stay one-task-one-commit.

## Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| PR window ambiguity for same-day workouts | window = exact ISO `[startedAt, finishedAt]`; PR.date == workout.finishedAt; covered by unit test |
| `primer-ano` impure / flaky | `now` injected through the whole chain; tests use fixed dates |
| `useAchievements` signature change ripple | stats bag passed in one param; e2e suite gates the refactor |
| Canvas template divergence | shared layout helpers; unknown id falls back to `classic` |
| Double-grant on reload | collectibles = pure fn of counts (idempotent); persisted before modal shows |
| i18n drift es/en | es typed source of truth; every new key mirrored in `en/features.ts` |
| File size caps | new domain files hold the map/stats/variants; modal/surface split if > ~80 lines |
| Reduced-motion compliance | confetti/vibrate/pulse all gated behind `prefersReducedMotion()`; e2e smoke covers a skip-tap path |

## Open questions for tasks phase

- None blocking. Nice-to-have (deferred): tier-weighted general bar; template preference in settings; static variant art behind `VARIANT_TONES`.