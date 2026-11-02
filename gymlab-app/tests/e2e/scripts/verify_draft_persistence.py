"""Verificación nativa F134/T2: el borrador de rutina sobrevive a salir de la pantalla.

Requiere emulador con la app instalada y abierta + `adb forward tcp:9222 ...`.
Cubre los dos caminos que reportó el usuario: cambiar de apartado y el back físico.
No forma parte de la suite CI (necesita el botón back de Android).
"""
import os
import subprocess

from playwright.sync_api import sync_playwright

CDP = "http://localhost:9222"
ADB = os.path.join(os.environ["LOCALAPPDATA"], "Android", "Sdk", "platform-tools", "adb.exe")
TITULO = "Rutina a medias"

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
    subprocess.run([ADB, "shell", "input", "keyevent", "4"], check=True)


def title_value(page):
    return page.eval_on_selector("#rb-title", "el => el.value")


def open_builder(page):
    # El «+» abre un sheet: hay que elegir «Crear manualmente» para llegar al builder.
    page.wait_for_selector("[data-tour=rutinas-actions]", timeout=10000)
    page.click("[data-tour=rutinas-actions]")
    page.click("text=Crear manualmente")
    page.wait_for_selector("#rb-title", timeout=8000)


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(CDP)
        context = browser.contexts[0]
        page = context.pages[0]
        page.on("pageerror", lambda e: errors.append(str(e)))

        page.goto("https://localhost/", wait_until="domcontentloaded")
        page.wait_for_timeout(1200)
        page.evaluate(SEED_JS)
        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(2500)

        # A) Crear una rutina, salir con el back físico y volver.
        page.goto("https://localhost/rutinas", wait_until="domcontentloaded")
        page.wait_for_timeout(1200)
        open_builder(page)
        page.fill("#rb-title", TITULO)
        page.wait_for_timeout(900)  # deja correr el debounce del storage

        press_back()
        page.wait_for_timeout(900)
        assert page.evaluate("window.location.pathname") == "/rutinas", "el back no salió del builder"

        open_builder(page)
        page.wait_for_timeout(600)
        assert title_value(page) == TITULO, f"el borrador no sobrevivió al back (title='{title_value(page)}')"
        assert page.evaluate("document.body.innerText.includes('Retomamos tu borrador')"), "falta el aviso de restauración"
        print("A OK — back físico: el borrador vuelve con su aviso")

        # B) Cambiar de apartado con la tab bar y volver.
        page.click('nav[data-tour="tabbar"] a[href="/"]')
        page.wait_for_timeout(700)
        page.click('nav[data-tour="tabbar"] a[href="/rutinas"]')
        page.wait_for_timeout(900)
        open_builder(page)
        page.wait_for_timeout(600)
        assert title_value(page) == TITULO, f"el borrador no sobrevivió al cambio de tab (title='{title_value(page)}')"
        print("B OK — cambio de apartado: el borrador sigue ahí")

        # C) Descartar lo limpia de verdad.
        page.click("text=Descartar")
        page.wait_for_timeout(500)
        assert title_value(page) == "", "descartar no vació el borrador"
        page.click('nav[data-tour="tabbar"] a[href="/"]')
        page.wait_for_timeout(700)
        page.click('nav[data-tour="tabbar"] a[href="/rutinas"]')
        page.wait_for_timeout(800)
        open_builder(page)
        page.wait_for_timeout(500)
        assert title_value(page) == "", "el borrador descartado reapareció"
        print("C OK — descartar no deja residuo")

        # D) El planificador recuerda las respuestas del wizard entre visitas.
        page.goto("https://localhost/rutinas/planificador", wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
        page.click("text=Intermedio")
        page.wait_for_timeout(600)
        page.click('nav[data-tour="tabbar"] a[href="/"]')
        page.wait_for_timeout(700)
        page.goto("https://localhost/rutinas/planificador", wait_until="domcontentloaded")
        page.wait_for_timeout(1500)
        selected = page.evaluate(
            """() => [...document.querySelectorAll('button[aria-current="true"]')]
                 .map((b) => b.innerText.trim())"""
        )
        assert any("Intermedio" in text for text in selected), f"el planificador no recuerda el nivel: {selected}"
        print("D OK — planificador: la config sobrevive a salir y volver")

        assert not errors, f"pageerror: {errors}"
        print("OK F134/T2: borrador y config del planificador sobreviven; descartar limpia")
        browser.close()


if __name__ == "__main__":
    main()
