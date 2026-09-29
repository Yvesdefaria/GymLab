# F110 — Logger de desarrollo: helpers de CDP, boot log y switch de 3 estados.
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"
BOOT_PREFIX = "[gymlab:boot]"


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()

        console_all = []
        console_errors = []
        page.on("console", lambda m: console_all.append(f"{m.type}: {m.text}"))
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}")
            if m.type == "error"
            else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            # A) Dev: helpers presentes, estado automático activo y boot log visible.
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(800)

            status = page.evaluate("() => window.__gymlabLog?.status?.()")
            assert status == {"state": "auto", "dev": True, "active": True}, (
                f"status inesperado: {status}"
            )
            assert any(BOOT_PREFIX in line for line in console_all), (
                "no apareció el boot log en dev"
            )
            print("OK: estado auto + boot log visibles en dev")

            # B) disable() → '0' persistido y silencio real tras reload.
            confirm = page.evaluate("() => window.__gymlabLog.disable()")
            assert "OFF" in confirm, f"disable() devolvió: {confirm}"
            console_all.clear()
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(800)
            assert not any(BOOT_PREFIX in line for line in console_all), (
                "el boot log debería estar silenciado con disable()"
            )
            status = page.evaluate("() => window.__gymlabLog?.status?.()")
            assert status == {"state": "off", "dev": True, "active": False}, (
                f"status tras disable: {status}"
            )
            assert page.evaluate("() => localStorage.getItem('gymlab.debug')") == "0"
            print("OK: disable() silencia en dev (persistido + reload)")

            # C) reset() → vuelve al automático y el boot log reaparece.
            console_all.clear()
            page.evaluate("() => window.__gymlabLog.reset()")
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(800)
            assert any(BOOT_PREFIX in line for line in console_all), (
                "el boot log debería volver tras reset()"
            )
            assert page.evaluate("() => localStorage.getItem('gymlab.debug')") is None
            print("OK: reset() vuelve al automático")

        except AssertionError as e:
            errors.append(f"AssertionError: {e}")
        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            page.close()
            context.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F110 logger (3 estados + boot log + silencio real)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
