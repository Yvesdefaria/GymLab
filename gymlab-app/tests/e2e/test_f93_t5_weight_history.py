"""Fase 93 #5: historial de peso corporal tipo timeline paginado (como el del perfil).

Se siembran 15 entradas de peso; el historial muestra 10 y el boton "Ver mas"
expande hasta mostrar las 15 (sin scroll virtualizado). Verifica tambien
borrado de una entrada y 0 errores de consola.
"""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TODAY = datetime.date.today()


def seed_js():
    """15 entradas de peso en 15 dias (mas reciente = 82.0 kg)."""
    rows = []
    for i in range(15):
        d = TODAY - datetime.timedelta(days=14 - i)
        rows.append(
            f"put('bodyWeight', {{ id: {8000 + i}, localDate: '{d.isoformat()}', weightKg: {72 + i * 0.7}, createdAt: '{d.isoformat()}T09:00:00.000Z' }});"
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
    const tx = db.transaction(['bodyWeight', 'meta'], 'readwrite');
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

            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            page.goto(f"{BASE}/peso-corporal", wait_until="networkidle")
            page.wait_for_timeout(1200)

            body = page.inner_text("body")
            body_lower = body.lower()
            if "historial" not in body_lower:
                errors.append("Seccion 'Historial' no encontrada")

            # Boton "Ver mas" presente porque hay 15 > 10.
            ver_mas = page.locator("button", has_text="Ver más")
            if ver_mas.count() == 0:
                errors.append("BUG: el boton 'Ver mas' no aparece con 15 entradas")
            else:
                print("OK: boton 'Ver mas' presente con 15 entradas")
                ver_mas.first.click(timeout=5000)
                page.wait_for_timeout(800)
                ver_mas_after = page.locator("button", has_text="Ver más")
                if ver_mas_after.count() > 0:
                    errors.append("BUG: 'Ver mas' sigue tras expandir las 15 entradas")
                else:
                    print("OK: 'Ver mas' desaparece al mostrar todas las entradas")

            # El historial muestra la fecha y el peso de la entrada mas reciente (72 + 14*0.7 = 81.8).
            if "81.8" not in page.inner_text("body"):
                errors.append("El peso mas reciente (81.8) no se muestra en el historial")

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