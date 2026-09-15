# Proposal: Fase 95 — Gamification & Celebration (GymLab)

## Intent

Achievements unlock silently behind a binary `checkAchievements` (all-or-nothing), the shared workout photo never shows PRs (`prCount` hardcoded 0), and celebration is a single 12-piece confetti modal. This change makes progress visible (X/Y bars), turns the photo into a shareable Strava-style card, and amplifies celebration with haptics + local cosmetic medal variants — the confirmed engagement loop from PLAN.md Fase 95, built incrementally **95.3 → 95.2 → 95.1**. Explicitly NOT a gacha: no coins, no random draws, no ticket economy.

## Scope

### In Scope
- **95.3** Declarative `ACHIEVEMENT_PROGRESS` (id → measure+target) extracted from `checkAchievements` literals; pure `achievementProgress(id, stats)` → `{current, target, completed}`; per-card bar + general bar on `/logros` (optional tier weighting); per-achievement "current" semantics for non-monotonic targets.
- **95.2** Canvas redesign (`SessionImageExport.tsx`, 1080×1080, 2–3 selectable templates, hero with date + workout name, stat tiles); fix `WorkoutDetail.tsx:119` `prCount=0`; photo surface decision (post-save and/or history detail) at design.
- **95.1** Amplified celebration on `AchievementModal` (bigger confetti burst, haptics via existing `vibrate()`, pulse — reduced-motion guarded); CSS-first medal variants persisted in `meta.collectibles` `{achievementId, variantId}`; deterministic variant grant (re-earn milestone recommended).
- Unit tests per domain change; e2e for bar/photo/celebration flows.

### Out of Scope
- Currency/coins, random draws, ticket economy, backend/Supabase.
- New dependencies (animejs ^3.2.2, @capacitor/haptics ^8.0.2 already installed).
- AI art assets (deferred to Phase 94 pipeline as static `public/` files, non-blocking).
- Photo text/annotation editing; schema migrations (meta JSON keys only).
- Fixing `guias-completas` (never evaluated) beyond giving it a declared progress measure.

## Capabilities

### New Capabilities
- `achievement-progress`: per-achievement declarative targets + pure progress derivation + bars
- `session-photo-export`: Strava-style canvas photo templates + export/share
- `achievement-celebration`: amplified celebration + collectible medal variants

### Modified Capabilities
None — `openspec/specs/` has no achievement/session specs.

## Approach

1. **95.3** Extract `ACHIEVEMENT_PROGRESS` from literals in `achievements.ts:203–263`; `checkAchievements` consumes the map (single source of truth). Measure = same value the unlock condition tests, defined per id: rachas → `longestStreak`; `consistencia-4s` → current consistent-week run; `volumen-semanal` → max weekly volume; `primer-ano` → days-since-first capped 365. `useAchievements` exposes derived stats (workouts, prs, streak, unique exercises, weekly volume). Bars follow `StepDailyChallenge` pattern (`role="progressbar"`, aria-valuenow/min/max), mirroring `calculateProgress` (`challenges.ts`).
2. **95.2** Extend `prepareSessionImage`/`SessionImageData` (workout name, real `prCount`); redesign `renderToCanvas` with template variants; fix the `WorkoutDetail` caller; optionally mount the component post-save (`SessionSummaryView`).
3. **95.1** Amplify `AchievementModal` (burst, haptics via `src/lib/feedback.ts`, pulse); define variants in `AchievementMedal` (CSS tone/shine, no assets); persist via `metaRepo` `collectibles` key. AI art swaps in later via F94 pipeline.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/achievements.ts` | Modified | `ACHIEVEMENT_PROGRESS` map; `checkAchievements` reads it; measure for all 15 ids (incl. `primera-cardio`, `guias-completas`) |
| `src/hooks/useAchievements.ts` | Modified | Expose derived stats; persist/reload `meta.collectibles` |
| `src/pages/AchievementsPage.tsx` | Modified | General bar in header + per-card bar in `AchievementCard` |
| `src/domain/sessionImage.ts` | Modified | `SessionImageData` extras (workout name); real prCount |
| `src/components/session/SessionImageExport.tsx` | Modified | Template redesign, 2–3 variants |
| `src/components/workout/WorkoutDetail.tsx` | Modified | Fix `prCount=0` caller |
| `src/components/workout/SessionSummaryView.tsx` | Modified | Photo export surface (design decision) |
| `src/components/achievements/AchievementModal.tsx` | Modified | Amplified celebration + haptics |
| `src/components/achievements/AchievementMedal.tsx` | Modified | CSS variant tones/shine |
| `src/data/repositories/dexie/metaRepo.ts` | Modified | `collectibles` key access (`getJson`/`setJson`) |
| `tests/unit/domain/achievementProgress.test.ts` + `tests/e2e/test_f95.py` | New | Tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `guias-completas` unearned + `primera-cardio` condition equals `primer-paso` (bug) | Med | Map covers all 15 ids; spec fixes cardio condition, declares guide measure |
| Non-monotonic "current" ambiguity (streak, consistency, first-year) | Med | Per-achievement measure = unlock-condition value, stated per id in spec |
| `prCount` hidden in photo | Low | Fixed in 95.2, asserted by e2e |
| Canvas text/font variance across devices | Low | system-ui only, no new deps, explicit pixel measurement |
| CSS-only variants perceived as low value | Med | Polished variant set now; Phase 94 art later, non-blocking |
| Celebration noise / motion | Med | Single queue, skippable, `prefers-reduced-motion` guard mandatory |

**Open decisions** (resolve in spec/design, non-blocking): variant grant trigger (recommended: re-earn milestone via existing `achievementCounts`); photo primary surface (recommend both history detail and post-save).

## Rollback Plan

Additive only: remove `ACHIEVEMENT_PROGRESS`/progress functions props, revert canvas template and modal changes, drop the `collectibles` meta key (recreated on next save). No migrations, no data loss.

## Dependencies

- None — animejs and `@capacitor/haptics` already in the stack; no package changes.

## Success Criteria

- [ ] Progress bar renders per achievement card and general bar on `/logros`, exposing `role="progressbar"` semantics for all 15 achievements.
- [ ] `achievementProgress` is pure and unit-tested; `checkAchievements` derives targets from the shared map.
- [ ] Photo export shows real PR count; 2–3 templates selectable; download/share work.
- [ ] Celebration fires at most one at a time, is skippable, vibrates on native, and is inert under `prefers-reduced-motion`.
- [ ] Collectible variants persist across reloads (IndexedDB) with no backend.
- [ ] `npm test`, `npm run build`, and `test_f95.py` e2e pass.