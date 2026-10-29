"""Smoke nativo por CDP (emulador Android).

Requiere:
  - emulador con la app instalada y abierta
  - `adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>`

Comprueba que la app monta, que las rutas multi-segmento no quedan en pantalla
negra y que no hay `pageerror`. No forma parte de la suite CI: es la verificación
manual de release.
"""
from playwright.sync_api import sync_playwright

CDP = "http://localhost:9222"
ROUTES = [
    "/",
    "/calculadoras/imc",
    "/rutinas/nueva",
    "/entrenamiento/active",
    "/perfil/historial",
    "/estadisticas",
    "/ejercicios",
]

SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.objectStore('meta').put({
      key: 'settings',
      value: JSON.stringify({ language: 'es', units: 'kg' }),
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}"""


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(CDP)
        context = browser.contexts[0]
        page = context.pages[0]
        page.on("pageerror", lambda e: errors.append(str(e)))

        page.goto("https://localhost/", wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
        page.evaluate(SEED_JS)
        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(2500)

        for route in ROUTES:
            page.goto(f"https://localhost{route}", wait_until="domcontentloaded")
            page.wait_for_timeout(1200)
            root_children = page.evaluate(
                "document.getElementById('root')?.children.length ?? 0"
            )
            body_text = page.evaluate("document.body.innerText.trim()")
            print(
                f"{route:28} root={root_children} chars={len(body_text)} title={page.title()}"
            )
            assert root_children > 0, f"pantalla negra en {route}"
            assert len(body_text) > 20, f"sin contenido en {route}"
            print(f"   {body_text[:90].replace(chr(10), ' | ')}")

        assert not errors, f"pageerror: {errors}"
        print("OK smoke nativo: 7 rutas, 0 pageerror")
        browser.close()


if __name__ == "__main__":
    main()
