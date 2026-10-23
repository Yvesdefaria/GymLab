# Nocturno Minimal — variante de expresión de GymLab

> **Estado:** aprobada para `/pasos` el 2026-10-23 (dirección C de los mockups).
> **Relación con el design system:** no crea una paleta nueva. Es una **forma de componer** los tokens existentes de `docs/DESIGN.md`: mismos colores, mismas fuentes, mismas variables CSS. La diferencia está en la jerarquía, la densidad, el uso del círculo y la desaparición de la tarjeta como contenedor por defecto.

---

## 1. Intención

**Nocturno Minimal** es la expresión de GymLab para pantallas donde el dato tiene que respirar: un fondo casi negro, un solo héroe, líneas de 1 px en lugar de tarjetas, círculos como lenguaje y el verde reservado para lo conseguido. La app deja de parecer un tablero de tarjetas y empieza a parecer un instrumento: números grandes, ejes mínimos, aire.

La referencia visual aprobada está en los mockups de `/pasos`:

- `.superpowers/brainstorm/pasos-redesign-20261023/content/pasos-direcciones-v1.html` (dirección C)
- `.superpowers/brainstorm/pasos-redesign-20261023/content/pasos-c-estados-v1.html` (estados)

La dirección B («Panel de datos») quedó guardada como alternativa en `.superpowers/brainstorm/pasos-redesign-20261023/B-direction.md`.

---

## 2. Principios

1. **Un solo héroe por pantalla.** Un anillo, un número grande, una acción principal. Si hay un segundo dato importante, va en una fila o en una barra, nunca en un segundo anillo.
2. **El dato manda; el chrome desaparece.** Sin tarjetas por defecto. Las secciones se separan con una hairline y espacio, no con bordes y sombras.
3. **Hairline en vez de tarjeta.** 1 px a `border-border/40`. Si el borde es lo primero que se ve, está demasiado fuerte.
4. **Un acento con significado.** Dorado = progreso/marca; verde = objetivo cumplido; rojo = error. Nada más compite. El azul, violeta o lima de la paleta activa solo aparecen como acento de marca, nunca como un segundo semántico.
5. **Círculos como lenguaje.** Anillo del héroe, celdas circulares del calendario, medallas, discos de días cumplidos, botones redondos. El círculo no es decoración: marca progreso o logro.
6. **Aire y ritmo vertical.** 16 px de padding lateral, 20–28 px entre secciones, 12–16 px dentro de un bloque. El scroll es parte del diseño: no se comprime todo para que entre.
7. **Honestidad del dato.** Si no hay datos, se dice. Si un número es una estimación, se etiqueta. No se inventan horas, no se rellenan meses futuros, no se muestran barras vacías como si fueran cero.

---

## 3. Tokens

Se usan las clases de Tailwind que ya mapean a las variables de `src/index.css`. **No hardcodear colores.** Las 6 paletas (`gold`, `energy`, `crimson`, `electric`, `violet`, `gray`) y los temas noche/día siguen funcionando.

### 3.1 Color

| Rol | Token / clase | Uso en Nocturno Minimal |
|---|---|---|
| Fondo | `bg-bg` | Lienzo. Sin textura ni foto. |
| Superficie elevada | `bg-bg-elevated` | Solo para inputs, sheets y estados hover. No para cada sección. |
| Texto principal | `text-fg` | Números y títulos. |
| Texto secundario | `text-muted` | Eyebrows, ejes, metas, ayudas. |
| Hairline | `border-border/40` | Separadores de sección, filas, calendario. |
| Progreso / marca | `text-gold`, `bg-gold`, `var(--color-cta)` | Anillo, barras, punto de hoy, foco. |
| Progreso brillante | `text-gold-bright` | Números de acento, chips seleccionados. |
| Logro | `text-success`, `bg-success` | Disco verde con estrella, meta cumplida, delta positivo. |
| Error | `text-danger`, `border-danger` | Validación, acciones destructivas. |
| Sobre dorado | `text-on-gold` | Texto sobre botón primario. |
| Sobre verde | `text-bg` | Estrella dentro del disco verde (se adapta a noche/día). |

**Regla del acento único:** en una misma vista no conviven dos colores de acento con significado. Si la paleta activa es `crimson`, el acento de marca es el rojo; el verde sigue siendo el único color de logro. No se usa el acento de la paleta para «completado»: para eso está `success`.

### 3.2 Tipografía

| Rol | Fuente | Peso | Tamaño | Detalle |
|---|---|---|---|---|
| Número héroe | Oswald | 300 | 56–64 px | `tabular-nums`, `leading-none` |
| Valor de sección | Oswald | 300–400 | 22–30 px | `tabular-nums` |
| Título de pantalla | Oswald | 400–500 | 20–26 px | `tracking-wide` |
| Eyebrow / kicker | Barlow | 600 | 10–11 px | MAYÚSCULAS, `tracking-[0.18em]` |
| Cuerpo | Barlow | 400 | 13–15 px | `leading-relaxed` |
| Meta / eje | Barlow | 500 | 9–10 px | `text-muted`, `tabular-nums` |
| Botón | Barlow | 600 | 12–13 px | Sin mayúsculas si es una acción |

**Regla de los dos pesos:** una sección no usa más de dos pesos de Oswald. El número grande va liviano (300); los títulos van 400–500. Evitar el 700 en todo: el contraste se construye con tamaño y color, no con negrita.

### 3.3 Espaciado y radios

| Token | Valor | Uso |
|---|---|---|
| Padding de página | 16 px | `px-4` |
| Gap entre secciones | 20–28 px | `space-y-5` / `space-y-7` |
| Padding interno | 12–16 px | Filas, sheets |
| Hairline | 1 px | `border-t border-border/40` |
| Radio de control | 12 px | `rounded-xl` |
| Radio de sheet | 24 px arriba | `rounded-t-3xl` |
| Radio de círculo | 9999 px | `rounded-full` |
| Altura táctil | ≥ 44 px | Aunque el círculo visual mida 30 px |

### 3.4 Sombras

Casi ninguna. La profundidad la da el contraste tonal y la hairline. Solo los sheets flotantes llevan una sombra ambiental suave (`shadow-[0_-24px_60px_rgba(0,0,0,0.6)]`). Prohibidos los glows decorativos y las sombras duras en secciones.

---

## 4. Layout

- Columna única mobile-first, `max-w-lg`, `px-4`, respetando `env(safe-area-inset-*)`.
- Orden recomendado para una pantalla de datos:
  1. Header con fecha + acción secundaria (`⋯`).
  2. Héroe (anillo + número + meta editable + métrica secundaria).
  3. Mini calendario semanal.
  4. Secciones de gráficas (hoy → semana → mes → año).
  5. Calendario completo.
  6. Fila de stats.
  7. Logros / retos / contenido secundario.
- **Una sola acción primaria.** El resto son enlaces de texto, chips o ghost buttons.
- **El scroll no se esconde:** no se comprime la tipografía para meter más. Si una pantalla tiene mucho, se separa en secciones con hairlines.
- **Touch targets:** todo botón real mide ≥ 44×44 px aunque el círculo visual sea más chico; se logra con padding o `min-h-11`.

---

## 5. Componentes

### 5.1 Header con acción secundaria

```tsx
<header className="sticky top-0 z-40 border-b border-border/40 bg-bg/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        Viernes 23 de octubre
      </p>
      <h1 className="font-display text-2xl font-medium tracking-wide text-fg">Pasos</h1>
    </div>
    <button
      type="button"
      aria-label="Más opciones"
      className="flex size-11 items-center justify-center rounded-full text-muted"
    >
      <MoreHorizontal className="size-5" aria-hidden />
    </button>
  </div>
</header>
```

Regla: la acción secundaria va en un `⋯` redondo, sin fondo. Nada de barras de acciones llenas de iconos.

### 5.2 HeroMetric (anillo + número)

Anatomía: anillo de 190–214 px, trazo 5–6 px, número Oswald 300 de 56–64 px, meta editable como texto subrayado, métrica secundaria en una línea.

```tsx
<div className="flex flex-col items-center border-b border-border/40 pb-5 pt-4">
  <div className="relative flex size-[214px] items-center justify-center">
    <svg viewBox="0 0 214 214" className="-rotate-90" aria-hidden>
      <circle cx="107" cy="107" r="103" fill="none" stroke="var(--color-border)" strokeWidth="5" />
      <circle
        cx="107" cy="107" r="103" fill="none"
        stroke="var(--color-cta)" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={2 * Math.PI * 103}
        strokeDashoffset={2 * Math.PI * 103 * (1 - pct / 100)}
        className="transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none"
      />
    </svg>
    <div className="absolute flex flex-col items-center">
      <span className="font-display text-6xl font-light leading-none tabular-nums text-fg">
        {formatNumber(steps, lang)}
      </span>
      <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">
        de {formatNumber(goal, lang)} pasos
      </span>
    </div>
  </div>

  <button
    type="button"
    className="mt-3 border-b border-gold/35 pb-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-gold"
  >
    meta {formatNumber(goal, lang)} · cambiar
  </button>

  <div className="mt-4 flex items-baseline gap-2">
    <span className="font-display text-3xl font-light text-gold-bright">1 h 02 min</span>
    <span className="text-[10px] uppercase tracking-[0.12em] text-muted">caminando</span>
    <span className="rounded border border-border/40 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-muted">
      estimado
    </span>
  </div>
</div>
```

Reglas:
- El anillo es el **único** de la pantalla. Un segundo progreso usa barra fina o fila.
- El número va en `text-fg`, no en dorado. El dorado es el anillo.
- La meta se edita desde un texto subrayado, no desde un botón lleno.
- Si el objetivo se cumple, el anillo puede pasar a `var(--color-success)`; el número sigue en `text-fg`.

### 5.3 SectionHeader

```tsx
<div className="flex items-baseline justify-between border-t border-border/40 pt-4">
  <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
    Hoy
  </h2>
  <span className="text-[10px] tabular-nums text-muted">pico 13 h · 1.240</span>
</div>
```

Regla: el título de sección no compite con el dato. Va en muted, mayúsculas, 10 px. El valor de la derecha es opcional y contextual (pico, total, rango).

### 5.4 ChartSection (sin tarjeta)

```tsx
<section className="space-y-3 border-t border-border/40 pt-4">
  <SectionHeader title="Mes" meta="octubre · 23 días" />
  <div className="flex items-baseline justify-between">
    <strong className="font-display text-2xl font-light tabular-nums text-fg">176.870</strong>
    <span className="text-[10px] text-muted">pasos</span>
  </div>
  <AnimatedAreaChart height={110} data={series} /* ... */>
    <defs>
      <linearGradient id="area-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--color-cta)" stopOpacity={0.42} />
        <stop offset="100%" stopColor="var(--color-cta)" stopOpacity={0} />
      </linearGradient>
    </defs>
    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick(colors)} interval={4} />
    <ReferenceLine y={goal} stroke={colors.gold} strokeDasharray="5 5" />
    <Area type="monotone" dataKey="steps" stroke={colors.gold} strokeWidth={2} fill="url(#area-gold)" />
  </AnimatedAreaChart>
  <div className="flex justify-between text-[8px] text-muted">
    {['1', '5', '10', '15', '20', '23'].map((d) => <span key={d}>{d}</span>)}
  </div>
</section>
```

Reglas de gráfica:
- Sin `CartesianGrid`.
- Sin eje Y visible.
- Eje X con 5–7 marcas como máximo; 24 horas se muestran como `00 06 12 18 23`.
- Línea de meta punteada y fina, nunca rellena.
- Área con gradiente al 42% → 0%.
- Un solo punto destacado (el último o el pico), no todos.
- Tooltip único, oscuro, con borde dorado tenue.
- Sin leyenda si hay una sola serie.

### 5.5 WeekStrip (mini calendario semanal)

```tsx
<div className="grid grid-cols-7 gap-1.5 border-b border-border/40 pb-4 text-center">
  {days.map((d) => (
    <div key={d.date} className="flex flex-col items-center gap-1">
      <span className="text-[9px] uppercase tracking-widest text-muted">{d.label}</span>
      {d.done ? (
        <span className="flex size-8 items-center justify-center rounded-full bg-success text-bg">
          <Star className="size-3.5 fill-current" aria-hidden />
        </span>
      ) : (
        <ProgressRing value={d.pct} size={32} stroke={2.5} />
      )}
      <span className={cn('text-[9px] tabular-nums text-muted', d.isToday && 'text-gold-bright')}>
        {d.day}
      </span>
    </div>
  ))}
</div>
```

Reglas:
- 7 columnas, lunes a domingo.
- Cumplido = **disco verde con estrella centrada** (no un check, no un punto).
- No cumplido = anillo parcial dorado; el arco representa el % de la meta.
- Día futuro = círculo vacío con opacidad baja.
- Hoy = el número del día en dorado; opcionalmente un anillo de 1 px.
- Sin navegación entre semanas en la versión base; si se agrega, se hace con swipe y un indicador de semana, no con flechas.

### 5.6 ActivityCalendar (calendario completo)

Anatomía: header con mes + flechas; grilla de 7 columnas; celdas circulares; intensidad de dorado según % de la meta; estrella verde si se cumplió; anillo si es hoy.

```tsx
<button
  type="button"
  aria-label={`${date}: ${steps} pasos${met ? ', meta cumplida' : ''}`}
  aria-pressed={selected}
  className="relative aspect-square rounded-full text-[9px] tabular-nums text-fg"
  style={{ background: `color-mix(in srgb, var(--color-gold) ${intensity}%, transparent)` }}
>
  {day}
  {met && <Star className="absolute bottom-0.5 right-0.5 size-2.5 fill-success text-success" />}
</button>
```

Reglas de navegación:
- Solo se puede ir **hacia atrás**. En el mes vigente, la flecha derecha está deshabilitada.
- Al ir atrás, se salta al **mes anterior que tenga datos**; los meses vacíos no se muestran.
- En un mes pasado, la flecha derecha vuelve al siguiente mes con datos, hasta el vigente.
- La flecha izquierda se deshabilita si no hay ningún mes anterior con datos.
- La gráfica mensual y el calendario comparten el mes seleccionado.
- Los días futuros no se pintan como cero: quedan vacíos.
- El leyenda es mínima: `menos · más` y `meta cumplida`.

### 5.7 StatRow

```tsx
<div className="grid grid-cols-3 divide-x divide-border/40 border-y border-border/40 py-3 text-center">
  {stats.map((s) => (
    <div key={s.label} className="px-2">
      <strong className="block font-display text-2xl font-light tabular-nums text-fg">{s.value}</strong>
      <span className="text-[8px] uppercase tracking-[0.12em] text-muted">{s.label}</span>
    </div>
  ))}
</div>
```

Regla: 3 columnas máximo. Si hay 4 métricas, la cuarta va en una fila aparte o se elimina. No se vuelve a la grilla 2×2 de tarjetas.

### 5.8 Bottom sheet (meta, alta manual, acciones)

```tsx
<div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end bg-black/60">
  <div className="w-full rounded-t-3xl border-t border-gold/25 bg-bg p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-24px_60px_rgba(0,0,0,0.6)]">
    <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-fg/20" />
    <h2 className="font-display text-xl font-normal text-fg">Meta diaria</h2>
    <p className="mt-1 text-[10px] text-muted">Pasos que querés caminar por día</p>

    <label className="mt-3 block rounded-xl border border-border/60 bg-bg-elevated/40 px-3 py-2">
      <span className="text-[8px] uppercase tracking-[0.12em] text-muted">Objetivo</span>
      <input
        inputMode="numeric"
        className="w-full bg-transparent font-display text-2xl tabular-nums text-fg outline-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </label>

    {error && <p role="alert" className="mt-1.5 text-[10px] text-danger">{error}</p>}
    <p className="mt-1.5 text-[9.5px] text-muted">Entre 1.000 y 50.000 pasos. Sin decimales.</p>

    <div className="mt-2.5 flex gap-1.5">
      {[5000, 7000, 10000, 20000].map((n) => (
        <button key={n} type="button" className="flex-1 rounded-lg border border-border/40 py-1.5 text-[10px] text-muted">
          {formatNumber(n, lang)}
        </button>
      ))}
    </div>

    <div className="mt-4 flex gap-2">
      <Button variant="outline" className="flex-1">Cancelar</Button>
      <Button variant="primary" className="flex-1" disabled={!!error}>Guardar</Button>
    </div>
  </div>
</div>
```

Reglas:
- Siempre bottom sheet, nunca modal centrado en mobile.
- Grabber de 4×38 px.
- Título + subtítulo, campo, error, rango, atajos, acciones.
- El botón primario se deshabilita con un valor inválido; el error va con `role="alert"`.
- El input acepta solo enteros; se formatea con separador de miles al perder foco.
- El sheet respeta `env(safe-area-inset-bottom)` y bloquea el scroll del fondo.

### 5.9 Action sheet y lista hairline

```tsx
<button className="flex w-full items-center gap-3 border-t border-border/40 py-3 text-left first:border-t-0">
  <span className="flex size-9 items-center justify-center rounded-full bg-gold/10 text-gold">
    <Plus className="size-4" aria-hidden />
  </span>
  <span className="min-w-0 flex-1">
    <span className="block text-xs font-medium text-fg">Registrar pasos manualmente</span>
    <span className="block text-[9px] text-muted">Reemplaza el total de hoy</span>
  </span>
  <ChevronRight className="size-4 text-muted" aria-hidden />
</button>
```

Regla: una acción por fila, icono en círculo tenue, título + subtítulo, chevron. Sin bordes alrededor de la fila; solo la hairline superior.

### 5.10 EmptyState

```tsx
<div className="flex flex-col items-center border-t border-border/40 py-6 text-center">
  <svg viewBox="0 0 340 44" className="mb-2 h-11 w-full" aria-hidden>
    <line x1="0" y1="30" x2="340" y2="30" stroke="var(--color-border)" strokeDasharray="4 5" />
    <circle cx="120" cy="30" r="3" fill="var(--color-gold)" opacity=".55" />
    <circle cx="230" cy="30" r="3" fill="var(--color-gold)" opacity=".3" />
  </svg>
  <p className="text-xs font-medium text-fg">Sin detalle por hora</p>
  <p className="mt-1 max-w-[270px] text-[10px] leading-relaxed text-muted">
    El alta manual guarda solo el total del día. Conectá Health Connect para ver los pasos hora a hora.
  </p>
  <Button variant="outline" size="sm" className="mt-2.5">Cómo conectar</Button>
</div>
```

Regla: el vacío no se disfraza de gráfica. Se muestra una línea punteada, un título, una explicación de 2 líneas y, si hay acción, un ghost button. Nunca un `0` grande como si fuera un dato.

### 5.11 Chips, botones y barras

- **Chip:** `rounded-full border border-border/40 px-3 py-1.5 text-[10px] text-muted`; seleccionado `border-gold/50 bg-gold/10 text-gold-bright`.
- **Botón primario C:** sólido `bg-cta text-on-gold`, `rounded-xl`, `min-h-11`, sin gradiente. Si se reutiliza el `Button` actual, agregar una variante `flat` en lugar de crear otro botón.
- **Ghost:** `border border-border/40 text-fg`; danger: `text-danger`.
- **Barra de progreso:** 6 px de alto, `rounded-full bg-fg/10`; fill `bg-gradient-to-r from-gold to-gold-bright`; cuando se cumple, `from-success to-success`.

### 5.12 Medallas y logros

- Medalla circular de 36–56 px, borde `border-gold/30`, fondo radial dorado tenue, icono lucide.
- Desbloqueada: icono `text-gold-bright`; bloqueada: `text-muted/40` y borde hairline.
- En una fila: medalla + texto (título + subtítulo) + `Ver todos` como texto.
- No usar emojis. La estrella del calendario es un icono lucide `Star` con `fill-current`.

---

## 6. Gráficas

### 6.1 Reglas generales

- **Sin grilla.** El fondo queda limpio.
- **Sin eje Y.** El valor grande de la sección da la escala; el tooltip da el detalle.
- **Eje X escaso.** 5–7 marcas. En horas: `00 06 12 18 23`. En meses: iniciales.
- **Línea de meta punteada** y fina (`strokeDasharray="5 5"`, opacidad 0.5).
- **Área con gradiente** del acento al 42% → 0%.
- **Un punto destacado** (último dato o pico), no todos.
- **Tooltip** oscuro, borde dorado tenue, una fila por serie.
- **Sin leyenda** si hay una sola serie.
- **Animación de entrada** de 240–320 ms; respetar `prefers-reduced-motion`.
- **Datos futuros** no se dibujan como cero: se omiten o se dejan vacíos.

### 6.2 Receta de área (Recharts)

```tsx
<AnimatedAreaChart
  height={110}
  data={series}
  margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
>
  <defs>
    <linearGradient id="area-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="var(--color-cta)" stopOpacity={0.42} />
      <stop offset="100%" stopColor="var(--color-cta)" stopOpacity={0} />
    </linearGradient>
  </defs>
  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick(colors)} interval={4} />
  <ReferenceLine y={goal} stroke={colors.gold} strokeDasharray="5 5" strokeOpacity={0.55} />
  <Tooltip content={<ChartTooltip colors={colors} />} cursor={false} />
  <Area type="monotone" dataKey="steps" stroke={colors.gold} strokeWidth={2} fill="url(#area-gold)" />
</AnimatedAreaChart>
```

### 6.3 Receta de barras

```tsx
<AnimatedBarChart height={110} data={series} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick(colors)} interval={0} />
  <ReferenceLine y={goal} stroke={colors.gold} strokeDasharray="4 4" strokeOpacity={0.45} />
  <Bar dataKey="steps" radius={[6, 6, 0, 0]} maxBarSize={22}>
    {series.map((p) => (
      <Cell key={p.date} fill={p.isToday ? colors.goldBright : colors.gold} />
    ))}
  </Bar>
</AnimatedBarChart>
```

Regla de barras: radio superior 6 px, ancho máximo 22 px, sin barras para valores nulos. El día de hoy se destaca con el dorado brillante, no con otro color.

### 6.4 Anillo

- SVG con dos círculos: track `var(--color-border)` y progreso `var(--color-cta)`.
- `strokeLinecap="round"`, rotado −90°, `transition-[stroke-dashoffset]`.
- El número va fuera del SVG, en `text-fg`.
- `role="progressbar"` con `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` con pasos y meta.

### 6.5 Estados de carga y vacío

- **Carga:** skeleton con `animate-pulse` solo en la zona del gráfico; no en toda la página.
- **Vacío:** ver 5.10.
- **Error de sincronización:** texto corto + acción ghost; no un banner que tape el héroe.

---

## 7. Movimiento

- Duraciones: 200–320 ms para cambios de estado; 400–600 ms para la entrada de una gráfica.
- Curvas: `ease-out` / `cubic-bezier(0.22, 1, 0.36, 1)`. Sin rebotes.
- Anillo: `stroke-dashoffset` con CSS transition.
- Estrella de logro: `scale` 0.8 → 1 + `opacity` 0 → 1, 220 ms, solo la primera vez que aparece.
- Gráficas: `useChartEntry` o anime.js para el reveal del área; no animar cada barra por separado si son más de 12.
- `prefers-reduced-motion`: desactivar reveal, stagger y transiciones de scroll; dejar solo cambios instantáneos.

---

## 8. Accesibilidad

- **Contraste:** texto normal ≥ 4.5:1; texto grande ≥ 3:1. El verde de `success` se usa como relleno o badge, no como texto pequeño sobre fondo oscuro. En día, `success` se oscurece a `#15803d`.
- **Foco:** anillo de 2 px `--color-cta` con offset de 2 px. Nunca `outline: none` sin reemplazo.
- **Calendario:** cada celda es un `<button>` con `aria-label` que incluye fecha, pasos y si cumplió la meta; `aria-pressed` para el día seleccionado.
- **Anillo:** `role="progressbar"` con valores y etiqueta.
- **Gráficas:** `role="img"` + `aria-label` con el resumen (total, pico, meta). Si el gráfico es la única forma de acceder a un dato, agregar una lista oculta o un texto de resumen.
- **Sheets:** `role="dialog"`, `aria-modal="true"`, foco atrapado, Escape cierra, foco devuelto al disparador, scroll del fondo bloqueado.
- **Touch:** ≥ 44×44 px reales; separación ≥ 8 px.
- **Movimiento:** respetar `prefers-reduced-motion`.
- **Iconos:** lucide-react, nunca emoji. Los iconos decorativos van `aria-hidden`.

---

## 9. Do / Don't

### Do
- Un héroe por pantalla; el resto son secciones.
- Hairline + aire en lugar de tarjeta.
- Dorado para progreso, verde para logro, rojo para error.
- Números en Oswald liviano con `tabular-nums`.
- Círculos para progreso/logro; el resto, rectángulos suaves.
- Bottom sheets para acciones y edición.
- Empty states honestos y etiquetas de «estimado» cuando corresponde.
- Probar la pantalla en noche y día, y con al menos dos paletas.

### Don't
- No llenar la pantalla de tarjetas 2×2.
- No usar dos anillos en la misma vista.
- No usar el verde para «progreso»: el verde es solo «cumplido».
- No usar más de un acento semántico por vista.
- No poner bordes dorados fuertes ni glows decorativos.
- No mostrar meses futuros ni horas inventadas.
- No usar modales centrados en mobile; bottom sheet.
- No usar emojis como iconos.
- No comprimir la tipografía para que entre más contenido.
- No hardcodear colores: siempre tokens (`bg-gold`, `text-success`, `border-border/40`).

---

## 10. Opciones adicionales para otras pantallas

Estas son recetas para extender la estética sin copiar `/pasos`. Cada una se puede implementar por separado.

### 10.1 Home / Entrenar — «Héroe + week strip + lista»

```text
┌──────────────────────────────┐
│ 23 OCT · VIERNES          ⋯  │
│ Entrenar                     │
│                              │
│           ◯ 62%              │
│      Volumen 4.820 kg        │
│   3 series · 42 min          │
│   [ Empezar sesión ]         │
│ ──────────────────────────── │
│ L   M   X   J   V   S   D    │
│ ●   ●   ◐   ●   ○   ·   ·    │
│ ──────────────────────────── │
│ Rutina de hoy             →  │
│ Press banca · 4×8            │
└──────────────────────────────┘
```

- **Reemplaza:** el hero con foto + tarjetas de streak/volumen.
- **Regla:** un anillo (volumen o adherencia), una CTA, week strip con entrenos (verde/estrella) y rutina de hoy como fila hairline.
- **Dónde:** `EntrenarPage`, `WeekCalendar`.
- **Cuidado:** la foto del hero es la firma de «Iron Lab»; si se migra a Nocturno Minimal, se quita la foto y se gana aire. Es una decisión de producto, no solo visual.

### 10.2 Estadísticas — «Chart stack»

```text
┌──────────────────────────────┐
│ Estadísticas                 │
│ [7 d] [30 d] [90 d] [Todo]   │
│ ──────────────────────────── │
│ VOLUMEN              24.800  │
│  ╱╲    ╱╲                    │
│ ╱  ╲__╱  ╲___                │
│ 1   8   15   22   29         │
│ ──────────────────────────── │
│ SERIES                 142   │
│ ▂▃▅▆▇▆▅▃                     │
│ ──────────────────────────── │
│ PRs                     12   │
│ Press banca 100 kg · 5 rep   │
└──────────────────────────────┘
```

- **Reemplaza:** la grilla de `ChartCard` con muchas tarjetas.
- **Regla:** chips de rango arriba, una sección por métrica, sin tarjetas; el número grande a la izquierda y la gráfica debajo.
- **Dónde:** `StatsPage`, tabs de estadísticas.

### 10.3 Calendario — «Mes circular»

```text
┌──────────────────────────────┐
│ ‹      Octubre 2026      ›   │
│        23 días con datos     │
│  L  M  X  J  V  S  D         │
│  ·  ·  ·  1  2  3  4         │
│  5  6  7  8  9 10 11         │
│ 12 13 14 15 16 17 18         │
│ 19 20 21 22 23 24 25         │
│ 26 27 28 29 30 31  ·         │
│ ● = entrenado  ★ = meta      │
└──────────────────────────────┘
```

- **Reemplaza:** `MonthCalendar` cuadrado con estados de color.
- **Regla:** celdas circulares, intensidad por volumen o cumplimiento, estrella verde en el día cumplido, hoy con anillo dorado, navegación solo hacia atrás.
- **Dónde:** `CalendarioPage`, `MonthCalendar`.

### 10.4 Rutinas — «Lista hairline»

```text
┌──────────────────────────────┐
│ Rutinas                      │
│ ──────────────────────────── │
│ ①  Full body          →      │
│    3 días · 12 ejercicios    │
│ ──────────────────────────── │
│ ②  Push / Pull / Legs →      │
│    3 días · 18 ejercicios    │
│ ──────────────────────────── │
│ ③  Principiante       →      │
│    2 días · 8 ejercicios     │
└──────────────────────────────┘
```

- **Reemplaza:** tarjetas de rutina con imagen.
- **Regla:** índice en círculo, título + meta, chevron; hairline entre filas; sin imagen si no aporta.
- **Dónde:** `RutinasPage`, `RoutineCard`.

### 10.5 Nutrición — «Macro rings»

```text
┌──────────────────────────────┐
│ Nutrición                    │
│         ◯ 1.850 kcal         │
│        de 2.200 kcal         │
│ ──────────────────────────── │
│  PROT    CARB    GRASA       │
│  142 g   210 g   68 g        │
│   80%    90%    75%          │
│ ──────────────────────────── │
│ Desayuno                 →   │
│ Avena · 420 kcal             │
└──────────────────────────────┘
```

- **Reemplaza:** tarjetas de macros + lista de comidas.
- **Regla:** un anillo de calorías, 3 columnas de macros con hairline, comidas como filas. El verde solo si se cumple el objetivo; si no, dorado.
- **Dónde:** `NutritionPage`, `NutritionRoute`.

### 10.6 Perfil / Ajustes — «Grupos hairline»

```text
┌──────────────────────────────┐
│ Perfil                       │
│ ──────────────────────────── │
│ APARIENCIA                   │
│ Tema              Noche  ›   │
│ Paleta            Gold   ›   │
│ ──────────────────────────── │
│ DATOS                        │
│ Exportar backup          →   │
│ Importar CSV             →   │
│ ──────────────────────────── │
│ Zona de riesgo               │
│ Borrar todos los datos       │
└──────────────────────────────┘
```

- **Reemplaza:** tarjetas de ajustes.
- **Regla:** eyebrow de grupo, filas de 44 px, hairline, switch o chevron; destructive en rojo al final, nunca en el flujo principal.
- **Dónde:** `PerfilPage`, `AjustesPage`.

### 10.7 Calculadoras — «Result hero»

```text
┌──────────────────────────────┐
│ Calculadora de calorías      │
│ ──────────────────────────── │
│ Peso                  78 kg  │
│ Altura                180 cm │
│ Edad                  32     │
│ Actividad        Moderada ›  │
│ ──────────────────────────── │
│        2.850 kcal            │
│     mantenimiento estimado   │
│  [ Ver desglose ]            │
└──────────────────────────────┘
```

- **Reemplaza:** formulario + tarjeta de resultado.
- **Regla:** inputs como filas hairline, resultado como número héroe, disclaimer en muted, una acción.
- **Dónde:** `calculators/`, `/calculadoras/*`.

### 10.8 Onboarding — «Una pregunta por pantalla»

```text
┌──────────────────────────────┐
│ ● ● ○ ○ ○                    │
│                              │
│ ¿Cuál es tu objetivo?        │
│                              │
│ ○ Fuerza                     │
│ ○ Hipertrofia                │
│ ○ Perder grasa               │
│ ○ Salud                      │
│                              │
│ [ Continuar ]                │
└──────────────────────────────┘
```

- **Reemplaza:** wizard con tarjetas y resumen denso.
- **Regla:** una decisión por pantalla, título Oswald grande, opciones como filas, puntos de progreso circulares, CTA fija abajo.
- **Dónde:** `OnboardingWizard`, `steps/`.

### 10.9 Logros — «Medallas circulares»

```text
┌──────────────────────────────┐
│ Logros                       │
│ ──────────────────────────── │
│ ◉  Primer 10k        Hecho   │
│ ◉  Racha de 7        Hecho   │
│ ○  Mes activo        3/30    │
│ ○  100 entrenos      42/100  │
└──────────────────────────────┘
```

- **Regla:** medalla circular de 36–56 px, anillo de progreso fino para las bloqueadas, estrella o icono dentro; fila hairline con título + progreso.
- **Dónde:** `AchievementMedal`, `/logros`, `StepAchievements`.

### 10.10 Widget / share — «Ring poster»

```text
┌──────────────────────────────┐
│                              │
│           ◯ 88%              │
│         6.180 pasos          │
│       meta 7.000 · 12 días   │
│                              │
│           GymLab             │
└──────────────────────────────┘
```

- **Regla:** fondo oscuro, anillo, número, una línea de contexto y wordmark pequeño. Sin tarjetas, sin sombras, sin más de 2 colores.
- **Dónde:** tarjeta para compartir sesión, widget nativo, stories.

### 10.11 TabBar — «Hairline tab bar»

```text
┌──────────────────────────────┐
│   ◉        ○        ○     ○  │
│ Entrenar  Rutinas  Stats  Más│
└──────────────────────────────┘
```

- **Regla:** hairline superior, fondo `bg/95` con blur, icono activo en dorado y un punto de 2 px debajo; sin pill de fondo. El label activo en `text-gold-bright`.
- **Dónde:** `TabBar` (opcional; es un cambio más invasivo porque afecta toda la app).

### 10.12 Tema día y otras paletas

- **Día:** `bg-bg` blanco, `text-fg` casi negro, hairline `border-border/40` (beige), dorado oscuro `#7a4f10`, verde `#15803d`. El anillo y las barras usan `var(--color-cta)`, así que se adaptan solos.
- **Energy / Crimson / Electric / Violet:** el acento de marca cambia por token; el verde de logro no. La regla del acento único se mantiene: acento de paleta + verde, nada más.
- **Contraste:** en día, el texto dorado brillante no se usa sobre blanco; se usa `text-accent` (oscuro). En noche, el dorado brillante sí es legible.

---

## 11. Mapa de migración

| Pantalla / componente actual | Expresión Nocturno Minimal | Prioridad |
|---|---|---|
| `/pasos` `StepCircularProgress` | `HeroMetric` (anillo 214, número 64, meta link, tiempo caminando) | Ahora |
| `/pasos` `StepStats` | `StatRow` de 3 columnas | Ahora |
| `/pasos` `StepHeatmap` | `ActivityCalendar` circular con navegación pasada | Ahora |
| `/pasos` `StepWeekChart` | `ChartSection` sin tarjeta | Ahora |
| `/pasos` nuevo “hoy por hora” | `ChartSection` área + estado vacío | Ahora |
| `/pasos` nuevo “mes por día” | `ChartSection` área/barras | Ahora |
| `/pasos` nuevo “año por mes” | `ChartSection` barras | Ahora |
| `/pasos` nuevo “semana” | `WeekStrip` con discos verdes | Ahora |
| `/pasos` `StepDailyChallenge` | Barra fina + fila hairline | Ahora |
| `/pasos` `StepAchievements` | Fila de medallas circulares | Ahora |
| Home `WeekCalendar` | `WeekStrip` (entrenos) | Siguiente |
| `CalendarioPage` `MonthCalendar` | `ActivityCalendar` (entrenos) | Siguiente |
| `StatsPage` `ChartCard` grid | `ChartStack` | Siguiente |
| `NutritionPage` macros | `MacroRings` + filas | Siguiente |
| `RutinasPage` cards | Lista hairline | Siguiente |
| `PerfilPage` cards | Grupos hairline | Siguiente |
| `TabBar` | Hairline tab bar | Opcional |

---

## 12. Checklist para aplicar a una pantalla

- [ ] ¿Hay **un solo héroe**? ¿El segundo dato importante está en fila/barra, no en otro anillo?
- [ ] ¿Las secciones usan **hairline + aire** en lugar de tarjetas?
- [ ] ¿El dorado es **progreso** y el verde es **logro**? ¿Hay un solo acento semántico?
- [ ] ¿Los números grandes están en **Oswald liviano + tabular-nums**?
- [ ] ¿Los eyebrows están en **Barlow 600, 10 px, mayúsculas, tracking 0.18em**?
- [ ] ¿Los touch targets miden **≥ 44 px** aunque el círculo visual sea más chico?
- [ ] ¿Los **estados vacíos** son honestos y no inventan datos?
- [ ] ¿Los **meses futuros / horas sin datos** quedan vacíos, no en cero?
- [ ] ¿La pantalla funciona en **noche y día** y con al menos **dos paletas**?
- [ ] ¿Respeta **`prefers-reduced-motion`**?
- [ ] ¿Los textos están en **es/en** (i18n)?
- [ ] ¿El calendario tiene **navegación solo hacia atrás** y salta meses sin datos?
- [ ] ¿Los sheets son **bottom sheets** con foco atrapado y Escape?
- [ ] ¿La gráfica tiene **aria-label** con el resumen y no depende solo del color?
- [ ] ¿Evitaste **tarjetas 2×2**, glows, emojis y más de dos pesos de Oswald?

---

## 13. Plantilla de pedido para una pantalla nueva

Copiar y completar:

```text
Rediseñá <pantalla> con la estética Nocturno Minimal
(gymlab-app/docs/design/NOCTURNO-MINIMAL.md).

Quiero:
- un solo héroe: <métrica principal> con anillo de <tamaño>, número grande y una línea secundaria;
- secciones separadas por hairline, sin tarjetas;
- <N> gráficas: <tipo y métrica>;
- un calendario <semanal/mensual> con <regla de logro>;
- una acción primaria: <acción>;
- el resto como filas/ghost buttons.

No quiero:
- tarjetas 2×2, glows, emojis, más de un acento semántico;
- datos futuros pintados como cero;
- modales centrados.

Respetá los tokens existentes, i18n es/en, 44 px de touch target,
prefers-reduced-motion y las 6 paletas × 2 temas.
```

---

## 14. Referencias

- Design system base: `docs/DESIGN.md` («The Iron Lab»).
- Tokens reales: `src/index.css` (`@theme` + paletas/temas).
- Mockups aprobados:
  - `.superpowers/brainstorm/pasos-redesign-20261023/content/pasos-direcciones-v1.html`
  - `.superpowers/brainstorm/pasos-redesign-20261023/content/pasos-c-estados-v1.html`
- Alternativa guardada: `.superpowers/brainstorm/pasos-redesign-20261023/B-direction.md`.
- Componentes de referencia en la app: `src/components/steps/`, `src/components/stats/`, `src/lib/intl.ts`.
