# F119 — Tarjeta de rutina: layout estable con nombres largos — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la tarjeta de rutina del catálogo (`/rutinas`) sea estable con cualquier longitud de nombre: todas las cards del mismo alto, la estrella de favorito siempre adentro y en el mismo punto, y el título hasta 2 líneas con «…» cuando excede.

**Architecture:** Fix de layout mínimo en `src/index.css` (`min-width: 0` en el link; `.routine-card__title` a ancho completo con clamp de 2 líneas; `.routine-card__badges` en fila propia sin wrap con truncado; `min-height` uniforme de 7.5rem + `contain-intrinsic-size` alineado) + reestructura menor de `RoutineCard.tsx` (dos spans nuevos, sin cambios de props). Cero cambios de dominio, datos o i18n. Los criterios quedan congelados por un e2e nuevo (TDD: rojo → verde).

**Tech Stack:** Vite + React + TypeScript, Tailwind CSS v4 + CSS propio (`src/index.css`), Playwright (librería Python) para e2e. No hay unit tests para esto (es layout; Vitest no tiene DOM en este repo).

**Spec:** `docs/superpowers/specs/2026-10-01-f119-tarjeta-rutina-layout-design.md` (commit `91cbadd`)

**Precondición de ejecución:** directorio normal `C:\Users\Yves De Faria\Desktop\ProyectoGymLab\gymlab-app` (sin worktree: el usuario no pidió aislamiento). **Sesión compartida**: hay otro worktree activo (`f103`) y archivos ajenos sin commitear en el árbol — **nunca** `git add -A`/`git add .`/`git stash`; stage de rutas exactas, verificar `git diff --cached --name-only` antes de cada commit y commitear de inmediato (el índice es compartido). Antes de la Task 1, el orquestador commitea **este plan** + la sección F119 de `PLAN.md` con un commit `docs:` propio, sin mezclarlo con código.

**Referencia obligatoria:** el prototipo medido que validó este diseño vive en `C:\Users\Yves De Faria\AppData\Local\Temp\opencode\probe_design_v3.py` (temporal, **no se commitea**) — su `MEASURE_JS` es el origen del helper del e2e de la Task 1.

## Estado de avance

- [ ] Task 1 — e2e rojo + fix (`RoutineCard.tsx` + `index.css` + `test_f119_rutina_card.py`)
- [ ] Task 2 — Regresión + cierre (`PLAN.md`/`CHANGELOG.md`/`COMPLETED.md` + verificación)

(El orquestador marca cada casilla en el mismo commit de cierre de la tarea.)

## Global Constraints

Copiadas de la spec (`2026-10-01-f119-tarjeta-rutina-layout-design.md`) y de `gymlab-app/AGENTS.md`. Aplican a **todas** las tareas.

- **Mobile-first**: el e2e mide a **360×800** (más angosto que 375: caso peor). Touch targets ≥ 44×44 px: la estrella conserva su área expandida (`after:-inset-1`, 48 px) — no se toca.
- **Cero cambios de datos/dominio/i18n**: sin claves nuevas, sin tocar `useRoutineFavorites`, `routineRepo` ni el store. Solo CSS + presentación en `RoutineCard`.
- **Accesibilidad preservada**: el texto completo del título y los badges permanece en el DOM (el clamp/ellipsis es visual); `aria-pressed` y `aria-label` del botón de favorito intactos.
- **`npm run build` es el typecheck REAL** (`tsc -b`); **nunca** usar `npx tsc --noEmit` como evidencia (falso verde).
- Antes de cada commit: `npm run build` limpio + `npm test` verde + `npm run lint` sin hallazgos.
- **Ciclo RDD antes de cada commit** (implementar → normalizar → verificar → review → commit): `gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition` y rutear **solo** desde `next_transition`. El review es informativo: no autoriza push. Si el transporte devuelve vacío (cap de 32k de OpenCode), usar la vía CLI del doc `C:\Users\Yves De Faria\.gentle-ai\opencode-output-cap-fix.md`.
- **Un commit por tarea**, mensaje convencional, **stage de rutas exactas**, **sin push**.
- **Emulador (recomendado, no obligatorio)**: cambio visual web puro; smoke de cierre en el WebView (receta en `AGENTS.md`; criterio `root.children.length > 0`, texto visible, **0 `pageerror`**). Si se omite, decirlo honestamente en el cierre.
- **Temporales fuera del repo**: los probes/screenshots viven en `%TEMP%\opencode` y no se commitean.

## Estructura de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `tests/e2e/test_f119_rutina_card.py` | Crear | Congela los criterios: alturas uniformes, estrella en el mismo punto y clickeable, clamp de 2 líneas, 0 desborde, 0 pageerror |
| `src/index.css` | Modificar | Fix raíz (`min-width: 0` en el link), `.routine-card__title` (clamp 2), `.routine-card__badges` (fila propia con truncado), `min-height` uniforme + `contain-intrinsic-size` |
| `src/components/routines/RoutineCard.tsx` | Modificar | Spans nuevos `routine-card__title` / `routine-card__badges` (sin `truncate`/`shrink-0`; props intactas) |
| `PLAN.md` | Modificar | Marcar F119 implementada al cerrar |
| `CHANGELOG.md` | Modificar | Entrada de F119 bajo `[Unreleased] > Fixed` |
| `COMPLETED.md` | Modificar | Fila 119 al archivar (la sección sale de `PLAN.md`) |

---

### Task 1: e2e rojo + fix

**Files:**
- Create: `tests/e2e/test_f119_rutina_card.py`
- Modify: `src/index.css`
- Modify: `src/components/routines/RoutineCard.tsx`

**Interfaces:**
- Produces: helper `MEASURE_JS(title)` con el contrato de medición (`found`, `cardH`, `cardRight`, `cardOverflowX`, `starX`, `starRight`, `starRelY`, `titleLines`, `titleClamped`, `linkOverflowX`) — lo consume el propio test; ninguna otra tarea depende de él.
- Consumes: nada de tasks previas (es la primera). El prototipo `probe_design_v3.py` (temporal) ya validó los valores esperados.

- [ ] **Step 1: Escribir el e2e que falla (RED)**

Crear `tests/e2e/test_f119_rutina_card.py` con este contenido completo:

```python
"""F119: la tarjeta de rutina es estable con nombres largos.

Fija los criterios del diseño (spec 2026-10-01-f119-tarjeta-rutina-layout-design.md)
midiendo /rutinas a 360x800 con 4 rutinas sembradas (larga / media / corta / clon):

- todas las cards miden lo mismo (altura uniforme);
- la estrella de favorito está adentro de la card y en la MISMA posición en todas;
- el título clampa a <= 2 líneas y muestra «...» cuando excede;
- ni la card ni el badge «Basada en ...» desbordan en horizontal;
- click real en la estrella togglea aria-pressed;
- 0 pageerror.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TITLES = {
    "larga": "Full Body Hipertrofia Avanzada con Fuerza y Volumen Extremo Semanal",
    "media": "Torso Superior Hipertrofia y Fuerza",
    "corta": "Pierna A",
    "clon": "Pierna B",
}

SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['routines', 'meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.objectStore('routines').put({ id: 10001, slug: 'custom-larga', title: 'Full Body Hipertrofia Avanzada con Fuerza y Volumen Extremo Semanal', objective: 'fuerza', level: 'intermedio', description: '', daysCount: 3, isCustom: true });
    tx.objectStore('routines').put({ id: 10002, slug: 'custom-corta', title: 'Pierna A', objective: 'fuerza', level: 'principiante', description: '', daysCount: 3, isCustom: true });
    tx.objectStore('routines').put({ id: 10003, slug: 'custom-clon', title: 'Pierna B', objective: 'fuerza', level: 'principiante', description: '', daysCount: 3, isCustom: true, basedOnId: 10001 });
    tx.objectStore('routines').put({ id: 10004, slug: 'custom-media', title: 'Torso Superior Hipertrofia y Fuerza', objective: 'fuerza', level: 'intermedio', description: '', daysCount: 4, isCustom: true });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Mide la card que contiene `title`: geometria de card/boton, clamp del titulo y desbordes.
# El titulo se localiza como primer hijo de la fila (existe antes y despues del fix).
MEASURE_JS = """(title) => {
  const cards = [...document.querySelectorAll('.routine-card')];
  const card = cards.find((c) => c.textContent.includes(title));
  if (!card) return { found: false };
  const q = (sel) => card.querySelector(sel);
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), h: +b.height.toFixed(1), right: +b.right.toFixed(1) }; };
  const link = q('.routine-card__link');
  const titleEl = q('.routine-card__row > span:first-child');
  const btn = q('button[aria-pressed]');
  const cardBox = r(card);
  const btnBox = r(btn);
  const line = titleEl ? parseFloat(getComputedStyle(titleEl).lineHeight) : 0;
  return {
    found: true,
    cardH: cardBox.h,
    cardRight: cardBox.right,
    cardOverflowX: card.scrollWidth - card.clientWidth,
    starX: btnBox.x,
    starRight: btnBox.right,
    starRelY: +(btnBox.y - cardBox.y).toFixed(1),
    titleLines: line ? +(titleEl.getBoundingClientRect().height / line).toFixed(2) : null,
    titleClamped: titleEl.scrollHeight > titleEl.clientHeight + 1,
    linkOverflowX: link.scrollWidth - link.clientWidth,
  };
}"""


def boot(page):
    # `load` + esperas explicitas: networkidle puede colgarse con el websocket de HMR en frio.
    page.goto(BASE, wait_until="load", timeout=60000)
    page.wait_for_timeout(1000)
    assert page.evaluate(SEED_JS) is True, "seed fallo"
    page.reload(wait_until="load", timeout=60000)
    page.wait_for_timeout(1200)
    skip = page.locator("button", has_text="Ya entreno aquí")
    if skip.count() > 0:
        skip.first.click(timeout=5000)
        page.wait_for_timeout(600)
    dialog = page.locator('[role="dialog"]')
    if dialog.count() > 0:
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)


def main() -> int:
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 360, "height": 800})
        page_errors = []
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        boot(page)
        page.goto(f"{BASE}/rutinas", wait_until="load", timeout=60000)
        page.wait_for_timeout(1200)
        # El tip de seccion ("Entendido") tapa las cards de abajo: cerrarlo antes de medir.
        tip = page.locator("button", has_text="Entendido")
        if tip.count() > 0:
            tip.first.click()
            page.wait_for_timeout(400)

        data = {}
        for key, title in TITLES.items():
            data[key] = page.evaluate(MEASURE_JS, title)
            if not data[key].get("found"):
                errors.append(f"{key}: no se encontro la card de «{title}»")

        if not errors:
            heights = [d["cardH"] for d in data.values()]
            if max(heights) - min(heights) > 1:
                errors.append("alturas desiguales: " + str({k: v["cardH"] for k, v in data.items()}))
            for key, d in data.items():
                if d["cardH"] < 108 or d["cardH"] > 140:
                    errors.append(f"{key}: altura de card fuera de rango: {d['cardH']}px")
                if d["starRight"] > d["cardRight"] + 0.5:
                    errors.append(f"{key}: la estrella desborda la card (right {d['starRight']} > {d['cardRight']})")
                if d["cardOverflowX"] > 0:
                    errors.append(f"{key}: desborde horizontal de la card: {d['cardOverflowX']}px")
                if d["linkOverflowX"] > 0:
                    errors.append(f"{key}: el link desborda: {d['linkOverflowX']}px")
                if d["titleLines"] is None or d["titleLines"] > 2.01:
                    errors.append(f"{key}: el titulo supera 2 lineas ({d['titleLines']})")

            xs = {d["starX"] for d in data.values()}
            ys = {d["starRelY"] for d in data.values()}
            if max(xs) - min(xs) > 0.5 or max(ys) - min(ys) > 0.5:
                errors.append(f"la estrella no esta en el mismo punto en todas: x={sorted(xs)} y={sorted(ys)}")

            if not data["larga"]["titleClamped"]:
                errors.append("larga: el titulo largo no activa la elipsis (clamp inactivo)")

            # Click real en la estrella de la card larga: togglea aria-pressed.
            btn = page.locator('.routine-card', has_text=TITLES["larga"]).locator('button[aria-pressed]').first
            before = btn.get_attribute("aria-pressed")
            btn.click(timeout=5000)
            page.wait_for_timeout(500)
            after = btn.get_attribute("aria-pressed")
            if before == after:
                errors.append(f"click en la estrella no togglea aria-pressed ({before} -> {after})")

        if page_errors:
            errors.append(f"pageerror: {page_errors}")

        browser.close()

    if errors:
        print(f"FALLO ({len(errors)}):")
        for err in errors:
            print(" -", err)
        return 1
    print("ALL OK: F119 tarjeta de rutina estable con nombres largos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Correr el e2e y verificar que falla (RED)**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f119_rutina_card.py`

Expected: `FALLO (N):` con, al menos, estos errores (medidos en el prototipo antes del fix):

- `larga: la estrella desborda la card (right 627.0 > 344.0)` y `media: … (right 359.1 > 344.0)`
- `larga: desborde horizontal de la card: 290px`, `media: … 62px`, `clon: … 182px`
- `la estrella no esta en el mismo punto en todas: x=[297.0, 359.1, 586.5] …`
- `larga: el titulo largo no activa la elipsis (clamp inactivo)`

**No commitear en rojo**: el test viaja en el mismo commit que el fix (Step 6).

- [ ] **Step 3: Aplicar el fix de CSS (`src/index.css`)**

**3a.** En el bloque `.routine-card` (alrededor de la línea 403), cambiar `contain-intrinsic-size: 0 8.5rem;` por:

```css
    contain-intrinsic-size: 0 7.5rem;
    /* F119: altura uniforme de la tarjeta (caso peor: título de 2 líneas + badges + meta). */
    min-height: 7.5rem;
```

**3b.** En el bloque `.routine-card__link` (alrededor de la línea 497), agregar `min-width: 0;` (el fix raíz):

```css
  .routine-card__link {
    position: relative;
    z-index: 3;
    display: flex;
    flex: 1;
    /* F119: sin esto, el min-content del título nowrap estira el link y expulsa la estrella. */
    min-width: 0;
    align-items: center;
    gap: 0.75rem;
    min-height: 6.75rem;
    padding: 0.85rem 0.5rem 0.85rem 1rem;
  }
```

**3c.** En el bloque `.routine-card__row` (alrededor de la línea 529), compactar el gap vertical y agregar las dos reglas nuevas debajo del bloque:

```css
  .routine-card__row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    /* F119: el título va en su propia fila; se compacta el gap vertical para que
       el caso peor (2 líneas + badges + meta) entre exacto en los 7.5rem. */
    row-gap: 0.15rem;
  }

  /* F119: título a ancho completo, hasta 2 líneas con "…". Reemplaza al `truncate`
     de 1 línea, que además nunca se activaba (arrastraba el ancho del link). */
  .routine-card__title {
    min-width: 0;
    flex-basis: 100%;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: normal;
  }

  /* F119: badges en fila propia sin wrap; cada badge puede encogerse y truncar,
     así el "Basada en {título}" largo nunca desborda la tarjeta. */
  .routine-card__badges {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.4rem;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }

  .routine-card__badges > span {
    min-width: 0;
    flex-shrink: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
```

- [ ] **Step 4: Reestructurar la fila en `src/components/routines/RoutineCard.tsx`**

En el JSX del bloque `routine-card__row` (líneas ~57-75), reemplazar el título y envolver los badges. El bloque queda así (nota: se quita `block truncate` del título y `shrink-0` de los badges; las clases de color/tipografía no cambian):

```tsx
        <span className="routine-card__content">
          {/* F119: título a ancho completo (hasta 2 líneas con «…») + badges en fila propia con truncado. */}
          <span className="routine-card__row">
            <span className="routine-card__title font-display text-base font-semibold text-fg">{localized.title}</span>
            <span className="routine-card__badges">
              <span className={`rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-wide ${OBJECTIVE_COLORS[routine.objective]}`}>
                {localizeObjective(routine.objective, lang)}
              </span>
              {isActive ? (
                <span className="rounded-full border border-cta bg-cta/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-accent-soft">
                  {t('rutinas.activa')}
                </span>
              ) : badge ? (
                <span className="rounded-full border border-cta bg-cta/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-accent-soft">
                  {badge}
                </span>
              ) : solo ? (
                <span className="rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-success">
                  {t('rutinas.sesionSuelta')}
                </span>
              ) : null}
            </span>
          </span>
          <span className="block text-xs text-muted">
```

(El resto del componente — link, icono, chevron, botón de favorito, img — no se toca.)

- [ ] **Step 5: Correr el e2e y verificar que pasa (GREEN)**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f119_rutina_card.py`

Expected: `ALL OK: F119 tarjeta de rutina estable con nombres largos`

Valores de referencia medidos en el prototipo (con el fix aplicado): las 4 cards a **120px** de alto, estrella en **x=297.0** y **offset 40px** en todas, `titleLines` 2/2/1/2 con clamp solo en la larga, `cardOverflowX` 0 en las 4.

- [ ] **Step 6: Verificación completa + review + commit**

```powershell
npm run build   # typecheck real (tsc -b); esperado: limpio
npm test        # suite completa; esperado: verde
npm run lint    # esperado: sin hallazgos nuevos
```

Después, **ciclo RDD antes de commitear** (el candidato es el diff del workspace): `gentle-ai review status --cwd . --contract gentle-ai.review-integration/v2 --agent opencode --next-transition` — rutear solo desde `next_transition`; si el transporte devuelve vacío, vía CLI documentada.

Commit (rutas exactas, verificar staged antes):

```powershell
git add src/index.css src/components/routines/RoutineCard.tsx tests/e2e/test_f119_rutina_card.py
git diff --cached --name-only   # exactamente esos 3 archivos
git commit -m "fix: tarjeta de rutina estable con nombres largos (F119)"
```

---

### Task 2: Regresión + cierre

**Files:**
- Modify: `PLAN.md`
- Modify: `CHANGELOG.md`
- Modify: `COMPLETED.md`

**Interfaces:**
- Consumes: el fix verde de la Task 1.
- Produces: F119 cerrada en el plan maestro y el changelog.

- [ ] **Step 1: Regresión e2e de las superficies que usan el catálogo**

```powershell
python tests/e2e/scripts/with_server.py tests/e2e/test_f47.py
python tests/e2e/scripts/with_server.py tests/e2e/test_f66_f67_planificador.py
python tests/e2e/scripts/with_server.py tests/e2e/test_f88.py
```

Expected: los tres `ALL OK` (tocan `/rutinas`: favoritos, badge de rutinas propias y clonado/edición).

- [ ] **Step 2 (opcional recomendado): smoke en emulador**

Receta de `AGENTS.md` (sync → gradle → install → CDP). Criterio: `root.children.length > 0`, texto visible, **0 `pageerror`**, `/rutinas` con las cards renderizadas. Si se omite, anotarlo en el cierre.

- [ ] **Step 3: `CHANGELOG.md` bajo `[Unreleased] > Fixed`**

```markdown
- **La tarjeta de rutina es estable con nombres largos (F119, `fix`)**: la card del catálogo ya no desplaza la estrella de favorito fuera de la tarjeta (quedaba inaccesible con nombres largos o medios) ni desborda en horizontal: `.routine-card__link` suma `min-width: 0` (el estirado lo causaba el `min-content` del título `nowrap`), el título pasa a ancho completo con hasta 2 líneas y «…» (`routine-card__title`), los badges van a una fila propia sin wrap con truncado (`routine-card__badges` — cubre también el «Basada en {título}» de los clones, que desbordaba 182px) y todas las cards quedan con la misma altura (`min-height: 7.5rem`, estrella en el mismo punto). Verificado: e2e nuevo `test_f119_rutina_card.py` (alturas uniformes, estrella en posición idéntica y clickeable, clamp de 2 líneas, 0 desborde, 0 `pageerror`), `npm test`, `npm run build` y `npm run lint`, más regresión de `test_f47.py`/`test_f66_f67_planificador.py`/`test_f88.py`.
```

- [ ] **Step 4: Marcar F119 en `PLAN.md`**

En la sección `## Fase 119 — Tarjeta de rutina: layout estable con nombres largos`: cambiar `— PENDIENTE` por `— IMPLEMENTADA ✅` y marcar `119.1` y `119.2` con `[x]` (sin borrar la sección todavía).

- [ ] **Step 5: Review + commit de cierre**

Ciclo RDD (son docs: un edit pasivo puede saltarse con readback estructural — decisión del orquestador) y:

```powershell
git add PLAN.md CHANGELOG.md
git diff --cached --name-only   # exactamente esos 2 archivos
git commit -m "docs: cierra F119 (layout de la tarjeta de rutina) en PLAN.md y CHANGELOG"
```

- [ ] **Step 6: Archivar F119 en `COMPLETED.md`**

Agregar la fila al final de la tabla de la era correspondiente en `COMPLETED.md`:

```markdown
| 119 | Tarjeta de rutina: layout estable con nombres largos | La card del catálogo deja de romperse con nombres largos: `min-width: 0` en `.routine-card__link` (fix raíz del estirado por el `min-content` del título `nowrap`), título a ancho completo con hasta 2 líneas y «…» (`routine-card__title`), badges en fila propia sin wrap con truncado (`routine-card__badges`, cubre el «Basada en {título}» de los clones) y altura uniforme de todas las cards (`min-height: 7.5rem`) con la estrella en el mismo punto. Verificado con prototipo medido en vivo + e2e `test_f119_rutina_card.py` (alturas iguales, estrella idéntica y clickeable, clamp, 0 desborde, 0 pageerror), `npm test`/`npm run build`/`npm run lint` y regresión de f47/f66_f67/f88. Commit `<hash>`. |
```

Quitar la sección `## Fase 119 …` de `PLAN.md` (ya archivada) y commitear:

```powershell
git add PLAN.md COMPLETED.md
git diff --cached --name-only
git commit -m "docs: archiva F119 (layout de la tarjeta de rutina) en COMPLETED.md"
```

---

## Self-review (hecho al escribir este plan)

- **Cobertura de la spec**: fix raíz (3b), título clamp-2 (3c/4), badges fila propia con truncado (3c/4), altura uniforme + `contain-intrinsic-size` (3a), estrella en el mismo punto (verificado por el e2e), accesibilidad preservada (Global Constraints), verificación (Task 1 Steps 5-6 + Task 2). ✔
- **Placeholders**: ninguno; todos los pasos traen código o comandos exactos. ✔
- **Consistencia de nombres**: `routine-card__title`, `routine-card__badges` y `MEASURE_JS` se usan con el mismo nombre en CSS, TSX y test. ✔
