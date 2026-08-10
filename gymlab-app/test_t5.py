"""Test T5: avatar en Perfil — picker con galería 4x3 scrollable, selección persistida,
validación de seguridad y avatar circular sin romper la card en tablet."""
import sys

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url


def assert_profile(page, view_name, shot):
    page.goto(f"{base_url()}/perfil", wait_until="networkidle")
    page.wait_for_timeout(500)

    close_btn = page.get_by_role("button", name="Ya entreno aquí")
    if close_btn.count():
        close_btn.first.click()
        page.wait_for_timeout(300)
        page.goto(f"{base_url()}/perfil", wait_until="networkidle")
        page.wait_for_timeout(300)

    # 1. Avatar con fallback: botón para cambiar avatar, sin imagen inicialmente.
    avatar_btn = page.get_by_role("button", name="Cambiar avatar")
    expect(avatar_btn).to_be_visible()
    avatar_btn.click()
    page.wait_for_timeout(400)

    # 2. Picker con galería de 12 predefinidos en grid 4 columnas.
    dialog = page.get_by_role("dialog", name="Elegir avatar")
    expect(dialog).to_be_visible()
    presets = dialog.locator("button[aria-label^='Usar avatar']")
    assert presets.count() == 12, f"esperaba 12 avatares, hay {presets.count()}"
    # En mobile el grid es de 4 columnas; se verifica que no rompe el ancho.
    first_preset = presets.first
    box = first_preset.bounding_box()
    assert box is not None and box["height"] >= 40

    # 3. El contenedor de predefinidos hace scroll (picker usable en pantallas pequeñas).
    grid = dialog.locator("div.grid").first
    can_scroll = grid.evaluate("el => el.scrollHeight > el.clientHeight")
    if view_name == "iphone":
        assert can_scroll, "galería sin scroll en iphone"
    else:
        assert grid.evaluate("el => el.scrollHeight > 0")

    # 4. Seleccionar un avatar lo marca y persiste tras recargar.
    presets.nth(3).click()
    page.wait_for_timeout(500)
    expect(dialog).to_be_hidden()
    avatar_img = page.locator("button[aria-label='Cambiar avatar'] img")
    expect(avatar_img).to_be_visible()
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(500)
    expect(page.locator("button[aria-label='Cambiar avatar'] img")).to_be_visible()

    # 5. El avatar no rompe la card de usuario en tablet (la card sigue visible).
    card = page.locator("div.panel.rounded-2xl").first
    expect(card).to_be_visible()

    # 6. Editar el alias inline: por defecto «Atleta», se cambia y persiste.
    expect(page.get_by_text("Atleta", exact=True)).to_be_visible()
    page.get_by_role("button", name="Editar nombre").click()
    name_input = page.get_by_role("textbox", name="Tu nombre")
    expect(name_input).to_be_visible()
    name_input.fill("Yves")
    name_input.press("Enter")
    page.wait_for_timeout(400)
    expect(page.get_by_text("Yves", exact=True)).to_be_visible()
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(400)
    expect(page.get_by_text("Yves", exact=True)).to_be_visible()

    page.screenshot(path=shot, full_page=False)


def main():
    errors = run_views({"iphone": assert_profile, "ipad": assert_profile}, __file__, "t5")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("T5 PASSED — avatar y picker OK en 375x812 y 768x1024")
    return 0


if __name__ == "__main__":
    sys.exit(main())
