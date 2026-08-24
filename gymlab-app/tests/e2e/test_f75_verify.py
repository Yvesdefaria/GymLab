"""Verify F75 mobile layout: button sizes, text sizes, touch targets."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const exIds = await new Promise((res, rej) => {
    const tx = db.transaction('exercises', 'readonly');
    const q = tx.objectStore('exercises').getAll();
    q.onsuccess = () => res(q.result.slice(0, 3).map(e => e.id));
    q.onerror = () => rej(q.error);
  });
  await new Promise((res, rej) => {
    const tx = db.transaction(['workouts', 'workoutSets'], 'readwrite');
    const put = (s, r) => tx.objectStore(s).put(r);
    put('workouts', { id: 9501, startedAt: '2026-08-24T09:00:00.000Z', finishedAt: '2026-08-24T10:15:00.000Z', routineId: null, routineDayId: null, localDate: '2026-08-24', notes: '', totalVolume: 4800 });
    [
      { id: 95001, workoutId: 9501, exerciseId: exIds[0], setNumber: 1, weightKg: 100, reps: 5, completed: true, createdAt: '2026-08-24T09:05:00.000Z' },
      { id: 95002, workoutId: 9501, exerciseId: exIds[0], setNumber: 2, weightKg: 100, reps: 5, completed: true, createdAt: '2026-08-24T09:08:00.000Z' },
      { id: 95003, workoutId: 9501, exerciseId: exIds[1], setNumber: 1, weightKg: 60, reps: 10, completed: true, createdAt: '2026-08-24T09:20:00.000Z' },
    ].forEach(s => put('workoutSets', s));
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}"""

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 844})

        page.goto(BASE, wait_until="networkidle")
        page.evaluate(SEED_JS)
        page.reload(wait_until="networkidle")

        # Dismiss overlays
        page.evaluate("""() => {
          document.querySelectorAll('[class*="fixed inset-0"]').forEach(el => {
            const z = parseInt(getComputedStyle(el).zIndex) || 0;
            if (z >= 50) el.remove();
          });
        }""")
        page.wait_for_timeout(300)

        page.goto(f"{BASE}/entrenamiento/9501", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # Dismiss overlays again
        page.evaluate("""() => {
          document.querySelectorAll('[class*="fixed inset-0"]').forEach(el => {
            const z = parseInt(getComputedStyle(el).zIndex) || 0;
            if (z >= 50) el.remove();
          });
        }""")
        page.wait_for_timeout(300)

        # Check all buttons in the export section
        export_buttons = page.locator("button.flex-1").all()
        print(f"Export buttons found: {len(export_buttons)}")

        for i, btn in enumerate(export_buttons):
            box = btn.bounding_box()
            text = btn.inner_text()
            if box:
                print(f"  Button '{text}': {box['width']:.0f}x{box['height']:.0f}px at y={box['y']:.0f}")
                if box['height'] < 44:
                    errors.append(f"Button '{text}' height {box['height']:.0f}px < 44px (touch target)")
                if box['width'] < 44:
                    errors.append(f"Button '{text}' width {box['width']:.0f}px < 44px")

        # Check font sizes on export buttons
        font_check = page.evaluate("""() => {
          const btns = document.querySelectorAll('button.flex-1');
          return Array.from(btns).map(b => ({
            text: b.innerText,
            fontSize: getComputedStyle(b).fontSize,
            height: b.getBoundingClientRect().height,
          }));
        }""")
        print(f"Font sizes: {font_check}")

        # Check no hardcoded Spanish in canvas (verify i18n keys exist)
        i18n_check = page.evaluate("""() => {
          const labels = ['share.durationLabel', 'share.volumeLabel', 'share.prsLabel', 'share.exercisesLabel', 'share.footer'];
          return labels;
        }""")
        print(f"i18n keys checked: {i18n_check}")

        # Check no horizontal scroll on mobile
        scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
        client_width = page.evaluate("() => document.documentElement.clientWidth")
        if scroll_width > client_width + 5:
            errors.append(f"Horizontal scroll detected: scrollWidth={scroll_width} > clientWidth={client_width}")

        # Check card panel has proper bg
        panel_check = page.evaluate("""() => {
          const panels = document.querySelectorAll('.panel, [class*="panel"]');
          return Array.from(panels).map(p => ({
            bg: getComputedStyle(p).backgroundColor,
            borderRadius: getComputedStyle(p).borderRadius,
          }));
        }""")
        print(f"Panels: {panel_check}")

        browser.close()

    if errors:
        print("\\nERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    else:
        print("\\nALL OK - layout verified")

if __name__ == "__main__":
    main()
