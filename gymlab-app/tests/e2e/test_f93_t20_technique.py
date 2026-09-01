"""Fase 93 #20: técnica visible en las fichas de ejercicio (derivada y propia).

Verifica que:
- `/ejercicios/exercise-ball-crunch` (id 1242, catálogo ampliado, sin detailedSteps
  en seed) muestra el bloque «Técnica» con la lista numerada derivada de la plantilla
  de instrucción (números 1..n visibles), no solo el fallback de instrucciones.
- `/ejercicios/press-de-pecho-con-barra` (curado con pasos propios en seed) muestra
  el mismo bloque «Técnica» con lista numerada.
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

DERIVED_SLUG = "exercise-ball-crunch"
CURATED_SLUG = "press-de-pecho-con-barra"


def check_technique(page, slug, errors):
    page.goto(f"{BASE}/ejercicios/{slug}", wait_until="networkidle")
    page.wait_for_timeout(1200)

    body = page.inner_text("body")
    if "Técnica" not in body:
        errors.append(f"Ficha de «{slug}» sin bloque «Técnica»")
        return

    numbers = page.locator("ol li > span:first-child").all_inner_texts()
    try:
        numbered = [int(n.strip()) for n in numbers if n.strip().isdigit()]
    except ValueError:
        numbered = []
    if not numbered:
        errors.append(f"Ficha de «{slug}»: la técnica no tiene lista numerada")
    else:
        if numbered != list(range(1, len(numbered) + 1)):
            errors.append(f"Ficha de «{slug}»: números de técnica no correlativos ({numbered})")
        if len(numbered) < 2:
            errors.append(f"Ficha de «{slug}»: pocos pasos numerados ({len(numbered)})")


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

            check_technique(page, DERIVED_SLUG, errors)
            check_technique(page, CURATED_SLUG, errors)

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