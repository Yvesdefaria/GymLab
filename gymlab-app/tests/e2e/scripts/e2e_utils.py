"""Helpers para los tests E2E duales (iPhone 375x812 + iPad 768x1024 [+ landscape 1024x768]).

Patron de uso en un test_*.py:

    from scripts.e2e_utils import run_views, base_url, screenshot_path

    def assert_iphone(page, name): ...
    def assert_ipad(page, name): ...

    errors = run_views({"iphone": assert_iphone, "ipad": assert_ipad}, __file__, "f43")
    if errors:
        print("FALLO:", errors)
        sys.exit(1)
"""
import os
from playwright.sync_api import sync_playwright

VIEWPORTS = {
    "iphone": {"width": 375, "height": 812},
    "ipad": {"width": 768, "height": 1024},
    "ipad-landscape": {"width": 1024, "height": 768},
}


def base_url():
    port = os.environ.get("E2E_PORT", "5173")
    return f"http://localhost:{port}"


def screenshot_path(test_file, view_name, label=""):
    """Screenshot junto al test: test_f43-iphone.png"""
    stem = os.path.splitext(os.path.basename(test_file))[0]
    return f"{stem}-{view_name}{f'-{label}' if label else ''}.png"


def run_views(assertions, test_file, label="", console_errors_ok=False):
    """Ejecuta cada viewport pedido y devuelve lista de errores (vacia = OK).

    assertions: dict view_name -> callable(page, view_name, screenshot).
    Las funciones reciben la page ya navegada a base_url() y pueden volver
    a navegar donde necesiten.
    """
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            for view_name, fn in assertions.items():
                if view_name not in VIEWPORTS:
                    errors.append(f"viewport desconocido: {view_name}")
                    continue
                page = browser.new_page(viewport=VIEWPORTS[view_name])
                console_errors = []
                page.on("console", lambda m, vn=view_name: console_errors.append(f"[{vn}] console.{m.type}: {m.text}") if m.type == "error" else None)
                page.on("pageerror", lambda e, vn=view_name: console_errors.append(f"[{vn}] pageerror: {e}"))

                shot = screenshot_path(test_file, view_name, label)
                try:
                    page.goto(base_url(), wait_until="networkidle")
                    fn(page, view_name, shot)
                except Exception as e:
                    errors.append(f"[{view_name}] {e}")
                finally:
                    if console_errors and not console_errors_ok:
                        errors.extend(console_errors)
                    page.close()
        finally:
            browser.close()
    return errors
