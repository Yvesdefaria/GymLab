# Hub «Más» — rediseño Nocturno Minimal (dirección A)

**Fecha:** 2026-10-23
**Estado:** diseño aprobado en chat y mockup; pendiente de congelar para plan.
**Mockup de referencia:** `.superpowers/brainstorm/mas-redesign-20261023/content/mas-a-v2.html`
**Pantalla:** `src/pages/MasPage.tsx` → ruta `/mas`
**Base:** `main` (`eed5f05a`), rama `mas-redesign`

---

## 1. Intención

Hoy `/mas` es un índice plano de 14 enlaces con dos vistas alternables (rejilla 3×N y lista) que
duplican la superficie de diseño. No tiene héroe, no tiene jerarquía y no dice nada del usuario:
es una pared de tarjetas.

El rediseño lo convierte en un **índice agrupado con bloque de cuenta**: una sola vista, un bloque
de identidad arriba —el lugar donde después entra la cuenta real con backend— y el resto ordenado
por dominio, con hairline en vez de tarjetas.

Además cierra tres huecos de navegación detectados al mapear la pantalla:

1. **`/timer` no tiene ningún enlace en toda la app.** El timer avanzado (Tabata, EMOM, AMRAP,
   For Time, Custom) solo se alcanza escribiendo la URL.
2. **`/objetivos` solo se alcanza desde la tarjeta de proyecciones del home.** No pasa por el hub.
3. **`/calculadoras` solo se alcanza desde el hub.** Sus 6 apariciones como enlace son `BackLink`
   de las calculadoras hacia el hub, no entradas. Si se quita esa fila, todo el hub de calculadoras
   queda huérfano. **Por eso Calculadoras se queda.**

---

## 2. Alcance

### Dentro

- Reescribir `MasPage` con la composición de la dirección A.
- Eliminar el toggle rejilla/lista y la preferencia `hubLayout`.
- Agregar filas a `/objetivos`, `/timer`, `/calculadoras/medidas` y `/calculadoras/agua`.
- Agregar el bloque de cuenta (avatar + nombre + plan activo) como héroe y acceso a `/perfil`.
- Mantener `Papers` fuera del hub (hoy ya no está; no se reintroduce).
- i18n es/en de todas las claves nuevas; retirar las de la vista alterna.
- Actualizar los e2e que dependen del toggle, de la grilla y de la fila «Perfil e historial».

### Fuera (non-goals)

- No se toca el router, ni `Papers`, ni el diseño interno de `/timer` o `/objetivos`.
- No se agrega backend, cuenta real, login ni avatar remoto.
- No se toca `AppHeader`, `TabBar` ni los tokens globales.
- No se migran los ajustes guardados de usuarios existentes.
- No se rediseñan las pantallas destino.

### Anti-goals

- Convertir `/mas` en un panel de estadísticas que compita con Entrenar o Estadísticas.
- Reintroducir tarjetas 2×2, sombras, glows o más de un acento semántico.
- Inventar datos (racha, progreso, ceros) cuando no hay historial.
- Dejar una sección de una sola fila como «Sistema».

---

## 3. La pantalla

### 3.1 Anatomía (de arriba a abajo)

1. **Header** — `AppHeader` existente con `kicker={t('mas.cuenta')}` y `title={t('mas.titulo')}`.
   Sin subtítulo, sin acciones. No se forkea el header: la página se ve como el resto de la app.
2. **Bloque de cuenta** — enlace completo a `/perfil`, `min-h` 76 px, con hairline inferior.
3. **Nav del hub** — `<nav data-tour="mas-links" aria-label={t('mas.titulo')}>` con 4 secciones.
4. **Fila final de Ajustes** — dentro del `<nav>`, después de las secciones, con divisor más fuerte.
   Queda adentro para que el paso 13 del tour siga cubriendo todo el índice.
5. **TabBar** — sin cambios.

### 3.2 Bloque de cuenta (héroe)

| Elemento | Regla |
|---|---|
| Avatar | 54 px, círculo, `border-gold/30`, `bg-gold/10`. Si hay `avatarUri`, imagen (`object-cover`); si no, inicial del nombre en Oswald 300 21 px `gold-bright`; si tampoco hay nombre, icono lucide `User` 20 px. |
| Nombre | Oswald 400 19 px, `text-fg`, `truncate`. Si `profileName` está vacío: `t('mas.sinNombre')` («Tu cuenta»). |
| Línea de contexto | Barlow 400 9.5 px, `text-muted`, `truncate`, una sola línea. |
| Chevron | 16 px, `text-muted/55`, `aria-hidden`. |

**Regla de la línea de contexto, en orden:**

1. Si hay plan de periodización activo: `{plan.name} · {t('mas.semana', { n: getCurrentWeek(plan, now), total: plan.totalWeeks })}`
   → «Plan Volumen · semana 4 de 8».
2. Si no hay periodización pero hay programa activo con rutina: `routine.name`.
3. Si no hay ninguno: `t('mas.verPerfil')`.

`getCurrentWeek(plan, new Date().toISOString())` es la función existente de
`src/domain/periodization.ts`; la fecha se calcula una vez por render.

### 3.3 Secciones y filas

Cada sección: `<section aria-labelledby>` con `<h2>` eyebrow (Barlow 600 9.5 px, mayúsculas,
`tracking-[0.19em]`, `text-muted`), contador a la derecha (`aria-hidden`, decorativo) y una lista
de filas separadas por `border-t border-border/40` (la primera fila sin borde).

**Fila:** `<Link>` de ancho completo, `min-h` 53 px, `gap` 11 px:
- disco de 33 px con `bg-gold/10` y el icono lucide de 15 px en `text-gold`;
- título Barlow 500 12.5 px `text-fg`;
- subtítulo Barlow 400 9.5 px `text-muted`, una línea;
- chevron 15 px `text-muted/55`;
- iconos y chevron con `aria-hidden`.

Las 8 primeras filas conservan `stagger-fade stagger-fade-1..8` (la clase ya respeta
`prefers-reduced-motion`). El resto entra sin animación.

La primera sección **no dibuja `border-t`**: el divisor lo aporta el `border-b` del bloque de
cuenta. Cada fila posterior sí lleva su hairline superior, y la primera fila de cada sección no.

#### Actividad (6)

| Etiqueta | Ruta | Icono lucide | Subtítulo |
|---|---|---|---|
| Calendario | `/calendario` | `CalendarDays` | Días entrenados y programados |
| Pasos | `/pasos` | `Footprints` | Contador diario, rachas y logros |
| Logros | `/logros` | `Trophy` | Medallas y conquistas |
| Wearables | `/wearables` | `Watch` | Apple Watch, Garmin, Fitbit |
| Objetivos | `/objetivos` | `Target` | Metas de fuerza y proyección |
| Timer | `/timer` | `Timer` | Tabata, EMOM, AMRAP y custom |

#### Cuerpo (4)

| Etiqueta | Ruta | Icono lucide | Subtítulo |
|---|---|---|---|
| Peso corporal | `/peso-corporal` | `Scale` | Registro diario y evolución |
| Cuerpo y fatiga | `/cuerpo` | `Activity` | Mapa muscular y recuperación |
| Medidas corporales | `/calculadoras/medidas` | `Ruler` | Cintura, cadera y ratios |
| Fotos de progreso | `/progreso-fotos` | `Camera` | Evolución visual |

#### Nutrición (3)

| Etiqueta | Ruta | Icono lucide | Subtítulo |
|---|---|---|---|
| Nutrición | `/nutricion` | `UtensilsCrossed` | Comidas y macros del día |
| Suplementos | `/suplementos` | `Pill` | Creatina, proteína y más |
| Agua diaria | `/calculadoras/agua` | `Droplets` | Hidratación diaria |

#### Aprender (3)

| Etiqueta | Ruta | Icono lucide | Subtítulo |
|---|---|---|---|
| Biblioteca de ejercicios | `/ejercicios` | `BookOpen` | Técnica y grupos musculares |
| Guías | `/guias` | `BookMarked` | Nutrición, macros y recuperación |
| Calculadoras | `/calculadoras` | `Calculator` | IMC, calorías, 1RM y más |

> **Corrección al mockup:** la v2 había dejado afuera «Calculadoras». Es el único acceso de
> navegación a ese hub (sus 6 enlaces son `BackLink` internos), así que vuelve, en Aprender.
> Total final: **17 filas + bloque de cuenta**.

#### Fila final

| Etiqueta | Ruta | Icono | Subtítulo |
|---|---|---|---|
| Ajustes | `/ajustes` | `Settings` | Tema, unidades, privacidad y cuenta |

Va después de un `border-t border-border/70` (más marcado que las hairlines internas), sin `<h2>`
y sin contador: cierra la página sin abrir una sección de una sola fila.

### 3.4 Qué NO aparece

- `Papers` — la ruta existe, el hub no la publica.
- `Calculadoras/IMC`, `/calorias`, `/1rm`, `/conversor`, `/grasa`, `/navy` — viven dentro del hub
  de Calculadoras. Solo «Agua» y «Medidas» tienen fila propia por uso frecuente.
- `Términos`, `Privacidad` — viven dentro de Ajustes.
- `Rutinas`, `Planificador` — tab propia.

---

## 4. Decisiones tomadas (no reabrir sin pedido)

1. **Una sola vista.** Se elimina el toggle y `settings.hubLayout`.
2. **Cuenta como héroe.** Sin anillo, sin segunda métrica: es identidad, no estadística.
3. **Actividad absorbe Objetivos y Timer.** No se crea una sección «Herramientas».
4. **Ajustes como fila final**, sin sección propia.
5. **Calculadoras se queda** (corrección de la v2, ver §3.3).
6. **`data-tour="mas-links"` se conserva** en el `<nav>`: el paso 13 del tour depende de esa ancla
   (`src/i18n/tour.ts:44`).
7. **Sin migración de ajustes.** `hubLayout` se quita del tipo y del default; el valor guardado en
   `meta.settings` queda como propiedad ignorada. No se reescribe el registro.

---

## 5. Estados

| Caso | Comportamiento |
|---|---|
| Sin nombre | «Tu cuenta» + icono `User` |
| Con nombre, sin avatar | Inicial en mayúscula del primer carácter |
| Con avatar | `<img>` con `object-cover`, `alt=""` (decorativo) |
| Sin plan ni programa | Línea de contexto: «Ver perfil» |
| Plan de periodización activo | `{plan.name} · semana N de M` |
| Programa activo sin periodización | Nombre de la rutina |
| Nombre muy largo | `truncate` en las dos líneas |

No hay estados de carga visibles: los hooks (`useProfileName`, `useAvatar`, `useActiveProgram`,
`usePeriodization`) resuelven con `undefined` y la UI cae al fallback. No se muestran skeletons.

---

## 6. i18n

Todas las claves van en `src/i18n/locales/{es,en}/core.ts`, dentro de `mas`. El tipo `EsSchema`
obliga a mantener es/en en espejo.

### Nuevas

| Clave | es | en |
|---|---|---|
| `mas.cuenta` | Tu cuenta | Your account |
| `mas.sinNombre` | Tu cuenta | Your account |
| `mas.verPerfil` | Ver perfil | View profile |
| `mas.semana` | semana {{n}} de {{total}} | week {{n}} of {{total}} |
| `mas.secActividad` | Actividad | Activity |
| `mas.secCuerpo` | Cuerpo | Body |
| `mas.secNutricion` | Nutrición | Nutrition |
| `mas.secAprender` | Aprender | Learn |
| `mas.linkObjetivosDesc` | Metas de fuerza y proyección | Strength goals and projection |
| `mas.linkTimerDesc` | Tabata, EMOM, AMRAP y custom | Tabata, EMOM, AMRAP and custom |
| `mas.linkMedidasDesc` | Cintura, cadera y ratios | Waist, hip and ratios |
| `mas.linkAguaDesc` | Hidratación diaria | Daily hydration |

**Etiquetas: no se duplican.** Los cuatro destinos nuevos ya tienen nombre en su propia pantalla y
el hub **reutiliza** esas claves, para que el nombre no derive entre superficies:

| Fila | Clave de etiqueta | Valor actual |
|---|---|---|
| Objetivos | `goals.title` (`stats.ts`) | Objetivos |
| Timer | `timer.title` (`workout.ts`) | Timer |
| Medidas corporales | `calculadoras.medidas` | Medidas corporales |
| Agua diaria | `calculadoras.agua` | Agua diaria |

### Se retiran

`mas.subtitulo`, `mas.vistaHub`, `mas.vistaRejilla`, `mas.vistaLista`, `mas.linkPerfil`,
`mas.linkPerfilDesc`.

### Se conservan y se reutilizan

`mas.titulo`, `mas.linkPesoCorporal(+Desc)`, `mas.linkCalendario(+Desc)`, `mas.linkCuerpo(+Desc)`,
`mas.linkGuias(+Desc)`, `mas.linkCalculadoras(+Desc)`, `mas.linkNutricion(+Desc)`,
`mas.linkSuplementos(+Desc)`, `mas.linkFotosProgreso(+Desc)`, `mas.linkLogros(+Desc)`,
`mas.linkBiblioteca(+Desc)`, `mas.linkWearables(+Desc)`, `mas.linkPasos(+Desc)`,
`mas.linkAjustes(+Desc)`.

Normalizar `mas.linkPasosDesc` (hoy termina en punto; el resto no).

---

## 7. Tokens y reglas visuales

- Solo tokens: `text-fg`, `text-muted`, `text-gold`, `border-border/40`, `bg-gold/10`. Nada de
  hex sueltos.
- Tipografía: Oswald 400 para el nombre; Barlow 600 9.5 px para eyebrows y contadores; Barlow
  500/400 para filas. Máximo dos pesos de Oswald en la pantalla.
- Sin tarjetas, sin sombras, sin glows. Hairline + aire.
- Sin scrollbar visible y con drag-scroll: ya lo resuelve `index.css` globalmente.
- Debe verse bien en **noche y día** y con **dos paletas** como mínimo (el avatar y el disco usan
  `gold/10`, que se recalcula con el token de la paleta activa).

---

## 8. Accesibilidad

- `<nav aria-label={t('mas.titulo')}>` para el conjunto de enlaces.
- Cada grupo es `<section aria-labelledby="hub-<id>">`; el `<h2>` lleva ese `id`.
- Los contadores de sección son decorativos: `aria-hidden`.
- Filas: `min-h` 53 px (> 44), foco visible (el `:focus-visible` global), iconos `aria-hidden`.
- El bloque de cuenta es un enlace con texto visible suficiente; sin `aria-label` extra.
- El contraste de `text-muted` sobre `bg` ya está validado en el resto de la app; no se introduce
  texto nuevo por debajo de 9.5 px.
- `prefers-reduced-motion`: el stagger existente ya lo respeta.

---

## 9. Impacto técnico

### Archivos

| Archivo | Cambio |
|---|---|
| `src/pages/MasPage.tsx` | Reescritura: header + cuenta + nav de 4 secciones + fila Ajustes |
| `src/i18n/locales/es/core.ts` | Altas/bajas de §6 |
| `src/i18n/locales/en/core.ts` | Espejo de §6 |
| `src/domain/settings.ts` | Quitar `hubLayout` del tipo y de `DEFAULT_SETTINGS` |
| `CHANGELOG.md` | Entrada `Changed` del rediseño (obligatorio en el repo) |
| `docs/design/README.md` + `docs/design/NOCTURNO-MINIMAL.md` | Estado actual del hub y fila del hub en el mapa de migración (§11) |

**TDD.** No hay superficie pura nueva: los enlaces viven en el componente porque los iconos son
componentes React (prohibidos en `domain/`). El RED es el e2e: se reescriben primero
`test_t9.py`, `test_t10.py` y el test de vista única contra el contrato nuevo (una vista, 17 filas,
sin Papers, sin toggle) y se los ve fallar antes de tocar `MasPage`.

No se toca `router.tsx`, `tour.ts`, `TabBar`, `AppHeader` ni `index.css`.

### Tests a actualizar

| Test | Situación | Acción |
|---|---|---|
| `tests/e2e/test_t9.py` | Afirma toggle, 14 cards y persistencia | Reescribir: una sola vista, filas visibles, ≥44 px |
| `tests/e2e/test_t10.py` | Espera «Perfil e historial» y `a[href='/perfil']` | Actualizar labels; el enlace a `/perfil` sigue existiendo |
| `tests/e2e/test_f93_t28_mas_grid.py` | Afirma grid `grid-cols-3` | Reemplazar por el test de vista única (320/375/768, sin overflow, ≥44 px, 0 errores) |
| `tests/e2e/test_pulido_home_mas_ajustes.py` | Exige `main a[href="/ajustes"]` en `/mas` | Debe seguir pasando; la fila final es un `<a>` |
| `tests/e2e/test_f101_tour.py` | Spotlight sobre `[data-tour="mas-links"]` | Debe seguir pasando; el ancla se conserva |
| `tests/e2e/test_f103_smoke.py` | Carga `/mas` | Sin cambios |

### Verificación obligatoria

1. `npm run build` (typecheck real).
2. `npm test`.
3. e2e: `test_t9.py` (reescrito), `test_t10.py`, `test_f93_t28_mas_grid.py` (reemplazado),
   `test_pulido_home_mas_ajustes.py`, `test_f101_tour.py`, `test_f103_smoke.py`.
4. Revisión visual en 320×700, 375×812 y 768×1024, tema noche y día.
5. Emulador: **no obligatorio** — no se toca el router ni `vite.config.ts`. Si el cierre de fase
   lo pide, smoke de `/mas` con una ruta multi-segmento existente.

---

## 10. Lo que queda a criterio del builder

- Spacing exacto entre header, cuenta y primera sección (usar la escala del `NOCTURNO-MINIMAL.md`).
- Si los contadores de sección se quedan: son decorativos y se pueden quitar sin cambiar nada más.
- Micro-copy de `mas.verPerfil` si aparece repetido junto al nombre.
- Si el largo de la página molesta, el candidato a sacar es «Medidas corporales» (uso semanal),
  **nunca** Calculadoras.
- Cómo se resuelve el `alt` del avatar cuando hay imagen (decorativo vs. nombre).

---

## 11. Referencias

- `gymlab-app/docs/design/README.md` — índice y pautas no negociables.
- `gymlab-app/docs/design/NOCTURNO-MINIMAL.md` §5.9 (lista hairline), §5.1 (header), §12 (checklist).
- Mockup aprobado: `.superpowers/brainstorm/mas-redesign-20261023/content/mas-a-v2.html`.
- Direcciones descartadas: `mas-direcciones-v1.html` (A/B/C).
