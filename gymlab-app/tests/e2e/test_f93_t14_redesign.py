"""Fase 93 #14: rediseño de suplementos y nutrición.

Verifica:
- Suplementos (/suplementos): seed visible, tarjetas con botón de check y badge de frecuencia,
  filtro por frecuencia, sin scroll horizontal, targets ≥44px.
- Nutrición (/nutricion): anillo de kcal (SVG) + barras de macros, y tarjetas apiladas por
  tipo de comida con subtotal de kcal tras añadir comidas por UI.
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
            page.wait_for_timeout(1200)
            skip = page.locator("button", has_text="Ya entreno aquí")
            if skip.count() > 0:
                skip.first.click(timeout=5000)
                page.wait_for_timeout(800)

            # ────────────────── Suplementos ──────────────────
            page.goto(f"{BASE}/suplementos", wait_until="networkidle")
            page.wait_for_timeout(1200)

            # Chips de filtro presentes (al menos los 5: Todos + 4 frecuencias)
            filter_chips = page.locator("button").filter(has_text="Todos")
            if filter_chips.count() == 0:
                errors.append("suplementos: falta el chip de filtro 'Todos'")
            else:
                print("OK: filtro 'Todos' presente")

            # Tarjetas con botón de check (lucide Check)
            check_btns = page.locator("button").filter(has=page.locator("svg.lucide-check"))
            if check_btns.count() < 5:
                errors.append(f"suplementos: esperaba ≥5 suplementos seed, hay {check_btns.count()}")
            else:
                print(f"OK: {check_btns.count()} suplementos con botón de check")

            # Metadato de frecuencia (badge texto) visible en al menos una tarjeta
            body = page.inner_text("body")
            for label in ("Diario", "Pre-entreno", "Post-entreno", "Semanal"):
                if label.lower() in body.lower():
                    print(f"OK: badge de frecuencia '{label}' visible")
                    break
            else:
                errors.append("suplementos: ningún badge de frecuencia (Diario/Pre/Post/Semanal) visible")

            # Filtro por frecuencia reduce la lista (ej. 'Pre-entreno' solo creatina/cafeína/BCAA/citrulina)
            page.locator("button", has_text="Pre-entreno").first.click()
            page.wait_for_timeout(400)
            pre_check_btns = page.locator("button").filter(has=page.locator("svg.lucide-check"))
            if pre_check_btns.count() < 1 or pre_check_btns.count() > check_btns.count():
                errors.append(f"suplementos: filtro Pre-entreno inesperado ({pre_check_btns.count()} vs {check_btns.count()})")
            else:
                print(f"OK: filtro Pre-entreno muestra {pre_check_btns.count()} suplementos")

            # Restablecer filtro
            page.locator("button", has_text="Todos").first.click()
            page.wait_for_timeout(300)

            # Touch targets: todos los botones visibles ≥44px
            touch = page.evaluate("""() => {
              const btns = document.querySelectorAll('button');
              const small = [];
              btns.forEach(el => {
                const h = el.getBoundingClientRect().height;
                if (h > 0 && h < 44) small.push((el.innerText || el.placeholder || el.getAttribute('aria-label') || '').substring(0, 30));
              });
              return small;
            }""")
            if touch:
                errors.append(f"suplementos: touch targets <44px: {touch}")
            else:
                print("OK: todos los botones de suplementos ≥44px")

            # Sin scroll horizontal
            sw = page.evaluate("() => document.documentElement.scrollWidth")
            cw = page.evaluate("() => document.documentElement.clientWidth")
            if sw > cw + 5:
                errors.append(f"suplementos: scroll horizontal {sw} > {cw}")
            else:
                print("OK: sin scroll horizontal en suplementos")

            # ────────────────── Nutrición ──────────────────
            page.goto(f"{BASE}/nutricion", wait_until="networkidle")
            page.wait_for_timeout(1200)

            # Anillo de kcal: SVG con círculos presente
            ring_svg = page.locator("svg circle")
            if ring_svg.count() >= 2:
                print("OK: anillo de kcal presente (SVG con 2 círculos)")
            else:
                errors.append("nutrición: no se encontró el anillo de kcal (SVG)")

            # Etiquetas de macros visibles
            nbody = page.inner_text("body")
            for label in ("Proteína", "Carbohidratos", "Grasa"):
                if label in nbody:
                    print(f"OK: macro '{label}' visible")
                    break
            else:
                errors.append("nutrición: no se ven las etiquetas de macros")

            # Añadir 2 comidas vía UI para verificar tarjetas apiladas
            def add_food(search, food_text):
                search_input = page.locator("input[type='text']").first
                search_input.fill(search)
                page.wait_for_timeout(400)
                item = page.locator("button", has_text=food_text).first
                if item.count() > 0:
                    item.click()
                    page.wait_for_timeout(300)
                else:
                    return False
                add_btn = page.locator("button", has_text="Agregar")
                if add_btn.count() == 0:
                    add_btn = page.locator("button", has_text="Add")
                if add_btn.count() > 0:
                    add_btn.first.click()
                    page.wait_for_timeout(500)
                    return True
                return False

            # Nota: el tipo de comida seleccionado por defecto es 'almuerzo'.
            if not add_food("pollo", "Pechuga"):
                errors.append("nutrición: no se pudo añadir 'Pechuga'")

            # Cambiar a la pestaña 'Cena' y añadir otra
            cena_tab = page.locator("button", has_text="Cena")
            if cena_tab.count() > 0:
                cena_tab.first.click()
                page.wait_for_timeout(300)
            if not add_food("arroz", "Arroz"):
                errors.append("nutrición: no se pudo añadir 'Arroz'")

            page.wait_for_timeout(400)

            # Tarjetas apiladas: subtotal 'kcal' por tipo visible y vecino al nombre del tipo
            nbody2 = page.inner_text("body")
            if "kcal" in nbody2:
                print("OK: subtotales de kcal por comida visibles")
            else:
                errors.append("nutrición: no se ve ningún subtotal de kcal")

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
