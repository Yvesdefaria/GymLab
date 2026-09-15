> ⚠️ **ALCANCE REDUCIDO — DOCUMENTO OBSOLETO.** Este archivo describe el alcance amplio que el usuario RECHAZO. Lo entregado esta en `OUTCOME.md` (misma carpeta). No leer como estado del codigo.

# Contextual Help Specification

## Purpose

On-demand `?` help for non-obvious concepts, delivered through one typed catalog with compiler-enforced es/en parity. Phase A ships the shared trigger plus entries on Recovery Score, the Deload card and the Deload banner, and corrects two shipped strings that contradict the code. Help is passive and stateless. It is not a WCAG 2.2 AA requirement (SC 3.3.5 is AAA; SC 3.2.6 excludes contextual help) but a quality choice. The SC that bind: 2.5.8, 1.4.13, 2.4.11, 4.1.2, 1.4.3, 1.4.11.

## Requirements

### Requirement: Typed help catalog

The catalog MUST live in the pure domain layer and own the stable help ids. Each id MUST resolve its label and body copy through the typed i18n key type, so a missing `en` key fails the build. Help copy MUST NOT be authored at the call site; call sites pass a catalog id only, and an id outside the catalog is a build error.

#### Scenario: Missing English key fails the build

- GIVEN a catalog id whose `es` copy exists and whose `en` mirror does not
- WHEN the project is built
- THEN the build fails with a type error naming the missing key

#### Scenario: No copy at the call site

- GIVEN any surface that renders help
- WHEN its source is inspected
- THEN it passes only a catalog id and the copy resolves from i18n

### Requirement: Trigger reachability and activation

The trigger MUST expose a hit area of at least 44×44 CSS px (the repo floor, stricter than SC 2.5.8's 24×24 AA minimum). It MUST open on tap/click and, when focused, on Enter and Space. It MUST be a native control whose name and role are programmatically determinable (SC 4.1.2) and MUST NOT be nested inside another interactive element.

#### Scenario: Keyboard opens help

- GIVEN help closed with its trigger focused
- WHEN the user presses Enter
- THEN the help opens

#### Scenario: Target size

- GIVEN a rendered help trigger
- WHEN its bounding box is measured
- THEN width and height are each at least 44 px

#### Scenario: Not nested in a control

- GIVEN a surface whose container is itself interactive
- WHEN help is added
- THEN the trigger renders outside that control's interactive subtree

### Requirement: Dismissal, focus and motion

The revealed help MUST be dismissible without moving focus (Escape), by tapping outside, and by an inner close control reachable on touch (SC 1.4.13), and MUST stay visible until dismissed. On close, focus MUST return to the trigger. It MUST NOT entirely obscure the focused trigger (SC 2.4.11). Any animation MUST be inert under `prefers-reduced-motion`. At most one help disclosure MAY be open at a time, with no global help mode.

#### Scenario: Three dismissal paths

- GIVEN open help
- WHEN the user presses Escape, taps outside, or activates the inner close
- THEN the help closes on each path

#### Scenario: Focus returns to the trigger

- GIVEN help opened from a focused trigger
- WHEN the help closes
- THEN focus is on the trigger

#### Scenario: Reduced motion and single disclosure

- GIVEN `prefers-reduced-motion: reduce` and one disclosure already open
- WHEN another help opens
- THEN no motion plays and only the newest disclosure is visible

### Requirement: Accessible association

The revealed content MUST be programmatically associated with its trigger and the trigger's accessible name MUST identify the explained concept, so screen-reader users obtain the description (SC 4.1.2). The ARIA mechanism is chosen in design. `role="tooltip"` MUST NOT be used: it lacks task-force consensus, forbids interactive content and does not support `aria-expanded`. Help text MUST meet 4.5:1 contrast (SC 1.4.3); trigger non-text and focus indication MUST meet 3:1 (SC 1.4.11).

#### Scenario: Screen reader obtains the description

- GIVEN a trigger for a non-obvious metric
- WHEN it receives focus
- THEN its accessible name identifies the concept and the description is exposed to assistive technology

#### Scenario: Prohibited role

- GIVEN any help disclosure
- WHEN the accessibility tree is inspected
- THEN no element uses `role="tooltip"`

### Requirement: Inclusion rule

Help MUST exist only where a concept or metric is not self-explanatory; a sufficient visible label is an exclusion. Help MUST NOT be added to every component (497 `.tsx`, 48 pages), and one trigger explains one concept. Exclusions MUST be explicit and documented.

#### Scenario: Excluded surface

- GIVEN the bottom tab bar navigation and a settings toggle whose label states its effect
- WHEN help coverage is reviewed
- THEN neither carries a trigger

### Requirement: Phase A coverage

Help entries MUST be present on the Recovery Score card, the Deload card and the Deload banner, in both locales.

#### Scenario: Recovery Score help

- GIVEN the Recovery Score card renders
- WHEN its help is opened
- THEN the copy states the ranges 0–39 rest, 40–69 maybe, and 70–100 ready

#### Scenario: Deload help

- GIVEN the Deload card or the Deload banner renders
- WHEN its help is opened
- THEN the copy states the 10% weight reduction that is actually applied

#### Scenario: Banner entry

- GIVEN an active deload week on the home screen
- WHEN the Deload banner renders
- THEN it exposes a help trigger for the concept

### Requirement: Copy anchored to the domain

Numeric values in help copy MUST derive from the domain modules that own them — the deload reduction and the Recovery Score thresholds — so copy cannot silently diverge from behaviour. A unit test MUST fail when a domain value changes without the copy following. Shipped strings that contradict the code MUST be corrected in both locales.

#### Scenario: Domain change breaks the copy test

- GIVEN the copy currently agrees with the domain
- WHEN the deload reduction constant or a Recovery Score threshold changes
- THEN the copy assertion fails until the copy is updated

#### Scenario: Contradiction removed

- GIVEN the shipped deload help claiming a 40–50% reduction
- WHEN the change lands
- THEN both locales state the applied reduction and the domain-anchored test passes

### Requirement: Passive, stateless and dependency-free

Help MUST open only on explicit user action and MUST NOT auto-open on mount, first view or navigation. No "seen" state MAY be tracked or persisted, no settings switch or Ajustes entry MAY be added for help, and no new dependency or test infrastructure MAY be introduced.

#### Scenario: No auto-open

- GIVEN a profile visiting each Phase A surface for the first time
- WHEN the surface renders
- THEN no help opens without user action

#### Scenario: No seen state or new tooling

- GIVEN help opened and closed several times
- WHEN storage, settings surfaces, dependencies and test tooling are inspected
- THEN no help-related persisted key, Ajustes entry, runtime dependency or DOM-test tooling exists
