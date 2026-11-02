"""Verificación nativa F134/T1: el back físico cierra el overlay y no abandona la pantalla.

Requiere:
  - emulador con la app instalada y abierta
  - `adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>`

No forma parte de la suite CI: es la verificación manual del comportamiento nativo
(el e2e web no dispara el botón back de Android).
"""
import os
import subprocess

from playwright.sync_api import sync_playwright

CDP = "http://localhost:9222"
ADB = os.path.join(os.environ["LOCALAPPDATA"], "Android", "Sdk", "platform-tools", "adb.exe")
KEYCODE_BACK = "4"

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


def press_back():
    subprocess.run([ADB, "shell", "input", "keyevent", KEYCODE_BACK], check=True)


def dialogs(page):
    return page.evaluate("document.querySelectorAll('[role=\"dialog\"],[role=\"alertdialog\"]').length")


def path(page):
    return page.evaluate("window.location.pathname")


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

        # A) /rutinas: el sheet de filtros (BottomSheet) se cierra con back y no navega.
        page.goto("https://localhost/rutinas", wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
        page.click('button[aria-label="Filtros"]')
        page.wait_for_timeout(400)
        assert dialogs(page) == 1, f"el sheet de filtros no abrió (dialogs={dialogs(page)})"
        press_back()
        page.wait_for_timeout(800)
        assert dialogs(page) == 0, "el back no cerró el sheet de filtros"
        assert path(page) == "/rutinas", f"el back abandonó la pantalla: {path(page)}"
        print("A OK — /rutinas: back cierra filtros y se queda en la pantalla")

        # B) /ejercicios: el sheet de destino del alta (custom) también respeta el back.
        page.goto("https://localhost/ejercicios", wait_until="domcontentloaded")
        page.wait_for_timeout(1800)
        page.evaluate(
            """() => {
              const btn = [...document.querySelectorAll('button')]
                .find((b) => (b.getAttribute('aria-label') || '').toLowerCase().startsWith('agregar'));
              if (!btn) throw new Error('no se encontró el botón Agregar');
              btn.click();
            }"""
        )
        page.wait_for_timeout(900)
        assert dialogs(page) == 1, f"el sheet de destino no abrió (dialogs={dialogs(page)})"
        press_back()
        page.wait_for_timeout(800)
        assert dialogs(page) == 0, "el back no cerró el sheet de destino"
        assert path(page) == "/ejercicios", f"el back abandonó la pantalla: {path(page)}"
        print("B OK — /ejercicios: back cierra el alta y se queda en la pantalla")

        # C) Sin overlay, el back conserva el comportamiento nativo (retrocede).
        page.goto("https://localhost/rutinas", wait_until="domcontentloaded")
        page.wait_for_timeout(1200)
        press_back()
        page.wait_for_timeout(900)
        assert path(page) != "/rutinas", "sin overlay el back no retrocedió"
        print(f"C OK — sin overlay el back navega a {path(page)}")

        assert not errors, f"pageerror: {errors}"
        print("OK F134/T1: back cierra overlays, no abandona la pantalla y conserva la navegación")
        browser.close()


if __name__ == "__main__":
    main()
