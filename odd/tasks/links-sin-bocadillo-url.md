# Links sin bocadillo de URL en long-press

**Estado:** COMPLETADO (2026-10-04) — commit `926f61b` (sin push; lo hace el usuario), review Gentle AI aprobado.

**Objetivo:** Al mantener pulsado un link en móvil (barra inferior, Más y cualquier `<a>`) ya no debe aparecer el menú/bocadillo nativo con la URL interna (`http://localhost/...`). La navegación por tap, la selección de texto fuera de links y el clic derecho de desktop no cambian.

## Contexto

- El bocadillo es UI NATIVA del motor web (WebView de Capacitor / navegador), no de la app: en Android NO está gateado por el evento DOM `contextmenu` (probado en emulador con CDP).
- Afecta a los `NavLink` de `src/components/layout/TabBar.tsx`, los `Link` de `src/pages/MasPage.tsx` y cualquier otro `<a>`.
- iOS no es verificable desde Windows (requiere Mac/Xcode); el flag `allowsLinkPreview` es config documentada de Capacitor.

## Tareas

- [x] T1 — Test unitario del handler en `tests/unit/lib/suppressLinkLongPress.test.ts` (RED→GREEN, 5 casos)
- [x] T2 — Módulo `src/lib/suppressLinkLongPress.ts` + hook en `src/main.tsx`
- [x] T3 — CSS `a, a *` en `src/index.css` (`-webkit-touch-callout` + `user-select: none`)
- [x] T4 — `capacitor.config.ts`: `ios.allowsLinkPreview: false`
- [x] T5 — CHANGELOG `[Unreleased] → Fixed` (revisar redacción si la capa nativa cambia el alcance)
- [x] T6 — Verificación: `npm test` (112/1244 verdes), `npm run build` OK, emulador → capa web INSUFICIENTE en Android (ver evidencia)
- [x] T6b — Capa nativa Android (`MainActivity`): long-press consumido solo sobre links (variante quirúrgica por `HitTestResult`; el fallback total NO hizo falta) + RE-test en emulador OK (2026-10-04)
- [x] T7 — Ciclo de review (gentle-ai, candidato = diff del workspace) y commit sin push → **APROBADO** (lineage `review-891ec3b1101185b2`) y commit `926f61b` (8 archivos, +215/−1)

## Rutas y decisiones

- Ruta: delegada — un escritor único (TDD: test primero), verificación del parent + worker de emulador.
- Emulador: Pixel_10; `adb` fuera del PATH → `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`.
- Emulador arrancado headless (`-no-window -gpu swiftshader_indirect`) para la verificación automatizada.
- CONFIRMADO: la capa web no alcanza en Android → resuelto con la capa nativa en `MainActivity` (quirúrgica; fallback total no necesario).

## Evidencia

- 2026-10-03 TDD: suite `112 archivos / 1244 tests` verdes; `npm run build` exit 0 (build limpio).
- 2026-10-03 Emulador (emulator-5554, Android 17 / Chrome 153):
  - Baseline (build viejo): burbuja SÍ — título «Estadísticas» + `https://localhost/estadisticas` (~0.6–1.4 s durante la pulsación; se oculta al soltar).
  - Post-fix (APK nuevo + `pm clear`): burbuja SIGUE; CDP confirmó fix activo (bundle nuevo, `user-select:none`, `pointer:coarse`, `contextmenu` con `defaultPrevented:true`) → la burbuja es nativa y no la cancela el DOM.
  - Tap normal OK (navegó a Estadísticas). Long-press NO navega.
  - Capturas: `%TEMP%\opencode\longpress\` (`base-during-1100.png`, `fix-final-confirm.png`, `fix-tap-nav.png`, `inspect_webview.py`).
- Generados de `cap sync` revertidos; `git status` = solo el cambio real.
- Decisión 2026-10-03: NO commitear todavía (el candidato de review es el diff del workspace y la tarea sigue). El emulador quedó con el APK del fix instalado y los datos de la app borrados (`pm clear` + onboarding rehecho).
- 2026-10-04 (emulator-5556 / Pixel_10, APK nuevo con la capa nativa):
  - Long-press del tab «Estadísticas» → SIN bocadillo a 650/750/1200 ms (dos métodos: `motionevent DOWN/UP` y `input swipe` 900/1200 ms); la baseline previa (`base-during-1100.png`, APK viejo) SÍ lo mostraba.
  - Long-press de un ítem del hub «Más» (Calculadoras) → SIN bocadillo (700/1100 ms).
  - Control positivo: long-press de texto no-link → selección con handles + toolbar (el gesto llega OK y la variante quirúrgica preserva la selección).
  - Tap navega (Entrenar → Sesión → Estadísticas → Más); `logcat -b crash` vacío; `npm test` 112 archivos / 1244 tests; build limpio (vía `android:sync`).
  - Capturas: `%TEMP%\opencode\longpress\fix-t6b-*.png`.

## Review (2026-10-04)

- Gentle AI: **APROBADO a la primera** (lineage `review-891ec3b1101185b2`; riesgo medium; 1 lente `review-reliability`; sin correcciones; autoridad quemada con la ack exacta).
- Advisories informativos (NO bloquean; trabajo futuro opcional):
  - **R3-001 (WARNING)** `android/app/src/main/java/com/gymlab/app/MainActivity.java:20-22` — el filtro nativo consume `SRC_ANCHOR_TYPE`/`ANCHOR_TYPE`/`SRC_IMAGE_ANCHOR_TYPE`, pero no `EMAIL_TYPE`/`PHONE_TYPE`/`GEO_TYPE`. La app SÍ tiene links `mailto:` (`src/pages/PrivacidadPage.tsx:23`, `src/pages/TerminosPage.tsx:22`) → en esas páginas el long-press podría seguir mostrando el menú nativo (con la dirección de contacto, NO con la URL interna). Follow-up opcional: sumar esos tipos al filtro.
  - **R3-002 (SUGGESTION)** `src/lib/suppressLinkLongPress.ts:10` — el gate es por media query de dispositivo (`pointer: coarse`), no por el tipo de puntero del evento: en un híbrido con mouse el clic derecho podría cancelarse; en un device de puntero fino primario con táctil, el long-press no se cancela.

## Commit

- `926f61b` «fix: elimina el bocadillo con la URL al mantener pulsado un link (web y Android)» — 8 archivos, +215/−1; sin push (convención del repo).
- `4696dc0` «docs: archiva el fix sin bocadillo de URL (long-press) en COMPLETED» — 2 archivos, +8/−89; la sección se movió de `PLAN.md` a `COMPLETED.md` («Fixes cerrados (2026-10)») y los advisories quedaron parkeados como follow-ups en `PLAN.md` (`long-press-links.followups`).

## Follow-ups-2 (cerrados 2026-10-14 — lotes 30–31)

- **R3-001 (WARNING) — validado en emulador SIN cambio de código** (lote 30): el consumo nativo NO suprime la selección de texto email/teléfono/dirección-like **plano** (el email real de `/privacidad` + teléfono/dirección inyectados seleccionan; `mailto:` sigue consumido sin bocadillo) → no aplica acotar el filtro. Evidencias: `%TEMP%\opencode\lote30\`.
- **R3-002 (WARNING) — fix** (lote 30): el gate web distingue el botón del evento para el lápiz — solo la punta (`button 0`) cancela; el botón secundario (2/5) conserva su menú. **Lote 31**: borde explícito (`button` ausente → cancela como la punta). Commits `38890e9` + `f40e751`; review `review-2fa2fef2b1b39249` approved + acknowledged (0 correcciones).
