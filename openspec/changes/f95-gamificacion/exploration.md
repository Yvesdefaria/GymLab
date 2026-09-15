# Exploration: Fase 95 — Gamificación y celebración (GymLab)

Maps to `gymlab-app/PLAN.md` "### Fase 95 — Gamificación y celebración (engagement)" (95.1 gacha/celebración, 95.2 foto del día Strava-style, 95.3 barra de progreso en logros). Scope: exploration only. No code changed, no dependencies installed.

## Current State

- **Achievements domain** — `src/domain/achievements.ts`: 15 static achievements with tier map (`ACHIEVEMENT_TIERS`: bronze/silver/gold/platinum). `checkAchievements()` returns ONLY the earned list — **binary unlock, no partial progress**. Targets are inline literals (`workouts.length >= 50`, `>= 16` streak, `WEEKLY_VOLUME_THRESHOLD = 10_000`, `uniqueExercises.size >= 100`...). `nextAchievementCounts` tracks re-earn counts (`meta.achievementCounts`), NOT progress toward a target. Partial-progress bug: `primera-cardio` uses the same condition as `primer-paso` (`sets.some(completed)`), not cardio categories.
- **Reactive watcher** — `src/hooks/useAchievements.ts`: global useLiveQuery over workouts/PRs/completed sets; 600 ms debounce; persists only IDs (`meta.unlockedAchievements`), counts and snapshot. Returns `{ achievements, dismiss, counts }`. Hosted in AppShell via `src/components/achievements/AchievementsHost.tsx` (lazy).
- **Celebration ALREADY EXISTS** — `src/components/achievements/AchievementModal.tsx`: 12-piece confetti (theme colors) + animejs icon pulse loop + popScale button; accessible (role=dialog, initial focus, Escape, aria-labelledby) and `prefersReducedMotion`-aware. Confetti is custom via `src/lib/animations.ts` (`confetti`, `popScale`, `prefersReducedMotion`) — **no confetti package installed**; animejs ^3.2.2 is in the stack and used across ~13 files, all reduced-motion guarded.
- **Medals** — `src/components/achievements/AchievementMedal.tsx`: CSS/SVG coin per tier (conic/radial gradients), lucide icons (AGENTS.md: no emoji as icons). No image assets.
- **Progress-bar patterns already exist** — `src/domain/challenges.ts` `calculateProgress()` → `{current, target, completed}` (exact X/Y shape); `src/domain/streak.ts` `nextStreakBadge()` → `{target, remaining}` consumed by `RachasSection.tsx` (role="progressbar" + aria-valuenow/min/max). `AchievementsPage.tsx` shows only a text `unlocked/total`; `StepAchievementsGallery` shows text count; `StepDailyChallenge` has a full progressbar.
- **Session image export** — `src/components/session/SessionImageExport.tsx`: 1080×1080 canvas, dark #121214 bg, accent border, appName + date, 3 stats (duration/volume/PRs), up to 8 exercises (name + sets×weight), footer; PNG download + `navigator.share` fallback. Data via `prepareSessionImage` (`src/domain/sessionImage.ts`). Used ONLY in `src/components/workout/WorkoutDetail.tsx` with **`prCount` hardcoded to 0** (gap: PRs never render). Post-session screen `SessionSummaryView` shows a ProgressRing but no image export.
- **Fase 94 context (PLAN.md)** — AI image assets planned as static WebP/SVG in `public/images/` (<50 KB, offline-first, generation tool outside the repo). `public/` today: logos, routines jpgs, exercise jpgs; no achievement art yet.

## Affected Areas

- `src/domain/achievements.ts` — extract inline targets into declarative progress map + pure `achievementProgress()` (95.3, and gacha-variant grounding for 95.1).
- `src/hooks/useAchievements.ts` — surface the derived stats (workouts.length, prs.length, longestStreak, unique exercises, weekly volume) needed by progress/gacha; persist collected variants for 95.1.
- `src/pages/AchievementsPage.tsx` + `AchievementCard` — per-achievement progress bar + general bar (X/Y, tier-weighted option).
- `src/components/session/SessionImageExport.tsx` + `src/domain/sessionImage.ts` — template redesign, extra fields (workout/routine name, notes), fix prCount=0 caller.
- `src/components/achievements/AchievementModal.tsx` / `src/lib/animations.ts` — richer celebration (bigger burst, haptics via installed `@capacitor/haptics`), reduced-motion guarded.
- `src/components/workout/WorkoutDetail.tsx` — pass real `prCount` (and possibly move/duplicate the export surface into post-save flow).

## Approaches

### 95.1 — Celebrar + gacha (adictivo, sin ruido)
1. **Cosmetic gacha, offline-first (recommended)** — a pull (free, tied to milestones: 1 per completed session, capped; no currency) awards a *variant* of an existing medal: alternate metal tone / shine / texture (CSS-only first), persisted as `meta.collectibles` array `{achievementId, variantId}`. Rarity-weighted (bronze > silver > gold > platinum). Later, Fase 94 AI art becomes collectible cards in `public/images/` — zero runtime network, PWA-safe. Pros: no deps, offline-first, reuses modal, real collection hook. Cons: initial perceived value is low (color variants only); needs a noise cap and skip affordance.
2. **Richer celebration only (no gacha)** — full-screen transient overlay: bigger confetti burst, haptic (installed), medal card, auto-dismiss. Pros: simplest, zero economy. Cons: loses the "want to come back" collection loop.
3. **Ticket economy (earn pulls via streaks/sessions)** — Pros: strongest engagement. Cons: more UI/state surface, dark-pattern risk; conflicts with "sin monetización abusiva ni ruido".

### 95.2 — Foto del día (Strava-style)
1. **Canvas template redesign, no deps (recommended)** — keep the 1080×1080 canvas pipeline; new layout: hero band with date + workout/routine name, stat tiles, exercise list, brand footer; 2–3 selectable templates (toggle); fix `prCount=0`. Pros: zero dependencies, offline-first, low risk, fully testable in domain. Cons: manual layout/text measurement (no auto-layout); complex editing out of scope.
2. **DOM snapshot (html2canvas / dom-to-image)** — rich layout reusing Tailwind. Pros: easy design. Cons: new dependency (~+50 KB), text-rendering variance on devices, against the lean stack.
3. **SVG template → canvas** — Pros: vector, scalable. Cons: authoring complexity, font/background embedding.

### 95.3 — Progreso en logros (X/Y)
1. **Declarative targets + pure progress (recommended)** — extract `ACHIEVEMENT_PROGRESS` map (id → target + measure) from the literals inside `checkAchievements` (single source of truth); new pure `achievementProgress(id, stats)` → `{current, target, completed}` reusing stats already derived in `useAchievements`; render thin bar per `AchievementCard` + general bar in `/logros` header (unlocked/total, optionally tier-weighted). Pros: testable, mirrors existing `challenges`/`streak` patterns, unblocks 95.1 variants. Cons: several achievements are NOT monotonic counters (streak current-vs-longest, consistency weeks, first-year days) — "current" semantics must be defined per achievement.
2. **Persist progress in meta** — Pros: trivial display. Cons: derived data persisted (staleness risk), duplicated evaluation.
3. **Parse i18n condition strings** — fragile; rejected.

## Recommendation

Incremental: **95.3 first** (pure domain + bars; validated pattern, low risk, becomes the foundation for 95.1 rewards) → **95.2** (canvas template redesign + prCount fix) → **95.1** (celebration upgrade + cosmetic gacha, CSS-first variants, AI art later via Fase 94 pipeline).

## Risks

- **Gacha rewards without backend**: must stay cosmetic/local (CSS variants → static images in `public/`). Open decision: what action grants a pull and the anti-noise cap; no currency, no fake-value drops.
- **Noise/addiction**: one celebration at a time, skippable, no spam; `prefers-reduced-motion` guard already exists and must cover new animations.
- **`prCount` hardcoded 0** in `WorkoutDetail.tsx` — the "photo" currently never shows PRs; must be fixed in 95.2.
- **Non-monotonic progress**: define "current" per achievement (current vs longest streak, consistency, first-year) before designing bars.
- **Canvas fonts**: only system-ui today; if a Fase 94 AI brand needs custom typeface, embed it in canvas.
- **Surface decision**: celebration/photo after saving (`SessionSummaryView`) vs history detail (`WorkoutDetail`) — pick the primary surface in design.

## Ready for Proposal

Yes — exploration complete. Tell the user: three independent sub-features; recommend 95.3 → 95.2 → 95.1; the gacha must be cosmetic/local-first (no backend possible in MVP); the confetti/celebration base already exists.