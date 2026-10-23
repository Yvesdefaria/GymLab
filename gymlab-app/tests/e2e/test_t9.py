"""Test T9: /mas tiene una sola vista; recargar no cambia la composición."""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from scripts.e2e_utils import run_views, base_url


def assert_hub(page, view_name, shot):
    page.goto(f"{base_url()}/mas", wait_until="networkidle")
    page.wait_for_timeout(400)

    close_btn = page.get_by_role("button", name="Ya entreno aquí")
    if close_btn.count():
        close_btn.first.click()
        page.goto(f"{base_url()}/mas", wait_until="networkidle")
        page.wait_for_timeout(300)

    rows = page.locator('nav[data-tour="mas-links"] a[href]')
    assert rows.count() == 17, f"esperaba 17 filas, hay {rows.count()}"

    # Todas las filas son táctiles.
    for i in range(rows.count()):
        bb = rows.nth(i).bounding_box()
        assert bb is not None and bb["height"] >= 44, f"fila {i} mide {bb and bb['height']}px"

    # Recargar no cambia nada: no hay preferencia de layout.
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(400)
    assert page.locator('nav[data-tour="mas-links"] a[href]').count() == 17
    assert page.get_by_role("button", name="Vista de lista").count() == 0

    page.screenshot(path=shot, full_page=True)


def main():
    errors = run_views({"iphone": assert_hub, "ipad": assert_hub, "ipad-landscape": assert_hub}, __file__, "t9")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("T9 PASSED — /mas de una sola vista en 375x812, 768x1024 y 1024x768")
    return 0


if __name__ == "__main__":
    sys.exit(main())
