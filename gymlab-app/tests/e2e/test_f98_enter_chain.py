"""Fase 98.4: cadena de foco con Enter y enterKeyHint en los inputs de serie.

Flujo real en móvil 375x812:
  1. Arranca una sesión con RPE/RIR visibles (ajustes) y un ejercicio de fuerza.
  2. Asegura dos series.
  3. Enter avanza peso → reps → RPE → RIR dentro de la fila (R1).
  4. Enter en el último campo salta al primer input de la siguiente serie (R1).
  5. Un borrador inválido no se escribe como 0 y el foco avanza igual (R1).
  6. Enter en el último input de la última serie confirma y hace blur (R1).
  7. Todos los inputs de la cadena exponen enterKeyHint="next" (R2).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

WEIGHT = "Peso en kg"
REPS = "Repeticiones"
RPE = "RPE de la serie"
RIR = "RIR de la serie"
CHAIN_SELECTOR = (
    'input[aria-label="Peso en kg"], input[aria-label="Repeticiones"], '
    'input[aria-label="RPE de la serie"], input[aria-label="RIR de la serie"]'
)

# Ejercicio de fuerza fuera del seed + RPE/RIR activados + onboarding hecho.
SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 999, slug: 'sentadilla-e2e', name: 'Sentadilla E2E', muscleGroup: 'pierna', equipment: 'barra', instructions: '', category: 'strength' });
    tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ showRpe: true, showRir: true }) });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def boot(page):
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(800)
    assert page.evaluate(SEED_JS) is True, "seed fallo"
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(1000)
    skip_ob = page.locator("button", has_text="Ya entreno aquí")
    if skip_ob.count() > 0:
        skip_ob.first.click(timeout=5000)
        page.wait_for_timeout(800)


def is_focused(locator):
    try:
        return locator.evaluate("el => el === document.activeElement")
    except Exception:  # noqa: BLE001
        return False


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

            # Añade el ejercicio de fuerza (con RPE/RIR visibles por ajustes).
            page.locator("button", has_text="Añadir ejercicio").first.click()
            page.wait_for_selector('input[aria-label="Buscar ejercicio"]', state="visible", timeout=5000)
            page.fill('input[aria-label="Buscar ejercicio"]', "Sentadilla E2E")
            page.wait_for_timeout(400)
            # F98.3: el cuerpo de la fila abre la ficha; el alta es el botón «+».
            page.locator('button[aria-label="Agregar Sentadilla E2E"]').first.click()
            page.wait_for_timeout(600)
            skip_warm = page.locator("button", has_text="Saltar calentamiento")
            if skip_warm.count() > 0:
                skip_warm.first.click()
                page.wait_for_timeout(500)

            # R2 — todos los inputs de la cadena exponen enterKeyHint="next".
            hints = page.eval_on_selector_all(
                CHAIN_SELECTOR,
                "els => els.map(e => e.enterKeyHint || e.getAttribute('enterkeyhint'))",
            )
            if len(hints) < 4:
                errors.append(f"enterKeyHint: faltan inputs de la cadena (encontrados={len(hints)})")
            elif any(h != "next" for h in hints):
                errors.append(f"enterKeyHint: se esperaba 'next' en todos (={hints})")

            # Asegura una segunda serie para probar el salto entre series.
            weights = page.locator(f'input[aria-label="{WEIGHT}"]')
            if weights.count() < 2:
                page.locator("button", has_text="Añadir serie").first.click()
                page.wait_for_timeout(400)

            w0 = page.locator(f'input[aria-label="{WEIGHT}"]').nth(0)
            r0 = page.locator(f'input[aria-label="{REPS}"]').nth(0)
            rpe0 = page.locator(f'input[aria-label="{RPE}"]').nth(0)
            rir0 = page.locator(f'input[aria-label="{RIR}"]').nth(0)
            w1 = page.locator(f'input[aria-label="{WEIGHT}"]').nth(1)
            r1 = page.locator(f'input[aria-label="{REPS}"]').nth(1)

            # R1 — avance dentro de la fila: peso → reps.
            w0.fill("100")
            page.keyboard.press("Enter")
            page.wait_for_timeout(150)
            if not is_focused(r0):
                errors.append("cadena: Enter en peso no enfocó reps")

            # R1 — modo fuerza: reps → RPE → RIR.
            r0.fill("5")
            page.keyboard.press("Enter")
            page.wait_for_timeout(150)
            if not is_focused(rpe0):
                errors.append("cadena: Enter en reps no enfocó RPE")

            rpe0.fill("8")
            page.keyboard.press("Enter")
            page.wait_for_timeout(150)
            if not is_focused(rir0):
                errors.append("cadena: Enter en RPE no enfocó RIR")

            # R1 — último campo de la serie → primer input de la siguiente.
            rir0.fill("2")
            page.keyboard.press("Enter")
            page.wait_for_timeout(150)
            if not is_focused(w1):
                errors.append("cadena: Enter en RIR no saltó al peso de la siguiente serie")

            # R1 — borrador inválido: no se escribe 0 y el foco avanza igual.
            w1.fill("90")
            page.keyboard.press("Enter")
            page.wait_for_timeout(150)
            w1.fill("abc")
            page.keyboard.press("Enter")
            page.wait_for_timeout(150)
            if not is_focused(r1):
                errors.append("cadena: Enter con borrador inválido no avanzó el foco")
            if w1.input_value() != "90":
                errors.append(f"cadena: borrador inválido corrompió el peso (={w1.input_value()!r})")

            # R1 — último input de la última serie: confirma y hace blur.
            rir1 = page.locator(f'input[aria-label="{RIR}"]').nth(1)
            rir1.fill("1")
            page.keyboard.press("Enter")
            page.wait_for_timeout(150)
            active_tag = page.evaluate(
                "() => (document.activeElement && document.activeElement.tagName) || null"
            )
            if active_tag == "INPUT":
                errors.append("cadena: Enter en el último input no hizo blur")

            page.screenshot(
                path=os.path.join(os.path.dirname(__file__), "shots", "f98-2-enter-chain.png")
            )
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
    print("OK: F98.4 cadena de foco con Enter y enterKeyHint verificada")
    return 0


if __name__ == "__main__":
    sys.exit(main())
