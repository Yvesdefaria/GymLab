# Home Nocturno Minimal (dirección C · Editorial)

**Objetivo:** rediseñar `/` con la estética Nocturno Minimal conservando la esencia funcional y ocultando todo bloque sin datos.
**Rama / worktree:** `home-nocturno` → `.worktrees/home-nocturno/gymlab-app`.
**Entrega:** commits locales, sin push (convención del repo).
**Runner:** `npm test` (Vitest) + `npm run build` + Playwright Python para e2e.

---

## Specs

### S1 — Header sin acción secundaria

`AppHeader` muestra fecha larga capitalizada como kicker y “Entrenar” como título. Sin subtítulo y sin acciones a la derecha: la navegación vive en el TabBar.
**Aceptación:** no existe botón de menú/`⋯` en el header del home.

### S2 — Héroe editorial

Foto de la rutina activa (`routine.imageUrl`), fallback `/images/routines/default.jpg` con rutina sin foto y `/images/home-hero.jpg` sin rutina. Velo degradado; en tema día se aclara para mantener contraste.
Contenido: kicker de estado, título del día, grupos musculares, CTA principal, anillo de programa/sesión y links “Cambiar día” / “Ver rutina”.
**Aceptación:** los cuatro estados actuales (sesión activa, hoy entrenado, hoy toca, sin plan) conservan su CTA y su copy; “Cambiar día” no aparece con sesión activa.

### S3 — Week strip

7 días (lunes a domingo) con letra, disco y número. Entrenado = disco verde + estrella; hoy = anillo dorado; programado = hairline; descanso/futuro = punteado. El strip enlaza a `/calendario`.
**Aceptación:** se ve con historial o programa; se oculta sin ambos; conserva `data-tour="home-calendar"`.

### S4 — Stat row

Tres columnas: racha actual, entrenos de esta semana, volumen de la semana actual.
**Aceptación:** se muestra con `workouts.length > 0`; se oculta sin historial; los valores usan `tabular-nums`.

### S5 — Rutina de hoy / sesión activa

Con día programado: hasta 3 filas (índice, nombre, grupo, `series × reps`) + “Ver la rutina completa” a `/rutinas/:slug`.
Con sesión activa: “En esta sesión” con series completadas/total y check en las completadas.
**Aceptación:** se oculta sin día con items; con sesión activa no se muestra “Cambiar día”.

### S6 — Progreso semanal

Número de volumen de la semana actual + delta vs semana previa + barras de 5 semanas + meta de PRs/mejor día (si existe).
Cálculo en `domain/weeklyVolume.ts`, independiente de que la semana actual tenga sesiones.
**Aceptación:** con historial de semanas anteriores y 0 sesiones esta semana, el bloque sigue visible; sin historial, se oculta; sin semana previa, no se muestra delta.

### S7 — Recuperación y journal

Recuperación como fila hairline con anillo de 52 px, clasificación, último entreno y racha; conserva el desglose expandible.
Journal insight como fila hairline con icono y texto.
**Aceptación:** ambos se ocultan sin datos.

### S8 — Alertas

Deload y estancamientos como filas hairline. Estancamiento: nombre, semanas, e1RM y sugerencia.
**Aceptación:** sin alertas no se renderiza nada (se elimina el empty state actual).

### S9 — Vs tu yo de hace 1 mes

Selector 1m/3m/6m + tres métricas (fuerza, volumen, peso si existe).
**Aceptación:** se oculta sin datos comparables (se elimina el fallback actual).

### S10 — Retos y plantillas

Retos: header hairline, tabs compactos activos/disponibles, filas con progreso y barra fina. Se oculta si no hay retos disponibles.
Plantillas: chips de categoría + filas hairline; mantiene el arranque de sesión existente.
**Aceptación:** los retos conservan tabs y progreso; las plantillas conservan todas las categorías y templates.

### S11 — Atajos y tour

Filas “Calendario completo” (`/calendario`) y “Objetivos” (`/objetivos`). La fila de Objetivos conserva `data-tour="home-goals"`.
**Aceptación:** el tour F101 sigue encontrando `home-hero`, `home-start`, `home-calendar`, `home-goals` y `home-quick-templates`.

### S12 — Estado sin datos

Con `workouts.length === 0`: héroe con CTA real, una nota honesta (“La semana, la racha, el volumen y la recuperación aparecen cuando registrás tu primer entreno”), plantillas y atajos. Nada de ceros ni empty states por widget.
**Aceptación:** no se renderizan week strip, stat row, progreso, recuperación, journal, alertas, comparación ni retos.

### S13 — Objetivos y peso fuera del home

`GoalProjectionCard` deja de renderizarse en `/` (sigue en `/objetivos`). `LastWeightLink` deja de renderizarse en `/` (vive en Más > Peso corporal).
**Aceptación:** no hay bloque de proyección ni link de peso en el home.

### S14 — i18n, accesibilidad y temas

Todo el copy nuevo en es/en. Touch targets ≥ 44 px, foco visible, `aria-label` en strip/anillo/barras, iconos decorativos `aria-hidden`, `prefers-reduced-motion` respetado. Noche/día y las 6 paletas siguen funcionando.
**Aceptación:** `npm run build` y `npm test` limpios; smoke en 390×844 y 844×390.

---

## Tasks

| ID | Tarea | Specs | Ruta | Estado | Evidencia |
|----|-------|-------|------|--------|-----------|
| T1 | Spec + plan del rediseño | — | inline | pendiente | — |
| T2 | `domain/weeklyVolume.ts` + tests RED→GREEN | S6 | inline | pendiente | — |
| T3 | Héroe editorial + header + week strip | S1, S2, S3 | inline | pendiente | — |
| T4 | Stat row + rutina de hoy + sesión activa + estado sin datos | S4, S5, S12 | inline | pendiente | — |
| T5 | Progreso + recuperación + journal + alertas | S6, S7, S8 | inline | pendiente | — |
| T6 | Comparación + retos + plantillas + atajos | S9, S10, S11 | inline | pendiente | — |
| T7 | Composición de página + i18n + CSS + limpieza | S2–S13 | inline | pendiente | — |
| T8 | Tests de componentes/e2e + changelog + verificación | S1–S14 | inline | pendiente | — |

Regla de commits: un commit work-unit al cerrar la implementación completa (los cambios son interdependientes); el hash se registra al final.

---

## Log

### L1 — Pedido original (verbatim, 2026-10-24)

> activa multisesion, quiero rediseñar la pagina de home siguiendo el  diseño que esta en docs, nocturno, lee son 2 creo, quiero que me muestres mockups de como quedaria, ademas si es necesario usa grill me ,
> el apartado de objetivos ya esta en maspages, ademas las funciones cuando estan sin datos no deberia aparecer, quiero que mantenga la esencia actual pero con el diseño moderno del .md

### L2 — Elección de dirección (verbatim, 2026-10-24)

> me gusta la opcion C , pero veo que todas iienen duplicado la hamburguesa en la esquina superior derecha, es redundante ya que esta en el menu inferior, aparte de eso me gusta mucho la C

Decisión: dirección C. Se elimina la acción secundaria del header.

### L3 — Cierre del grill (verbatim, 2026-10-24)

> todas tus recomendaciones

Decisiones aceptadas: week strip como en v2; solo journal insight (sin recordatorio de peso); stat row racha/esta semana/volumen; TabBar fuera de alcance.

### L4 — Exploración y evidencia

- Docs leídos: `docs/design/README.md`, `docs/design/NOCTURNO-MINIMAL.md` (§10.1 home, §5 componentes, §6 charts).
- Mockups: `.superpowers/brainstorm/home-redesign-20261024/content/home-direcciones-v1.html` y `home-c-v2.html`.
- Tour: `src/i18n/tour.ts` depende de `home-goals`; se conserva el ancla en el atajo.
- Componentes home-only confirmados: HeroCard, WeekCalendar, WeeklySummaryCard, ProgressDashboard, PastSelfView, PlateauAlerts, RecoveryScoreCard, DynamicChallenges, QuickTemplates, LastWeightLink.
- `GoalProjectionCard` también se usa en `/objetivos`; no se elimina el archivo.

### L5 — Próximo paso

Implementar T2–T8, verificar build/test/e2e, review nativo y commit sin push.
