# Pre-proposal state — f90-ayuda-contextual

| Field | Value |
|---|---|
| schema | `gentle-ai.sdd-preproposal/v1` |
| revision | **3** |
| change | `f90-ayuda-contextual` |
| store | `both` (OpenSpec repo-local + Engram; hybrid) |
| date | 2026-09-15 |
| supersedes | revision 2 (research `done`, product decisions `pending`), revision 1 (research `blocked`, empty grants) |

## Exploration

| Field | Value |
|---|---|
| outcome | ready-for-proposal (with two caveats: scope renegotiation and the two factual copy errors) |
| reference | `openspec/changes/f90-ayuda-contextual/exploration.md` |

## Research request

| Field | Value |
|---|---|
| lane | Accessible, systematic contextual help in a mobile-first PWA |
| classes | `documentation`, `open-web` |
| questions | Q1–Q5 (see research artifact §1) |

## Admission and outcome

| Field | Value |
|---|---|
| capability declaration | **supplied** — `gentle-ai.sdd-research-capability/v1` |
| grants observed | `documentation=[WebFetch]` ; `open-web=[WebSearch, WebFetch]` |
| admission | **admitted** (both requested classes) |
| research outcome | **done** |
| evidence | 21 sources (S01–S21); validated claims Q1-C1 … Q4-C8; 5 recorded contradictions; explicit unsupported sub-questions |

## Evidence references

| Store | Reference | Revision | State |
|---|---|---|---|
| OpenSpec | `openspec/changes/f90-ayuda-contextual/research.md` | 2 | written |
| Engram | `sdd/f90-ayuda-contextual/research` | 2 | written |

## Product decisions

status: **confirmed** (orchestrator-owned product discovery; the user answered the open design questions on 2026-09-15)

| # | Decision | Confirmed value |
|---|---|---|
| D1 | Seen-state tracking | **None.** The user explicitly decided that no "already seen" marking is needed: the user opens the help when they need to know what something does or how it works. No `meta` flag, no per-help/per-screen/global granularity, no reactivation switch in Settings. **PLAN 90.5 (persist "ya visto" in `meta`, reactivable from Settings) is dropped from this change's scope.** |
| D2 | Auto-open on first view | **Never.** Help is passive-by-default and opens only on explicit user action. Aligns with research finding 4. |
| D3 | Deload / Recovery Score copy | **Fix inside this change.** The deload copy claims a 40–50% weight cut while `domain/deload.ts:133-136` cuts 10%; the Recovery Score ranges are 0–39 / 40–69 / 70–100 (`domain/recoveryScore.ts:89-90`), not 0-30/31-60/61-100. |
| D4 | Component-test tooling | **No new infra.** Pure-domain unit tests (vitest, DOM-less) plus Playwright e2e; no jsdom and no Testing Library. |

Consequence of D1: the help catalog still needs stable typed ids (for i18n keyed by id), but nothing is persisted and no Settings surface is added for help.

## Readiness

`proposal_ready: true`

Reason: selected research is `done` with admitted grants, the evidence references are valid in both stores at revision 2, the selected store mode (`both`) is ready at equal revision and bytes, and the product decisions above are `confirmed` by the user. The `sdd-propose` phase may be invoked with this confirmed pre-proposal handoff.

## Research findings that must reach `propose` unchanged

1. Systematic contextual help is **not required at WCAG 2.2 AA** — SC 3.3.5 Help is AAA, and SC 3.2.6 Consistent Help explicitly excludes interface-level contextual help. It is a product-quality choice.
2. There is **no consensus ARIA pattern for a tap-opened anchored help bubble**. `role="tooltip"` (APG) is non-consensus, forbids interactive content, and does not support `aria-expanded`; the practical candidates are `aria-describedby` over a hidden disclose-on-demand node, an `aria-expanded` disclosure, or a non-modal dialog.
3. **SC 2.5.8** sets the AA floor at 24×24 CSS px, not 44 px; the repo's 44 px rule is a stricter internal constraint.
4. Auto-opening help on first view is only defensible for genuinely novel/opaque surfaces (Material 3 sanctions it for new-feature tooltips; NN/g's evidence is that launch-time push revelations are skipped and forgotten). Passive-by-default is the evidence-aligned position.
5. A global "help mode" revealing all `?` at once has **no supporting source**, and adjacent guidance argues against it (one tooltip at a time; no chains of tips).
