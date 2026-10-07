"""F120/W5 — PH-3: timeline de fotos paginado «Ver más» (no monta todo de una).

Se siembran 15 fechas de fotos; el timeline muestra 10 y el botón expande hasta 15
sin montar las 15 desde el arranque. Verifica también 0 errores de consola.
"""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TODAY = datetime.date.today()
PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="


def seed_js():
    """15 fechas de fotos en 15 días (más reciente = hoy)."""
    rows = []
    for i in range(15):
        d = TODAY - datetime.timedelta(days=i)
        rows.append(
            f"put('progressPhotos', {{ id: {9800 + i}, localDate: '{d.isoformat()}', "
            f"frontUri: '{PNG}', sideUri: null, backUri: null, createdAt: '{d.isoformat()}T09:00:00.000Z' }});"
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
    const tx = db.transaction(['progressPhotos', 'meta'], 'readwrite');
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
            page.goto(BASE, wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(800)
            seed_result = page.evaluate(seed_js())
            assert seed_result is True, f"seed fallo: {seed_result}"
            page.reload(wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(1000)

            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            page.goto(f"{BASE}/progreso-fotos", wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(1200)

            save_buttons = page.locator('[aria-label="Guardar en galería"]')
            if save_buttons.count() != 10:
                errors.append(f"PH-3: se esperaban 10 fechas montadas de 15, hay {save_buttons.count()}")
            else:
                print("OK: 10 fechas montadas de 15 al abrir")

            # La fecha más vieja (página 2) no está en el DOM todavía.
            oldest = (TODAY - datetime.timedelta(days=14)).isoformat()
            if oldest in page.inner_text("body"):
                errors.append(f"PH-3: la fecha vieja {oldest} se montó antes de expandir")

            ver_mas = page.locator("button", has_text="Ver más")
            if ver_mas.count() == 0:
                errors.append("PH-3: no aparece 'Ver más' con 15 fechas")
            else:
                ver_mas.first.click(timeout=5000)
                page.wait_for_timeout(800)
                if save_buttons.count() != 15:
                    errors.append(f"PH-3: tras 'Ver más' se esperaban 15 fechas, hay {save_buttons.count()}")
                else:
                    print("OK: 'Ver más' expande a las 15 fechas")
                if page.locator("button", has_text="Ver más").count() > 0:
                    errors.append("PH-3: 'Ver más' sigue visible con todas las fechas montadas")
                if oldest not in page.inner_text("body"):
                    errors.append(f"PH-3: la fecha vieja {oldest} no aparece tras expandir")

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
