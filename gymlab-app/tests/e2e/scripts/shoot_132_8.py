"""Capturas de F132.8 (Ajustes, Términos, Privacidad) para revisión visual.

Uso: python tests/e2e/scripts/shoot_132_8.py [--port 5299] [--out tests/screenshots/132.8]

El puerto se resuelve en este orden: `--port`, luego `E2E_PORT` (que exporta
`with_server.py`) y por último 5299. Si el server no responde, `page.goto`
falla y el script sale distinto de cero en vez de reportar OK.
"""
import argparse
import os
import sys

from playwright.sync_api import sync_playwright

ROUTES = [
    ("ajustes", "/ajustes"),
    ("terminos", "/terminos"),
    ("privacidad", "/privacidad"),
]

VIEWPORTS = [(375, 812, "375"), (768, 1024, "768")]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Capturas de F132.8 en 375 y 768 px.")
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("E2E_PORT", "5299")),
        help="puerto del dev server (default: E2E_PORT o 5299)",
    )
    parser.add_argument(
        "--out",
        default=os.path.join("tests", "screenshots", "132.8"),
        help="directorio de salida de las capturas",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    base = f"http://localhost:{args.port}"
    os.makedirs(args.out, exist_ok=True)
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width, height, label in VIEWPORTS:
            ctx = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=2)
            page = ctx.new_page()
            page.on("pageerror", lambda e: errors.append(str(e)))
            for name, path in ROUTES:
                page.goto(f"{base}{path}", wait_until="networkidle")
                # Onboarding/tour modals steal the first paint on a fresh profile.
                for text in ("Ya entreno aquí", "I already train here"):
                    btn = page.locator("button", has_text=text)
                    if btn.count() > 0:
                        btn.first.click()
                        page.wait_for_timeout(300)
                page.wait_for_timeout(250)
                page.screenshot(path=os.path.join(args.out, f"{name}-{label}.png"), full_page=True)
                print(f"OK {name}-{label}.png")
            ctx.close()
        browser.close()
    if errors:
        print("PAGE ERRORS:")
        for e in errors:
            print(" -", e)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
