"""Fase 93 #18: filtro «Comunes» con el grupo de ejercicios relevantes como predeterminados.

Verifica que:
- `/ejercicios` muestra el chip «Comunes» junto a «Favoritos».
- Al activarlo, el subtítulo cifra exactamente el set canónico (34 de total) y la
  primera tarjeta visible es la sentadilla (orden canónico).
- Un segundo toque limpia el filtro y vuelve el total completo.
- 0 errores de consola.
"""
import re
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

COMMON_COUNT = 34


def parse_count(body: str):
    # El subtítulo cifra la lista virtualizada: «{{count}} de {{total}} ejercicios».
    m = re.search(r"(\d+)\s*de\s*(\d+)\s+ejercicios", body)
    return (int(m.group(1)), int(m.group(2))) if m else (None, None)


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

            # --- Biblioteca de ejercicios ---
            page.goto(f"{BASE}/ejercicios", wait_until="networkidle")
            page.wait_for_timeout(1200)

            comunes = page.locator("button", has_text="Comunes")
            if comunes.count() == 0:
                errors.append("Chip «Comunes» no visible en /ejercicios")

            body = page.inner_text("body")
            count, total = parse_count(body)
            if not (total and count == total and total > 100):
                errors.append(f"Subtítulo inicial inesperado (count={count}, total={total})")

            cards = page.locator("a[href^='/ejercicios/']")

            # Activar «Comunes»: se preselecciona el grupo canónico y la primera tarjeta es la sentadilla.
            comunes.first.click()
            page.wait_for_timeout(600)
            if page.locator('button[aria-pressed="true"]', has_text="Comunes").count() == 0:
                errors.append("El chip «Comunes» no quedó activo tras el toque")

            body = page.inner_text("body")
            count, total_after = parse_count(body)
            if count != COMMON_COUNT or total_after != total:
                errors.append(f"«Comunes» debía mostrar {COMMON_COUNT} de {total}, vi {count} de {total_after}")

            if "Sentadilla con barra" not in body:
                errors.append("Primera fila común no visible (sentadilla)")

            primera = cards.first.get_attribute("href") or ""
            if "sentadilla-con-barra" not in primera:
                errors.append(f"El primer ejercicio de «Comunes» no es la sentadilla (href={primera})")

            # Segundo toque: se limpia el filtro y vuelve el total.
            comunes.first.click()
            page.wait_for_timeout(600)
            count, total_final = parse_count(page.inner_text("body"))
            if count != total_final or total_final != total:
                errors.append(f"Limpiar «Comunes» no restauró el catálogo (count={count}, total={total_final})")

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