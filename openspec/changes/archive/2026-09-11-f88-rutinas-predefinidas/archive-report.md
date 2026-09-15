# Archive Report: f88-rutinas-predefinidas

**Archived on**: 2026-09-11
**Archived to**: `openspec/changes/archive/2026-09-11-f88-rutinas-predefinidas/`
**Artifact store**: hybrid — OpenSpec repo-local (files in `openspec/`) + Engram topic `sdd/f88-rutinas-predefinidas/archive-report`
**Final HEAD**: `988067b` (fix: stepsSync test date time bomb, F84c — isolated commit on main)
**Verdict at close**: PASS WITH WARNINGS (accepted follow-ups, none blocking archive)

## Status

`success` — SDD cycle complete. Delta specs synced to main specs (2 domains created), change folder moved to archive with byte-identity readback, archive report persisted to OpenSpec and Engram.

## Executive Summary

F88 (rutinas predefinidas clonables + reorden de días) shipped fully: 19/19 implementation tasks complete, 10/10 requirements and 21/21 scenarios satisfied per the final verification at HEAD `988067b` (vitest 554/554 in 53 files exit 0, `npm run build` exit 0, e2e `test_f88.py` ALL OK). The sole verify blocker — a pre-existing hardcoded-date time bomb in `tests/unit/data/stepsSync.test.ts` — was fixed by isolated commit `988067b` (`2026-09-08` → `toLocalDateStr()`); verification refreshed at that HEAD is green and the persisted verify-report reflects it. Delta specs for the two new capabilities (`routine-clone`, `routine-day-reorder`) were mechanically copied into `openspec/specs/` (no main spec existed for either domain, so no destructive merge). The change folder was moved to the archive with empty `diff -r` readbacks. No commit or push was made by this phase (delivery is user-managed per repo convention).

## Final-State Authority Notes

Ranking applied per the archive skill: persisted tasks artifact (19/19 `[x]`) → explicit final-state facts from the launch prompt → `verify-report.md` / `apply-progress` snapshots.

- The persisted `verify-report.md` at HEAD `988067b` already reports the final green state (554 tests, build exit 0, e2e ALL OK) and explains the stepsSync fix; the launch prompt's final-state facts (53 files / 554 tests, exit 0, e2e ALL OK, badge "Basada en PPL Volumen", day reorder persisted after save+reload, touch targets >= 44px) match it exactly. No contradiction to resolve; numbers below are carried from the highest-ranked matching source.
- `apply-progress` was never persisted for this change (native status: `applyProgress: [missing]`; no apply-progress locator exists). Task completion is evidenced by tasks.md alone.
- No CRITICAL findings exist in the verification report; no CRITICAL override was needed.

## Task Completion Gate

- tasks.md: **19/19 tasks checked** `[x]` — no unchecked implementation tasks before or after the move (verified against the archived `tasks.md`).
- Gate passed before spec sync and archive move.

## Archive Readiness

- Native `gentle-ai sdd-status` (schema `gentle-ai.sdd-status`, version 2) at archive time: `dependencies.archive: ready`, `nextRecommended: archive`, `applyState: all_done`, `taskProgress.allComplete: true`, `blockedReasons: []`.
- `actionContext.mode: repo-local` with `allowedEditRoots: [C:\Users\Yves De Faria\Desktop\ProyectoGymLab]` — all archive operations stayed inside that root. No workspace-planning mode; Action Context Guard satisfied.
- `reviewOffer` present but treated strictly as an invitation (has no archive authority per the status contract).

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `routine-clone` | Created | `openspec/specs/routine-clone/spec.md` — full spec (no prior main spec); 6 requirements, 12 scenarios |
| `routine-day-reorder` | Created | `openspec/specs/routine-day-reorder/spec.md` — full spec (no prior main spec); 4 requirements, 6 scenarios |

- No main specs existed under `openspec/specs/` before archive; the delta specs are full specs, so the merge was a mechanical copy (temp file + `diff -r` readback + `mv`), not a delta merge. No destructive deltas; config `rules.archive` "warn before merging destructive deltas" not triggered.
- Mechanical copy only (shell); **verbatim readbacks (all empty, exit 0)**:
  - `diff -r` change-spec vs temp (routine-clone): empty, exit 0
  - `diff -r` change-spec vs temp (routine-day-reorder): empty, exit 0
  - `diff -r` main spec vs change delta spec (routine-clone): empty, exit 0
  - `diff -r` main spec vs change delta spec (routine-day-reorder): empty, exit 0

## Archive Move

- Source: `openspec/changes/f88-rutinas-predefinidas/`
- Destination: `openspec/changes/archive/2026-09-11-f88-rutinas-predefinidas/`
- `git mv` failed with exit 128 ("source directory is empty" — the whole `openspec/` tree is untracked in git), so the skill's plain-`mv` fallback executed after all guards passed: pre-move integrity `diff -r` (snapshot vs source) **empty, exit 0**; no destination collision; `Move-Item` completed; source confirmed gone.
- **Mandatory readback**: `diff -r` (pre-move recursive snapshot vs destination) **empty, exit 0** — byte-identical archive.
- Snapshot root cleaned up after readback.

## Archive Contents (all artifacts present)

- `proposal.md` ✅
- `exploration.md` ✅
- `specs/routine-clone/spec.md` ✅
- `specs/routine-day-reorder/spec.md` ✅
- `design.md` ✅
- `tasks.md` ✅ (19/19 tasks complete, 0 unchecked)
- `verify-report.md` ✅
- `archive-report.md` ✅ (this file — additive, excluded from readback by contract)

## Verification State at Close (HEAD `988067b`)

- **Unit/integration**: `npm test` (vitest) → 53 files / 554 tests, exit 0 (output sha256 `ccc69bb951ecf20ccd8a761a2d4adb14875d75286868fb44eae8c6b316173d26`).
- **Build**: `npm run build` (tsc -b && vite build) → exit 0 (output sha256 `f658815477e7933863220b3e7b5158007815983aa8a82dc8324ac90a4c2e73ec`; benign vite PLUGIN_TIMINGS notice only).
- **E2E**: `python tests/e2e/scripts/with_server.py tests/e2e/test_f88.py` → ALL OK: clone of `ppl-volumen` → `ppl-volumen-2`, badge "Basada en PPL Volumen", day reorder persisted after save+reload, original predefined intact, day grip touch targets >= 44px, no console errors.
- **Requirements/scenarios**: 10/10 requirements, 21/21 scenarios (15 fully runtime-tested, 5 partial with passing coverage, 1 static-verified fallback — badge degradation S7, disclosed warning).
- **Coverage**: not applicable (`coverage_threshold: 0`, provider not installed).

## Implementation History at Close

10 F88 commits on main in chronological order, all without push (user pushes manually — delivery override, no PR ceremony): `897e316` (basedOnId), `97ff08e` (cloneRoutineDraft + TDD tests), `e3a0189` (i18n), `8c5c58c` (clone button), `4cf2567` (badge), `68ec287` (reorderDays + guards), `a7e4fe0` (day drag UI + grip), `8368b8e` (e2e), `2548159` (strict tsc fix), `18bc792` (changelog). Plus isolated blocker fix `988067b` (stepsSync test time bomb, F84c pre-existing) as final HEAD.

## Accepted Follow-ups (non-blocking, recorded for future work)

1. **PLAN.md F88 checkboxes (88.1–88.7) uncommitted**: the marks live in the worktree inside an unrelated F63/F93 PLAN.md rewrite (329+/2798- vs HEAD); committing the whole file would mix tasks. Backups: `%TEMP%\plan-noise-backup.md`, `%TEMP%\changelog-noise-backup.md`. Also `gymlab-app/CHANGELOG.md` worktree modification rides the same noise (F88 changelog entries themselves are already committed via `18bc792`).
2. **Favorited clones lack provenance badge** in the Favoritas section of `RutinasPage` — accepted, F88-adjacent.
3. **Badge degradation when source missing (S7)** verified statically only (`RutinasPage.tsx:62-64` `!source → rutinas.propia`); a future e2e step (remove seed routine → assert "Propia") would close it.

## Risks

1. **Orphan clones** if the user abandons the editor after clicking "Editar esta rutina" — accepted design tradeoff, identical to "Nueva rutina" abandonment pattern.
2. **`basedOnId` orphaned by a future reseed** that removes the source seed routine — badge degrades to "Propia" (graceful, static-verified). Seed ids are stable today; `preserveCustom` keeps clones across reseeds.
3. **Unhandled `createRoutine` rejection path** in `RutinaDetailPage.handleClone` (verify SUGGESTION 1) — no catch on create failure; hardening opportunity, not a defect observed at close.
4. **`uniqueSlug` applied in the detail-page caller** rather than inside `createRoutine` (verify SUGGESTION 2) — behavioral spec satisfied; centralizing would harden future clone paths.
5. **Worktree noise (F63/F93)** is uncommitted alongside docs; backups exist at `%TEMP%\plan-noise-backup.md` / `%TEMP%\changelog-noise-backup.md` — purely a delivery hygiene concern for the user's manual push, does not affect the archive.

## Store Persistence

- OpenSpec: archive report file at `openspec/changes/archive/2026-09-11-f88-rutinas-predefinidas/archive-report.md`; main specs synced at `openspec/specs/routine-clone/spec.md` and `openspec/specs/routine-day-reorder/spec.md`.
- Engram: topic `sdd/f88-rutinas-predefinidas/archive-report` (automated-artifact semantics, `capture_prompt: false`).

## Skill Resolution

`paths-injected` — 3 skills loaded: `sdd-archive/SKILL.md`, `_shared/sdd-phase-common.md`, `_shared/openspec-convention.md`, `_shared/sdd-status-contract.md` (status contract read as the archive readiness authority).

## Source of Truth Updated

The following main specs now reflect the shipped behavior and are the source of truth for future changes:
- `openspec/specs/routine-clone/spec.md`
- `openspec/specs/routine-day-reorder/spec.md`

## SDD Cycle Complete

F88 was fully planned, implemented, verified, and archived. Ready for the next change.