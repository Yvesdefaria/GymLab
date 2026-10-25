"""Fase 93 #14: rediseño de suplementos y nutrición.

Verifica:
- Suplementos (/suplementos): seed visible, tarjetas con botón de check y badge de frecuencia,
  filtro por frecuencia, sin scroll horizontal, targets ≥44px.
- Nutrición (/nutricion): anillo de kcal (SVG) + barras de macros, y tarjetas apiladas por
  tipo de comida con subtotal de kcal tras añadir comidas por UI.
"""
import re
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import expect, sync_playwright

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
            # Este test asume la UI en español: fija idioma y onboarding en meta.
            page.evaluate("""async () => {
              const openDb = () => new Promise((res, rej) => {
                const r = indexedDB.open('GymLabDB');
                r.onsuccess = () => res(r.result);
                r.onerror = () => rej(r.error);
              });
              const db = await openDb();
              await new Promise((res, rej) => {
                const tx = db.transaction('meta', 'readwrite');
                tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
                tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ language: 'es', showSectionTips: false }) });
                tx.oncomplete = () => res();
                tx.onerror = () => rej(tx.error);
              });
              db.close();
              return true;
            }""")
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(1000)
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

            # Anillo de kcal: al menos el track del SVG; sin TDEE no hay progreso.
            ring_svg = page.locator("svg circle")
            if ring_svg.count() >= 1:
                print("OK: anillo de kcal presente (track SVG)")
            else:
                errors.append("nutrición: no se encontró el anillo de kcal (SVG)")

            # Etiquetas de macros visibles (el CSS las muestra en mayúsculas).
            nbody = page.inner_text("body").lower()
            for label in ("proteína", "carbohidratos", "grasa"):
                if label in nbody:
                    print(f"OK: macro '{label}' visible")
                    break
            else:
                errors.append("nutrición: no se ven las etiquetas de macros")

            # Añadir comidas vía UI: el alta vive en un bottom sheet.
            def dismiss_achievements():
                for _ in range(8):
                    modal = page.locator('[aria-labelledby="achievement-modal-title"]')
                    if modal.count() == 0:
                        page.wait_for_timeout(250)
                        if modal.count() == 0:
                            return
                        continue
                    modal.get_by_role("button").last.click()
                    page.wait_for_timeout(400)

            def add_food(meal_label, search, food_text):
                page.get_by_role("button", name=f"Agregar a {meal_label}").click()
                dialog = page.locator('[role="dialog"]').first
                expect(dialog).to_be_visible()
                dialog.locator("input").first.fill(search)
                page.wait_for_timeout(400)
                item = dialog.get_by_role("button", name=re.compile(food_text, re.I)).first
                if item.count() == 0:
                    return False
                item.click()
                page.wait_for_timeout(250)
                dialog.get_by_role("button", name="Agregar", exact=True).click()
                page.wait_for_timeout(400)
                page.keyboard.press("Escape")
                page.wait_for_timeout(300)
                dismiss_achievements()
                return True

            # El día vacío arranca en Desayuno; se agrega pollo ahí.
            if not add_food("Desayuno", "pollo", "Pechuga"):
                errors.append("nutrición: no se pudo añadir 'Pechuga'")

            # Cambiar a Cena y añadir arroz.
            cena_tab = page.get_by_role("button", name=re.compile(r"^Cena"))
            if cena_tab.count() > 0:
                cena_tab.first.click()
                page.wait_for_timeout(300)
            if not add_food("Cena", "arroz", "Arroz"):
                errors.append("nutrición: no se pudo añadir 'Arroz'")

            page.wait_for_timeout(400)

            # Filas hairline por comida: nombre y kcal visibles en la comida activa.
            nbody2 = page.inner_text("body")
            if "Arroz" in nbody2 and "365" in nbody2:
                print("OK: fila de comida con kcal visible")
            else:
                errors.append("nutrición: no se ve la fila de la comida con su kcal")

            # Volver a Desayuno: conserva su fila y su subtotal (165 kcal).
            page.get_by_role("button", name=re.compile(r"^Desayuno")).first.click()
            page.wait_for_timeout(300)
            nbody3 = page.inner_text("body")
            if "Pechuga de pollo" in nbody3 and "165" in nbody3:
                print("OK: tabs conservan la comida y el subtotal")
            else:
                errors.append("nutrición: la tab Desayuno perdió su comida o subtotal")

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
