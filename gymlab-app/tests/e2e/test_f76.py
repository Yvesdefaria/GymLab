"""Test F76: NutritionPage mobile E2E (390×844) — verify layout, touch targets, font sizes."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"
SHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "..")

def dismiss_overlays(page):
    page.evaluate("""() => {
      document.querySelectorAll('[class*="fixed inset-0"]').forEach(el => {
        const z = parseInt(getComputedStyle(el).zIndex) || 0;
        if (z >= 50) el.remove();
      });
    }""")
    page.wait_for_timeout(300)

def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 844})
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(600)
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
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(800)
            dismiss_overlays(page)

            # Navigate to nutrition page
            page.goto(f"{BASE}/nutricion", wait_until="networkidle")
            page.wait_for_timeout(1000)
            dismiss_overlays(page)

            # Screenshot 1: nutrition page empty
            page.screenshot(path=os.path.join(SHOT_DIR, "f76-mobile-empty.png"), full_page=True)
            print("OK: f76-mobile-empty.png")

            # Check header exists
            header = page.locator("h1")
            if header.count() > 0:
                print(f"  Header: '{header.first.inner_text()}'")

            # Check meal type buttons — must be ≥44px
            meal_btns = page.locator("button", has_text="Almuerzo")
            if meal_btns.count() > 0:
                box = meal_btns.first.bounding_box()
                if box:
                    print(f"  Meal button: {box['width']:.0f}x{box['height']:.0f}px")
                    if box['height'] < 44:
                        errors.append(f"Meal button height {box['height']:.0f}px < 44px")
                meal_btns.first.click()
                page.wait_for_timeout(300)

            # Abrir el sheet de alta (el buscador ya no vive inline).
            page.get_by_role("button", name="Agregar a Almuerzo").click()
            page.wait_for_timeout(400)
            search = page.locator("input[type='text']")
            if search.count() > 0:
                box = search.first.bounding_box()
                if box:
                    print(f"  Search input: {box['width']:.0f}x{box['height']:.0f}px")
                    if box['height'] < 44:
                        errors.append(f"Search input height {box['height']:.0f}px < 44px")

            # Type in search to show food list
            search.first.fill("pollo")
            page.wait_for_timeout(500)

            # Screenshot 2: with search results
            page.screenshot(path=os.path.join(SHOT_DIR, "f76-mobile-search.png"), full_page=True)
            print("OK: f76-mobile-search.png")

            # Check food list items — must be ≥44px
            food_items = page.locator("button", has_text="Pechuga")
            if food_items.count() > 0:
                box = food_items.first.bounding_box()
                if box:
                    print(f"  Food item: {box['width']:.0f}x{box['height']:.0f}px")
                    if box['height'] < 44:
                        errors.append(f"Food item height {box['height']:.0f}px < 44px")

            # Click a food item
            food_items.first.click()
            page.wait_for_timeout(300)

            # Check add button
            add_btn = page.get_by_role("button", name="Agregar", exact=True)
            if add_btn.count() == 0:
                add_btn = page.get_by_role("button", name="Add", exact=True)
            if add_btn.count() > 0:
                box = add_btn.first.bounding_box()
                if box:
                    print(f"  Add button: {box['width']:.0f}x{box['height']:.0f}px")
                    if box['height'] < 44:
                        errors.append(f"Add button height {box['height']:.0f}px < 44px")

            # Click add
            add_btn.first.click()
            page.wait_for_timeout(500)

            # Cerrar el sheet y la cola de logros para llegar a la fila.
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
            for _ in range(6):
                modal = page.locator('[aria-labelledby="achievement-modal-title"]')
                if modal.count() == 0:
                    break
                modal.get_by_role("button").last.click()
                page.wait_for_timeout(300)

            # Screenshot 3: after adding food
            page.screenshot(path=os.path.join(SHOT_DIR, "f76-mobile-added.png"), full_page=True)
            print("OK: f76-mobile-added.png")

            # Check delete button size
            delete_btns = page.locator('button[aria-label^="Eliminar"], button[aria-label^="Delete"]')
            if delete_btns.count() > 0:
                box = delete_btns.first.bounding_box()
                if box:
                    print(f"  Delete button: {box['width']:.0f}x{box['height']:.0f}px")
                    if box['height'] < 44:
                        errors.append(f"Delete button height {box['height']:.0f}px < 44px")

            # Check no horizontal scroll
            scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
            client_width = page.evaluate("() => document.documentElement.clientWidth")
            if scroll_width > client_width + 5:
                errors.append(f"Horizontal scroll: {scroll_width} > {client_width}")

            # Check text sizes ≥ 9px (eyebrows y meta del design system).
            font_check = page.evaluate("""() => {
              const els = document.querySelectorAll('p, span, button, input, h1');
              const small = [];
              els.forEach(el => {
                if (el.closest('nav')) return;
                const style = getComputedStyle(el);
                const isEyebrow =
                  style.textTransform === 'uppercase' ||
                  el.className.toString().includes('uppercase');
                const size = parseFloat(style.fontSize);
                if (size < 9 && !isEyebrow && el.innerText && el.innerText.trim().length > 0) {
                  small.push({ tag: el.tagName, text: el.innerText.substring(0, 30), size });
                }
              });
              return small;
            }""")
            if font_check:
                for item in font_check:
                    errors.append(f"Font too small: {item['tag']} '{item['text']}' = {item['size']}px")

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            page.close()
            browser.close()

    if errors:
        print("\nERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("\nALL OK")

if __name__ == "__main__":
    main()
