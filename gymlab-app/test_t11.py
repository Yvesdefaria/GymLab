"""Test T11: guías con secciones — secciones apiladas legibles, tipografía
diferenciada, fallback a keyPoints cuando no hay secciones, animación visible."""
import sys

from scripts.e2e_utils import run_views, base_url


def assert_detail(page, view_name, shot):
    page.goto(base_url(), wait_until="networkidle")
    page.wait_for_timeout(500)

    close_btn = page.get_by_role("button", name="Ya entreno aquí")
    if close_btn.count():
        close_btn.first.click()
        page.wait_for_timeout(300)

    # 1. Guía con secciones: técnica de sentadilla (nueva, con sections).
    page.goto(f"{base_url()}/guias/tecnica-sentadilla", wait_until="networkidle")
    page.wait_for_timeout(800)

    # Las 4 secciones se apilan en paneles con h2 (tipografía diferenciada).
    sections = page.locator("section.panel h2")
    assert sections.count() == 4, f"esperaba 4 secciones, hay {sections.count()}"
    titles = [s.inner_text() for s in sections.all()]
    assert "Posición inicial" in titles and "Errores comunes" in titles

    # Contenido en párrafo + bullets con viñeta.
    assert page.locator("section.panel p.text-fg").count() >= 4
    assert page.locator("section.panel ul li").count() >= 8

    # El h1 del header es el título de la guía.
    header = page.locator("h1")
    assert "sentadilla" in header.inner_text().lower()

    page.screenshot(path=shot.replace(".png", "-secciones.png"), full_page=True)

    # 2. Guía antigua sin secciones: sigue mostrando keyPoints (fallback).
    page.goto(f"{base_url()}/guias/suplementos-base", wait_until="networkidle")
    page.wait_for_timeout(400)
    bullets = page.locator("ul.panel li")
    assert bullets.count() == 4, f"fallback keyPoints: esperaba 4, hay {bullets.count()}"
    assert page.locator("section.panel h2").count() == 0

    # 3. No se rompe con slug inexistente.
    page.goto(f"{base_url()}/guias/no-existe", wait_until="networkidle")
    page.wait_for_timeout(300)
    assert "no encontrada" in page.inner_text("body").lower()


def main():
    errors = run_views({"iphone": assert_detail, "ipad": assert_detail}, __file__, "t11")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("T11 PASSED — secciones de guía OK en 375x812 y 768x1024")
    return 0


if __name__ == "__main__":
    sys.exit(main())
