# Session Photo Export Specification

## Purpose

The session photo is a single dark canvas card rendered only in history detail with `prCount` hardcoded to 0. This capability redesigns it as a Strava-style 1080×1080 card with a hero band, stat tiles, 2–3 selectable templates, real PR counts, and share/download — on the post-save summary (primary surface) and in history detail, with no new dependencies.

## Requirements

### Requirement: Canvas card layout

The system MUST render the shareable card on a 1080×1080 canvas with: a hero band showing the date and workout display name, stat tiles (duration, volume, PRs), the completed-exercise list (name + sets × weight), and a brand footer. Rendering MUST use system-ui fonts with explicit pixel measurement and no new dependencies.

#### Scenario: Card renders with a workout

- GIVEN session data with date, name, stats, and exercises
- WHEN the canvas renders
- THEN the hero shows date + name, tiles show the three stats, exercises are listed, and the footer shows the brand

### Requirement: Workout display name

`SessionImageData` MUST include the workout display name: the linked routine's title when the session came from a routine, otherwise a localized generic label (free workout).

#### Scenario: Routine session

- GIVEN a workout linked to a routine
- WHEN the photo data is prepared
- THEN the hero name is that routine's title

#### Scenario: Free session

- GIVEN a workout without a routine
- WHEN the photo data is prepared
- THEN the hero name is the localized generic label

### Requirement: Real PR count

The photo MUST render the workout's real PR count. The history detail MUST pass the actual PR count of the shown workout; the card MUST NOT hardcode 0.

#### Scenario: PRs appear in history photo

- GIVEN a workout with 3 PRs
- WHEN the history detail renders its photo
- THEN the PR tile shows 3

#### Scenario: Zero PRs

- GIVEN a workout with 0 PRs
- WHEN the photo renders
- THEN the PR tile shows 0 with no crash or missing stat

### Requirement: Selectable templates

The system MUST offer at least 2 selectable card templates (at most 3); a default template applies when none is selected; switching re-renders the canvas with identical data. No new dependencies.

#### Scenario: Switching templates

- GIVEN templates A and B with A selected
- WHEN the user selects B
- THEN the canvas re-renders in B's layout with identical data

#### Scenario: Default template

- GIVEN no template selected
- WHEN the export surface opens
- THEN the default template is applied and shown as selected

### Requirement: Share and download

The system MUST support PNG download and, when `navigator.share` is available, share-with-file; otherwise it MUST fall back to download. Filename: `gymlab-<date>.png`. Share failures MUST NOT produce unhandled rejections.

#### Scenario: Native share

- GIVEN a capable platform
- WHEN the user taps share
- THEN `navigator.share` receives the PNG file

#### Scenario: Fallback download

- GIVEN no `navigator.share`
- WHEN the user taps share
- THEN the PNG is downloaded instead

### Requirement: Export surfaces

The post-save summary (`SessionSummaryView`) MUST offer the photo export as the primary surface, and the history detail (`WorkoutDetail`) MUST keep it with the real PR count. Both MUST support template selection, share, and download.

#### Scenario: Post-save photo

- GIVEN a just-finished session with PRs
- WHEN the summary screen renders
- THEN the photo export with template selector is available and shows the real PRs

#### Scenario: History photo

- GIVEN a past workout opened in detail
- WHEN the detail renders
- THEN the photo export is available with that workout's real PR count

### Requirement: Empty and boundary data

The card MUST render validly with zero exercises (empty exercise area, stats intact) and MUST list up to 8 exercises, preserving the existing truncation beyond 8. Empty stats render as 0, never `NaN`.

#### Scenario: Zero exercises

- GIVEN session data with no completed exercises
- WHEN the canvas renders
- THEN stats render correctly and the exercise area is empty

#### Scenario: Exercise cap

- GIVEN 10 completed exercises
- WHEN the canvas renders
- THEN only the first 8 appear, matching the existing limit

### Requirement: i18n for export strings

All new export UI strings (template names, labels) MUST ship es and en keys (es is the typed source of truth).

#### Scenario: Both locales present

- GIVEN a new template name
- WHEN the locale alternates between `es` and `en`
- THEN the correct label resolves without fallback-key warnings