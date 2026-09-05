"""Fase 93 #26: T&C y Política de privacidad rediseñados en formato artículo.

Verifica:
- Onboarding: los enlaces «términos de uso» (/terminos) y «política de
  privacidad» (/privacidad) navegan a sus rutas reales.
- /terminos y /privacidad: estructura de artículo (TOC desplegable con anclas,
  h2 + párrafos por sección, fecha de actualización, enlace de contacto mailto),
  cross-links entre páginas y 0 errores de consola.
- /ajustes: los dos enlaces legales están visibles.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

CONTACT_EMAIL = "gymlab@app.gymlab.dev"
TERMINOS_IDS = ["proposito", "datos", "permisos", "responsabilidad", "usoAceptable", "menores", "licencia", "cambios"]
PRIVACIDAD_IDS = ["responsable", "datos", "compras", "publicidad", "analitica", "permisos", "seguridad", "derechos", "menores", "cambios"]


def check_articulo(page, section_ids, label, errors):
    """Comprueba la estructura común de artículo legal: fecha, TOC y secciones."""
    if page.locator("text=Última actualización").count() == 0:
        errors.append(f"{label}: falta la fecha de actualización")

    details = page.locator("details")
    if details.count() == 0:
        errors.append(f"{label}: falta el TOC desplegable (details)")
    else:
        summary = details.first.locator("summary").inner_text()
        if "Índice" not in summary:
            errors.append(f"{label}: el summary del TOC no es «Índice...»")

    toc_links = page.locator("details ol a")
    if toc_links.count() != len(section_ids):
        errors.append(f"{label}: el TOC tiene {toc_links.count()} enlaces, se esperaban {len(section_ids)}")

    for sid in section_ids:
        if page.locator(f"section#{sid}").count() == 0:
            errors.append(f"{label}: falta la sección con id={sid}")
        else:
            sec = page.locator(f"section#{sid}")
            if sec.locator("h2").count() == 0:
                errors.append(f"{label}: la sección {sid} no tiene h2")
            pars = sec.locator("p")
            if pars.count() < 1:
                errors.append(f"{label}: la sección {sid} no tiene párrafos")

    # Ancla del TOC navega al primer enlace y fija el hash.
    if toc_links.count() > 0:
        page.locator("details summary").first.click()
        page.wait_for_timeout(300)
        toc_links.first.click()
        page.wait_for_timeout(400)
        expected_hash = f"#{section_ids[0]}"
        if expected_hash not in page.url:
            errors.append(f"{label}: al pulsar el primer ancla no se fijó {expected_hash} (url={page.url})")

    if page.locator(f'a[href^="mailto:{CONTACT_EMAIL}"]').count() == 0:
        errors.append(f"{label}: falta el enlace mailto a {CONTACT_EMAIL}")


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
            # --- Onboarding: cross-links legales navegan a sus rutas ---
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(1500)

            priv = page.locator('a[href="/privacidad"]')
            if priv.count() > 0:
                priv.first.click()
                page.wait_for_timeout(600)
                if page.url.rstrip("/").endswith("/privacidad"):
                    pass
                else:
                    errors.append("Onboarding: «política de privacidad» no llevó a /privacidad")
                page.go_back()
                page.wait_for_timeout(600)
                term = page.locator('a[href="/terminos"]')
                if term.count() > 0:
                    term.first.click()
                    page.wait_for_timeout(600)
                    if not page.url.rstrip("/").endswith("/terminos"):
                        errors.append("Onboarding: «términos de uso» no llevó a /terminos")
                page.go_back()
                page.wait_for_timeout(600)

            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            # --- /terminos: artículo ---
            page.goto(f"{BASE}/terminos", wait_until="networkidle")
            page.wait_for_timeout(1200)
            if page.locator("h1", has_text="Términos").count() == 0:
                errors.append("/terminos: no muestra el título principal")
            check_articulo(page, TERMINOS_IDS, "/terminos", errors)
            if page.locator('a[href="/privacidad"]').count() == 0:
                errors.append("/terminos: falta el cross-link a /privacidad")

            # --- /privacidad: artículo ---
            page.goto(f"{BASE}/privacidad", wait_until="networkidle")
            page.wait_for_timeout(1200)
            if page.locator("h1", has_text="Privacidad").count() == 0:
                errors.append("/privacidad: no muestra el título principal")
            check_articulo(page, PRIVACIDAD_IDS, "/privacidad", errors)
            if page.locator('a[href="/terminos"]').count() == 0:
                errors.append("/privacidad: falta el cross-link a /terminos")

            # --- /ajustes: enlaces legales ---
            page.goto(f"{BASE}/ajustes", wait_until="networkidle")
            page.wait_for_timeout(1200)
            if page.locator('a[href="/terminos"]').count() == 0:
                errors.append("/ajustes: falta el enlace a /terminos")
            if page.locator('a[href="/privacidad"]').count() == 0:
                errors.append("/ajustes: falta el enlace a /privacidad")

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
        sys.exit(1)
    else:
        print("ALL OK")


if __name__ == "__main__":
    main()