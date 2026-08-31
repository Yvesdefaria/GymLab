"""Fase 93 #4/#6: tab Rachas del perfil expandida (racha por semanas cumplidas).

Verifica que la tab /perfil > Rachas muestra: hero con racha actual/maxima en
SEMANAS, grid de ultimos 30 dias, barra de progreso a la insignia (4/8/16
semanas), y que persiste sin errores de consola. Se siembran 3 semanas con
3 sesiones cada una -> racha actual = 3 semanas.
"""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TODAY = datetime.date.today()


def seed_js():
    """3 semanas consecutivas (actual y 2 atras), 3 sesiones por semana (lun/mie/vie)."""
    rows = []
    n = 0
    for w in range(3):
        # Lunes de cada semana atras.
        monday = TODAY - datetime.timedelta(days=TODAY.weekday()) - datetime.timedelta(weeks=w)
        for offset in (0, 2, 4):
            d = monday + datetime.timedelta(days=offset)
            rows.append(
                f"put('workouts', {{ id: {9000 + n}, startedAt: '{d.isoformat()}T09:00:00.000Z', finishedAt: '{d.isoformat()}T10:00:00.000Z', routineId: null, routineDayId: null, localDate: '{d.isoformat()}', notes: '', totalVolume: {3000 + n * 100} }});"
            )
            n += 1
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

            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            page.goto(f"{BASE}/perfil", wait_until="networkidle")
            page.wait_for_timeout(1000)

            tab = page.get_by_role("tab", name="Rachas")
            if tab.count() == 0:
                errors.append("Tab 'Rachas' no encontrada")
            else:
                tab.first.click(timeout=5000)
                page.wait_for_timeout(600)

                body = page.inner_text("body")
                body_lower = body.lower()
                # Hero: racha actual (3 semanas) y racha máxima.
                if "racha actual" not in body_lower or "3 semanas" not in body_lower:
                    errors.append(f"Hero de racha actual no muestra las semanas (body: {body[:300]})")
                if "racha máxima" not in body_lower:
                    errors.append("Hero de racha máxima no aparece")
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
                # Barra de progreso a la insignia (racha 3 -> hito 4 semanas).
                if "insignia" in body or "A 1 semana" in body or "A 1 semana" in body:
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