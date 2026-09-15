# Achievement Celebration Specification

## Purpose

Celebration today is a single 12-piece confetti modal listing all newly unlocked achievements at once. This capability amplifies the celebration (bigger burst, haptics, pulse — all reduced-motion guarded), sequences multiple unlocks one at a time with skip, and adds deterministic local cosmetic medal variants persisted in `meta.collectibles`. Explicitly no currencies and no random draws.

## Requirements

### Requirement: Amplified celebration

When an achievement unlocks, the system MUST play an amplified celebration: a larger confetti burst than the current 12-piece one, haptic feedback via the existing `vibrate()` helper (native and web), and an icon pulse. Under `prefers-reduced-motion` the celebration MUST be inert — no confetti, no pulse, no haptics — while the modal remains fully usable and accessible.

#### Scenario: Unlock on native

- GIVEN an achievement unlock on a Capacitor platform
- WHEN the modal opens
- THEN a larger confetti burst plays and exactly one haptic burst fires

#### Scenario: Reduced motion

- GIVEN `prefers-reduced-motion: reduce`
- WHEN the modal opens
- THEN no confetti, pulse, or haptic occurs and the modal stays usable

### Requirement: Single sequential queue

When several achievements unlock together, the system MUST celebrate them one at a time: exactly one celebration visible at any moment, with user-driven advancement. Modals MUST NOT stack.

#### Scenario: Multiple unlocks

- GIVEN 3 achievements unlock in one evaluation
- WHEN the first celebration shows
- THEN only it is visible
- AND dismissing it reveals the second, then the third

### Requirement: Skippable and no noise

The user MUST be able to dismiss the current celebration immediately (primary button, Escape, or backdrop), and dismissal MUST advance the queue. Celebrations MUST NOT auto-loop beyond the announced pulse, and MUST NOT fire repeated haptics for the same unlock.

#### Scenario: Immediate skip

- GIVEN a visible celebration
- WHEN the user presses Escape
- THEN it closes instantly and the queue advances

### Requirement: Deterministic medal variants

Medals MUST support CSS-first visual variants (tone/shine) per achievement. Variant grants MUST be deterministic: each re-earn of an achievement (existing re-earn count milestone) grants the next variant in a fixed per-achievement sequence. Random draws and currencies are prohibited.

#### Scenario: Re-earn grants next variant

- GIVEN an achievement with re-earn count 2, owning the base and one variant
- WHEN the grant runs
- THEN the second variant in the fixed sequence is granted, never a random one

#### Scenario: Sequence exhausted

- GIVEN all variants of an achievement already granted
- WHEN it is re-earned again
- THEN no new grant occurs and no error surfaces

### Requirement: Variant persistence

Granted variants MUST persist locally in `meta.collectibles` as `{achievementId, variantId}` entries (IndexedDB only, offline) and MUST be restored after reload. Persistence MUST precede display so a crash or reload never re-grants the same milestone.

#### Scenario: Survives reload

- GIVEN a granted variant
- WHEN the app reloads
- THEN the medal renders the persisted variant

#### Scenario: No double grant

- GIVEN a re-earn whose grant was already persisted
- WHEN the same state is re-evaluated
- THEN the collectibles list is unchanged

### Requirement: Medal rendering and i18n

The medal MUST render the earned variant when unlocked and the base tier otherwise, with an accessible label naming tier and variant. All new celebration UI strings (variant labels, new-variant announcement, queue affordance) MUST ship es and en keys (es is the typed source of truth).

#### Scenario: Variant label

- GIVEN an unlocked medal with variant 2
- WHEN the medal renders
- THEN its accessible label names the tier and the variant

#### Scenario: Both locales present

- GIVEN a new variant label
- WHEN the locale is `es` or `en`
- THEN the string resolves without fallback-key warnings