# Proposal: Fase 88 — Rutinas Predefinidas (clonar y editar)

## Intent

Users cannot edit predefined routines. They must clone a predefined routine into a custom one, then edit it. This removes friction from the "I like this routine but want to tweak it" workflow. Maps to gymlab-app/PLAN.md Fase 88.

## Scope

### In Scope
- Clone-on-click from detail page → create custom routine → open editor
- Clone mapper pure function (`domain/routines.ts`)
- Shared draft loader extraction from `useRoutineDraft`
- Day-level reorder (add `reorderDays` + day drag in builder)
- `basedOnId?: number` on `Routine` / `RoutineDraft` (non-indexed, no migration)
- "Basada en …" badge on cloned routines in Mis rutinas
- i18n keys (es source + en mirror): `rutinas.detalle.editarPredefinida`, `rutinas.basadaEn`
- Unit tests: `routineClone.test.ts` (clone mapper domain tests)
- E2E test: `test_f88.py` (clone → edit → save → badge → original intact → reseed survival)

### Out of Scope
- Routine template/library UI (beyond current 68 predefined)
- Sharing or exporting routines between users
- New database tables or schema migrations
- Any backend/Supabase work

## Capabilities

### New Capabilities
- `routine-clone`: Clone a predefined routine into a custom routine with provenance tracking, then edit it
- `routine-day-reorder`: Reorder days within a routine in the builder editor

### Modified Capabilities
None — no existing spec files in `openspec/specs/`.

## Approach

Clone-on-click (Approach 1 from exploration):
1. Pure `cloneRoutineDraft(source, days, items)` in `domain/routines.ts` → `RoutineDraft`-shaped payload with `basedOnId` = source id; id/slug auto-assigned by `createRoutine`
2. Detail page: for `!isCustom`, show "Editar esta rutina" → load source days/items → `createRoutine(clone)` → navigate `/rutinas/{newSlug}/editar`
3. Extract draft-load loop from `useRoutineDraft.ts:42-61` into shared helper
4. Builder: add `reorderDays` + day-level drag via `useDragReorder`
5. Badge: `RutinasPage` resolves source title from live `routines` array by `basedOnId`; fallback "Propia" when source missing
6. i18n: new es keys first, en mirror identical shape

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/RutinaDetailPage.tsx` | Modified | Add clone button + handler for predefined routines |
| `src/hooks/useRoutineDraft.ts` | Modified | Extract shared loader; add `reorderDays` |
| `src/domain/routines.ts` | Modified | New `cloneRoutineDraft` pure function |
| `src/domain/types.ts` | Modified | Optional `basedOnId` on `Routine` |
| `src/data/repositories/types.ts` | Modified | Optional `basedOnId` on `RoutineDraft` |
| `src/data/repositories/routineRepo.ts` | Modified | Set `basedOnId` on create |
| `src/pages/RutinasPage.tsx` | Modified | Badge for clones |
| `src/i18n/locales/es/routines.ts` | Modified | New keys |
| `src/i18n/locales/en/routines.ts` | Modified | Mirror keys |
| `tests/unit/domain/routineClone.test.ts` | New | Clone mapper tests |
| `tests/e2e/test_f88.py` | New | Full flow e2e test |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Orphan clones on editor abandonment | Low | Acceptable — same as "Nueva rutina" pattern |
| `basedOnId` points to removed seed after future reseed | Low | Badge degrades to "Propia" fallback |
| Slug collision between clone and source | Low | `uniqueSlug` appends `-2` suffix automatically |
| EN localization of clone title (no EN entry) | None | Existing behavior for all custom routines; badge localizes source title |

## Rollback Plan

Remove clone button from detail page, delete `cloneRoutineDraft`, remove `basedOnId` field, revert i18n keys. No data migration needed — existing custom routines with `basedOnId` simply lose provenance display.

## Dependencies

- None (all needed infrastructure already exists per exploration)

## Success Criteria

- [ ] Clicking "Editar esta rutina" on a predefined routine creates a custom clone and opens the editor
- [ ] Cloned routine is `isCustom: true`, id >= 10000, survives reseed
- [ ] Badge "Basada en [source title]" appears on cloned routines in Mis rutinas
- [ ] Original predefined routine remains unchanged after clone
- [ ] Day reorder works in builder for cloned (and new) routines
- [ ] `npm test` passes; `npm run build` passes
- [ ] E2E test covers: clone → edit → save → badge → original intact → reseed
