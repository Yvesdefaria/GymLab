"""Test Fase 45 (B1): la infra i18n arranca en inglés por defecto (default del
producto), el selector de Ajustes cambia el idioma al instante (<html lang> +
titulo) y persiste en settings.language (sobrevive al recargar).

Viewports: iPhone 375x812 + iPad 768x1024 (patron estandar del repo).
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url


def assert_b1(page, view_name, shot):
    page.goto(base_url(), wait_until="networkidle")

    # Instalación nueva: arranca en inglés (<html lang>). El título por ruta lo fija useSeo (B2).
    assert page.evaluate("document.documentElement.lang") == "en"

    # Salta el onboarding (en inglés) para llegar al home y abre Ajustes.
    page.get_by_role("button", name="I already train here").first.click()
    page.wait_for_url(f"{base_url()}/")
    page.wait_for_timeout(500)
    page.goto(f"{base_url()}/ajustes", wait_until="networkidle")

    # El default ya está seleccionado en Ajustes.
    expect(page.get_by_label("Language")).to_have_value("en")

    # Cambia el idioma a español: aplica al instante y deja el título en español.
    page.get_by_label("Language").select_option("es")
    page.wait_for_timeout(300)
    assert page.evaluate("document.documentElement.lang") == "es"
    expect(page).to_have_title("GymLab — Entrena mejor con datos")

    # Persiste tras recargar (settings.language). Ya en español, el aria-label del
    # selector es "Idioma" (settings.language se localiza al idioma activo).
    page.reload(wait_until="networkidle")
    assert page.evaluate("document.documentElement.lang") == "es"
    expect(page.get_by_label("Idioma")).to_have_value("es")

    page.screenshot(path=shot, full_page=False)


def main():
    errors = run_views({"iphone": assert_b1, "ipad": assert_b1}, __file__, "f45")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("F45 PASSED — infra i18n: en por defecto, selector en Ajustes y persistencia en 375x812 y 768x1024")
    return 0


if __name__ == "__main__":
    sys.exit(main())
