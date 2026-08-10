"""Test T10: el hub /mas ya no muestra Papers y sus filas tactiles quedan intactas."""
import sys

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url


def assert_mas(page, view_name, shot):
    page.goto(f"{base_url()}/mas", wait_until="networkidle")
    page.wait_for_timeout(500)

    # 1. Papers no aparece como entrada del hub.
    papers = page.get_by_text("Papers", exact=True)
    count = papers.count()
    assert count == 0, f"Papers sigue visible en /mas (n={count})"

    # 2. El hub sigue teniendo las entradas esperadas.
    for label in ["Perfil e historial", "Peso corporal", "Calendario", "Cuerpo y fatiga", "Guías", "Calculadoras"]:
        expect(page.get_by_text(label, exact=True)).to_be_visible()

    # 3. Las filas son enlaces tactiles con altura >= 44px.
    rows = page.locator("a", has=page.locator("[class*='min-h-['], .min-h-\\[56px\\]")).count()
    first_link = page.locator("a[href='/perfil']")
    expect(first_link).to_be_visible()
    box = first_link.bounding_box()
    assert box is not None and box["height"] >= 44, f"fila /perfil con altura {box['height'] if box else 'N/A'}px < 44"

    page.screenshot(path=shot, full_page=True)


def main():
    errors = run_views({"iphone": assert_mas, "ipad": assert_mas}, __file__, "t10")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("T10 PASSED — /mas sin Papers, filas tactiles intactas en 375x812 y 768x1024")
    return 0


if __name__ == "__main__":
    sys.exit(main())
