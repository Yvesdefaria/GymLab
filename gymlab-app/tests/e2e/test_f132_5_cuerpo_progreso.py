"""F132.5 — Cuerpo y progreso: peso, cuerpo, fotos y comparador con Nocturno Minimal.

Cubre las cuatro rutas con datos sembrados, el rango de peso, la selección del mapa,
los slots/sheet de fotos y el delta de peso A/B. Falla con cualquier pageerror.
"""
import os
import sys
import datetime

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"
TODAY = datetime.date.today()
D10 = TODAY - datetime.timedelta(days=10)
D45 = TODAY - datetime.timedelta(days=45)

PNG = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ"
    "AAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def seed_js():
    return f"""async () => {{
  const openDb = () => new Promise((res, rej) => {{
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }});
  const db = await openDb();

  const readAll = (store) => new Promise((res, rej) => {{
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  }});

  const exercises = await readAll('exercises');
  const byMuscle = (mg) => exercises.find((e) => e.muscleGroup === mg);

  await new Promise((res, rej) => {{
    const tx = db.transaction(
      ['workouts', 'workoutSets', 'bodyWeight', 'progressPhotos', 'meta'],
      'readwrite'
    );
    const put = (store, row) => tx.objectStore(store).put(row);

    put('meta', {{ key: 'onboardingDone', value: true }});

    put('bodyWeight', {{ id: 8101, localDate: '{TODAY.isoformat()}', weightKg: 78.4, createdAt: '{TODAY.isoformat()}T09:00:00.000Z' }});
    put('bodyWeight', {{ id: 8102, localDate: '{D10.isoformat()}', weightKg: 79.1, createdAt: '{D10.isoformat()}T09:00:00.000Z' }});
    put('bodyWeight', {{ id: 8103, localDate: '{D45.isoformat()}', weightKg: 80.5, createdAt: '{D45.isoformat()}T09:00:00.000Z' }});

    put('progressPhotos', {{ id: 8201, localDate: '{TODAY.isoformat()}', frontUri: '{PNG}', sideUri: '{PNG}', backUri: '{PNG}', createdAt: '{TODAY.isoformat()}T09:00:00.000Z' }});
    put('progressPhotos', {{ id: 8202, localDate: '{D10.isoformat()}', frontUri: '{PNG}', sideUri: null, backUri: null, createdAt: '{D10.isoformat()}T09:00:00.000Z' }});

    put('workouts', {{ id: 8301, routineId: null, routineDayId: null, localDate: '{TODAY.isoformat()}', startedAt: '{TODAY.isoformat()}T10:00:00', finishedAt: '{TODAY.isoformat()}T11:00:00' }});
    put('workouts', {{ id: 8302, routineId: null, routineDayId: null, localDate: '{D10.isoformat()}', startedAt: '{D10.isoformat()}T10:00:00', finishedAt: '{D10.isoformat()}T11:00:00' }});

    const chest = byMuscle('pecho');
    const back = byMuscle('espalda');
    if (chest) put('workoutSets', {{ id: 8401, workoutId: 8301, exerciseId: chest.id, setNumber: 1, reps: 10, weightKg: 50, completed: true, createdAt: '{TODAY.isoformat()}T10:05:00' }});
    if (back) put('workoutSets', {{ id: 8402, workoutId: 8302, exerciseId: back.id, setNumber: 1, reps: 10, weightKg: 50, completed: true, createdAt: '{D10.isoformat()}T10:05:00' }});

    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  }});

  return true;
}}"""


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.on(
            "console",
            lambda m: errors.append(f"console.{m.type}: {m.text}")
            if m.type == "error"
            else None,
        )

        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(900)
            assert page.evaluate(seed_js()) is True, "fallo el seed"
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1000)

            # --- Peso corporal ---
            page.goto(f"{BASE}/peso-corporal", wait_until="networkidle")
            page.wait_for_timeout(1400)
            body = page.inner_text("body").lower()
            assert "78.4" in body, "no aparece el peso de hoy"
            assert "history" in body or "historial" in body, "falta el historial"
            assert page.locator('input[inputmode="decimal"]').input_value() == ""

            # 30 d no incluye el registro de hace 45 d; 90 d sí.
            assert "80.5" not in page.inner_text("body"), "30 d filtró mal el historial"
            page.click('button:has-text("90 d")')
            page.wait_for_timeout(600)
            assert "80.5" in page.inner_text("body"), "90 d no mostró el registro viejo"
            print("OK: peso (héroe, rango 30/90, historial)")

            # --- Cuerpo ---
            page.goto(f"{BASE}/cuerpo", wait_until="networkidle")
            page.wait_for_timeout(1400)
            assert page.locator('[data-muscle="pecho"]').count() > 0, "falta el mapa muscular"
            legend = page.inner_text("body").lower()
            assert "recovered" in legend or "recuperado" in legend, "falta la leyenda"
            page.locator('[data-muscle="pecho"]').first.click()
            page.wait_for_timeout(500)
            assert page.locator('a[href^="/ejercicios/"]').count() > 0, "no hay ejercicios del músculo"
            assert page.locator('a[href="/peso-corporal"]').count() > 0, "falta el vínculo a peso"
            assert page.locator('a[href="/progreso-fotos"]').count() > 0, "falta el vínculo a fotos"
            print("OK: cuerpo (mapa, leyenda, detalle y vínculos)")

            # --- Fotos de progreso ---
            page.goto(f"{BASE}/progreso-fotos", wait_until="networkidle")
            page.wait_for_timeout(1400)
            assert page.locator('input[type="file"]').count() == 3, "faltan los inputs de captura"
            capture = page.inner_text("body").lower()
            assert "frente" in capture or "front" in capture, "falta el slot de frente"
            assert page.locator("[data-photo-date]").count() == 2, "el timeline no tiene 2 fechas"

            page.locator("[data-photo-date]").first.click()
            page.wait_for_timeout(500)
            assert page.locator('[data-action="save-gallery"]').count() > 0, "falta guardar en galería"
            assert page.locator('[data-action="delete-date"]').count() > 0, "falta eliminar fecha"
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
            print("OK: fotos (slots, timeline y sheet)")

            # --- Comparar ---
            page.goto(f"{BASE}/progreso-fotos/comparar", wait_until="networkidle")
            page.wait_for_timeout(1400)
            assert page.locator("select").count() == 2, "faltan los selects A/B"
            assert page.locator('[data-mode="split"]').count() > 0, "falta el modo dividido"
            compare = page.inner_text("body").lower()
            assert "79.1" in compare and "78.4" in compare, "el delta de peso no muestra A/B"
            assert "0.7" in compare, "el delta de peso no muestra el cambio"

            page.click('[data-angle="sideUri"]')
            page.wait_for_timeout(300)
            assert page.locator("[data-photo-missing]").count() > 0, "falta el placeholder sin foto"

            page.click('[data-mode="toggle"]')
            page.wait_for_timeout(300)
            page.click('[data-action="toggle-ab"]')
            page.wait_for_timeout(300)
            assert page.locator("text=B ·").count() > 0, "el toggle A/B no cambió a B"
            print("OK: comparar (A/B, ángulo, modos y delta)")

        except Exception as e:  # noqa: BLE001
            errors.append(str(e) or e.__class__.__name__)
        finally:
            browser.close()

    if errors:
        print("ERRORS:")
        for error in errors:
            print(f"  - {error}")
        return 1

    print("ALL OK: F132.5 Cuerpo y progreso")
    return 0


if __name__ == "__main__":
    sys.exit(main())
