"""Fase 93 #11 (Parte B): selector de ejercicio y comparación con el récord en /calculadoras/1rm.

Verifica que:
- El selector busca por nombre sobre el catálogo y permite elegir/quitar un ejercicio.
- Con un PR guardado del ejercicio, la tarjeta «Tu récord» muestra e1RM + origen (peso × reps) + fecha.
- Al calcular una estimación nueva, la tarjeta compara récord vs estimación:
  «¡Superado! Nuevo 1RM: +X kg» cuando la supera y «A X kg del récord» cuando no.
- Sin ejercicio o sin PR no aparece la tarjeta de récord.
- 0 errores de consola.
"""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

PR_DATE = datetime.date.today().isoformat()

SEED_JS = f"""async () => {{
  const openDb = () => new Promise((res, rej) => {{
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }});
  const db = await openDb();
  const ids = await new Promise((res, rej) => {{
    const tx = db.transaction('exercises', 'readonly');
    const q = tx.objectStore('exercises').getAll();
    q.onsuccess = () => res(q.result.slice(0, 1).map((e) => e.id));
    q.onerror = () => rej(q.error);
  }});
  if (!ids.length) return 'NO_EXERCISES';
  const exId = ids[0];
  await new Promise((res, rej) => {{
    const tx = db.transaction(['prs', 'meta'], 'readwrite');
    tx.objectStore('meta').put({{ key: 'onboardingDone', value: true }});
    tx.objectStore('prs').clear();
    tx.objectStore('prs').put({{
      exerciseId: exId,
      weightKg: 85,
      reps: 5,
      date: '{PR_DATE}T12:00:00.000Z',
      estimated1RM: 100,
    }});
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  }});
  return exId;
}}"""


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(800)
            ex_id = page.evaluate(SEED_JS)
            assert ex_id is not True and ex_id != "NO_EXERCISES", f"seed fallo: {ex_id}"

            # Nombre del ejercicio sembrado (localizado en es).
            ex_name = page.evaluate(
                """async () => {
                  const openDb = () => new Promise((res, rej) => {
                    const r = indexedDB.open('GymLabDB');
                    r.onsuccess = () => res(r.result);
                    r.onerror = () => rej(r.error);
                  });
                  const db = await openDb();
                  const ex = await new Promise((res, rej) => {
                    const tx = db.transaction('exercises', 'readonly');
                    const q = tx.objectStore('exercises').getAll();
                    q.onsuccess = () => res(q.result.slice(0, 1)[0]);
                    q.onerror = () => rej(q.error);
                  });
                  return ex.name;
                }"""
            )
            assert isinstance(ex_name, str) and ex_name, f"no se pudo leer el nombre del ejercicio: {ex_name}"

            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1000)

            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            page.goto(f"{BASE}/calculadoras/1rm", wait_until="networkidle")
            page.wait_for_timeout(1000)

            body_low = lambda: page.inner_text("body").lower()

            # Sin ejercicio elegido: no hay tarjeta de récord.
            if "tu récord" in body_low():
                errors.append("1rm: tarjeta de récord visible sin elegir ejercicio")

            # --- Selector: buscar por nombre completo y elegir ---
            search = page.locator('input[aria-label="Buscar ejercicio"]')
            if search.count() == 0:
                errors.append("1rm: input de búsqueda de ejercicio no encontrado")
            else:
                search.fill(ex_name)
                page.wait_for_timeout(500)
                option = page.locator(f"button:has-text('{ex_name}')").first
                if option.count() == 0:
                    errors.append(f"1rm: no aparece '{ex_name}' en los resultados de búsqueda")
                else:
                    option.click()
                    page.wait_for_timeout(500)
                    body1 = page.inner_text("body")
                    if ex_name not in body1:
                        errors.append("1rm: el ejercicio elegido no se muestra en el selector")
                    quitar_btn = page.locator('button[aria-label="Quitar ejercicio"]')
                    if quitar_btn.count() == 0:
                        errors.append("1rm: no hay botón para quitar el ejercicio")

                    # Con PR pero sin resultado calculado: NO debe aparecer la comparación de superado.
                    if "¡superado!" in body_low():
                        errors.append("1rm: aparece '¡Superado!' sin haber calculado una estimación")

                    # --- 80 × 5 -> Brzycki 90, NO supera el récord (100) ---
                    page.fill('input[placeholder="80"]', "80")
                    page.fill('input[placeholder="5"]', "5")
                    page.wait_for_timeout(400)
                    b2 = body_low()
                    if "tu récord" not in b2:
                        errors.append("1rm: tarjeta 'Tu récord' no visible tras elegir ejercicio")
                    if "100 kg" not in b2:
                        errors.append("1rm: e1RM del récord (100 kg) no visible")
                    if "85 kg × 5 reps" not in b2:
                        errors.append("1rm: origen del récord (85 kg × 5 reps) no visible")
                    if "a 10 kg del récord" not in b2:
                        errors.append("1rm: esperaba 'A 10 kg del récord' con 80×5 (90 < 100)")

                    # --- 95 × 5 -> Brzycki 106.9, SUPERA el récord (100) por 6.9 kg ---
                    page.fill('input[placeholder="80"]', "95")
                    page.wait_for_timeout(400)
                    b3 = body_low()
                    if "¡superado!" not in b3 or "+6.9 kg" not in b3:
                        errors.append("1rm: esperaba '¡Superado! Nuevo 1RM: +6.9 kg' con 95×5 (106.9 > 100)")

                    page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f93-t11-b-one-rm-record.png"), full_page=False)

                    # --- Quitar ejercicio: desaparece la tarjeta de récord ---
                    page.locator('button[aria-label="Quitar ejercicio"]').click()
                    page.wait_for_timeout(400)
                    if "tu récord" in body_low():
                        errors.append("1rm: tarjeta de récord sigue visible tras quitar el ejercicio")

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