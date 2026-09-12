"""F87: Take screenshots of all main pages at 320/375/390/768px viewports."""
from playwright.sync_api import sync_playwright
import os

VIEWPORTS = {
    "320": {"width": 320, "height": 568},
    "375": {"width": 375, "height": 667},
    "390": {"width": 390, "height": 844},
    "768": {"width": 768, "height": 1024},
}

# All main routes to test
ROUTES = [
    "/",
    "/rutinas",
    "/estadisticas",
    "/mas",
    "/perfil",
    "/ajustes",
    "/nutricion",
    "/suplementacion",
    "/logros",
    "/fotos-progreso",
    "/peso-corporal",
    "/grasa-corporal",
    "/calculadoras",
    "/calculadoras/imc",
    "/calculadoras/calorias",
    "/wearables",
]

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "test-results", "f87-responsive")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    for vp_name, vp in VIEWPORTS.items():
        os.makedirs(os.path.join(OUT_DIR, vp_name), exist_ok=True)
        page = browser.new_page(viewport=vp)

        for route in ROUTES:
            safe_name = route.strip("/").replace("/", "_") or "home"
            path = os.path.join(OUT_DIR, vp_name, f"{safe_name}.png")
            try:
                page.goto(f"http://localhost:5173{route}", wait_until="networkidle", timeout=10000)
                page.wait_for_timeout(500)
                page.screenshot(path=path, full_page=True)
                print(f"OK  {vp_name}px {route}")
            except Exception as e:
                print(f"ERR {vp_name}px {route}: {e}")

        page.close()

    browser.close()
    print(f"\nDone. Screenshots in {OUT_DIR}")
