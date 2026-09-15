> ⚠️ **ALCANCE REDUCIDO — DOCUMENTO OBSOLETO.** Este archivo describe el alcance amplio que el usuario RECHAZO. Lo entregado esta en `OUTCOME.md` (misma carpeta). No leer como estado del codigo.

# Proposal: f90-ayuda-contextual

## Intent

Metrics are opaque (Recovery Score ranges, deload weight cut, stats charts) and two shipped help strings state wrong numbers. `InfoTip.tsx` already provides the `?` but has a 24×24 px trigger, `role="dialog"` without focus handling, no inner close, and per-call-site copy with no es/en guarantee. Make help typed, on-demand, and limited to non-obvious concepts. Maps to `PLAN.md` Fase 90 (reframed); 90.5 dropped.

## Scope

**In:** upgrade `InfoTip` in place (44×44 trigger, ARIA + focus, inner close); pure typed catalog `domain/help.ts` resolving id → es/en i18n; phased help (Phase A = Recovery Score + Deload); fix deload copy (40–50% → 10%) and Recovery Score ranges (0–39/40–69/70–100); pure-domain vitest + Playwright e2e.

**Out:** seen-state / `meta` flag / Settings switch (D1); auto-open (D2); global help mode; guided onboarding (Fase 101); new test infra (D4) or dependencies; `?` on every component (497 `.tsx`).

## Capabilities

**New:** `contextual-help` — on-demand `?`, typed catalog with es/en parity, factually correct copy.
**Modified:** None — no existing spec covers help or the deload copy.

## Approach

1. Improve `InfoTip`, do not replace. Design picks the ARIA pattern (`aria-describedby` to a hidden disclose-on-demand node, `aria-expanded` disclosure, or non-modal dialog); `role="tooltip"` is non-consensus and forbids interactive content.
2. `domain/help.ts` owns help ids and definitions (pure). `<HelpHint id>` resolves copy via typed `I18nKey`, compiler-enforcing es/en parity; copy lives in i18n, not at call sites.
3. Inclusion rule: non-obvious metrics only, with an exclusion list. Phases: A → stats → high-incomprehension groups.
4. Help is not AA-required (SC 3.3.5 AAA; SC 3.2.6 excludes it); AA target floor is 24×24 px, repo rule 44 px.

## Affected Areas

| Area | Impact |
|---|---|
| `src/components/ui/InfoTip.tsx` | Modified — 44 px, ARIA/focus, inner close |
| `src/domain/help.ts`, `src/components/ui/HelpHint.tsx` | New — catalog + trigger |
| `src/i18n/locales/{es,en}/core.ts` | Modified — help keys; deload fix |
| `RecoveryScoreCard.tsx`, `DeloadCard.tsx`, `DeloadBanner.tsx` | Modified — help entries |
| `tests/unit/domain/help.test.ts`, `tests/e2e/test_f90_ayuda.py` | New |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| No consensus ARIA pattern for a tap-opened `?` | Med | Decide in design; `role="dialog"` stays viable |
| E2E breakage on touched surfaces | Med | Distinct labels; re-run F93 and F99 e2e |
| Scope creep to "every component" | Med | Inclusion rule, phasing, explicit out list |
| Copy drifts from code again | Low | Unit-assert copy against domain constants |

## Rollback Plan

Revert the phase commits. Everything is additive except `InfoTip` internals and two i18n strings; restoring both returns prior behavior. No persisted data, no migration.

## Dependencies

None new. Reuses `useCloseOnEscape`, i18n, lucide-react, vitest, Python Playwright.

## Success Criteria

- [ ] `?` is ≥44×44 px, keyboard reachable, opens on tap/Enter/Space, closes on Escape/outside tap/inner close; focus returns to trigger.
- [ ] Help copy resolves from the typed catalog; the build fails when an `en` key is missing.
- [ ] Deload help says 10%; Recovery Score help says 0–39/40–69/70–100, matching `domain/recoveryScore.ts`.
- [ ] No seen-state, no auto-open, no new Ajustes surface, no dependency.
- [ ] `npm run build` + `npm test` pass from `gymlab-app/`; F90 e2e passes; F93/F99 e2e still pass.
- [ ] `CHANGELOG.md` and PLAN Fase 90 checkboxes updated.
