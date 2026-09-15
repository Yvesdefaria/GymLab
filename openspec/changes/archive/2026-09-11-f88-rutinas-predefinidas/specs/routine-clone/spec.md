# routine-clone Specification

## Purpose

Clone a predefined (`!isCustom`) routine into a custom routine with provenance tracking, then open it in the builder editor. Display a "Basada en ..." badge on cloned routines in the list view.

## Requirements

### Requirement: Clone Mapper Pure Function

A pure `cloneRoutineDraft` function in `domain/routines.ts` SHALL accept a source `Routine`, its `RoutineDay[]`, and its `RoutineItem[]`, and return a `RoutineDraft`-shaped payload.

The mapper MUST copy `title`, `objective`, `level`, `description`, day names, and item fields (`targetSets`, `targetReps`, `restSec`, `supersetGroup`, `notes`). The mapper MUST NOT copy `imageUrl`. The mapper MUST set `basedOnId` to `source.id`. IDs are reassigned automatically by `createRoutine` (ids >= 10000). Day and item `order` fields MUST be re-indexed sequentially starting at 1.

#### Scenario: Clone produces valid RoutineDraft

- GIVEN a predefined routine with id 5, title "PPL Volumen", 4 days, 12 items
- WHEN `cloneRoutineDraft(source, days, items)` is called
- THEN the result has `title` "PPL Volumen", `basedOnId` 5, no `imageUrl`
- AND each day has `order` 1-based sequential
- AND each item within its day has `order` 1-based sequential

#### Scenario: Slug collision with source

- GIVEN the source routine has slug "ppl-volumen" and that slug already exists in the database
- WHEN `createRoutine` processes the cloned draft
- THEN `uniqueSlug` appends `-2` (or `-N`) suffix to produce a unique slug
- AND the clone is persisted with the suffixed slug

#### Scenario: imageUrl is discarded

- GIVEN a predefined routine with `imageUrl` set to "https://example.com/img.webp"
- WHEN the clone mapper runs
- THEN the resulting draft has no `imageUrl` field

---

### Requirement: Detail Page Clone Button

`RutinaDetailPage` MUST display an "Editar esta rutina" button when the viewed routine is predefined (`!isCustom`). The button MUST NOT appear for custom routines.

When clicked, the system SHALL load the source routine's days and items, invoke `cloneRoutineDraft`, persist via `createRoutine`, and navigate to `/rutinas/{newSlug}/editar`.

#### Scenario: Clone predefined routine from detail page

- GIVEN user views routine "PPL Volumen" (predefined, `isCustom: false`)
- WHEN user clicks "Editar esta rutina"
- THEN a custom clone is created with `isCustom: true` and `basedOnId` = source id
- AND user is navigated to `/rutinas/{newSlug}/editar` (builder opens the clone)
- AND the original predefined routine remains unchanged

#### Scenario: Builder rejects non-custom routines

- GIVEN a predefined routine loaded directly via `/rutinas/{sourceSlug}/editar`
- WHEN `useRoutineDraft` detects `isCustom` is false
- THEN the builder shows "Solo puedes editar rutinas propias" and does not load the editor

---

### Requirement: Badge Provenance on Cloned Routines

`RutinasPage` MUST display a "Basada en {source title}" badge on custom routines that have a `basedOnId`. The source title MUST be resolved from the live routines array and localized via `localizeRoutine(source)`.

If the source routine no longer exists (e.g., removed in a future reseed), the badge SHALL degrade to "Propia" (the default custom badge).

#### Scenario: Badge shows source title for valid clone

- GIVEN a cloned routine with `basedOnId` pointing to routine id 5 ("PPL Volumen")
- WHEN the routines list renders
- THEN the badge reads "Basada en PPL Volumen" (localized)

#### Scenario: Badge degrades when source is missing

- GIVEN a cloned routine with `basedOnId` pointing to a routine id that no longer exists in the seed
- WHEN the routines list renders
- THEN the badge falls back to "Propia"

#### Scenario: Custom routines without basedOnId show default badge

- GIVEN a routine created via "Nueva rutina" (no `basedOnId`)
- WHEN the routines list renders
- THEN the badge reads "Propia"

---

### Requirement: basedOnId Optional Field

The `Routine` domain type and `RoutineDraft` repository type MUST include an optional `basedOnId?: number` field. This field is non-indexed. No Dexie migration or new tables are required.

The `routineRepo.createRoutine` function MUST persist `basedOnId` from the draft when provided.

#### Scenario: basedOnId persists through create

- GIVEN a draft with `basedOnId: 5`
- WHEN `createRoutine(draft)` completes
- THEN the persisted routine has `basedOnId: 5`

#### Scenario: Draft without basedOnId

- GIVEN a draft with no `basedOnId` field
- WHEN `createRoutine(draft)` completes
- THEN the persisted routine has `basedOnId: undefined`

---

### Requirement: i18n Keys

New i18n keys MUST be added in `es/routines.ts` (typed source of truth) and mirrored in `en/routines.ts`. Required keys: `rutinas.detalle.editarPredefinida` (button label) and `rutinas.basadaEn` (badge template with `{{titulo}}` interpolation).

#### Scenario: All new keys exist in both locales

- GIVEN the i18n files for es and en
- WHEN the spec keys are defined
- THEN both locales contain all required keys with correct types
- AND `I18nKey` type includes the new keys

---

### Requirement: Tests

Unit tests SHALL cover the `cloneRoutineDraft` mapper in `tests/unit/domain/routineClone.test.ts`. E2E tests SHALL cover the full clone-edit-save-badge flow in `tests/e2e/test_f88.py`.

#### Scenario: Unit test coverage for clone mapper

- GIVEN the `cloneRoutineDraft` function
- WHEN unit tests run (`npm test`)
- THEN tests verify: field copying, id/slug re-keying, basedOnId set, imageUrl excluded, order re-indexing

#### Scenario: E2E covers clone → edit → save → badge

- GIVEN a predefined routine in the app
- WHEN the e2e test clicks "Editar esta rutina", edits the clone, saves, and returns to list
- THEN the clone appears with the correct badge
- AND the original routine is unchanged
