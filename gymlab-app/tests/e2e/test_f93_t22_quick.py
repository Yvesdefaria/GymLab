"""Fase 93 #22: sesión rápida del home (QuickTemplates) enlazada a catálogo real.

Verifica:
- En /, el bloque 'Sesión rápida' está presente con los chips de categoría.
- Al arrancar 'Full Body Express', se navega a /entrenamiento/active (ruta canónica).
- La sesión activa muestra los ejercicios con nombres REALES del catálogo
  (p.ej. 'Flexiones', 'Plancha', 'Sentadillas') y NO ids sintéticos
  (sin 'Ejercicio -1', sin nombres de la forma 'quickTemplates.').
- F113: el carrusel de la sesión mide su propio desborde horizontal (y la página sigue sin
  scroll lateral), el swipe cambia de ejercicio y la barra fija de acciones queda visible.
- Sin errores de consola.
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
            # El arranque siembra Dexie y muestra "Cargando GymLab..." (puede tardar
            # decenas de segundos en frío); `networkidle` ya se documentó como frágil
            # en el arranque (tests/e2e/scripts/e2e_utils.py). Esperar al contenido
            # real evita el falso rojo por asertar antes de que la home monte.
            page.goto(BASE, wait_until="domcontentloaded")
            page.wait_for_selector(
                "button:has-text('Ya entreno aquí'), button:has-text('Full Body Express')",
                timeout=120000,
            )
            page.wait_for_timeout(500)
            skip = page.locator("button", has_text="Ya entreno aquí")
            if skip.count() > 0:
                skip.first.click(timeout=5000)
                page.wait_for_timeout(800)

            kicker = page.locator("p.kicker", has_text="Sesión rápida")
            if kicker.count() > 0:
                print("OK: bloque 'Sesión rápida' presente en /")
            else:
                errors.append("home: no se ve el bloque 'Sesión rápida'")

            # Chips de categoría
            for label in ("Express", "Stretch", "Movilidad"):
                chip = page.locator("button", has_text=label)
                if chip.count() > 0:
                    print(f"OK: chip de categoría '{label}' presente")
                else:
                    errors.append(f"home: falta el chip de categoría '{label}'")

            # Arrancar Full Body Express
            fb = page.locator("button", has_text="Full Body Express").first
            if fb.count() == 0:
                errors.append("home: no se encuentra la tarjeta 'Full Body Express'")
            else:
                fb.click(timeout=5000)
                page.wait_for_timeout(1500)
                if "/entrenamiento/active" in page.url:
                    print("OK: navegó a /entrenamiento/active")
                else:
                    errors.append(f"home: no navegó a sesión activa (url={page.url})")

                # Nombres reales del catálogo visibles en la sesión activa
                active_body = page.inner_text("body")
                expected = ["Flexiones", "Plancha", "Sentadilla con peso corporal"]
                for name in expected:
                    if name in active_body:
                        print(f"OK: ejercicio real '{name}' visible en la sesión")
                    else:
                        errors.append(f"sesión: no se ve el ejercicio real '{name}'")

                # Sin ids sintéticos
                for bad in ("Ejercicio -1", "quickTemplates."):
                    if bad in active_body:
                        errors.append(f"sesión: se ve id sintético/fallback '{bad}'")

            # F113: el carrusel es horizontal de verdad. La assertion mide el CARRUSEL
            # (scrollWidth vs clientWidth), no documentElement, y cubre swipe + barra fija.
            carousel = page.locator('[aria-label="Ejercicios de la sesión"]')
            if carousel.count() == 0:
                errors.append("sesión: no aparece el carrusel ('Ejercicios de la sesión')")
            else:
                slides = carousel.locator('[role="group"]')
                total = slides.count()
                sw = carousel.evaluate("el => el.scrollWidth")
                cw = carousel.evaluate("el => el.clientWidth")
                if total < 2 or sw <= cw + 5:
                    errors.append(f"carrusel: no desborda horizontalmente (slides={total}, {sw} vs {cw})")
                else:
                    print(f"OK: carrusel con {total} slides montados ({sw} > {cw})")

                # La página no gana scroll horizontal: el desborde queda contenido en el carrusel.
                page_sw = page.evaluate("() => document.documentElement.scrollWidth")
                page_cw = page.evaluate("() => document.documentElement.clientWidth")
                if page_sw > page_cw + 5:
                    errors.append(f"sesión: scroll horizontal de página {page_sw} > {page_cw}")
                else:
                    print("OK: sin scroll horizontal de página")

                # Indicador V2: contador «N de M» (arranca en 1) + aria por slide.
                section = page.locator("section").filter(has=carousel)
                counter = section.locator("p[aria-live='polite']")
                if counter.count() != 1 or counter.inner_text() != f"1 de {total}":
                    errors.append(
                        f"carrusel: contador inesperado ({counter.count()}): "
                        f"{counter.inner_text() if counter.count() else '—'}"
                    )
                else:
                    print(f"OK: contador '1 de {total}' visible")
                if not slides.first.get_attribute("aria-label"):
                    errors.append("carrusel: el primer slide no tiene aria-label")

                # Swipe/deslizamiento: el slide 2 entra en el viewport y el contador lo sigue.
                page.evaluate(
                    """() => {
                      const carousel = document.querySelector('[aria-label="Ejercicios de la sesión"]')
                      const slides = carousel.querySelectorAll('[role="group"]')
                      const slide = slides[1]
                      carousel.scrollTo({ left: slide.offsetLeft - (carousel.clientWidth - slide.clientWidth) / 2 })
                    }"""
                )
                page.wait_for_timeout(500)
                if counter.inner_text() != f"2 de {total}":
                    errors.append(f"carrusel: el contador no siguió el swipe ({counter.inner_text()})")
                else:
                    print(f"OK: el contador siguió el swipe ('2 de {total}')")
                box = slides.nth(1).bounding_box()
                carcass = carousel.bounding_box()
                if (
                    not box
                    or not carcass
                    or box["x"] >= carcass["x"] + carcass["width"]
                    or box["x"] + box["width"] <= carcass["x"]
                ):
                    errors.append("carrusel: el slide 2 no quedó visible tras el swipe")
                else:
                    print("OK: el slide 2 quedó visible tras el swipe")

                # Barra fija: añadir + finalizar visibles y sin duplicar el botón en flujo.
                add_btn = page.locator('button:has-text("Añadir ejercicio")')
                finish_btn = page.locator('button:has-text("Finalizar entreno")')
                if add_btn.count() != 1:
                    errors.append(f"barra fija: se esperaba 1 botón 'Añadir ejercicio', hay {add_btn.count()}")
                elif not add_btn.first.is_visible() or not finish_btn.first.is_visible():
                    errors.append("barra fija: añadir/finalizar no están visibles")
                else:
                    print("OK: barra fija con 'Añadir ejercicio' y 'Finalizar entreno'")

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
        print("\nALL OK")


if __name__ == "__main__":
    main()
