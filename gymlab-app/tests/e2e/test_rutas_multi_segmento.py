"""Regresión: las rutas de DOS segmentos deben arrancar con carga DIRECTA (no vía SPA).

Contexto del bug: `vite.config.ts` usaba `base: './'` (rutas RELATIVAS). El `index.html`
generado referenciaba `./assets/index-*.js`, y en una ruta de dos segmentos como
`/entrenamiento/active` el navegador resuelve ese relativo contra el directorio de la URL
-> `/entrenamiento/assets/index-*.js` -> 404 del ENTRY CHUNK. Sin el entry, React nunca
monta: `document.getElementById('root').children.length === 0` (PANTALLA NEGRA) y ~22
errores de consola. En rutas de UN segmento (`/suplementos`) el relativo resolvía bien, y
por eso el bug pasó desapercibido. Afectaba 17 rutas multi-segmento. El fix fue `base: '/'`
(ABSOLUTA).

Por qué la suite existente no lo detectaba: los tests navegan con CLICKS dentro de la SPA
(el router client-side nunca re-resuelve el entry) o usan rutas de un solo segmento.

IMPORTANTE — modo de ejecución: en el dev server Vite sirve los módulos desde el código
fuente (`/src/main.tsx`) y NO usa el `index.html` construido, así que el bug NO se
reproduce. Hay que correrlo contra el bundle de producción:

    npm run build
    python tests/e2e/scripts/with_server.py tests/e2e/test_rutas_multi_segmento.py --mode preview

El harness expone el puerto como `E2E_PORT` (default 4173 en preview).

Escenarios (se navega con `page.goto(BASE + ruta)` DIRECTO, carga completa del documento):
1) Rutas multi-segmento: entry montado (root children > 0), body con texto y sin pageerror.
2) Una ruta de un segmento (`/`) como CONTROL: si esa falla, el problema no es el base.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "4173")
BASE = f"http://localhost:{PORT}"

# Marca el onboarding como hecho para que no se superponga el modal (usa IndexedDB,
# store `meta`, key `onboardingDone`). Mismo approach que test_preload_recovery.py.
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

# Rutas de DOS segmentos: son las que rompía `base: './'`. Se incluye `/` como control
# (una sola "parte" en la ruta), donde el relativo sí resolvía.
ROUTES = [
    ("/", "control: ruta de un segmento"),
    ("/entrenamiento/active", "sesión activa"),
    ("/calculadoras/imc", "calculadora IMC"),
    ("/calculadoras/agua", "calculadora de agua"),
    ("/rutinas/nueva", "crear rutina"),
    ("/ejercicios/sentadilla", "detalle de ejercicio"),
]


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()

        # Los `pageerror` (excepciones NO capturadas) son el síntoma directo de la pantalla
        # negra; los acumulamos con su ruta para reportarlos por separado.
        page_errors = []
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        try:
            # Arranca la app una vez para que Dexie cree el schema y luego marca el onboarding.
            page.goto(BASE, wait_until="networkidle")
            assert page.evaluate(META_JS) is True, "no se pudo marcar el onboarding"
            print("OK: onboarding marcado como hecho (meta/onboardingDone)")

            for route, label in ROUTES:
                seen_before = len(page_errors)

                # CLAVE del test: carga DIRECTA del documento en la ruta completa, no un
                # click dentro de la SPA. Es lo que hacía que el entry resolviera mal.
                page.goto(BASE + route, wait_until="networkidle")
                # Margen para que React monte el árbol lazy de la ruta.
                page.wait_for_timeout(1500)

                root_children = page.evaluate(
                    "() => { const r = document.getElementById('root'); return r ? r.children.length : -1 }"
                )
                body = page.inner_text("body")

                if root_children <= 0:
                    errors.append(
                        f"{route}: el árbol de React NO montó (root children={root_children}) "
                        f"-> pantalla negra [{label}]"
                    )
                else:
                    print(f"OK: {route} monta el árbol de React (root children={root_children}) [{label}]")

                if len(body.strip()) == 0:
                    errors.append(f"{route}: el body quedó vacío (pantalla negra) [{label}]")
                else:
                    print(f"OK: {route} renderiza texto ({len(body)} chars) [{label}]")

                new_errors = page_errors[seen_before:]
                if new_errors:
                    errors.append(f"{route}: pageerror(s) durante la carga: {new_errors} [{label}]")
                else:
                    print(f"OK: {route} sin pageerror [{label}]")

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
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
