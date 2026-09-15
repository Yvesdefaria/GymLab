> ⚠️ **ALCANCE REDUCIDO — DOCUMENTO OBSOLETO.** Este archivo describe el alcance amplio que el usuario RECHAZO. Lo entregado esta en `OUTCOME.md` (misma carpeta). No leer como estado del codigo.

# Design — f90-ayuda-contextual

## Decision context

- Change: `f90-ayuda-contextual` — one new capability, `contextual-help`. Phase A only: shared trigger + typed catalog + Recovery Score, Deload card, Deload banner.
- Store: `both` — this file + Engram `sdd/f90-ayuda-contextual/design`.
- Delivery strategy: `ask-on-risk`; review budget 800 lines. Rollback = revert the phase commits; no persisted data, no migration.
- Binding constraints: D1 no seen-state, D2 never auto-open, D3 fix both shipped strings, D4 no new test infra or dependency. Architecture UI → hooks → repositories → Dexie with `domain/` pure. Help is **not** an AA requirement (SC 3.3.5 is AAA; SC 3.2.6 excludes contextual help); the SC that bind are 2.5.8, 1.4.13, 2.4.11, 4.1.2, 1.4.3, 1.4.11. Target floor AA 24×24 px, **repo floor 44×44 px**.
- Size note: this artifact exceeds the phase skill's generic 800-word guidance because the phase contract requires eight decided questions plus contracts, per-file plan and test strategy. It stays **below the cited repo precedent** (`f95-gamificacion/design.md`, 2563 words) and is table-first to keep review cost down.

## Technical approach

Upgrade the existing `InfoTip` primitive in place (one a11y fix, six call sites benefit), wrap it in a thin typed `HelpHint id` that resolves copy from `domain/help.ts`, and add the three Phase A surfaces. Numeric copy is pinned to domain constants by a DOM-less unit test.

## Architecture decisions

### D1 — ARIA pattern: disclosure (`aria-expanded`) with `aria-describedby`

| Option | Tradeoff | Decision |
|---|---|---|
| (a) `aria-describedby` → node hidden by default, revealed on demand | No APG pattern name; state not exposed unless `aria-expanded` added | **Adopted as the association half** (MDN: describedby may reference a hidden, disclose-on-demand node) |
| (b) Disclosure: `role=button` + `aria-expanded` controlling a content region | APG-sanctioned; supports the open state that `role="tooltip"` cannot | **Adopted as the pattern** |
| (c) Non-modal `role="dialog"` | Implies focus containment the component does not implement; a11y smell | Rejected |
| `role="tooltip"` | APG self-declares "work in progress; no task force consensus"; forbids interactive content; **does not support `aria-expanded`** | **Prohibited by spec** |

**Choice**: one `<button type="button">` trigger carrying `aria-label` (concept name), `aria-expanded`, `aria-controls={contentId}`, `aria-describedby={contentId}`. The content node is a plain `<div>` with **no role** (not `dialog`, not `tooltip`), always in the DOM, `hidden` when closed. `contentId` from `useId()`. `aria-describedby` therefore exposes the description to AT at focus time even while collapsed, and `aria-expanded` reports state to sighted keyboard users. `role="tooltip"` is never emitted.

**Non-obvious implementation detail**: `aria-describedby` requires the node to exist. Keep it mounted and toggle the `hidden` attribute; measure with `useLayoutEffect` so the `position: fixed` coordinates are applied before first paint (no 0,0 flash, no conditional mount).

### D2 — One disclosure at a time; three dismissal paths; focus always returns; motion is opt-in

| Concern | Decision |
|---|---|
| Single open | Module-scoped registry inside `InfoTip.tsx`: `let activeClose: (() => void) \| null`. Opening calls the previous entry's close, then registers. No provider, no `AppShell` change, no store, no persistence. |
| Dismissal | Escape (`useCloseOnEscape`, existing hook, target `document`), outside `pointerdown`, and an inner close `<button>` (lucide `X`, 44×44, `aria-label` from i18n). All three close; content never auto-hides (SC 1.4.13 Persistent). |
| Focus return | **Every** close path calls `triggerRef.current?.focus({ preventScroll: true })`. One code path, never strands focus on `body`, satisfies the spec literally; `preventScroll` avoids the close-time scroll jump. Skipped only if the trigger has unmounted. |
| Not obscuring the trigger | Positioning is unchanged (computed beside/below the root rect with viewport clamping), so the popover never overlaps the focused trigger (SC 2.4.11). The `POPOVER_W`/`GAP`/`EDGE` math is kept as-is. |
| Motion | No unconditional animation. A `motion-safe:` entry animation only, applied to the popover **itself** (the fixed element), end state `transform: none`, `animation-fill-mode: backwards`. Under `prefers-reduced-motion: reduce` the global `animation: none` override applies, so nothing moves. |
| Target size | Trigger becomes `size-11` (44×44) + `touch-manipulation`. Icon glyph is `text-muted` → measured ≈5.6:1 on the card surface (≥3:1 for SC 1.4.11 non-text); the `border-border` ring is decorative. |
| Contrast | Popover text `text-muted` on `bg-bg-elevated` measures ≈5.6:1 (dark default) / ≈5.3:1 (light default) — passes SC 1.4.3 (4.5:1). Focus ring is the global `:focus-visible` CTA outline ≈9.5:1 vs page background. Values are arithmetic; re-verify in verify phase. |

### D3 — HAZARD: `.reveal` fill-mode `both` breaks `position: fixed` popovers

`src/index.css:706-708` sets `.reveal { animation: page-in 0.4s … both; }` and `page-in` (`:741-750`) ends at `transform: translateY(0)`. `both` retains the final keyframe, and a residual non-`none` transform makes the element a containing block for `position: fixed` descendants.

Verified blast radius for this change: **both new surfaces are inside `.reveal`** — `DeloadBanner.tsx:19` (`className="reveal …"`) and `EntrenarPage.tsx:245` (`div.reveal.reveal-2` wrapping `RecoveryScoreCard` at `:246`). A popover there would be offset by the ancestor's position.

**Choice**: change `.reveal` to `animation: page-in 0.4s … backwards`, exactly the fix already applied to `.animate-page-in` at `index.css:699-704` (whose comment at `:700-702` documents this very bug for `InfoTip`). At rest the base state is identical (`opacity: 1`, no transform), so there is **no visual change**; during the `animation-delay` of `.reveal-1…5` (`:709-713`) the first keyframe still holds, so stagger behaviour is unchanged. Third `.reveal` usage (`HeroCard.tsx:35`) carries no popover and is unaffected. **Rejected alternative**: portalling the popover to `document.body` (`createPortal`, no new dependency) — more robust against any future ancestor transform, but restructures outside-click logic and the DOM for a hazard that one word removes; documented as the escape hatch if a third residual-transform ancestor appears.

### D4 — `RecoveryScoreCard`: de-nest the container without losing the breakdown toggle

Confirmed hazard: `RecoveryScoreCard.tsx:39-43` makes the **entire card** a `<button>`; nesting the help `<button>` inside is invalid HTML plus an ARIA interactive-descendant failure.

**Choice**: container becomes a `<div>`; the breakdown toggle becomes its own real `<button>` in the header row, and `HelpHint` is its **sibling**.

- `aria-expanded={expanded}` + `aria-controls={BREAKDOWN_ID}` on the toggle; the breakdown stays mounted with `hidden={!expanded}` so `aria-controls` is stable.
- Toggle hit area `size-11` (44×44), `aria-label` **static** (`home.recovery.toggleDesglose`) — state is carried by `aria-expanded` per APG, not by label swapping. Chevron becomes lucide `ChevronRight` with `aria-hidden` (icon, not emoji).
- `HelpHint` sits before the toggle in the header flex row, outside every interactive subtree.

**Tradeoff accepted**: the whole-card tap is dropped. A card-level native button cannot legally contain the trigger, and a `div[role="button"]` parent still ignores nested interactive descendants. The toggle survives as a labelled, keyboard-operable 44×44 control. E2E surface check: `tests/e2e` has no assertion on the recovery card's expandability (the only `desglose` hit is an unrelated comment in `test_f93_16_chapas.py:112`), and F99 asserts shell/hero/tabbar only.

### D5 — Catalog contract: pure domain, compiler-enforced parity, numbers anchored to the domain

`src/domain/help.ts` (new, pure — no React, no Dexie, no UI):

```ts
import type { I18nKey } from '@/i18n'   // type-only: erased at build, no runtime coupling

export type HelpId = 'recoveryScore' | 'deload' | 'deloadBanner'
export interface HelpEntry { readonly id: HelpId; readonly labelKey: I18nKey; readonly bodyKey: I18nKey }
export const HELP_IDS = ['recoveryScore', 'deload', 'deloadBanner'] as const
export const HELP_CATALOG: Readonly<Record<HelpId, HelpEntry>> = { … }
export const helpEntry = (id: HelpId): HelpEntry => HELP_CATALOG[id]
```

- **Parity is already in the compiler**: `en/index.ts:9` declares `export const en: EsSchema`. A key added to `es` and missing from `en` fails `tsc`. Typing `labelKey`/`bodyKey` as `I18nKey` (`= ParseKeys` over `EsSchema`) makes a typo'd key a compile error, and `HelpId` makes an unknown id at a call site a compile error. `import type` keeps `domain/` free of any runtime dependency (precedent: `components/nutrition/mealTypeMeta.ts:3`).
- **Key naming**: one shape for new keys, `<area>TipLabel` / `<area>TipCuerpo`, which is the shape already shipped at `core.ts:473-474` — avoids adding a fourth shape.
- **Numeric anchoring (no literal duplication)**: export the owning constants and make the copy a static string that a pure unit test checks **against** them.
  - `domain/deload.ts`: `export const DELOAD_REDUCTION_PCT = 10`, used as the default argument of `generateDeloadGuidance` (`:135`) and `deloadSuggestedWeight` (`:147`).
  - `domain/recoveryScore.ts`: `export const RECOVERY_MAYBE_MIN = 40` and `export const RECOVERY_READY_MIN = 70`, used in the classification ternary (`:89-90`).
  - Test assertions derive the expected substrings from those constants, e.g. ``expect(es.home.deloadTipCuerpo).toContain(`${DELOAD_REDUCTION_PCT}%`)`` and ``expect(es.home.recoveryTipCuerpo).toContain(`${RECOVERY_MAYBE_MIN}–${RECOVERY_READY_MIN - 1}`)``. Changing a threshold without updating the copy **fails the test** — exactly the spec scenario. Static copy is chosen over i18next interpolation of these numbers because the ranges sentence cannot be interpolated cleanly and the spec requires the assertion to fail on divergence.

### D6 — `HelpHint` wraps `InfoTip`; `InfoTip` is upgraded, never replaced

`InfoTip` keeps its exact public contract `{ label: string; children: ReactNode; className?: string }`, so the 5 existing call sites (6 instances) compile untouched and inherit the a11y fix centrally. `HelpHint` is a thin typed wrapper:

```tsx
type HelpHintProps = { id: HelpId; className?: string }
export const HelpHint = ({ id, className }: HelpHintProps) => {
  const { t } = useTranslation()
  const { labelKey, bodyKey } = HELP_CATALOG[id]
  return <InfoTip className={className} label={t(labelKey)}>{t(bodyKey)}</InfoTip>
}
```

**Nesting prohibition (part of the contract, documented as JSDoc on both components and in this design)**: "Never render `HelpHint`/`InfoTip` inside another interactive element (`button`, `a`, `input`, `[role="button"]`, `label`). Render it as a sibling in the owning container." The 5 existing sites are safe (verified): `DeloadCard.tsx:88` sits in a `div.flex` that is a **sibling** of the switch button at `:94`; the others are inline in non-interactive rows.

### D7 — Deload: correct in place, and add the missing banner entry

- `profile/DeloadCard.tsx:88`: replace `InfoTip` with `<HelpHint id="deload" />`. Copy is corrected **in situ**, key preserved: `home.deloadTipCuerpo` (es `core.ts:474` + en `core.ts:474`) changes `(40–50%)` → the applied reduction, and must no longer contain `40–50`.
- `deload/DeloadBanner.tsx`: add `<HelpHint id="deloadBanner" />` as a sibling of the title `<p>` (`:27-29`) inside a title flex row. The `<section>` is non-interactive, so no nesting. New distinct keys `perfil.deloadBannerTipLabel` / `perfil.deloadBannerTipCuerpo` (its own label, not the card's, to keep accessible names unique and specific).
- F93 surface is untouched: the switch keeps `role="switch"` and the exact name `"Activar semana de deload"`; adding a sibling button does not alter `sw.count()` or its name.

### D8 — Inclusion rule and documented exclusions

Help exists only where a metric is not self-explanatory; a sufficient visible label is an exclusion; one trigger explains one concept. Phase A adds triggers to exactly three surfaces (Recovery Score card, Deload card, Deload banner). **Documented exclusions for this change**: the bottom tab bar (`navigation` — labels state their destination), every Ajustes toggle (`Toggle` labels state their effect, e.g. `showWeightHint`), plain form inputs with a visible label, and every surface outside Phase A (Phase B/C owners). The exclusion list is recorded here and cited by the verify phase; no `?` is added to the 497 `.tsx` / 48 pages wholesale.

## Data flow

```
HELP_CATALOG (domain/help.ts: HelpId → { labelKey, bodyKey }: I18nKey)
      │  type-only import of I18nKey (erased) — domain stays runtime-pure
      ▼
<HelpHint id="…" /> ──t(labelKey)/t(bodyKey)──► copy (es typed source; en mirrored by `en: EsSchema`)
      ▼
<InfoTip>  trigger <button aria-label aria-expanded aria-controls aria-describedby>
      │            └─ content node (useId, hidden when closed) + inner close (44×44)
      ├─ open  → close previous registry entry (one disclosure at a time)
      ├─ close → Escape | outside pointerdown | inner close → focus({preventScroll}) to trigger
      └─ paint → useLayoutEffect measures; motion-safe: entry animation only

domain/deload.ts        DELOAD_REDUCTION_PCT ─┐
domain/recoveryScore.ts RECOVERY_{MAYBE,READY}_MIN ─┴─► tests/unit/domain/help.test.ts asserts the copy strings
```

## File changes

| File | Action | Description |
|---|---|---|
| `src/domain/help.ts` | Create | `HelpId`, `HelpEntry`, `HELP_IDS`, `HELP_CATALOG`; pure, type-only i18n import |
| `src/domain/deload.ts` | Modify | Export `DELOAD_REDUCTION_PCT = 10`; use as the default arg of both deload weight functions |
| `src/domain/recoveryScore.ts` | Modify | Export `RECOVERY_MAYBE_MIN = 40`, `RECOVERY_READY_MIN = 70`; use in the classification ternary |
| `src/components/ui/InfoTip.tsx` | Modify | 44×44 trigger, disclosure ARIA + `aria-describedby`, mounted hidden node, inner close, focus return, single-disclosure registry, `motion-safe:` entry |
| `src/components/ui/HelpHint.tsx` | Create | Typed wrapper: `id` → `labelKey`/`bodyKey` → `InfoTip` |
| `src/components/home/RecoveryScoreCard.tsx` | Modify | Card `<button>` → `<div>`; labelled 44×44 breakdown toggle; `HelpHint` sibling |
| `src/components/profile/DeloadCard.tsx` | Modify | `InfoTip` → `<HelpHint id="deload" />` |
| `src/components/deload/DeloadBanner.tsx` | Modify | Add `<HelpHint id="deloadBanner" />` in the title row |
| `src/i18n/locales/es/core.ts` | Modify | Fix `home.deloadTipCuerpo`; add `home.recoveryTip{Label,Cuerpo}`, `home.recovery.toggleDesglose`, `perfil.deloadBannerTip{Label,Cuerpo}`, `layout.help.cerrar` |
| `src/i18n/locales/en/core.ts` | Modify | Mirror every key (required by `en: EsSchema`) |
| `src/index.css` | Modify | `.reveal` fill-mode `both` → `backwards` (D3) |
| `tests/unit/domain/help.test.ts` | Create | Catalog + parity + domain-anchored copy assertions |
| `tests/e2e/test_f90_ayuda.py` | Create | Python Playwright, Phase A scenarios |
| `CHANGELOG.md`, `PLAN.md` | Modify | Unreleased entry; Phase 90 checkboxes |

## Testing strategy

| Layer | What to test | Approach |
|---|---|---|
| Unit (pure, DOM-less) | `HELP_CATALOG` covers exactly `HELP_IDS`; each `labelKey`/`bodyKey` resolves to a non-empty string in the `es` bundle (dot-path walk) | vitest, `tests/unit/domain/help.test.ts`; imports `@/i18n/locales/es` and `@/i18n/locales/en` directly (data only, no i18next init) |
| Unit | Numbers in copy derive from the domain: deload copy contains `${DELOAD_REDUCTION_PCT}%` **and not** `40–50`; recovery copy contains `0–${MAYBE_MIN-1}`, `${MAYBE_MIN}–${READY_MIN-1}`, `${READY_MIN}–100`; same assertions on `en` | Same file. Expectations computed from the imported constants, so a threshold change fails the assertion until the copy follows |
| E2E | Trigger bounding box ≥44×44; click opens the disclosure (`aria-expanded=true`); `aria-describedby` resolves to a node containing the ranges; Enter and Space open from a focused trigger; Escape / outside tap / inner close each close; focus is on the trigger after Escape and after inner close; opening a second `?` leaves exactly one visible; `[role="tooltip"]` count is 0; reduced-motion (`emulate_media`) leaves the popover with no animation; no disclosure visible on first render of each surface (no auto-open); deload card copy shows `10%` and not `40–50%`; banner exposes a trigger with an active deload week; the bottom tab bar and the Ajustes toggles expose no trigger (D8); no `meta` key whose name mentions help is written | `tests/e2e/test_f90_ayuda.py`, viewport 375×812, IndexedDB seeding per `test_f93_t3_deload.py` pattern |
| E2E regression | F93 deload switch (exact name `"Activar semana de deload"`) and F99 home layout still pass | Re-run `python tests/e2e/scripts/with_server.py tests/e2e/test_f93_t3_deload.py` and `… test_f99_home_layout.py` |
| Gate | `npx tsc --noEmit` + `npm run build` from `gymlab-app/` | Missing `en` key fails here (compile), backing the "build fails with a type error" scenario |

No jsdom, no Testing Library: component behaviour is covered only by e2e, per D4. Unit tests never import React.

## Threat Matrix

N/A — no routing, shell command, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary is introduced or changed. The change is limited to pure domain data, one UI primitive, three React surfaces, i18n strings and one CSS fill-mode.

## Migration / Rollout

No migration required. No persisted key is added or changed; no `meta` write, no Ajustes surface, no dependency change. Rollout is one PR (single capability, Phase A); rollback is reverting the phase commits — everything is additive except `InfoTip` internals, the `.reveal` fill-mode and two i18n strings.

## Open Questions

- None blocking. Deferred and explicitly out of this change: whether Phase B reuses `ChartCard`'s existing `actions` slot as the stats help insertion point; whether the popover should later move to a `document.body` portal if a third residual-transform ancestor appears (D3 escape hatch); the `role="tooltip"` prohibition stays permanent regardless.
