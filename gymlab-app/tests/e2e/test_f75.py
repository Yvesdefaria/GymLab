"""Test F75: Screenshot de exportación de sesión en mobile (390×844)."""
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
    const put = (store, row) => tx.objectStore(store).put(row);

    put('workouts', {
      id: 9501,
      startedAt: '2026-08-24T09:00:00.000Z',
      finishedAt: '2026-08-24T10:15:00.000Z',
      routineId: null,
      routineDayId: null,
      localDate: '2026-08-24',
      notes: 'Sesion de prueba para exportar imagen',
      totalVolume: 4800
    });

    const sets = [
      { id: 95001, workoutId: 9501, exerciseId: exIds[0], setNumber: 1, weightKg: 100, reps: 5, completed: true, createdAt: '2026-08-24T09:05:00.000Z' },
      { id: 95002, workoutId: 9501, exerciseId: exIds[0], setNumber: 2, weightKg: 100, reps: 5, completed: true, createdAt: '2026-08-24T09:08:00.000Z' },
      { id: 95003, workoutId: 9501, exerciseId: exIds[0], setNumber: 3, weightKg: 105, reps: 4, completed: true, createdAt: '2026-08-24T09:11:00.000Z' },
      { id: 95004, workoutId: 9501, exerciseId: exIds[1], setNumber: 1, weightKg: 60, reps: 10, completed: true, createdAt: '2026-08-24T09:20:00.000Z' },
      { id: 95005, workoutId: 9501, exerciseId: exIds[1], setNumber: 2, weightKg: 60, reps: 10, completed: true, createdAt: '2026-08-24T09:23:00.000Z' },
      { id: 95006, workoutId: 9501, exerciseId: exIds[2], setNumber: 1, weightKg: 40, reps: 12, completed: true, createdAt: '2026-08-24T09:35:00.000Z' },
      { id: 95007, workoutId: 9501, exerciseId: exIds[2], setNumber: 2, weightKg: 40, reps: 12, completed: false, createdAt: '2026-08-24T09:38:00.000Z' },
    ];
    sets.forEach(s => put('workoutSets', s));

    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}"""

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"
SHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "..")

def dismiss_overlays(page):
    """Dismiss achievement modals, onboarding, or any z-50+ overlay."""
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
            page.evaluate(SEED_JS)
            page.reload(wait_until="networkidle")

            # Dismiss any overlays after seed
            dismiss_overlays(page)

            # Navigate to workout detail
            page.goto(f"{BASE}/entrenamiento/9501", wait_until="networkidle")
            page.wait_for_timeout(1000)
            dismiss_overlays(page)

            # Screenshot 1: workout detail
            page.screenshot(path=os.path.join(SHOT_DIR, "f75-mobile-detail.png"), full_page=True)
            print("OK: f75-mobile-detail.png")

            # Click preview button
            preview_btn = page.locator("button", has_text="Vista previa")
            if preview_btn.count() == 0:
                preview_btn = page.locator("button", has_text="Preview")
            if preview_btn.count() > 0:
                dismiss_overlays(page)
                preview_btn.first.click(timeout=5000)
                page.wait_for_timeout(500)
                page.screenshot(path=os.path.join(SHOT_DIR, "f75-mobile-preview.png"), full_page=True)
                print("OK: f75-mobile-preview.png")
            else:
                errors.append("Preview button not found")

            # Check button sizes
            buttons = page.locator("button").all()
            for i, btn in enumerate(buttons):
                box = btn.bounding_box()
                if box and box["height"] < 40:
                    errors.append(f"Button {i} height {box['height']:.0f}px < 40px minimum")

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
