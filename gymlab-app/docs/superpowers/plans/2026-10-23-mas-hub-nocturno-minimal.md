# Hub «Más» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el hub `/mas` por un índice agrupado de una sola vista, con bloque de cuenta como héroe, 17 filas y sin toggle rejilla/lista.

**Architecture:** La página deja de derivar su layout de `settings.hubLayout` y pasa a ser una composición fija: `AppHeader` → bloque de cuenta (enlace a `/perfil`) → `<nav data-tour="mas-links">` con cuatro secciones + fila final de Ajustes. Los datos de la cuenta salen de hooks existentes (`useProfileName`, `useAvatar`, `useActiveProgram`, `usePeriodization`). No hay estado propio ni persistencia.

**Tech Stack:** React 18 + TypeScript, react-router-dom, react-i18next, Tailwind v4, lucide-react. Tests e2e con la librería Python de Playwright.

**Spec:** `gymlab-app/docs/superpowers/specs/2026-10-23-mas-hub-nocturno-minimal-design.md`

## Global Constraints

- Una sola vista: no hay toggle, no hay `settings.hubLayout`.
- 17 filas + bloque de cuenta; `Papers` no aparece.
- `data-tour="mas-links"` se conserva en el `<nav>` (paso 13 del tour).
- Touch targets ≥ 44 px; foco visible; iconos `aria-hidden`.
- i18n es/en en espejo (`EsSchema`); el default del producto es inglés.
- Solo tokens de tema (`text-fg`, `text-muted`, `gold`, `border/40`); nada de hex sueltos.
- Sin `prefers-reduced-motion` nuevo: se reutiliza `stagger-fade`.
- Un solo escritor; stagear rutas exactas; commit sin push.

## Review Focus

- **Instalación nueva sin nombre ni plan:** el hub debe mostrar «Tu cuenta» y «Ver perfil», nunca vacío ni `undefined`. Test en Task 1 (T10, contexto limpio).
- **Textos largos a 320 px** (nombre, nombre de plan): deben truncar sin overflow horizontal. Test en Task 1 (T11, 320×700).
- **Datos parciales** (plan de periodización sin programa, o al revés): la línea de contexto cae al siguiente caso, no rompe. Test en Task 1 (T10).
- **Regresión de navegación:** `/calculadoras` sigue siendo alcanzable y `Papers` sigue ausente. Test en Task 1 (T10).
- **Tema día con paleta no nocturna:** el bloque de cuenta y los discos conservan contraste. Verificación manual en Task 1, paso 10 (no hay fixture de tema en e2e; se revisa en 375×812 con tema día).

---

### Task 1: Hub nuevo (e2e + página + i18n + settings)

**Files:**
- Modify: `tests/e2e/test_t10.py` (contrato del hub)
- Modify: `tests/e2e/test_t9.py` (vista única)
- Rename + rewrite: `tests/e2e/test_f93_t28_mas_grid.py` → `tests/e2e/test_t11_mas_hub_layout.py`
- Modify: `src/i18n/locales/es/core.ts`
- Modify: `src/i18n/locales/en/core.ts`
- Modify: `src/domain/settings.ts`
- Rewrite: `src/pages/MasPage.tsx`

**Interfaces:**
- Consumes: `useProfileName() → { name: string }`, `useAvatar() → { avatarUri: string }`, `useActiveProgram() → { program?: ActiveProgram, routine?: Routine }`, `usePeriodization() → { activePlan: PeriodizationPlan | null }`, `getCurrentWeek(plan: PeriodizationPlan, currentDate: string) → number`.
- Produces: nothing consumed by Task 2.

- [ ] **Step 1: Rewrite `tests/e2e/test_t10.py` with the new contract**

```python
"""Test T10: contrato del hub /mas — una vista, 17 filas, Papers ausente."""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url


def assert_mas(page, view_name, shot):
    page.goto(f"{base_url()}/mas", wait_until="networkidle")
    page.wait_for_timeout(500)

    # 1. Papers no aparece.
    assert page.get_by_text("Papers", exact=True).count() == 0

    # 2. Sin toggle de vista.
    assert page.get_by_role("button", name="Vista de rejilla").count() == 0
    assert page.get_by_role("button", name="Vista de lista").count() == 0

    # 3. Bloque de cuenta: enlace a /perfil, altura táctil, fallback sin datos.
    account = page.locator('a[href="/perfil"]').first
    expect(account).to_be_visible()
    assert account.bounding_box()["height"] >= 44
    expect(account).to_contain_text("Tu cuenta")

    # 4. Cuatro secciones + fila final.
    for heading in ["Actividad", "Cuerpo", "Nutrición", "Aprender"]:
        expect(page.get_by_role("heading", name=heading, exact=True)).to_be_visible()

    # 5. 17 filas dentro del ancla del tour.
    rows = page.locator('nav[data-tour="mas-links"] a[href]')
    assert rows.count() == 17, f"esperaba 17 filas, hay {rows.count()}"

    # 6. Destinos rescatados y hub de calculadoras alcanzable.
    for href in ["/objetivos", "/timer", "/calculadoras", "/calculadoras/agua",
                 "/calculadoras/medidas", "/ajustes"]:
        assert page.locator(f'nav[data-tour="mas-links"] a[href="{href}"]').count() == 1, href

    # 7. Sin plan ni programa: la línea de contexto cae en «Ver perfil».
    expect(account).to_contain_text("Ver perfil")

    page.screenshot(path=shot, full_page=True)


def main():
    errors = run_views({"iphone": assert_mas, "ipad": assert_mas}, __file__, "t10")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("T10 PASSED — hub de una vista, 17 filas, sin Papers")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Rewrite `tests/e2e/test_t9.py` as the single-view test**

```python
"""Test T9: /mas tiene una sola vista; recargar no cambia la composición."""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from scripts.e2e_utils import run_views, base_url


def assert_hub(page, view_name, shot):
    page.goto(f"{base_url()}/mas", wait_until="networkidle")
    page.wait_for_timeout(400)

    close_btn = page.get_by_role("button", name="Ya entreno aquí")
    if close_btn.count():
        close_btn.first.click()
        page.goto(f"{base_url()}/mas", wait_until="networkidle")
        page.wait_for_timeout(300)

    rows = page.locator('nav[data-tour="mas-links"] a[href]')
    assert rows.count() == 17

    # Todas las filas son táctiles.
    for i in range(rows.count()):
        bb = rows.nth(i).bounding_box()
        assert bb is not None and bb["height"] >= 44, f"fila {i} mide {bb and bb['height']}px"

    # Recargar no cambia nada: no hay preferencia de layout.
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(400)
    assert page.locator('nav[data-tour="mas-links"] a[href]').count() == 17
    assert page.get_by_role("button", name="Vista de lista").count() == 0

    page.screenshot(path=shot, full_page=True)


def main():
    errors = run_views({"iphone": assert_hub, "ipad": assert_hub, "ipad-landscape": assert_hub}, __file__, "t9")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("T9 PASSED — /mas de una sola vista en 375x812, 768x1024 y 1024x768")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 3: Rename and rewrite the layout test**

Run: `git mv tests/e2e/test_f93_t28_mas_grid.py tests/e2e/test_t11_mas_hub_layout.py`

```python
"""T11: /mas sin overflow horizontal a 320/375/768, filas >= 44 px, 0 errores."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"
VIEWPORTS = [{"width": 320, "height": 700}, {"width": 375, "height": 812}, {"width": 768, "height": 1024}]


def check(browser, errors, vp):
    tag = f"{vp['width']}x{vp['height']}"
    ctx = browser.new_context(viewport=vp)
    page = ctx.new_page()
    console = []
    page.on("console", lambda m: console.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console.append(str(e)))
    try:
        page.goto(f"{BASE}/mas", wait_until="networkidle")
        page.wait_for_timeout(800)
        if page.locator("button", has_text="Ya entreno aquí").count():
            page.locator("button", has_text="Ya entreno aquí").first.click()
            page.goto(f"{BASE}/mas", wait_until="networkidle")
            page.wait_for_timeout(500)

        if page.evaluate("document.documentElement.scrollWidth > window.innerWidth"):
            errors.append(f"[{tag}] overflow horizontal")

        rows = page.locator('nav[data-tour="mas-links"] a[href]')
        assert rows.count() == 17, f"[{tag}] {rows.count()} filas"
        for i in range(rows.count()):
            bb = rows.nth(i).bounding_box()
            if bb is None or bb["height"] < 44:
                errors.append(f"[{tag}] fila {i} mide {bb and bb['height']}px")
    except Exception as e:
        errors.append(f"[{tag}] {e}")
    finally:
        errors.extend(f"[{tag}] console: {c}" for c in console)
        page.close(); ctx.close()


def main():
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        for vp in VIEWPORTS:
            check(b, errors, vp)
        b.close()
    if errors:
        print("ERRORS:", *[f"  - {e}" for e in errors], sep="\n")
        sys.exit(1)
    print("T11 PASSED — /mas sin overflow, 17 filas tactiles")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run the three tests and confirm they fail**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_t10.py --port 5220`
Expected: FAIL — no hay secciones ni 17 filas; el toggle sigue presente.

- [ ] **Step 5: Add the i18n keys (es and en) and remove the retired ones**

In `src/i18n/locales/es/core.ts` and `en/core.ts`, inside `mas`:
add `cuenta`, `sinNombre`, `verPerfil`, `semana`, `secActividad`, `secCuerpo`, `secNutricion`,
`secAprender`, `linkObjetivosDesc`, `linkTimerDesc`, `linkMedidasDesc`, `linkAguaDesc` with the
values from the spec §6.
Remove `subtitulo`, `vistaHub`, `vistaRejilla`, `vistaLista`, `linkPerfil`, `linkPerfilDesc`.
Normalize `linkPasosDesc` to drop the trailing period.

- [ ] **Step 6: Remove `hubLayout` from the settings type and defaults**

Delete the `hubLayout: 'grip' | 'list'` line from `AppSettings` and the `hubLayout: 'grip',` line
from `DEFAULT_SETTINGS` in `src/domain/settings.ts`. No migration.

- [ ] **Step 7: Rewrite `src/pages/MasPage.tsx`**

Structure:

```tsx
type LabelKey =
  | 'mas.linkCalendario' | 'mas.linkPasos' | 'mas.linkLogros' | 'mas.linkWearables'
  | 'goals.title' | 'timer.title'
  | 'mas.linkPesoCorporal' | 'mas.linkCuerpo' | 'calculadoras.medidas' | 'mas.linkFotosProgreso'
  | 'mas.linkNutricion' | 'mas.linkSuplementos' | 'calculadoras.agua'
  | 'mas.linkBiblioteca' | 'mas.linkGuias' | 'mas.linkCalculadoras'
type DescKey =
  | 'mas.linkCalendarioDesc' | 'mas.linkPasosDesc' | 'mas.linkLogrosDesc' | 'mas.linkWearablesDesc'
  | 'mas.linkObjetivosDesc' | 'mas.linkTimerDesc'
  | 'mas.linkPesoCorporalDesc' | 'mas.linkCuerpoDesc' | 'mas.linkMedidasDesc' | 'mas.linkFotosProgresoDesc'
  | 'mas.linkNutricionDesc' | 'mas.linkSuplementosDesc' | 'mas.linkAguaDesc'
  | 'mas.linkBibliotecaDesc' | 'mas.linkGuiasDesc' | 'mas.linkCalculadorasDesc'
type HubLink = { to: string; labelKey: LabelKey; descKey: DescKey; icon: LucideIcon }
type HubSection = { id: string; labelKey: 'mas.secActividad' | 'mas.secCuerpo' | 'mas.secNutricion' | 'mas.secAprender'; links: HubLink[] }
```

- `const sections: HubSection[]` in spec order (Actividad 6, Cuerpo 4, Nutrición 3, Aprender 3).
- `const settingsLink: HubLink` (Ajustes, `/ajustes`, `Settings`, `mas.linkAjustesDesc`).
- Account line:
  `const context = activePlan ? `${activePlan.name} · ${t('mas.semana', { n: getCurrentWeek(activePlan, new Date().toISOString()), total: activePlan.totalWeeks })}` : routine?.name ?? t('mas.verPerfil')`
- Avatar: `<img src={avatarUri} alt="" className="size-[54px] rounded-full object-cover" />` when
  present; otherwise a 54 px circle with the first grapheme of `name` uppercased, or
  `<User className="size-5" aria-hidden />` when the name is empty. Use `Array.from(name.trim())[0]`.
- `displayName = name.trim() || t('mas.sinNombre')`.
- Render: `AppHeader kicker={t('mas.cuenta')} title={t('mas.titulo')}` → `<Link to="/perfil">`
  (min-h 76, border-b, chevron) → `<nav data-tour="mas-links" aria-label={t('mas.titulo')}>` with
  sections (`<section aria-labelledby>`, `<h2>`, counter `aria-hidden`, rows) plus the footer row.
  La primera sección **no** lleva `border-t`: el divisor es el `border-b` del bloque de cuenta.
- Rows: `<Link>` min-h 53, `gap-3`, disc 33 con `bg-gold/10 text-gold`, título/subtítulo, chevron;
  `stagger-fade stagger-fade-${Math.min(index + 1, 8)}` solo en las 8 primeras filas del total.
- No `useSettings`.

- [ ] **Step 8: Build and run the unit suite**

Run: `npm run build`
Expected: exit 0 (typecheck real; las claves retiradas no deben quedar referenciadas).
Run: `npm test`
Expected: suite verde.

- [ ] **Step 9: Run the three hub e2e**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_t10.py --port 5220`
Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_t9.py --port 5220`
Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_t11_mas_hub_layout.py --port 5220`
Expected: los tres PASSED.

- [ ] **Step 10: Run the regression e2e already tied to `/mas`**

Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_pulido_home_mas_ajustes.py --port 5220`
Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f101_tour.py --port 5220`
Run: `python tests/e2e/scripts/with_server.py tests/e2e/test_f103_smoke.py --port 5220`
Expected: PASSED. Revisión manual del tema día en 375×812 (bloque de cuenta + discos con contraste).

- [ ] **Step 11: Commit**

```bash
git add tests/e2e/test_t9.py tests/e2e/test_t10.py tests/e2e/test_t11_mas_hub_layout.py \
  src/pages/MasPage.tsx src/i18n/locales/es/core.ts src/i18n/locales/en/core.ts src/domain/settings.ts
git commit -m "feat: rediseño del hub Más con índice agrupado y bloque de cuenta"
```

---

### Task 2: Documentación

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `docs/design/README.md`
- Modify: `docs/design/NOCTURNO-MINIMAL.md` (§11, mapa de migración)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: CHANGELOG**

Under `[Unreleased]` → `Changed`: «Hub `/mas` rediseñado: una sola vista, bloque de cuenta y 17 filas agrupadas; se retira el toggle rejilla/lista y `hubLayout`; se suman Objetivos, Timer, Agua y Medidas; Papers sigue fuera.»

- [ ] **Step 2: Estado del diseño**

In `docs/design/README.md`, add a bullet under «Estado actual»: hub `/mas` migrado a Nocturno Minimal (dirección A), commit hash, sin push.

- [ ] **Step 3: Mapa de migración**

In `docs/design/NOCTURNO-MINIMAL.md` §11, replace the `PerfilPage` row area with a new row:
`/mas hub | Índice agrupado + bloque de cuenta | Hecho`.

- [ ] **Step 4: Readback and commit**

Run: `git diff --stat`
Expected: solo los tres documentos.
```bash
git add CHANGELOG.md docs/design/README.md docs/design/NOCTURNO-MINIMAL.md
git commit -m "docs: registrar el rediseño del hub Más"
```

---

## Verification

```bash
npm run build
npm test
python tests/e2e/scripts/with_server.py tests/e2e/test_t10.py --port 5220
python tests/e2e/scripts/with_server.py tests/e2e/test_t9.py --port 5220
python tests/e2e/scripts/with_server.py tests/e2e/test_t11_mas_hub_layout.py --port 5220
python tests/e2e/scripts/with_server.py tests/e2e/test_pulido_home_mas_ajustes.py --port 5220
python tests/e2e/scripts/with_server.py tests/e2e/test_f101_tour.py --port 5220
python tests/e2e/scripts/with_server.py tests/e2e/test_f103_smoke.py --port 5220
```

Emulador: no obligatorio (no se toca router ni `vite.config.ts`).
