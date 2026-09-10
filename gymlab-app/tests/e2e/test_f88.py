"""Test F88: Clonar rutina predefinida → editar → reordenar días → guardar → badge.
"""
import sys, os, re
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"
SHOT_DIR = os.path.join(os.path.dirname(__file__), "shots")


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
        # Tall viewport so all builder day panels fit without scrolling.
        page = browser.new_page(viewport={"width": 1280, "height": 3200})
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            # ── 1. Predefined routine detail: "Editar esta rutina" visible ──
            page.goto(BASE, wait_until="networkidle")
            dismiss_overlays(page)
            page.goto(f"{BASE}/rutinas/ppl-volumen", wait_until="networkidle")
            page.wait_for_timeout(800)
            dismiss_overlays(page)

            clone_btn = page.get_by_text("Editar esta rutina")
            if clone_btn.count() == 0:
                errors.append("'Editar esta rutina' button not found on predefined detail")
            else:
                print("OK: predefined detail shows clone button")
                page.screenshot(path=os.path.join(SHOT_DIR, "f88-predef-detail.png"), full_page=True)

            # ── 2. Builder rejects predefined routine edit ──
            page.goto(f"{BASE}/rutinas/ppl-volumen/editar", wait_until="networkidle")
            page.wait_for_timeout(800)
            dismiss_overlays(page)
            solo_msg = page.get_by_text("Solo puedes editar rutinas propias")
            if solo_msg.count() > 0:
                print("OK: builder rejects predefined routine")
            else:
                errors.append("Builder did not reject predefined routine edit")

            # ── 3. Clone → builder opens ──
            page.goto(f"{BASE}/rutinas/ppl-volumen", wait_until="networkidle")
            page.wait_for_timeout(800)
            dismiss_overlays(page)
            page.get_by_text("Editar esta rutina").click()
            page.wait_for_url("**/rutinas/*/editar*", timeout=8000)
            page.wait_for_timeout(1000)
            dismiss_overlays(page)

            url_after_clone = page.url
            slug_match = re.search(r"/rutinas/([^/]+)/editar", url_after_clone)
            clone_slug = slug_match.group(1) if slug_match else None
            print(f"  Clone slug: {clone_slug}")

            heading = page.get_by_text("Editar rutina")
            if heading.count() > 0:
                print("OK: builder loaded for clone")
            else:
                errors.append("Builder heading 'Editar rutina' not found after clone")

            day_inputs = page.locator('input[id^="day-name-"]')
            day_count = day_inputs.count()
            if day_count < 2:
                errors.append(f"Expected ≥2 day inputs, got {day_count}")
            else:
                print(f"  Days in builder: {day_count}")

            # Capture original day order before reorder
            orig_day_names = [day_inputs.nth(i).input_value() for i in range(day_count)]
            print(f"  Original day order: {orig_day_names}")
            page.screenshot(path=os.path.join(SHOT_DIR, "f88-builder-before-reorder.png"), full_page=True)

            # ── 4. Day drag reorder: move last day to position 0 ──
            grips = page.locator('button[aria-label="Reordenar día"]')
            grip_count = grips.count()
            if grip_count < 2:
                errors.append(f"Expected ≥2 day grips, got {grip_count}")
            else:
                last_grip = grips.nth(grip_count - 1)
                last_grip.scroll_into_view_if_needed()
                gb = last_grip.bounding_box()
                if gb:
                    start_x = gb["x"] + gb["width"] / 2
                    start_y = gb["y"] + gb["height"] / 2
                    # Move to top of viewport → well above wrapper 0's midpoint.
                    target_y = 50
                    page.mouse.move(start_x, start_y)
                    page.mouse.down()
                    page.mouse.move(start_x, target_y, steps=20)
                    page.wait_for_timeout(200)
                    page.mouse.up()
                    page.wait_for_timeout(400)

                    new_day_names = [day_inputs.nth(i).input_value() for i in range(day_count)]
                    print(f"  Day order after drag: {new_day_names}")
                    if new_day_names[0] == orig_day_names[-1]:
                        print("OK: day reorder succeeded (last → first)")
                    else:
                        errors.append(f"Day reorder failed: expected first={orig_day_names[-1]}, got {new_day_names[0]}")
                    page.screenshot(path=os.path.join(SHOT_DIR, "f88-builder-after-reorder.png"), full_page=True)
                else:
                    errors.append("Last day grip bounding box not found")

            # ── 5. Save clone ──
            save_btn = page.get_by_text("Guardar cambios")
            if save_btn.count() == 0:
                save_btn = page.get_by_text("Crear rutina")
            if save_btn.count() > 0:
                save_btn.first.click()
                page.wait_for_timeout(1500)
                dismiss_overlays(page)
                current_url = page.url
                if clone_slug and clone_slug in current_url:
                    print(f"OK: saved and navigated to detail ({current_url})")
                else:
                    errors.append(f"Expected URL to contain {clone_slug}, got {current_url}")
                page.screenshot(path=os.path.join(SHOT_DIR, "f88-saved-detail.png"), full_page=True)
            else:
                errors.append("Save button not found")

            # ── 6. Day order persists after save-reload: reopen builder ──
            if clone_slug:
                edit_btn = page.get_by_text("Editar").first
                if edit_btn.count() > 0:
                    edit_btn.click()
                    page.wait_for_url("**/editar*", timeout=8000)
                    page.wait_for_timeout(1000)
                    dismiss_overlays(page)
                    saved_days = [page.locator('input[id^="day-name-"]').nth(i).input_value()
                                  for i in range(page.locator('input[id^="day-name-"]').count())]
                    print(f"  Days after reload: {saved_days}")
                    if len(saved_days) > 1 and saved_days[0] == orig_day_names[-1]:
                        print("OK: reordered days persisted after save-reload")
                    else:
                        errors.append(f"Day order not persisted: {saved_days}")
                else:
                    errors.append("Edit button not found on clone detail")

            # ── 7. Badge "Basada en ..." in Mis rutinas ──
            page.goto(f"{BASE}/rutinas", wait_until="networkidle")
            page.wait_for_timeout(800)
            dismiss_overlays(page)

            badge = page.get_by_text("Basada en PPL Volumen")
            if badge.count() > 0:
                print("OK: badge 'Basada en PPL Volumen' visible on clone card")
            else:
                errors.append("Badge 'Basada en PPL Volumen' not found in list")
            page.screenshot(path=os.path.join(SHOT_DIR, "f88-badge-list.png"), full_page=True)

            # ── 8. Original predefined routine unchanged ──
            page.goto(f"{BASE}/rutinas/ppl-volumen", wait_until="networkidle")
            page.wait_for_timeout(800)
            dismiss_overlays(page)
            orig_clone_btn = page.get_by_text("Editar esta rutina")
            if orig_clone_btn.count() > 0:
                print("OK: original predefined routine unchanged (clone button still present)")
            else:
                errors.append("Original predefined routine lost its clone button")

            # ── 9. Touch target check: day grips ≥ 44px ──
            if clone_slug:
                page.goto(f"{BASE}/rutinas/{clone_slug}/editar", wait_until="networkidle")
            else:
                page.goto(f"{BASE}/rutinas/ppl-volumen-2/editar", wait_until="networkidle")
            page.wait_for_timeout(1000)
            dismiss_overlays(page)
            grips = page.locator('button[aria-label="Reordenar día"]')
            for i in range(grips.count()):
                box = grips.nth(i).bounding_box()
                if box and box["height"] < 44:
                    errors.append(f"Day grip {i} height {box['height']:.0f}px < 44px")
            print("OK: day grip touch targets checked")

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
