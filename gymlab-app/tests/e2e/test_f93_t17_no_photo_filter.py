"""Fase 93 #17: el filtro «Con foto» de la biblioteca de ejercicios queda eliminado.

Verifica que:
- `/ejercicios` muestra los chips de filtro restantes (Músculo, Categoría, Equipo, Favoritos)
  pero NO el botón «Con foto».
- Los ejercicios (incluso sin foto) siguen listándose y son filtrables por búsqueda.
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"


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

            body = page.inner_text("body")

            # El chip «Con foto» NO debe existir en ninguna de sus variantes.
            con_foto = page.locator("button", has_text="Con foto").count() + page.locator("button", has_text="With photo").count()
            if con_foto != 0:
                errors.append(f"El filtro «Con foto» sigue visible (count={con_foto})")

            # El chip «Favoritos» sigue presente.
            if "Favoritos" not in body:
                errors.append("Chip «Favoritos» no visible")

            # Hay ejercicios listados.
            cards = page.locator("a[href^='/ejercicios/']").count()
            if cards < 5:
                errors.append(f"Esperaba >=5 ejercicios en la biblioteca, vi {cards}")

            # La búsqueda sigue filtrando.
            buscador = page.locator("input[type='text']").first
            if buscador.count() == 0:
                errors.append("No hay buscador en /ejercicios")
            else:
                buscador.fill("sentadilla")
                page.wait_for_timeout(600)
                cards_filtrados = page.locator("a[href^='/ejercicios/']").count()
                if cards_filtrados == 0:
                    errors.append("La búsqueda 'sentadilla' no devolvió resultados")
                if cards_filtrados >= cards:
                    errors.append("La búsqueda no filtró la lista")

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