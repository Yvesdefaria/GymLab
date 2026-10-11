"""Fase 93 #27: telemetría anónima de uso (toggle de consentimiento).

Verifica en /ajustes que la sección «Datos de uso anónimos»:
- Muestra la sección con su switch (role="switch", aria-checked=true por defecto).
- Al pulsarlo, el switch pasa a aria-checked=false (desactiva el envío).
- Al pulsarlo de nuevo, vuelve a true (restaura el estado persistido).
- /privacidad: la sección #analitica menciona Sentry y PostHog y el texto de
  desactivación desde Ajustes.
- Onboarding (si está presente): muestra el aviso de datos de uso anónimos.
- 0 errores de consola.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

ACHIEVEMENT_MODAL = '[role="dialog"][aria-labelledby="achievement-modal-title"]'


def dismiss_achievements(page, timeout_ms=6000):
    """Avanza la cola del modal de logros (z-[130]) que pueda interceptar clics (patrón f98/f99)."""
    deadline = timeout_ms
    while deadline > 0:
        dialog = page.locator(ACHIEVEMENT_MODAL)
        if dialog.count() == 0:
            return
        btn = dialog.first.locator("button").last
        if btn.count() > 0:
            btn.click(timeout=2000)
        else:
            page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        deadline -= 300


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(1500)

            # Onboarding: el aviso de telemetría vive en el paso Resumen (último).
            # Recorre el wizard mínimo (chip por paso) y verifica que el aviso
            # aparece en el Resumen.
            if page.locator("button", has_text="Ya entreno aquí").count() > 0:
                try:
                    page.locator("button", has_text="Continuar").wait_for(timeout=4000)
                    # Paso 1 — Idioma
                    page.locator("button", has_text="Español").first.click()
                    page.locator("button", has_text="Continuar").click()
                    page.wait_for_timeout(300)
                    # Paso 2 — Objetivo (+nivel)
                    page.locator("button", has_text="General").first.click()
                    page.locator("button", has_text="Principiante").first.click()
                    page.locator("button", has_text="Continuar").click()
                    page.wait_for_timeout(300)
                    # Paso 3 — Semana (días + lugar de entreno). «Continuar» exige días
                    # elegidos (canNext: daysPerWeek !== null); el chip «4» es único de días.
                    page.locator('button:text-is("4")').first.click()
                    page.locator("button", has_text="Gimnasio").first.click()
                    page.locator("button", has_text="Continuar").click()
                    page.wait_for_timeout(300)
                    # Paso 4 — Perfil (sexo, fecha, altura, peso)
                    page.locator("button", has_text="Hombre").first.click()
                    page.locator('input[type="date"]').fill("1990-01-01")
                    # F102: altura/peso migraron a DecimalInput (text + inputmode=decimal).
                    nums = page.locator('input[inputmode="decimal"]')
                    if nums.count() >= 2:
                        nums.nth(0).fill("180")
                        nums.nth(1).fill("80")
                    page.locator("button", has_text="Continuar").click()
                    page.wait_for_timeout(400)
                    # Paso 5 — Resumen: scroll hasta el aviso legal
                    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    page.wait_for_timeout(300)
                    aviso = page.inner_text("body").lower()
                    if "datos de uso anónimos" not in aviso and "anonymous usage" not in aviso:
                        errors.append("El aviso de datos de uso anónimos no aparece en el Resumen del onboarding")
                    # Cerrar el wizard sin ofrecer tour: volver al paso 1 y usar «Ya entreno
                    # aquí» (finish sin offerTour). El wizard está montado app-wide: sin
                    # cerrarlo, el diálogo bloquea los clicks de las rutas siguientes.
                    for _ in range(4):
                        page.locator("button", has_text="Atrás").first.click()
                        page.wait_for_timeout(300)
                    page.locator("button", has_text="Ya entreno aquí").first.click()
                    page.locator('div[role="dialog"][aria-modal="true"]').wait_for(state="detached", timeout=8000)
                except Exception as ob_err:
                    if page.locator("button", has_text="Continuar").count() == 0:
                        errors.append(f"Onboarding: no se pudo recorrer el wizard: {ob_err}")
            else:
                # Sin onboarding (perfil ya creado): solo comprobar que no se verifica aviso.
                pass

            # --- Ajustes: sección y switch ---
            page.goto(f"{BASE}/ajustes", wait_until="networkidle")
            page.wait_for_timeout(1200)
            # El wizard escribió perfil/peso: pueden saltar logros («Autoconocimiento») que
            # tapan la página con el modal z-[130] antes de los clicks de abajo.
            dismiss_achievements(page)

            section = page.locator("section", has_text="Datos de uso anónimos")
            if section.count() == 0:
                errors.append("Sección «Datos de uso anónimos» no visible en /ajustes")
            else:
                switch = section.locator('button[role="switch"]')
                if switch.count() == 0:
                    errors.append("Falta el switch role=switch en la sección de telemetría")
                else:
                    checked = switch.get_attribute("aria-checked")
                    if checked != "true":
                        errors.append(f"El consentimiento de telemetría debería estar ON por defecto (aria-checked={checked})")

                    # Apagar → aria-checked=false
                    switch.click()
                    page.wait_for_timeout(400)
                    if switch.get_attribute("aria-checked") != "false":
                        errors.append("Al desactivar, el switch no pasó a aria-checked=false")

                    # Volver a encender → aria-checked=true (persistencia de sesión)
                    switch.click()
                    page.wait_for_timeout(400)
                    if switch.get_attribute("aria-checked") != "true":
                        errors.append("Al reactivar, el switch no volvió a aria-checked=true")

            # --- /privacidad: sección analitica con Sentry/PostHog ---
            page.goto(f"{BASE}/privacidad", wait_until="networkidle")
            page.wait_for_timeout(1200)
            analitica = page.locator("section#analitica")
            if analitica.count() == 0:
                errors.append("/privacidad: falta la sección #analitica")
            else:
                text = analitica.inner_text()
                if "Sentry" not in text or "PostHog" not in text:
                    errors.append("/privacidad: la sección #analitica no menciona Sentry y PostHog")
                if "Ajustes" not in text or "desactivar" not in text.lower():
                    errors.append("/privacidad: falta el texto de desactivación desde Ajustes en #analitica")

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            page.close()
            context.close()
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