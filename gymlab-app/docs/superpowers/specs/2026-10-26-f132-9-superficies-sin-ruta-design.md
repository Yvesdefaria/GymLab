# F132.9 — Superficies sin ruta (onboarding, modal de logros y tour) · diseño

- **Fecha:** 2026-10-26
- **Rama:** `132.9-superficies` (worktree `.worktrees/132.9-superficies`; multisesión pedida por el usuario).
- **Origen:** `PLAN.md` §132.9 + pedido del usuario: «activa multisesion, quiero hacer 132.9 — Superficies sin ruta (decidir alcance), usa grillme si tienes dudas sobre algo y usa mockups con al menos 3 opciones por diseño para ver como quedaria».
- **Decisión del usuario (verbatim):** «B/A/A , repetir el onboarding deberia aparecer en ajustes».
- **Aclaración del usuario (verbatim):** «el onboarding no se repite, es el tour el que lo hace». Por eso el replay del onboarding queda **fuera de alcance**; la repetición del tour ya existe en Ajustes («Volver a ver el tour») y solo se revalida.
- **Mockup de referencia:** `.superpowers/brainstorm/132.9-superficies-20261026/content/01-superficies-direcciones.html` (pestañas 01 Onboarding · 02 Modal de logros · 03 Tour).
- **Runner:** `vitest` (`npm test`) + `npm run build`; e2e con Playwright Python (`tests/e2e/scripts/with_server.py`).

---

## 1. Objetivo

Cerrar las tres superficies que quedaron fuera de ruta en la migración a Nocturno Minimal:

1. **Onboarding** — migrarlo al lenguaje C1 y partirlo en una decisión por pantalla (7 pasos).
2. **Modal global de logros** — sacarle el panel redondeado y alinearlo con la celebración editorial.
3. **Tour guiado** — restyling hairline del globo, sin tocar anclas ni los 13 pasos.

Además, se revalida la repetición del **tour** desde Ajustes: la fila «Volver a ver el tour» ya existe en `HelpSection` y sigue siendo el único replay. El onboarding **no** se repite.

**Fuera de alcance:** el resumen post-entreno y los sheets globales ya se rediseñaron con su pantalla dueña (F132.2, F132.6, F132.8); en esta fase solo se revalidan. No se reabre `/logros` (la galería ya está migrada), no se toca el catálogo de logros y no se agregan pasos nuevos al tour.

---

## 2. Decisiones aprobadas

| Superficie | Opción | Qué implica |
|---|---|---|
| Onboarding | **B — una decisión por pantalla** | 7 pasos, opciones como filas hairline, progreso en puntos, CTA fija. |
| Modal de logros | **A — celebración contenida** | Sin tarjeta: dos hairline doradas, medalla 88 px, cola en puntos, un botón. |
| Tour | **A — globo hairline** | Misma posición y anclas; eyebrow con paso + línea, cuerpo Barlow y acciones separadas. |
| Ajustes | **Sin fila nueva** | El onboarding no se repite; «Volver a ver el tour» ya existe y se revalida. |

---

## 3. Onboarding

### 3.1 Flujo de 7 pasos

| # | Paso | Componente | Contenido | `canNext` |
|---|---|---|---|---|
| 1 | Idioma | `LanguageStep` | Español / English | `language !== null` |
| 2 | Objetivo | `ObjectiveStep` | Objetivo (5) + nivel (3) | `objective !== null` |
| 3 | Días | `DaysStep` | 2 / 3 / 4 / 5 días | `daysPerWeek !== null` |
| 4 | Sesión | `SessionStep` | Duración (30/45/60/90) + cardio (0–3) + equipamiento (presets + chips) | siempre (los defaults son válidos) |
| 5 | Identidad | `IdentityStep` | Nombre + unidades (kg/lb) + sexo | `isProfileNameValid(name) && sex !== null` |
| 6 | Medidas | `MeasurementsStep` | Fecha de nacimiento + altura + peso | `isBirthDateValid && altura válida && peso válido` |
| 7 | Resumen | `SummaryStep` | Plan + intereses + términos (primera vez) / nota + guardar (replay) | primera vez: `acceptedTerms && hasPlannedDays(plan)`; replay: siempre |

El orden replica el flujo actual para no perder datos: idioma primero, objetivo/nivel, semana, perfil y resumen. La diferencia es que Semana se parte en **Días** y **Sesión**, y Perfil se parte en **Identidad** y **Medidas**.

### 3.2 Shell visual (Nocturno Minimal)

- **Pantalla completa**, no diálogo centrado: `fixed inset-0 z-[100] flex flex-col bg-bg`.
- Contenedor interno `mx-auto w-full max-w-md px-5`.
- El contenedor raíz conserva `role="dialog" aria-modal="true"` con `aria-label={t('onboarding.registroAria')}` (constante «Configuración inicial») para no depender del paso. El scroller interno lleva `data-testid="onboarding-scroller"`.
- **Barra superior de 48 px**:
  - Izquierda: wordmark `GymLab` (Oswald 600, 13 px, tracking 0.2em, `text-cta`) en el paso 1; `← Atrás` (44 px, `text-muted`) en los pasos 2–7.
  - Derecha: `Ya entreno aquí` en el paso 1 de la primera vez; `Cerrar` (X) en replay; vacío en los pasos 2–7 de la primera vez.
- **Progreso**: 7 puntos de 6 px; los pasados en `bg-cta`, el actual en una píldora de 18 px, los futuros en `bg-border/60`; a la derecha `PASO N DE 7` (10 px, `text-muted`, tabular). El contenedor lleva `aria-label={t('onboarding.progresoAria')}`.
- **Pregunta**: `font-display text-3xl font-light` (Oswald 300, 30 px), una línea de contexto en `text-sm text-muted`.
- **Opciones**: filas hairline de 56 px (`border-b border-border/30`), radio de 19 px; seleccionada: borde del radio dorado, punto dorado, texto `text-fg`; no seleccionada: radio `border-border`, texto `text-fg/90`. Sin chips de colores ni tarjetas. Para multiselección (intereses) se conservan chips hairline.
- **CTA fija**: fuera del scroller, al pie, `min-h-[52px] rounded-xl bg-cta text-on-gold` con `font-display font-semibold`; deshabilitada con `opacity-40`.
- **Scroller**: el cuerpo entre la barra y la CTA (`flex-1 overflow-y-auto overscroll-contain`), con `pb-4`. El scroller debe aceptar gesto/wheel (el bug de `pointer-events-none` de F101 no vuelve).
- **Sin `panel`**, sin `rounded-3xl`, sin fondo `bg-bg-soft` en el contenedor principal.
- **Reduced motion**: el slide entre pasos se mantiene, pero con `prefers-reduced-motion` se salta la animación y se cambia el paso directo.

### 3.3 Paso 2 — Objetivo y nivel

- Hero: `¿Cuál es tu objetivo?`; subtítulo: `Elige uno para empezar. Podrás cambiarlo después.`
- Objetivo: 5 filas hairline (Fuerza, Ganar masa, Definirme, Resistencia, General).
- Nivel: eyebrow `Tu nivel` + 3 filas hairline compactas (Principiante, Intermedio, Avanzado).
- Es la única pantalla con dos decisiones; se mantiene así para no inflar el flujo a 9 pasos. La copia y el orden no cambian.

### 3.4 Paso 3 — Días

- Hero: `¿Cuántos días puedes entrenar?`; subtítulo: `Elige una opción. Podrás cambiarla en Ajustes.`
- Filas: `2 días`, `3 días` (hint `Recomendado para empezar`), `4 días` (hint `Equilibrio`), `5 días`.
- Mantiene el `daysPerWeek` numérico actual.

### 3.5 Paso 4 — Sesión

- Hero: `¿Cómo son tus sesiones?`; subtítulo: `Duración, cardio extra y equipamiento.`
- **Duración**: segmented de 4 celdas (30/45/60/90) con 44 px de alto, seleccionada con borde dorado.
- **Cardio extra**: segmented de 4 celdas (0/1/2/3).
- **Equipamiento**: 2×2 tiles hairline de 58 px (Gimnasio / Mancuernas en casa / Solo peso corporal / Lo que sea) con una línea de detalle; seleccionar un preset siembra `equipmentStore` con `MATERIAL_PRESETS` (una sola fuente de verdad). Debajo, `EquipmentFilter` con sus chips para afinar.
- No se agrega validación nueva: el equipamiento puede quedar vacío y el planificador ya lo maneja.

### 3.6 Paso 5 — Identidad

- Hero: `¿Cómo te llamas?`; subtítulo: `Así te saludamos y ajustamos las unidades.`
- Input de nombre (44 px, borde inferior hairline, `maxLength={NAME_MAX_LENGTH}`, `autoComplete="name"`).
- Unidades: segmented kg/lb; al cambiar se convierte el peso ya tecleado (misma lógica `switchUnits` actual).
- Sexo: segmented Hombre/Mujer.
- `canNext`: nombre válido y sexo elegido.

### 3.7 Paso 6 — Medidas

- Hero: `Tus medidas`; subtítulo: `Datos para tus métricas y calculadoras.`
- Fecha de nacimiento (input date, máx. hoy), altura (cm) y peso (unidad elegida); errores inline con `role="alert"` y los mismos rangos `HEIGHT_RANGE` / `WEIGHT_RANGE`.
- `canNext`: fecha válida, altura y peso dentro de rango.

### 3.8 Paso 7 — Resumen

- Hero `Tu plan está listo`, subtítulo `Te sugerimos esta rutina para empezar:`.
- Bloque del plan: eyebrow `Tu plan`, título del plan en Oswald, nota `Generado para tu equipamiento` / `Basado en una rutina existente`, `PlanPreview` (ya es hairline) y `PlanCoverageNote`.
- Intereses: chips hairline multiselección.
- Términos: checkbox + `Trans` actual; aviso de telemetría.
- CTA primaria `Empezar D1` (crea rutina propia + programa activo, como hoy); secundaria `Ya entreno aquí` (sin rutina).
- Sin variante de replay: el onboarding se muestra una sola vez. La repetición que existe es la del **tour**, desde Ajustes.

### 3.9 Persistencia (sin cambios de contrato)

Se conservan `ONBOARDING_ANSWERS_META_KEY`, `HEIGHT_KEY`, `BODY_SEX_KEY`, `BIRTH_DATE_KEY`, `PROFILE_NAME_KEY`, `profileRepo.update`, `bodyWeightRepo.upsert`, `settings` (unidades/idioma), `routineRepo.createRoutine` y `activeProgramRepo.set` con el mismo comportamiento del primer arranque.

---

## 4. Modal de logros (A)

### 4.1 Estructura

- Mantiene `role="dialog"`, `aria-modal="true"`, `aria-labelledby="achievement-modal-title"`, `useCloseOnEscape(advance)` y el foco inicial en la acción primaria.
- Backdrop: `bg-black/70 backdrop-blur-[2px]`; clic fuera avanza la cola.
- Contenido: `relative w-full max-w-sm border-y border-gold/30 py-7 text-center` — **sin** `rounded-2xl`, **sin** `bg-bg-soft`, **sin** `shadow-2xl`.
- Eyebrow `Logro desbloqueado` (`achievements.unlocked`) en `kicker text-cta`.
- Medalla centrada de **88 px** (`AchievementMedal` gana `size="lg"`: anillo 88, centro 64, icono 32).
- Título `font-display text-3xl font-light` (Oswald 300).
- Descripción `text-sm text-muted`.
- Variante nueva: badge actual `data-new-variant` (se conserva).
- Cola: solo si `total > 1`; `data-queue-progress` con puntos + `{{current}} de {{total}}`. El test unitario espera `1 de 2`.
- Botón primario `¡Genial!` (`achievements.genial`), `w-full`, `min-h-11`, `Button` primary.
- Confeti: **12 piezas** (`MODAL_CONFETTI_PIECES = 12`), no 28; colores actuales; `prefers-reduced-motion` deja las piezas estáticas con opacidad 0.35. El `pulse` de la medalla se mantiene y se pausa en cleanup.

### 4.2 Lo que no cambia

Cola secuencial, `advance`, haptics, `counts`, `newGranted`, `AchievementsHost` (incluida la regla de no competir con el tour), el contrato `data-achievement` y los textos i18n existentes.

---

## 5. Tour (A)

- Se conserva `TourOverlay` completo: pasos, rutas, anclas `data-tour`, navegación, foco, `useTourAnchor`, spotlight y `endTour`.
- Globo:
  - `bg-bg-soft/95`, `border border-border/70`, `rounded-xl`, `p-3.5`, `shadow-2xl`; sin `panel`.
  - Fila superior: `Paso` (eyebrow 9 px, `text-cta`) + línea de 1 px `bg-gold/25` + `{{current}} / {{total}}` (10 px, `text-muted`, tabular). El texto `1 / 13` se mantiene para el e2e.
  - Cuerpo: `text-sm leading-relaxed text-fg`.
  - Pie: `Saltar tour` a la izquierda (44 px, subrayado, `text-muted`); a la derecha `Anterior` (outline, si `stepIndex > 0`) y `Siguiente`/`Finalizar` (primary).
- El ancho sigue siendo `min(20rem, 100vw - 2rem)`; `BUBBLE_EST_HEIGHT` puede bajar a 190 si la geometría lo permite, pero no es obligatorio.
- `data-testid="tour-spotlight"` y el `outline` dorado se conservan.

---

## 6. i18n (es/en)

Claves nuevas o cambiadas (es; en con la misma estructura):

- `onboarding.paso`: `Paso {{current}} de {{total}}` (o `stepLabel`).
- `onboarding.registroAria`: `Configuración inicial`.
- `onboarding.stepDias`: `Días`; `stepSesion`: `Sesión`; `stepIdentidad`: `Identidad`; `stepMedidas`: `Medidas`.
- `onboarding.diasTitulo`: `¿Cuántos días puedes entrenar?`; `diasDescripcion`: `Elige una opción. Podrás cambiarla en Ajustes.`
- `onboarding.diasRecomendado`: `Recomendado para empezar`; `diasEquilibrio`: `Equilibrio`.
- `onboarding.sesionTitulo`: `¿Cómo son tus sesiones?`; `sesionDescripcion`: `Duración, cardio extra y equipamiento.`
- `onboarding.identidadTitulo`: `¿Cómo te llamas?`; `identidadDescripcion`: `Así te saludamos y ajustamos las unidades.`
- `onboarding.medidasTitulo`: `Tus medidas`; `medidasDescripcion`: `Datos para tus métricas y calculadoras.`
- `onboarding.objetivoTitulo` cambia a `¿Cuál es tu objetivo?`; `objetivoDescripcion` a `Elige uno para empezar. Podrás cambiarlo después.`
- `tour.ui.stepLabel`: `Paso`.

Regla del repo: `es` es la fuente tipada (`EsSchema`); `en` se agrega con las mismas claves. El default del producto sigue siendo inglés.

---

## 7. Accesibilidad

- Touch targets ≥ 44 px en filas, radios, CTA, back, cerrar y segmented.
- Foco visible en inputs y botones; el wizard enfoca el hero al cambiar de paso (o el primer control) y devuelve el foco al cerrar el replay (al botón de Ajustes).
- Las filas de selección usan `role="group"` + botones con `aria-pressed` (mismo patrón que los chips del repo); los chips multiselección también usan `aria-pressed`.
- El modal mantiene foco inicial y `Escape`; el tour mantiene `aria-live` en el globo y `aria-modal`.
- `prefers-reduced-motion`: sin slide de pasos, confeti estático, sin pulse de medalla.
- Imágenes/iconos con `aria-hidden` cuando son decorativos.

---

## 8. Pruebas

### Unitarias

- `tests/unit/domain/achievementModal.test.ts`: sigue verde; agregar un caso que verifique la clase del contenedor sin `rounded` y el `kicker` de desbloqueo (si se agrega).
- Ajustar `tests/unit/hooks/f120DataSharing.test.ts` si el gate cambia de forma (sigue leyendo `useOnboardingStatus` y montando `OnboardingWizard`; el gate no cambia).

### E2E (Playwright Python)

- **Actualizar** `test_f101_tour_autostart.py` y `test_f127_tour_logros.py` al flujo de 7 pasos (nuevos `Continuar` entre días/sesión/identidad/medidas; las filas de días ahora se llaman `3 días`/`4 días`, no `3`/`4`).
- **Actualizar** `test_f101_wizard_scroll.py`: nuevo selector del scroller (`[data-testid="onboarding-scroller"]`) y el flujo de 7 pasos; el resumen debe seguir desbordando 360×640.
- **Nuevo** `test_132_9_superficies.py`:
  - Tour: seed `onboardingDone`, `tourPending=true`, `tourDone=false`; abrir Home; el globo muestra `1 / 13` y el eyebrow `Paso`; el spotlight existe; «Volver a ver el tour» en `/ajustes` lo reabre.
  - Modal de logros: el e2e existente de F105/F127 ya lo cubre; si se agrega un escenario, validar `data-queue-progress`.
- **Regresión visual**: 375 px y 768 px; 0 `pageerror`; `prefers-reduced-motion` en una pasada.

### Verificación obligatoria

- `npm run build` limpio (typecheck real).
- `npm test` verde.
- E2E nuevo + los tres actualizados.
- Revisión visual en el navegador (mockup vs implementación).
- `gentle-ai review assess` sobre el diff; el switch RDD lo decide el usuario. Review nativo antes de commit.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El flujo de 7 pasos rompe e2e históricos | Se actualizan los tres e2e afectados en el mismo candidato; el orden de campos se conserva. |
| El modal pierde el contrato de foco/aria | Se conservan `role`, `aria-labelledby`, `Escape`, foco inicial y `data-queue-progress`. |
| El globo del tour tapa el ancla en pantallas chicas | Se mantiene la lógica actual de clamp/arriba-abajo; el e2e de geometría sigue midiendo. |
| Más scroll en el resumen | El resumen es el único paso largo; el scroller y la CTA fija ya se prueban en 360×640. |
| El wizard full-screen tapa la app en el primer arranque | Es el comportamiento esperado; el gate sigue saliendo con `done` o con workouts, y la CTA de escape del paso 1 se conserva. |

---

## 10. Entrega

- Un work-unit commit por superficie (onboarding, modal, tour, docs) o el corte mínimo que permita review independiente; commits convencionales, sin push.
- Actualizar `PLAN.md` §132.9, `CHANGELOG.md` [Unreleased], `docs/design/README.md` y `NOCTURNO-MINIMAL.md` §24.
- Task ODD: `odd/tasks/132-9-superficies-sin-ruta.md` con `L1` (pedido original), `L2` (decisión B/A/A) y `L3` (aclaración: el onboarding no se repite; el tour sí).
- Cierre: build + suite + e2e + review nativo; worktree listo para rebase/merge cuando el usuario lo pida.
