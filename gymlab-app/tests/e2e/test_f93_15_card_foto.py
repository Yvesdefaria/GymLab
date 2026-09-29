"""F93 #15 — card de sesión con foto de fondo: chip Foto, preview por píxel, cambiar/quitar y descarga."""
import base64
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# PNG 2x2 rojo puro (generado con System.Drawing): permite verificar por píxel que la foto se dibujó.
PNG_ROJO = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAARSURBVBhXYzghIvIfhBlgDABEZAe95nGcWwAAAABJRU5ErkJggg=="
)

# Entreno con datos + meta de logros pre-desbloqueados: evita el modal de F95 que intercepta clics.
SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'workouts', 'workoutSets', 'prs', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 99001, slug: 'sentadilla-f93', name: 'Sentadilla F93', muscleGroup: 'pierna', equipment: ['barra'], instructions: '', category: 'strength' });
    tx.objectStore('workouts').put({ id: 9501, startedAt: '2026-08-24T09:00:00.000Z', finishedAt: '2026-08-24T10:15:00.000Z', routineId: null, routineDayId: null, localDate: '2026-08-24', notes: '', totalVolume: 4800 });
    tx.objectStore('workoutSets').put({ id: 95001, workoutId: 9501, exerciseId: 99001, setNumber: 1, weightKg: 100, reps: 5, completed: true, createdAt: '2026-08-24T09:05:00.000Z' });
    tx.objectStore('workoutSets').put({ id: 95002, workoutId: 9501, exerciseId: 99001, setNumber: 2, weightKg: 100, reps: 5, completed: true, createdAt: '2026-08-24T09:08:00.000Z' });
    tx.objectStore('prs').put({ exerciseId: 99001, weightKg: 100, reps: 5, date: '2026-08-24T10:15:00.000Z', estimated1RM: 112.5 });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    const ids = ['primer-paso', 'inaugural', 'primera-marca'];
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(ids) });
    tx.objectStore('meta').put({ key: 'achievementCounts', value: JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))) });
    tx.objectStore('meta').put({ key: 'achievementSnapshot', value: JSON.stringify(ids) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812}, accept_downloads=True)
        page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(800)
            assert page.evaluate(SEED_JS) is True, "seed fallo"
            page.goto(f"{BASE}/entrenamiento/9501", wait_until="networkidle")
            page.wait_for_timeout(1200)

            card = page.locator("[data-photo-template]").first
            assert card.count() > 0, "no se renderizó el export de sesión"

            chips = page.locator("[data-template]")
            assert chips.count() == 4, f"chips != 4 (Foto + 3): {chips.count()}"
            assert chips.first.get_attribute("data-template") == "photo", "el primer chip no es Foto"

            # Foto (web): el chip abre el input file; se selecciona un PNG rojo.
            with page.expect_file_chooser() as fc:
                page.locator('[data-template="photo"]').first.click()
            fc.value.set_files({"name": "foto-card.png", "mimeType": "image/png", "buffer": PNG_ROJO})
            page.wait_for_timeout(900)

            assert card.get_attribute("data-photo-template") == "photo", "el modo foto no se activó"
            assert page.locator('[data-template="photo"]').first.get_attribute("aria-checked") == "true"
            assert page.locator("text=Cambiar foto").count() > 0, "falta el atajo Cambiar foto"
            assert page.locator("text=Quitar foto").count() > 0, "falta el atajo Quitar foto"

            # La foto se dibujó: píxel (100, 300) rojo (ahí no hay texto y el degradado es casi nulo).
            pixel = page.evaluate("""() => {
              const c = document.querySelector('canvas');
              const d = c.getContext('2d').getImageData(100, 300, 1, 1).data;
              return [d[0], d[1], d[2], d[3]];
            }""")
            if not (pixel[3] == 255 and pixel[0] > 150 and pixel[1] < 80 and pixel[2] < 80):
                errors.append(f"foto: el píxel (100,300) no es rojo de la foto: {pixel}")

            # Quitar foto vuelve a la plantilla previa (Clásica por defecto).
            page.locator("text=Quitar foto").first.click()
            page.wait_for_timeout(400)
            assert card.get_attribute("data-photo-template") == "classic", "Quitar foto no volvió a Clásica"
            assert page.locator('[data-template="photo"]').first.get_attribute("aria-checked") == "false"

            # Volver a poner foto (la anterior se descartó) y descargar el PNG.
            with page.expect_file_chooser() as fc2:
                page.locator('[data-template="photo"]').first.click()
            fc2.value.set_files({"name": "foto-card.png", "mimeType": "image/png", "buffer": PNG_ROJO})
            page.wait_for_timeout(900)
            assert card.get_attribute("data-photo-template") == "photo", "no se reactivó el modo foto"

            with page.expect_download() as dl:
                page.locator("button", has_text="Descargar").first.click()
            download = dl.value
            assert download.suggested_filename == "gymlab-2026-08-24.png", download.suggested_filename
            print("OK: card con foto (chip, preview, cambiar/quitar y descarga)")
        except Exception as e:  # noqa: BLE001
            errors.append(str(e))
        finally:
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("ALL OK: F93 #15 card con foto")
    return 0


if __name__ == "__main__":
    sys.exit(main())
