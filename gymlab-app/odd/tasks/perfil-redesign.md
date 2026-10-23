# Perfil — rediseño Nocturno Minimal (dirección A)

Objetivo: rediseñar `/perfil` y sumar `/perfil/historial` con el lenguaje C1, héroe de racha y secciones hairline. Rama `perfil-redesign` (worktree aislado por pedido de multisesión). Runner: `vitest` (`npm test`) + `npm run build`; verificación visual con Playwright Python.

## Specs

- **S1 — Héroe único de racha.** `/perfil` abre con la racha actual en semanas (Oswald 300 62 px), el máximo a la derecha, una tira de 30 días (10×3, no interactiva) y un pie con la próxima insignia; si no hay insignia, “Último entreno: {fecha}”. A la derecha del pie, `{activos} / 30 días`. El héroe se oculta solo con 0 entrenos; con entrenos previos y racha 0 muestra `0` + `rachaRota`.
- **S2 — Sin tabs, secciones hairline.** Orden: identidad → héroe → fila de 3 (volumen semanal con unidad, PRs, entrenos) → mejores marcas (3) → historial reciente (3) → datos → deload → chapas. Sin chart de volumen, sin footer y sin engranaje.
- **S3 — Identidad.** Avatar 64 px que abre el picker, nombre editable inline y meta “{N} entrenos · desde {mes año}”. Sin entrenos, se omite “desde”.
- **S4 — Perfil vacío.** Con 0 entrenos: identidad + un único empty state (`sinDatosTitulo`, `sinDatosTexto`, CTA `empezarEntrenar` → `/`) + “Tus datos” si existe. Se ocultan héroe, stats, marcas, historial, deload y chapas. Nada de “0 semanas” ni grillas apagadas.
- **S5 — Datos honestos.** Edad de lectura (sin chevron). “Altura y sexo” combina `{altura} · {sexo}` y linkea a `/calculadoras/medidas`. “Peso” linkea a `/peso-corporal`. Filas ausentes si falta el dato.
- **S6 — Deload compacto.** Fila hairline con título, `Señal {score}/100 · {estado}`, `InfoTip` y switch `role="switch"`. Sin barras de señales ni tarjeta.
- **S7 — Chapas.** Fila de medallas + “Ver todas” → `/logros`; oculta si no hay chapas.
- **S8 — `/perfil/historial`.** Ruta nueva lazy con back a `/perfil`: marcas completas con contador, timeline por mes de 10 en 10 con “Ver más entrenos” y comparador de sesiones al final (shell hairline, interna intacta). Sin entrenos, empty state honesto.
- **S9 — i18n es/en.** Todas las cadenas nuevas en `perfil.*`; nada hardcodeado. Se actualiza `entrenosRegistrados` al copy nuevo.
- **S10 — A11y y temas.** Tira de 30 días no interactiva con resumen sr-only; filas ≥44 px; switch accesible; sin animaciones nuevas; tokens únicos; funciona en noche/día y 6 paletas.
- **S11 — Entrega.** Commits work-unit en `perfil-redesign`, review RDD antes de commitear, sin push. Q1 (base stats) se resuelve al cerrar.

## Tasks

- **T0 — Spec y doc ODD.** Estado: hecho. Commit: `74fbea9b`.
- **T1 — Helpers de dominio + tests rojo→verde.** `src/domain/profile.ts` y `tests/unit/domain/profile.test.ts` (12 casos). Estado: hecho.
- **T2 — Héroe de racha + tests de componente.** `ProfileStreakHero` (7 casos). Estado: hecho.
- **T3 — Filas de marcas, historial y datos + tests.** `ProfilePrRows`, `ProfileWorkoutRows`, `ProfileDataRows` (8 casos). Estado: hecho.
- **T4 — Deload y chapas hairline.** `ProfileDeloadRow`, `ProfileChapasRow`. Estado: hecho (sin test de componente; la lógica de score ya estaba cubierta).
- **T5 — Composición de `/perfil` + identidad.** `PerfilPage`, `ProfileUserCard`; tabs y tarjetas viejas eliminadas. Estado: hecho.
- **T6 — `/perfil/historial` + router + comparador.** `PerfilHistorialPage`, `BestSessionCard`, test de ruta. Estado: hecho.
- **T7 — i18n es/en.** Claves nuevas y copy de identidad. Estado: hecho.
- **T8 — Verificación y cierre.** `npm test` **173 archivos / 1730 tests**, `npm run build` limpio, screenshots de perfil/vacío/historial con 0 `pageerror`, review nativo approved+acked. Docs en curso. Estado: hecho salvo merge (Q1).

## Review y follow-ups

- Review nativo `review-eef57aa439820b04` (medium, lente reliability): **approved + acknowledged (authority burned)** el 2026-10-23.
- 8 hallazgos **no bloqueantes** (todos informational), a resolver en una fase de tests/robustez:
  - **R3-1** — El test de la ruta lee el router como texto; falta un render real de `/perfil/historial`.
  - **R3-2** — No hay test de composición de `PerfilPage` (héroe vs empty state, links por sección).
  - **R3-3** — El “Ver más entrenos” de la página no está probado a nivel de página.
  - **R3-4** — La rama `grouped` de `ProfileWorkoutRows` no está ejercitada.
  - **R3-5** — `handleToggle` del deload no captura el rechazo del repo (mismo patrón que la tarjeta vieja); sin test de switch.
  - **R3-6** — El test cuenta celdas `aria-hidden` por `data-testid` en vez de la superficie accesible.
  - **R3-7** — El test de filas no asegura el separador entre volumen y duración.
  - **R3-8** — Con exactamente 1 entreno, la sección del comparador en `/perfil/historial` queda vacía (el card se auto-oculta).

## Log

- **L1 (2026-10-23, pedido del usuario, verbatim):** «activa multisesion, quiero rediseñar perfil, gymlab-app\docs\design\README.md aqui tienes los detalles, preguntame con grillme y enseñame mockups».
- **L2 (2026-10-23, respuestas del usuario):** «opcion A / q1 eso es tarea de otra sesion, lo revisamos al finalizar / q2a,q3 recomendado / q4 recomendado / q5 recomendado».
- **L3 (2026-10-23, respuestas del usuario):** «dale lo recomendado» (Q6–Q10). Cierra: historial completo con comparador al final; edad de lectura; deload en fila; empty state único; insignia en el pie del héroe.
- **L4 (2026-10-23, aprobación):** «dale». Aprueba el mockup v2 y autoriza spec + implementación.
- **L5 (2026-10-23, implementación):** worktree `.worktrees/perfil-redesign` (rama `perfil-redesign`, base `1b61686a`). TDD rojo→verde en `domain/profile.ts`, `ProfileStreakHero`, `ProfilePrRows`, `ProfileWorkoutRows`, `ProfileDataRows` y el test de ruta. Eliminados `ResumenTab`, `HistorialTab`, `RachasSection`, `PrListCard`, `RecentHistoryCard`, `VolumeChartCard`, `SummaryCards` y `StatCard` al quedar sin uso. `ProfileUserCard` ahora muestra “{N} entrenos · desde {mes año}”; el back dice “Más”. Commit `0fe1c9a4` (27 archivos, +1228/−448).
- **L6 (2026-10-23, verificación):** `npm test` 173 archivos / 1730 tests; `npm run build` limpio. Screenshots con Playwright (390×844) de `/perfil` con datos, `/perfil` vacío y `/perfil/historial`: layout correcto, español, 0 `pageerror` (solo warnings benignos de `navigator.vibrate`).
- **L7 (2026-10-23, review):** consentimiento del usuario concedido; START creó `review-eef57aa439820b04` con lente reliability; reviewer approved con 8 hallazgos informativos; acknowledge ejecutado y authority burned.
- **L8 (2026-10-23, cierre e integración):** stats C1 (`stats-c1-detalle`) rebaseado sobre `main` y mergeado ff-only (`7e14b7f4`); `perfil-redesign` rebaseado sobre `main` (conflicto solo en `CHANGELOG.md`, resuelto conservando las dos entradas), build **173/1730** y merge ff-only (`0f85b4de`). Worktree y rama `perfil-redesign` cerrados con `scripts/worktree.ps1 close`. `main` = `942a221c` (README de diseño actualizado). **Espejo de Engram pendiente por cuota** (429 daily limit del extractor): el estado local está completo en `main`.
- **Q1 resuelta:** stats C1 primero, perfil después. El worktree `.worktrees/stats-c1-detalle` sigue abierto (limpio y ya contenido en `main`); lo cierra la sesión de stats.

