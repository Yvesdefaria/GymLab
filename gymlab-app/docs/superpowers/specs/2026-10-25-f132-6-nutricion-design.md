# F132.6 — Nutrición y Suplementos · Nocturno Minimal

> Rama `132.6-nutricion` (worktree `.worktrees/132.6-nutricion`, multisesión pedida por el usuario).
> Mockup aprobado: `.superpowers/brainstorm/132.6-nutricion-20261025/content/nutricion-suplementos-v1.html`.

## 1. Objetivo

Migrar `/nutricion` y `/suplementos` al lenguaje Nocturno Minimal sin perder funcionalidad ni datos:
un solo héroe por pantalla, secciones hairline, un solo acento semántico, estados vacíos honestos,
i18n es/en y touch targets ≥ 44 px.

## 2. Decisiones cerradas (grilling 2026-10-25)

| # | Decisión | Respuesta |
|---|---|---|
| Q1 | Objetivo calórico ausente | Estado honesto: sin anillo de progreso, «Sin objetivo diario» y salida a Perfil. Se elimina el default `tdee = 2200`. |
| Q2 | Porcentaje de macros | Reparto de las kcal consumidas: `P×4`, `C×4`, `G×9` normalizado a 100 %. No se usan metas de macros inventadas. |
| Q3 | Tabs por comida | Filtran la lista a una sola comida; el tab muestra su subtotal y el alta carga en esa comida. |
| Q4 | Alta de comida | Bottom sheet; después de agregar queda abierto, con búsqueda y selección limpias. |
| Q5 | Suplementos | Frecuencia en texto neutro; verde solo para «tomado»; chips de filtro sin color. |

Defaults asumidos: se mantiene agregar + eliminar (sin edición de gramos ni de tomas), no se agregan
rutas ni cross-links nuevos, el back sigue yendo a `/mas`, y el seed de suplementos no cambia.

## 3. Alcance

- `src/pages/NutritionPage.tsx`, `src/pages/NutritionRoute.tsx`.
- `src/pages/SupplementsPage.tsx`, `src/pages/SupplementsRoute.tsx`.
- `src/components/nutrition/*`, `src/components/supplements/*`.
- `src/domain/nutrition.ts`, `src/domain/supplements.ts`.
- i18n `src/i18n/locales/{es,en}/nutrition.ts`.
- Tests unitarios, de componente y e2e.

Fuera de alcance: modelo de datos, Dexie, seeds, rutas, `/mas`, edición de comidas o suplementos,
metas de macros y cálculo de TDEE distinto al actual (TDEE + pasos, F84e).

## 4. Nutrición — `/nutricion`

### 4.1 Héroe de calorías

- Anillo de 142 px con las kcal consumidas y el objetivo (`tdee` = TDEE + pasos).
- Si hay objetivo: número de kcal consumidas, `de {objetivo} kcal`, línea de contexto con
  `{restantes} kcal disponibles` o `{exceso} kcal por encima` y nota «Objetivo ajustado por tus pasos de hoy».
- El anillo se capa al 100 %; el texto puede superar el objetivo. El color es dorado; verde solo si se
  alcanzó o superó el objetivo, nunca rojo.
- Si no hay objetivo (falta peso, altura o edad): anillo neutro sin progreso, texto «Sin objetivo diario»,
  explicación «Completá tu perfil para calcular tu objetivo.» y link «Ir a Perfil». No se inventa un objetivo.
- `role="progressbar"` con `aria-valuenow`/`aria-valuemax` solo cuando hay objetivo; `aria-label` con el resumen.
- El número se formatea con `formatNumber` según idioma.

### 4.2 Macros

- Tres columnas: Proteína, Carbos, Grasa.
- Cada una: gramos (Oswald 20, una decimal si hace falta), barra de 2 px y `{pct}% de las kcal`.
- Los porcentajes salen de la energía de los macros sobre el total consumido y suman 100 % (mayor resto).
- Sin kcal consumidas: gramos en 0 y porcentajes en «—», sin barras.
- La barra no es la única información: el porcentaje va en texto.

### 4.3 Tabs por comida

- Cuatro tabs: Desayuno, Almuerzo, Cena, Snack, con su subtotal (`604 kcal`) o «—» si no hay comidas.
- Selección por defecto: la primera comida con datos; si el día está vacío, Desayuno.
- El tab activo usa dorado + subrayado de 2 px; `aria-pressed` en cada botón; 44 px mínimo.
- Al cambiar de tab se filtra la lista y el alta apunta a esa comida.

### 4.4 Lista de comidas

- Sección con eyebrow de la comida, subtotal y cantidad de alimentos; acción «Agregar a {comida}».
- Filas hairline de 52 px: nombre del alimento, `{gramos} g · P · C · G`, kcal y botón eliminar de 44 px.
- Una fila por `MealEntry`; si una entrada tiene varios items, se listan debajo del nombre.
- Vacío: «Sin comidas registradas» + «Agregá los alimentos de esta comida.» sin tarjeta.
- El borrado elimina la entrada completa (comportamiento actual).

### 4.5 Alta de comida

- Botón de la sección abre un `BottomSheet` con título «Agregar a {comida}».
- Buscador con icono, resultados hairline (máximo 15), selección con vista previa de macros para los gramos.
- Input de gramos (`DecimalInput`, 44 px) y CTA «Agregar».
- Tras agregar: se conserva el sheet abierto, se limpian búsqueda, selección y gramos, y se muestra
  «Agregado: {nombre}» como confirmación accesible.
- «Alimento desde etiqueta» abre `CustomFoodForm` dentro del mismo sheet; al guardar, el alimento queda
  disponible y se cierra el formulario.
- Cerrar por Escape, backdrop o botón.

### 4.6 Estados

- Sin comidas: tabs con «—», héroe en 0, lista vacía honesta.
- Sin objetivo: héroe honesto; los macros se muestran en gramos y «—».
- Sin resultados de búsqueda: «No se encontraron alimentos».

## 5. Suplementos — `/suplementos`

### 5.1 Héroe de adherencia

- Solo con suplementos activos: `{tomados}` en Oswald 52 + `/ {total} tomados`, línea
  `{pendientes} pendientes · hoy` (o «Todo tomado» en verde) y barra de 2 px.
- `role="progressbar"` con `aria-valuenow`/`aria-valuemax` y `aria-label` con el resumen.
- Sin suplementos activos: no se renderiza el héroe; va el estado vacío.

### 5.2 Filtros

- Chips `Todos / Diario / Pre-entreno / Post-entreno / Semanal` con `FilterChips` neutro.
- «Todos» por defecto, no persistido.
- Si el filtro no tiene filas: «No hay suplementos en esta frecuencia».

### 5.3 Filas

- Hairline de 60 px: check de 44 px, nombre, dosis y frecuencia en eyebrow.
- Check: pendiente = círculo dorado; tomado = círculo verde con check. `aria-pressed` y `aria-label`
  «Tomado hoy».
- Botón eliminar de 44 px con `aria-label` «Eliminar {nombre}».
- Sin badges de color por frecuencia (se elimina la paleta de cuatro colores).
- `data-supplement="{id}"` para e2e.

### 5.4 Alta

- Acción «+» de 44 px en el header abre `BottomSheet` «Nuevo suplemento».
- Campos: nombre, dosis y frecuencia como segmentado de 44 px (Diario / Pre-entreno / Post-entreno / Semanal).
- Guardar deshabilitado hasta nombre y dosis no vacíos; al guardar se agrega y se cierra el sheet.
- Cancelar cierra sin escribir.

### 5.5 Estados

- Sin suplementos: icono píldora, «Sin suplementos», explicación y CTA «Agregar suplemento».
- Filtro vacío: texto plano, sin inventar filas.

## 6. Dominio

- `calculateMacroShares(totals)` → `{ proteinPct, carbsPct, fatPct }`; energía `P×4 + C×4 + G×9`;
  reparto exacto a 100 con mayor resto; todo 0 si no hay energía.
- `todayAdherence(supplements, today?)` → `{ taken, total, pending, ratio }` sobre activos; usa
  `isCheckedToday`.
- `isCheckedToday` conserva su contrato actual (fecha UTC del timestamp) para no cambiar datos
  existentes; el follow-up de zona horaria queda anotado.
- No se cambian tipos, seeds, repositorios ni el cálculo de TDEE.

## 7. i18n

Todas las cadenas nuevas en `es` y `en`, con el inglés como default del producto. Se eliminan las
claves que queden sin uso (`nutrition.dailySummary`, `nutrition.todayMeals` si corresponde) y se
mantienen las que usan tests/otros consumidores.

## 8. Accesibilidad y temas

- Touch ≥ 44 px, foco visible, `aria-pressed` en tabs/checks/segmentados, `aria-label` en anillos,
  barras y acciones de borrar.
- Noche/día y las 6 paletas usando solo tokens (`text-fg`, `text-muted`, `border-border/40`,
  `text-cta`, `text-success`).
- `prefers-reduced-motion`: sin animaciones nuevas obligatorias; las transiciones existentes se mantienen.
- Sheet con foco inicial, Escape y backdrop (patrón `BottomSheet`).

## 9. Tests

- Dominio: `calculateMacroShares` (suma 100, ceros, redondeo) y `todayAdherence` (activos, tomados, vacío).
- Componentes: héroe con/sin objetivo, tabs con subtotales y selección, lista con borrado, héroe de
  suplementos, fila con check y borrado, sheet de alta (guardar deshabilitado / alta).
- E2E: `test_f132_6_nutricion.py` en 375 y 768; estados vacíos, alta de comida, tabs, borrado,
  sin objetivo, suplementos con seed, check, filtro, alta y borrado; 0 `pageerror`.
- Actualizar los e2e que asumen la UI anterior (`test_f77.py`, `test_f93_t14_redesign.py` si aplica).

## 10. Documentación y entrega

- `PLAN.md` marca 132.6; `CHANGELOG.md` con la entrada; `docs/design/README.md` actualiza estado;
  `NOCTURNO-MINIMAL.md` §22 con anatomía, archivos y follow-ups.
- Commits work-unit por pantalla y cierre, Conventional Commits, sin push.
- Review RDD antes de commitear cada candidato; si `review_due` es true, seguir el ciclo nativo.

## 11. Criterios de aceptación

- `/nutricion` y `/suplementos` no muestran tarjetas 2×2, badges de cuatro colores ni objetivos inventados.
- Agregar/eliminar comidas y suplementos sigue funcionando y persiste en Dexie.
- Tabs, filtros, sheets y estados vacíos son accesibles y están en es/en.
- `npm test`, `npm run build` y el e2e nuevo pasan; los e2e actualizados no agregan fallos.
- `PLAN.md`, `CHANGELOG.md`, `docs/design/README.md` y `NOCTURNO-MINIMAL.md` quedan al día.
