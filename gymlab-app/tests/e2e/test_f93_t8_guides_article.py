"""Fase 93 #8 (extra): detalle de guía como artículo continuo.

Verifica que /guias/:slug renderiza el contenido como noticia redactada:
- La entradilla (summary) aparece como párrafo de apertura.
- La caja 'Ideas clave' (keyPoints) se muestra.
- Las secciones se renderizan en prosa continua (título + contenido + bullets).
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# slug -> (fragmento de summary, título de una sección, bullet esperado)
GUIDE = "arnold-volumen"
LEAD_HINT = "roble austríaco"
IDEAS_CLAVE = "Ideas clave"
SECTION_TITLE = "El estilo de Arnold"
BULLET_HINT = "Alta frecuencia"


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

            page.goto(f"{BASE}/guias/{GUIDE}", wait_until="networkidle")
            page.wait_for_timeout(1000)
            body = page.inner_text("body")

            # 1) Entradilla: el summary como párrafo de apertura.
            if LEAD_HINT not in body:
                errors.append(f"Entradilla (summary) NO visible: '{LEAD_HINT}'")
            else:
                print("OK: entradilla (summary) visible")

            # 2) Caja 'Ideas clave'.
            if IDEAS_CLAVE not in body:
                errors.append(f"Caja '{IDEAS_CLAVE}' NO visible")
            else:
                print(f"OK: caja '{IDEAS_CLAVE}' visible")

            # 3) Sección en prosa: título de sección + contenido + bullets.
            if SECTION_TITLE not in body:
                errors.append(f"Título de sección NO visible: '{SECTION_TITLE}'")
            else:
                print(f"OK: título de sección '{SECTION_TITLE}' visible")
            if BULLET_HINT not in body:
                errors.append(f"Bullet NO visible: '{BULLET_HINT}'")
            else:
                print(f"OK: bullet '{BULLET_HINT}' visible")

            # 4) No debe haber tarjetas por sección: el h2 de sección no está en un panel.
            h2_count = page.locator("h2").count()
            if h2_count < 2:
                errors.append(f"Esperaba >=2 h2 (Ideas clave + secciones), hay {h2_count}")
            else:
                print(f"OK: {h2_count} encabezados h2 en el artículo")

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