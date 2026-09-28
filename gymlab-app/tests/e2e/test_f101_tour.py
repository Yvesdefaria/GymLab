"""F101 (101.1–101.4): tour guiado — arranque único tras el setup, recorrido guiado,
replay desde Ajustes, tips de primera vez con toggle y salto sin marcar secciones."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

TOUR = 'div[role="dialog"][aria-label="Tour guiado de la app"]'
TIP_LABEL = "Primera vez acá"

SEED_PENDING_JS = """async () => {
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  await new Promise((res, rej) => {
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.objectStore('meta').put({ key: 'tourPending', value: 'true' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""

READ_META_JS = """async () => {
  const db = await new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const rows = await new Promise((res, rej) => {
    const q = db.transaction('meta', 'readonly').objectStore('meta').getAll();
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}"""


def f101_meta(page):
    raw = page.evaluate(READ_META_JS)
    out = {}
    for key in ("tourDone", "tourPending", "sectionTipsSeen"):
        if key in raw:
            try:
                out[key] = json.loads(raw[key])
            except (TypeError, ValueError):
                out[key] = raw[key]
    return out


def complete_wizard(page):
    page.get_by_role("button", name="Español").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Fuerza").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="3", exact=True).first.click()
    page.get_by_role("button", name="Gimnasio").click()
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Hombre").click()
    page.get_by_label("Fecha de nacimiento").fill("1996-01-15")
    page.get_by_label("Altura en centímetros").fill("175")
    page.get_by_label("Peso en kg").fill("80")
    page.get_by_role("button", name="Continuar").click()
    page.wait_for_timeout(300)
    page.get_by_role("checkbox").check()
    page.get_by_role("button", name="Empezar D1").click()


def run_scenario_full_tour(page, errors):
    complete_wizard(page)
    page.wait_for_selector(TOUR, state="visible", timeout=6000)
    if "Te muestro la app en 1 minuto" not in page.locator(TOUR).inner_text():
        errors.append("tour: no muestra el paso de bienvenida")
    if "1 / 8" not in page.locator(TOUR).inner_text():
        errors.append("tour: el contador no arranca en 1 / 8")

    # Paso 2 — Tu día (spotlight sobre el hero).
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_timeout(500)
    if page.locator('[data-testid="tour-spotlight"]').count() != 1:
        errors.append("tour: el paso «tu día» no muestra spotlight sobre el hero")
    page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f101-tour-paso2.png"))

    # Pasos 3–4 (Empezar, TabBar) y salto a Rutinas.
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_url("**/rutinas", timeout=5000)
    page.wait_for_timeout(500)
    if page.get_by_text(TIP_LABEL).count() != 0:
        errors.append("tour: el tip de sección apareció durante el tour")

    # Pasos 6–8 (Estadísticas, Logros, Más) y Terminar.
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_url("**/estadisticas", timeout=5000)
    page.wait_for_timeout(400)
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_url("**/logros", timeout=5000)
    page.wait_for_timeout(400)
    page.get_by_role("button", name="Siguiente").click()
    page.wait_for_url("**/mas", timeout=5000)
    page.wait_for_timeout(400)
    page.get_by_role("button", name="Terminar").click()
    page.wait_for_url(f"{BASE}/", timeout=5000)
    page.wait_for_timeout(600)
    if page.locator(TOUR).count() != 0:
        errors.append("tour: no se cerró al terminar el recorrido")

    meta = f101_meta(page)
    if meta.get("tourDone") is not True:
        errors.append(f"tour: tourDone no quedó en true ({meta.get('tourDone')!r})")
    if meta.get("tourPending") is not False:
        errors.append(f"tour: tourPending no quedó en false ({meta.get('tourPending')!r})")
    seen = meta.get("sectionTipsSeen") or {}
    for section in ("inicio", "rutinas", "estadisticas", "logros", "mas"):
        if not seen.get(section):
            errors.append(f"tour: la sección {section} no quedó marcada como vista")

    # No re-arranca al recargar.
    page.reload(wait_until="load")
    page.wait_for_timeout(1500)
    if page.locator(TOUR).count() != 0:
        errors.append("tour: volvió a abrirse solo tras recargar")

    # Toggle OFF: /perfil (sección sin tip visto) no muestra tarjeta.
    page.goto(f"{BASE}/ajustes", wait_until="load")
    page.wait_for_timeout(800)
    page.get_by_role("switch", name="Consejos de primera vez").click()
    page.wait_for_timeout(400)
    page.goto(f"{BASE}/perfil", wait_until="load")
    page.wait_for_timeout(1000)
    if page.get_by_text(TIP_LABEL).count() != 0:
        errors.append("tips: apareció con el toggle apagado")

    # Toggle ON: /perfil muestra la tarjeta; Entendido la cierra y no vuelve.
    page.goto(f"{BASE}/ajustes", wait_until="load")
    page.wait_for_timeout(800)
    page.get_by_role("switch", name="Consejos de primera vez").click()
    # El toggle persiste async (void update): dar tiempo al write antes de recargar.
    page.wait_for_timeout(400)
    page.goto(f"{BASE}/perfil", wait_until="load")
    page.wait_for_timeout(1000)
    if page.get_by_text(TIP_LABEL).count() == 0:
        errors.append("tips: no apareció la primera vez en /perfil")
    else:
        page.get_by_role("button", name="Entendido").click()
        page.wait_for_timeout(300)
        if page.get_by_text(TIP_LABEL).count() != 0:
            errors.append("tips: no se cerró con Entendido")
    page.reload(wait_until="load")
    page.wait_for_timeout(1000)
    if page.get_by_text(TIP_LABEL).count() != 0:
        errors.append("tips: reapareció en la segunda visita a /perfil")

    # Una sección cubierta por el tour no muestra tip (estadísticas quedó marcada).
    page.goto(f"{BASE}/estadisticas", wait_until="load")
    page.wait_for_timeout(1000)
    if page.get_by_text(TIP_LABEL).count() != 0:
        errors.append("tips: apareció en /estadisticas (ya cubierta por el tour)")

    # Replay desde Ajustes: abre de nuevo desde el paso 1 (navega a /).
    page.goto(f"{BASE}/ajustes", wait_until="load")
    page.wait_for_timeout(800)
    page.get_by_role("button", name="Volver a ver el tour").click()
    page.wait_for_selector(TOUR, state="visible", timeout=5000)
    page.wait_for_timeout(600)
    if "1 / 8" not in page.locator(TOUR).inner_text():
        errors.append("replay: no arranca en el paso 1")
    page.get_by_role("button", name="Saltar tour").click()
    page.wait_for_timeout(400)
    if page.locator(TOUR).count() != 0:
        errors.append("replay: Saltar no cerró el tour")


def run_scenario_skip(page, errors):
    page.goto(BASE, wait_until="load")
    page.wait_for_timeout(800)
    if page.evaluate(SEED_PENDING_JS) is not True:
        errors.append("skip: no se pudo sembrar el estado pendiente")
        return
    page.reload(wait_until="load")
    page.wait_for_timeout(1500)
    if page.locator(TOUR).count() == 0:
        errors.append("skip: el tour no arrancó con tourPending sembrado")
        return
    page.get_by_role("button", name="Saltar tour").click()
    page.wait_for_timeout(500)
    if page.locator(TOUR).count() != 0:
        errors.append("skip: Saltar no cerró el tour")
    meta = f101_meta(page)
    if meta.get("tourDone") is not True:
        errors.append("skip: tourDone no quedó en true")
    # Saltar no marca las secciones que el tour habría cubierto; la sección de
    # aterrizaje (inicio) sí muestra su tip natural al quedar como primera entrada.
    seen = meta.get("sectionTipsSeen") or {}
    for section in ("rutinas", "estadisticas", "logros", "mas"):
        if seen.get(section):
            errors.append(f"skip: saltar el tour no debe marcar la sección {section}")
    page.reload(wait_until="load")
    page.wait_for_timeout(1500)
    if page.locator(TOUR).count() != 0:
        errors.append("skip: volvió a abrirse tras saltar y recargar")
    # Tras saltar, el tip de una sección sí aparece en la primera visita.
    page.goto(f"{BASE}/rutinas", wait_until="load")
    page.wait_for_timeout(1000)
    if page.get_by_text(TIP_LABEL).count() == 0:
        errors.append("skip: /rutinas no mostró su tip tras saltar el tour")


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Escenario A — perfil limpio: wizard → tour → tips → replay.
        page_a = browser.new_page(viewport={"width": 375, "height": 812})
        console_errors_a = []
        page_a.on(
            "console",
            lambda m: console_errors_a.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page_a.on("pageerror", lambda e: console_errors_a.append(f"pageerror: {e}"))
        try:
            page_a.goto(BASE, wait_until="load")
            page_a.wait_for_timeout(1200)
            run_scenario_full_tour(page_a, errors)
        except Exception as e:  # noqa: BLE001
            errors.append(f"[escenario A] {e}")
        finally:
            errors.extend(console_errors_a)
            page_a.close()

        # Escenario B — contexto nuevo: gate con flags sembrados y salto sin marcar.
        context_b = browser.new_context()
        page_b = context_b.new_page()
        console_errors_b = []
        page_b.on(
            "console",
            lambda m: console_errors_b.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page_b.on("pageerror", lambda e: console_errors_b.append(f"pageerror: {e}"))
        try:
            run_scenario_skip(page_b, errors)
        except Exception as e:  # noqa: BLE001
            errors.append(f"[escenario B] {e}")
        finally:
            errors.extend(console_errors_b)
            page_b.close()
            context_b.close()

        browser.close()

    if errors:
        print("FALLO:")
        for e in errors:
            print(" -", e)
        return 1
    print("OK: F101 tour guiado completo (arranque, recorrido, replay, tips y skip)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
