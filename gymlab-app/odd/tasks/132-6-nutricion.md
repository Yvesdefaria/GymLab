# Nutrición y Suplementos — rediseño Nocturno Minimal (F132.6)

Objetivo: migrar `/nutricion` y `/suplementos` al lenguaje Nocturno Minimal con un héroe por pantalla, hairline en vez de tarjetas, objetivo honesto y estados vacíos reales. Rama `132.6-nutricion` (worktree `.worktrees/132.6-nutricion`, multisesión pedida por el usuario). Runner: `vitest` (`npm test`) + `npm run build`; e2e con Playwright Python. Spec: `docs/superpowers/specs/2026-10-25-f132-6-nutricion-design.md`. Mockup aprobado: `.superpowers/brainstorm/132.6-nutricion-20261025/content/nutricion-suplementos-v1.html`.

## Specs

- **S1 — Alcance y navegación.** Solo `/nutricion` y `/suplementos`; no se crean rutas ni cross-links nuevos; el back sigue a `/mas`. Se conservan `NutritionRoute`/`SupplementsRoute`, repositorios, seeds y el cálculo TDEE + pasos (F84e).
- **S2 — Nutrición: héroe honesto.** Anillo de kcal de 142 px con consumido y objetivo. Sin `tdee`, se elimina el default 2.200: anillo neutro, «Sin objetivo diario», explicación y link a `/perfil`. Con objetivo: restantes o exceso, nota de pasos y verde solo al alcanzar la meta; `role="progressbar"` con `aria-label`.
- **S3 — Nutrición: macros.** Proteína, carbos y grasa en tres columnas; gramos + barra de 2 px + `{pct}% de las kcal`. Porcentajes sobre la energía de los macros (`P×4 + C×4 + G×9`), reparto exacto a 100 con mayor resto; sin kcal, «—».
- **S4 — Nutrición: tabs por comida.** Desayuno / Almuerzo / Cena / Snack con subtotal o «—»; el activo filtra la lista y define el destino del alta; `aria-pressed`, 44 px, comida inicial con datos o Desayuno.
- **S5 — Nutrición: lista y vacío.** Filas hairline de 52 px con nombre, gramos, macros, kcal y borrar de 44 px; subtotal y cantidad en el encabezado; vacío honesto sin tarjeta.
- **S6 — Nutrición: alta en sheet.** `BottomSheet` «Agregar a {comida}» con buscador, resultados hairline, gramos, vista previa, CTA y «Alimento desde etiqueta». Queda abierto tras agregar, limpia búsqueda/selección/gramos y confirma «Agregado: {nombre}».
- **S7 — Suplementos: héroe de adherencia.** `{tomados}/{total} tomados`, pendientes y barra de 2 px; `role="progressbar"`; «Todo tomado» en verde; sin activos no se renderiza.
- **S8 — Suplementos: filtros y filas.** Chips neutros Todos/Diario/Pre/Post/Semanal; filas hairline de 60 px con check de 44 px (verde solo tomado), nombre, dosis, frecuencia y borrar; sin badges de color por frecuencia.
- **S9 — Suplementos: alta en sheet.** Header «+» abre `BottomSheet` «Nuevo suplemento» con nombre, dosis y frecuencia segmentada; guardar deshabilitado hasta completar; cancelar no escribe.
- **S10 — Dominio.** `calculateMacroShares` y `todayAdherence` en `domain/nutrition.ts` y `domain/supplements.ts`; no se cambian tipos, seeds ni repositorios. `isCheckedToday` conserva su contrato actual.
- **S11 — i18n.** Todas las cadenas nuevas en es/en; inglés default. Se retiran claves muertas de la UI anterior.
- **S12 — A11y y temas.** Touch ≥ 44 px, foco visible, `aria-pressed`/`aria-label` en tabs, checks, anillos, barras y borrar; noche/día + 6 paletas solo con tokens; sheet con Escape, backdrop y foco inicial.
- **S13 — Tests.** Dominio rojo→verde; tests de componente de héroe, tabs, lista, fila y sheets; e2e nuevo `test_f132_6_nutricion.py` en 375 y 768; actualizar `test_f77.py` y `test_f93_t14_redesign.py` si la UI vieja queda obsoleta.
- **S14 — Documentación y entrega.** `PLAN.md` marca 132.6; `CHANGELOG.md`; `docs/design/README.md`; `NOCTURNO-MINIMAL.md` §22. Commits work-unit, Conventional Commits, review RDD antes de commitear, sin push.

## Tasks

- **T0 — Spec y doc ODD.** `docs/superpowers/specs/2026-10-25-f132-6-nutricion-design.md` + este doc. Estado: hecho. Commit: pendiente.
- **T1 — Dominio + tests.** `calculateMacroShares`, `todayAdherence`; tests rojo→verde. Estado: hecho. Commit: pendiente.
- **T2 — Nutrición UI.** `NutritionHero`, `MealTabs`, `MealList`, `FoodAdder`/`CustomFoodForm` en sheet, `NutritionPage`; i18n; tests de componente. Estado: pendiente.
- **T3 — Suplementos UI.** `SupplementsHero`, `SupplementRow`, `AddSupplementSheet`, `SupplementsPage`; i18n; tests. Estado: pendiente.
- **T4 — E2E.** Nuevo `test_f132_6_nutricion.py`; actualizar e2e obsoletos. Estado: pendiente.
- **T5 — Verificación y review.** `npm test`, `npm run build`, e2e; `gentle-ai review assess` por candidato. Estado: pendiente.
- **T6 — Docs y cierre.** `PLAN.md`, `CHANGELOG.md`, `docs/design/README.md`, `NOCTURNO-MINIMAL.md` §22; evidencia final. Estado: pendiente.

## Log

- **L1 (2026-10-25, pedido del usuario, verbatim):** «actia multisesion, quiero que hagas 132.6 — Nutrición (pendiente), si es necesario usa grillme para preguntas importante, ademas usa mockups para mostrarme el resiultado».
- **L2 (2026-10-25, aprobación del grilling, verbatim):** «dale». Congela Q1–Q5 con las recomendaciones (objetivo honesto, reparto de kcal, tabs filtran una comida, sheet que queda abierto, frecuencia neutra) y autoriza la implementación.
- **L3 (2026-10-25, mockup y spec):** worktree `.worktrees/132.6-nutricion` (rama `132.6-nutricion`, base `3bc868ca`). Mockup v1 con cuatro pantallas y tres estados vacíos en `.superpowers/brainstorm/132.6-nutricion-20261025/content/nutricion-suplementos-v1.html`; spec y este doc creados antes de la primera escritura de código.
