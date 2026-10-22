# Onboarding → app: nombre, planificador y precarga de calculadoras

## Header

Objetivo: que los datos pedidos en el onboarding lleguen de verdad al planificador, a las calculadoras/medidas y al perfil, y sumar el nombre al paso de perfil para que el perfil aparezca relleno. Rama `onboarding-perfil` (worktree aislado por pedido de multisesión). Runner: `vitest` (`npm test`) + `npm run build`; e2e del repo con Playwright Python.

## Specs

- **S1 — Nombre en el onboarding.** El paso «Perfil» del wizard (donde se piden fecha de nacimiento, altura, peso y sexo) incluye un campo **Nombre** obligatorio, recortado y de 24 caracteres máximo. Al finalizar se persiste en `meta.profileName` y en `profile.displayName`, y el nombre aparece en `/perfil` en lugar del fallback «Atleta». Texto del usuario: «colocar el nombre para que asi aparezca relleno en perfil». Decisión aprobada: «Aprobado, nombre obligatorio».
- **S2 — Planificador precargado.** Al abrir `/planificador`, objetivo, nivel, días por semana y duración de sesión se precargan desde `meta.onboardingAnswers` cuando el valor es válido (`OBJECTIVES`, `LEVELS`, `[2,3,4,5]`, duración finita > 0). Si no hay blob o el valor no es válido, quedan los defaults actuales. El usuario puede cambiarlos y el prefill no vuelve a pisarlos. Texto del usuario: «En el planificador».
- **S3 — Calculadoras precargadas.** Se precargan los datos personales del onboarding sin pisar valores ya escritos por el usuario:
  - IMC: peso (kg) y altura (cm).
  - Calorías y macros: sexo, peso (kg) y altura (cm); la edad ya se precargaba.
  - Grasa corporal: peso (kg) cuando no hay registro guardado de hoy; edad y sexo ya se precargaban.
  - Navy: sexo, altura (cm) y peso (kg).
  - Medidas corporales: altura y sexo ya se precargaban; sin cambios.
  Texto del usuario: «En calculadoras/medidas».
- **S4 — Perfil con datos personales.** `/perfil` muestra una tarjeta «Tus datos» con edad, altura, sexo y peso actual; solo renderiza los valores existentes y enlaza a medidas y peso corporal para editarlos. Texto del usuario: «y perfil».
- **S5 — Verificación.** `npm run build` limpio y `npm test` verde antes de commitear; el cambio pasa por el ciclo de review nativo antes del commit work-unit. Tests unitarios nuevos cubren el mapeo puro (planificador, nombre, sexo de calculadora, último peso).

## Tasks

- [x] T1 — Dominio + tests RED/GREEN: nombre (`PROFILE_NAME_KEY`, `normalizeProfileName`, `isProfileNameValid`), sexo de calculadora, último peso y `plannerPrefillFromAnswers`. Commit: `feat: expone prefill del onboarding al dominio`.
- [x] T2 — Onboarding: estado `name`, campo obligatorio en `ProfileStep`, guardado en `meta` + `profile`. Commit: `feat: pide el nombre en el onboarding y rellena el perfil`.
- [x] T3 — Planificador: precarga objetivo/nivel/días/duración. Commit: `feat: precarga el planificador con el onboarding`.
- [x] T4 — Calculadoras: hook `useBodyProfile` + precarga en IMC, Calorías, Grasa y Navy. Commit: `feat: precarga calculadoras con los datos del perfil`.
- [x] T5 — Perfil: tarjeta «Tus datos». Commit: `feat: muestra los datos personales en el perfil`.
- [ ] T6 — CHANGELOG + build + test + review + commit de cierre (sin push).

## Log

- **L1 (2026-10-22, pedido del usuario, verbatim):** «activa multisesion, creo que los datos del onboarding del principio no cargan todos en los datos de la app, tambien se debe agregar en el apartado donde pide la fecha de nacimiento , altura , etc, colocar el nombre para que asi aparezca relleno en perfil».
- **L2 (respuesta a diagnóstico):** «En el planificador, En calculadoras/medidas» y «y perfil».
- **L3 (aprobación de diseño):** «Aprobado, nombre obligatorio (Recomendado)».
- **L4 (aislamiento):** worktree `.worktrees/onboarding-perfil` creado con `scripts\worktree.ps1 open onboarding-perfil`; sesión movida a `.worktrees\onboarding-perfil\gymlab-app`.
- **L5 (diagnóstico verificado):** altura/sexo/fecha de nacimiento sí se persisten en `meta`; el peso en `bodyWeight` de hoy. Faltaba consumirlos: el planificador solo leía `sessionDurationMin`, IMC/Calorías/Navy/Grasa no precargaban sus campos y el perfil no mostraba los datos. El nombre no se pedía en ningún paso.
- **L6 (TDD):** RED observado en `onboarding.test.ts`, `bodyProfile.test.ts` y `profileMeta.test.ts` (funciones aún inexistentes); GREEN con **13/13** tras el dominio.
- **L7 (build):** `npm run build` exit 0 (tsc -b + Vite + PWA).
- **L8 (suite):** `npm test` verde una vez (**165 archivos / 1662 tests**) y luego el test ajeno `SessionJournalSheet.test.tsx` empezó a agotar sus 5 s bajo carga (pasa aislado, 5/5). Re-ejecución acotada `npx vitest run --maxWorkers=4`: **165/165 archivos, 1662/1662 tests**, exit 0. No se tocó ese test.
- **L9 (e2e):** `python tests/e2e/scripts/with_server.py tests/e2e/test_f44.py --port 5220` → **F44 PASSED** en 375×812 y 768×1024: `profileName`/`displayName` = Ana, `/perfil` con «Tus datos» y el nombre, planificador precargado con nivel/objetivo/días/duración. `test_f101_wizard_scroll.py` → **OK** con el campo nuevo. Los 7 e2e que completan el onboarding ahora rellenan «Nombre».
- **L10 (archivos):** dominio `bodyProfile.ts`/`onboarding.ts`/`profileMeta.ts`; hook `useBodyProfile`; onboarding (`OnboardingWizard`, `steps`); planificador; IMC/Calorías/Grasa/Navy; `PerfilPage` + `PersonalDataCard`; i18n es/en; e2e de onboarding; `CHANGELOG.md`.
