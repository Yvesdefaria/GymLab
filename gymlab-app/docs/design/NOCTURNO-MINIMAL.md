# Nocturno Minimal — variante de expresión de GymLab

> **Estado:** aprobada para `/pasos` y `/estadisticas` (C1) el 2026-10-23.
> **Relación con el design system:** no crea una paleta nueva. Es una **forma de componer** los tokens existentes de `docs/DESIGN.md`: mismos colores, mismas fuentes, mismas variables CSS. La diferencia está en la jerarquía, la densidad, el uso del círculo y la desaparición de la tarjeta como contenedor por defecto. La paleta categórica de datos de 3.5 es una capa aparte, solo para marcas pequeñas.

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

### 3.5 Paleta de datos categórica

La base sigue siendo **un acento + verde semántico**. Para que Stats no sea monocromo sin romper la identidad, se agrega una paleta categórica **solo para marcas pequeñas**. No es una paleta de marca: no se usa en fondos, titulares, botones ni cuerpos de texto.

| Token | Noche | Día | Uso |
|---|---|---|---|
| `--data-chest` | `#E07A5F` | `#C9654F` | Pecho |
| `--data-back` | `#5B8FB9` | `#3F7EA6` | Espalda |
| `--data-legs` | `#4FA8A0` | `#2F8C85` | Pierna |
| `--data-shoulders` | `#C98A3D` | `#B7792F` | Hombro |
| `--data-arms` | `#A78BFA` | `#7C5CE0` | Brazo |
| `--data-core` | `#D98CB3` | `#C05C86` | Core |
| `--data-cardio` | `#5BA8D6` | `#2E8FB5` | Cardio / IMC |
| `--data-fat` | `#E0A458` | `#C07A2E` | Grasa corporal |
| `--data-rest` | `#8A8F98` | `#6B7280` | Resto / neutro |
| `--color-success` | `#22C55E` | `#15803D` | **Solo** meta, PR, cumplido |

**Reglas de uso:**

- **El verde es semántico y exclusivo.** Meta, PR, racha cumplida y “objetivo alcanzado”. Ningún grupo muscular, categoría ni serie de datos usa verde; Pierna va en teal para no robarle el significado.
- **Solo marcas pequeñas:** puntos de 5–7 px, barras de ≤6 px, líneas de 1–2 px, badges, segmentos de una barra de composición y swatches de leyenda. Nunca fondos de sección, héroes, texto de párrafo ni un área de gráfico a plena saturación. Si una gráfica necesita relleno, se queda en gold con opacidad ≤10–36% y el color de datos vive en la línea/punto.
- **Siempre con etiqueta o valor.** El color refuerza; no comunica solo. Un usuario daltónico debe poder leer “Pecho 8.200” sin depender del coral.
- **Máximo 3–4 colores de datos por viewport.** El resto sigue en gold, blanco y muted. Si una pantalla necesita más, se agrupa o se usa una sola rampa.
- **La paleta categórica es independiente de la paleta de marca.** Funciona con gold, energy, crimson, electric, violet y gray. En día se usan las variantes oscuras de la tabla; nunca como texto pequeño sobre blanco sin verificar contraste.
- **Si sacás el color, la pantalla sigue funcionando.** Es la prueba de que el color es refuerzo y no estructura.

Mockup aprobado para Stats (C1): `.superpowers/brainstorm/pasos-redesign-20261023/content/stats-color-v2.html`.

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

### 10.2 Estadísticas — «Tabs + chart stack»

```text
┌──────────────────────────────┐
│ Estadísticas                 │
│ Entreno  Cuerpo  Fuerza  Per.│
│ [30 d] [90 d] [Todo]         │
│ ──────────────────────────── │
│ VOLUMEN SEMANAL      24.800  │
│ +12% vs semana pasada        │
│ Racha 8 d · Entrenos 12 · 52 │
│ ──────────────────────────── │
│ VOLUMEN POR SEMANA           │
│ ▂▄▃▆▅                        │
│ ──────────────────────────── │
│ FRECUENCIA       meta verde  │
│ ▃▄▂▅▄                        │
│ ──────────────────────────── │
│ VOLUMEN POR GRUPO            │
│ ● Pecho   ████████   8.200   │
│ ● Espalda ███████    7.400   │
│ ● Pierna  ██████     6.100   │
│ ──────────────────────────── │
│ FUERZA 1RM        PR +2 kg   │
│ ╱╲__╱╲__╱                     │
└──────────────────────────────┘
```

- **Reemplaza:** la grilla de `ChartCard` con muchas tarjetas; conserva las 4 pestañas (Entreno, Cuerpo, Fuerza, Periodización).
- **Regla:** un héroe por pestaña, chips de rango arriba, una fila de 3 stats y un stack de secciones separadas por hairlines. Entreno = volumen semanal; Cuerpo = peso actual; Fuerza = mejor benchmark/nivel; Periodización = fase y semana actuales.
- **Color:** grupos musculares y categorías con `--data-*` en puntos/barras finas; el verde queda **solo** para meta/PR/cumplido. Sin fondos de color.
- **Dónde:** `EstadisticasPage`, `EntrenoTab`, `CuerpoTab`, `FuerzaTab`, `PeriodizationSection`.

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

> **Implementado (2026-10-24):** `/rutinas` se resolvió con la **dirección E · tarjeta editorial**
> (portada de 146 px con scrim + título sobre la foto + hairline de métricas), no con esta lista.
> La lista hairline queda como alternativa sin fotos. Anatomía, decisiones y archivos: §17.

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
| Home `WeekCalendar` | `WeekStrip` (entrenos) | Hecho (mergeado) |
| Home `/` (héroe + secciones) | Dirección C · Editorial (héroe con foto, week strip, stat row, progreso) | Hecho (mergeado) |
| `CalendarioPage` `MonthCalendar` | `ActivityCalendar` (entrenos) | Siguiente |
| `StatsPage` `ChartCard` grid | `ChartStack` | Siguiente |
| `NutritionPage` macros | `MacroRings` + filas | Siguiente |
| `RutinasPage` cards | Tarjeta editorial (E): portada + scrim + hairline de meta | Hecho (mergeado) |
| `AchievementsPage` cards | Vitrina de 2 columnas + chips por estado + sheet de detalle | Hecho (F132.4) |
| `GoalProjectionCard` + `GoalSetter` | Héroe «próximo hito» + filas hairline + sheet de alta/edición | Hecho (F132.4) |
| `WearableSyncView` placeholder | Estado vacío centrado con anillo punteado | Hecho (F132.4, provisional) |
| `PerfilPage` cards | Grupos hairline | Hecho (mergeado) |
| Hub `/mas` (`MasPage`) | Índice agrupado + bloque de cuenta (dirección A) | Hecho |
| `/peso-corporal` | Héroe + rango 30/90/Todo + área 110 + historial hairline | Hecho (F132.5) |
| `/cuerpo` | Mapa redibujado + detalle + vínculos | Hecho (F132.5) |
| `/progreso-fotos` | Héroe 3 ángulos + slots «Hoy» + timeline + sheet | Hecho (F132.5) |
| `/progreso-fotos/comparar` | A/B + dividida/alternar + delta de peso | Hecho (F132.5) |
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

---

## 15. Stats C1 — referencia, implementación y detalles finos

### 15.1 Estado

- **C1 aprobada** para `/estadisticas` el **2026-10-23**. El usuario aprobó el mockup del Entreno
  C1 con una aclaración: *“faltaban más detalles, por eso lo vi diferente, pero está bien”*. La
  dirección y la estructura están aprobadas; los detalles finos se cierran en otra sesión.
- Implementación: branch `feat/stats-nocturno-minimal`, commit `1b61686a`, **sin push**.
- Review nativo: `medium / under_budget` (`review_due: false`).
- El mockup es la **referencia editorial**; la app reutiliza Recharts, hooks y datos reales, por lo
  que no es pixel-perfect.

### 15.2 Mockups C1

| Mockup | Archivo |
|---|---|
| **Entreno C1 (referencia dedicada)** | `.superpowers/brainstorm/pasos-redesign-20261023/content/stats-c1-entreno-v1.html` |
| Cuerpo / Fuerza / Periodización C1 | `.superpowers/brainstorm/pasos-redesign-20261023/content/stats-c1-tabs-v4.html` |
| Comparación original C1/C2/C3 | `.superpowers/brainstorm/pasos-redesign-20261023/content/stats-color-v2.html` (C1 es la primera) |

Si el server de mockups está vivo: `http://localhost:57898/?key=bf5c618fdec59d930c4ba95784d32847a593460a1caec0de42f8895afbf85025`.
El Entreno C1 se armó a partir de `phoneC1()`; los otros tabs están en `stats-c1-tabs-v4.html`.

### 15.3 Anatomía del Entreno C1

```text
kicker PERFORMANCE / título Estadísticas
tabs compactos: Entreno · Cuerpo · Fuerza · Periodización
rango 30 d · 90 d · Todo
héroe: Volumen semanal (número grande + delta)
fila de 3 stats: Racha · Entrenos 30 d · Duración media
hairline
Volumen por semana (barras)
Frecuencia (barras; verde al cumplir la meta)
Volumen por grupo (barras horizontales con color)
Fuerza 1RM (área; PR en verde)
“Más datos”: Bitácora · Cardio · Balance
```

- **C1 no usa tarjetas**: cada bloque es `ChartCard` minimal o `StatsSection` con hairline.
- **Héroe**: máximo un número/palabra grande por tab; el delta va en dorado si es progreso.
- **Stats**: 3 columnas principales y, si hace falta conservar métricas, una segunda fila de 2.
- **Colores**: `--color-data-*` solo en marcas pequeñas; verde exclusivo meta/PR/cumplido.
- **Charts de Stats**: 110 px área/barra, 160 px donut; sin grilla/ejes/labels salvo la excepción
  de barras horizontales por músculo (que muestran categoría + valor).
- **Rangos**: 30/90/Todo es global solo en **Cuerpo**, donde los seis charts lo comparten; **Entreno**
  conserva ventanas fijas por chart y no muestra la barra para no ofrecer un control que no filtra.
  El delta del héroe de Cuerpo sigue siendo un titular de 30 d.
- **i18n**: todo en es/en; el default del producto es inglés.

### 15.4 Mapa de implementación

| Pieza | Archivo(s) |
|---|---|
| Shell de página, tabs, providers | `src/pages/EstadisticasPage.tsx` |
| Entreno (héroe/stats/stack/más datos) | `src/components/stats/EntrenamientoStats.tsx`, `EntrenoTab.tsx` |
| Cuerpo | `src/components/stats/CuerpoStats.tsx` |
| Fuerza | `src/components/stats/FuerzaTab.tsx` |
| Periodización | `src/components/periodization/PeriodizationSection.tsx`, `PeriodizationView.tsx` |
| Primitivas C1 | `StatsHero.tsx`, `StatsStatRow.tsx`, `StatsSection.tsx`, `StatsMoreData.tsx` |
| Shell de charts | `ChartCard.tsx` + `ChartCardVariant.tsx`, `ChartSizing.tsx` |
| Tabs compactos | `src/components/ui/TabNav.tsx` (`variant="compact"`) |
| Datos/colores | `hooks/useDataColors.ts`, `components/stats/muscleColors.ts`, `domain/statsOverview.ts` |
| Tokens | `src/index.css` (`--color-data-*`, noche/día; `.stats-minimal`) |
| i18n | `src/i18n/locales/{es,en}/stats.ts` |

Decisiones de implementación:

- `ChartCard` minimal por contexto (solo Stats); el default de otras páginas no cambia.
- `ChartSizing` inyecta alturas 110/110/160; no se toca el resto de la app.
- `AnimatedAreaChart`/`AnimatedBarChart` colapsan el ancho del eje Y a 0 solo en Stats.
- `StatRow` tiene una variante minimal con hairlines; `TrendBadge` usa dorado para cualquier
  tendencia (no rojo, que queda para error).
- `StrengthGauge` se compactó (bandas + marcador + labels; sin badge ni tarjeta).
- El vacío de Entreno conserva frecuencia/balance para que el tour (`stats-frequency`) siga vivo.
- `BodyMeasurementsChart` usa `stats.bodyZones` es/en; el formulario de medidas del Perfil todavía
  usa las etiquetas/guías de `BODY_ZONES` en español (follow-up fuera del C1).

### 15.5 Lo que el mockup tiene y la app todavía no

Esto es lo que explica la diferencia visual y lo que se puede cerrar en la próxima sesión:

- El mockup tiene **datos ideales** (24.800 kg, racha 8 d, 12 entrenos, 52 min); la app muestra los
  datos reales (p. ej. 2.300 kg), así que cambia la densidad.
- El mockup usa **SVG a medida** (barras, áreas, labels, spacing); la app usa Recharts con tooltip,
  ejes y estados reales. Acercarse al mockup implica charts más editoriales o un wrapper visual.
- El **rango global** del mockup se resolvió solo en Cuerpo; Entreno conserva ventanas fijas y no
  muestra la barra. El mockup lo muestra también en Entreno, pero allí no todos los charts lo respetan.
- **Volumen por grupo** y **distribución muscular** muestran el historial completo, no la semana
  actual del mockup; se etiquetan “Historial completo” para no mentir. Queda como decisión de producto
  si deben pasar a semana actual.
- El **“Más datos”** no está en el mockup de Entreno; la app lo agregó para conservar
  Bitácora/Cardio/Balance sin competir con el stack principal.
- El **hero/stats** del mockup tienen otro ritmo (número, delta, fila, spacing); la app está cerca,
  pero no es idéntica.
- La **frecuencia** del mockup colorea cada barra según la meta; la app lo hace, pero el alto/ritmo
  del chart cambia con los datos reales.
- El **1RM** del mockup tiene un badge PR verde; la app ya lo muestra en el encabezado cuando el último
  punto supera el máximo previo, con el mismo formato compacto.

### 15.6 Próximos pasos recomendados

1. Side-by-side mockup vs. app del Entreno C1 y cerrar los detalles de mayor impacto: altura/ritmo
   de charts, spacing, hero y labels.
2. ~~Decidir si el rango pasa a ser global.~~ Resuelto: global solo en Cuerpo; Entreno conserva
   ventanas fijas por chart.
3. Revisar “Más datos” en el mockup: ¿se mantiene colapsable o se integra de otra forma?
4. Cerrar el follow-up del formulario de medidas del Perfil (`BODY_ZONES` es/en).
5. Seguir con las pantallas de la tabla de migración §11 (Home, Nutrición, Rutinas, Perfil, TabBar).

---

## 16. Multisesión — pautas para otra sesión

### 16.1 Ruta de entrada

La próxima sesión debe empezar por:

```text
gymlab-app/docs/design/README.md
```

Ese README apunta a este documento. La frase para copiar:

> **Siguiente:** `gymlab-app/docs/design/README.md` — están los estilos y las pautas. Rediseñá
> `<pantalla>` con C1 / Nocturno Minimal en un worktree `<fase>`; i18n es/en; review antes de
> commit; no push.

### 16.2 Worktree (solo si hay sesiones en paralelo)

“Multisesiones” es un pedido explícito de aislamiento. Desde la raíz `ProyectoGymLab`:

```powershell
.\scripts\worktree.ps1 open <fase>
# trabajar en .worktrees\<fase>\gymlab-app
```

Reglas:

- Un solo escritor por worktree; no `git add -A`; stagear rutas exactas; commit inmediato.
- No compartir el índice; el candidato de review es el workspace de ese worktree.
- Build/test/e2e/review/commit con `cwd` en el worktree.
- Cierre: `git -C .worktrees\<fase> rebase main` → `git merge --ff-only <fase>` desde el principal
  → `.\scripts\worktree.ps1 close <fase>`.
- Push/merge final: decisión del usuario. Los commits del agente son locales.

**Gotchas del script (comprobados 2026-10-24/25):**

- `worktree.ps1 open` corta en `git worktree add` bajo PowerShell 7: git escribe «Preparing worktree»
  por stderr y PowerShell lo trata como error, así que **crea el worktree pero no la junction**. Si
  pasa, verificá `git worktree list` y creá la junction a mano:
  `cmd /c mklink /J <worktree>\gymlab-app\node_modules <repo>\gymlab-app\node_modules`.
- `close` puede fallar en `git worktree remove` con **«Permission denied»** si quedó un proceso vivo
  adentro. El caso real fue un **Vite de e2e que no se apagó** (`with_server.py` mata el árbol, pero
  alguno sobrevive). Antes de cerrar, comprobá
  `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | ? CommandLine -like "*<fase>*"` y matalo.
  El worktree queda desregistrado y la rama borrada igual; el directorio vacío se puede quitar al
  reiniciar la app (el host mantiene un handle sobre la carpeta).
- Si el merge falla por un untracked que colisiona (p. ej. el doc de la fase copiado a mano en
  `odd/tasks/`), borrá la copia untracked antes del `--ff-only`: la versión trackeada viene del branch.

### 16.3 Contexto que debe leer la próxima sesión

1. Este documento (§1–§16) y el README.
2. `gymlab-app/AGENTS.md` — flujo, review, worktree, commits, changelog.
3. `odd/tasks/stats-redesign.md` — specs, decisiones y estado del C1.
4. `gymlab-app/docs/DESIGN.md` — design system base.
5. Mockups C1 (rutas de §15.2) si la pregunta es visual.
6. `src/index.css`, `src/components/stats/` y la pantalla a rediseñar.

### 16.4 Qué no hacer

- No inventar una paleta nueva: se usan los tokens de `src/index.css`.
- No usar verde para progreso ni para categorías: solo meta/PR/cumplido.
- No llenar secciones con fondos de color ni convertir todo en tarjetas.
- No hardcodear copy: i18n es/en y `EsSchema` como fuente.
- No commitear los mockups ni los `screenshots` de e2e; el diseño se documenta acá.

---

## 17. Rutinas — tarjeta editorial (dirección E) · implementado 2026-10-24

### 17.1 Estado

- **Implementado y mergeado en `main`** el **2026-10-24** (commit `db3ca05c` + follow-up `c21e5267`).
- Review nativo `review-7e8bfb2d7c9dbfb2` (medium, lente reliability): **approved + acknowledged**
  (authority burned). 9 hallazgos informativos; los de impacto real se corrigieron en el follow-up.
- Spec, decisiones del grilling y log: `odd/tasks/rutinas-redesign.md`.
- Mockup de referencia: `.superpowers/brainstorm/rutinas-redesign-20261024/content/rutinas-e-v2.html`
  (base, objetivo activo, sheet de creación y sheet de filtros).
- La receta §10.4 (lista hairline sin fotos) queda como **alternativa**: se eligió conservar la portada.

### 17.2 Anatomía de la tarjeta

```text
┌──────────────────────────────┐
│ [portada 146 px · object-cover]│
│  KICKER            (★ 44 px)  │
│  Título Oswald 18 px          │
├──────────────────────────────┤
│ Nivel · 4 días/semana · 18 ej ›│
└──────────────────────────────┘
```

- Portada de 146 px + **scrim fijo** (siempre oscuro): título y kicker usan colores claros fijos
  (`#f8fafc` / `#fdddb4`) para que el tema día no quede texto oscuro sobre la foto.
- Kicker: objetivo localizado, `Activa`, `Basada en {título}` o `Propia` (nunca dos).
- Título `line-clamp-2`; meta `nivel · días/semana · N ejercicios` (el conteo se omite si falta).
- Favorito de 44 px glass sobre la portada, `aria-pressed`, hermano del link.
- Sin sombras, glows, hover con translate ni badge apilados.

### 17.3 Catálogo, filtros y creación

- **Chips de objetivo:** `Todos` + los 5 objetivos con el conteo **total** (predefinidas + propias);
  el número coincide con lo que devuelve el modo resultados.
- **Grupos por objetivo** colapsados, acordeón de una apertura, `aria-expanded`/`aria-controls`.
  Arranque en frío (sin programa, favoritas ni propias): el primer grupo se abre una vez.
- **Modo resultados** con objetivo, tipo, nivel o búsqueda: oculta En curso / Favoritas / Mías y
  lista en plano todo lo que cumple los criterios (las propias participan). Encabezado
  `{count} resultados` con singular.
- **Sheet de filtros:** tipo + nivel en borrador, `Limpiar` y `Ver {n} rutinas` (aplica y cierra).
- **Sheet del «+»:** `Crear manualmente` (`/rutinas/nueva`) o `Con ayuda` (`/rutinas/planificador`).
- **Conteo de ejercicios:** `countItemsByRoutine` (dominio) + `routineRepo.getExerciseCounts()`
  (una lectura por tabla) + `useRoutineExerciseCounts`. Es la suma de items de todos los días.

### 17.4 Archivos

| Pieza | Archivo |
|---|---|
| Página y composición | `src/pages/RutinasPage.tsx` |
| Tarjeta editorial | `src/components/routines/RoutineCard.tsx` |
| Chips / grupo / sección | `src/components/routines/RoutineObjectiveChips.tsx`, `RoutineObjectiveGroup.tsx`, `RoutineSection.tsx` |
| Sheets | `src/components/routines/NewRoutineSheet.tsx`, `RoutineFiltersSheet.tsx`, `src/components/ui/BottomSheet.tsx` |
| Dominio / repo / hook | `src/domain/routines.ts`, `src/data/repositories/dexie/routineRepo.ts`, `src/hooks/useRoutineExerciseCounts.ts` |
| Estilos | `src/index.css` (`.routine-cover::after`) |
| i18n | `src/i18n/locales/{es,en}/routines.ts` |
| Tests | `tests/unit/domain/routineCatalog.test.ts`, `tests/unit/components/routines/*`, `tests/e2e/test_rutinas_nocturno.py` |

### 17.5 Follow-ups conocidos

- **R3-5:** la sección «En curso» no tiene e2e propio (el kicker `Activa` sí está testeado).
- **R3-8:** `test_t8.py` conserva `networkidle` (riesgo pre-existente con el HMR de Vite).
- **R3-9:** `test_f47.py` falla en `/perfil` por la aserción `tab "Resumen"`, anterior al rediseño
  de perfil; es pre-existente en `main` y el tramo de `/rutinas` pasa.
- La portada propia de las rutinas custom (subir foto) queda como feature futura; hoy usan una
  portada prestada del catálogo por id.

---

## 18. Entrenamiento — B2, detalle, calendario y timer (F132.2)

### 18.1 Estado

- **Implementado en la rama `132.2-entrenamiento`** (worktree `.worktrees/132.2-entrenamiento`)
  el **2026-10-25**. **Pendiente de revisión del usuario y merge; no push.**
- Commits: `d68c4c3d` (sesión activa) y `5855a8f9` (detalle, calendario, timer y resumen).
- Spec: `docs/superpowers/specs/2026-10-24-132.2-entrenamiento-design.md`.
  Plan: `docs/superpowers/plans/2026-10-24-132.2-entrenamiento.md`.
- Mockups aprobados: `.superpowers/brainstorm/132.2-entrenamiento-20261024/content/`
  (`entrenamiento-q1-b-v3.html`, `entrenamiento-b2-estados-v4.html`, `entrenamiento-q1-v2.html`).

### 18.2 Sesión activa — tabla B2

```text
Sesión
[progreso 2 px · Volumen · Series · Ejercicios]
Ejercicio 2 de 5  ▰▰▱▱▱
Press banca  [PR 72,5]  ⋯
[banda de sugerencia]
#   KG   REPS   RPE   RIR   ✓
#1  60    8      7     3    ✓
#2  60    8      8     2    ✓
#3  62,5  6      8     2    ◯
#4  62,5  6      —     —    ◯
+ Añadir serie
Nota de sesión · Calculadora de discos
Descanso 01:12  ⏸ ↺ ⋯
+ Ejercicio                         Finalizar
```

- Una fila por serie, sin sub-fila. La grilla es `22px 1fr 1fr [40px RPE] [40px RIR] 30px`;
  las columnas de esfuerzo solo existen si el ajuste está encendido.
- RPE/RIR conservan inputs reales de 44 px y la cadena de foco peso → reps → RPE → RIR.
- Calentamiento: `CAL` en la columna `#`, RPE/RIR en `—`; no se mezcla con la numeración de trabajo.
- PR: pill verde en el encabezado y badge `PR` en la fila; el `e1RM` queda en el `aria-label`/técnica.
- Deload: pill en el encabezado, banner con `deloadBannerTexto` y peso actual + sugerido 90 %
  tachado en la celda de peso.
- Sugerencias: bandas hairline arriba de la tabla, con borde izquierdo semántico. Dorado para
  escalada/descanso/calentamiento; muted para consolidando/tope por PR/rendimiento; rojo solo para
  bajar peso. **Sin amarillo**: el verde sigue reservado a PR/logro.
- El `⋯` del ejercicio concentra técnica, calentamiento, finalizar y quitar. El `⋯` del header
  abre las acciones de sesión (salir). El `⋯` del descanso abre el sheet.
- El descanso es barra fija + sheet: Auto/recomendación, presets 30/60/90/120/3 m, sonido, vibración,
  pausa, reset y detener. Se retiró el anillo de sesión y la tarjeta inline: **no hay dos anillos**.
- `SessionSummaryView` usa el mismo lenguaje: héroe volumen/PR + stat row + hairline; conserva journal,
  share y skipped sets.

### 18.3 Detalle guardado — A · volumen

- Héroe: `VOLUMEN TOTAL` + número Oswald 300 54–56 px + fecha + pill `N PR`.
- Stat row: duración · series completadas/total · ejercicios. Sin tres tarjetas.
- Ejercicios en bloques hairline (`WorkoutExerciseBlock`), PR line verde, series compactas con
  RPE/RIR muted y check.
- Nota (`WorkoutNotePanel`) y diario (`SessionJournalSummary`) sin `panel-light`; el share se abre
  desde una fila hairline; eliminar es una fila ghost danger al final.

### 18.4 Calendario — A · historial

- Semana **lunes-primero**; el `startPad` es `(getDay() + 6) % 7`.
- Celdas circulares de 40 px (touch 44): disco dorado con intensidad por volumen; estrella verde
  en `done-scheduled`; anillo dorado en programados; punteado en futuros programados; anillo en hoy.
- Navegación solo por meses con datos, sin meses futuros; el mes vigente siempre existe.
- Debajo: `Entrenos · Volumen · Programa` y “Esta semana” (hechos + hoy, sin futuro).
- **Corrección de contexto:** `MonthCalendar` solo lo usa `CalendarioPage`; Inicio usa `WeekCalendar`.
  La nota anterior del plan que decía “comparte MonthCalendar con Inicio” era incorrecta.

### 18.5 Timer — A · anillo único

- Anillo de 214 px, trazo 5, tiempo Oswald 300 54 px y fase; un solo anillo.
- Chips de modo de 44 px, fila de stats (ronda · transcurrido · fase), play/pausa 64 px y
  reset/config ghost.
- Custom en bottom sheet (trabajo, descanso, rondas); al aplicar pasa a modo `Custom`.
- Trabajo dorado, descanso muted, últimos 3 s danger. **Sin verde/ámbar de fase.**

### 18.6 Verificación

- `npm test` **182 archivos / 1785 tests**; `npm run build` limpio.
- e2e: `test_f113_carrusel`, `test_f96_timer`, `test_f98_enter_chain`, `test_f98_delete`,
  `test_f63_suggestions`, `test_f118_sugerencia_alcanzable`, `test_f122_progresion_adaptativa`,
  `test_f93_t2_warmup_persist`, `test_calendario_nocturno` y `test_timer_nocturno` **ALL OK**.
- RDD assessment: medium / under_budget (`review_due: false`); sin revisión nativa obligatoria.


---

## 19. Rutinas — subpáginas (detalle, builder y planificador) · implementado 2026-10-25

### 19.1 Estado

- **Implementado y commiteado en la rama `132.3-rutinas`** (worktree `.worktrees/132.3-rutinas`), sin push.
- Commits: `7598d185` (detalle), `be8bf761` (builder), `2e5bf0ad` (planificador), `acd8c008` (pulido del review).
- Reviews nativos (medium, lentes readability + reliability): `review-0517425574d8af5b`,
  `review-3b9dbc6724c78c03`, `review-e81527bfd3d4ffd5` y `review-5f5354191860fb83`, todos
  **approved + acknowledged** (authority burned). Hallazgos informativos en el doc de tareas.
- Spec, decisiones del grilling y log: `odd/tasks/132-3-rutinas-nocturno.md`.
- Mockup aprobado: `.superpowers/brainstorm/132.3-rutinas-20261024/content/direcciones-v1.html`
  (3 grupos × 2 opciones: portada vs héroe tipográfico, filas compactas vs abiertas, wizard vs página única).

### 19.2 Detalle `/rutinas/:slug`

```text
[ portada 150 px · scrim + kicker objetivo·nivel · ★ 44 px ]
descripción (2 líneas)
───────────────────────────────
18 EJERCICIOS │ 3 DÍAS │ 41 MIN/DÍA
Push · Pull · Legs            ← TabNav compacto, nombre corto
Push (Pecho/Hombro/Tríceps)      4 ejercicios · ~41 min
01  Press de pecho con barra            4×8 · 120s
02  …
───────────────────────────────
Seguir programa                 3 días/semana
[L][M][X][J][V][S][D] → ghost «Seguir esta rutina»
Eliminar rutina (solo propias, ghost danger)
[ Empezar · ~41 min ]  ← barra fija + «Repetir última sesión»
```

- El título vive en el `AppHeader` sticky (SEO y contexto al scrollear); la portada lleva solo el
  kicker y la descripción, como la tarjeta del catálogo.
- Con un solo día no hay tabs: el panel del día se renderiza directo.
- Las filas conservan la virtualización (altura fija 46 px).

### 19.3 Builder `/rutinas/nueva` · `/rutinas/:slug/editar`

- Formulario hairline: nombre en Oswald 20, objetivo y nivel como filas con chevron y descripción
  en textarea transparente; el foco se marca con `focus-within:border-cta` (sin cajas).
- Días: índice `01` + nombre editable + grip de reorden + papelera.
- Ejercicios: fila de 44 px con `4×8 · 120s` y chevron; al tocarla se despliegan series, reps,
  descanso y superserie. **Una fila abierta por día** y se cierra al agregar, quitar o reordenar.
- Barra fija `Guardar rutina` / `Guardar cambios` sobre la TabBar.
- Se retira la virtualización de ítems del día (filas de altura variable); el acordeón no necesita
  virtualizar listas de 5–8 ejercicios.

### 19.4 Planificador `/rutinas/planificador`

- Progreso de 3 tramos + `Paso N de 3`; una pregunta por pantalla y avance al tocar.
- Opciones hairline de 56 px; la elegida queda con `aria-current` y acento al volver con «Atrás».
- Paso 3: días segmentados (2–6), duración en chips y `EquipmentFilter`.
- Resultado: secciones por día con músculos, `≈ N min` y cargas; aviso de cobertura como fila
  hairline; barra fija `Guardar como mi rutina` + «Empezar de nuevo».

### 19.5 Archivos

| Pieza | Archivo |
|---|---|
| Detalle | `src/pages/RutinaDetailPage.tsx`, `components/routines/RoutineHero.tsx`, `RoutineDayPanel.tsx`, `RoutineFollowCard.tsx`, `RepeatLastButton.tsx` |
| Portada compartida | `components/routines/routineMeta.ts` (`routineCover`) |
| Builder | `src/pages/RutinaBuilderPage.tsx`, `RoutineInfoForm.tsx`, `RoutineDayEditor.tsx`, `ExerciseItem.tsx` |
| Planificador | `src/pages/PlanificadorPage.tsx`, `PlanPreview.tsx`, `PlanDayCard.tsx`, `PlanCoverageNote.tsx` |
| Primitivas C1 | `components/stats/StatsStatRow.tsx`, `components/ui/TabNav.tsx` (compact) |
| i18n | `src/i18n/locales/{es,en}/routines.ts` |
| e2e | `tests/e2e/test_132_3_rutinas_{detalle,builder,planificador}.py` |

### 19.6 Follow-ups conocidos (informativos del review)

- `detalle-custom.png` en el e2e del detalle se captura después del borrado: renombrar o mover la
  captura antes del borrado.
- Los tres seeds de IndexedDB (`test_132_3_*`, `test_f88`, `test_f66_f67_planificador`) repiten el
  mismo bloque JS: extraer un helper `seed_meta(page, language=...)`.
- El e2e del planificador comprueba «sin paneles» por clases CSS (`.panel`/`.panel-light`) y usa
  regex de página completa; migrar a roles/estructura cuando se toque de nuevo.
- Las dos locales perdieron el BOM UTF-8 en el mismo commit que borró claves muertas (`dia`,
  `duracionEstimada`, `seguirProgramaDias`); no afecta el build ni los tests.

---

## 20. Actividad — logros, objetivos y wearables (implementado 2026-10-25)

### 18.1 Estado

`/logros`, `/objetivos` y `/wearables` migradas en la rama `132.4-actividad` (commits `b22b3914`, `c28f034b`, `b581c214`), pendientes de merge a `main` cuando las otras sesiones estén idle. Las tres reutilizan primitivas existentes (`FilterChips`, `BottomSheet`, `ConfirmSheet`, `EmptyState`, `Button`, `AchievementMedal`) y no tocan router, tokens ni dominio de datos.

### 18.2 Logros — vitrina

- Héroe: kicker «Colección», `X/36` en Oswald 46 y barra general (mismo `role=progressbar` + `data-progress="general"` de F95.3).
- Chips `Todos / Desbloqueados / Pendientes` con `FilterChips` (Todos por defecto, nunca persistido).
- Vitrina `grid-cols-2 sm:grid-cols-3`: medalla `sm` (48 px) + nombre 12 px + `×N` + barra de 2 px + «1 de 50». Bloqueados en `text-fg/80` (la medalla ya aplica grayscale).
- **Botón estirado**: el control accesible es un `<button aria-label={título}>` absoluto y hermano del contenido; el contenido visible es `pointer-events-none`. Motivo: un `<button>` con `aria-label` vuelve presentacionales a sus descendientes y ocultaría el `progressbar` (hallazgo R3-A11Y-PROGRESS del review).
- Sheet de detalle: descripción, condición, metal + estado + variante, barra de lectura (sin `data-progress` duplicado) y «conseguido N veces». Cierra con Escape, backdrop o botón.
- Contratos e2e: `data-achievement`, `data-progress="general"`/`"<id>"`, `data-tour="logros-medalla"` en la primera tarjeta renderizada, literal `X/36` y etiqueta «1 de 50» visible.

### 18.3 Objetivos — próximo hito

- Héroe = objetivo no alcanzado con menor `weeksToTarget` (desempate por mayor avance). Muestra `150 kg e1RM`, `112,5 → 150 kg`, pista de 2 px, `~75 semanas · fecha` y `+0,5 kg/semana`. Todos los pesos se convierten con `applyUnits`, se redondean a 1 decimal y se formatean con `formatNumber`; en kg el texto queda idéntico al anterior.
- Fallbacks: sin objetivos → estado vacío con CTA; objetivos sin series en 28 días → «Sin proyección todavía» + «Sin datos recientes» en la fila; todos proyectados y alcanzados → `N de N alcanzados` en verde.
- Filas: una por objetivo del store (`buildGoalRows`), con target, recorrido, pista, ETA y ritmo; los alcanzados en verde. Tocar la fila abre el sheet en edición; borrar vive dentro del sheet con `ConfirmSheet`.
- Sheet controlado por la página: el borrador (ejercicio + target en unidad del usuario) sube a `ObjetivosPage`; al abrir `ExercisePicker` el sheet se **desmonta** (picker `z-100`, sheet `z-120`) y vuelve con la selección.
- Se eliminaron `GoalSetter.tsx` y `GoalProjectionCard.tsx` (sin otros consumidores) y el autoenlace «Gestionar objetivos».
- Textos exactos preservados para F59: `150 kg e1RM`, `112,5 → 150 kg`, `~75 semanas · …`, `+0,5 kg/semana`, `¡Objetivo alcanzado! 150 kg`.

### 18.4 Wearables — estado vacío

- Provisional hasta que exista la integración de salud: anillo punteado de 116 px con `Watch`, «Nada que sincronizar todavía», una línea de contexto, dispositivos en chips 2×2 (`data-testid="wearables-devices"`, spans estáticos) y «Los datos de salud se leen en el dispositivo».
- Sin CTA, sin enlaces, sin permisos; `WEARABLE_DEVICES` no cambia. Contenido centrado en `max-w-md` para tablet.

### 18.5 Archivos

| Pieza | Archivo |
|---|---|
| Logros | `src/pages/AchievementsPage.tsx`, `src/components/achievements/AchievementTile.tsx`, `AchievementDetailSheet.tsx` |
| Objetivos | `src/pages/ObjetivosPage.tsx`, `src/components/goals/GoalHero.tsx`, `GoalRow.tsx`, `GoalSheet.tsx` |
| Wearables | `src/pages/WearableSyncView.tsx` |
| Dominio | `src/domain/achievements.ts` (`filterAchievementsByState`), `src/domain/goalProjection.ts` (`buildGoalRows`, `pickFeaturedGoal`, `isEveryGoalReached`, `goalProgressRatio`) |
| i18n | `src/i18n/locales/{es,en}/core.ts`, `stats.ts`, `features.ts` |
| Tests | `tests/unit/domain/achievements.test.ts`, `goalProjection.test.ts`, `tests/unit/components/achievementTile.test.tsx`, `goalHero.test.tsx`, `tests/e2e/test_f132_4_actividad.py`, `test_f59_objetivos.py` |

### 18.6 Follow-ups conocidos

- **Logros (review `review-dca8c277d0821526`):** R3-E2E-ALLOCATION y R3-E2E-VACUOUS (el e2e repite los mismos asserts en dos viewports y la aserción de pendientes puede satisfacerse con el chip/sección «Pendientes»); R3-WEAK-SELECTOR (afirmar el contrato del botón de la tarjeta); R3-DOMAIN-ORDER (el caso `locked` del test de filtro no fija el orden exacto).
- **Objetivos (review `review-0be234602b58d558`):** R3-goal-persistence-untested (recargar tras guardar/borrar), R3-goal-unit-save-untested (guardar en lb y verificar el kg persistido), R3-goalsheet-catalog-save (un objetivo cuyo ejercicio no está en el catálogo no se puede editar porque Save se gatea en `exercise`), R3-goalsheet-invalid-paths (tests de los caminos inválidos/cancel del sheet), R3-home-goals-coverage-removed (smoke de Home tras eliminar `GoalProjectionCard`), R3-hero-test-implementation-centric y R3-source-regex-brittle (tests).
- **Wearables (review `review-575c75e5ee6c60fe`):** R3-wearables-screenshot (el screenshot del e2e se toma después de navegar a wearables), R3-vacuous-absence-checks, R3-unasserted-new-copy y R3-fixed-test-sleep (tests).
- **Modal global de logros** (`AchievementModal`): sigue con el lenguaje anterior; se rediseña con su propia fase.
## 21. Cuerpo y progreso — F132.5 · implementado 2026-10-24

### 21.1 Estado

- Mergeado en `main` el **2026-10-25** (tip `49216fb8`; worktree cerrado). Sin push.
  Spec y log: `odd/tasks/cuerpo-progreso.md`; mockup aprobado:
  `.superpowers/brainstorm/cuerpo-progreso-20261024/content/cuerpo-progreso-v1.html`.
- Los seis candidatos de código dieron `review_due: false` (`medium / under_budget`); no se abrió
  ciclo nativo. Verificación post-rebase: `npm test` **192 archivos / 1836 tests**, `npm run build`
  limpio y e2e F132.5 + F106.1/F106.2/F120W5/F93#5 ALL OK.

### 21.2 Decisiones cerradas (grilling 2026-10-24)

| # | Decisión | Respuesta |
|---|---|---|
| Q1 | Navegación | `/cuerpo` suma dos filas a peso y fotos; sin ruta hub nueva. |
| Q2 | Mapa | Fatiga, escala neutro → dorado → rojo; verde reservado a meta/PR. |
| Q3 | Registro de peso | Inline, sin sheet. |
| Q4 | Héroe del peso | Último registro del rango + delta del rango (30 d por defecto). |
| Q5 | Rango | 30/90/Todo filtra héroe, gráfica, stats e historial. |
| Q6 | Fotos | Última sesión de tres ángulos como héroe + slots «Hoy». |
| Q7 | Comparar | Dividida/alternar + delta de peso A→B si ambas fechas tienen registro. |

### 21.3 Anatomía

**Peso (`/peso-corporal`)**

```text
kicker CUERPO · título Peso corporal
rango 30 d · 90 d · Todo
héroe: último registro + 78.4 kg + delta del rango
hairline
registrar hoy: input vacío + Guardar/Actualizar
hairline
evolución: área 110 px, 3 marcas por eje, stats Mín./Máx./Cambio
historial: filas hairline de 46 px + Ver más (10)
```

**Cuerpo (`/cuerpo`)**

- Héroe visual: `MuscleDummy` redibujado (silueta + regiones orgánicas), selector Frente/Espalda de
  44 px, leyenda de cinco niveles y resumen `fatigueCounts` («3 recuperados · 1 activo · …»).
- Detalle: nombre localizado, estado + días desde el último entreno, hasta 5 ejercicios y «Ver
  biblioteca». Sin selección, hint. Filas finales a `/peso-corporal` y `/progreso-fotos`.
- `MuscleDummy` conserva las props (`fatigue`, `view`, `selected`, `onSelect`, `highlight`,
  `showLegend`) para `ExerciseMuscleCard`; el grupo seleccionado va en `gold-bright`.
- `FATIGUE_HEAT_COLORS` y `fatigueColorClass` se alinean a la escala nueva.

**Fotos (`/progreso-fotos`)**

- Héroe: última fecha con frente/lateral/espalda en 3:4; meta `N ángulos · N fotos · N fechas`.
- «Hoy»: tres slots de 64 px con miniatura/reemplazo; web `input[type=file]`, nativo
  `PhotoSourceSheet`.
- Timeline: filas de 64 px con `data-photo-date`, tres miniaturas y `Ver más`; sheet por fecha con
  guardar en galería (`data-action="save-gallery"`) y eliminar (`data-action="delete-date"`).

**Comparar (`/progreso-fotos/comparar`)**

- A/B por defecto: A = fecha más antigua, B = más reciente (el delta se lee como progreso).
- Dos `<select>` nativos invisibles sobre filas hairline (accesibles y e2e), ángulo/modo en
  segmentados de 44 px, dividida/alternar y badge `A ·`/`B ·`.
- `CompareWeightDelta` solo se renderiza si `weightDeltaBetween` devuelve ambas fechas.

### 21.4 Archivos

| Pieza | Archivo |
|---|---|
| Peso | `pages/PesoCorporalPage.tsx`, `components/body-log/WeightHero.tsx`, `WeightEvolution.tsx`, `WeightHistoryTimeline.tsx` |
| Cuerpo | `pages/CuerpoPage.tsx`, `components/body/MuscleDummy.tsx`, `CuerpoSelected.tsx`, `CuerpoLinks.tsx`, `fatigueLabels.ts` |
| Fotos | `pages/ProgressPhotosPage.tsx`, `components/photos/ProgressPhotosHero.tsx`, `ProgressPhotosCapture.tsx`, `ProgressPhotosTimeline.tsx`, `PhotoDateSheet.tsx` |
| Comparar | `pages/ProgressPhotosComparePage.tsx`, `ProgressPhotosCompareRoute.tsx`, `components/photos/CompareWeightDelta.tsx` |
| Dominio | `domain/bodyProgress.ts` (`weightSummary`, `weightDeltaBetween`, `fatigueCounts`, `sortPhotosByDateDesc`, `countPhotoAngles`) |
| i18n / help | `i18n/locales/{es,en}/core.ts`, `features.ts`, `help.ts`; `i18n/help.ts` (`cuerpoFatiga`) |
| Tests | `tests/unit/domain/bodyProgress.test.ts`, `tests/unit/components/{body,photos}/*`, `tests/e2e/test_f132_5_cuerpo_progreso.py` |

### 21.5 Follow-ups

- El smoke `test_f103_smoke.py` falla en el reset de DB también en `main` (pre-existente); no es de
  F132.5. `test_f93_t23_inputs.py` pasa en `/peso-corporal` y conserva fallas ajenas en agua/medidas.
- Las fechas relativas del comparador usan días («296 days ago»); para fotos viejas convendría
  semanas/meses en una próxima pasada.
- `FATIGUE_HEAT_COLORS` (maniquí 3D) quedó alineado a la escala nueva aunque hoy no tenga consumidor
  directo.
## 22. Nutrición y Suplementos — F132.6 · implementado 2026-10-25

### 22.1 Estado

- Rama `132.6-nutricion` (worktree `.worktrees/132.6-nutricion`), commits `34898df5` (dominio),
  `f69ba505` (nutrición), `ce0aa5fb` (suplementos) y `c075bf42` (e2e). **Sin push ni merge.**
- Spec y log: `odd/tasks/132-6-nutricion.md`; mockup aprobado:
  `.superpowers/brainstorm/132.6-nutricion-20261025/content/nutricion-suplementos-v1.html`.
- Verificación: `npm test` **199 archivos / 1864 tests**, `npm run build` limpio, e2e nuevo
  `test_f132_6_nutricion.py` (375 y 768) **ALL OK**; `test_f76`, `test_f77`,
  `test_f93_t14_redesign` y `test_supplements_seed` (preview) **ALL OK**.

### 22.2 Decisiones cerradas (grilling 2026-10-25)

| # | Decisión | Respuesta |
|---|---|---|
| Q1 | Objetivo calórico ausente | Estado honesto: sin anillo de progreso, «Sin objetivo diario» y link a Perfil. Se elimina el default `tdee = 2200`. |
| Q2 | Porcentaje de macros | Reparto de las kcal consumidas (`P×4 + C×4 + G×9`, suma 100 %); no se inventan metas de macros. |
| Q3 | Tabs por comida | Filtran una sola comida; el tab muestra su subtotal y el alta carga en esa comida. |
| Q4 | Alta de comida | Bottom sheet que queda abierto tras agregar, con búsqueda y selección limpias. |
| Q5 | Suplementos | Frecuencia en texto neutro; verde solo para «tomado»; chips de filtro sin color. |

### 22.3 Anatomía

**Nutrición (`/nutricion`)**

```text
kicker HOY · título Nutrición
héroe: anillo 142 px + consumido + objetivo/restantes (o «Sin objetivo diario» + Perfil)
macros: Proteína / Carbohidratos / Grasa, gramos + barra 2 px + % de las kcal
hairline
tabs: Desayuno / Almuerzo / Cena / Snack con subtotal o «—»
sección: comida + subtotal + cantidad + «Agregar a {comida}»
filas: nombre, gramos · P · C · G, kcal, borrar 44 px
```

**Suplementos (`/suplementos`)**

```text
kicker SALUD · título Suplementos · «+» 44 px
héroe: X/N tomados + pendientes + barra 2 px
chips: Todos / Diario / Pre-entreno / Post-entreno / Semanal (scroll horizontal)
filas: check 44 px (verde solo tomado) + nombre + dosis + frecuencia + borrar
```

- El alta de comida y la de suplemento comparten `BottomSheet` (foco inicial, Escape y backdrop).
- Los estados vacíos son reales: «Sin comidas registradas», «Sin objetivo diario» y
  «Sin suplementos»; el filtro sin filas dice «No hay suplementos en esta frecuencia».
- El check de suplemento conserva el contrato actual de `lastCheckedAt` (fecha UTC); el
  follow-up de zona horaria queda anotado.

### 22.4 Archivos

| Pieza | Archivo |
|---|---|
| Nutrición | `src/pages/NutritionPage.tsx`, `src/components/nutrition/{NutritionHero,MealTabs,MealList,AddFoodSheet,FoodAdder,CustomFoodForm,FoodResultsList}.tsx` |
| Suplementos | `src/pages/SupplementsPage.tsx`, `src/components/supplements/{SupplementsHero,SupplementRow,AddSupplementSheet}.tsx` |
| Dominio | `src/domain/nutrition.ts` (`calculateMacroShares`), `src/domain/supplements.ts` (`todayAdherence`) |
| i18n | `src/i18n/locales/{es,en}/nutrition.ts` |
| Tests | `tests/unit/domain/{nutrition,supplements}.test.ts`, `tests/unit/components/nutrition/*`, `tests/unit/components/supplements/*`, `tests/e2e/test_f132_6_nutricion.py` |

### 22.5 Follow-ups conocidos

- `isCheckedToday` compara la fecha UTC del timestamp; en zonas con cambio de día puede marcar
  como «ayer» una toma de las últimas horas. Se deja igual para no migrar datos existentes.
- El alta de comida no permite editar gramos de una entrada ya guardada (solo borrar), igual que
  el comportamiento anterior.
- La lista de resultados del buscador se limita a 15 alimentos; el catálogo completo sigue
  disponible escribiendo una búsqueda más específica.


