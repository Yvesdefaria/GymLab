"""T8 (actualizado al rediseño E): superficie del detalle de rutina.

La tarjeta de rutina dejó de tener sombras y foco radial (Nocturno Minimal prohíbe
glows). Lo que sigue vigente es el `.panel-elevated` del detalle: sombra profunda y
foco de luz radial. Se verifica en /rutinas/ppl-volumen.
"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"


def main() -> int:
    errors = []
    shots = os.path.join(tempfile.gettempdir(), "opencode", "rutinas-e2e")
    os.makedirs(shots, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        page.goto(f"{BASE}/rutinas/ppl-volumen")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(800)

        elevated = page.locator(".panel-elevated")
        if elevated.count() == 0:
            errors.append("No hay .panel-elevated en RutinaDetailPage")
        else:
            shadow = elevated.first.evaluate("el => window.getComputedStyle(el).boxShadow")
            bg = elevated.first.evaluate("el => window.getComputedStyle(el).backgroundImage")
            print(f"  .panel-elevated shadow: {shadow[:100]}...")
            print(f"  .panel-elevated bg: {bg[:100]}...")
            if "rgba(0, 0, 0" not in shadow and "rgb(0, 0, 0)" not in shadow:
                errors.append(".panel-elevated sin sombra profunda")
            if "radial-gradient" not in bg:
                errors.append(".panel-elevated sin foco de luz radial")

        page.screenshot(path=os.path.join(shots, "t8_detail_phone.png"), full_page=True)
        browser.close()

    print("\n=== RESULTADO T8 ===")
    if errors:
        print(f"FALLO: {errors}")
        return 1
    print("T8 PASSED — panel-elevated del detalle OK (375x812)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
