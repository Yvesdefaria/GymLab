"""Test F43: helpers de animacion (anime.js) visibles en iPhone + iPad y
respetan prefers-reduced-motion."""
import sys

from scripts.e2e_utils import run_views, base_url


def assert_animations(page, view_name, shot):
    page.goto(f"{base_url()}/test-animations.html", wait_until="networkidle")
    page.wait_for_timeout(600)

    # 1. Los helpers arrancan con anime-ready (oculto) y se vuelven visibles al animar.
    title = page.locator("#title")
    expect_visible = title.is_visible()
    assert expect_visible, "titulo no visible"

    page.click("#run-all")
    page.wait_for_timeout(1200)

    # Tras animar, los elementos con .anime-ready deben quedar visibles (opacity 1).
    fade_box = page.locator("[data-testid='fade-box']")
    assert fade_box.is_visible(), "fade-box no visible tras fadeIn"
    slide_box = page.locator("[data-testid='slide-box']")
    assert slide_box.is_visible(), "slide-box no visible tras slideIn"
    pop_box = page.locator("[data-testid='pop-box']")
    assert pop_box.is_visible(), "pop-box no visible tras popScale"

    # 2. drawOn: el circulo SVG queda dibujado (stroke-dashoffset a 0).
    circle = page.locator("[data-testid='draw-circle']")
    circle.wait_for(timeout=3000)
    dashoffset = circle.evaluate("el => window.getComputedStyle(el).strokeDashoffset")
    assert dashoffset in ("0px", "0"), f"drawOn no completo: stroke-dashoffset={dashoffset}"

    # 3. Confetti genero particulas.
    particles = page.locator("#confetti-host .box")
    assert particles.count() >= 20, f"confetti genero pocas particulas: {particles.count()}"

    page.screenshot(path=shot, full_page=True)

    # 4. reduced-motion: los elementos quedan visibles SIN animar.
    page.emulate_media(reduced_motion="reduce")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(300)
    page.click("#run-all")
    page.wait_for_timeout(300)
    assert page.locator("[data-testid='fade-box']").is_visible(), "fade-box invisible con reduced-motion"
    assert page.locator("[data-testid='slide-box']").is_visible(), "slide-box invisible con reduced-motion"
    circle2 = page.locator("[data-testid='draw-circle']")
    dash2 = circle2.evaluate("el => window.getComputedStyle(el).strokeDashoffset")
    assert dash2 in ("0px", "0"), f"drawOn sin animar dejo trazo: stroke-dashoffset={dash2}"


def main():
    assertions = {
        "iphone": assert_animations,
        "ipad": assert_animations,
    }
    errors = run_views(assertions, __file__, "f43")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("F43 PASSED — animaciones OK en 375x812 y 768x1024, reduced-motion respetado")
    return 0


if __name__ == "__main__":
    sys.exit(main())
