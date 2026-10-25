# F132.4 — Actividad (logros, objetivos, wearables)

Objetivo: migrar `/logros`, `/objetivos` y `/wearables` a Nocturno Minimal sin perder datos, funciones ni contratos e2e.
Rama: `132.4-actividad` (worktree `.worktrees/132.4-actividad`, multisesión pedida por el usuario).
Entrega: 4 work-unit commits en la rama + merge `--ff-only` a `main` cuando las otras sesiones estén idle; sin push.
Runner: `npm test` (Vitest) + `python tests/e2e/scripts/with_server.py <test> --port 5245` (Playwright Python).
Spec: `docs/superpowers/specs/2026-10-24-f132-4-actividad-design.md` · Plan: `docs/superpowers/plans/2026-10-25-f132-4-actividad.md`.

## Specs

- **S1 — Logros.** Vitrina de 2 columnas con medalla metálica de 48 px, nombre, `×N`, barra fina y «1 de 50»; héroe `X/36` con barra general; chips «Todos / Desbloqueados / Pendientes» (Todos por defecto); detalle en bottom sheet con descripción, condición, metal, variante y progreso. Se preservan `data-achievement`, `data-progress="general"`/`"<id>"`, `data-tour="logros-medalla"`, el literal `X/36` y las barras de cada logro.
- **S2 — Objetivos.** Héroe «próximo hito» con `150 kg e1RM`, `112,5 → 150 kg`, `~75 semanas · <fecha>` y `+0,5 kg/semana`; filas hairline por objetivo (incluidos los que no tienen proyección, con «Sin datos recientes»); alta/edición en bottom sheet con `ExercisePicker`; borrar con confirmación; sin autoenlace «Gestionar objetivos». Héroe: menor ETA, desempate por avance; vacío con CTA; todos alcanzados en verde.
- **S3 — Wearables.** Estado vacío centrado (anillo punteado, «Nada que sincronizar todavía», dispositivos en chips 2×2). Solo visual: sin integración, permisos, enlaces ni rutas nuevas; `WEARABLE_DEVICES` no cambia.
- **S4 — Unidades.** Los pesos visibles se convierten con `applyUnits`, se redondean a 1 decimal y se formatean con `formatNumber`; los kg internos no cambian. En kg los textos son idénticos a los actuales.
- **S5 — i18n.** Todas las cadenas nuevas y modificadas en es/en (tipadas por `EsSchema`), sin literales de UI en componentes.
- **S6 — Verificación.** `npm run build` + `npm test` verdes; e2e nuevo `test_f132_4_actividad.py`; `test_f59_objetivos.py` actualizado (hoy rojo en `main`); f93_16, f95, f127, f101, t2, f69, t10 verdes; 0 `pageerror`. Sin cambios de router/nativo → sin emulador.
- **S7 — Cierre.** Un commit por pantalla + uno de docs; review nativo antes de cada commit de código; `PLAN.md`, `CHANGELOG.md`, `docs/design/*` y este documento al cerrar; sin push.

## Tasks

| ID | Tarea | Spec | Ruta | Estado |
|---|---|---|---|---|
| T0 | Task doc ODD + espejo Engram | S7 | inline | [x] |
| T1 | Logros: filtro puro + vitrina + sheet + i18n + e2e | S1, S5, S6 | inline | [x] |
| T2 | Objetivos: helpers + héroe + filas + sheet + f59 + e2e | S2, S4, S5, S6 | inline | [ ] |
| T3 | Wearables: estado vacío + i18n + e2e | S3, S5, S6 | inline | [ ] |
| T4 | Docs + CHANGELOG + PLAN + espejo Engram | S7 | inline | [ ] |

## Log

- **L1** (2026-10-24, pedido literal): «activa multisesion,vamos a hacer 132.4 — Actividad, si necesitas preguntarme usa grill me y muestrame los ejemplos en mockups».
- **L2** (2026-10-24, respuestas del grilling): «q1a, q2 ok, q3a, q4 ok, q5 dame otros diseños, no me gusta ninguno de los 2, q6 si entra pero solo visual».
- **L3** (2026-10-24, Q7): «vamos a ir con la opcion C mientras se implementa esa feature, en su momento se haran sus cambios».
- **L4** (2026-10-24, aprobación del playback): «esta bien , dale».
- **L5** (2026-10-25, aprobación de la spec): «dale».
- **Evidencia previa:** `test_f59_objetivos.py` está rojo en `main` desde el rediseño de Home (la home ya no renderiza proyecciones); esta fase lo actualiza a `/objetivos`.
- **T1 (2026-10-25):** vitrina de 2 columnas + chips + sheet implementados. `npm run build` OK; `npx vitest run` 182 files / 1788 tests; e2e nuevo en 375 + 768 OK. Baseline comparado: `test_f95`, `test_f93_16` y `test_f127` ya estaban rojos en `main` con exactamente el mismo set de fallos (idioma inglés por default + rediseño de Perfil + onboarding); no se agregan fallos nuevos. Review nativo `review-dca8c277d0821526`: reliability encontró R3-A11Y-PROGRESS (CRITICAL: el tile era un `<button>` con `aria-label` y volvía presentacional la barra); corregido con botón estirado + test de roles accesibles, refutado/corroborado, validado y **approved + acknowledged** (`target sha256:8f2ffd…`). Follow-ups no bloqueantes del review: R3-E2E-ALLOCATION, R3-E2E-VACUOUS, R3-WEAK-SELECTOR, R3-DOMAIN-ORDER (tests; quedan anotados).
- **Decisiones del agente aceptadas:** desempate del héroe (menor ETA → mayor avance); vacío con CTA; todos alcanzados en verde; héroe de lectura, edición desde la fila; borrar dentro del sheet; volver a `/mas` en Logros/Wearables y a `/` en Objetivos; orden de catálogo dentro de cada sección.
