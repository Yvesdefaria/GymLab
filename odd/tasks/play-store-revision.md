# Play Store — revisión de políticas

**Objetivo**: dejar la app y la web en condiciones de pasar la revisión de Play Console (política de privacidad, Health Connect, Data safety, contacto) sin agregar gasto recurrente innecesario.
**Rama**: `main` · **Entrega**: commits locales en la app (sin push), push + deploy en el repo web · **Verificación**: `npm run build`, `npm test`, `assembleDebug`, e2e Playwright, emulador-5554 vía CDP, fetch a producción.

## Specs

- **S1 — Link de privacidad de Health Connect.** `android/app/src/main/res/values/strings.xml` → `privacy_policy_url` debe ser `https://gymlab.dev/privacidad`, la misma política de la ficha de Play. No puede apuntar a un dominio de terceros ni devolver 404.
- **S2 — Divulgación de Health Connect en la política web.** `/privacidad` debe nombrar Health Connect y HealthKit, el dato leído (pasos diarios), que se procesa en el dispositivo, que no se comparte ni se usa para publicidad, y que el permiso es revocable. La sección de permisos no puede afirmar accesos que la app no tiene (Motion & Fitness / Location).
- **S3 — Política in-app consistente.** Misma sustancia que S2 en `privacidad.secciones.*` (es/en) y en `terminos.permisos`, con paridad i18n garantizada por `tests/unit/domain/legal.test.ts`.
- **S4 — Contacto unificado.** `src/config/contact.ts` usa `gymlab@gymlab.dev`; el buzón debe recibir correo real antes de enviar a revisión.
- **S5 — Health apps declaration** en Play Console (App content → Health apps). Acción del usuario.
- **S6 — Data safety** en Play Console, coherente con el código: sentry/posthog opt-out, cifrado, sin datos de salud recolectados, sin ads ni IAP activos. Acción del usuario.
- **S7 — Rationale correcta.** `PermissionsRationaleActivity` + alias declarados en el manifest y mostrando la política publicada (verificado en emulador).
- **S8 — Titular.** Nombre/razón social + NIF del responsable en la política. GDPR; no bloquea Play. Dato del usuario.
- **S9 — Costo.** No contratar buzón pago si un camino gratuito cumple los requisitos de Play.

## Tasks

- [x] **T1 — Link de Health Connect** (`7c1f858b`): `gymlab.app/privacidad` (404) → `gymlab.dev/privacidad`.
- [x] **T2 — Política web** (`329ecb3`, deploy `d99576f`): sección 6 «Salud y actividad física (Health Connect y HealthKit)» (12 secciones), sección 7 «Permisos» corregida, `/terminos` §3 corregida, fecha 21-oct.
- [x] **T3 — Política in-app** (`7c1f858b`): sección `salud` nueva en `PRIVACIDAD_SECTIONS` + `privacidad.secciones.salud` (es/en); `permisos` de privacidad y términos reescrito; `TERMINOS_UPDATED`/`PRIVACIDAD_UPDATED` → 21/10/2026.
- [x] **T4 — Contacto** (`7c1f858b`): `CONTACT_EMAIL` → `gymlab@gymlab.dev`; e2e `test_f93_t26_legal.py` y `test_f93_t29_report_bug.py` actualizados (el segundo además con `salud` en `PRIVACIDAD_IDS`).
- [x] **T5 — Buzón gratuito** (consola, sin commit): Cloudflare Email Routing, `gymlab@gymlab.dev` → destino personal verificado. MX + DKIM + SPF live; prueba real de recepción OK.
- [x] **T6 — Verificación nativa**: emulador-5554, `PermissionsRationaleActivity` carga `https://gymlab.dev/privacidad/` (title «Política de Privacidad — GymLab»), y tras el deploy muestra la sección de salud (`HAS_HEALTH_CONNECT: True`).
- [ ] **T7 — Health apps declaration** (usuario): Health Connect, «Activity / steps», lectura diaria + background para el widget, on-device, sin ads, sin venta, revocable.
- [ ] **T8 — Data safety** (usuario): `App interactions` + `Crash logs` + `Device or other IDs`; **sin Diagnostics**; telemetría **OFF por defecto**; salud/location/personal info/finance/photos no recogidos; Ads/IAP: No. Respuestas en `docs/PLAY-STORE-DATA-SAFETY.md`.
- [ ] **T9 — Titular** (usuario): nombre/razón social + NIF en `/privacidad`.
- [ ] **T10 — SEO canónico de la app** (fuera de S1-S9, decisión pendiente): `useSeo.ts` `SITE_URL` e `index.html` canonical/OG siguen en `https://gymlab.app`. `app.gymlab.dev` aún no resuelve (`ENOTFOUND`).

## Log

- **L1 — pedido original (2026-10-21)**: «vamos a terminar el apartado de play store revision».
- **2026-10-21 — diagnóstico**: `gymlab.app/privacidad` → **404** (fetch); `gymlab.dev/privacidad` → **200**. El plugin `capacitor-health` lee `privacy_policy_url` con `getIdentifier(...)` (confirmado en `node_modules/capacitor-health/android/src/main/java/com/fit_up/health/capacitor/PermissionsRationaleActivity.kt`). La política publicada y la in-app no mencionaban Health Connect y declaraban Motion & Fitness + Location, que la app no usa (no hay plugin de geolocalización; los pasos salen de Health Connect/HealthKit).
- **2026-10-21 — implementación app** (`7c1f858b`): S1, S3, S4. Verificado: `npm run build` exit 0 · `npm test` **163 archivos / 1652 tests** · `assembleDebug` OK · e2e legal y report-bug **ALL OK** · `review assess` → `medium` / `under_budget` (`review_due=false`).
- **2026-10-21 — implementación web** (`329ecb3`): S2. `npm run build` verde, 12/8 `h2` en `dist`.
- **2026-10-21 — deploy web**: push `fd733aa..329ecb3` (Workers git integration). Producción verificada: `/privacidad/` 200 con «Health Connect» y fecha 21-oct; `/terminos/`, `/`, `sitemap`, `robots` 200.
- **2026-10-21 — verificación en superficie real**: CDP contra el WebView de la rationale en emulador-5554 → `https://gymlab.dev/privacidad/`, `HAS_HEALTH_CONNECT: True`, fecha 21-oct.
- **L2 — pedido del usuario**: «continua, el codigo de la web esta en desktop/webgymlab» → se ejecutó el deploy y se verificó producción.
- **L3 — consulta del usuario**: «es necesario el correo? ya que me pide 15 dolares al mes, no se si es impresindible» → Play exige un email de contacto válido, **no** dominio propio (ayuda oficial). Se propuso Cloudflare Email Routing (gratis) porque el dominio ya está en Cloudflare y no tenía MX.
- **2026-10-21 — buzón (S9)**: onboarding de Email Routing; el SPF de DonDominio desapareció durante el onboarding y el de Cloudflare quedó `Missing` → se agregó a mano `v=spf1 include:_spf.mx.cloudflare.net ~all`. Destino personal verificado; regla `gymlab@gymlab.dev` creada; **mail real recibido**. MX/SPF/DKIM verificados desde 1.1.1.1 y 8.8.8.8.
- **Nota de operación**: el contador «Emails received» de la lista de dominios quedó en 0 después de la entrega — es una métrica agregada con lag, no la fuente de verdad. La evidencia de aceptación es el mensaje recibido (y el Activity log por mensaje).
- **L4 — pedido del usuario**: «ok documenta todo para continuar con la siguiente tarea» → este documento + cierre de #30 en `PLAN.md` + memoria en Engram.
- **Siguiente tarea**: cargar T7 y T8 en Play Console (usuario). Después, la tarea de release que bloquea la publicación real: **firma release propia + APK/AAB** (`PLAN.md`, «Pendientes de release»).
