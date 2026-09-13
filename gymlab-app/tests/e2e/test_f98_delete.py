"""Fase 98.6: borrado permanente de una sesión con confirmación.

Escenarios (viewport 375x812), datos sembrados directamente en IndexedDB:
  R1. Cancelar la confirmación deja la sesión intacta; confirmar la borra y
      navega al historial (/perfil). Sin tombstone.
  R2. La cascada elimina en una sola operación el workout, todas sus series y
      sus entradas de bitácora.
  R3. Los PRs se recalculan: el PR del ejercicio afectado cae al mejor 1RM
      restante; si su única fuente estaba en la sesión borrada, se elimina; el
      de un ejercicio no afectado se conserva.
  R4. Una sesión importada (nota vacía) se borra con el mismo flujo.
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
    ex.put({ id: 999, slug: 'sentadilla-f98d', name: 'Sentadilla F98D', muscleGroup: 'pierna', equipment: 'barra', instructions: '', category: 'strength' });
    ex.put({ id: 998, slug: 'peso-muerto-f98d', name: 'Peso muerto F98D', muscleGroup: 'pierna', equipment: 'barra', instructions: '', category: 'strength' });
    ex.put({ id: 997, slug: 'press-f98d', name: 'Press F98D', muscleGroup: 'pecho', equipment: 'barra', instructions: '', category: 'strength' });
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: JSON.stringify({ units: 'kg', showRpe: true, showRir: true }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Fixtures: 9001 es la sesión a borrar; 9002 comparte el ejercicio 999 (su PR debe
# caer a 110×3); el 998 solo existe en 9001 (su PR debe desaparecer); 9003 es una
# sesión importada del 997.
SEED_FIXTURES_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const now = Date.now();
  const iso = (msAgo) => new Date(now - msAgo).toISOString();
  const e1rm = (w, r) => (r <= 0 || w <= 0 || r >= 37) ? 0 : (r === 1 ? w : Math.round(w * (36 / (37 - r)) * 10) / 10);
  await new Promise((res, rej) => {
    const tx = db.transaction(['workouts', 'workoutSets', 'prs', 'sessionJournals'], 'readwrite');
    tx.objectStore('workouts').put({ id: 9001, startedAt: iso(7200000), finishedAt: iso(3600000), routineId: null, routineDayId: null, localDate: '2026-09-14', notes: 'Sesion normal', totalVolume: 360 });
    tx.objectStore('workouts').put({ id: 9002, startedAt: iso(86400000), finishedAt: iso(82800000), routineId: null, routineDayId: null, localDate: '2026-09-13', notes: '', totalVolume: 330 });
    tx.objectStore('workouts').put({ id: 9003, startedAt: iso(172800000), finishedAt: iso(169200000), routineId: null, routineDayId: null, localDate: '2026-09-12', notes: '', totalVolume: 480 });
    const sets = tx.objectStore('workoutSets');
    sets.put({ id: 9101, workoutId: 9001, exerciseId: 999, setNumber: 1, weightKg: 120, reps: 3, completed: true, createdAt: iso(3600000) });
    sets.put({ id: 9102, workoutId: 9002, exerciseId: 999, setNumber: 1, weightKg: 110, reps: 3, completed: true, createdAt: iso(82800000) });
    sets.put({ id: 9103, workoutId: 9001, exerciseId: 998, setNumber: 1, weightKg: 80, reps: 5, completed: true, createdAt: iso(3600000) });
    sets.put({ id: 9104, workoutId: 9003, exerciseId: 997, setNumber: 1, weightKg: 60, reps: 8, completed: true, createdAt: iso(169200000) });
    const prs = tx.objectStore('prs');
    prs.put({ exerciseId: 999, weightKg: 120, reps: 3, date: iso(3600000), estimated1RM: e1rm(120, 3) });
    prs.put({ exerciseId: 998, weightKg: 80, reps: 5, date: iso(3600000), estimated1RM: e1rm(80, 5) });
    prs.put({ exerciseId: 997, weightKg: 60, reps: 8, date: iso(169200000), estimated1RM: e1rm(60, 8) });
    tx.objectStore('sessionJournals').put({ id: 9201, workoutId: 9001, energy: 3, sleep: 3, mood: 3, soreness: 2, note: '', createdAt: iso(3600000) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def dismiss_overlays(page, timeout_ms=6000):
    # Sembrar workouts/PRs puede desbloquear logros y abrir su modal (z-50), que
    # intercepta los clics. Avanza la cola hasta que no quede ningún overlay.
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


def boot(page):
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(700)
    assert page.evaluate(SEED_APP_JS) is True, "seed app fallo"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(900)
    skip_ob = page.locator("button", has_text="Ya entreno aquí")
    if skip_ob.count() > 0:
        skip_ob.first.click(timeout=5000)
        page.wait_for_timeout(600)
    assert page.evaluate(SEED_FIXTURES_JS) is True, "seed fixtures fallo"
    page.wait_for_timeout(1000)
    dismiss_overlays(page)


def open_delete(page):
    page.locator("button", has_text="Eliminar sesión").first.click(timeout=5000)
    page.wait_for_selector('div[role="alertdialog"]', state="visible", timeout=5000)


def confirm_delete(page):
    page.locator('div[role="alertdialog"] button', has_text="Eliminar sesión").first.click(timeout=5000)
    page.wait_for_timeout(900)


def cancel_delete(page):
    page.locator('div[role="alertdialog"] button', has_text="Cancelar").first.click(timeout=5000)
    page.wait_for_timeout(400)


def read_db(page):
    snap = page.evaluate(
        """async () => {
            const db = await new Promise((res, rej) => {
                const r = indexedDB.open('GymLabDB');
                r.onsuccess = () => res(r.result);
                r.onerror = () => rej(r.error);
            });
            const all = (store) => new Promise((res, rej) => {
                const r = db.transaction(store, 'readonly').objectStore(store).getAll();
                r.onsuccess = () => res(r.result);
                r.onerror = () => rej(r.error);
            });
            const [workouts, sets, prs, journals] = await Promise.all([
                all('workouts'), all('workoutSets'), all('prs'), all('sessionJournals'),
            ]);
            return {
                workoutIds: workouts.map((w) => w.id).sort((a, b) => a - b),
                setWorkoutIds: sets.map((s) => s.workoutId),
                prs: Object.fromEntries(prs.map((p) => [p.exerciseId, { weightKg: p.weightKg, estimated1RM: p.estimated1RM }])),
                journalWorkoutIds: journals.map((j) => j.workoutId),
            };
        }"""
    )
    # Las claves de un objeto JSON llegan como str; normaliza exerciseId a int.
    snap["prs"] = {int(k): v for k, v in snap["prs"].items()}
    return snap


def main():
    errors = []
    # 110 × 3 → mejor 1RM restante del ejercicio 999 tras borrar 9001.
    expected_fallback = round(110 * (36 / (37 - 3)) * 10) / 10
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}")
            if m.type == "error"
            else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))
        try:
            boot(page)
            page.goto(f"{BASE}/entrenamiento/9001", wait_until="networkidle")
            page.wait_for_timeout(1100)
            dismiss_overlays(page)

            # R1 — cancelar no borra nada.
            open_delete(page)
            cancel_delete(page)
            if page.locator('div[role="alertdialog"]').count() != 0:
                errors.append("R1: el diálogo sigue abierto tras cancelar")
            snap = read_db(page)
            if 9001 not in snap["workoutIds"]:
                errors.append("R1: cancelar borró la sesión")
            else:
                print("OK R1: cancelar conserva la sesión")

            # R1 — confirmar (con captura del diálogo) borra y vuelve al historial.
            open_delete(page)
            page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f98-4-delete-confirm.png"))
            confirm_delete(page)
            if "/perfil" not in page.url:
                errors.append(f"R1: tras borrar no navegó al historial (url={page.url})")
            snap = read_db(page)
            if 9001 in snap["workoutIds"]:
                errors.append("R1: la sesión sigue existiendo tras confirmar")
            else:
                print("OK R1: confirmar borra la sesión y vuelve al historial")

            # R2 — cascada: series y journal de 9001 fuera; 9002 intacta.
            r2_ok = True
            if any(wid == 9001 for wid in snap["setWorkoutIds"]):
                errors.append("R2: quedan series de la sesión borrada")
                r2_ok = False
            if 9001 in snap["journalWorkoutIds"]:
                errors.append("R2: queda la entrada de bitácora de la sesión borrada")
                r2_ok = False
            if 9002 not in snap["workoutIds"]:
                errors.append("R2: la cascada borró una sesión vecina")
                r2_ok = False
            if not any(wid == 9002 for wid in snap["setWorkoutIds"]):
                errors.append("R2: la cascada borró series de la sesión vecina")
                r2_ok = False
            if r2_ok:
                print("OK R2: cascada borra series y bitácora solo de la sesión borrada")

            # R3 — PR recalculado: cae al mejor restante / se elimina.
            pr999 = snap["prs"].get(999)
            pr998 = snap["prs"].get(998)
            if pr999 is None or abs(pr999["estimated1RM"] - expected_fallback) > 0.05 or pr999["weightKg"] != 110:
                errors.append(f"R3: el PR 999 no cayó a 110×3 (pr={pr999}, esperado={expected_fallback})")
            if pr998 is not None:
                errors.append(f"R3: el PR sin series restantes no se eliminó (pr={pr998})")
            if pr999 is not None and pr998 is None:
                print("OK R3: PR cae al mejor restante y el PR sin fuente se elimina")

            # R4 — sesión importada (nota vacía) borrable con el mismo flujo.
            page.goto(f"{BASE}/entrenamiento/9003", wait_until="networkidle")
            page.wait_for_timeout(900)
            dismiss_overlays(page)
            open_delete(page)
            confirm_delete(page)
            snap = read_db(page)
            pr997 = snap["prs"].get(997)
            if 9003 in snap["workoutIds"] or pr997 is not None:
                errors.append(f"R4: la sesión importada o su PR no se borraron (pr={pr997})")
            else:
                print("OK R4: sesión importada borrada con el mismo flujo")
        except Exception as e:  # noqa: BLE001
            errors.append(f"Exception: {e}")
        finally:
            errors.extend(console_errors)
            page.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F98.6 borrado de sesión (confirmación, cascada y PRs recalculados)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
