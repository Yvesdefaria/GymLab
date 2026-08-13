"""Test Fase 45 (B2): la UI renderiza con claves t() en es y en, sin claves
crudas visibles ni textos en el idioma equivocado.

Verifica que tras saltar el onboarding: (1) el home y la tabbar muestran el
texto en es por defecto, (2) al cambiar a en cambian al inglés al instante,
(3) no aparece ninguna clave i18n cruda (patron `algo.algo` no traducido).
"""
import re
import sys

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url


def assert_es(page, view_name, shot):
    page.goto(base_url(), wait_until="networkidle")
    assert page.evaluate("document.documentElement.lang") == "es"

    # Salta el onboarding y queda en el home (Entrenar).
    page.get_by_role("button", name="Ya entreno aquí").first.click()
    page.wait_for_url(f"{base_url()}/")
    page.wait_for_timeout(500)

    # Tabbar en español.
    expect(page.get_by_role("link", name="Entrenar", exact=True)).to_be_visible()
    expect(page.get_by_role("link", name="Rutinas", exact=True)).to_be_visible()
    expect(page.get_by_role("link", name="Más", exact=True)).to_be_visible()

    # Ninguna clave cruda visible (patron `ns.clave` en pantalla).
    assert not re.search(r"^[a-z]+\.[a-zA-Z0-9_]+$", page.inner_text("body").strip(), re.M), "clave i18n cruda en es"
    assert "t('" not in page.content(), "clave t() cruda en es"

    page.screenshot(path=shot, full_page=False)


def assert_en(page, view_name, shot):
    page.goto(base_url(), wait_until="networkidle")
    page.get_by_role("button", name="Ya entreno aquí").first.click()
    page.wait_for_url(f"{base_url()}/")
    page.wait_for_timeout(500)
    page.goto(f"{base_url()}/ajustes", wait_until="networkidle")

    page.get_by_label("Idioma").select_option("en")
    page.wait_for_timeout(300)
    assert page.evaluate("document.documentElement.lang") == "en"

    # Home con tabbar en inglés.
    page.goto(base_url(), wait_until="networkidle")
    expect(page.get_by_role("link", name="Train", exact=True)).to_be_visible()
    expect(page.get_by_role("link", name="Routines", exact=True)).to_be_visible()
    expect(page.get_by_role("link", name="More", exact=True)).to_be_visible()

    # Ninguna clave cruda en en, y el texto de Ajustes ya es inglés.
    assert not re.search(r"^[a-z]+\.[a-zA-Z0-9_]+$", page.inner_text("body").strip(), re.M), "clave i18n cruda en en"
    assert "t('" not in page.content(), "clave t() cruda en en"

    page.screenshot(path=shot, full_page=False)


def main():
    errors = run_views({"iphone": assert_es, "ipad": assert_en}, __file__, "f45b2")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("F45 B2 PASSED — UI con t() renderiza en es y en, sin claves crudas (375x812 + 768x1024)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
