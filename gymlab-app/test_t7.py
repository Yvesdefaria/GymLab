"""Test T7: pasos detallados de técnica en la ficha de ejercicio — lista numerada,
badges de tip/warning con icono (no solo color), fallback a instructions."""
import sys

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url


def assert_detail(page, view_name, shot):
    page.goto(f"{base_url()}/ejercicios", wait_until="networkidle")
    page.wait_for_timeout(500)

    close_btn = page.get_by_role("button", name="Ya entreno aquí")
    if close_btn.count():
        close_btn.first.click()
        page.wait_for_timeout(300)

    # 1. Abrir la ficha de un ejercicio principal con pasos (press banca).
    page.goto(f"{base_url()}/ejercicios/press-de-pecho-con-barra", wait_until="networkidle")
    page.wait_for_timeout(900)

    # Lista numerada de pasos (sección Técnica).
    section = page.get_by_text("Técnica", exact=True).first.locator("xpath=..")
    steps = page.locator("ol > li")
    assert steps.count() >= 4, f"esperaba >=4 pasos, hay {steps.count()}"
    # El número del paso 1 es visible (texto «1»).
    assert steps.first.locator("span").first.inner_text().strip() == "1"

    # 2. Badges de tip y warning con icono (no dependen solo del color).
    has_tip_icon = page.locator("ol svg.lucide-lightbulb").count() > 0
    has_warning_icon = page.locator("ol svg.lucide-alert-triangle").count() > 0
    assert has_tip_icon or has_warning_icon, "no hay iconos de tip/warning"
    # Al menos un aviso con texto visible (press banca tiene warning).
    warn_text = page.locator("ol p.text-danger")
    assert warn_text.count() >= 1, "press banca debería tener un warning"

    page.screenshot(path=shot.replace(".png", "-pasos.png"), full_page=False)

    # 3. Un ejercicio sin detailedSteps sigue mostrando instructions como texto.
    page.goto(f"{base_url()}/ejercicios/aperturas-en-maquina", wait_until="networkidle")
    page.wait_for_timeout(500)
    section2 = page.get_by_text("Técnica", exact=True).first
    expect(section2).to_be_visible()
    instructions_text = page.locator("p.text-sm.leading-relaxed.text-fg")
    assert instructions_text.count() >= 1, "falta el párrafo de instructions"

    # 4. La página no lanza errores de consola (comprobado por run_views) y los
    #    pasos siguen visibles tras la animación.
    page.goto(f"{base_url()}/ejercicios/press-de-pecho-con-barra", wait_until="networkidle")
    page.wait_for_timeout(1000)
    assert page.locator("ol > li").count() >= 4


def main():
    errors = run_views({"iphone": assert_detail, "ipad": assert_detail}, __file__, "t7")
    if errors:
        print("FALLO:", *errors, sep="\n  ")
        return 1
    print("T7 PASSED — pasos detallados con badges tip/warning OK en 375x812 y 768x1024")
    return 0


if __name__ == "__main__":
    sys.exit(main())
