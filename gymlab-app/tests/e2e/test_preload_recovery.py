"""Regresión: si un chunk lazy no carga, la app se RECUPERA en vez de quedar en negro.

Contexto: el service worker (PWA) puede quedar sirviendo un index.html VIEJO que apunta a
chunks lazy ya rehasheados. El `import()` dinámico falla con
`Failed to fetch dynamically imported module` y, sin manejarlo, React desmontaba el árbol
completo -> PANTALLA NEGRA (bug reportado en /suplementos y /pasos).

La app lo maneja con el evento `vite:preloadError` (ver src/main.tsx): recarga una vez y,
si vuelve a fallar, el ErrorBoundary muestra un mensaje recuperable.

IMPORTANTE — modo de ejecución: en dev, Vite sirve los módulos desde el código fuente y el
import no pasa por el helper de preload, así que `vite:preloadError` NO se emite. Hay que
correrlo contra el bundle de producción:

    npm run build
    python tests/e2e/scripts/with_server.py tests/e2e/test_preload_recovery.py --mode preview

Escenarios:
1) Al fallar un chunk lazy, la app RECARGA y vuelve a renderizar (no queda en negro).
2) El árbol de React sigue montado y la ruta destino termina visible.
3) No hay recarga en loop: la recuperación ocurre una sola vez.
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
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: '["primera-marca"]' });
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
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        # Contadores de navegacion: distingue "se recupero recargando" de "nunca fallo".
        navigations = {"count": 0}
        page.on("framenavigated", lambda f: navigations.__setitem__("count", navigations["count"] + 1))

        aborted = {"done": False}

        def handle_route(route):
            if not aborted["done"]:
                aborted["done"] = True
                route.abort()
            else:
                route.continue_()

        try:
            page.goto(BASE, wait_until="networkidle")
            assert page.evaluate(META_JS) is True, "no se pudo marcar el onboarding"
            page.goto(f"{BASE}/mas", wait_until="networkidle")
            page.wait_for_timeout(1000)

            # Corta el chunk de StepsPage UNA sola vez: simula el chunk viejo que ya no existe.
            page.route("**/StepsPage-*.js", handle_route)
            navigations["count"] = 0

            # Navegacion client-side (no recarga): el caso real de la app abierta.
            steps_link = page.locator("a[href='/pasos']").first
            if steps_link.count() == 0:
                errors.append("no se encontro el enlace a /pasos en el hub")
            else:
                steps_link.click(timeout=5000)
                page.wait_for_timeout(6000)

                if not aborted["done"]:
                    errors.append(
                        "el chunk nunca se pidio: el test no llego a simular el fallo"
                    )
                else:
                    print("OK: el chunk lazy fue abortado una vez (fallo simulado)")

                if navigations["count"] == 0:
                    errors.append("la app NO recargo: no hubo recuperacion")
                else:
                    print(f"OK: la app recargo para recuperarse ({navigations['count']} navegacion/es)")

                # 3) Sin loop: no debe haber recargado varias veces seguidas.
                if navigations["count"] > 2:
                    errors.append(f"posible loop de recargas: {navigations['count']} navegaciones")

                root = page.evaluate(
                    "() => { const r = document.getElementById('root'); return r ? r.children.length : -1 }"
                )
                body = page.inner_text("body")
                if root <= 0 or len(body.strip()) == 0:
                    errors.append(f"la app quedo en negro tras el fallo (root={root})")
                else:
                    print(f"OK: la app renderiza tras recuperarse (root children={root}, {len(body)} chars)")

                if "Steps" not in body and "Pasos" not in body:
                    errors.append(f"la ruta destino no quedo visible: {body[:120]!r}")
                else:
                    print("OK: la ruta destino (/pasos) quedo visible")

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            # Este test PROVOCA a propósito el fallo de un chunk, así que el ruido asociado es
            # esperado: el navegador loguea el fallo de red y las dos capas de defensa dejan su
            # diagnóstico (el handler de `vite:preloadError` y `[AppErrorBoundary]`).
            # Lo que SÍ es un fallo es un `pageerror` (excepción NO capturada): eso era
            # exactamente la pantalla negra. Y cualquier console.error que NO venga del fallo
            # simulado también es un fallo, para no tapar problemas reales.
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
