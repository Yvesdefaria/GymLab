"""F132.2/Q4: timer Nocturno — anillo único de 214 px, chips, stats, custom en sheet
y fases sin verde/ámbar."""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import expect, sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ language: 'es', timerFormat: 'clock' }) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="networkidle")
            assert page.evaluate(SEED_JS) is True, "seed fallo"
            page.goto(f"{BASE}/timer", wait_until="networkidle")
            page.wait_for_timeout(1000)

            expect(page.get_by_text("Temporizador", exact=True)).to_be_visible()
            expect(page.get_by_role("heading", name="Tabata", exact=True)).to_be_visible()

            chips = page.locator('button[aria-pressed]')
            if chips.count() != 5:
                errors.append(f"se esperaban 5 chips de modo, hay {chips.count()}")

            ring = page.get_by_test_id("timer-ring")
            box = ring.bounding_box()
            if not box or abs(box["width"] - 214) > 2 or abs(box["height"] - 214) > 2:
                errors.append(f"el anillo no mide 214 px: {box}")

            progress_circle = ring.locator("circle").nth(1)
            if "cta" not in (progress_circle.get_attribute("stroke") or ""):
                errors.append(
                    f"el anillo de trabajo no usa el dorado: {progress_circle.get_attribute('stroke')}"
                )

            display = page.get_by_test_id("timer-display")
            before = display.inner_text()
            if "20" not in before:
                errors.append(f"el timer no arranca en 20 s de Tabata: {before!r}")

            page.get_by_role("button", name="Iniciar", exact=True).click(timeout=5000)
            page.wait_for_timeout(1250)
            after = display.inner_text()
            if after == before:
                errors.append("el timer no avanzó tras Iniciar")
            page.get_by_role("button", name="Pausar").click(timeout=5000)
            page.get_by_role("button", name="Reiniciar", exact=True).click(timeout=5000)
            page.wait_for_timeout(250)
            if display.inner_text() != before:
                errors.append(
                    f"Reiniciar no volvió al inicio: {display.inner_text()!r} vs {before!r}"
                )

            page.get_by_role("button", name="Configurar timer").click(timeout=5000)
            expect(page.get_by_role("dialog")).to_be_visible()
            expect(page.get_by_text("Trabajo, descanso y rondas")).to_be_visible()
            page.locator('input[aria-label="Trabajo (s)"]').fill("30")
            page.locator('input[aria-label="Descanso (s)"]').fill("15")
            page.locator('input[aria-label="Rondas totales"]').fill("5")
            page.get_by_role("button", name="Aplicar").click(timeout=5000)
            page.wait_for_timeout(500)
            expect(page.get_by_role("heading", name="Custom", exact=True)).to_be_visible()
            expect(page.get_by_text(re.compile(r"30 s trabajo"))).to_be_visible()
            if "30" not in display.inner_text():
                errors.append(f"el custom no aplicó 30 s: {display.inner_text()!r}")

            page.get_by_role("button", name="EMOM").click(timeout=5000)
            page.wait_for_timeout(300)
            expect(page.get_by_role("heading", name="EMOM", exact=True)).to_be_visible()

            if not errors:
                print("OK: timer de anillo único, chips, play/pause/reset y custom en sheet")
        except Exception as e:  # noqa: BLE001
            errors.append(f"Exception: {e}")
        finally:
            errors.extend(console_errors)
            page.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)
    print("ALL OK: F132.2 timer Nocturno")


if __name__ == "__main__":
    main()
