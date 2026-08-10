"""Test T9: toggle grip/lista en el hub Más + persistencia y staggerFade."""
import sys

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url


def assert_hub(page, view_name, shot):
    page.goto(f"{base_url()}/mas", wait_until="networkidle")
    page.wait_for_timeout(500)

    # Cierra el onboarding si aparece (tapa la UI en contextos sin datos).
    close_btn = page.get_by_role("button", name="Ya entreno aquí")
    if close_btn.count():
        close_btn.first.click()
        page.wait_for_timeout(300)
        page.goto(f"{base_url()}/mas", wait_until="networkidle")
        page.wait_for_timeout(300)

    # Por defecto: vista grip (grid 2 columnas).
    grip_toggle = page.get_by_role("button", name="Vista de rejilla")
    list_toggle = page.get_by_role("button", name="Vista de lista")
    expect(grip_toggle).to_be_visible()
    expect(list_toggle).to_be_visible()

    # Touch targets >= 44px.
    box = list_toggle.bounding_box()
    assert box is not None and box["width"] >= 44 and box["height"] >= 44, f"toggle < 44px: {box}"

    grip_links = page.locator(".grid > a")
    assert grip_links.count() == 8, f"grip: esperaba 8 cards, hay {grip_links.count()}"
    page.screenshot(path=shot.replace(".png", "-grip.png"), full_page=False)

    # Cambiar a lista.
    list_toggle.click()
    page.wait_for_timeout(700)
    expect(list_toggle).to_have_attribute("aria-pressed", "true")
    list_links = page.locator("a.panel")
    assert list_links.count() == 8, f"lista: esperaba 8 filas, hay {list_links.count()}"
    # En lista hay chevron (descriptor en fila).
    assert list_links.first.get_attribute("class") and "stagger-fade" in (list_links.first.get_attribute("class") or "")
    page.screenshot(path=shot.replace(".png", "-list.png"), full_page=False)

    # Persistencia: recargar y seguir en lista.
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(500)
    expect(list_toggle).to_have_attribute("aria-pressed", "true")
    assert page.locator("a.panel").count() == 8

    # Volver a grip.
    grip_toggle.click()
    page.wait_for_timeout(700)
    expect(grip_toggle).to_have_attribute("aria-pressed", "true")
    assert page.locator(".grid > a").count() == 8


def main():
    errors = run_views({"iphone": assert_hub, "ipad": assert_hub, "ipad-landscape": assert_hub}, __file__, "t9")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("T9 PASSED — toggle grip/lista OK en 375x812, 768x1024 y 1024x768")
    return 0


if __name__ == "__main__":
    sys.exit(main())
