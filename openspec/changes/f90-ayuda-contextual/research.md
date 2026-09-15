# Research — f90-ayuda-contextual

| Field | Value |
|---|---|
| schema | `gentle-ai.sdd-research/v1` |
| revision | **2** |
| outcome | **done** |
| change | `f90-ayuda-contextual` |
| store | `both` (OpenSpec repo-local + Engram; hybrid) |
| date | 2026-09-15 |
| phase skill | `sdd-research` |
| supersedes | revision 1 (`blocked` — admission denial, empty grants) |

## 1. Retained request (as selected — unchanged from revision 1)

Research lane: **Accessible, systematic contextual help in a mobile-first PWA.**

| # | Question |
|---|---|
| Q1 | Interaction pattern for a mobile `?` (no hover): anchored popover vs bottom sheet vs inline disclosure vs global "help mode" — tradeoffs on a small screen |
| Q2 | WCAG 2.2 requirements for on-demand help content: `role="tooltip"` vs `role="dialog"` vs `aria-describedby` vs `<details>` disclosure; focus handling; Escape; touch targets; contrast; screen readers (cite specific SC numbers) |
| Q3 | Systematic coverage without saturating the UI: progressive disclosure, typed help catalogs, when NOT to add help, acceptable affordance density |
| Q4 | "Already seen" persistence: first-time hints vs on-demand help; auto-open vs badge/pulse vs mark-seen-without-opening; how to replay from Settings |
| Q5 | State of the art: how known products document this (Apple HIG, Material Design 3, NN/g) — with links |

Requested source classes: `documentation`, `open-web`.

## 2. Admission (fail-closed)

Runtime capability declaration (v1), observed in this run:

```
gentle-ai.sdd-research-capability/v1
grants:
  documentation: [WebFetch]
  open-web: [WebSearch, WebFetch]
```

| Requested class | Grant observed | Actual tools used | Decision |
|---|---|---|---|
| `documentation` | `[WebFetch]` | `WebFetch` (W3C, MDN, Apple, Material) + `WebSearch` page-content extraction for JS-gated vendor pages (see §4 retrieval note) | **admitted** |
| `open-web` | `[WebSearch, WebFetch]` | `WebSearch` (discovery) + `WebFetch` (NN/g) | **admitted** |

- No evidence capability was inferred from Bash, generic MCP servers, persistence access, filenames, or inherited tools. `bash` and `task` are not evidence grants and were not used as such.
- Both requested classes admitted → the lane could proceed. Contrast with revision 1, where `documentation=[]` and `open-web=[]` produced `blocked`.

## 3. Sources

All sources below were retrieved and their excerpts read in this run. `accessed_at = 2026-09-15`.

| id | class | title | publisher | URL | excerpt (verbatim, truncated) |
|---|---|---|---|---|---|
| S01 | documentation | Understanding SC 2.5.8 Target Size (Minimum) (Level AA) | W3C / WAI | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html | "The size of the target for pointer inputs is at least 24 by 24 CSS pixels, except when: Spacing … As a best practice it is recommended to at least meet the minimum size requirement of the Success Criterion" |
| S02 | documentation | Understanding SC 1.4.13 Content on Hover or Focus (Level AA) | W3C / WAI | https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html | "Where receiving and then removing pointer hover or keyboard focus triggers additional content to become visible and then hidden, the following are true: Dismissible … Hoverable … Persistent"; "Custom tooltips, sub-menus, and other nonmodal popups that display on hover and focus are examples" |
| S03 | documentation | Understanding SC 3.2.6 Consistent Help (Level A) | W3C / WAI | https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html | "they occur in the same order relative to other page content"; "This is distinct from interface-level help, such as contextual help, features like spell checkers, and instructional text in a form." |
| S04 | documentation | Understanding SC 3.3.5 Help (Level AAA) | W3C / WAI | https://www.w3.org/WAI/WCAG22/Understanding/help.html | "Context-sensitive help is available."; "Context-sensitive help only needs to be provided when the label is not sufficient to describe all functionality. The existence of context-sensitive help should be obvious to the user and they should be able to obtain it whenever they require it." |
| S05 | documentation | Understanding SC 2.4.11 Focus Not Obscured (Minimum) (Level AA) | W3C / WAI | https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html | "When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content."; examples of non-persistent disclosures include "menu items, select element items, combobox lists … and tooltips" |
| S06 | documentation | Understanding SC 1.4.3 Contrast (Minimum) (Level AA) | W3C / WAI | https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html | "contrast ratio of at least 4.5:1"; "Large-scale text and images of large-scale text have a contrast ratio of at least 3:1"; applies to "text that is shown when a pointer is hovering over an object or when an object has keyboard focus" |
| S07 | documentation | Understanding SC 1.4.11 Non-text Contrast (Level AA) | W3C / WAI | https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html | "contrast ratio of at least 3:1 against adjacent color(s)" for user interface components and states; "the visual focus indicator for a component must have sufficient contrast against the adjacent background when the component is focused" |
| S08 | documentation | Understanding SC 4.1.2 Name, Role, Value (Level A) | W3C / WAI | https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html | "the name and role can be programmatically determined; states, properties, and values … can be programmatically set; and notification of changes … is available" |
| S09 | documentation | ARIA Authoring Practices Guide — Tooltip Pattern | W3C / WAI | https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/ | "NOTE: This design pattern is work in progress; it does not yet have task force consensus."; "The element that serves as the tooltip container has role tooltip. The element that triggers the tooltip references the tooltip element with aria-describedby."; "Escape: Dismisses the Tooltip." |
| S10 | documentation | ARIA Authoring Practices Guide — Disclosure (Show/Hide) Pattern | W3C / WAI | https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/ | "a disclosure button and a section of content whose visibility is controlled by the button"; "the element with role button has aria-expanded set to true … When the content area is hidden, it is set to false." |
| S11 | documentation | ARIA: `tooltip` role | MDN (Mozilla) | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tooltip_role | "The tooltip is not the appropriate role for the more information 'i' icon"; "a tooltip cannot contain interactive elements like links, inputs, or buttons"; "the aria-expanded role is not supported"; "the Escape should close it if it is open" |
| S12 | documentation | ARIA: `aria-describedby` attribute | MDN (Mozilla) | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby | "It is possible to reference an element even if that element is hidden. For example, a form control can have a description that is hidden by default and revealed on request using a disclosure widget"; "If the content is extensive, contains useful semantics, or has a complex structure … use aria-details instead" |
| S13 | documentation | Offering help | Apple (Human Interface Guidelines) | https://developer.apple.com/design/human-interface-guidelines/offering-help | "Display a popover tip when you want to preserve the content flow, or an inline tip when you want to ensure that surrounding information is visible."; "Be brief. As much as possible, limit tooltip content to a maximum of 60 to 75 characters" |
| S14 | documentation | Tooltips — guidelines | Material Design 3 (Google) | https://m3.material.io/components/tooltips/guidelines | "Rich tooltips are best used for longer text like definitions or explanations."; "Persistent rich tooltips appear when either: The parent element is clicked • The page loads and a new feature is being explained"; "Tooltips shouldn't cover the parent element."; "Don't: Only display one tooltip at a time" |
| S15 | documentation | Bottom sheets — overview / accessibility | Material Design 3 (Google) | https://m3.material.io/components/bottom-sheets/overview | "Bottom sheets show secondary content anchored to the bottom of the screen"; "Content should be additional or secondary (not the app's main content)"; drag handle "accessible 48dp hit target" |
| S16 | documentation | Onboarding | Apple (Human Interface Guidelines) | https://developer.apple.com/design/human-interface-guidelines/onboarding | "Consider providing a collection of context-specific tips instead of a single onboarding flow."; "If you let people skip the tutorial when they first launch your app or game, don't present it again on subsequent launches, but make sure it's easy for people to find if they want to view it later."; "If it makes sense to offer a separate tutorial, consider making it optional." |
| S17 | open-web | Progressive Disclosure | Nielsen Norman Group | https://www.nngroup.com/articles/progressive-disclosure/ | "Initially, show users only a few of the most important options. Offer a larger set of specialized options upon request."; "designs that go beyond 2 disclosure levels typically have low usability" |
| S18 | open-web | Tooltip Guidelines | Nielsen Norman Group | https://www.nngroup.com/articles/tooltip-guidelines/ | "Don't use tooltips for information that is vital to task completion."; "Because tooltips are initiated by a hover gesture … They are not normally available on touchscreens."; touchscreen equivalent is the "popup tip", triggered by "Touch/click", terminated by tap-to-close |
| S19 | open-web | Onboarding Tutorials vs. Contextual Help | Nielsen Norman Group | https://www.nngroup.com/articles/onboarding-tutorials/ | "Tutorials interrupt users, don't necessarily improve task performance, and are quickly forgotten. Contextual help signals can avoid these pitfalls"; "Make it easy to dismiss (and recall) the help content"; "Skip the obvious stuff."; "Use progressive disclosure in the help content." |
| S20 | open-web | Instructional Overlays and Coach Marks for Mobile Apps | Nielsen Norman Group | https://www.nngroup.com/articles/mobile-instructional-overlay/ | "Presenting hints one-by-one, at the right moment, makes it a lot easier for users to understand and learn instructions."; "Showing multiple coach marks or tips in a row … can also make your app appear overly complicated"; "keep them as short as possible" |
| S21 | open-web | Bottom Sheets: Definition and UX Guidelines | Nielsen Norman Group | https://www.nngroup.com/articles/bottom-sheet/ | "they intentionally obscure some of the screen, they aren't suited for displaying always needed information"; "the bottom of the screen is often not the most easily reachable screen region (the middle of the screen represents the most easily tappable area)"; "Use Bottom Sheets Only for Short Interactions" |

**Retrieval note (disclosed uncertainty).** S13, S14, S15, S16 live on JavaScript-gated documentation sites: a direct `WebFetch` returned only "This page requires JavaScript." Their content above was obtained through `WebSearch` page-content extraction of the same canonical URLs, and the excerpts are quoted from that extracted text. They are recorded as **verified-by-extraction**, not as raw-HTML-verified. S01–S12 and S17–S21 were read directly by `WebFetch`.

## 4. Validated claims

Every claim below maps to at least one source id. Claims without a source are not emitted; own recommendations are separated in §7.

### Q1 — Interaction pattern for a mobile `?`

| id | claim | sources |
|---|---|---|
| Q1-C1 | Hover-triggered tooltips are effectively unavailable to touchscreen users; the touchscreen equivalent is a **popup tip**, opened by tap/click on a `?` or `i` icon and terminated when the user taps to close or taps elsewhere. | S18 |
| Q1-C2 | Apple HIG names two contextual-help deliveries: a **popover tip** (preserves content flow) and an **inline tip** (keeps surrounding information visible); annotation-style tips point at a specific element, hint-style tips are not tied to one. | S13 |
| Q1-C3 | Material 3 recommends **rich tooltips for longer text such as definitions or explanations**; plain tooltips are for labelling icon-only controls without text. | S14 |
| Q1-C4 | Material 3 rich tooltips may be **persistent**, opened by click/tap, and can contain a subhead, buttons and hyperlinks. | S14 |
| Q1-C5 | Material 3 positions rich tooltips dynamically to avoid going off-screen and explicitly says a tooltip **"shouldn't cover the parent element"**. | S14 |
| Q1-C6 | NN/g: a bottom sheet is a form of progressive disclosure that **preserves substantial visibility of the underlying content**, making it useful when users must refer to background information — but it intentionally obscures part of the screen, so it is **unsuitable for always-needed information**. | S21 |
| Q1-C7 | NN/g directly challenges the common "bottom sheets are more reachable" rationale: **the middle of the screen, not the bottom, is the most easily tappable region** across grips. | S21 |
| Q1-C8 | NN/g: bottom sheets should be used **only for short interactions**, not for lengthy content. | S21 |
| Q1-C9 | The APG **Disclosure pattern** offers an inline-expandable alternative: a `role=button` control with `aria-expanded` toggles a content section; Enter/Space activate it. | S10 |
| Q1-C10 | Material 3 explicitly lists "only display one tooltip at a time" as a **Don't** — two visible tooltips at once is an anti-pattern. | S14 |
| Q1-C11 | NN/g: **avoid chains of tips** — showing multiple coach marks/tips in a row forces memorisation, drains working memory, and makes an app look more complicated. | S20 |

**Answer to Q1.** There is no documented precedent for a global "help mode" that reveals all `?` markers at once; the closest documented guidance points the other way (S14 one-at-a-time; S20 no chains). For the three viable patterns: an **anchored popover/rich tooltip** is the documented default for explaining a specific nearby element and is the only pattern that keeps the explained content visible (S13, S14, S18); a **bottom sheet** is documented for secondary content and short interactions that preserve background context, but it hides part of the screen and its reachability advantage is a myth (S21); an **inline disclosure** (`aria-expanded`) is the documented pattern when the help is expanded in place and displaces content (S10). On a small screen, the decisive tradeoffs are: popover = context preserved, space constrained, must not cover the parent (S14) and must be clamped; sheet = more room but obscures the metric being explained and is capped to short content (S21); inline = no occlusion at all (displaces), but no longer reads as a lightweight "tip".

### Q2 — WCAG 2.2 obligations for on-demand help

| id | claim | sources |
|---|---|---|
| Q2-C1 | **SC 2.5.8 Target Size (Minimum), Level AA**: pointer targets must be at least **24×24 CSS px**, with five exceptions (spacing / 24 px non-intersecting circles, equivalent, inline, user-agent, essential). W3C states it is **best practice to meet the minimum size regardless of spacing**, and for important controls to aim for the stricter **SC 2.5.5 Target Size (Enhanced, AAA)**. | S01 |
| Q2-C2 | **SC 1.4.13 Content on Hover or Focus, Level AA** governs additional content shown on hover/focus and requires **Dismissible** (a mechanism that dismisses without moving hover or focus), **Hoverable**, and **Persistent**. Custom tooltips and non-modal popups are explicitly in scope. | S02 |
| Q2-C3 | SC 1.4.13 exempts user-agent-controlled content (e.g. the native `title` attribute) and excludes modal dialogs; content triggerable by hover should also be triggerable by keyboard focus (ref SC 2.1.1). | S02 |
| Q2-C4 | **SC 2.4.11 Focus Not Obscured (Minimum), Level AA**: a focused component must not be **entirely hidden** by author-created content. Tooltips and similar **non-persistent** disclosures do not fail because they do not persist; a disclosure that **persists** after activation or after focus moves away is at risk. | S05 |
| Q2-C5 | **SC 4.1.2 Name, Role, Value, Level A**: for every UI component the **name and role must be programmatically determinable**, settable states programmatically set, and changes notified to AT. Icon-only triggers therefore need an accessible name. | S08 |
| Q2-C6 | **SC 1.4.3 Contrast (Minimum), Level AA**: text contrast ≥ **4.5:1** (≥ **3:1** for large text, ~≥18 pt / 14 pt bold); the SC explicitly covers text shown on hover or keyboard focus. | S06 |
| Q2-C7 | **SC 1.4.11 Non-text Contrast, Level AA**: UI-component visual information and states — including the **focus indicator** — need ≥ **3:1** against adjacent colours. | S07 |
| Q2-C8 | **SC 3.2.6 Consistent Help, Level A** requires repeated help mechanisms (human contact details, human contact mechanism, self-help option, automated contact mechanism) to appear in the **same relative order** across pages; the Understanding doc explicitly says this is **distinct from interface-level help such as contextual help**. | S03 |
| Q2-C9 | **SC 3.3.5 Help, Level AAA**: "Context-sensitive help is available"; it is only needed **when the label is not sufficient**, and its existence must be obvious and always obtainable. (AAA, not AA.) | S04 |
| Q2-C10 | APG Tooltip Pattern: tooltip container `role="tooltip"`, trigger references it with **`aria-describedby`**, **Escape** dismisses, focus **stays on the trigger**, the tooltip never receives focus, and a focus-invoked tooltip dismisses on blur. The APG flags this pattern as **work in progress without task-force consensus**. | S09 |
| Q2-C11 | MDN: `role="tooltip"` is **not appropriate for the more-information "i" icon**; a tooltip **cannot contain interactive elements** (links, inputs, buttons) because it never receives focus; `aria-expanded` is **not supported** on `role="tooltip"`. | S11 |
| Q2-C12 | MDN: `aria-describedby` may reference an element that is **hidden by default and revealed on request via a disclosure widget** — sighted users open it, AT users receive it immediately as the control's description. For extensive or structurally complex descriptions, **`aria-details` is the intended alternative**. | S12 |
| Q2-C13 | Escape is the recurring, cross-source dismiss mechanism for revealed help (WCAG 1.4.13 examples, APG, MDN). | S02, S09, S11 |

**Answer to Q2 (decision-changing).** The specific SC numbers that bind a `?` affordance are **2.5.8** (target size, AA), **1.4.13** (dismissible/hoverable/persistent, AA — and only if the content is hover/focus-triggered), **2.4.11** (focus must not be entirely obscured, AA — relevant if the bubble persists), **4.1.2** (name/role/value, A), **1.4.3** and **1.4.11** (contrast, AA). Two important negative findings: (a) systematic contextual help is **not required at AA** — SC 3.3.5 is AAA and SC 3.2.6 explicitly excludes interface-level contextual help; (b) there is **no single consensus ARIA pattern for a tap-opened anchored help bubble**. `role="tooltip"` is designed for hover/focus auto-display, forbids interactive content and is non-consensus (S09, S11), which means the current `role="dialog"` is not automatically wrong and a disclosure (`aria-expanded`) is the other documented candidate. If the help text is not interactive, `aria-describedby` pointing at a hidden, disclose-on-demand element is the documented bridge that serves both sighted and AT users at once (S12).

### Q3 — Systematic coverage without saturating the UI

| id | claim | sources |
|---|---|---|
| Q3-C1 | Progressive disclosure: show only the few most important options initially; reveal the larger specialised set on request. | S17 |
| Q3-C2 | Presence on the initial display signals importance; progressive disclosure improves learnability, efficiency of use, and error rate, and does not damage the user's mental model. | S17 |
| Q3-C3 | Two things must be right: the split between initial and secondary content, and making progression **obvious** (simple mechanics + a label with clear expectation / information scent). | S17 |
| Q3-C4 | Designs exceeding **2 disclosure levels typically have low usability**. | S17 |
| Q3-C5 | **"Skip the obvious stuff"**: if the app follows conventions (gear icon = Settings), no help is needed; save contextual help for complex functionality or processes. | S19 |
| Q3-C6 | Use progressive disclosure **inside the help content** — make its existence visible but do not overwhelm with detail until asked. | S19 |
| Q3-C7 | Do not offer a tooltip whose content is obvious or redundant: it is information pollution. Lengthy content is no longer a "tip". | S18 |
| Q3-C8 | Do not put information **vital to task completion** in a tooltip, because tooltips disappear. | S18 |
| Q3-C9 | Apple: limit tooltip content to **60–75 characters**; avoid repeating the control's name; if a lot of text is needed, simplify the interface instead. | S13 |
| Q3-C10 | Apple: teach through interactivity and prefer **a collection of context-specific tips** over one onboarding flow; a context-specific tip lets people focus on a single action. | S16 |
| Q3-C11 | Material: tooltips must be informative, specific and action-oriented; plain for icon-only labels, rich for longer definitions/explanations. | S14 |
| Q3-C12 | Keep tips scannable and sparse; focus on primary user tasks or atypical interactions. | S20 |
| Q3-C13 | Only one tooltip may be visible at a time. | S14 |
| Q3-C14 | Coach marks / hints should appear **one at a time, at the moment the user reaches the relevant section**. | S20 |

**Answer to Q3.** The documented saturation controls are: an explicit **inclusion rule** (only where a metric/concept is not self-evident — S19 "skip the obvious stuff", S18 "no redundant tooltips"), a **brevity cap** (Apple 60–75 chars for a tooltip — S13), **one visible at a time** (S14), **no chains** (S20), and **≤2 disclosure levels** (S17). On the narrower sub-question of "typed help catalogs" there is **no external documentation source**: the typed `id → i18n` catalog is an engineering recommendation, not a researched finding (see §7, R1).

### Q4 — "Already seen" persistence and replay

| id | claim | sources |
|---|---|---|
| Q4-C1 | If people skip the tutorial on first launch, **do not present it again on subsequent launches**, but make it **easy to find later** — e.g. in a help, account, or settings area. | S16 |
| Q4-C2 | A separate tutorial should be **optional**. | S16 |
| Q4-C3 | Make help content **easy to dismiss AND recall**: dismissing is critical, and so is finding the information again later when it is actually useful. | S19 |
| Q4-C4 | NN/g's Evernote example: a dismissible "What's new" list remains available in the sidebar for later access. | S19 |
| Q4-C5 | Push revelations (tutorials, walkthroughs shown on launch) interrupt, are skipped, are quickly forgotten, and do **not** improve task performance; **pull revelations** (context-triggered) avoid these pitfalls. | S19 |
| Q4-C6 | Users want to start using the product immediately (paradox of the active user) and skip intrusive tutorials. | S19 |
| Q4-C7 | Coach marks that appear **on first launch for new users, one at a time as the user reaches the relevant section**, are a documented positive example. | S20 |
| Q4-C8 | Material 3: **persistent rich tooltips appear when the page loads and a new feature is being explained**, and remain active until the person interacts with another UI element. | S14 |

**Answer to Q4.** The documented pattern is **mark-as-seen plus a durable recall path**: never re-nag on later launches, and expose the same help from a stable area (Settings/help) so it can be revisited (S16, S19). Auto-open on first view is **weakly supported and context-dependent**: Material 3 sanctions it for explaining a *new feature* via a persistent rich tooltip (S14), while NN/g's evidence is that launch-time push revelations are skipped and forgotten (S19, S20). The reconcilable reading: **passive by default**, with auto-open defensible only for a genuinely opaque surface and only if it is dismissible and recallable. There is no source that recommends a badge/pulse marker for help, and none that recommends marking seen *without* the user ever opening the tip, so those two sub-options are **unsupported** by the admitted sources.

### Q5 — State of the art

| vendor | documented position | sources |
|---|---|---|
| Apple HIG | Contextual help is a first-class pattern: **popover tip vs inline tip**, annotation vs hint styles; keep tooltips to 60–75 chars; teach through interactivity; prefer **a collection of context-specific tips** to one onboarding flow; make a separate tutorial **optional**, don't re-show it after a skip, keep it reachable from help/account/settings. | S13, S16 |
| Material Design 3 | Two tooltip variants: **plain** (label icon-only controls) and **rich** (longer definitions/explanations, may hold subhead/buttons/links, can be persistent); dynamic positioning, must not cover the parent, only one at a time; **bottom sheets** for secondary, short, contextual content with a 48dp drag-handle target. | S14, S15 |
| Nielsen Norman Group | Progressive disclosure as the governing principle (≤2 levels); tooltips must not carry task-critical information; tutorials are pushy and forgettable, **pull/contextual help** wins; bottom sheets preserve context but hide part of the screen and are not more reachable; dismiss **and recall**. | S17, S18, S19, S20, S21 |

## 5. Contradictions recorded

| # | Contradiction | Sources | Reading |
|---|---|---|---|
| X1 | NN/g states tooltips "are not normally available on touchscreens" and that the touch equivalent is a separate **popup tip**; Material 3 states plain tooltips are shown "on mobile" by **tap and hold** and persistent rich tooltips by **tap**. | S18 vs S14 | Vendor disagreement on touch tooltips. For a `?` affordance, both the NN/g popup tip and the M3 persistent rich tooltip converge on **explicit tap**; M3's long-press variant has no counterpart in the other sources and conflicts with NN/g's framing. Prefer explicit tap. |
| X2 | The APG Tooltip Pattern is the canonical ARIA reference but is self-declared **work in progress without task-force consensus**; MDN simultaneously recommends `role="tooltip"` while saying it is unsuitable for `i`/`?` icons. | S09, S11 | `role="tooltip"` has **lower authority than the WCAG SCs** and its own guidance is internally tension-y for a `?` trigger. Do not treat it as a settled requirement. |
| X3 | `role="tooltip"` cannot host interactive content and does not support `aria-expanded` (S11), yet Apple/Material describe rich help bubbles that may contain **buttons and hyperlinks** (S13, S14). | S11 vs S13, S14 | A rich help bubble with links/buttons is **not a tooltip** in ARIA terms; it is a non-modal dialog or a disclosure. Pattern choice must follow content interactivity. |
| X4 | Auto-open on first view: M3 sanctions showing a persistent rich tooltip **on page load for a new feature** (S14); NN/g's pull-revelation evidence is that push/launch-time revelations are skipped and forgotten (S19). | S14 vs S19 | Both can hold if auto-open is scoped to genuinely novel/opaque surfaces and remains dismissible + recallable. Not generalisable to every `?`. |
| X5 | Repo-internal: `gymlab-app/CHANGELOG.md` asserts the `?` button keeps "touch ≥ 44px", while `InfoTip.tsx:73` is `size-6` (24×24). | Repo (not external) | Not adjudicated here; flagged for the design phase. Note that **24×24 px satisfies SC 2.5.8 at AA** (S01), so the changelog and source can both be "true" only if a hit-area wrapper exists at some call sites. |

## 6. Uncertainty and freshness

| Item | Status |
|---|---|
| Retrieval of Apple HIG and Material 3 pages | **uncertain-by-method**: JS-gated pages were read through search-page extraction, not raw fetch. Excerpts are quoted but the underlying HTML was not directly verified. |
| APG Tooltip Pattern authority | **low/fluid**: explicitly non-consensus, subject to open issues (#127, #128). |
| NN/g recency | `Tooltip Guidelines` (2019) and `Instructional Overlays and Coach Marks` (2014) are older; `Onboarding Tutorials vs. Contextual Help` (2023), `Bottom Sheets` (2023), `Progressive Disclosure` (2006, still the canonical NN/g reference). Treat the 2014/2019 pieces as durable principles, not recent measurements. |
| WCAG 2.2 Understanding docs | Living pages; last-updated stamps observed range 2025-09 to 2026-07. No errata affecting the quoted SC text was observed. |
| Unsupported sub-questions | (a) **badge/pulse marker** for unread help — no source; (b) **mark-seen without ever opening** — no source; (c) **global help mode revealing all `?` at once** — no supporting source, and adjacent sources argue against it (S14, S20); (d) **typed help catalog** — engineering recommendation, no external source. |
| No claim was substituted from model memory. Every claim in §4 carries a source id. |

## 7. Own recommendations (NON-authoritative — not evidence)

These are the research agent's engineering opinions, explicitly **not** sourced findings, and they carry no authority over product decisions.

| # | Recommendation | Basis |
|---|---|---|
| R1 | Implement one `HelpHint` primitive with a typed `id → i18n` catalog so es/en parity is compiler-enforced. | Engineering opinion; no external source (§6). |
| R2 | Default to an anchored popover for non-interactive micro-copy; escalate to a non-modal dialog/sheet only when the help contains interactive links/buttons, because `role="tooltip"` forbids them. | Direct consequence of Q2-C11 / X3. |
| R3 | If the help is non-interactive and anchored, wire the trigger with `aria-describedby` to a hidden, disclose-on-demand element — this serves sighted and AT users from one node. | Direct consequence of Q2-C12. |
| R4 | Persist seen-state per help `id` under `meta`, with a module-level constant fallback (the `useMetaValue` identity trap is a repo-internal issue, not external evidence). | Engineering opinion + repo constraint. |
| R5 | Keep passive discovery as the default; do not auto-open. | Follows S19/S20, but the position is a product judgement. |

## 8. Repo-internal cross-checks (NOT external research evidence)

Recorded only because they change what the design phase must budget for. Method: the exploration artifact's direct source reads; not re-verified in this run.

| # | Observation | Source |
|---|---|---|
| R-1 | `InfoTip.tsx:73` trigger is `size-6` (24×24); `:79` uses `role="dialog"` + `aria-label`; no focus management, no inner close control. | `openspec/changes/f90-ayuda-contextual/exploration.md` §1.2–1.3 |
| R-2 | 24×24 px **meets** SC 2.5.8 at AA (S01); the repo's own 44×44 rule is a stricter internal constraint. | S01 + `gymlab-app/AGENTS.md` |
| R-3 | `useGlobalDragScroll` bails on `button`, so a drag starting on the `?` will not scroll — a minor dead zone, not a conflict. | `exploration.md` §1.9 |
| R-4 | Two factual copy errors to fix, not propagate: Recovery Score ranges are 0–39/40–69/70–100 (not PLAN's 0-30/31-60/61-100), and the deload tip says 40–50% while the code reduces 10%. | `exploration.md` §1.7, §5 R2/R3 |

## 9. Non-authoritative product choices (retained intent — NOT evidence)

Scope decisions already taken by the user/orchestrator. Recorded so a recovery run does not re-litigate them. They are not research findings and carry no source.

| # | Decision | Origin |
|---|---|---|
| P1 | Help (`?`) targets **non-obvious concepts/metrics**, not every component. | User, agreed scope |
| P2 | Delivery is **phased**, gated by a **central help catalog**. | User, agreed scope |
| P3 | The `?` already exists as `src/components/ui/InfoTip.tsx` → **improve, do not replace**. | User, agreed scope |
| P4 | Guided onboarding is **out of scope** for this change (moved to Fase 101). | User, agreed scope |
| P5 | Constraints any design must respect: touch targets ≥44px, `prefers-reduced-motion`, no visible scrollbars, global drag-scroll, UI copy es-ES with es+en i18n parity, Capacitor/PWA mobile-first, no new dependencies without agreement. | `gymlab-app/AGENTS.md` + orchestrator |

## 10. Per-question outcome

| Question | Evidence status | Key sources |
|---|---|---|
| Q1 interaction pattern | **supported** | S10, S13, S14, S18, S20, S21 |
| Q2 WCAG 2.2 obligations | **supported** (SC 2.5.8, 1.4.13, 2.4.11, 4.1.2, 1.4.3, 1.4.11, 3.2.6, 3.3.5 + APG tooltip/disclosure + MDN) | S01–S12 |
| Q3 saturation / catalog density | **supported** for saturation controls; **unsupported** for "typed catalog" (own recommendation) | S13, S14, S16, S17, S18, S19, S20 |
| Q4 seen-state UX | **supported** for mark-seen + recall-from-Settings; **unsupported** for badge/pulse and mark-seen-without-opening | S14, S16, S19, S20 |
| Q5 state of the art | **supported** | S13–S21 |

## 11. Artifact references

| Artifact | Locator |
|---|---|
| Exploration (this change) | `openspec/changes/f90-ayuda-contextual/exploration.md` |
| This research artifact | `openspec/changes/f90-ayuda-contextual/research.md` + Engram topic `sdd/f90-ayuda-contextual/research` |
| Pre-proposal state (rev 2) | `openspec/changes/f90-ayuda-contextual/preproposal.md` + Engram topic `sdd/f90-ayuda-contextual/preproposal` |

Naming note: Engram holds a prior exploration for this change under the older name `sdd/f90-ayuda-y-onboarding/explore`; no `f90-ayuda-y-onboarding/` directory exists under `openspec/changes/`. The canonical change name for this phase is `f90-ayuda-contextual`.
