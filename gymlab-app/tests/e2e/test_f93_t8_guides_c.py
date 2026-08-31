"""Fase 93 #8 (Lote C): guías de físicos de leyenda + categoría 'leyenda'.

Verifica que tras el reseed (SEED_VERSION 18->19):
- La categoría 'Leyenda' aparece en /guias.
- Las 6 guías de leyendas (Arnold, Ronnie Coleman, Larry Scott, Dorian Yates,
  Simeon Panda, Mike Mentzer) son visibles en /guias y abren su detalle.
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

CATEGORY_ES = "Leyenda"

# slug -> fragmento único de su contenido (ES) para confirmar el detalle correcto.
LEGEND_GUIDES = {
    "arnold-volumen": "roble austríaco",
    "ronnie-coleman": "6.000 kcal",
    "larry-scott-brazos": "curl de predicador",
    "dorian-yates-serie": "al fallo absoluto",
    "simeon-panda": "pirámide",
    "mike-mentzer-heavy-duty": "Heavy Duty",
}


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

            # 1) Categoría 'Leyenda' visible en /guias.
            page.goto(f"{BASE}/guias", wait_until="networkidle")
            page.wait_for_timeout(1200)
            body = page.inner_text("body")
            if CATEGORY_ES not in body:
                errors.append(f"Categoría '{CATEGORY_ES}' NO visible en /guias")
            else:
                print(f"OK: categoría '{CATEGORY_ES}' visible en /guias")

            # 2) Cada guía de leyenda es visible y abre su detalle.
            for slug, hint in LEGEND_GUIDES.items():
                page.goto(f"{BASE}/guias", wait_until="networkidle")
                page.wait_for_timeout(900)
                title_loc = page.locator(f"a[href='/guias/{slug}']")
                if title_loc.count() == 0:
                    errors.append(f"Guía '{slug}' NO enlazada en /guias")
                    continue
                title_loc.first.click(timeout=5000)
                page.wait_for_timeout(1000)
                detail = page.inner_text("body")
                if hint not in detail:
                    errors.append(f"Detalle '{slug}' sin hint -> '{hint}'")
                else:
                    print(f"OK: guía '{slug}' abre su detalle")

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