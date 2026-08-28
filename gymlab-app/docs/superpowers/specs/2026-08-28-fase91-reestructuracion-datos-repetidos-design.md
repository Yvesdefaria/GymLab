# Fase 91 — Reestructuración: datos repetidos (diseño)

> Fecha: 2026-08-28 · Estado: aprobado · Fuente: auditoría página por página (agosto 2026)

## Contexto

La auditoría detectó que varios datos y patrones de UI se calculan/muestran en varios lugares sin una fuente única: KPIs (racha, volumen semanal, PRs) en home, Perfil y Estadísticas; `StatsGrid` importado muerto en EntrenarPage; progreso de sesión duplicado dentro de la misma home; insight de volumen y deload repetidos en home y Perfil; plantilla de registro corporal (form + upsert diario + gráfico + vacío + disclaimer) copiada en `PesoCorporalPage`, `MedidasCorporalesPage` y `GrasaCorporalPage`; estados vacíos y píldoras de filtro duplicadas; mensaje local-first repetido (MasPage vs AjustesPage); infraestructura de charts paralela (Sparkline/`components/profile/*` vs `stats/chartStyle`+`ChartCard`+`DrillDownPanel`).

## Decisiones

1. **Home = foco del día** (sesión/programa activo); **Perfil = histórico** (historial reciente, insight de volumen, deload).
2. Home: **solo unificar datos, mantener orden visual** — no se rediseñan tarjetas.
3. Componentes compartidos en **carpetas temáticas nuevas**: `components/summary/`, `components/body-log/`, `components/ui/EmptyState` + `components/ui/FilterChips`.

## Paquetes de trabajo

### WP1 — Componentes base compartidos
- `components/ui/EmptyState.tsx` → estados vacíos de perfil, estadísticas, grasa corporal, rutinas, calculadoras, `session.empecemos`, nutrition.
- `components/ui/FilterChips.tsx` → filtros de `RutinasPage`, recientes de `CalculadorasPage`, toggle sexo.
- i18n: clave común de `sinDatos`; un único mensaje local-first.

### WP2 — KPIs con una sola fuente
- `useWorkoutSummary()` derivado de repos (racha, volumen semanal, entrenos totales, PRs, mejor día, frecuencia).
- `components/summary/` con variantes visuales sobre el hook.
- Eliminar `StatsGrid` y las `StatCard`s recomputadas de `EntrenamientoStats`.
- Helper compartido de "último bodyfat" (CuerpoStats + GrasaCorporalPage); "Última categoría:" → i18n.

### WP3 — Home sin duplicados internos
- Progreso de sesión en una sola representación.
- Chip "último peso" enlaza a PesoCorporal.
- Historial/insights/deload se muestran solo en Perfil.

### WP4 — Plantilla de registro corporal
- `components/body-log/BodyLogLayout.tsx` parametrizable (campos, upsert, gráfico).
- Peso, Medidas y Grasa la consumen.

### WP5 — Charts
- Mapa de duplicación de la infra de gráficos; unificar estilos/titulares en un lugar.

## Criterios de éxito
- Cada dato mostrado una sola vez (o una sola fuente de cálculo) en las páginas consolidadas.
- Sin pérdida de funcionalidad visual; orden de tarjetas en home intacto.
- `npx tsc -p tsconfig.app.json --noEmit` + `npm run build` + lint limpios por WP.
- Un commit por WP; CHANGELOG actualizado.