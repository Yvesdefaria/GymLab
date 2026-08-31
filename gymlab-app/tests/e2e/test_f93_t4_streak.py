"""Fase 93 #4: tab Rachas del perfil expandida.

Verifica que la tab /perfil > Rachas muestra: hero con racha actual/maxima,
grid de ultimos 30 dias con dias entrenados marcados y barra de progreso a la
insignia, y que persiste sin errores de consola.
"""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TODAY = datetime.date.today()


def seed_js():
    """Siembra 5 workouts en los ultimos 5 dias (racha activa = 5) + onboardingDone."""
    rows = []
    for i in range(5):
        d = TODAY - datetime.timedelta(days=4 - i)
        local = d.isoformat()
        rows.append(
            f"put('workouts', {{ id: {9000 + i}, startedAt: '{local}T09:00:00.000Z', finishedAt: '{local}T10:00:00.000Z', routineId: null, routineDayId: null, localDate: '{local}', notes: '', totalVolume: {3000 + i * 100} }});"
        )
    rows_js = "\n      ".join(rows)
    return f"""async () => {{
  const openDb = () => new Promise((res, rej) => {{
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }});
  const db = await openDb();
  await new Promise((res, rej) => {{
    const tx = db.transaction(['workouts', 'meta'], 'readwrite');
    const put = (store, row) => tx.objectStore(store).put(row);
    put('meta', {{ key: 'onboardingDone', value: true }});
    {rows_js}
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  }});
  return true;
}}"""


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(800)
            seed_result = page.evaluate(seed_js())
            assert seed_result is True, f"seed fallo: {seed_result}"
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1000)

            # Saltar onboarding si reaparece.
            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            page.goto(f"{BASE}/perfil", wait_until="networkidle")
            page.wait_for_timeout(1000)

            # Ir a la tab Rachas.
            tab = page.get_by_role("tab", name="Rachas")
            if tab.count() == 0:
                errors.append("Tab 'Rachas' no encontrada")
            else:
                tab.first.click(timeout=5000)
                page.wait_for_timeout(600)

                body = page.inner_text("body")
                body_lower = body.lower()
                # Hero: racha actual (5 días) y racha máxima.
                if "racha actual" not in body_lower or "5 días" not in body_lower:
                    errors.append("Hero de racha actual no muestra los días")
                if "racha máxima" not in body_lower:
                    errors.append("Hero de racha máxima no aparece")
                if "{{fecha}}" in body:
                    errors.append("BUG: la fecha del ultimo entreno no se interpola ({{fecha}} literal)")
                # Grid de últimos 30 días.
                grid = page.get_by_role("img", name="Últimos 30 días")
                if grid.count() == 0:
                    errors.append("Grid de ultimos 30 dias no encontrado")
                else:
                    cells = grid.first.locator("span").count()
                    if cells != 30:
                        errors.append(f"Grid deberia tener 30 celdas, tiene {cells}")
                    else:
                        print("OK: grid de 30 dias presente")
                # Barra de progreso a la insignia (racha 5 -> hito 7).
                if "insignia" in body or "A 2 días de la insignia" in body or "A 2 días" in body:
                    print("OK: barra de progreso a la insignia presente")
                else:
                    errors.append("Barra de progreso a la insignia no encontrada")

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