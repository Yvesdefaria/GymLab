"""Fase 93 #3: verificar deload de perfil (DeloadCard).

Casos:
1. Sin programa activo -> el DeloadCard no se renderiza en /perfil.
2. Con programa activo -> visible, switch off (aria-checked=false).
3. Toggle -> switch on (aria-checked=true) y persiste tras recarga.
4. Toggle de nuevo -> switch off.
"""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TODAY = datetime.date.today()
TODAY_STR = TODAY.isoformat()
TODAY_WD = TODAY.weekday() + 1  # getDay() JS: lunes=1

SEED_PROGRAM_JS = f"""async () => {{
  const openDb = () => new Promise((res, rej) => {{
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }});
  const db = await openDb();
  await new Promise((res, rej) => {{
    const tx = db.transaction(['activeProgram', 'meta'], 'readwrite');
    tx.objectStore('meta').put({{ key: 'onboardingDone', value: true }});
    tx.objectStore('activeProgram').clear();
    tx.objectStore('activeProgram').put({{
      id: 1,
      routineId: 1,
      startDate: '{TODAY_STR}',
      weekdays: [{TODAY_WD}],
      createdAt: '{TODAY_STR}T00:00:00.000Z',
    }});
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  }});
  return true;
}}"""

CLEAR_PROGRAM_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['activeProgram', 'meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: true });
    tx.objectStore('activeProgram').clear();
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def deload_switch(page):
    return page.get_by_role("switch", name="Activar semana de deload")


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
            # --- Caso 1: sin programa activo -> DeloadCard invisible. ---
            page.goto(BASE, wait_until="networkidle")
            page.evaluate(CLEAR_PROGRAM_JS)
            page.goto(f"{BASE}/perfil", wait_until="networkidle")
            page.wait_for_timeout(1000)
            sw = deload_switch(page)
            if sw.count() > 0:
                errors.append("BUG: el switch de deload aparece sin programa activo")
            else:
                print("OK: sin programa activo el DeloadCard no se muestra")

            # --- Caso 2: con programa activo -> visible y switch off. ---
            page.goto(BASE, wait_until="networkidle")
            page.evaluate(SEED_PROGRAM_JS)
            page.goto(f"{BASE}/perfil", wait_until="networkidle")
            page.wait_for_timeout(1000)
            sw = deload_switch(page)
            if sw.count() == 0:
                errors.append("BUG: el switch de deload no aparece con programa activo")
            else:
                checked = sw.first.get_attribute("aria-checked")
                if checked != "false":
                    errors.append(f"BUG: el switch deberia empezar off (aria-checked={checked})")
                else:
                    print("OK: con programa activo el switch aparece y empieza off")

                # --- Caso 3: toggle -> on + persiste tras recarga. ---
                sw.first.click(timeout=5000)
                page.wait_for_timeout(800)
                checked_on = sw.first.get_attribute("aria-checked")
                if checked_on != "true":
                    errors.append(f"BUG: tras activar, aria-checked={checked_on} (esperado true)")
                else:
                    print("OK: el switch se activa al tocarlo")

                page.reload(wait_until="networkidle")
                page.wait_for_timeout(1000)
                sw2 = deload_switch(page)
                if sw2.count() == 0:
                    errors.append("BUG: el switch desaparece tras recarga")
                else:
                    checked_persist = sw2.first.get_attribute("aria-checked")
                    if checked_persist != "true":
                        errors.append(f"BUG: el deload no persiste tras recarga (aria-checked={checked_persist})")
                    else:
                        print("OK: el deload persiste tras recarga")

                    # --- Caso 4: toggle de nuevo -> off. ---
                    sw2.first.click(timeout=5000)
                    page.wait_for_timeout(800)
                    checked_off = deload_switch(page).first.get_attribute("aria-checked")
                    if checked_off != "false":
                        errors.append(f"BUG: tras desactivar, aria-checked={checked_off} (esperado false)")
                    else:
                        print("OK: el switch se desactiva al tocarlo de nuevo")

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