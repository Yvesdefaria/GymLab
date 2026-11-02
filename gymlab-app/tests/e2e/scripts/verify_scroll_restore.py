"""Verificación nativa F134/T4: volver de un detalle restaura la posición de scroll.

Requiere emulador con la app instalada y abierta + `adb forward tcp:9222 ...`.
No forma parte de la suite CI: mide el scroll real del WebView.
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


def scroll_to(page, y):
    page.evaluate(f"window.scrollTo(0, {y})")
    page.wait_for_timeout(400)  # deja correr el rAF que guarda la posición


def scroll_y(page):
    return page.evaluate("Math.round(window.scrollY)")


def click_first_link(page, prefix):
    # Click por JS: no arrastra la vista como el click de Playwright.
    page.evaluate(
        """(prefix) => {
          const link = document.querySelector('a[href^="' + prefix + '"]')
          if (!link) throw new Error('sin enlace ' + prefix)
          link.click()
        }""",
        prefix,
    )


def check(page, name, route, prefix, target):
    page.goto(f"https://localhost{route}", wait_until="domcontentloaded")
    page.wait_for_timeout(1800)
    scroll_to(page, target)
    assert abs(scroll_y(page) - target) < 80, f"{name}: no se pudo scrollear ({scroll_y(page)})"

    click_first_link(page, prefix)
    page.wait_for_timeout(1200)
    assert page.evaluate("window.location.pathname").startswith(prefix), f"{name}: no abrió el detalle"

    press_back()
    page.wait_for_timeout(1500)
    restored = scroll_y(page)
    assert abs(restored - target) < 120, f"{name}: scroll restaurado en {restored}, esperaba ~{target}"
    print(f"{name} OK — vuelve a y={restored} (objetivo {target})")


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

        check(page, "A catálogo de ejercicios", "/ejercicios", "/ejercicios/", 1400)
        check(page, "B catálogo de rutinas", "/rutinas", "/rutinas/", 900)

        assert not errors, f"pageerror: {errors}"
        print("OK F134/T4: la lista vuelve a la misma altura tras abrir un detalle")
        browser.close()


if __name__ == "__main__":
    main()
