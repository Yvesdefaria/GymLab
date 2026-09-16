"""Fase 66: «Mi equipamiento» como preferencia persistida que guía el catálogo.

Verifica que:
- `/ejercicios` expone el grupo «Mi equipamiento» con el chip «Mostrar todo» activo.
- Sin equipamiento declarado NO se filtra nada (count == total): el catálogo nunca
  aparece vacío por no haber configurado la preferencia.
- Al marcar un equipo el catálogo se limita a él y aparece el aviso de límite.
- La selección SOBREVIVE a una recarga: es el test que atrapa la clase de bug
  «componente existe pero es inalcanzable» que dejó F66 a medias.
- «Mostrar todo» restaura el catálogo completo.
- 0 errores de consola.
"""
import re
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

STORAGE_KEY = "gymlab-equipment"
EQUIPO = "Barra"


def parse_count(body: str):
    # El subtítulo cifra la lista virtualizada: «{{count}} de {{total}} ejercicios».
    m = re.search(r"(\d+)\s*de\s*(\d+)\s+ejercicios", body)
    return (int(m.group(1)), int(m.group(2))) if m else (None, None)


def chip(page, label: str):
    return page.locator("button[aria-pressed]", has_text=label)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(1500)

            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            # Arranque limpio: la preferencia es persistida, así que el test la borra primero.
            page.evaluate(f"localStorage.removeItem('{STORAGE_KEY}')")

            # --- Catálogo con la preferencia vacía ---
            page.goto(f"{BASE}/ejercicios", wait_until="networkidle")
            page.wait_for_timeout(1200)

            grupo = page.locator("[role='group'][aria-label='Mi equipamiento']")
            if grupo.count() == 0:
                errors.append("Grupo «Mi equipamiento» no visible en /ejercicios (F66 sigue inalcanzable)")

            mostrar_todo = chip(page, "Mostrar todo")
            if mostrar_todo.count() == 0:
                errors.append("Chip «Mostrar todo» no visible")
            elif mostrar_todo.first.get_attribute("aria-pressed") != "true":
                errors.append("«Mostrar todo» no está activo con la preferencia vacía")

            count, total = parse_count(page.inner_text("body"))
            if not (total and count == total and total > 100):
                errors.append(f"Sin equipamiento declarado debía verse todo (count={count}, total={total})")

            # --- Declarar un equipo: el catálogo se limita ---
            equipo = chip(page, EQUIPO)
            if equipo.count() == 0:
                errors.append(f"Chip de equipamiento «{EQUIPO}» no visible")
            else:
                equipo.first.click()
                page.wait_for_timeout(800)

                if chip(page, EQUIPO).first.get_attribute("aria-pressed") != "true":
                    errors.append(f"El chip «{EQUIPO}» no quedó activo tras el toque")

                body = page.inner_text("body")
                count_f, total_f = parse_count(body)
                if not (count_f is not None and 0 < count_f < total_f):
                    errors.append(f"«{EQUIPO}» debía limitar la lista (count={count_f}, total={total_f})")
                if "limitado a 1 equipo" not in body:
                    errors.append("No aparece el aviso de catálogo limitado")

                # --- LA aserción que importa: la preferencia persiste ---
                page.reload(wait_until="networkidle")
                page.wait_for_timeout(1500)

                if chip(page, EQUIPO).first.get_attribute("aria-pressed") != "true":
                    errors.append(f"«{EQUIPO}» no persistió tras recargar (localStorage {STORAGE_KEY})")

                count_r, total_r = parse_count(page.inner_text("body"))
                if count_r != count_f or total_r != total_f:
                    errors.append(
                        f"Tras recargar el filtro no se reaplicó (antes {count_f}/{total_f}, ahora {count_r}/{total_r})"
                    )

                # --- «Mostrar todo» restaura ---
                chip(page, "Mostrar todo").first.click()
                page.wait_for_timeout(800)
                count_t, total_t = parse_count(page.inner_text("body"))
                if count_t != total_t or total_t != total:
                    errors.append(f"«Mostrar todo» no restauró el catálogo (count={count_t}, total={total_t})")
                if "limitado a" in page.inner_text("body"):
                    errors.append("El aviso de límite sigue visible con la preferencia vacía")

                page.evaluate(f"localStorage.removeItem('{STORAGE_KEY}')")

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            page.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("ALL OK")


if __name__ == "__main__":
    main()
