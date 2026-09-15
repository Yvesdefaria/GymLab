# Tasks: Fase 88 — Rutinas Predefinidas (clone + day reorder)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 330–390 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (clone foundation + mapper + types) → PR 2 (UI integration + day reorder + docs) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Types + clone mapper + unit tests | PR 1 | `npm test` (gymlab-app/) | N/A — pure domain, no UI | `src/domain/types.ts`, `src/data/repositories/types.ts`, `src/domain/routines.ts`, `tests/unit/domain/routineClone.test.ts` |
| 2 | UI integration (clone button + badge + day reorder + docs) | PR 2 | `npm test && npm run build` | `python tests/e2e/scripts/with_server.py tests/e2e/test_f88.py` | UI files + i18n + docs; entire PR revertable independently after PR 1 merges |

Dependency diagram:
```
PR 1: types + cloneRoutineDraft + unit tests
  📍 PR 2 targets PR 1 branch (feature-branch-chain) or main (stacked-to-main)
PR 2: RutinaDetailPage, RutinasPage, RutinaBuilderPage, RoutineDayEditor, i18n, e2e, docs
```

---

## Phase 1: Foundation — Types + Domain Functions (PR 1)

- [x] 1.1 Add `basedOnId?: number` to `Routine` interface in `src/domain/types.ts` (after existing fields, before closing brace)
- [x] 1.2 Add `basedOnId?: number` to `RoutineDraft` interface in `src/data/repositories/types.ts` (after existing fields)
- [x] 1.3 Implement `cloneRoutineDraft(source, days, items): RoutineDraft` pure function in `src/domain/routines.ts` — copy title/objective/level/description, set `basedOnId: source.id`, exclude `imageUrl`, group items by day, re-index day/item `order` 1-based
- [x] 1.4 Write unit tests FIRST in `tests/unit/domain/routineClone.test.ts` — field copying, basedOnId set, imageUrl excluded, order re-indexing, day/item grouping (RED → GREEN)

## Phase 2: UI Integration (PR 2)

- [x] 2.1 Modify `src/data/repositories/dexie/routineRepo.ts`: pass `basedOnId` from draft in `createRoutine` (destructure + include in DB write)
- [x] 2.2 Add i18n keys to `src/i18n/locales/es/routines.ts`: `rutinas.detalle.editarPredefinida` = 'Editar esta rutina', `rutinas.basadaEn` = 'Basada en {{titulo}}'
- [x] 2.3 Mirror i18n keys to `src/i18n/locales/en/routines.ts`: same keys with English values
- [x] 2.4 Modify `src/pages/RutinaDetailPage.tsx`: add "Editar esta rutina" button for `!isCustom`, load days/items, call `cloneRoutineDraft`, persist via `createRoutine`, navigate to `/rutinas/${newSlug}/editar`
- [x] 2.5 Modify `src/pages/RutinasPage.tsx`: resolve `basedOnId` → source title via `localizeRoutine`, show "Basada en {title}" badge; fallback to "Propia" when source missing or no `basedOnId`
- [x] 2.6 Modify `src/hooks/useRoutineDraft.ts`: add `reorderDays(fromIndex, toIndex)` callback using existing `reorderArray`
- [x] 2.7 Modify `src/pages/RutinaBuilderPage.tsx`: second `useDragReorder` instance for day-level drag; pass grip props to `RoutineDayEditor`
- [x] 2.8 Modify `src/components/routines/RoutineDayEditor.tsx`: accept day-level drag props; render `GripVertical` handle on day header (hidden when only 1 day)

## Phase 3: E2E Tests + Docs

- [x] 3.1 Write e2e test `tests/e2e/test_f88.py`: clone flow (click "Editar esta rutina" → edit → save → badge appears → original intact), day reorder persistence after save
- [x] 3.2 Mark Fase 88 checkboxes (88.1–88.7) in `gymlab-app/PLAN.md`; note 68-predefined-scope correction
- [x] 3.3 Add CHANGELOG.md entries under `[Unreleased]` for both capabilities

## Phase 4: Verification Gate

- [x] 4.1 Run `npm test` from `gymlab-app/` — all tests pass
- [x] 4.2 Run `npm run build` from `gymlab-app/` — tsc -b + vite build succeeds (type-gate: i18n keys must be in both locales or build fails)
- [x] 4.3 Run `python tests/e2e/scripts/with_server.py tests/e2e/test_f88.py` from `gymlab-app/` — clone + reorder flows pass
- [x] 4.4 Commit per config convention: one conventional commit per task, no push
