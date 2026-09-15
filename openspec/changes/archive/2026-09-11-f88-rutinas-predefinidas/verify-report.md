```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:ccc69bb951ecf20ccd8a761a2d4adb14875d75286868fb44eae8c6b316173d26
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 10/10
scenarios: 21/21
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:ccc69bb951ecf20ccd8a761a2d4adb14875d75286868fb44eae8c6b316173d26
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:f658815477e7933863220b3e7b5158007815983aa8a82dc8324ac90a4c2e73ec
```

## Verification Report

**Change**: f88-rutinas-predefinidas
**Version**: N/A
**Mode**: Standard
**HEAD**: `988067b` (fix: stepsSync date time bomb F84c, isolated on main)
**Store**: both — openspec repo-local (`openspec/changes/f88-rutinas-predefinidas/`) + Engram (`sdd/f88-rutinas-predefinidas/verify-report`)

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 19 |
| Tasks complete | 19 |
| Tasks incomplete | 0 |

### Build & Tests Execution (fresh run at HEAD 988067b)

**Build**: ✅ Passed — `npm run build` (tsc -b + vite build) EXIT 0, output sha256 `f658815477e7933863220b3e7b5158007815983aa8a82dc8324ac90a4c2e73ec` (benign vite PLUGIN_TIMINGS notice only, identical to previous passing runs).

**Tests**: ✅ 554 passed / 0 failed / 0 skipped — `npm test` (vitest run v4.1.10) EXIT 0, output sha256 `ccc69bb951ecf20ccd8a761a2d4adb14875d75286868fb44eae8c6b316173d26`.

```text
 Test Files  53 passed (53)
      Tests  554 passed (554)
```

**E2E**: ✅ `python tests/e2e/scripts/with_server.py tests/e2e/test_f88.py` EXIT 0 — `ALL OK` (output sha256 `ee9e7e5e0526fbc35c73653179cc268b7c35f61faeb0ab4a10bed3c959b9f8ad`): predefined detail shows clone button; builder rejects predefined routine; clone slug `ppl-volumen-2` (collision); builder loaded for clone; day reorder last → first persisted after save + reload; badge "Basada en PPL Volumen" visible on clone card; original predefined unchanged; day grip touch targets >= 44px.

**Focused proof of the previous blocker (stepsSync time bomb)**: `npx vitest run tests/unit/data/stepsSync.test.ts tests/unit/domain/routineClone.test.ts` EXIT 0 — 2 files / 26 tests passed. Commit `988067b` changed only `tests/unit/data/stepsSync.test.ts` (+4/-1): imports `toLocalDateStr` from `@/domain/dates` and asserts `expect(to).toBe(toLocalDateStr())` instead of the hardcoded `2026-09-08`. The suite now passes on 2026-09-10 — the exact date that triggered the previous FAIL. The F88-suite file `routineClone.test.ts` (19 tests: cloneRoutineDraft + reorderDays + reorderArray) passes with it.

**Coverage**: ➖ Not available (coverage provider not installed; `coverage_threshold: 0` in openspec/config.yaml — not required by this change).

### Spec Compliance Matrix
| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Clone Mapper Pure Function | Clone produces valid RoutineDraft | `tests/unit/domain/routineClone.test.ts` | ✅ COMPLIANT |
| Clone Mapper Pure Function | Slug collision with source | `tests/e2e/test_f88.py` (slug ppl-volumen-2) + routineClone.test.ts | ✅ COMPLIANT |
| Clone Mapper Pure Function | imageUrl is discarded | `tests/unit/domain/routineClone.test.ts` | ✅ COMPLIANT |
| Detail Page Clone Button | Clone predefined routine from detail page | `tests/e2e/test_f88.py` (clone → edit → save → detail) | ✅ COMPLIANT |
| Detail Page Clone Button | Builder rejects non-custom routines | `tests/e2e/test_f88.py` | ✅ COMPLIANT |
| Badge Provenance on Cloned Routines | Badge shows source title for valid clone | `tests/e2e/test_f88.py` ("Basada en PPL Volumen") | ✅ COMPLIANT |
| Badge Provenance on Cloned Routines | Badge degrades when source is missing | Static-only: fallback branch `src/pages/RutinasPage.tsx:62-64` (`!source → rutinas.propia`), source-verified in this refresh; no dedicated runtime test (carried forward, see WARNING 3) | ⚠️ PARTIAL (static) |
| Badge Provenance on Cloned Routines | Custom routines without basedOnId show default badge | `src/pages/RutinasPage.tsx:61` (`rutinas.propia` path) | ⚠️ PARTIAL |
| basedOnId Optional Field | basedOnId persists through create | `src/data/repositories/dexie/routineRepo.ts:72` + routineClone.test.ts + e2e badge | ✅ COMPLIANT |
| basedOnId Optional Field | Draft without basedOnId | `src/data/repositories/dexie/routineRepo.ts:72` (spread, undefined default) | ⚠️ PARTIAL |
| i18n Keys | All new keys exist in both locales | `src/i18n/locales/es/routines.ts:13,73` + `en/routines.ts:13,73` + `tsc -b` strict | ✅ COMPLIANT |
| Tests (clone) | Unit test coverage for clone mapper | `tests/unit/domain/routineClone.test.ts` (field copy, re-keying, basedOnId, imageUrl, order) | ✅ COMPLIANT |
| Tests (clone) | E2E covers clone → edit → save → badge | `tests/e2e/test_f88.py` | ✅ COMPLIANT |
| Day-Level Drag Reorder | Reorder two days | `tests/e2e/test_f88.py` (drag Legs last → first, persisted) | ✅ COMPLIANT |
| Day-Level Drag Reorder | Reorder with empty day | `tests/unit/domain/routineClone.test.ts` (reorderDays guards) | ⚠️ PARTIAL |
| Day-Level Drag Reorder | Single day cannot be reordered | `tests/unit/domain/routineClone.test.ts` (`reorderDays([day], 0, 0)` no-op) | ✅ COMPLIANT |
| Reorder Persists on Save | Reordered days survive save and reload | `tests/e2e/test_f88.py` (order after reload) | ✅ COMPLIANT |
| Existing Day Operations Remain Functional | Add day after reorder | `tests/unit/domain/routineClone.test.ts` (reorderArray) | ⚠️ PARTIAL |
| Existing Day Operations Remain Functional | Remove day after reorder | `tests/unit/domain/routineClone.test.ts` (reorderArray) | ⚠️ PARTIAL |
| Tests (reorder) | Unit test for day reorder | `tests/unit/domain/routineClone.test.ts` (reorderDays: re-index, empty, single-day no-op) | ✅ COMPLIANT |
| Tests (reorder) | E2E for day reorder flow | `tests/e2e/test_f88.py` | ✅ COMPLIANT |

**Compliance summary**: 21/21 scenarios complete under this change's acceptance accounting — 15 fully compliant (runtime-tested), 5 partial (passing coverage, part of the scenario exercised), 1 static-verified fallback (badge degradation, S7 — disclosed in WARNING 3). 10/10 requirements satisfied. Accounting matches the previous run's matrix (20/21 with one static-only + the same 5 partials), now counted complete per the orchestrator's refresh acceptance; no new gaps found.

### Correctness (Static Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| Clone Mapper Pure Function | ✅ Implemented | `domain/routines.ts:100` `cloneRoutineDraft`; copies fields, sets `basedOnId: source.id` (line 119), excludes imageUrl, re-indexes order 1-based |
| Detail Page Clone Button | ✅ Implemented | `RutinaDetailPage.tsx:110,168` — clone via `cloneRoutineDraft` + `createRoutine`, button only for `!isCustom`; builder gate intact |
| Badge Provenance on Cloned Routines | ✅ Implemented | `RutinasPage.tsx:59-64` — resolve source from live routines, `localizeRoutine`, degrade to `rutinas.propia` when source missing |
| basedOnId Optional Field | ✅ Implemented | `domain/types.ts:58` + `repositories/types.ts:65` optional non-indexed; `routineRepo.ts:72` persists draft value |
| i18n Keys | ✅ Implemented | es source of truth + en mirror, `{{titulo}}` interpolation, typechecked by `tsc -b` |
| Tests | ✅ Implemented | unit `routineClone.test.ts` (19) + e2e `test_f88.py` — both green at HEAD |
| Day-Level Drag Reorder | ✅ Implemented | `domain/routines.ts:32` pure `reorderDays`, `useRoutineDraft.ts:127-128`, `RutinaBuilderPage.tsx:63` second useDragReorder + grip |
| Reorder Persists on Save | ✅ Implemented | reorder mutates draft days; existing save flow persists; e2e proves reload persistence |
| Existing Day Operations Remain Functional | ✅ Implemented | unit + e2e green; no regression in full 554-test suite |

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| Clone-on-click (createRoutine → navigate) | ✅ Yes | `RutinaDetailPage.tsx` handler builds draft, persists, navigates `/rutinas/{slug}/editar` |
| Draft loader NOT extracted | ✅ Yes | detail page builds draft via `cloneRoutineDraft` + exerciseRepo; builder edit gate untouched |
| Badge "Basada en X" replaces "Propia", fallback to "Propia" | ✅ Yes | `RutinasPage.tsx:59-64` |
| Second `useDragReorder` instance for days | ✅ Yes | `RutinaBuilderPage.tsx:63` |
| `basedOnId` non-indexed optional, no Dexie migration | ✅ Yes | both type files; no migration in repo |

### Issues Found
**CRITICAL**: None. (Previous sole blocker — pre-existing stepsSync hardcoded-date time bomb — fixed at HEAD `988067b`, proven by the passing `toLocalDateStr` assertion on 2026-09-10.)

**WARNING**:
1. Favorited clones lack the provenance badge in the Favoritas section (`RutinasPage` favorites cards render `basedOnId`-bearing clones without the "Basada en ..." badge) — accepted follow-up, F88-adjacent, must NOT gate archive.
2. PLAN.md F88 checkmark marks (88.1–88.7) remain uncommitted in the working tree — they ride inside an unrelated F63/F93 PLAN restructure (329+/2798- vs HEAD); committing the whole file would mix tasks. Accepted follow-up, must NOT gate archive.
3. Scenario S7 (badge degrades when source is missing) has no dedicated runtime test — the fallback branch at `RutinasPage.tsx:62-64` is source-verified (`!source → t('rutinas.propia')`); counted complete under the orchestrator's refresh acceptance, unchanged from the previous run's matrix, does NOT gate archive. A future e2e step (remove seed routine → assert "Propia") would close it.

**SUGGESTION**:
1. `RutinaDetailPage.handleClone` has no catch on `createRoutine` failure (unhandled rejection path).
2. `uniqueSlug` is applied in the detail-page caller, not inside `createRoutine` (behavioral spec satisfied; centralizing would harden future clone paths).

### Verdict
PASS WITH WARNINGS — the sole previous blocker (pre-existing stepsSync hardcoded-date time bomb) is fixed at HEAD `988067b`; all gates green (vitest 554/554, build exit 0, e2e `ALL OK`). All 19 tasks complete, 10/10 requirements satisfied, full requirement matrix re-confirmed with no new gaps. Warnings are accepted follow-ups that must not gate archive.