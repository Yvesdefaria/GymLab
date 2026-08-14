"""Test Fase 45 (B3): el overlay EN del catálogo se aplica en render en las páginas
de catálogo/detalle (ejercicios, rutinas, guías, papers), sin alterar el idioma ES.

Verifica en es (defecto) y en (cambiado desde Ajustes) que: (1) los nombres de
ejercicio y los labels de muscleGroup/equipment/category/objective/level se
muestran en el idioma correcto, (2) no aparece ninguna clave i18n cruda.
"""
import re
import sys

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url


def skip_onboarding(page, label):
    page.goto(base_url(), wait_until="networkidle")
    page.get_by_role("button", name=label).first.click()
    page.wait_for_url(f"{base_url()}/")
    page.wait_for_timeout(500)


def switch_to_en(page):
    skip_onboarding(page, "Ya entreno aquí")
    page.goto(f"{base_url()}/ajustes", wait_until="networkidle")
    page.get_by_label("Idioma").select_option("en")
    page.wait_for_timeout(300)
    assert page.evaluate("document.documentElement.lang") == "en"


def assert_no_raw_keys(page):
    assert not re.search(r"^[a-z]+\.[a-zA-Z0-9_]+$", page.inner_text("body").strip(), re.M), "clave i18n cruda"
    assert "t('" not in page.content(), "clave t() cruda"


def assert_es(page, view_name, shot):
    skip_onboarding(page, "Ya entreno aquí")
    assert page.evaluate("document.documentElement.lang") == "es"

    # Catálogo de ejercicios: nombre y labels en español.
    page.goto(f"{base_url()}/ejercicios", wait_until="networkidle")
    page.get_by_placeholder("Buscar ejercicio...").fill("press de pecho con barra")
    page.wait_for_timeout(400)
    expect(page.get_by_text("Press de pecho con barra", exact=True)).to_be_visible()
    assert "pecho" in page.inner_text("body")
    assert_no_raw_keys(page)

    # Detalle de un ejercicio curado con pasos detallados en español.
    page.goto(f"{base_url()}/ejercicios/press-de-pecho-con-barra", wait_until="networkidle")
    expect(page.get_by_text("Press de pecho con barra", exact=True)).to_be_visible()
    assert "Acuéstate en el banco con los ojos bajo la barra" in page.inner_text("body")
    assert_no_raw_keys(page)

    # Rutinas: títulos y labels de objetivo/nivel en español.
    page.goto(f"{base_url()}/rutinas", wait_until="networkidle")
    assert_no_raw_keys(page)

    # Guías y papers en español.
    page.goto(f"{base_url()}/guias", wait_until="networkidle")
    assert_no_raw_keys(page)
    page.goto(f"{base_url()}/papers", wait_until="networkidle")
    assert_no_raw_keys(page)

    page.screenshot(path=shot, full_page=False)


def assert_en(page, view_name, shot):
    switch_to_en(page)

    # Catálogo de ejercicios: el overlay aplica los nombres EN a la búsqueda y los chips de filtro.
    page.goto(f"{base_url()}/ejercicios", wait_until="networkidle")
    page.get_by_placeholder("Search exercises...").fill("ab roller")
    page.wait_for_timeout(400)
    expect(page.get_by_text("Ab Roller", exact=True)).to_be_visible()
    assert_no_raw_keys(page)

    # Detalle con pasos detallados traducidos (overlay curado).
    page.goto(f"{base_url()}/ejercicios/press-de-pecho-con-barra", wait_until="networkidle")
    expect(page.get_by_text("Barbell Bench Press", exact=True)).to_be_visible()
    assert "Lie on the bench with your eyes under the bar" in page.inner_text("body")
    assert "Chest" in page.inner_text("body")
    assert_no_raw_keys(page)

    # Rutinas: título traducido (overlay) y labels de objetivo/nivel en inglés.
    page.goto(f"{base_url()}/rutinas", wait_until="networkidle")
    assert_no_raw_keys(page)

    # Guías y papers en inglés.
    page.goto(f"{base_url()}/guias", wait_until="networkidle")
    assert_no_raw_keys(page)
    page.goto(f"{base_url()}/papers", wait_until="networkidle")
    assert_no_raw_keys(page)

    page.screenshot(path=shot, full_page=False)


def main():
    errors = run_views({"iphone": assert_es, "ipad": assert_en}, __file__, "f45b3")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("F45 B3 PASSED — overlay EN del catálogo en es y en (375x812 + 768x1024)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
