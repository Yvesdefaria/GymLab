# F110 — Logger de desarrollo: helpers de CDP, boot log y switch de 3 estados.
# Dos modos, según `status["dev"]`:
#   - dev: `auto` ya está activo, así que `enable()` sería indistinguible; se verifica
#     el ciclo auto → disable → reset (boot log, silencio y reaparición).
#   - preview (build de producción, `--mode preview`): `auto` es mudo; esta rama cubre
#     el residual (c) del review de F110: verificación REAL de que `enable()` enciende
#     los logs, `disable()` silencia todo `[gymlab:*]` y `reset()` vuelve al auto mudo
#     en el bundle de producción (en dev nada de eso se distingue de `auto`).
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

        is_dev = False
        try:
            # Carga inicial común: de acá sale el modo (`dev` vs preview/producción).
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(800)

            status = page.evaluate("() => window.__gymlabLog?.status?.()")
            assert status is not None, "window.__gymlabLog no está disponible"
            is_dev = bool(status["dev"])

            if is_dev:
                # A) Dev: helpers presentes, estado automático activo y boot log visible.
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
            else:
                # A) Preview: auto es MUDO (acá `enable()` sí se distingue).
                assert status == {"state": "auto", "dev": False, "active": False}, (
                    f"status inesperado en preview: {status}"
                )
                gymlab_lines = [line for line in console_all if "[gymlab:" in line]
                assert not gymlab_lines, (
                    f"auto en producción debe ser mudo; salió: {gymlab_lines}"
                )
                print("OK: auto mudo en producción (silencio total)")

                # B) enable() → '1' persistido y boot log visible tras reload.
                confirm = page.evaluate("() => window.__gymlabLog.enable()")
                assert "ON" in confirm, f"enable() devolvió: {confirm}"
                assert page.evaluate("() => localStorage.getItem('gymlab.debug')") == "1"
                console_all.clear()
                page.reload(wait_until="networkidle")
                page.wait_for_timeout(800)
                assert any(BOOT_PREFIX in line for line in console_all), (
                    "el boot log debería aparecer tras enable() en producción"
                )
                status = page.evaluate("() => window.__gymlabLog?.status?.()")
                assert status == {"state": "on", "dev": False, "active": True}, (
                    f"status tras enable: {status}"
                )
                print("OK: enable() activa logs en producción (persistido + reload)")

                # C) disable() → '0' persistido y silencio total de [gymlab:*].
                confirm = page.evaluate("() => window.__gymlabLog.disable()")
                assert "OFF" in confirm, f"disable() devolvió: {confirm}"
                assert page.evaluate("() => localStorage.getItem('gymlab.debug')") == "0"
                console_all.clear()
                page.reload(wait_until="networkidle")
                page.wait_for_timeout(800)
                gymlab_lines = [line for line in console_all if "[gymlab:" in line]
                assert not gymlab_lines, (
                    f"disable() debe silenciar todo [gymlab:*]; salió: {gymlab_lines}"
                )
                status = page.evaluate("() => window.__gymlabLog?.status?.()")
                assert status == {"state": "off", "dev": False, "active": False}, (
                    f"status tras disable: {status}"
                )
                print("OK: disable() silencia todo en producción (persistido + reload)")

                # D) reset() → clave removida y vuelta al auto mudo.
                confirm = page.evaluate("() => window.__gymlabLog.reset()")
                assert "AUTO" in confirm, f"reset() devolvió: {confirm}"
                assert page.evaluate("() => localStorage.getItem('gymlab.debug')") is None
                console_all.clear()
                page.reload(wait_until="networkidle")
                page.wait_for_timeout(800)
                gymlab_lines = [line for line in console_all if "[gymlab:" in line]
                assert not gymlab_lines, (
                    f"reset() debe volver al auto mudo; salió: {gymlab_lines}"
                )
                status = page.evaluate("() => window.__gymlabLog?.status?.()")
                assert status == {"state": "auto", "dev": False, "active": False}, (
                    f"status tras reset: {status}"
                )
                print("OK: reset() vuelve al auto mudo en producción")

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
    mode = "dev" if is_dev else "preview"
    print(f"ALL OK: F110 logger en {mode} (3 estados + boot log + silencio real)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
