# PWA auto-update — el SW viejo se queda pegado

## Objective

Make the deployed app pick up a new release without the user clearing browser
data, on every device, including a PWA window left open for days.

## Problem

Reported 2026-10-29: the PC shows an old version for days after a release while
the phone already shows the new one.

Evidence gathered against production (`app.gymlab.dev`) and the zone:

1. `sw.js` precaches **216 entries** and installs with
   `self.skipWaiting()` + `clientsClaim()` + `precacheAndRoute`.
2. The zone has the rule **"GymLab — rate limit"**: expression `true`,
   **100 requests / 10s** per `(ip.src, cf.colo.id)`, action `block`,
   `mitigation_timeout: 10`.
3. Reproduced: requesting the 216 precache URLs in a burst returns **HTTP 429**
   after roughly 100. Workbox prefetches with ~10 concurrency, so a single
   install can exceed the limit. A failed precache entry fails the install, and
   the previous worker stays active, serving the old HTML from precache.
4. Fast connections (PC) burn the budget in seconds; slower mobile networks
   spread the same requests over more than 10s and pass. Same deploy, different
   outcome — matching the reported asymmetry.
5. `src/lib/serviceWorker.ts` calls `registerSW({ immediate: true })` and
   nothing else. Reading `vite-plugin-pwa/dist/client/build/register.js`
   confirms the autoUpdate build only calls `wb.register({ immediate })` — it
   never calls `wb.update()`, and no interval exists. A browser only re-checks
   `sw.js` on navigation, so an open PWA window never notices a release.
6. `public/test-animations.html` is matched by
   `globPatterns: ['**/*.html']`, so a dev page is precached and published.

## Scope

In scope: the zone rate-limit rule on `gymlab.dev`; `src/lib/serviceWorker.ts`;
its unit test; `vite.config.ts` (`globIgnores`).

Out of scope: removing the PWA (the staged plan in `vite.config.ts` stays as
written), Capacitor behaviour, the native cleanup path.

## Constraints

- No change to the native (Capacitor) branch: it must keep unregistering and
  returning `false`.
- Polling must be injectable so it is unit-testable without timers.
- A failing `registration.update()` must never reject or break boot.
- `test-animations.html` stays served in dev; only the precache entry goes.

## Tasks

- [x] T1 — RED: unit tests for `startUpdateChecks` and for the
  `onRegisteredSW` wiring, before any implementation.
- [x] T2 — `src/lib/serviceWorker.ts`: export `UPDATE_CHECK_INTERVAL_MS` and
  `startUpdateChecks(registration, env)`; wire it through `onRegisteredSW`.
- [x] T3 — `vite.config.ts`: `globIgnores: ['**/test-*.html']` so dev pages
  never enter the precache.
- [x] T4 — Cloudflare: exclude `/assets/*` from the rate-limit expression.
  Hashed immutable chunks are the ones the install needs; the limit stays for
  everything else.
- [x] T5 — Verify: unit tests green, `npm run build` clean, and a burst of
  asset requests no longer returns 429.

## Acceptance criteria

- New unit tests fail before T2 and pass after.
- The pre-existing service worker tests still pass unchanged in behaviour.
- `npm run build` and `npm test` pass.
- A burst of >100 requests to `/assets/*` returns no 429.
- The rate limit still applies to non-asset paths.

## Routes chosen

| Task | Route | Trigger evidence |
| --- | --- | --- |
| T1–T3, T5 | parent | one test file plus one focused module; spec already fixed by evidence |
| T4 | parent | single remote API call, needs the observed raw ruleset |

## Progress

- 2026-10-29: diagnosis completed against production, the live `sw.js`, the
  installed plugin source and the zone ruleset.
- 2026-10-29: T1 red (5 failed / 7 passed), T2 green (12/12), T3 applied,
  T4 applied to the zone.

## Verification evidence

TDD:

```
bunx vitest run tests/unit/lib/serviceWorker.test.ts   # before T2
  Tests  5 failed | 7 passed (12)

npx vitest run tests/unit/lib/serviceWorker.test.ts    # after T2
  Tests  12 passed (12)
```

Full gate:

```
npm run build   → tsc -b + vite build, 3498 modules, built in 17.11s, no errors
npm test        → Test Files 206 passed · Tests 1942 passed | 7 skipped
```

Precache: `dist/sw.js` no longer contains `test-animations`; `skipWaiting()`
and `clientsClaim()` still present.

Cloudflare rule, before → after (ruleset version 1 → 2):

```
expression: "true"
expression: 'not starts_with(http.request.uri.path, "/assets/")'
```

Empirical check against production, same client, same pattern:

```
140 requests to /assets/*   → 140 × 200, zero 429   (before: 429 after ~100)
120 requests to /           → 101 × 200, 19 × 429   (limit still enforced)
```

## Known remaining issue

`test-animations.html` still ships in `dist/` because `public/` is copied
verbatim. Only the precache entry is gone. Removing it from production means
moving it out of `public/`, which changes the dev URL — left as a decision.

## Next step

Deploy `gymlab-app`, then confirm on the PC that `navigator.serviceWorker` shows
the new worker. Without a deploy, none of this reaches the browser.
