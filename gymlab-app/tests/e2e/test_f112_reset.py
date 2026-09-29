"""Fase 112.1: reset de fábrica desde Ajustes (backup sugerido + type-to-confirm).

Escenarios (viewport 375x812), datos sembrados directamente en IndexedDB:
  R1. La "Zona de peligro" existe en /ajustes; el sheet informativo lista lo que se
      borra, avisa de la sesión activa y muestra backup primario + continuar sin backup.
  R2. "Descargar backup" dispara la descarga web del JSON (gymlab-backup-*.json).
  R3. Gate de palabra: "borra" deja el CTA "Resetear todo" deshabilitado; "  borrar "
      (minúsculas + espacios) lo habilita.
  R4. Confirmar recarga en / con onboarding visible, catálogo sembrado, 0 workouts,
      meta sin datos de usuario, claves de storage eliminadas y 0 pageerror.
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
    ex.put({ id: 999, slug: 'sentadilla-f112', name: 'Sentadilla F112', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    const meta = tx.objectStore('meta');
    meta.put({ key: 'onboardingDone', value: 'true' });
    meta.put({ key: 'settings', value: JSON.stringify({ units: 'kg', showRpe: true, showRir: true }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

# Dato de usuario (workout + serie) y claves de storage que el reset debe borrar.
SEED_USER_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const iso = new Date().toISOString();
  await new Promise((res, rej) => {
    const tx = db.transaction(['workouts', 'workoutSets'], 'readwrite');
    tx.objectStore('workouts').put({ id: 9001, startedAt: iso, finishedAt: iso, routineId: null, routineDayId: null, localDate: '2026-09-29', notes: 'F112', totalVolume: 0 });
    tx.objectStore('workoutSets').put({ id: 9101, workoutId: 9001, exerciseId: 999, setNumber: 1, weightKg: 60, reps: 8, completed: true, createdAt: iso });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  window.localStorage.setItem('gymlab-goals', JSON.stringify({ state: { goals: { 999: 120 } }, version: 0 }));
  window.localStorage.setItem('gymlab-equipment', JSON.stringify({ state: { selected: ['barra'] }, version: 0 }));
  window.sessionStorage.setItem('gymLab-preloadReload', '1');
  return true;
}"""

# Sesión activa en memoria (sin tocar Dexie): dispara el aviso del sheet informativo.
START_SESSION_JS = """async () => {
  const { useActiveWorkoutStore } = await import('/src/store/activeWorkoutStore.ts');
  useActiveWorkoutStore.getState().startWorkout();
  useActiveWorkoutStore.getState().addExercise(999, 'Sentadilla F112');
  return useActiveWorkoutStore.getState().exercises.length;
}"""

READ_FRESH_STATE_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const all = (store) => new Promise((res, rej) => {
    const r = db.transaction(store, 'readonly').objectStore(store).getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const [workouts, exercises, meta] = await Promise.all([all('workouts'), all('exercises'), all('meta')]);
  const metaValue = (key) => {
    const row = meta.find((m) => m.key === key);
    return row ? row.value : null;
  };
  return {
    workouts: workouts.length,
    exercises: exercises.length,
    seedVersion: metaValue('seedVersion'),
    unlocked: metaValue('unlockedAchievements'),
    onboardingDone: metaValue('onboardingDone'),
  };
}"""


def dismiss_overlays(page, timeout_ms=6000):
    # Sembrar workouts puede desbloquear logros y abrir su modal (z-50), que
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
    assert page.evaluate(SEED_USER_JS) is True, "seed de usuario fallo"
    page.goto(f"{BASE}/ajustes", wait_until="networkidle")
    page.wait_for_timeout(1000)
    dismiss_overlays(page)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812}, accept_downloads=True)
        pageerrors = []
        page.on("pageerror", lambda e: pageerrors.append(f"pageerror: {e}"))
        try:
            boot(page)

            # R1 — sesión activa + sheet informativo.
            if page.evaluate(START_SESSION_JS) != 1:
                errors.append("R1: no se pudo sembrar la sesión activa")
            page.locator("button", has_text="Resetear a estado de fábrica").first.click(timeout=5000)
            page.wait_for_selector('div[role="alertdialog"]', state="visible", timeout=5000)
            sheet = page.locator('div[role="alertdialog"]')
            sheet_text = sheet.inner_text()
            if "Entrenos" not in sheet_text:
                errors.append("R1: el sheet no lista lo que se borra")
            if "sesión en curso" not in sheet_text:
                errors.append("R1: falta el aviso de sesión activa")
            if sheet.locator("button", has_text="Continuar sin backup").count() == 0:
                errors.append("R1: falta el botón secundario")
            else:
                print("OK R1: sheet informativo con lista, aviso de sesión y secundario")

            # R2 — backup: descarga web del JSON.
            with page.expect_download() as dl_info:
                sheet.locator("button", has_text="Descargar backup").first.click(timeout=5000)
            download = dl_info.value
            name = download.suggested_filename
            if not name.startswith("gymlab-backup-") or not name.endswith(".json"):
                errors.append(f"R2: nombre de backup inesperado ({name})")
            else:
                print(f"OK R2: backup descargado como {name}")

            # R3 — gate de palabra.
            sheet.locator("button", has_text="Continuar sin backup").first.click(timeout=5000)
            page.wait_for_timeout(300)
            cta = page.locator('div[role="alertdialog"] button', has_text="Resetear todo").first
            page.fill("#reset-confirm-word", "borra")
            page.wait_for_timeout(200)
            if not cta.is_disabled():
                errors.append("R3: con 'borra' el CTA ya está habilitado")
            page.fill("#reset-confirm-word", "  borrar ")
            page.wait_for_timeout(200)
            if cta.is_disabled():
                errors.append("R3: con '  borrar ' el CTA sigue deshabilitado")
                raise AssertionError("R3: el gate no habilita el reset")
            print("OK R3: el gate bloquea 'borra' y habilita '  borrar '")

            # R4 — wipe + reload.
            cta.click(timeout=5000)
            page.wait_for_url(f"{BASE}/", timeout=15000)
            page.wait_for_selector('div[role="dialog"]', state="visible", timeout=30000)
            dialog_text = page.locator('div[role="dialog"]').first.inner_text().lower()
            if "idioma" not in dialog_text:
                errors.append("R4: el overlay visible no parece el onboarding")

            state = None
            for _ in range(60):
                state = page.evaluate(READ_FRESH_STATE_JS)
                if state["seedVersion"] == "23":
                    break
                page.wait_for_timeout(500)
            if state is None or state["seedVersion"] != "23":
                errors.append(f"R4: el catálogo no se re-sembró ({state})")
            elif state["workouts"] != 0 or state["unlocked"] is not None or state["onboardingDone"] is not None:
                errors.append(f"R4: quedó estado de usuario tras el reset ({state})")
            elif state["exercises"] == 0:
                errors.append("R4: catálogo vacío tras el reset")
            else:
                print(f"OK R4: catálogo sembrado ({state['exercises']} ejercicios) y estado limpio")

            goals = page.evaluate("() => window.localStorage.getItem('gymlab-goals')")
            equipment = page.evaluate("() => window.localStorage.getItem('gymlab-equipment')")
            preload = page.evaluate("() => window.sessionStorage.getItem('gymLab-preloadReload')")
            if goals is not None or equipment is not None or preload is not None:
                errors.append(
                    f"R4: claves de storage sin limpiar (goals={goals}, equipment={equipment}, preload={preload})"
                )
            else:
                print("OK R4: claves de localStorage/sessionStorage eliminadas")
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
    print("ALL OK: F112.1 reset de fábrica (sheet, backup, gate de palabra y wipe)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
