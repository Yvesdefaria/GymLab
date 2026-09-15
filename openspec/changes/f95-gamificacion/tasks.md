# Tasks: F95 Gamificación y celebración

## Review Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,750 (720/625/440) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1→2→3 (95.3→95.2→95.1) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | 95.3 map+bars | PR 1 | progress tests | seeded `/logros` | revert map/hook/page |
| 2 | 95.2 templates+prCount | PR 2 | session+prs tests | post-save+history | revert session+caller |
| 3 | 95.1 variants+queue | PR 3 | collectibles tests | re-earn+reduced | revert variants/modal |

## Phase 1: 95.3 Progress domain

- [x] 1.1 RED: write `gymlab-app/tests/unit/domain/achievementProgress.test.ts` (15 ids; empty/partial/complete; `racha-8` best 9; `primer-ano` cap 365; `guias-completas` unearned; cardio 0 strength-only; gaps 6/7/8; no NaN) — commit `a6e4e0f`
- [x] 1.2 GREEN: create `gymlab-app/src/domain/achievementProgress.ts` (`ACHIEVEMENT_PROGRESS` 15 ids `MeasureKey`+target+`targetFrom`; `AchievementStats`; `deriveAchievementStats` `now`+categories `'strength'` fallback+week run+max volume+PR delta+day clamp; `achievementProgress`; `progressForAll`) — commit `a6e4e0f`
- [x] 1.3 REFACTOR: `gymlab-app/src/domain/achievements.ts` (`checkAchievements(stats)` walks map; drop `hasFourConsistentWeeks`+literals; real cardio; pure `primer-ano`) — commit `3e1ef09`
- [x] 1.4 Update `gymlab-app/tests/unit/domain/achievements.test.ts` to stats-bag (strength-only earns no cardio) — commit `3e1ef09`

## Phase 2: 95.3 Gallery bars

- [x] 2.1 Create `gymlab-app/src/hooks/useAchievementProgress.ts` (queries workouts/prs/sets/categories/guides → stats → `progressForAll`) — commit `25d973b` (collectibles son scope 95.1)
- [x] 2.2 Refactor `gymlab-app/src/hooks/useAchievements.ts` (stats bag sets/categories/`now`/`guideCount`; order counts→snapshot→`setUnlocked`) — commit `25d973b`
- [x] 2.3 `gymlab-app/src/pages/AchievementsPage.tsx` (per-card progressbar min0/max/now + general bar /15) — commit `0a57f3e`
- [x] 2.4 i18n `achievements.progress.*` in `gymlab-app/src/i18n/locales/es/core.ts` + `en/core.ts` (el bloque `achievements` vive en core, no features) — commit `0a57f3e`
- [x] 2.5 Create `gymlab-app/tests/e2e/test_f95.py` (part 1·seeded aria) — commit `d27d7e3`, harness ALL OK

## Phase 3: 95.2 Photo domain

- [x] 3.1 RED: extend `gymlab-app/tests/unit/domain/sessionImage.test.ts` (name default/routine, templates) + `gymlab-app/tests/unit/domain/prs.test.ts` (`countPrsInWorkout` window/null finishedAt/same-day) — commit `5b764dd`
- [x] 3.2 GREEN: `gymlab-app/src/domain/sessionImage.ts` (`SessionImageData.workoutName`; `prepareSessionImage(..., workoutName='')`; `SESSION_IMAGE_TEMPLATES` `classic|hero|compact` default `classic`; `PhotoTemplateLabelKey`; `resolveWorkoutName`) — commit `5b764dd`
- [x] 3.3 GREEN: `gymlab-app/src/domain/prs.ts` (`countPrsInWorkout` counts `[startedAt, finishedAt]`) — commit `5b764dd`

## Phase 4: 95.2 Hook, templates, surfaces

- [x] 4.1 Create `gymlab-app/src/hooks/useSessionPhotoData.ts` (workout/sets/names/routine title; `prCount` prop wins else `countPrsInWorkout`) — commit `b241d19`
- [x] 4.2 `gymlab-app/src/components/session/SessionImageExport.tsx` (chip selector ≥44px re-renders; extract `sessionTemplates.ts` near cap) — commit `b241d19`
- [x] 4.3 Fix `gymlab-app/src/components/workout/WorkoutDetail.tsx:119` (hook-fed prCount, drop 0) — commit `e9f4861`
- [x] 4.4 `gymlab-app/src/components/workout/SessionSummaryView.tsx` (mount export with `summary.prCount`) — commit `e9f4861`
- [x] 4.5 i18n `share.freeWorkout` + `share.template.*` in `es/features.ts` + `en/features.ts` — commit `b241d19`
- [x] 4.6 `test_f95.py` part 2 (post-save PR matched; history real; switch re-renders; share/download) — commit `2ba7b83`, harness ALL OK

## Phase 5: 95.1 Variants+celebration

- [x] 5.1 RED: write `gymlab-app/tests/unit/domain/achievementCollectibles.test.ts` (count 1 none; 2→index 0; clamp; idempotent; empty) — commit `1b48a16`
- [x] 5.2 GREEN: `gymlab-app/src/domain/achievementCollectibles.ts` (`Collectible`, `ACHIEVEMENT_VARIANTS` ≤3, `grantedCollectibles(counts)` index count−2, `mergeCollectibles`, `latestCollectible`, `latestVariants`; re-export desde `gymlab-app/src/domain/achievements.ts` por cap ~200 líneas) — commit `1b48a16` + `57bcdbd`
- [x] 5.3 `gymlab-app/src/hooks/useAchievements.ts` (persist counts→snapshot→collectibles before `setUnlocked`; `newGranted`) — commit `c1a2c34`
- [x] 5.4 `gymlab-app/src/components/achievements/AchievementModal.tsx` (index queue, advance en botón/Escape/backdrop; confetti 28 vía `CONFETTI_PIECES`+`stagger` en `gymlab-app/src/lib/animations.ts`; vibrate en advance() por política de gesto del navegador; todo reduced-motion gated) — commit `9da2f9c` + `7111fe0`
- [x] 5.5 `gymlab-app/src/components/achievements/AchievementMedal.tsx` (`variant` prop, `VARIANT_TONES`, aria tier+variant localizado) — commit `9da2f9c`
- [x] 5.6 Consumers: `gymlab-app/src/pages/AchievementsPage.tsx` + `gymlab-app/src/components/profile/ChapasSection.tsx` + `gymlab-app/src/pages/PerfilPage.tsx` render `collectibles` (vía `useAchievementProgress.collectibles` + `latestVariants`); modal muestra la variante concedida — commit `57bcdbd`
- [x] 5.7 i18n `achievements.collectibles.*`+`newVariant`+`queue.progress` en `gymlab-app/src/i18n/locales/es/core.ts`+`en/core.ts` — commit `9da2f9c`
- [x] 5.8 `test_f95.py` part 3 (galería variants+reload sin doble grant; cola 1 de 4 con avance Escape/botón; reduced-motion con variante nueva) — commit `7111fe0`, harness ALL OK