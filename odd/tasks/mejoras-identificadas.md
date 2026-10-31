# Mejoras identificadas — localización de días y ajustes de notificaciones

**Objetivo:** cerrar los dos pendientes abiertos de `PLAN.md` §«Mejoras identificadas (sin fase asignada)»: nombres de día de rutina sin localizar y permiso de notificaciones bloqueado sin salida.
**Rama:** `mejoras-identificadas` · worktree `.worktrees/mejoras-identificadas` (multisesión pedida por el usuario).
**Runner:** `vitest` (`npm test`) + `npm run build`; verificación nativa en emulador Android; e2e con Playwright Python si el caso lo justifica.
**Spec:** `gymlab-app/docs/superpowers/specs/2026-10-31-mejoras-identificadas-design.md`.
**Estado:** en curso.

## Specs

- **S1 — Días localizados en la home.** `HeroCard` resuelve `todayDay.name` con `localizeRoutineDay`; `EntrenarPage` pasa el día completo (con `id`) y el título de rutina localizado al selector. En inglés se ve el nombre EN del día; en español, el del seed. Un día propio conserva su texto.
- **S2 — Días localizados en selectores.** `DaySelectorSheet` y `RoutineDestinationSheet` resuelven cada día con `localizeRoutineDay`; los ids sin entrada en `ROUTINE_DAYS_EN` caen al texto original.
- **S3 — Plan predefinido localizado.** `PlanNaming` suma `predefinedDayName?`; `planRoutine` lo usa en la rama predefinida con fallback a `day.name`. `usePlanNaming` lo implementa con `localizeRoutineDay`. El preview y lo persistido quedan en el idioma de la UI.
- **S4 — Clonar rutina predefinida localizado.** `handleClone` localiza rutina y días antes de `cloneRoutineDraft`; la rutina propia nace en el idioma de la UI.
- **S5 — Botón «Abrir ajustes del sistema» (Android).** Plugin local `GymLabSettings` (`ACTION_APP_NOTIFICATION_SETTINGS` + fallback a detalles de la app), wrapper `appSettings.ts` (web no-op), botón de 44 px visible solo con permiso `denied` en Android, re-chequeo del permiso al volver a primer plano. i18n es/en.
- **S6 — Verificación.** TDD rojo→verde, `npm run build` limpio, `npm test` verde, emulador Android con permiso revocado (el botón abre Ajustes), review nativo antes de cada commit, commits work-unit sin push.

## Tasks

- [ ] **T0 — Docs de diseño.** Spec + task ODD. Commit `docs:` (sin código). · S1–S6
- [ ] **T1 — Localización de días.** HeroCard, EntrenarPage, DaySelectorSheet, RoutineDestinationSheet, PlanNaming/planRoutine/usePlanNaming, handleClone + tests. Commit `fix:`. · S1–S4
- [ ] **T2 — Ajustes del sistema desde Notificaciones.** Plugin Android, wrapper, hook, UI, i18n + tests. Commit `feat:`. · S5
- [ ] **T3 — Cierre.** Emulador, `PLAN.md` (quitar los dos pendientes + follow-up iOS), `CHANGELOG.md`, verificación final. Commit `docs:`. · S6

## Log

- **L1 (2026-10-31, pedido original, verbatim):** «vamos a hacer este apartado:Mejoras identificadas (sin fase asignada), activa multisesion».
- **L2 (2026-10-31, decisión del usuario, verbatim):** «Los dos pendientes» — se hacen localización de días y botón de ajustes en la misma sesión.
- **L3 (2026-10-31, decisión del usuario, verbatim):** «Solo Android ahora» — el plugin de ajustes se implementa y verifica en Android; iOS queda como follow-up documentado en PLAN.
