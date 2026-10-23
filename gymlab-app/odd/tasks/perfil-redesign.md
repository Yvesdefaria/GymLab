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

- **T0 — Spec y doc ODD.** Estado: hecho. Commit: `docs: spec del rediseño de perfil Nocturno Minimal`.
- **T1 — Helpers de dominio + tests rojo→verde.** `src/domain/profile.ts` y `tests/unit/domain/profile.test.ts`. Estado: pendiente.
- **T2 — Héroe de racha + tests de componente.** `ProfileStreakHero`. Estado: pendiente.
- **T3 — Filas de marcas, historial y datos + tests.** `ProfilePrRows`, `ProfileWorkoutRows`, `ProfileDataRows`. Estado: pendiente.
- **T4 — Deload y chapas hairline.** `ProfileDeloadRow`, `ProfileChapasRow`. Estado: pendiente.
- **T5 — Composición de `/perfil` + identidad.** `PerfilPage`, `ProfileUserCard`; borrar tabs y tarjetas sin uso. Estado: pendiente.
- **T6 — `/perfil/historial` + router + comparador.** `PerfilHistorialPage`, `BestSessionCard`, test de ruta. Estado: pendiente.
- **T7 — i18n es/en.** Claves nuevas y copy de identidad. Estado: pendiente.
- **T8 — Verificación y cierre.** `npm test`, `npm run build`, screenshots, review, CHANGELOG, README de diseño. Estado: pendiente.

## Log

- **L1 (2026-10-23, pedido del usuario, verbatim):** «activa multisesion, quiero rediseñar perfil, gymlab-app\docs\design\README.md aqui tienes los detalles, preguntame con grillme y enseñame mockups».
- **L2 (2026-10-23, respuestas del usuario):** «opcion A / q1 eso es tarea de otra sesion, lo revisamos al finalizar / q2a,q3 recomendado / q4 recomendado / q5 recomendado».
- **L3 (2026-10-23, respuestas del usuario):** «dale lo recomendado» (Q6–Q10). Cierra: historial completo con comparador al final; edad de lectura; deload en fila; empty state único; insignia en el pie del héroe.
- **L4 (2026-10-23, aprobación):** «dale». Aprueba el mockup v2 y autoriza spec + implementación.
- **Evidencia T0:** worktree `.worktrees/perfil-redesign` (rama `perfil-redesign`, base `1b61686a`). Mockup `perfil-a-v2.html` sin errores de consola. Spec `docs/superpowers/specs/2026-10-23-perfil-nocturno-minimal-design.md`.
- **Q1 parkeada:** la rama nace de `feat/stats-nocturno-minimal` (sin mergear). El orden de merge se revisa al cerrar, por pedido explícito del usuario.
