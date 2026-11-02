"""Verificación nativa F134/T3: el estado de lista vive en la URL y volver lo conserva.

Requiere emulador con la app instalada y abierta + `adb forward tcp:9222 ...`.
Cubre los tres casos del reporte original que dependen de la ruta: buscar un ejercicio
y volver, filtrar rutinas y volver, y el día elegido de una rutina.
"""
import os
import subprocess

from playwright.sync_api import sync_playwright

CDP = "http://localhost:9222"
ADB = os.path.join(os.environ["LOCALAPPDATA"], "Android", "Sdk", "platform-tools", "adb.exe")

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


def path(page):
    return page.evaluate("window.location.pathname")


def search(page):
    return page.evaluate("window.location.search")


def first_exercise_link(page):
    return page.evaluate(
        """() => {
          const link = document.querySelector('a[href^="/ejercicios/"]');
          return link ? link.getAttribute('href') : null;
        }"""
    )


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

        # A) Buscar un ejercicio, abrir la ficha y volver.
        page.goto("https://localhost/ejercicios", wait_until="domcontentloaded")
        page.wait_for_timeout(1800)
        page.fill('input[aria-label="Buscar ejercicio"]', "press")
        page.wait_for_timeout(900)
        assert "q=press" in search(page), f"la búsqueda no quedó en la URL: {search(page)}"
        href = first_exercise_link(page)
        assert href, "no se encontró ningún ejercicio en el resultado"
        page.click(f'a[href="{href}"]')
        page.wait_for_timeout(1200)
        assert path(page).startswith("/ejercicios/"), f"no se abrió la ficha: {path(page)}"

        press_back()
        page.wait_for_timeout(1200)
        assert path(page) == "/ejercicios", f"el back no volvió al catálogo: {path(page)}"
        value = page.eval_on_selector('input[aria-label="Buscar ejercicio"]', "el => el.value")
        assert value == "press", f"la búsqueda se perdió al volver (value='{value}')"
        print("A OK — buscar ejercicio y volver: la búsqueda sigue")

        # B) Filtrar rutinas, abrir una y volver.
        page.goto("https://localhost/rutinas", wait_until="domcontentloaded")
        page.wait_for_timeout(1600)
        page.click('button[aria-pressed]:has-text("Volumen")')
        page.wait_for_timeout(800)
        assert "objetivo=volumen" in search(page), f"el filtro no quedó en la URL: {search(page)}"
        page.click('a[href^="/rutinas/"]')
        page.wait_for_timeout(1400)
        assert path(page).startswith("/rutinas/"), f"no se abrió la rutina: {path(page)}"

        press_back()
        page.wait_for_timeout(1200)
        assert "objetivo=volumen" in search(page), f"el filtro se perdió al volver: {search(page)}"
        print("B OK — filtrar rutinas y volver: el filtro sigue")

        # C) Elegir un día de la rutina, abrir un ejercicio y volver.
        page.goto("https://localhost/rutinas", wait_until="domcontentloaded")
        page.wait_for_timeout(1400)
        page.click('a[href^="/rutinas/"]')
        page.wait_for_timeout(1600)
        tabs = page.evaluate(
            """() => [...document.querySelectorAll('[role="tab"]')].map((t) => t.textContent.trim())"""
        )
        assert len(tabs) >= 2, f"la rutina no tiene varios días: {tabs}"
        page.locator('[role="tab"]').nth(1).click()
        page.wait_for_timeout(700)
        assert "dia=1" in search(page), f"el día no quedó en la URL: {search(page)}"

        href = first_exercise_link(page)
        assert href, "el día no tiene ejercicios enlazados"
        page.click(f'a[href="{href}"]')
        page.wait_for_timeout(1200)

        press_back()
        page.wait_for_timeout(1300)
        assert "dia=1" in search(page), f"el día se perdió al volver: {search(page)}"
        print("C OK — el día elegido de la rutina sobrevive a ir y volver")

        # D) Deep link con filtros: la pantalla se abre ya filtrada.
        page.goto("https://localhost/ejercicios?q=press&musculo=pecho", wait_until="domcontentloaded")
        page.wait_for_timeout(1800)
        value = page.eval_on_selector('input[aria-label="Buscar ejercicio"]', "el => el.value")
        assert value == "press", f"el deep link no aplicó la búsqueda: '{value}'"
        pressed = page.evaluate(
            """() => [...document.querySelectorAll('[aria-pressed="true"]')]
                 .map((el) => el.textContent.trim())"""
        )
        assert pressed, "el deep link no marcó ningún filtro activo"
        print(f"D OK — deep link: búsqueda aplicada y filtro activo {pressed}")

        assert not errors, f"pageerror: {errors}"
        print("OK F134/T3: búsqueda, filtros y día sobreviven a la navegación y al deep link")
        browser.close()


if __name__ == "__main__":
    main()
