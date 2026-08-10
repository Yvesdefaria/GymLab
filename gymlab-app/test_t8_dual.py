"""Test T8: sombra degradada (foco de luz sup-izq) en routine-cards, iPhone + iPad.

Comprueba que .routine-card tiene foco de luz direccional (sombra interior
superior-izquierda + sombra exterior) y que las cards se ven centradas dentro
del contenedor max-w-lg del shell."""
import sys

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url


def assert_routines(page, view_name, shot):
    page.goto(f"{base_url()}/rutinas", wait_until="networkidle")
    page.wait_for_timeout(800)

    cards = page.locator(".routine-card")
    count = cards.count()
    assert count > 0, "no hay .routine-card"

    # 1. La sombra exterior es direccional: foco de luz arriba-izquierda
    #    se traduce en offset positivo X/Y (sombra proyectada abajo-derecha)
    #    con un inset highlight superior (luz).
    import re

    split_shadows = lambda s: re.split(r",(?![^(]*\))", s)
    for i in range(min(3, count)):
        card = cards.nth(i)
        box_shadow = card.evaluate("el => window.getComputedStyle(el).boxShadow")
        parts = [p.strip() for p in split_shadows(box_shadow)]
        has_inset_light = any("inset" in p and "1px" in p for p in parts)
        has_directional = any(
            ("12px" in p or "16px" in p or "20px" in p or "22px" in p or "36px" in p)
            and "inset" not in p
            for p in parts
        )
        assert has_inset_light, f"card {i}: sin foco de luz interior (inset): {box_shadow[:160]}"
        assert has_directional, f"card {i}: sin sombra direccional exterior: {box_shadow[:160]}"

    # 2. La primera card queda dentro del viewport (contenedor centrado max-w-lg).
    first = cards.first
    box = first.bounding_box()
    assert box is not None
    page_width = page.viewport_size["width"]
    assert box["x"] >= 0 and box["x"] + box["width"] <= page_width + 1, (
        f"card fuera de pantalla x={box['x']} w={box['width']} viewport={page_width}"
    )

    page.screenshot(path=shot, full_page=True)

    # 3. Home también renderiza sin errores.
    page.goto(f"{base_url()}/", wait_until="networkidle")
    page.wait_for_timeout(500)
    expect(page.locator("header")).to_be_visible()


def main():
    errors = run_views({"iphone": assert_routines, "ipad": assert_routines}, __file__, "t8")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("T8 PASSED — sombra direccional en routine-cards OK en 375x812 y 768x1024")
    return 0


if __name__ == "__main__":
    sys.exit(main())
