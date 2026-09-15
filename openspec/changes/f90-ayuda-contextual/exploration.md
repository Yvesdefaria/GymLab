# Exploration: Fase 90 — Contextual help and onboarding (GymLab)

Maps to `gymlab-app/PLAN.md:277-283` ("Fase 90 — Tooltips de ayuda contextuales": 90.1 reusable `Tooltip`, 90.2 stats tooltips, 90.3 Recovery Score tooltips with ranges, 90.4 Deload tooltips, 90.5 persist "already seen" in `meta`, re-enable from Ajustes).

This exploration was **explicitly expanded by the user** beyond PLAN.md:

1. "We must have an onboarding to know how to use the app" — an onboarding that actually teaches app usage, not just a splash/setup wizard.
2. "Every component or function must have an explanatory `?`" — a systematic help affordance.
3. PLAN.md Fase 90 stays as the baseline (contextual help on stats, Recovery Score and Deload + "already seen" persistence).

Scope: exploration only. No app code changed, no dependencies installed.

**Evidence tier: Verify (Tier 2), with a disclosed limitation.** The codebase-memory graph for `gymlab-app` is stale (`check_index_coverage` returned `coverage_unavailable` / `metadata_changed` / `generation_matches: false` for every cited path), so **all evidence below comes from direct source reads**, not graph queries. `grep` results are used only for exhaustive negative claims, and each negative claim states the pattern searched.

---

## 1. Current State

### 1.1 Onboarding (exists, but it is a SETUP WIZARD, not an app tour)

| Aspect | Reality | Evidence |
|---|---|---|
| Component | `Onboarding` — 291 lines | `src/components/onboarding/Onboarding.tsx:64` |
| Steps | 5: language, objective, week, profile, summary | `Onboarding.tsx:44` (`STEPS`), steps rendered `:172-183`, definitions `src/components/onboarding/steps.tsx:93-336` |
| Mount point | Lazy, inside `AppShell`, after `<TabBar/>`, wrapped in `<Suspense fallback={null}>` | `src/components/layout/AppShell.tsx:10-12`, `:61-63` |
| Gate | `metaRepo.getJson<boolean>(ONBOARDING_DONE_META_KEY, false)` | `src/hooks/useOnboardingStatus.ts:8-15` |
| Show condition | `if (done === undefined) return null; if (done || workouts.length > 0) return null` | `Onboarding.tsx:96-97` |
| Persistence | `metaRepo.setJson(ONBOARDING_DONE_META_KEY, true)` and answers under `ONBOARDING_ANSWERS_META_KEY` | `Onboarding.tsx:141`, `:167`; keys at `src/domain/onboarding.ts:5-6` |
| Re-run | **Nonexistent.** `finish()` early-returns when `done` (`Onboarding.tsx:139`) and no UI entry point calls it again (grep `Onboarding` across `src` → 19 matches, all imports/definition/step types; no Ajustes entry) |
| i18n | `onboarding.*` block, 66 keys | `src/i18n/locales/es/core.ts:574-639` |
| Tests | **Zero.** No unit test (no file matching `onboard*` under `gymlab-app/tests/unit/`) and no e2e (grep `Onboarding|onboarding` across `gymlab-app/tests` → no match) |

**What it teaches today:** nothing about *using* the app. It collects preferences (language, objective, training days, profile data, guide interests, terms) and then suggests a routine (`Onboarding.tsx:127`, `suggestRoutine` at `domain/onboarding.ts:54-66`). There is no screen that explains where Estadísticas, Rutinas, Perfil, Nutrición, Timer or the "Más" hub are, nor what they do.

**Gotcha (blocking for "re-run" designs):** the gate `done || workouts.length > 0` means a user who starts (and saves) a workout **before** finishing the wizard loses the onboarding forever with no recovery path — `done` is never written in that path, but the component self-hides anyway. Any "show it again from Ajustes" design must additionally bypass or fix this condition.

### 1.2 Help system (partial primitive exists — the `?` is already built)

**Exists:**

- `src/components/ui/InfoTip.tsx` (89 lines) — a `?` trigger (`CircleHelp` icon, lucide) that opens an anchored floating popover.
  - Trigger: `<button type="button">` with `aria-expanded` and `aria-label` — `InfoTip.tsx:68-76`.
  - Popover: `role="dialog"` + `aria-label` — `InfoTip.tsx:78-80`.
  - Positioning: `position: fixed` + viewport clamping, recomputed on scroll/resize — `InfoTip.tsx:27-46`, `:49-64`.
  - Close: `Escape` via `useCloseOnEscape` — `InfoTip.tsx:24`; outside `pointerdown` — `:53-55`.
  - Content: passed as `children`; `label` is the a11y name. **No id-based lookup, no central catalog.**
- `src/components/stats/ChartTooltip.tsx` (18 lines) — Recharts *data-hover* tooltip (shared visual style via `stats/chartStyle.ts`). This is a **different concern** from explanatory help; the PLAN's "stats tooltips" must not be confused with it.
- Inline hint copy precedents (plain text under a control): `deficitHint` / `superavitHint` (`src/pages/CaloriasPage.tsx:178,184`), `autoHint` (`src/components/workout/RestTimer.tsx:195`), `warmupHint` (`src/i18n/locales/es/routines.ts:169`), `heatmapHint` (`src/components/steps/StepHeatmap.tsx:69`), `seriesPrecargarHint` (`src/components/settings/SessionSection.tsx:46`), `languageHint` (`src/components/settings/AppearanceSection.tsx:78`), `pesoHint` (`src/components/settings/GeneralSection.tsx:17`).
- Native `title=` used as a pseudo-tooltip: `src/components/body/MeasurementsEntriesCard.tsx:48`, `src/components/calendar/MonthCalendar.tsx:125`, `src/components/calendar/WeekCalendar.tsx:70`, `Onboarding.tsx:229`.

**InfoTip usage today — 5 files, 6 instances:**

| File:line | What it explains |
|---|---|
| `src/pages/GrasaCorporalPage.tsx:147` | How body-fat % is calculated |
| `src/pages/MedidasCorporalesPage.tsx:113` | Why log measurements |
| `src/components/body/MeasurementField.tsx:42` | Per-field measurement guide |
| `src/components/insights/InsightCard.tsx:27,50,72` | Rising / falling / stable volume |
| `src/components/profile/DeloadCard.tsx:88` | What a deload week is |

**Does NOT exist** (each claim is an exhaustive grep over `gymlab-app/src`):

- `role="tooltip"` — **zero matches**.
- Any help/tour/coach-mark mode, onboarding overlay for features, or spotlight — no component, no hook (hook list read from `src/hooks/`, 66 files).
- A central help catalog / help-id registry — none.
- `aria-describedby` used for help: **only** used for form error messages (`SessionSection.tsx:113`, `src/pages/PesoCorporalPage.tsx:97`).
- Any "seen/dismissed help" persistence — grep `hasSeen|Seen|tipsSeen|_SEEN` found **only** `warmupSeen`, an ephemeral Zustand field (`src/store/activeWorkoutStore.ts:36,156,160,233...`), not persisted in `meta`.

### 1.3 InfoTip gaps that matter for making `?` systematic

| Gap | Evidence | Why it blocks scale |
|---|---|---|
| Trigger is **24×24 px** (`size-6`) | `InfoTip.tsx:73` | Violates the repo's own rule ("Touch targets ≥ 44×44px", `gymlab-app/AGENTS.md`). Acceptable for 6 hand-placed tips; not for a systematic affordance. |
| `role="dialog"` for purely informational content | `InfoTip.tsx:79` | A non-modal `dialog` with no focus management is an a11y smell. ARIA APG: informational, non-interactive popups should be `role="tooltip"` linked via `aria-describedby`; a `dialog` implies focusability/focus containment. |
| No focus management | whole file | No initial focus, no focus trap, no focus return. Keyboard users can Tab away while it stays open. |
| No inner close button | `InfoTip.tsx:77-86` | Close is Escape or outside tap only; on a phone with no Escape key, the only way out is tapping elsewhere. |
| `label` in Spanish is supplied by the caller, not by an id | call sites above | No single place guarantees es+en parity; i18n is per-caller. |
| `useMetaValue` fallback identity trap | `src/hooks/useMetaValue.ts:6-7` | `useLiveQuery(..., [key, fallback])` — an **inline object/array fallback re-subscribes every render**. Any "seen help" map passed as a fresh `{}` would cause re-subscription churn; the fallback must be a module-level constant. |

### 1.4 Overlay / sheet pattern (for deciding what the `?` reuses)

- `useCloseOnEscape` — 16 lines, `target: 'window' | 'document'` (`src/hooks/useCloseOnEscape.ts:4-16`). Reused by `InfoTip` (`:24`) and `ConfirmSheet` (`:32`).
- `ConfirmSheet` — modal bottom-sheet: `fixed inset-0 z-[120]`, backdrop click closes, panel `stopPropagation`, `role="alertdialog"` + `aria-modal` (`src/components/ui/ConfirmSheet.tsx:35-44`). **No focus trap either** — the repo's overlays are consistent but do not implement focus containment anywhere.
- Other sheets exist: `src/components/home/DaySelectorSheet.tsx`, `src/components/routines/RoutineDestinationSheet.tsx`, `src/components/session/SessionHeaderNote.tsx`, `src/components/workout/RestAlertNotice.tsx`.
- **Conclusion:** there are two established patterns — (a) anchored `position: fixed` popover (`InfoTip`) and (b) modal bottom-sheet (`ConfirmSheet`). There is **no** existing pattern for a non-modal, focus-managed, anchored tooltip. A systematic `?` that reuses `InfoTip` inherits its a11y gaps; a systematic `?` that uses bottom sheets changes the interaction model on desktop.

### 1.5 Persistence of flags (`meta`)

- Interface: `get` / `set` / `getJson<T>` / `setJson<T>` (`src/data/repositories/dexie/metaRepo.ts:5-11`); JSON rows with `try/catch` fallback (`:16-24`).
- Reactive read helper: `useMetaValue<T>(key, fallback)` (`src/hooks/useMetaValue.ts:6-7`).
- Key conventions (all in `meta`): `onboardingDone`, `onboardingAnswers` (`domain/onboarding.ts:5-6`); `settings` (`domain/settings.ts:96`); `stepsGoal`, `strideLengthCm` (`data/repositories/dexie/stepRepo.ts:12-13`); `profileName` (`hooks/useProfileName.ts:6`); `avatarUri` (`hooks/useAvatar.ts:6`); `BIRTH_DATE_KEY` / `BODY_SEX_KEY` / `HEIGHT_KEY` (`domain/profileMeta.ts`).
- **No schema versioning** in `meta`. **No generic "seen" namespace.** No `SEED_VERSION`-style help flag exists.
- **Closest precedent for the Ajustes toggle:** `showWeightHint: boolean` in `AppSettings` (`domain/settings.ts:39`, default `false` at `:84`), toggled in `GeneralSection.tsx:17`, consumed in `src/components/home/LastWeightLink.tsx:15` and `src/pages/EntrenarPage.tsx:271`. This is the pattern to copy for "show help hints".

### 1.6 Ajustes (where "re-enable help" would live)

- `AjustesPage.tsx:42-50` renders a fixed, ordered list of section components; adding a section = new file in `src/components/settings/` + export in `src/components/settings/index.ts` + one line in the page.
- Primitives in `src/components/settings/SettingsUI.tsx`: `SectionLabel`, `Toggle` (`:11-45`), `NumberField` (`:47-78`), `Select` (`:80-103`).
- Reference section showing the full idiom (conditional sub-fields, validation, `aria-describedby` errors): `src/components/settings/SessionSection.tsx:30-144`.
- i18n keys live under `ajustes.*` (`src/i18n/locales/es/core.ts:51-167`).

### 1.7 Concrete surfaces to cover — real inventory

**Estadísticas** — `src/pages/EstadisticasPage.tsx:14-49`, 4 tabs (`entreno`, `cuerpo`, `fuerza`, `periodizacion`):

- **Entreno** (`src/components/stats/EntrenamientoStats.tsx:80-135`): `SummaryCards` with 6 KPIs (streak, max streak, 30-day workouts, avg duration, weekly volume, total workouts — `:71-78`); `WeeklyGoalBullet`; `VolumeChart`; `FrequencyChart`; `VolumeByMuscleChart`; `VolumeByMuscleDonut`; `LoadRangeChart`; `VolumeRangeChart`; `JournalChart` (conditional, `:102`); `CardioProgressChart` (one per cardio exercise, `:105-113`); `E1rmChart` + `ExercisePills` ("Fuerza estimada", `:115-134`). Plus `src/components/stats/EntrenoTab.tsx:108-109` adds `MuscleFrequencyView` and `PushPullBalanceView`.
  → **~13 explanation targets in this tab alone.**
- **Cuerpo** (`src/components/stats/CuerpoStats.tsx:37-54`): `BodyWeightChart`, `ImcChart`, `BodyMeasurementsChart`, `RatiosChart`, `SkinfoldChart`, `CompositionChart`, `CompositionDonut`. → 7 more.
- **Fuerza** (`src/components/stats/FuerzaTab.tsx:10-19`): `BenchmarkTests`, `BenchmarkEvolutionChart`. → 2 more.
- **Periodización**: `PeriodizationSection` (`src/components/periodization/PeriodizationSection.tsx`).
- Shared chart shell that already has `title`/`subtitle`/`actions` slots (the natural mounting point for a `?`): `src/components/stats/ChartCard.tsx:13-39`.

**Recovery Score** — PLAN.md 90.3 states ranges "0-30 / 31-60 / 61-100". **This is factually wrong.**

- Real weights: days `.40`, sleep `.25`, soreness `.20`, streak `.15`, steps `.15` (conditional) — `src/domain/recoveryScore.ts:29-33`.
- Sub-scores 0-100 each — `:36-53`. Missing factors are renormalized by `totalWeight` — `:73-87`.
- **Real classification: `score >= 70 ? 'ready' : score >= 40 ? 'maybe' : 'rest'`** — `src/domain/recoveryScore.ts:89-90`.
  → **Actual ranges: 0–39 = `rest`, 40–69 = `maybe`, 70–100 = `ready`.**
- Hook: `src/hooks/useRecoveryScore.ts:23-45` (returns `null` when there are no journal entries, `:24`).
- Card: `src/components/home/RecoveryScoreCard.tsx:27-108` — renders score ring, classification label and an expandable breakdown; **it displays no numeric ranges anywhere**. Mounted at `src/pages/EntrenarPage.tsx:246`.
- Unit test asserting the real behaviour: `gymlab-app/tests/unit/domain/recoveryScore.test.ts` (thresholds exercised at `:91-132`).

**Deload** — PLAN.md 90.4.

- Threshold: `DELOAD_SCORE_THRESHOLD = 60` (`src/domain/deload.ts:10`); signals and caps `:30-36`; `calcDeloadScore` `:69-118`; `DELOAD_WEEK_DAYS = 7` `:7`.
- Surfaces: `src/components/profile/DeloadCard.tsx` (Perfil; **already has an InfoTip at `:88`**; own copy thresholds 60/40 at `:75-80`) and `src/components/deload/DeloadBanner.tsx` (home; no InfoTip; 38 lines).
- **Copy contradiction:** `home.deloadTipCuerpo` (`src/i18n/locales/es/core.ts:474`) says *"reduce el peso (40–50%)"*, but the code reduces **10%** by default — `generateDeloadGuidance(sets, reductionPct = 10)` (`domain/deload.ts:133-136`) and `deloadSuggestedWeight(weightKg, reductionPct = 10)` (`:147-148`). The shipped help text is wrong today.
- E2E that touches this surface: `gymlab-app/tests/e2e/test_f93_t3_deload.py` (asserts `get_by_role("switch", name="Activar semana de deload")`, i.e. an exact accessible name — relevant if a `?` button is added next to it).

**Broader candidate inventory for a systematic `?` (prioritised by incomprehension impact):**

| Priority | Surface | Files |
|---|---|---|
| P0 | Recovery Score, Deload (card + banner), Stats charts | `RecoveryScoreCard.tsx`, `DeloadCard.tsx`, `DeloadBanner.tsx`, `ChartCard.tsx` consumers |
| P0 | RIR / RPE, load suggestion, warmup %, deload weight reduction | `settings/SessionSection.tsx`, `workout/SuggestionChip.tsx`, session set rows |
| P1 | Dashboard KPIs (streak, volume, e1RM, PR), muscle frequency, push/pull balance | `SummaryCards.tsx`, `FrequencyChart.tsx`, `PushPullBalanceView.tsx`, `E1rmChart.tsx` |
| P1 | Calculators (IMC, TDEE, macros, water, Navy, 1RM, plates) | `pages/*Page.tsx` under `/calculadoras`, `components/calculators/*` |
| P1 | Nutrition (macros, goals, meal types), Supplements | `components/nutrition/*`, `components/supplements/*`, `domain/nutrition.ts` |
| P2 | Steps/wearables, Progress photos, Achievements, Calendar | `components/steps/*`, `pages/WearablesSyncView.tsx`, `pages/ProgressPhotosPage.tsx`, `components/achievements/*`, `components/calendar/*` |
| P2 | "Más" hub, Perfil tabs, Timer | `pages/MasPage.tsx`, `components/profile/*`, `components/timer/*` |

**Scale quantification:** `gymlab-app/src` contains **497 `.tsx` files** and **48 page files**. "Every component gets a `?`" therefore spans *hundreds* of insertion points.

### 1.8 i18n

- `I18nKey` is typed against the `es` schema (`src/i18n/index.ts:13`), module augmentation at `:16-21`; `es` is the source of truth; `en` is lazily loaded (`:24`, `:39-47`).
- `src/i18n/locales/es/index.ts:8-21` composes `core`, `workout`, `stats`, `routines`, `nutrition`, `features`; `EsSchema` deep-stringifies. `en/index.ts` mirrors it (15 lines).
- File sizes (es): `core.ts` 772 lines, `features.ts` 589, `stats.ts` 252, `routines.ts` 231, `nutrition.ts` 219, `workout.ts` 216.
- **Precedent for long help text:** `features.ts:21-30` (three volume-explanation tips, ~200 chars each), `core.ts:321-322` (`cuerpo.medidas.infoTipLabel` + a 300-char body), `core.ts:398-399` (`grasa.comoSeCalcula` + `comoSeCalculaDesc`).
- Where help keys would land: `stats.ts` (charts), `core.ts` (`home.*`, `mas.*`, `perfil.*`, `ajustes.*`), `features.ts` (per-feature blocks).
- **Naming precedent for help keys:** `<area>TipLabel` + `<area>TipCuerpo` (`core.ts:473-474`), `infoTipLabel` + `infoTipCuerpo` (`core.ts:321-322`), `comoSeCalcula` + `comoSeCalculaDesc` (`core.ts:398-399`). Three different shapes — a systematic catalog should pick one.

### 1.9 A11y and mobile

- The `?` is a `<button>` → works on tap without hover. Good foundation (`InfoTip.tsx:68`).
- `InfoTip` root is `relative inline-flex shrink-0` (`:67`) rendered inside headings/rows — no layout break observed.
- **Drag-scroll interaction:** `useGlobalDragScroll` bails when the pointerdown target matches `button, a, input, textarea, select, [role="button"], [contenteditable], label, [data-no-drag]` (`src/hooks/useGlobalDragScroll.ts:5-6`, used at `:43`). Because the `?` is a `<button>`, **dragging that starts on the `?` will not scroll the page** — a minor dead zone, but not a functional conflict. The popover itself is `position: fixed` and is not a scroll container ancestor, so no conflict there.
- **Known documented hazard:** a residual `transform` on an ancestor turns it into a containing block and breaks `position: fixed` popovers; this was already fixed for `InfoTip` by using `animation: ... backwards` instead of `both` (`src/index.css:699-703`). Any *new* animated wrapper around `?` call sites must respect this.
- `prefers-reduced-motion` is honoured globally (`src/index.css:766`, `:827`) and by `src/lib/animations.ts:15`. `InfoTip` itself has no animation; a tour/coach-mark feature would need explicit guards (existing precedent: `src/components/ui/CountUp.tsx:34`, `src/components/stats/DrillDownPanel.tsx:20`).
- Popover uses `scrollbar-hidden overflow-y-auto` (`InfoTip.tsx:82`) — consistent with the repo's no-visible-scrollbar rule.

### 1.10 Tests that can break

- **No component/DOM tests exist.** `gymlab-app/package.json:42-56` has no jsdom, no `@testing-library/*`. Unit tests are pure domain/data/hooks/lib/store (85 files under `gymlab-app/tests/unit/`). → `InfoTip`, `Onboarding` and every `?` insertion have **zero** unit coverage; adding component tests would require new dev dependencies (out of scope for this change unless decided).
- Directly relevant existing unit tests: `tests/unit/domain/recoveryScore.test.ts`, `tests/unit/domain/deload.test.ts`. **These encode the real thresholds (70/40)** — any spec or copy that states 0-30/31-60/61-100 would contradict passing tests.
- E2E (Python Playwright, run as `python tests/e2e/scripts/with_server.py tests/e2e/test_<fase>.py` from `gymlab-app/`; confirmed `tests/e2e/scripts/with_server.py` exists): `test_f93_t3_deload.py` asserts the deload switch by exact accessible name; `test_f99_home_layout.py` asserts home layout. Adding `?` buttons inside `DeloadCard` / `RecoveryScoreCard` / home cards risks breaking accessible-name and layout assertions — must be re-run.
- **Note:** later phases (F93, F95, F96, F98, F99) already have e2e files while Fase 90 has none, so there is no existing F90 e2e harness to extend.

---

## 2. Affected Areas

- `src/components/ui/InfoTip.tsx` — the existing `?` primitive; must be upgraded (touch target, role/semantics, focus, optional dismissal) or superseded.
- `src/components/ui/` — new help primitive(s) land here (e.g. a `HelpHint` wrapper that owns id→copy resolution).
- **New** `src/domain/help.ts` (or similar) — pure help-catalog types/ids and the "seen" state shape; must stay free of React/Dexie per `AGENTS.md`.
- **New** `src/hooks/useHelpSeen.ts` (or `useHelpState`) — reactive read/write over `meta` via `metaRepo` + `useMetaValue`, with a **module-level constant fallback** (`useMetaValue.ts:6-7` identity trap).
- `src/components/onboarding/Onboarding.tsx` + `steps.tsx` — extend with usage-teaching steps and/or support a re-runnable "tour" mode; fix the `workouts.length > 0` gate at `:97`.
- `src/hooks/useOnboardingStatus.ts` — the gate source; needs a "tour done / help enabled" companion flag.
- `src/domain/onboarding.ts` — add new `meta` key constants next to `ONBOARDING_DONE_META_KEY` (`:5-6`).
- `src/components/layout/AppShell.tsx:10-12`, `:61-63` — mount point for any new global overlay (tour), mirroring how `Onboarding` is lazy-mounted.
- `src/components/stats/ChartCard.tsx` — natural single insertion point for a `?` in every stats chart (title/subtitle/actions slots at `:19-30`).
- `src/components/stats/EntrenamientoStats.tsx`, `CuerpoStats.tsx`, `FuerzaTab.tsx`, `EntrenoTab.tsx` + individual chart components — stats explanation targets.
- `src/components/home/RecoveryScoreCard.tsx` — add Recovery Score help **using the real 0–39/40–69/70–100 ranges**.
- `src/components/profile/DeloadCard.tsx`, `src/components/deload/DeloadBanner.tsx` — deload help; **fix the 40–50% vs 10% copy error**.
- `src/i18n/locales/es/core.ts:474` — the incorrect deload copy.
- `src/i18n/locales/es/{core,features,stats}.ts` + `en/` mirrors — help keys (es is the typed source of truth; both languages required).
- `src/components/settings/` (`index.ts`, a new `HelpSection.tsx` or an addition to `GeneralSection.tsx`) + `src/pages/AjustesPage.tsx:42-50` — "re-enable help / restart onboarding" entry.
- `src/domain/settings.ts:9-53`, `:56-94` — if the enable/disable switch lives in `AppSettings` (mirroring `showWeightHint`), it needs the interface + `DEFAULT_SETTINGS` + i18n + a `Toggle`.
- `src/pages/MasPage.tsx:31-116` — the hub entry list is a candidate high-value help target (users do not know what each hub item does).
- `gymlab-app/tests/e2e/test_f93_t3_deload.py`, `test_f99_home_layout.py` — must be re-verified after adding `?` to those surfaces.

---

## 3. Approaches

### 3.1 Onboarding — extend the wizard, or add a guided tour?

1. **Extend the existing wizard with "how to use the app" steps (recommended)**
   - Add 2–4 presentation steps after the summary (or before it) that explain the four tabs, the "Más" hub and the core loop (choose routine → train → log sets → see stats), with a link out to the relevant screen.
   - Pros: reuses the whole existing wizard (lazy mount, slide transitions, stepper a11y, i18n block, persistence); one code path; low risk; no new global state.
   - Cons: still a linear, one-shot flow — it cannot be revisited later; teaching is front-loaded and forgotten; it does not help a returning user who wonders "what is e1RM?".
   - Effort: **Low–Medium**.

2. **Add a separate contextual, optionally re-runnable "tour" mode**
   - New overlay that walks screen by screen (Home → Rutinas → Estadísticas → Más), spotlighting one element per step, driven by a step list of `{ route, anchor, i18nKey }`.
   - Pros: teaches the real UI in place; re-runnable from Ajustes; can be extended per phase; does not disturb the setup wizard's data-collection purpose.
   - Cons: new subsystem (routing-aware, focus-managed, reduced-motion-aware, anchor measurement); higher a11y burden; risk of feeling heavy; more work than a tooltip.
   - Effort: **High**.

3. **Hybrid — wizard gets 2 "orientation" steps now, full tour deferred to a later phase (recommended phasing)**
   - Ship the low-risk wizard extension + the `?` system now; make the tour its own phase once `?` coverage and the help catalog exist (the catalog is a prerequisite for a tour's copy anyway).
   - Pros: small, verifiable increments; the help catalog built for `?` is reused by the tour; defers the riskiest UI work.
   - Cons: users get orientation + per-element help but no in-place walkthrough until the later phase.
   - Effort: **Low now, High later**.

**Re-runnability (independent of the above):** the wizard's `finish()` early-returns when `done` (`Onboarding.tsx:139`) and the gate hides it after any workout (`:97`). A "show onboarding again" entry requires (a) a settings/meta flag that overrides both conditions, and (b) clearing or ignoring `done` for that invocation. This must be designed explicitly, not assumed.

### 3.2 The `?` interaction model

1. **Anchored popover (upgrade the existing `InfoTip`) — recommended for in-place explanations**
   - Pros: already implemented and battle-tested in 6 places; does not navigate the user away; keeps context visible (essential for "what does this number mean"); cheap to replicate.
   - Cons: needs the fixes in §1.3 (44 px target, correct role, focus handling, close affordance); positioning math already exists so risk is contained.
   - Effort: **Low–Medium**.

2. **Bottom sheet (reuse `ConfirmSheet` scaffolding) — for long/rich help**
   - Pros: reuses a familiar, already-styled pattern; room for long copy; thumb-friendly on mobile; consistent with the app's modal language.
   - Cons: hides the thing being explained; interrupts flow; probably overkill for a one-sentence definition; on desktop it feels heavy.
   - Effort: **Medium**.

3. **Global "help mode" that reveals all `?` at once**
   - Pros: makes discoverability explicit; a single switch teaches "help exists".
   - Cons: new global UI state; can flood a dense screen with dozens of markers; competes with the drag-scroll/dismiss interactions; hardest to make accessible.
   - Effort: **High**.

**Recommended split:** anchored popover as the default; allow the *content* component to opt into a sheet when copy exceeds a threshold. Avoid help mode unless user research demands it.

### 3.3 Making "every component has a `?`" systematic without polluting the UI

1. **`<HelpHint id="stats.volume" />` with id → i18n resolution through a typed catalog — recommended**
   - A single component owns the trigger (44 px target, correct ARIA, focus handling) and resolves `label` + body copy from `i18n` using a **typed** id. The catalog is a `const` map so TypeScript enforces es/en parity via the existing `I18nKey` type (`i18n/index.ts:13`).
   - Placement rule: **only** where a metric is non-obvious (a number the user cannot define from its label). Explicitly *not* on every input, button or nav item.
   - Pros: one implementation to fix once; consistent copy shape; discoverable by grep; scales without copying markup; i18n parity enforced at compile time.
   - Cons: an id registry must be maintained; requires the "where NOT to put it" rule to actually be respected or the UI gets noisy.
   - Effort: **Medium**.

2. **Inline `<InfoTip>` per site with copy passed as props (status quo)**
   - Pros: zero abstraction; maximum per-site control.
   - Cons: copy lives at call sites (no parity guarantee); 6 instances already show 3 different i18n naming shapes; does not scale to hundreds of points; every a11y fix must be repeated.
   - Effort: **Low to start, High at scale**.

3. **Automatic `?` injection via a wrapper/lint rule**
   - Pros: guarantees coverage.
   - Cons: cannot decide *meaningfully* where help is needed; would produce noise and meaningless copy; not feasible with useful quality.
   - Effort: **High**, low value. Reject.

**Recommended:** option 1 + a documented inclusion rule + an explicit exclusion list. "Every component" must be renegotiated with the user into "every *non-obvious metric or concept*" — otherwise the change is unbounded (497 `.tsx` files) and the UI becomes a field of question marks.

### 3.4 "Already seen" granularity

1. **Per-help-id** (recommended): `meta.helpSeen` = `{ [helpId]: true }`.
   - Pros: precise; supports "re-show only what the user never opened"; scales with the catalog.
   - Cons: larger payload; needs a prune strategy if the catalog churns.
2. **Per-screen**: `meta.helpSeenScreens` = `string[]`.
   - Pros: small; easy to reason about.
   - Cons: coarse — a user who opened one tip on Estadísticas is presumed to know all 13.
3. **Global single boolean** (`helpSeen: true`).
   - Pros: trivial.
   - Cons: cannot support "re-enable just the tips"; effectively a kill switch. Only viable combined with option 2/1.

**Auto-open on first visit?** Two behaviours to choose between: (a) purely passive (the `?` exists, the user taps when curious — zero risk of nagging), or (b) auto-open the first time a surface is seen (stronger teaching, but interruptive and it fights `prefers-reduced-motion`/focus rules). Recommendation: **passive by default**; keep auto-open out of scope, or restrict it to the single most opaque surface (Recovery Score).

### 3.5 Bounding the scope (phasing)

Proposed phasing order, small to large, each independently shippable:

- **Phase A — foundation + the two PLAN-critical surfaces.** Upgrade the `?` primitive (44 px, ARIA, focus, close), add the typed help catalog + `helpSeen` persistence, wire Deload (card + banner, with the copy fix) and Recovery Score (with the **real** ranges). This satisfies PLAN 90.1/90.3/90.4/90.5 and validates the pattern on two surfaces.
- **Phase B — Estadísticas.** Centralize insertion in `ChartCard` first, then cover the ~22 chart/metric explanations across the 4 tabs.
- **Phase C — onboarding/orientation.** Wizard orientation steps + re-run entry from Ajustes (fix the gate).
- **Phase D — systematic rollout** to high-incomprehension surfaces (RIR/RPE, load suggestion, warmup %, calculators, nutrition, hub "Más"), one surface group per commit.
- **Phase E (optional, separate change) — guided tour mode**, reusing the catalog from Phase A.

Each phase can be proposed/specified independently; Phase E is likely its own change.

---

## 4. Recommendation

1. **Do not read "every component gets a `?`" literally.** It spans 497 `.tsx` files and would bury the UI. Re-scope it to "every *non-obvious metric, score or concept* gets a `?`", with an explicit exclusion rule, and get that renegotiation approved before specifying.
2. **Build on `InfoTip`, do not replace it.** It already solves anchored positioning and tap-vs-hover. Fix its four real defects (24 px target, `role="dialog"`, no focus management, no close button) once, centrally.
3. **Introduce a typed help catalog + `<HelpHint id>`** so es/en parity is compiler-enforced (`I18nKey`) and copy lives in i18n, not at call sites.
4. **Persist per-id "seen" state in `meta`** via `metaRepo` + `useMetaValue`, with a **module-level constant fallback** to avoid the `useMetaValue` re-subscription trap.
5. **Ship Phase A first** (primitive + catalog + Deload + Recovery Score) — it is the PLAN's core, it is small, and it validates the pattern before the stats sweep.
6. **Fix the two factual errors found during exploration before writing any new copy:**
   - Recovery Score ranges are **0–39 / 40–69 / 70–100**, not 0-30/31-60/61-100 (PLAN 90.3 is wrong).
   - `home.deloadTipCuerpo` says the deload reduces weight **40–50%**, but the code reduces **10%** (`domain/deload.ts:133-136`, `:147-148`).
7. **Treat the onboarding as two separate deliverables:** (a) low-risk orientation steps inside the existing wizard and (b) an optional re-runnable tour. Do (a) in this change; make (b) its own change once the catalog exists.
8. **Add the "re-enable help / replay onboarding" control to Ajustes** following the `showWeightHint` precedent (`domain/settings.ts:39,84` + `GeneralSection.tsx:17`).

---

## 5. Risks

| # | Risk | Evidence | Mitigation |
|---|---|---|---|
| R1 | **Unbounded scope** — "every component" = 497 `.tsx` files / 48 pages; PR-budget blowout and UI saturation | `gymlab-app/src` file count; `review_budget_lines = 800` from this session's preflight | Renegotiate to "non-obvious concepts"; phase A→E; one surface group per commit |
| R2 | **PLAN.md 90.3 states false ranges** (0-30/31-60/61-100) | `domain/recoveryScore.ts:89-90` (`>= 70`, `>= 40`); asserted by `tests/unit/domain/recoveryScore.test.ts:91-132` | Correct the ranges in the proposal/spec; copy must not contradict tests |
| R3 | **Shipped help copy is already wrong** — deload says 40–50% reduction, code does 10% | `i18n/locales/es/core.ts:474` vs `domain/deload.ts:133-136`, `:147-148` | Fix `core.ts:474` (+ `en` mirror) as part of 90.4 |
| R4 | **Onboarding is unrecoverable** — hides permanently after any workout, and `finish()` refuses to run once done | `Onboarding.tsx:97` (`done \|\| workouts.length > 0`), `:139` (`if (done) return`) | Design an explicit override flag for replay; fix the gate |
| R5 | **`InfoTip` violates the 44 px touch-target rule** and uses `role="dialog"` for informational content with no focus handling | `InfoTip.tsx:73` (`size-6`), `:79` (`role="dialog"`); rule in `gymlab-app/AGENTS.md` | Upgrade the primitive centrally before scaling usage (Phase A) |
| R6 | **`useMetaValue` re-subscription trap** — inline object fallback in deps re-subscribes every render | `useMetaValue.ts:6-7` | Use a module-level constant fallback for the help-seen map |
| R7 | **E2E breakage on touched surfaces** — deload switch asserted by exact accessible name; home layout asserted | `tests/e2e/test_f93_t3_deload.py` (`get_by_role("switch", name="Activar semana de deload")`), `tests/e2e/test_f99_home_layout.py` | Re-run both after Phase A; keep `?` labels distinct from existing names |
| R8 | **Zero component-test infrastructure** — no jsdom / Testing Library; 85 unit tests are domain/data/hooks only | `package.json:42-56`; `tests/unit/` listing | Either accept manual/e2e verification for the primitive, or explicitly scope new dev dependencies in the design |
| R9 | **Drag-scroll dead zone** on the `?` (drag starting on a `<button>` never scrolls) | `useGlobalDragScroll.ts:5-6`, `:43` | Accept (minor); place `?` so it does not block a scroll gesture path; do not add `?` to large drag handles |
| R10 | **`position: fixed` popovers break under a transformed ancestor** — already hit once and fixed for `InfoTip` | `index.css:699-703` (comment documenting the `both` → `backwards` fix) | Any new animated wrapper around `?` must use `backwards`, not `both` |
| R11 | **i18n naming drift** — three existing help-key shapes (`*TipLabel/*TipCuerpo`, `infoTipLabel/infoTipCuerpo`, `comoSeCalcula/Desc`) | `core.ts:473-474`, `:321-322`, `:398-399` | Pick one shape for the catalog and enforce it via the typed id |
| R12 | **No `meta` schema versioning** — help flags are ad hoc like every other key | `metaRepo.ts:5-11`; key list in §1.5 | Keep the new key simple and documented; do not invent a versioning layer for this change |

---

## 6. Open Design Questions (must be answered in `propose`, not here)

1. **Scope renegotiation:** does the user accept "every *non-obvious concept*" instead of "every component"? (This single answer determines whether the change is shippable at all.)
2. **Onboarding:** extend the wizard, add a tour, or both in sequence?
3. **`?` model:** popover only, or popover + sheet for long copy?
4. **Seen-state granularity:** per-id, per-screen, or global?
5. **Auto-open on first view:** yes or no (recommendation: no)?
6. **Enable/disable switch location:** `AppSettings` (like `showWeightHint`) or a dedicated `meta` flag?
7. **Does this change own the deload/recovery copy fixes**, or are they split into a separate bug-fix change?
8. **Do we add component-test tooling**, or rely on build + e2e for the primitive?

---

## 7. Ready for Proposal

**Yes** — with two caveats the orchestrator must surface to the user:

1. Scope must be renegotiated before proposing: "every component" is unbounded, and the exploration provides the phasing (A→E) that makes it shippable.
2. Two factual errors in existing artifacts were found and must be corrected, not propagated: PLAN.md 90.3's Recovery Score ranges, and the deload 40–50% copy.

Baseline deliverables for the propose phase: Phase A (upgrade the `?` primitive + typed help catalog + `helpSeen` persistence + Deload and Recovery Score help with correct numbers), plus the low-risk onboarding orientation steps and the Ajustes re-enable entry. Later phases become separate proposals.
