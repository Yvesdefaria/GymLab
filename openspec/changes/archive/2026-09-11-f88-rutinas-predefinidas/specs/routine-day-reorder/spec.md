# routine-day-reorder Specification

## Purpose

Allow users to reorder days (not just items) within a routine in the builder editor. Drag-and-drop reordering for days using the same `useDragReorder` pattern already established for items.

## Requirements

### Requirement: Day-Level Drag Reorder in Builder

`RutinaBuilderPage` MUST support drag-and-drop reordering of routine days. Each day's drag handle SHALL use the same visual affordance as item-level drag (grip icon). The reorder MUST use the existing `useDragReorder` hook or equivalent pattern.

Day `dayIndex` values MUST be normalized to sequential 0-based integers after any reorder, and persisted as part of the existing draft save flow.

#### Scenario: Reorder two days

- GIVEN a routine with 3 days in order ["Día A", "Día B", "Día C"]
- WHEN user drags "Día C" to position 1 (before "Día A")
- THEN the day order becomes ["Día C", "Día A", "Día B"]
- AND `dayIndex` values are 0, 1, 2 respectively
- AND saving the draft persists the new day order

#### Scenario: Reorder with empty day

- GIVEN a routine with 3 days where day 2 has zero items
- WHEN user drags day 2 to position 0
- THEN the empty day moves to the first position
- AND all `dayIndex` values are re-normalized
- AND save succeeds with the empty day in its new position

#### Scenario: Single day cannot be reordered

- GIVEN a routine with only 1 day
- WHEN the builder renders
- THEN the drag handle for the single day is disabled or hidden
- AND no reorder operation occurs

---

### Requirement: Reorder Persists on Save

Day reorder MUST be part of the existing draft save flow. No separate persistence mechanism is needed. When the user saves, `routineRepo.updateRoutine` MUST receive days in their reordered sequence with normalized `dayIndex` values.

#### Scenario: Reordered days survive save and reload

- GIVEN a routine with days reordered to ["Día B", "Día A"]
- WHEN user saves and navigates away
- AND user reopens the routine in the builder
- THEN days appear in order ["Día B", "Día A"]

---

### Requirement: Existing Day Operations Remain Functional

After adding day reorder, existing day operations (add, remove, rename) and item-level operations (add, remove, drag reorder, target edit) MUST continue to function identically. No regression in existing builder behavior.

#### Scenario: Add day after reorder

- GIVEN a routine with days reordered to ["Día B", "Día A"]
- WHEN user adds a new day
- THEN the new day appears at the end as "Día 3"
- AND existing days retain their reordered positions

#### Scenario: Remove day after reorder

- GIVEN a routine with 3 reordered days
- WHEN user removes the middle day
- THEN remaining days re-normalize their `dayIndex` values
- AND save persists correctly

---

### Requirement: Tests

Unit tests SHALL verify the pure reorder logic. E2E tests SHALL verify the drag interaction and persistence in `tests/e2e/test_f88.py`.

#### Scenario: Unit test for day reorder

- GIVEN a day reorder function
- WHEN tests run (`npm test`)
- THEN tests verify: correct re-indexing, empty-day handling, single-day no-op

#### Scenario: E2E for day reorder flow

- GIVEN the builder with a multi-day routine
- WHEN the e2e test drags a day to a new position and saves
- THEN the day order persists after reload
