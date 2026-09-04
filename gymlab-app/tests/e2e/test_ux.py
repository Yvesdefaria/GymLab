"""Sonda de diagnóstico: captura screenshots de las páginas principales y
prueba el anillo de foco al hacer clic en un chart."""
import os

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

SCREENSHOTS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "screenshots")
os.makedirs(SCREENSHOTS, exist_ok=True)


def snap(page, name, full_page=False):
    path = os.path.join(SCREENSHOTS, name)
    page.screenshot(path=path, full_page=full_page)
    print(f"Saved {path}")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})

    page.goto(BASE + "/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    snap(page, "01_home.png", full_page=True)

    page.goto(BASE + "/estadisticas")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    snap(page, "02_estadisticas_top.png")

    page.evaluate("window.scrollBy(0, 800)")
    page.wait_for_timeout(500)
    snap(page, "03_estadisticas_scroll1.png")

    page.evaluate("window.scrollBy(0, 800)")
    page.wait_for_timeout(500)
    snap(page, "04_estadisticas_scroll2.png")

    page.evaluate("window.scrollBy(0, 800)")
    page.wait_for_timeout(500)
    snap(page, "05_estadisticas_scroll3.png")

    page.evaluate("window.scrollBy(0, 800)")
    page.wait_for_timeout(500)
    snap(page, "06_estadisticas_scroll4.png")

    page.goto(BASE + "/perfil")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    snap(page, "07_perfil.png")

    page.goto(BASE + "/medidas-corporales")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    snap(page, "08_medidas.png")

    page.goto(BASE + "/grasa-corporal")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    snap(page, "09_grasa.png")

    page.evaluate("window.scrollBy(0, 600)")
    page.wait_for_timeout(500)
    snap(page, "10_grasa_scroll.png")

    page.goto(BASE + "/estadisticas")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    chart = page.locator(".recharts-wrapper").first
    if chart.count() > 0:
        box = chart.bounding_box()
        if box:
            page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            page.wait_for_timeout(500)
            snap(page, "11_chart_clicked.png")

    browser.close()