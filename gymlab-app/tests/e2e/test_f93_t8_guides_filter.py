"""Fase 93 #8 (extra): filtro por categoría en /guias.

Verifica que /guias separa las guías por categoría con chips:
- La fila de filtros muestra 'Todas las guías' + las categorías presentes.
- Al pulsar 'Leyenda' solo quedan visibles las guías de leyenda.
- Al pulsar 'Todas las guías' vuelven a mostrarse todas.
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

CHIP_TODAS = "Todas las guías"
CHIP_LEYENDA = "Leyenda"
LEGEND_SLUG = "arnold-volumen"
NON_LEGEND_HINT = "Progresión y sobrecarga"


def count_links(page, href):
    return page.locator(f"a[href='{href}']").count()


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
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

            page.goto(f"{BASE}/guias", wait_until="networkidle")
            page.wait_for_timeout(1200)

            # 1) Fila de filtros con el chip 'Todas las guías' y el chip 'Leyenda'.
            todas = page.get_by_role("button", name=CHIP_TODAS, exact=True)
            if todas.count() == 0:
                errors.append(f"Chip '{CHIP_TODAS}' NO visible en /guias")
            else:
                print(f"OK: chip '{CHIP_TODAS}' visible")

            leyenda = page.get_by_role("button", name=CHIP_LEYENDA, exact=True)
            if leyenda.count() == 0:
                errors.append(f"Chip '{CHIP_LEYENDA}' NO visible en /guias")
            else:
                print(f"OK: chip '{CHIP_LEYENDA}' visible")

            all_links_before = page.locator("a[href^='/guias/']").count()
            if all_links_before < 30:
                errors.append(f"Esperaba >=30 guías en /guias, hay {all_links_before}")
            else:
                print(f"OK: {all_links_before} guías en 'Todas'")

            # 2) Pulsar 'Leyenda': solo quedan las 6 guías de leyenda.
            leyenda.click(timeout=5000)
            page.wait_for_timeout(800)
            legend_links = page.locator("a[href^='/guias/']").count()
            if legend_links != 6:
                errors.append(f"Con filtro 'Leyenda' esperaba 6 guías, hay {legend_links}")
            else:
                print("OK: filtro 'Leyenda' muestra exactamente 6 guías")
            if count_links(page, f"/guias/{LEGEND_SLUG}") != 1:
                errors.append(f"'{LEGEND_SLUG}' no visible con filtro 'Leyenda'")
            if "Progresión y sobrecarga" in page.inner_text("body"):
                errors.append("Guía de otra categoría visible con filtro 'Leyenda'")

            # 3) Volver a 'Todas las guías'.
            todas.click(timeout=5000)
            page.wait_for_timeout(800)
            all_links_after = page.locator("a[href^='/guias/']").count()
            if all_links_after != all_links_before:
                errors.append(f"Al volver a 'Todas' esperaba {all_links_before} guías, hay {all_links_after}")
            else:
                print("OK: 'Todas las guías' restaura la lista completa")

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            page.close()
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