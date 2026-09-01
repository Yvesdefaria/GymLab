"""Fase 93 #28: el hub «Más» en modo grip muestra 3 columnas sin overflow a 320px.

Verifica en los viewports 320×700, 375×812 y 768×1024 que /mas:
- El modo grip (por defecto) muestra 3 columnas: los 3 primeros enlaces difieren
  en X y el 4º arranca en la columna 1 (misma X que el primero).
- No hay overflow horizontal (`scrollWidth <= innerWidth`).
- Los enlaces del hub tienen altura >= 44px (touch target).
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Viewports a verificar: móvil estrecho (320px), móvil típico y tablet.
VIEWPORTS = [
    {"width": 320, "height": 700},
    {"width": 375, "height": 812},
    {"width": 768, "height": 1024},
]

# El grip es el único grid-cols-3 de la página y sus enlaces cuelgan directos del contenedor.
GRID_SELECTOR = "main div.grid.grid-cols-3 > a"


def check_viewport(browser, errors, viewport):
    tag = f"{viewport['width']}x{viewport['height']}"
    context = browser.new_context(viewport=viewport)
    page = context.new_page()
    console_errors = []
    page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

    try:
        page.goto(BASE, wait_until="networkidle")
        page.wait_for_timeout(1500)

        skip_ob = page.locator("button", has_text="Ya entreno aquí")
        if skip_ob.count() > 0:
            skip_ob.first.click(timeout=5000)
            page.wait_for_timeout(800)

        # Navegar directamente al hub «Más».
        page.goto(f"{BASE}/mas", wait_until="networkidle")
        page.wait_for_timeout(1200)

        links = page.locator(GRID_SELECTOR)
        n = links.count()
        if n < 4:
            errors.append(f"[{tag}] Grip con {n} enlaces (esperaba >= 4)")
            return

        boxes = [links.nth(i).bounding_box() for i in range(min(n, 4))]
        if any(b is None for b in boxes):
            errors.append(f"[{tag}] No se pudo medir la primera fila del grip")
            return

        # 3 columnas: los 3 primeros enlaces difieren en X y el 4º arranca en la columna 1.
        xs = [round(b["x"], 1) for b in boxes[:3]]
        if len(set(xs)) < 3:
            errors.append(f"[{tag}] No hay 3 columnas distintas en la primera fila (x={xs})")
        if abs(boxes[3]["x"] - boxes[0]["x"]) > 1:
            errors.append(f"[{tag}] El 4º enlace no arranca en la columna 1 (x4={boxes[3]['x']:.1f}, x1={boxes[0]['x']:.1f})")

        # Sin overflow horizontal.
        if page.evaluate("document.documentElement.scrollWidth > window.innerWidth"):
            sw = page.evaluate("document.documentElement.scrollWidth")
            iw = page.evaluate("window.innerWidth")
            errors.append(f"[{tag}] Overflow horizontal: scrollWidth={sw} > innerWidth={iw}")

        # Touch targets >= 44px en todos los enlaces del hub.
        for i in range(n):
            bb = links.nth(i).bounding_box()
            if bb is None or bb["height"] < 44:
                errors.append(f"[{tag}] Enlace {i} con altura {bb and bb['height']}px (< 44)")

    except Exception as e:
        errors.append(f"[{tag}] Exception: {e}")
    finally:
        if console_errors:
            errors.extend(f"[{tag}] {ce}" for ce in console_errors)
        page.close()
        context.close()


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for vp in VIEWPORTS:
            check_viewport(browser, errors, vp)
        browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("ALL OK")


if __name__ == "__main__":
    main()
