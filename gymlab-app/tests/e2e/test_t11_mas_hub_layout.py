"""T11: /mas sin overflow horizontal a 320/375/768, filas >= 44 px, 0 errores."""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"
VIEWPORTS = [
    {"width": 320, "height": 700},
    {"width": 375, "height": 812},
    {"width": 768, "height": 1024},
]


def check(browser, errors, vp):
    tag = f"{vp['width']}x{vp['height']}"
    ctx = browser.new_context(viewport=vp)
    page = ctx.new_page()
    console = []
    page.on("console", lambda m: console.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console.append(str(e)))
    try:
        page.goto(f"{BASE}/mas", wait_until="networkidle")
        page.wait_for_timeout(800)
        skip = page.locator("button", has_text="Ya entreno aquí")
        if skip.count():
            skip.first.click()
            page.goto(f"{BASE}/mas", wait_until="networkidle")
            page.wait_for_timeout(500)

        if page.evaluate("document.documentElement.scrollWidth > window.innerWidth"):
            errors.append(f"[{tag}] overflow horizontal")

        rows = page.locator('nav[data-tour="mas-links"] a[href]')
        assert rows.count() == 17, f"[{tag}] {rows.count()} filas"
        for i in range(rows.count()):
            bb = rows.nth(i).bounding_box()
            if bb is None or bb["height"] < 44:
                errors.append(f"[{tag}] fila {i} mide {bb and bb['height']}px")
    except Exception as e:
        errors.append(f"[{tag}] {e}")
    finally:
        errors.extend(f"[{tag}] console: {c}" for c in console)
        page.close()
        ctx.close()


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for vp in VIEWPORTS:
            check(browser, errors, vp)
        browser.close()

    if errors:
        print("ERRORS:", *[f"  - {e}" for e in errors], sep="\n")
        sys.exit(1)
    print("T11 PASSED — /mas sin overflow, 17 filas tactiles")


if __name__ == "__main__":
    main()
