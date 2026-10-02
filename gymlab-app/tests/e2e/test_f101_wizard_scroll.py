"""F101 (101.6): el wizard del onboarding scrollea con gesto real sobre el fondo.

Causa original: el contenedor con overflow tenía `pointer-events-none`, así que un
wheel/touch fuera de la tarjeta no scrolleaba. Este test NO usa el auto-scroll de
Playwright: hace wheel sobre el fondo y exige que el contenedor scrollee y que el
CTA quede alcanzable y clickeable en 360x640.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Acotado al wizard por aria-label: el TourOverlay también usa role=dialog + aria-modal
# y tras el cierre del resumen ahora auto-arranca (F101), lo que haría falso el check final.
SCROLLER_SELECTOR = 'div[role="dialog"][aria-modal="true"][aria-label="Idioma"]'


def fill_generic_steps(page):
    # Paso 1 — Idioma.
    page.get_by_role("button", name="Español").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    # Paso 2 — Objetivo.
    page.get_by_role("button", name="Fuerza").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    # Paso 3 — Semana.
    page.get_by_role("button", name="3", exact=True).first.click()
    page.get_by_role("button", name="Gimnasio").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    # Paso 4 — Perfil válido (default kg; si la etiqueta difiere, ajustarla al label real).
    page.get_by_role("button", name="Hombre").click()
    page.get_by_label("Fecha de nacimiento").fill("1996-01-15")
    page.get_by_label("Altura en centímetros").fill("175")
    page.get_by_label("Peso en kg").fill("80")
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(400)


def scroll_top(page):
    return page.evaluate("(sel) => document.querySelector(sel).scrollTop", SCROLLER_SELECTOR)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 360, "height": 640})
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}")
            if m.type == "error"
            else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
        try:
            page.goto(BASE, wait_until="load")
            page.wait_for_timeout(1000)
            fill_generic_steps(page)
            page.wait_for_selector('input[type="checkbox"]', timeout=5000)

            # El paso Resumen debe desbordar este viewport: si no, el test no prueba nada.
            metric = page.evaluate(
                """(sel) => { const el = document.querySelector(sel); return { sh: el.scrollHeight, ch: el.clientHeight, top: el.scrollTop }; }""",
                SCROLLER_SELECTOR,
            )
            if metric["sh"] <= metric["ch"] + 40:
                errors.append(
                    f"wizard: el paso Resumen no desborda el viewport (scrollHeight={metric['sh']}, clientHeight={metric['ch']})"
                )

            # El auto-scroll de Playwright pudo dejar el scroller al tope: resetear a 0
            # para que el wheel pruebe un desplazamiento real desde el inicio.
            page.evaluate("(sel) => { document.querySelector(sel).scrollTop = 0; }", SCROLLER_SELECTOR)
            metric["top"] = 0

            # Gesto REAL de wheel sobre el fondo (x=6 está fuera de la tarjeta).
            page.mouse.move(6, 320)
            page.mouse.wheel(0, 500)
            page.wait_for_timeout(300)
            if scroll_top(page) <= metric["top"]:
                errors.append("wizard: el wheel sobre el fondo no scrollea (¿volvió pointer-events-none?)")

            # Rueda hasta que el CTA final quede alcanzable SIN auto-scroll de Playwright.
            for _ in range(12):
                box = page.get_by_role("button", name="Ya entreno aquí").last.bounding_box()
                if box and box["y"] >= 0 and box["y"] + box["height"] <= 640.5:
                    break
                page.mouse.wheel(0, 300)
                page.wait_for_timeout(150)
            else:
                errors.append("wizard: el CTA final no quedó alcanzable a 360x640 con gesto real")

            # Clic real tras el gesto (sin auto-scroll): cierra el wizard.
            page.get_by_role("button", name="Ya entreno aquí").last.click(timeout=3000)
            page.wait_for_url(f"{BASE}/", timeout=5000)
            # El wait_for_url ya estaba satisfecho de antes: verificar el efecto real (wizard desmontado).
            page.wait_for_timeout(300)
            if page.locator(SCROLLER_SELECTOR).count() != 0:
                errors.append("wizard: el diálogo siguió montado tras el clic final")
        except Exception as e:  # noqa: BLE001
            errors.append(str(e))
        finally:
            errors.extend(console_errors)
            page.close()
            browser.close()

    if errors:
        print("FALLO:")
        for e in errors:
            print(" -", e)
        return 1
    print("OK: F101.6 scroll del wizard alcanzable con gesto real a 360x640")
    return 0


if __name__ == "__main__":
    sys.exit(main())
