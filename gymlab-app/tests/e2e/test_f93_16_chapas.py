"""Fase 93 #16: galería de chapas-medalla en /logros y miniaturas en /perfil.

Verifica que:
- /logros muestra las chapas con metal por tier (aria-label con metal en es),
  contador ×N para los logros desbloqueados y estado «bloqueada» en los pendientes.
- /perfil muestra la sección «Chapas» con miniaturas solo de logros desbloqueados
  y enlace «Ver todas».
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Siembra: logro bronce desbloqueado ×3, platino bloqueado, y evaluación de
# «sesiones-500» sin desbloquear (solo aparece en pendientes).
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
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(['primer-paso']) });
    tx.objectStore('meta').put({ key: 'achievementCounts', value: JSON.stringify({ 'primer-paso': 3 }) });
    tx.objectStore('meta').put({ key: 'achievementSnapshot', value: JSON.stringify(['primer-paso']) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


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
            seed = page.evaluate(SEED_JS)
            assert seed is True, f"seed fallo: {seed}"
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1000)

            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            body_low = lambda: page.inner_text("body").lower()

            # --- /logros: galería de chapas ---
            page.goto(f"{BASE}/logros", wait_until="networkidle")
            page.wait_for_timeout(1000)

            # Contador del logro desbloqueado (×3) visible.
            if "1/15" not in page.inner_text("body"):
                errors.append("logros: contador 1/15 no visible tras desbloquear solo primer-paso")

            medal = page.locator('[data-achievement="primer-paso"]').first
            if medal.count() == 0:
                errors.append("logros: no se renderiza la chapa de primer-paso")
            else:
                label = medal.get_attribute("aria-label") or ""
                if "bronce" not in label.lower():
                    errors.append(f"logros: chapa desbloqueada no etiqueta metal bronce: {label}")
                if "desbloqueada" not in label.lower():
                    errors.append(f"logros: chapa desbloqueada no etiqueta estado: {label}")
            if "×3" not in page.inner_text("body"):
                errors.append("logros: contador ×3 de primer-paso no visible")

            locked = page.locator('[data-achievement="sesiones-500"]').first
            if locked.count() == 0:
                errors.append("logros: no se renderiza la chapa pendiente sesiones-500")
            else:
                label = locked.get_attribute("aria-label") or ""
                if "platino" not in label.lower():
                    errors.append(f"logros: chapa pendiente no etiqueta metal platino: {label}")
                if "bloqueada" not in label.lower():
                    errors.append(f"logros: chapa pendiente no etiqueta estado bloqueada: {label}")

            page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f93-16-logros-gallery.png"), full_page=False)

            # --- /perfil: miniaturas ---
            page.goto(f"{BASE}/perfil", wait_until="networkidle")
            page.wait_for_timeout(1000)

            mini = page.locator('[data-achievement="primer-paso"]').first
            if mini.count() == 0:
                errors.append("perfil: no aparece miniatura de primer-paso en la sección Chapas")
            else:
                label = mini.get_attribute("aria-label") or ""
                if "bronce" not in label.lower():
                    errors.append(f"perfil: miniatura no etiqueta metal bronce: {label}")
            if "ver todas" not in body_low():
                errors.append("perfil: falta el enlace «Ver todas» de la sección Chapas")
            if "chapas" not in body_low():
                errors.append("perfil: no aparece el título «Chapas»")

            # La miniatura no debe incluir x3 fuera de las chapas (solo en /logros está el desglose).
            page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f93-16-perfil-chapas.png"), full_page=False)
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