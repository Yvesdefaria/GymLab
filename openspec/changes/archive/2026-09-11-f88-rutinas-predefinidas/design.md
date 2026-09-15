# Design: Fase 88 — Rutinas Predefinidas (clone + day reorder)

## Technical Approach

Two independent capabilities that share no code beyond the existing `reorderArray` utility:

1. **routine-clone**: Pure `cloneRoutineDraft` mapper in `domain/routines.ts` → new optional `basedOnId` field on `Routine`/`RoutineDraft` → detail page "Editar esta rutina" button for `!isCustom` → badge provenance on `RutinasPage`.
2. **routine-day-reorder**: Reuse `reorderArray` via a new `reorderDays` callback in `useRoutineDraft` → a second `useDragReorder` instance scoped to days in `RutinaBuilderPage` → `RoutineDayEditor` gains a grip handle.

Both feed the existing draft save path (`routineDraftFrom` → `createRoutine`/`updateRoutine`). No new routes, no Dexie schema migration, no new tables, no backend changes.

## Architecture Decisions

| Decision | Option A | Option B (chosen) | Tradeoff |
|----------|----------|-------------------|----------|
| Clone trigger | Route-state `cloneFrom` (no orphan) | Clone-on-click → createRoutine → navigate | A avoids orphans but adds route plumbing + create-mode UI mismatch. B matches PLAN wording "clonar y abrir editor", one extra DB write on click, orphan same as "Nueva rutina" abandonment. |
| Draft loader extraction | Extract shared helper from `useRoutineDraft:42-61` | Keep edit-mode contract intact; detail page builds draft directly via `cloneRoutineDraft` + manual `exerciseRepo.getById` | Extracting a shared helper saves ~15 lines but couples clone to builder internals. Keeping them separate means the clone handler is self-contained in the detail page, the builder's `useRoutineDraft` edit gate stays untouched, and each concern is independently testable. |
| Badge slot | Compose text ("Propia · Basada en X") | Replace badge entirely ("Basada en X") | Single badge slot in `RoutineCard` (lines 58-73). Replacing is cleaner; "Propia" adds no value when provenance exists. Fallback to "Propia" when `basedOnId` is missing or source gone. |
| Day reorder hook | Extend existing `useDragReorder` | Second `useDragReorder` instance for days | Existing hook is scoped to items within a day (dayIndex-keyed). A single instance with a different `getItemCount` can't handle both scopes simultaneously without mode-switching. Two instances is explicit, zero-risk to item reorder. |
| `basedOnId` storage | Dexie indexed field | Non-indexed optional field on existing table | Badge lookup scans custom routines array (small, <100 items). Index adds no value; non-indexed avoids any migration concern. |

## Data Flow

### Clone Flow

```
RutinaDetailPage ("Editar esta rutina" click)
  │
  ├─ routineRepo.getDays(source.id)
  ├─ routineRepo.getItems(dayId) per day
  ├─ exerciseRepo.getById() per item (for exerciseName)
  │
  ├─ cloneRoutineDraft(source, routineDays, routineItems) → RoutineDraft
  │   ├─ copies title/objective/level/description/dayNames/itemFields
  │   ├─ sets basedOnId = source.id
  │   ├─ excludes imageUrl
  │   └─ re-indexes day item orders 1-based
  │
  ├─ routineRepo.createRoutine(draft) → newId
  │   ├─ uniqueSlug(title, allSlugs) → suffixed slug
  │   └─ isCustom: true, id >= 10000
  │
  └─ navigate(`/rutinas/${newSlug}/editar`)
       └─ useRoutineDraft(slug) loads clone as custom → builder opens
```

### Day Reorder Flow

```
RutinaBuilderPage
  │
  ├─ useDragReorder({ dayCount, onReorder: reorderDays })
  │   └─ day-level drag (GripVertical on day header)
  │
  ├─ reorderDays(fromIndex, toIndex)
  │   └─ setDays(prev => reorderArray(prev, fromIndex, toIndex))
  │
  └─ save() → routineDraftFrom → routineRepo.createRoutine/updateRoutine
      └─ days passed in reordered sequence; dayIndex normalized by addDaysAndItems (0-based)
```

### Badge Flow

```
RutinasPage (custom section)
  │
  ├─ for each custom routine:
  │   ├─ routine.basedOnId exists?
  │   │   ├─ YES → find source = routines.find(r => r.id === basedOnId)
  │   │   │   ├─ source exists → badge = t('rutinas.basadaEn', { titulo: localizeRoutine(source, lang).title })
  │   │   │   └─ source missing → badge = t('rutinas.propia')
  │   │   └─ NO → badge = t('rutinas.propia')
  │
  └─ RoutineCard receives badge prop
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/types.ts` | Modify | Add `basedOnId?: number` to `Routine` interface (after line 56) |
| `src/data/repositories/types.ts` | Modify | Add `basedOnId?: number` to `RoutineDraft` interface (after line 64) |
| `src/data/repositories/dexie/routineRepo.ts` | Modify | Pass `basedOnId` from draft in `createRoutine` (line 63-72) |
| `src/domain/routines.ts` | Modify | Add `cloneRoutineDraft(source, days, items): RoutineDraft` pure function |
| `src/hooks/useRoutineDraft.ts` | Modify | Add `reorderDays(fromIndex, toIndex)` callback using `reorderArray` |
| `src/pages/RutinaDetailPage.tsx` | Modify | Add "Editar esta rutina" button + clone handler for `!isCustom` |
| `src/pages/RutinasPage.tsx` | Modify | Badge logic: resolve `basedOnId` → "Basada en X" or fallback "Propia" |
| `src/pages/RutinaBuilderPage.tsx` | Modify | Second `useDragReorder` instance for day-level drag; pass grip to `RoutineDayEditor` |
| `src/components/routines/RoutineDayEditor.tsx` | Modify | Accept day-level drag props; render GripVertical handle on day header (visible only when >1 day) |
| `src/i18n/locales/es/routines.ts` | Modify | Add `rutinas.detalle.editarPredefinida` and `rutinas.basadaEn` keys |
| `src/i18n/locales/en/routines.ts` | Modify | Mirror keys |
| `tests/unit/domain/routineClone.test.ts` | New | Unit tests for `cloneRoutineDraft` and `reorderDays` |
| `tests/e2e/test_f88.py` | New | E2E: clone → edit → save → badge → original intact |

## Interfaces / Contracts

```typescript
// domain/routines.ts — new pure function
export const cloneRoutineDraft = (
  source: { id: number; title: string; objective: string; level: string; description: string },
  days: RoutineDay[],
  items: RoutineItem[],
): RoutineDraft => ({
  slug: source.title,  // uniqueSlug resolves in createRoutine
  title: source.title,
  objective: source.objective as Objective,
  level: source.level as Level,
  description: source.description,
  basedOnId: source.id,
  days: /* group items by routineDayId, map to RoutineDayDraft with 1-based order */,
})

// domain/routines.ts — reuse for day reorder (no new function needed)
// reorderArray already handles the move; useRoutineDraft.reorderDays wraps it.
```

```typescript
// data/repositories/types.ts — RoutineDraft extension
export interface RoutineDraft {
  slug: string
  title: string
  objective: Objective
  level: Level
  description: string
  days: RoutineDayDraft[]
  basedOnId?: number  // ← new
}

// domain/types.ts — Routine extension
export interface Routine {
  // ... existing fields ...
  basedOnId?: number  // ← new, non-indexed
}
```

```typescript
// i18n keys (es source of truth)
rutinas.detalle.editarPredefinida: 'Editar esta rutina'
rutinas.basadaEn: 'Basada en {{titulo}}'
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `cloneRoutineDraft`: field copying, `basedOnId` set, `imageUrl` excluded, order re-indexing, day/item mapping | `tests/unit/domain/routineClone.test.ts` — vitest, pure function, no mocks |
| Unit | `reorderDays`: empty array guard, single-day no-op, multi-day reorder + index normalization | Same test file, `reorderArray` already tested; wrap test covers the callback shape |
| Unit | `routineDraftFrom` with reordered days | Existing `routineDraft.test.ts` already covers; no change needed |
| E2E | Clone → edit → save → badge → original intact → reseed survival | `tests/e2e/test_f88.py` — Python Playwright via `with_server.py` |
| E2E | Day reorder in builder → save → reload preserves order | Same `test_f88.py` — add day reorder scenario |
| Typecheck | `npm run build` (tsc -b && vite build) | Verification gate, no new test needed |
| i18n | Both `es/routines.ts` and `en/routines.ts` contain new keys with correct types | Type system enforces via `EsSchema`; build will fail if missing |

## Threat Matrix

N/A — no routing changes, no shell commands, no subprocesses, no VCS/PR automation, no executable-file classification, no process-integration boundary. The clone flow uses existing React Router navigation (`navigate`); no new routes are added.

## Migration / Rollout

No data migration required. The `basedOnId` field is non-indexed and optional. Existing custom routines without `basedOnId` continue to show "Propia" badge. Future Dexie schema versions that re-index will pick it up automatically, but no bump is needed now.

Seeds: clones survive reseeds (`preserveCustom` keeps `id >= 10000 || isCustom`). If a future seed removes a source routine, `basedOnId` becomes orphaned → badge degrades to "Propia" (graceful).

## Open Questions

- None. All requirements from both specs map to concrete file changes, function signatures, and test strategies. Ready for sdd-tasks.
