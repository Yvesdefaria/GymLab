# Achievement Progress Specification

## Purpose

Achievement progress is currently binary (unlocked or not), with targets inlined in `checkAchievements` and no visible X/Y. This capability adds declarative per-achievement targets and a pure progress derivation, rendered as an accessible progress bar per card plus a general bar on `/logros`. `checkAchievements` derives its targets from the same declarative map (single source of truth).

## Requirements

### Requirement: Declarative progress map

The system MUST expose a declarative map covering all 15 achievement ids (`primer-paso`, `inaugural`, `racha-4`, `racha-8`, `racha-16`, `primera-marca`, `volumen-semanal`, `sesiones-50`, `consistencia-4s`, `primera-cardio`, `ejercicios-100`, `pr-10kg`, `guias-completas`, `sesiones-500`, `primer-ano`), each declaring its target and "current" measure. `checkAchievements` MUST derive every evaluated target from this map, not inline literals.

#### Scenario: Map covers all ids

- GIVEN the 15-id achievement catalog
- WHEN the progress map is built
- THEN every id resolves to a `{current, target}` definition
- AND a unit test asserts the map has exactly those 15 ids

### Requirement: Pure progress derivation

The system MUST expose a pure, deterministic function `achievementProgress(id, stats)` returning `{current, target, completed}`: `current` is the unlock-condition value clamped to `target`; `completed` is `current >= target`. It MUST be free of I/O and React.

#### Scenario: Partial progress

- GIVEN `stats` with longest streak 12
- WHEN `achievementProgress('racha-16', stats)` runs
- THEN it returns `{current: 12, target: 16, completed: false}`

#### Scenario: Completed achievement

- GIVEN `stats` with 500 workouts
- WHEN `achievementProgress('sesiones-500', stats)` runs
- THEN it returns `{current: 500, target: 500, completed: true}`

#### Scenario: No data

- GIVEN empty `stats`
- WHEN `achievementProgress('sesiones-50', stats)` runs
- THEN it returns `{current: 0, target: 50, completed: false}` (never `NaN`)

### Requirement: Per-achievement "current" semantics

For each id, `current` MUST equal the value its unlock condition tests:

| id | current | target |
|---|---|---|
| primer-paso | completed-set count | 1 |
| inaugural | workout count | 1 |
| racha-4 / racha-8 / racha-16 | longest streak (weeks) | 4 / 8 / 16 |
| primera-marca | PR count | 1 |
| volumen-semanal | max weekly volume (kg) | 10 000 |
| sesiones-50 / sesiones-500 | workout count | 50 / 500 |
| consistencia-4s | longest run of consecutive training weeks | 4 |
| primera-cardio | completed sets on cardio-category exercises | 1 |
| ejercicios-100 | unique completed-exercise count | 100 |
| pr-10kg | max first-to-last PR delta per exercise (kg) | 10 |
| guias-completas | guides marked completed | total guides available |
| primer-ano | elapsed days since first workout | 365 |

For non-monotonic ids, `current` MUST be the historical best (longest streak, longest consistent-week run, max weekly volume, max PR delta) or elapsed days for `primer-ano`, so bars never regress and always match the unlock value.

#### Scenario: Non-monotonic streak

- GIVEN `stats` with longest streak 9 and current streak 2
- WHEN `achievementProgress('racha-8', stats)` runs
- THEN `current` is 9 (historical best), keeping the earned bar full

#### Scenario: First-year cap

- GIVEN first workout 400 days ago
- WHEN `achievementProgress('primer-ano', stats)` runs
- THEN it returns `{current: 365, target: 365, completed: true}` (capped)

### Requirement: `primera-cardio` real condition

The unlock condition for `primera-cardio` MUST require at least one completed set whose exercise is categorized `cardio` — not merely any completed set (current behavior duplicates `primer-paso`).

#### Scenario: Cardio set completes

- GIVEN a completed set on a cardio-category exercise
- WHEN achievements are evaluated
- THEN `primera-cardio` is earned and its progress shows 1/1

#### Scenario: Strength set does not

- GIVEN completed sets on strength exercises only
- WHEN achievements are evaluated
- THEN `primera-cardio` is NOT earned and its progress shows 0/1

### Requirement: `guias-completas` declared measure

`guias-completas` MUST declare its measure (guides marked completed; target = total available guides). No guide-completion signal exists yet, so its current value is 0 and this change MUST NOT grant the unlock; the id MUST still render in the map and bar.

#### Scenario: Covered but unearned

- GIVEN any `stats`
- WHEN `achievementProgress('guias-completas', stats)` runs
- THEN it returns `{current: 0, target: <guide count>, completed: false}`

### Requirement: Per-card progress bar

Each achievement card on `/logros` MUST render a progress bar with `role="progressbar"`, `aria-valuenow`, `aria-valuemin` and `aria-valuemax` showing `current`/`target`, following the existing `calculateProgress` pattern; completed cards show the full state.

#### Scenario: Accessible partial bar

- GIVEN a card with progress 3/50
- WHEN the card renders
- THEN the bar exposes `role="progressbar"` with `aria-valuenow="3"` and `aria-valuemax="50"`

### Requirement: General progress bar

The `/logros` header MUST render a general progress bar of unlocked/total achievements (out of 15); tier weighting MAY be applied.

#### Scenario: General bar reflects unlocks

- GIVEN 7 unlocked achievements
- WHEN `/logros` renders
- THEN the header bar shows 7/15 with progressbar semantics

### Requirement: i18n for progress strings

All new progress UI strings (e.g. the "X de Y" label) MUST ship es and en keys (es is the typed source of truth).

#### Scenario: Both locales present

- GIVEN a new progress label
- WHEN the locale is `es` or `en`
- THEN the string resolves without fallback-key warnings