---
name: GymLab App
description: Entrena mejor con datos — rutinas, registro de series y composición corporal en una app web local-first.
colors:
  molten-gold: "#d9b384"
  gold-bright: "#fdddb4"
  brass: "#b99050"
  carbon: "#121214"
  gunmetal: "#242422"
  chalk: "#f8fafc"
  dark-brass: "#3a352b"
  bronze-dust: "#a39b8c"
  success-green: "#22c55e"
  danger-red: "#ef4444"
  info-blue: "#3b82f6"
typography:
  display:
    fontFamily: "Oswald, sans-serif"
    fontWeight: 700
    fontSize: "clamp(1.75rem, 8vw, 3.25rem)"
    lineHeight: 0.95
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Oswald, sans-serif"
    fontWeight: 600
    fontSize: "clamp(1.5rem, 6vw, 2.25rem)"
    lineHeight: 1
    letterSpacing: "0.02em"
  title:
    fontFamily: "Oswald, sans-serif"
    fontWeight: 600
    fontSize: "24px"
    lineHeight: 1.15
    letterSpacing: "0.02em"
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontWeight: 400
    fontSize: "16px"
    lineHeight: 1.5
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontWeight: 600
    fontSize: "12px"
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.molten-gold}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.lg}"
    height: "52px"
    padding: "0 20px"
    typography: "{typography.headline}"
  button-primary-hover:
    backgroundColor: "{colors.gold-bright}"
    textColor: "{colors.carbon}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    rounded: "{rounded.lg}"
    height: "52px"
    padding: "0 20px"
  button-accent:
    backgroundColor: "{colors.molten-gold}"
    textColor: "{colors.gold-bright}"
    rounded: "{rounded.lg}"
    height: "52px"
    padding: "0 20px"
  input-text:
    backgroundColor: "{colors.carbon}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0 12px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.gold-bright}"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 16px"
  card-panel:
    backgroundColor: "{colors.gunmetal}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.lg}"
---

# Design System: GymLab App

## Overview

**Creative North Star: "The Iron Lab"**

A dark gym-as-laboratory: near-black iron surfaces, a single warm metal accent, and numbers that read like precision instrument readouts. Every screen is a workbench where effort becomes data — the interface recedes so the athlete's own figures (volume, sets, PRs, body composition) carry the visual weight.

The system is **bold industrial-premium**: confident, high-contrast, unapologetically dark by default, with the gold reserved for merit. Oswald's condensed, athletic geometry drives headlines and metric values; Barlow handles the reading body so nothing fights the numbers. Depth comes from tonal layering — a surface gradient with a top highlight and a whisper of gold border — never from hard shadows. The app is mobile-first and tactile: generous 44px+ targets, press feedback (scale, pop, row flash), and sound/haptics in the workout session.

**Key Characteristics:**

- One accent metal (gold by default) used sparingly — the rarity is the point.
- Dark industrial atmosphere with subtle film grain over the whole app.
- A single photographic layer: a dark gym photo behind the Home hero, gold-tinted and scrimmed into the background; imagery is scarce, never decorative chrome.
- Tonal elevation: gradient + top highlight + soft gold border; no decorative glows.
- Oswald display numbers with tabular figures; Barlow body text.
- Mobile-first single-column shell, bottom tab bar, one primary CTA per view.
- Earned data is the hero: PRs, records and stats glow in the metal gradient.

## Colors

The palette is a dark metal shop warmed by a single gold accent. The accent is tokenized as a family (`gold`/`gold-bright`/`cta-deep`) so it can be swapped across six palettes (gold, energy, crimson, electric, violet, gray) × night/day themes via `data-palette`/`data-theme`; the values below are the default **gold + night** pairing, and every swap only retunes the accent family and neutral tints, keeping the same roles.

### Primary

- **Molten Gold** (#d9b384): the accent metal. CTAs, the active tab, progress fills, `stat-value` numbers, focus rings, and the gold border glow. In day mode it deepens to a dark bronze so it stays readable on white.
- **Gold Bright** (#fdddb4): the top of the gradient. Highlighted numbers, `accent-soft` text (links, back links, chip labels), the bright end of any gold gradient.
- **Brass** (#b99050): the deep end of the CTA gradient (`cta-deep`). Grounds the gradient so buttons feel like metal, not neon.

### Neutral

- **Carbon** (#121214): the app background (night default). Pure near-black with a cold blue cast; the base everything sits on.
- **Gunmetal** (#242422): elevated surface for panels, inputs, chips and the tab bar; the canvas that receives the top-light highlight.
- **Chalk** (#f8fafc): primary foreground text.
- **Dark Brass** (#3a352b): borders and dividers at rest (night). Warm enough to belong to the same metal family.
- **Bronze Dust** (#a39b8c): muted text, kickers, placeholders, inactive tabs.

### Semantic

- **Success Green** (#22c55e): completed sets, trained days in the calendar, deload-on, positive insights.
- **Danger Red** (#ef4444): destructive actions, errors, empty states, the last 3 s of the rest timer.
- **Info Blue** (#3b82f6): informational accents and chart references.

### Named Rules

**The Rare-Metal Rule.** The gold gradient is reserved for the single primary CTA of a view and for earned data (PRs, records, hero stats). Supporting actions use outline/accent/ghost, and resting surfaces stay monochrome, so the metal reads as reward, not chrome.

**The Subtle-Border Rule.** Panel borders are gold at 20–28% opacity. If the border is the first thing you see, it is too strong: hierarchy comes from tonal change and whitespace, not outlines.

## Typography

**Display Font:** Oswald (500/600/700) with sans-serif fallback
**Body Font:** Barlow (400/500/600/700) with system-ui fallback

**Character:** condensed athletic display + legible technical body. Oswald supplies the power of a scoreboard or gym plaque — tight, uppercase-friendly, perfect for metric values. Barlow lowers the intensity in paragraphs, labels and controls so reading stays effortless.

### Hierarchy

- **Display** (Oswald 700, `clamp(1.75rem, 8vw, 3.25rem)`, 0.95): hero numbers — the "Hoy toca" day on Home, the session timer, PR figures.
- **Headline** (Oswald 600, `clamp(1.5rem, 6vw, 2.25rem)`, 1): section heroes and peak moments.
- **Title** (Oswald 600, 24px, 1.15): page titles (`AppHeader` h1) and card titles.
- **Body** (Barlow 400, 16px, 1.5): default text; secondary text drops to 14px via the same family.
- **Label** (Barlow 600, 12px, uppercase, 0.08em): chips, buttons with labels, and the `kicker` pattern uses an even smaller variant (0.65rem, 600, uppercase, 0.2em, bronze dust).

### Named Rules

**The Numbers Rule.** Every live or dynamic figure — stats, timers, weights — uses Oswald with `font-variant-numeric: tabular-nums` so digits don't jitter as they tick or change.

**The Kicker Rule.** Hierarchy arrives by weight and color before size. Section labels are uppercase kickers in bronze dust; you should be able to remove a heading's size and still read the hierarchy from weight and tone alone.

## Layout

Mobile-first app shell: a centered `max-w-lg` column with a fixed bottom TabBar (Entrenar · Rutinas · Estadísticas · Más) and a sticky `AppHeader` (title + subtitle) honoring safe-area insets. The grid is 8-pt; gaps are never below 8px and touch targets never below 44px.

Home is an asymmetric hero (`panel-hero`) — kicker, oversized program day, muscle chips, progress ring and a single contextual CTA — followed by stacked panels (streak, weekly volume, insights, calendar). Long catalogs (873 exercises) virtualize rather than shrink type or spacing. One visual focus per view: the primary CTA, never duplicated.

## Elevation & Depth

Tonal, not shadow-driven. Confirmed strategy: **surface gradient + 1px top inset highlight (white 4–7%) + subtle gold border**, with ambient shadow only beneath. A surface must lift by lightness before it is allowed any shadow; the gradient and highlight are what separate it from the carbon background in dark mode.

Three elevation levels: **panel** (cards, `rounded 16px`, gold border 20%, ambient `0 14px 32px -20px` at black 60%), **panel-floating** (overlays/sheets/modals, `rounded 20px`, gold border 28%, deeper ambient shadow), and **panel-hero** (section heroes: CTA radial wash at the top, 14% CTA ring, soft CTA glow). The gold glow (`gold-border-glow`) is reserved for heroes and active-program emphasis, never for resting cards.

### Shadow Vocabulary

- **panel ambient** (`0 14px 32px -20px rgb(0 0 0 / 0.6)`): resting cards.
- **panel-floating ambient** (`0 24px 48px -20px rgb(0 0 0 / 0.75)`): overlays, sheets, modals.
- **panel-hero glow** (`0 0 0 1px` CTA 14%, `0 22px 44px -24px` CTA 40%): hero surfaces only.
- **gold-border-glow** (`0 0 0 1px` CTA 25%, `0 8px 30px -12px` CTA 35%): active program emphasis, celebration moments.

### Named Rules

**The Elevation-by-Tone Rule.** In dark mode, elevation reads from tonal lift (gradient + highlight) first; box-shadows are ambient accents underneath, never the depth signal. If a card needs a hard shadow to float, its background is too close to the page background.

## Shapes

Rounded, concentric corners: **outer radius = inner radius + padding** (a button's radius grows with its padding). Inputs are 8px (`rounded-lg`), buttons 12–16px (`rounded-xl`/`2xl`), panels 16px (20px when floating), and chips/pills are fully round. Focus-visible is a 2px CTA ring with a 2px offset. Number inputs hide their native spinners for a clean, instrument-like field.

## Components

### Buttons
- **Shape:** rounded 12–16px (sm/md/lg), min-height 44/52/56px, inline-flex centered, text sizes 14/16/18px.
- **Primary:** gold gradient (bright → cta → deep), Oswald semibold, text on carbon, `shadow-cta/20`, `active:scale-[0.98]`. Exactly one primary per view — it is the view's focus.
- **Outline:** 1px `border` on carbon, chalk text; hover swaps border to the accent and text to gold-bright.
- **Accent:** 1px accent border, accent fill at 15%, gold-bright text; hover raises the fill to 25%. The "secondary highlighted" action (e.g. export backup).
- **Ghost:** bronze-dust text, hover to gold-bright.
- **States:** hover, active (scale), `focus-visible` (2px CTA ring), disabled (`opacity-50`, no pointer events).

### Chips
- **Style:** fully round pills, 44px tall, 1px accent border at 40%, accent fill at 12%, uppercase 12px label at 0.08em tracking, gold-bright text.
- **State:** selected (`aria-pressed="true"`) fills with the solid accent and flips text to carbon; unselected is the translucent pill.

### Cards / Containers
- **Corner Style:** 16px; 20px when floating.
- **Background:** gunmetal with a 180° top-light gradient (4–8% white blend) and the 1px white top inset.
- **Shadow Strategy:** ambient only (see Elevation).
- **Border:** gold at 20% (28% floating).
- **Internal Padding:** 16–20px (spacing md/lg).

### Inputs / Fields
- **Style:** 44px tall, 8px radius, 1px `border` on carbon background, chalk text; number spinners hidden.
- **Focus:** border shifts to the accent; `focus-visible` 2px CTA ring.
- **Error / Disabled:** live error text with `role="alert"` + danger styling; values clamped (`clamp()`); disabled at 50% opacity.

### Navigation
- **TabBar:** fixed bottom, `border-t` in border tone, carbon at 95% with backdrop blur, safe-area inset. Active tab gets a translucent accent pill (15%) behind the icon, the icon scales to 105% with stroke 2.5, and the label becomes gold-gradient text; inactive tabs are bronze dust with a press `scale-95`.
- **AppHeader:** sticky top, hairline bottom border, carbon at 90% with blur; h1 in Oswald 24px bold with a muted subtitle beneath.
- **BackLink:** arrow + contextual label, min-height 44px, gold-bright text.

### ProgressRing
- SVG ring, 8px stroke, border-tone track and accent fill with round caps, rotated −90°, value text in Oswald bold accent in the center; `role="progressbar"`. Reserved for the single focus of a view (hero). Secondary progress uses a gold-gradient bar with `role="progressbar"` instead of a second ring.

### Toggle (Settings)
- `role="switch"`, 44×56px, knob `size-6` traveling `translate-x-6`, active background is the accent.

### RestTimer
- Circular arc SVG with a large Oswald countdown; the last 3 s turn danger-red and pulse (`animate-timer-peak`) alongside the warning beeps and haptics. A peak moment by design.

### Hero Atmosphere (signature)
- A dark gym photograph (`public/images/home-hero.jpg`, Pexels, free license) sits as an absolutely-positioned atmosphere layer behind the Home hero content (`hero-atmosphere` in `index.css`).
- **Treatment:** `object-fit: cover` at `opacity 0.5`, a background-velocity scrim (left/bottom gradient in `--color-bg` keeping text at ≥ 4.5:1 contrast), and a `soft-light` overlay of the accent at 24% for the duotone gold feel. `pointer-events: none`, so content stays interactive; the layer is `aria-hidden` with an empty `alt` (pure decoration).
- **Day mode:** the image fades to `opacity 0.16` so it never fights the light panel.
- **Rule of scarcity:** this is the app's only photographic surface. Adding photos elsewhere must clear the Rare-Metal test first — if the accent or an existing panel could carry the job, it should.

## Do's and Don'ts

### Do:
- **Do** reserve the gold gradient for exactly one CTA per view and for earned data (PRs, records, hero stats); everything else demotes to outline/accent/ghost.
- **Do** build surfaces from `panel` / `panel-floating` / `panel-hero` tokens instead of bespoke card styles.
- **Do** keep every touch target ≥ 44px and every gap ≥ 8px.
- **Do** set dynamic numbers in Oswald with `tabular-nums` (`.stat-value`) and body copy in Barlow.
- **Do** honor `prefers-reduced-motion`: page-in/reveal/burst animations are disabled; scroll behavior returns to `auto`.
- **Do** use lucide-react icons for UI — never emoji as icons.
- **Do** apply hero photography only through the `hero-atmosphere` treatment (dark scrim + gold tint + `pointer-events: none` + decorative `aria-hidden`), so text contrast never drops.

### Don't:
- **Don't** give resting cards hard drop shadows or decorative glows; depth comes from tone (Elevation-by-Tone Rule).
- **Don't** strengthen panel borders past gold 28% (Subtle-Border Rule).
- **Don't** duplicate the primary CTA in a view — one focus per screen.
- **Don't** place light gold text on the gold gradient in day mode without checking contrast (the accent darkens in day to stay readable).
- **Don't** hardcode colors outside the palette×theme system — always go through the CSS variables so the six palettes keep working.
- **Don't** add photographs outside the hero without the Rare-Metal test — the dark-gold identity survives on scarcity, not on wallpapering panels with images.
