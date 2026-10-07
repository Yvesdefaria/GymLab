"""F120/W6 (advisory F103/T8-R3): failure path local de los tabs lazy de /estadisticas.

Un chunk que no resuelve (p. ej. primera visita offline) no debe depender del
boundary ancestro del router: el tab muestra su propio estado de error con
reintento y el resto de la página sigue viva. El reintento recarga a propósito:
Chromium cachea el fallo de fetch del módulo, así que un import() nuevo con la
misma URL no reintenta la red (verificado: 0 requests nuevos sin recarga).

IMPORTANTE — modo de ejecución: en producción, el primer fallo del chunk dispara
`vite:preloadError` (src/main.tsx) y la app recarga una vez; el estado LOCAL
aparece recién con el segundo fallo. Por eso corre contra el bundle de producción:

    npm run build
    python tests/e2e/scripts/with_server.py tests/e2e/test_f120w6_lazy_tab.py --port 5187 --mode preview

Escenarios:
1) Con el chunk del tab abortado, el error local aparece DENTRO del panel
   (el TabNav y la página siguen montados; nada de boundary ancestro).
2) Al detener el aborto y tocar «Reintentar», la recarga recupera el tab.
3) Sin pageerrors reales (el ruido del fallo simulado se filtra).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "4173")
BASE = f"http://localhost:{PORT}"

META_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.objectStore('meta').put({ key: 'tourDone', value: 'true' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
  return true;
}"""


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Con el SW activo el chunk se sirve del precache y el aborto nunca ocurre.
        context = browser.new_context(
            viewport={"width": 390, "height": 844}, service_workers="block"
        )
        page = context.new_page()
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        state = {"abort": True}
        aborted = {"count": 0}

        def handle_route(route):
            if state["abort"]:
                aborted["count"] += 1
                route.abort()
            else:
                route.continue_()

        try:
            page.goto(BASE, wait_until="networkidle")
            assert page.evaluate(META_JS) is True, "no se pudo marcar el onboarding"

            # Corta el chunk del tab Entreno mientras esté activo el aborto.
            page.route("**/EntrenoTab-*.js", handle_route)
            page.goto(f"{BASE}/estadisticas", wait_until="load")

            # 1) Error LOCAL dentro del panel (con el Nav y el header vivos).
            try:
                page.get_by_text("No se pudo cargar esta sección").wait_for(timeout=15000)
            except Exception:
                errors.append("el error local del tab no apareció")
            if aborted["count"] == 0:
                errors.append("el chunk nunca se pidió: el fallo no se llegó a simular")
            else:
                print(f"OK: chunk abortado {aborted['count']} vez/veces (fallo simulado)")
            if page.get_by_role("tab", name="Cuerpo").count() == 0:
                errors.append("el TabNav desapareció: el fallo tumbó la página")
            else:
                print("OK: el error quedó contenido en el panel (TabNav vivo)")

            # 2) Reintento: se deja de abortar y el botón recarga para recuperar.
            state["abort"] = False
            page.get_by_role("button", name="Reintentar").click()
            try:
                page.get_by_text("Todavía no hay datos que mostrar").wait_for(timeout=15000)
                print("OK: el reintento recuperó el tab (chunk servido tras la recarga)")
            except Exception:
                errors.append("el tab no se recuperó tras Reintentar")

            root = page.evaluate(
                "() => { const r = document.getElementById('root'); return r ? r.children.length : -1 }"
            )
            if root <= 0:
                errors.append(f"la página quedó desmontada (root={root})")

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            # El fallo simulado deja ruido de red esperado; solo pageerrors reales
            # y console.errors ajenos al aborto son fallo.
            simulated = "Failed to fetch dynamically imported module"
            noise = ("Failed to load resource", "net::ERR_FAILED", "net::ERR_ABORTED")
            real_errors = [
                e
                for e in console_errors
                if e.startswith("pageerror:")
                or (simulated not in e and not any(n in e for n in noise))
            ]
            if real_errors:
                errors.extend(real_errors)
            page.close()
            context.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("ALL OK")


if __name__ == "__main__":
    main()
