"""Fase 98.1: nota de sesión — debounce, flush en pagehide y detalle.

Flujo real en móvil 375x812:
  1. Arranca sesión activa y añade un ejercicio.
  2. Escribe la nota en la cabecera; a los ~400 ms queda en localStorage (R3).
  3. Edita la nota y dispara `pagehide` sin esperar: se vuelca igual (R3 flush).
  4. Finaliza el entreno y el detalle muestra la nota persistida (R2/R4).
  5. El textarea no desborda el viewport de 375 px (R3).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"
STORAGE_KEY = "gymLab-activeWorkout"

# Solo el catálogo del ejercicio a registrar (id fuera del seed) y onboarding hecho.
SEED_ACTIVE_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 999, slug: 'sentadilla-e2e', name: 'Sentadilla E2E', muscleGroup: 'pierna', equipment: 'barra', instructions: '', category: 'strength' });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def boot(page):
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(800)
    assert page.evaluate(SEED_ACTIVE_JS) is True, "seed fallo"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(1000)
    skip_ob = page.locator("button", has_text="Ya entreno aquí")
    if skip_ob.count() > 0:
        skip_ob.first.click(timeout=5000)
        page.wait_for_timeout(800)


def stored_note(page):
    return page.evaluate(
        """(key) => {
            const raw = localStorage.getItem(key);
            return raw === null ? null : JSON.parse(raw).state.sessionNote;
        }""",
        STORAGE_KEY,
    )


def latest_workout_id(page):
    return page.evaluate(
        """async () => {
            const db = await new Promise((res, rej) => {
                const r = indexedDB.open('GymLabDB');
                r.onsuccess = () => res(r.result);
                r.onerror = () => rej(r.error);
            });
            return await new Promise((res, rej) => {
                const req = db.transaction('workouts', 'readonly').objectStore('workouts').getAllKeys();
                req.onsuccess = () => res(Math.max(0, ...req.result));
                req.onerror = () => rej(req.error);
            });
        }"""
    )


def main():
    errors = []
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
            page.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")
            page.wait_for_timeout(1000)

            # Ejercicio para poder finalizar la sesión.
            page.locator("button", has_text="Añadir ejercicio").first.click()
            page.wait_for_selector('input[aria-label="Buscar ejercicio"]', state="visible", timeout=5000)
            page.fill('input[aria-label="Buscar ejercicio"]', "Sentadilla E2E")
            page.wait_for_timeout(400)
            page.locator("button", has_text="Sentadilla E2E").first.click()
            page.wait_for_timeout(600)
            skip_warm = page.locator("button", has_text="Saltar calentamiento")
            if skip_warm.count() > 0:
                skip_warm.first.click()
                page.wait_for_timeout(500)

            # R3 — el textarea no desborda el viewport de 375 px.
            note = page.locator('textarea[aria-label="Nota libre de la sesión"]')
            box = note.bounding_box()
            if box is None:
                errors.append("nota: no se renderiza el textarea de la cabecera")
            elif box["x"] + box["width"] > 375.5:
                errors.append(f"nota: el textarea desborda 375px (right={box['x'] + box['width']})")

            # R3 — tecleo persistido por debounce (~400 ms) sin más acción.
            first = "Trabajé hasta fallo en press"
            note.fill(first)
            page.wait_for_timeout(700)
            if stored_note(page) != first:
                errors.append(f"nota: no persistió por debounce (guardado={stored_note(page)!r})")

            # R3 — flush en pagehide: se edita y se oculta sin esperar al debounce.
            second = "Nota tras edición, sin perderla"
            note.fill(second)
            page.wait_for_timeout(50)
            page.evaluate("() => window.dispatchEvent(new Event('pagehide'))")
            page.wait_for_timeout(50)
            if stored_note(page) != second:
                errors.append(f"nota: pagehide no volcó la edición pendiente (guardado={stored_note(page)!r})")

            # R2/R4 — finaliza: la nota viaja al workout y el detalle la muestra.
            page.fill('input[aria-label="Peso en kg"]', "100")
            page.fill('input[aria-label="Repeticiones"]', "5")
            page.locator('button[aria-label="Marcar completada"]').first.click()
            page.wait_for_timeout(500)
            page.locator("button", has_text="Finalizar entreno").first.click()
            page.wait_for_timeout(2000)

            workout_id = latest_workout_id(page)
            if workout_id < 1:
                errors.append(f"nota: no se creó el workout al finalizar (id={workout_id})")
            else:
                page.goto(f"{BASE}/entrenamiento/{workout_id}", wait_until="networkidle")
                page.wait_for_timeout(1200)
                if second not in page.locator("body").inner_text():
                    errors.append("nota: el detalle no muestra la nota persistida tras finalizar")

            page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f98-1-nota-detalle.png"))
        except Exception as e:  # noqa: BLE001
            errors.append(str(e))
        finally:
            errors.extend(console_errors)
            page.close()
            browser.close()

    if errors:
        print("FALLO:")
        for e in errors:
            print(" -", e)
        return 1
    print("OK: F98.1 nota de sesión verificada (debounce, flush en pagehide y detalle)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
