"""Test T10: contrato del hub /mas — una vista, 17 filas, Papers ausente.

El producto arranca en inglés por defecto; las aserciones de copy aceptan es/en.
"""

import re
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url


def assert_mas(page, view_name, shot):
    page.goto(f"{base_url()}/mas", wait_until="networkidle")
    page.wait_for_timeout(500)

    # 1. Papers no aparece.
    assert page.get_by_text("Papers", exact=True).count() == 0

    # 2. Sin toggle de vista dentro del hub.
    assert page.locator('nav[data-tour="mas-links"] button').count() == 0

    # 3. Bloque de cuenta: enlace a /perfil, altura táctil, fallback sin datos.
    account = page.locator('a[href="/perfil"]').first
    expect(account).to_be_visible()
    box = account.bounding_box()
    assert box is not None and box["height"] >= 44, f"bloque de cuenta mide {box and box['height']}px"
    expect(account).to_contain_text(re.compile("Tu cuenta|Your account"))

    # 4. Cuatro secciones.
    headings = page.locator('nav[data-tour="mas-links"] h2')
    assert headings.count() == 4, f"esperaba 4 secciones, hay {headings.count()}"
    for pattern in ["Actividad|Activity", "Cuerpo|Body", "Nutrición|Nutrition", "Aprender|Learn"]:
        assert page.get_by_role("heading", name=re.compile(pattern)).count() == 1, pattern

    # 5. 17 filas dentro del ancla del tour.
    rows = page.locator('nav[data-tour="mas-links"] a[href]')
    assert rows.count() == 17, f"esperaba 17 filas, hay {rows.count()}"

    # 6. Destinos rescatados y hub de calculadoras alcanzable.
    for href in ["/objetivos", "/timer", "/calculadoras", "/calculadoras/agua",
                 "/calculadoras/medidas", "/ajustes"]:
        assert page.locator(f'nav[data-tour="mas-links"] a[href="{href}"]').count() == 1, href

    # 7. Sin plan ni programa: la línea de contexto cae en «Ver perfil».
    expect(account).to_contain_text(re.compile("Ver perfil|View profile"))

    page.screenshot(path=shot, full_page=True)


def main():
    errors = run_views({"iphone": assert_mas, "ipad": assert_mas}, __file__, "t10")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("T10 PASSED — hub de una vista, 17 filas, sin Papers")
    return 0


if __name__ == "__main__":
    sys.exit(main())
