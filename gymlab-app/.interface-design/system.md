# Interface Design System — GymLab

Patrones y decisiones de craft del sistema GymLab, guardados para que futuras
sesiones los respeten y no se reinventen.

## Dirección y sensación

- **Industrial-premium**: gimnasio oscuro + metal + oro. Tipografía Oswald
  (display, condensada, mayúsculas) + Barlow (cuerpo). Grano sutil sobre toda la
  app (`.app-grain`, overlay 5%). Fondo con tintes radiales del CTA.
- Paleta por defecto: fondo noche `#121214`, superficie `#242422`, acentos oro
  `#d9b384` / `#fdddb4`, CTA `#d9b384`. 6 paletas (gold/energy/crimson/electric/
  violet/gray) × tema noche/día vía `data-palette`/`data-theme` en `index.css`.

## Estrategia de profundidad y superficies

- **Estrategia elegida: superficie con gradiente + highlight superior (inset 1px
  blanco) + borde dorado sutil**. No mezclar con sombras duras ni glows
  decorativos. En modo oscuro, la elevación viene del gradiente y el highlight,
  no de la sombra.
- Escala de elevación (en `src/index.css`, `@layer components`):
  - `panel` (nivel 1, tarjetas): borde `gold 20%`, gradiente 180deg desde
    `bg-elevated 96%`, sombra interior superior + `0 14px 32px -20px`.
  - `panel-floating` (nivel 2, overlays/sheets/modales): borde `gold 28%`,
    gradiente más claro, sombra mayor. Usado por `PlateCalculatorModal`.
  - `panel-hero` (hero/CTA de sección): borde `cta 45%` + radial del CTA al
    fondo y anillo `cta 14%` + glow del CTA.
- Bordes: **sutiles**. Si el borde es lo primero que se ve, está demasiado
  fuerte. Jerarquía por cambio tonal y espacio, no por contornos.
- Un solo foco por vista: el CTA principal (primary) es el único elemento
  dominante; el resto se demota deliberadamente.

## Jerarquía y tipografía

- Escala por ratio, con **peso y color antes que tamaño**: `kicker` (0.65rem,
  600, uppercase, `letter-spacing 0.2em`, muted) → `stat-value` (display 700,
  tabular-nums, accent) → body Barlow 14px.
- `font-display` (Oswald) para titulares y números de métrica; `font-body`
  (Barlow) para el resto. `font-variant-numeric: tabular-nums` en todo número
  dinámico (`.stat-value`, timers).
- Tab bar: píldora `bg-cta/15` detrás del icono activo + icono `scale-105` +
  label con `gold-text`; inactivo responde `scale-95` al pulsar.
- Un solo foco en Home: el CTA del hero. No duplicar CTA flotantes que compiten
  con el botón de la tarjeta principal.

## Patrones de componentes (medidas que recordar)

- **`Button` / `ButtonLink`** (`src/components/ui/Button.tsx`):
  - Variantes: `primary` (CTA, `gold-gradient`, font-display, `shadow-cta/20`,
    `active:scale-[0.98]`), `outline` (borde `border` + `bg-bg`), `accent`
    (secundario destacado: `border-cta bg-cta/15 text-accent-soft`, usado en
    exportar backup), `ghost` (terciario silenciado).
  - Tamaños: `sm` = `min-h-[44px] rounded-xl px-3.5 text-sm` · `md` =
    `min-h-[52px] rounded-2xl px-5 text-base` · `lg` =
    `min-h-[56px] rounded-2xl px-6 text-lg`. Touch mínimo 44px siempre.
  - Usar SIEMPRE `Button`/`ButtonLink` en lugar de cadenas `gold-gradient`
    copiadas. `ButtonLink` es un `react-router-dom` `Link` con las mismas
    variantes.
- **BackLink** (`src/components/ui/BackLink.tsx`): retroceso con flecha, label
  contextual, `min-h-[44px]`.
- **ProgressRing**: solo para el foco principal de una vista (hero). Para
  progreso secundario usar barra `gold-gradient` con `role="progressbar"` (no
  duplicar anillos).
- **Toggle** (Ajustes): `role="switch"`, `h-11 w-14`, bolita `size-6` que
  viaja `translate-x-6`, activo `bg-cta`.
- **Inputs**: `h-11 rounded-lg border-border bg-bg focus:border-cta`, valores
  acotados con `clamp()`.
- Radio exterior = radio interior + padding (concéntrico). Estados siempre
  presentes (hover, active, focus-visible con `outline-cta`, disabled
  `opacity-50`).

## Referencias visuales

- Dirección definida sin generación de imágenes: derivada del mundo físico del
  gimnasio (hierro, magnesio, neón industrial, metal dorado). Mantener esa
  exploración de dominio (dominio → mundo de color → firma → defaults a
  rechazar) antes de proponer cambios visuales.
