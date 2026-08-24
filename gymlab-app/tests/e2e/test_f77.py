"""Test F77: SupplementsPage mobile E2E (390×844) — verify seed, check toggle, add/delete, touch targets."""
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
            dismiss_overlays(page)

            # Navigate to supplements page
            page.goto(f"{BASE}/suplementos", wait_until="networkidle")
            page.wait_for_timeout(1500)
            dismiss_overlays(page)

            # Screenshot 1: supplements page with seed data
            page.screenshot(path=os.path.join(SHOT_DIR, "f77-mobile-seed.png"), full_page=True)
            print("OK: f77-mobile-seed.png")

            # Check header exists
            header = page.locator("h1")
            if header.count() > 0:
                print(f"  Header: '{header.first.inner_text()}'")

            # Check seed supplements are visible (at least 5 active)
            cards = page.locator("button").filter(has=page.locator("svg.lucide-check"))
            active_count = cards.count()
            print(f"  Active supplement cards: {active_count}")
            if active_count < 5:
                errors.append(f"Expected ≥5 seed supplements, got {active_count}")

            # Check each supplement card has proper touch target (≥44px)
            for i in range(min(active_count, 3)):
                card = cards.nth(i)
                box = card.bounding_box()
                if box:
                    print(f"  Check button {i}: {box['width']:.0f}x{box['height']:.0f}px")
                    if box['height'] < 44:
                        errors.append(f"Check button {i} height {box['height']:.0f}px < 44px")

            # Click first supplement check button
            cards.first.click()
            page.wait_for_timeout(500)

            # Screenshot 2: after checking first supplement
            page.screenshot(path=os.path.join(SHOT_DIR, "f77-mobile-checked.png"), full_page=True)
            print("OK: f77-mobile-checked.png")

            # Verify checked state — button should have accent background
            first_check = cards.first
            classes = first_check.get_attribute("class") or ""
            if "bg-accent" in classes:
                print("  Check toggle: accent bg applied")
            else:
                errors.append("Check toggle did not apply accent bg")

            # Uncheck it
            cards.first.click()
            page.wait_for_timeout(300)

            # Click Add button
            add_btn = page.locator("button", has_text="Agregar")
            if add_btn.count() == 0:
                add_btn = page.locator("button", has_text="Add")
            if add_btn.count() > 0:
                box = add_btn.first.bounding_box()
                if box:
                    print(f"  Add button: {box['width']:.0f}x{box['height']:.0f}px")
                    if box['height'] < 44:
                        errors.append(f"Add button height {box['height']:.0f}px < 44px")
                add_btn.first.click()
                page.wait_for_timeout(300)
            else:
                errors.append("Add button not found")

            # Screenshot 3: form open
            page.screenshot(path=os.path.join(SHOT_DIR, "f77-mobile-form.png"), full_page=True)
            print("OK: f77-mobile-form.png")

            # Fill form
            name_input = page.locator("input").first
            dose_input = page.locator("input").nth(1)
            if name_input.count() > 0 and dose_input.count() > 0:
                name_input.fill("Test Supplement")
                dose_input.fill("100mg")
                page.wait_for_timeout(200)

                # Click save
                save_btn = page.locator("button", has_text="Guardar")
                if save_btn.count() == 0:
                    save_btn = page.locator("button", has_text="Save")
                if save_btn.count() > 0:
                    save_btn.first.click()
                    page.wait_for_timeout(500)
                    print("  Form saved")
                else:
                    errors.append("Save button not found")
            else:
                errors.append("Form inputs not found")

            # Screenshot 4: after adding custom supplement
            page.screenshot(path=os.path.join(SHOT_DIR, "f77-mobile-added.png"), full_page=True)
            print("OK: f77-mobile-added.png")

            # Verify new supplement appears
            new_sup = page.locator("text=Test Supplement")
            if new_sup.count() > 0:
                print("  Custom supplement visible")
            else:
                errors.append("Custom supplement not visible after add")

            # Check delete button size
            delete_btns = page.locator("button").filter(has=page.locator("svg.lucide-trash-2"))
            if delete_btns.count() > 0:
                box = delete_btns.last.bounding_box()
                if box:
                    print(f"  Delete button: {box['width']:.0f}x{box['height']:.0f}px")
                    if box['height'] < 44:
                        errors.append(f"Delete button height {box['height']:.0f}px < 44px")

                # Delete the custom supplement
                delete_btns.last.click()
                page.wait_for_timeout(500)

                # Verify deleted
                deleted = page.locator("text=Test Supplement")
                if deleted.count() == 0:
                    print("  Custom supplement deleted")
                else:
                    errors.append("Custom supplement still visible after delete")

            # Check no horizontal scroll
            scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
            client_width = page.evaluate("() => document.documentElement.clientWidth")
            if scroll_width > client_width + 5:
                errors.append(f"Horizontal scroll: {scroll_width} > {client_width}")

            # Check all text sizes ≥ 12px (exclude tab bar labels which are intentionally small)
            font_check = page.evaluate("""() => {
              const els = document.querySelectorAll('p, span, button, input, h1');
              const small = [];
              els.forEach(el => {
                const size = parseFloat(getComputedStyle(el).fontSize);
                if (size < 12 && el.innerText && el.innerText.trim().length > 0) {
                  // Skip tab bar labels (inside nav) and skip links
                  const parent = el.closest('nav, [role="navigation"], [class*="tab"]');
                  if (!parent && !el.closest('a[href="#content"]')) {
                    small.push({ tag: el.tagName, text: el.innerText.substring(0, 30), size });
                  }
                }
              });
              return small;
            }""")
            if font_check:
                for item in font_check:
                    errors.append(f"Font too small: {item['tag']} '{item['text']}' = {item['size']}px")

            # Check min-h-[44px] on all interactive elements (exclude skip links and tab bar)
            touch_check = page.evaluate("""() => {
              const btns = document.querySelectorAll('button, input, select');
              const small = [];
              btns.forEach(el => {
                const h = el.getBoundingClientRect().height;
                if (h > 0 && h < 44) {
                  small.push({ tag: el.tagName, text: (el.innerText || el.placeholder || '').substring(0, 30), height: h });
                }
              });
              return small;
            }""")
            if touch_check:
                for item in touch_check:
                    errors.append(f"Touch target too small: {item['tag']} '{item['text']}' = {item['height']:.0f}px")

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
