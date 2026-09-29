"""Fase 112.2: borrar una sesión re-bloquea sus logros sin flood de modales y
volver a ganarlos cuenta ×1 (F112 §5, D6/D7).

Escenarios (viewport 375x812), datos sembrados directamente en IndexedDB:
  R1. Con una sesión completada, 'primer-paso' e 'inaugural' se desbloquean (modal
      visible + meta persistida con contadores ×1) y el ConfirmSheet de borrado
      menciona el recálculo de logros.
  R2. Borrar esa única sesión re-bloquea ambos: meta vuelve a [] / {} sin modal nuevo.
  R3. Volver a ganarlos muestra el modal otra vez y el contador queda en ×1 (fresco).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

SEED_APP_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'meta'], 'readwrite');
    const ex = tx.objectStore('exercises');
    ex.put({ id: 999, slug: 'sentadilla-f112r', name: 'Sentadilla F112R', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: JSON.stringify({ units: 'kg', showRpe: true, showRir: true }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Una única sesión con una serie completada: desbloquea primer-paso + inaugural.
SEED_FIRST_WORKOUT_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const iso = new Date().toISOString();
  await new Promise((res, rej) => {
    const tx = db.transaction(['workouts', 'workoutSets'], 'readwrite');
    tx.objectStore('workouts').put({ id: 9001, startedAt: iso, finishedAt: iso, routineId: null, routineDayId: null, localDate: '2026-09-29', notes: '', totalVolume: 0 });
    tx.objectStore('workoutSets').put({ id: 9101, workoutId: 9001, exerciseId: 999, setNumber: 1, weightKg: 60, reps: 8, completed: true, createdAt: iso });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Nueva sesión completada (otro id) para volver a ganar los logros.
SEED_REGAIN_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const iso = new Date().toISOString();
  await new Promise((res, rej) => {
    const tx = db.transaction(['workouts', 'workoutSets'], 'readwrite');
    tx.objectStore('workouts').put({ id: 9004, startedAt: iso, finishedAt: iso, routineId: null, routineDayId: null, localDate: '2026-09-30', notes: '', totalVolume: 0 });
    tx.objectStore('workoutSets').put({ id: 9104, workoutId: 9004, exerciseId: 999, setNumber: 1, weightKg: 65, reps: 8, completed: true, createdAt: iso });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

READ_ACHIEVEMENTS_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const meta = await new Promise((res, rej) => {
    const r = db.transaction('meta', 'readonly').objectStore('meta').getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const parse = (key) => {
    const row = meta.find((m) => m.key === key);
    if (!row || row.value == null) return null;
    try { return JSON.parse(row.value); } catch { return row.value; }
  };
  return {
    unlocked: parse('unlockedAchievements'),
    counts: parse('achievementCounts') || {},
  };
}"""


def dismiss_overlays(page, timeout_ms=6000):
    deadline = timeout_ms
    while deadline > 0:
        overlay = page.locator("div.fixed.inset-0.z-50")
        if overlay.count() == 0:
            return
        btn = overlay.locator("button").last
        if btn.count() > 0:
            btn.click(timeout=2000)
        else:
            page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        deadline -= 300


def read_achievements(page):
    return page.evaluate(READ_ACHIEVEMENTS_JS)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        pageerrors = []
        page.on("pageerror", lambda e: pageerrors.append(f"pageerror: {e}"))
        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(700)
            assert page.evaluate(SEED_APP_JS) is True, "seed app fallo"
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(700)
            assert page.evaluate(SEED_FIRST_WORKOUT_JS) is True, "seed del workout fallo"
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1500)
            dismiss_overlays(page)

            # R1 — desbloqueo inicial persistido ×1.
            meta = None
            for _ in range(20):
                meta = read_achievements(page)
                if meta["unlocked"] and "primer-paso" in meta["unlocked"]:
                    break
                page.wait_for_timeout(300)
            if not meta or not meta["unlocked"] or "inaugural" not in meta["unlocked"]:
                errors.append(f"R1: no se desbloquearon los logros esperados ({meta})")
            elif meta["counts"].get("primer-paso") != 1 or meta["counts"].get("inaugural") != 1:
                errors.append(f"R1: contadores iniciales inesperados ({meta['counts']})")
            else:
                print("OK R1: la sesión completada desbloquea primer-paso e inaugural (x1)")

            # R2 — borrado de la única sesión: re-bloqueo sin flood.
            page.goto(f"{BASE}/entrenamiento/9001", wait_until="networkidle")
            page.wait_for_timeout(1100)
            dismiss_overlays(page)
            page.locator("button", has_text="Eliminar sesión").first.click(timeout=5000)
            page.wait_for_selector('div[role="alertdialog"]', state="visible", timeout=5000)
            if "logros" not in page.locator('div[role="alertdialog"]').first.inner_text():
                errors.append("R2: el confirm de borrado no menciona el recálculo de logros")
            page.locator('div[role="alertdialog"] button', has_text="Eliminar sesión").first.click(timeout=5000)
            page.wait_for_timeout(1500)
            if page.locator("div.fixed.inset-0.z-50").count() != 0:
                errors.append("R2: apareció un modal de logros tras el re-bloqueo (flood)")

            meta = None
            for _ in range(20):
                meta = read_achievements(page)
                if not meta["unlocked"] and not meta["counts"]:
                    break
                page.wait_for_timeout(300)
            if meta["unlocked"]:
                errors.append(f"R2: los logros no se re-bloquearon ({meta['unlocked']})")
            elif meta["counts"]:
                errors.append(f"R2: los contadores no se limpiaron ({meta['counts']})")
            else:
                print("OK R2: re-bloqueo sin modal y contadores limpios")

            # R3 — re-logro: modal de nuevo y contador fresco ×1.
            assert page.evaluate(SEED_REGAIN_JS) is True, "seed de re-logro fallo"
            page.reload(wait_until="networkidle")
            try:
                page.wait_for_selector("div.fixed.inset-0.z-50", state="visible", timeout=8000)
                print("OK R3: el modal volvió a celebrar el re-logro")
            except Exception:  # noqa: BLE001
                errors.append("R3: no reapareció el modal al volver a ganar los logros")
            meta = None
            for _ in range(20):
                meta = read_achievements(page)
                if meta["unlocked"] and meta["counts"]:
                    break
                page.wait_for_timeout(300)
            if meta["counts"].get("primer-paso") != 1 or meta["counts"].get("inaugural") != 1:
                errors.append(f"R3: el contador no quedó fresco x1 ({meta['counts']})")
            elif "primer-paso" not in (meta["unlocked"] or []) or "inaugural" not in (meta["unlocked"] or []):
                errors.append(f"R3: los logros no volvieron a persistirse ({meta})")
            else:
                print("OK R3: re-logro persistido con contador x1")
        except Exception as e:  # noqa: BLE001
            errors.append(f"Exception: {e}")
        finally:
            errors.extend(pageerrors)
            page.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F112.2 reconciliación de logros (re-bloqueo sin flood y re-logro x1)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
