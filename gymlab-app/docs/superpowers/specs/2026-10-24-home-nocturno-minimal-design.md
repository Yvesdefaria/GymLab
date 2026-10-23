# Home «Entrenar» — dirección C (Editorial), Nocturno Minimal

**Fecha:** 2026-10-24
**Rama / worktree:** `home-nocturno` (`.worktrees/home-nocturno/gymlab-app`)
**Estado:** diseño aprobado por el usuario; pendiente implementación.
**Referencia visual:** `.superpowers/brainstorm/home-redesign-20261024/content/home-c-v2.html`

---

## 1. Intención

Rediseñar la home `/` con la estética **Nocturno Minimal** (`docs/design/NOCTURNO-MINIMAL.md`) sin perder la esencia actual: resolver “¿qué entreno hoy?” y dar contexto de semana, progreso y recuperación.

La dirección elegida es **C · Editorial**: conserva la foto del héroe como firma visual, la oscurece y la convierte en el fondo de un héroe de acción. El resto de la pantalla abandona la tarjeta como contenedor por defecto y usa **hairline + aire + círculos**.

Decisiones cerradas con el usuario (2026-10-24):

- Se elige C.
- Se elimina la acción secundaria del header (el `⋯`/hamburguesa era redundante: la navegación vive en el TabBar).
- Se mantiene el **week strip** actual, restilizado.
- **Objetivos sale del home**: la página `/objetivos` ya se ofrece desde el hub `/mas`.
- **Todo bloque sin datos reales no se renderiza.** Sin ceros decorativos, sin “sin datos”.
- El **TabBar no se toca** en esta fase (afecta a toda la app).
- Del journal se conserva **solo el insight** como fila hairline condicional. El recordatorio de “último peso” sale del home (vive en Más > Peso corporal).
- Stat row: **racha · entrenos de esta semana · volumen semanal**.
- La foto del héroe mantiene el comportamiento actual: imagen de la rutina activa; sin rutina, `/images/home-hero.jpg`.

---

## 2. Alcance

### Dentro

- `EntrenarPage` y los componentes usados solo por la home.
- Nuevo héroe editorial, week strip, stat row, rutina de hoy, sección de progreso, recuperación, alertas, comparación mensual, retos, plantillas y atajos.
- Reglas de vacío por widget.
- i18n es/en de todo el copy nuevo.
- Tests unitarios del cálculo semanal y de los estados vacíos.
- Actualización de `CHANGELOG.md` y `PLAN.md` si corresponde.

### Fuera

- TabBar global (queda para otra fase).
- Páginas `/mas`, `/objetivos`, `/estadisticas`, `/calendario`.
- Cambios en el contrato de datos o migraciones.
- Nuevas funcionalidades: esto es una recomposición visual y de jerarquía.

---

## 3. Composición final

Orden de arriba hacia abajo. Cada bloque declara su regla de visibilidad.

| # | Bloque | Contenido | Se muestra si |
|---|--------|-----------|----------------|
| 1 | Header | Fecha larga (kicker) + “Entrenar”. Sin acciones. | Siempre |
| 2 | Héroe editorial | Foto, kicker de estado, nombre del día, grupos, CTA principal, anillo programa/sesión, links “Cambiar día” / “Ver rutina”. | Siempre |
| 3 | Week strip | 7 días con letra, disco y número. | `workouts.length > 0 \|\| program` |
| 4 | Stat row | Racha · Esta semana · Volumen semanal. | `workouts.length > 0` |
| 5 | Rutina de hoy / sesión activa | 3 filas de ejercicios + “Ver la rutina completa”, o progreso de series si hay sesión activa. | `todayDay` con items, o sesión activa |
| 6 | Progreso | Volumen semanal + delta + barras de 5 semanas + meta de PRs/mejor día. | `workouts.length > 0` |
| 7 | Recuperación | Anillo de score + clasificación + último entreno/racha; expandible. | `recoveryScore !== null` |
| 8 | Journal insight | Fila hairline con icono + texto. | Existe insight |
| 9 | Alertas | Deload y estancamientos como filas hairline. | Hay alerta activa |
| 10 | Vs tu yo de hace 1 mes | Selector 1m/3m/6m + 3 métricas (fuerza, volumen, peso). | Hay datos comparables |
| 11 | Retos | Tabs activos/disponibles + filas con progreso. | `getAvailableChallenges(level).length > 0` |
| 12 | Plantillas rápidas | Chips de categorías + filas de templates. | Siempre (los templates son builtin) |
| 13 | Atajos | “Calendario completo” y “Objetivos” como filas. | Siempre |

**Estado sin datos** (`workouts.length === 0`): el héroe conserva su CTA real (“Ver rutinas” o “Empezar en blanco”), debajo aparece **una** nota honesta (“La semana, la racha, el volumen y la recuperación aparecen cuando registrás tu primer entreno”) y quedan plantillas + atajos. Desaparecen week strip, stat row, progreso, recuperación, journal, alertas, comparación y retos.

---

## 4. Anatomía visual

### 4.1 Header

- `AppHeader` con `kicker` = fecha larga capitalizada (`Sábado 24 de octubre`) y `title` = `home.titulo`.
- Sin `subtitle` y sin `actions`.
- Mantiene el borde inferior hairline del componente compartido.

### 4.2 Héroe editorial

- Full-bleed dentro del shell, alto ~340 px, sin radio.
- Foto de fondo con `object-fit: cover`, filtro noche `grayscale(.55) brightness(.48) contrast(1.05)`; en día se aclara y baja opacidad para que el texto oscuro siga legible.
- Velo degradado de arriba hacia abajo hasta `bg`.
- Contenido anclado abajo:
  - Kicker dorado de estado (`Hoy toca`, `Sesión en curso`, `Hoy entrenado`, `Día de descanso`, `Entrenar`).
  - Título Oswald 300, 38–42 px, `text-fg`.
  - Línea de grupos musculares en Barlow 500 11 px, `text-fg/72`.
  - CTA `variant="flat"` de 44–46 px + anillo de 58 px con el porcentaje.
  - Links subrayados tenues “Cambiar día” y “Ver rutina” (solo si aplican).
- Anillo: `ProgressRing` de 58 px, trazo 3.5, texto 13 px Oswald 300. Es el **único** anillo del héroe. Los días del week strip usan discos, no anillos grandes.
- Anclas: `data-tour="home-hero"` en la sección y `data-tour="home-start"` en el contenedor del CTA.

### 4.3 Week strip

- Reemplaza la tarjeta `Panel` + `WeekCalendar` actual.
- 7 columnas, lunes a domingo: letra (Barlow 600 7.5 px, tracking amplio), disco de 30 px, número de día (7.5 px).
- Estados:
  - Entrenado (`done`/`done-scheduled`): disco `bg-success` + `Star` rellena, icono `text-bg`.
  - Hoy sin entrenar: disco con borde 1.5 px `border-cta`, número `text-gold-bright`, halo tenue.
  - Programado futuro: borde hairline, número y letra muted.
  - Descanso/futuro no programado: borde punteado tenue, punto muted.
- El strip entero es un `<Link to="/calendario">` con `aria-label` y `data-tour="home-calendar"`.
- Sin navegación entre semanas.

### 4.4 Stat row

- Grid de 3 columnas con `divide-x divide-border/40`, borde superior e inferior hairline.
- Valor en Oswald 300 24 px `tabular-nums`; label en Barlow 600 7.5 px mayúsculas.
- Racha en `text-fg`; “esta semana” en `text-fg`; volumen con su unidad.

### 4.5 Rutina de hoy

- Section header hairline: “Rutina de hoy” + `N ejercicios`.
- Filas de 48 px: índice en disco dorado tenue, nombre + grupo muscular, `series × reps` a la derecha.
- Máximo 3 filas visibles + link “Ver la rutina completa” hacia `/rutinas/:slug`.
- Si hay sesión activa, la lista se reemplaza por “En esta sesión”: filas con series completadas/total y check verde en las completadas. No se muestra “Cambiar día”.

### 4.6 Progreso

- Section header: “Progreso” + “últimas 5 semanas”.
- Número héroe de sección: volumen de la semana actual en Oswald 300 27 px + unidad muted.
- Delta: `+12% vs semana pasada` en dorado si positivo, muted si neutro; sin rojo (el rojo queda para error).
- Barras CSS de 5 semanas, 74 px de alto, radio superior 6 px, ancho máximo 22 px, semana actual en `gold-bright`; sin grilla ni ejes. `role="img"` + `aria-label` con el resumen.
- Línea meta opcional con `N PRs esta semana · mejor día: jueves` (datos de `buildWeeklySummary`), oculta si no hay.
- Cálculo nuevo en `domain/weeklyVolume.ts` (`buildWeeklyVolumeSeries`), independiente de que la semana actual tenga sesiones: si hay historial, el bloque se muestra.

### 4.7 Recuperación

- Fila hairline con anillo de 52 px y el color semántico de la clasificación.
- Título: clasificación (`Listo para entrenar`). Meta: último entreno + racha.
- Sigue siendo expandible para ver el desglose; el detalle se mantiene en un panel hairline, sin tarjeta.
- Respeta `role`/`aria-expanded` del botón actual.

### 4.8 Journal insight

- Fila hairline: icono en disco tenue, texto del insight.
- Tono: éxito/dorado según el tipo, sin fondo de tarjeta.

### 4.9 Alertas

- Deload: fila con punto dorado, título + descripción corta y chevron si abre detalle.
- Estancamiento: una fila por ejercicio, punto rojo tenue, nombre + semanas + e1RM + sugerencia en una línea muted.
- Si no hay alertas, el componente devuelve `null` (se elimina el empty state actual).

### 4.10 Vs tu yo de hace 1 mes

- Section header: “Vs tu yo de hace 1 mes” + selector compacto 1m/3m/6m como chips.
- Tres columnas: Fuerza %, Volumen %, Peso (si existe). Valor Oswald 300 19 px; cambios positivos en `gold-bright`; negativos en `danger` solo si es un dato de error, no una tendencia (regla del acento único: usar muted para tendencia negativa).
- Si no hay datos comparables, devuelve `null` (se elimina el fallback actual).

### 4.11 Retos

- Header hairline con icono trofeo + “Retos”.
- Tabs compactos `active` / `available` con los conteos.
- Cada reto: fila con icono, título, descripción, progreso `N/M unidad`, chip de duración y barra fina de 3 px.
- Completado: icono/estrella en `success`; el resto en dorado.
- Si no hay retos disponibles, devuelve `null`.

### 4.12 Plantillas rápidas

- Chips de categoría (`Todas`, `Express`, `Estiramiento`, `Movilidad`) con hairline; activo `border-cta/50 bg-cta/10 text-accent-soft`.
- Filas hairline con icono en disco, nombre + descripción + duración/ejercicios, chevron.
- Mantiene el arranque de sesión existente (`startTemplate`).

### 4.13 Atajos

- Dos filas hairline: “Calendario completo” (`/calendario`) y “Objetivos” (`/objetivos`).
- La fila de Objetivos lleva `data-tour="home-goals"` para no romper el tour F101.
- No duplica la proyección de objetivos: solo navegación.

---

## 5. Reglas de vacío (obligatorias)

1. Un widget sin datos **no renderiza**: se elimina la tarjeta, el kicker y el empty state.
2. No se muestran ceros como dato. La única excepción es “0 entrenos esta semana” cuando ya existe historial: es un cero real, no un vacío.
3. Los datos futuros no se pintan como cero: el week strip deja los días futuros vacíos.
4. La nota de “sin progreso todavía” aparece solo cuando `workouts.length === 0`; no repite el mensaje en cada widget.
5. `/objetivos` no se renderiza en home; se llega desde Más y desde el atajo.

---

## 6. Tokens y accesibilidad

- Solo tokens de `src/index.css`: `bg-bg`, `text-fg`, `text-muted`, `border-border/40`, `text-gold`, `text-gold-bright`, `text-success`, `text-danger`, `bg-cta`, `text-on-gold`.
- Números en `font-display` (Oswald) 300 con `tabular-nums`; máximo dos pesos de Oswald por sección.
- Eyebrows en Barlow 600, 9.5–10 px, mayúsculas, tracking 0.18–0.2em.
- Touch targets ≥ 44 px en CTA, links, filas y chips.
- Foco visible con anillo `--color-cta` (el estilo global existente).
- `prefers-reduced-motion`: sin animaciones de entrada nuevas; las existentes se respetan.
- Contraste noche y día; la foto del héroe se adapta por tema.
- Iconos lucide, nunca emoji. Decorativos con `aria-hidden`.
- El week strip es un link con `aria-label`; el anillo usa `role="progressbar"`; las barras usan `role="img"` con resumen.

---

## 7. i18n

Claves nuevas o reutilizadas en `src/i18n/locales/{es,en}/core.ts`:

- `home.estaSemana`, `home.progresoUltimasSemanas`, `home.rutinaDeHoy`, `home.ejerciciosCount`, `home.verRutinaCompleta`, `home.enEstaSesion`, `home.seriesCompletadas`, `home.sinProgresoTitulo`, `home.sinProgresoDetalle`, `home.tambienEnMas`, `home.calendarioCompleto`, `home.programaCorto`, `home.sesionCorto`.
- Reutilizadas: `home.titulo`, `home.hoyToca`, `home.sesionEnCurso`, `home.hoyEntrenado`, `home.diaDeDescanso`, `home.empezarHoy`, `home.entrenarOtraVez`, `home.continuarEntreno`, `home.iniciarEntrenamiento`, `home.verRutinas`, `home.cambiarDia`, `home.verRutina`, `progress.title`, `weekly.*`, `goals.title`, `pastSelf.*`, `challenge.*`, `quickTemplates.*`.

El default del producto sigue siendo inglés; los textos nuevos se agregan en ambos idiomas.

---

## 8. Archivos

### Nuevos

- `src/domain/weeklyVolume.ts` + `tests/unit/domain/weeklyVolume.test.ts`
- `src/components/home/HomeStatRow.tsx`
- `src/components/home/TodayRoutine.tsx`
- `src/components/home/ActiveSessionPreview.tsx`
- `src/components/home/HomeProgress.tsx`
- `src/components/home/HomeMiscLinks.tsx`
- `src/components/home/HomeEmptyNote.tsx`

### Reescritos

- `src/components/home/HeroCard.tsx`
- `src/components/calendar/WeekCalendar.tsx`
- `src/components/home/RecoveryScoreCard.tsx`
- `src/components/insights/JournalInsightCard.tsx`
- `src/components/home/PastSelfView.tsx`
- `src/components/home/PlateauAlerts.tsx`
- `src/components/deload/DeloadBanner.tsx`
- `src/components/challenges/DynamicChallenges.tsx`
- `src/components/quick/QuickTemplates.tsx`
- `src/pages/EntrenarPage.tsx`
- `src/index.css` (clases `.home-hero*`)

### Eliminados del home

- `WeeklySummaryCard` y `ProgressDashboard` (reemplazados por `HomeProgress`). Se eliminan los componentes si no tienen otros usos.
- `GoalProjectionCard` deja de importarse en la home (sigue usándose en `/objetivos`).
- `LastWeightLink` deja de importarse en la home (el archivo puede quedarse para otra superficie).

---

## 9. Verificación

1. `npm run build` (typecheck real).
2. `npm test`.
3. E2E de home: `python tests/e2e/scripts/with_server.py tests/e2e/test_f99_home_layout.py` y `test_pulido_home_mas_ajustes.py`; ajustar solo selectores que dependan del layout viejo.
4. Smoke visual en 390×844 y 844×390, noche y día, con datos y sin datos.
5. Comprobar que el tour sigue vivo: `home-hero`, `home-start`, `home-calendar`, `home-goals`, `home-quick-templates`.
6. Review nativo antes del commit (candidato = workspace).

---

## 10. Riesgos

- **Tour F101:** el paso de Objetivos depende de `data-tour="home-goals"`; se conserva en el atajo.
- **E2E:** tests que asumen `panel-hero`, tarjetas o textos viejos (“Progreso”, “Resumen semanal”) pueden romperse. Se actualizan solo los selectores estructurales, no las expectativas de producto.
- **Foto en tema día:** necesita un velo claro específico para que el texto oscuro siga legible.
- **Sesión activa:** el héroe debe priorizar “Continuar entreno” y ocultar “Cambiar día”; no debe perderse el acceso a la sesión.
- **Datos parciales:** el strip y el stat row se muestran con historial aunque la semana actual tenga 0 sesiones; el delta se oculta si no hay semana previa.
