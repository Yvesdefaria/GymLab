# Endurecimiento de Cloudflare — audit de la zona y la cuenta

- Feature: cloudflare-hardening
- Estado: audit hecho (2026-10-22), fixes pendientes
- Alcance: zona `gymlab.dev` (incluye `app.gymlab.dev`), cuenta de Cloudflare y la landing
- Relevado con: MCP `cloudflare-api` (token de solo lectura: `user:read account:read`)

## Resumen

Hay **dos hallazgos Moderate** (MFA de la cuenta y Bot Fight Mode), dos de transporte (HSTS apagado y
TLS mínimo 1.0), tres de DNS/correo (DMARC y CAA ausentes, DNSSEC deshabilitado), dos de código web
(`security.txt` y headers en la landing) y dos que no aplican o son decisión de producto (Turnstile sin
formularios, AI Labyrinth).

## Hallazgos

| # | Severidad | Hallazgo | Evidencia | Fix |
|---|---|---|---|---|
| 1 | **Moderate** | **Cuenta sin MFA** | Insight `securitycenter` sobre `yvesdefaria280@gmail.com`; el token no devuelve datos de usuario | Activar 2FA en el perfil de Cloudflare. Detrás de ese login están DNS, Workers, certificados y el dominio |
| 2 | **Moderate** | **Bot Fight Mode apagado** | `GET /zones/:id/bot_management` → `fight_mode: false` | Security → Bots → Bot Fight Mode ON. Puede desafiar scrapers y previews de links: decidir |
| 3 | Alta | **HSTS apagado** | `security_header.strict_transport_security.enabled = false`; `curl -I` sin `strict-transport-security` en apex, www y app | SSL/TLS → Edge Certificates → HSTS. Empezar con max-age 6 meses; `preload` solo cuando esté estable |
| 4 | Media | **TLS mínimo 1.0** | `min_tls_version: "1.0"` | Subir a **1.2** (TLS 1.3 ya está en `on`) |
| 5 | Media | **DMARC ausente** | `_dmarc.gymlab.dev` sin TXT; SPF y DKIM sí existen | TXT `_dmarc`: `v=DMARC1; p=none; rua=mailto:gymlab@gymlab.dev` y pasar a `quarantine` tras observar |
| 6 | Media | **CAA ausente** | Sin registros CAA en la zona | CAA restringiendo las CAs que Cloudflare usa para emitir |
| 7 | Media | **DNSSEC deshabilitado** | `GET /zones/:id/dnssec` → `status: disabled` | Activar en Cloudflare **y** cargar el DS en DonDominio. Sin el DS el dominio deja de resolver |
| 8 | Baja | **`security.txt` ausente** | `https://gymlab.dev/.well-known/security.txt` → 404 (insight abierto) | Archivo estático en `WebGymLab/public/.well-known/security.txt` |
| 9 | Baja | **Landing sin headers de seguridad** | `gymlab.dev`: sin `nosniff`, `referrer-policy`, `X-Frame-Options` ni CSP. La app sí los tiene | `WebGymLab/public/_headers` (patrón de la app). CSP en report-only, o al menos `frame-ancestors 'none'` |
| 10 | Baja | `ssl: full` (no `strict`) | `GET /zones/:id/settings` → `ssl: "full"` | Sin origen propio el riesgo es bajo; si algún día hay origen, `strict` |
| 11 | — | Sin Turnstile | `GET /accounts/:id/challenges/widgets` → 0 widgets | **No aplica**: no hay formularios ni login. Solo con un form real |
| 12 | — | AI Labyrinth apagado | Insight `no_challenge_ai_bots` | Decisión de producto: bloquea crawlers de IA, pero la landing quiere ser indexable |

## Lo que ya está bien

- `always_use_https: on`, `automatic_https_rewrites: on`, `tls_1_3: on`.
- `security_level: medium`, `browser_check: on`, `challenge_ttl: 1800`.
- `0rtt: off`, `rocket_loader: off`.
- Rulesets gestionados activos: DDoS L7, Managed Free Ruleset, Response Firewall, Normalization.
- 4 certificados activos (apex, www, app y wildcard) con vencimiento en enero de 2027.
- MX + SPF + DKIM de Email Routing correctos.
- `gymlab.dev/no-existe` → 404 real; `robots.txt` y `sitemap-index.xml` → 200.

## Lo que no se pudo verificar

- ~~**4XX/5XX reales por código de estado**~~ — **corregido 2026-10-24**: sí hay fuente. La Analytics SQL API
  (`GET /accounts/{account_tag}/analytics/sql`) expone `events.httpRequests`, `events.rumPageloadEvents` y
  `events.rumWebvitalsEvents`; el RUM **está instalado** en la zona (auto-install, `siteTag 59ae492f…`). Lo
  que está sunset es `/zones/:id/analytics/dashboard`, no el analytics.
- **Builds fallidos**: `GET /accounts/:id/builds/workers/:script/builds` devolvió 0 para `gymlab-web` y
  `gymlab-app`; probablemente pide otro identificador. No es bloqueante (ambos Workers deployan).
- **MFA**: el token no devuelve datos del usuario; lo confirma el insight.

## Cómo verificar cada fix

```powershell
# HSTS (debe aparecer strict-transport-security)
curl.exe -sI https://gymlab.dev | Select-String "strict-transport"

# TLS mínimo (debe fallar con TLS 1.1)
curl.exe --tlsv1.1 --tls-max 1.1 -sI https://gymlab.dev

# DMARC y CAA
Resolve-DnsName _dmarc.gymlab.dev -Type TXT | Select-Object -ExpandProperty Strings
nslookup -type=CAA gymlab.dev

# DNSSEC: estado activo en Cloudflare y DS presente en el TLD
# (MCP: get_zones_dnssec -> status: "active")

# security.txt y headers de la landing
curl.exe -sI https://gymlab.dev/.well-known/security.txt
curl.exe -sI https://gymlab.dev | Select-String "x-content-type-options|referrer-policy|x-frame-options"
```

## Notas de ejecución

- El token actual es **de solo lectura**: los cambios de zona los aplica el dueño desde el dashboard, o un
  token con permisos de escritura (entonces el MCP puede aplicarlos con autorización explícita).
- Los ítems 8 y 9 son código y viven en `WebGymLab`; el resto es configuración de Cloudflare.

## Actualización 2026-10-24 — fixes aplicados con el MCP (write)

El MCP `cloudflare-api` se re-autenticó por OAuth con rol Super Administrator, así que los cambios de zona
se aplicaron por API. Cerrado:

| # | Hallazgo | Estado 2026-10-24 |
|---|---|---|
| 3 | HSTS apagado | **Cerrado**: `max-age=15552000; includeSubDomains` en apex, www y app |
| 4 | TLS mínimo 1.0 | **Cerrado**: `min_tls_version: "1.2"`; TLS 1.0 falla el handshake |
| 5 | DMARC ausente | **Cerrado**: `v=DMARC1; p=none; rua=mailto:gymlab@gymlab.dev` |
| 6 | CAA ausente | **Cerrado**: `issue` para pki.goog, letsencrypt.org y sectigo.com + `iodef` |
| 8 | `security.txt` ausente | **Cerrado** en `WebGymLab` (`b61a333`), 200 en producción |
| 9 | Landing sin headers | **Cerrado** con `public/_headers` (CSP en report-only, como se recomendaba) |
| 10 | `ssl: full` | Sin cambio: no hay origen propio, el riesgo es nulo |
| 1 | MFA | **Sigue abierto**: requiere dashboard + teléfono |
| 7 | DNSSEC | **Sigue abierto**: el DS se carga en DonDominio, no en Cloudflare |
| 2 | Bot Fight Mode | Sin cambio: decisión de producto (puede afectar previews de links) |

Además se agregó WAF custom + rate limiting (no estaba en este audit) ante la evidencia de escaneo:
39% de 16.627 requests eran 404 de exploits y 1.369 iban a `:8080`/`:8443`.
