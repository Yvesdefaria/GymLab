"""Fase 93 #27: telemetría pseudónima de uso (toggle de consentimiento).

Verifica en /ajustes que la sección «Datos de uso pseudónimos»:
- Muestra la sección con su switch (role="switch", aria-checked=false por defecto).
- Al pulsarlo, el switch pasa a aria-checked=true (activa el envío).
- Al pulsarlo de nuevo, vuelve a false (restaura el estado persistido).
- /privacidad: la sección #analitica menciona Sentry y PostHog y el texto de
  desactivación desde Ajustes.
- Onboarding (si está presente): muestra el aviso de datos de uso pseudónimos.
- 0 errores de consola.
"""
import re
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

ACHIEVEMENT_MODAL = '[role="dialog"][aria-labelledby="achievement-modal-title"]'
WIZARD = 'div[role="dialog"][aria-modal="true"]'


def wizard_step(page):
    """Índice 0-based del paso activo del wizard (li[aria-current="step"]); None si no está montado."""
    return page.evaluate("""() => {
        const el = document.querySelector('div[role="dialog"][aria-modal="true"] li[aria-current="step"]');
        return el ? Array.prototype.indexOf.call(el.parentElement.children, el) : null;
    }""")


def dismiss_achievements(page, timeout_ms=6000):
    """Avanza la cola del modal de logros (z-[130]) que pueda interceptar clics (patrón f98/f99).
    Sonda única: la presencia se evalúa UNA vez con una espera sincronizada (`wait_for` visible)
    y el resultado —¿quedó la cola cerrada?— se devuelve para reusarlo en los asserts.
    `.first` en la sonda: con dos diálogos montados a la vez el locator no es único y
    `wait_for` violaría strict mode (raise distinto de PlaywrightTimeoutError)."""
    dialog = page.locator(ACHIEVEMENT_MODAL)
    try:
        dialog.first.wait_for(state="visible", timeout=timeout_ms)
    except PlaywrightTimeoutError:
        return True  # sin cola de logros: nada que cerrar
    deadline = timeout_ms
    while deadline > 0:
        if dialog.count() == 0:
            return True
        btn = dialog.first.locator("button").last
        if btn.count() > 0:
            btn.click(timeout=2000)
        else:
            page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        deadline -= 300
    return dialog.count() == 0


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
            if page.locator("button", has_text=re.compile("Ya entreno aquí|I already train here")).count() > 0:
                try:
                    wizard = page.locator(WIZARD)
                    page.locator("button", has_text=re.compile("Continuar|Continue")).wait_for(timeout=4000)
                    # Paso 1 — Idioma
                    page.locator("button", has_text=re.compile("Español|Spanish")).first.click()
                    page.locator("button", has_text=re.compile("Continuar|Continue")).click()
                    page.wait_for_timeout(300)
                    # Paso 2 — Objetivo (+nivel)
                    page.locator("button", has_text="General").first.click()
                    page.locator("button", has_text="Principiante").first.click()
                    page.locator("button", has_text=re.compile("Continuar|Continue")).click()
                    page.wait_for_timeout(300)
                    # Paso 3 — Semana: días. «Continuar» exige días elegidos.
                    wizard.locator('button', has_text=re.compile(r"^4 días")).first.click()
                    page.locator("button", has_text=re.compile("Continuar|Continue")).click()
                    page.wait_for_timeout(300)
                    # Paso 4 — Sesión: equipo; duración/cardio quedan con sus defaults.
                    page.locator("button", has_text="Gimnasio").first.click()
                    page.locator("button", has_text=re.compile("Continuar|Continue")).click()
                    page.wait_for_timeout(300)
                    # Paso 5 — Identidad: sexo y nombre.
                    page.locator("button", has_text="Hombre").first.click()
                    wizard.get_by_label("Nombre", exact=True).fill("Ana")
                    page.locator("button", has_text=re.compile("Continuar|Continue")).click()
                    page.wait_for_timeout(300)
                    # Paso 6 — Medidas: fecha, altura y peso.
                    page.locator('input[type="date"]').fill("1990-01-01")
                    # F102/R3-004: altura y peso por su etiqueta accesible.
                    wizard.get_by_label("Altura en centímetros").fill("180")
                    wizard.get_by_label("Peso en kg").fill("80")
                    page.locator("button", has_text=re.compile("Continuar|Continue")).click()
                    page.wait_for_timeout(400)
                    # Paso 7 — Resumen: scroll hasta el aviso legal.
                    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    page.wait_for_timeout(300)
                    aviso = page.inner_text("body").lower()
                    if "datos de uso pseudónimos" not in aviso and "pseudonymous usage" not in aviso:
                        errors.append("El aviso de datos de uso pseudónimos no aparece en el Resumen del onboarding")
                    # Cerrar desde el resumen; si arranca el tour, cerrarlo con Escape.
                    finish = wizard.locator("button", has_text="Ya entreno aquí").last
                    finish.click(timeout=5000)
                    page.locator('[data-testid="onboarding-scroller"]').wait_for(
                        state="detached", timeout=8000
                    )
                    page.wait_for_timeout(500)
                    for _ in range(3):
                        if page.locator("[role='dialog']").count() == 0:
                            break
                        page.keyboard.press("Escape")
                        page.wait_for_timeout(200)
                except Exception as ob_err:
                    # Cualquier fallo del walk se reporta: el wizard abierto bloquea las
                    # rutas siguientes y descartarlo en silencio solo confunde el diagnóstico.
                    errors.append(f"Onboarding: no se pudo recorrer el wizard: {ob_err}")
            else:
                # Sin onboarding (perfil ya creado): solo comprobar que no se verifica aviso.
                pass

            # --- Ajustes: sección y switch ---
            page.goto(f"{BASE}/ajustes", wait_until="networkidle")
            page.wait_for_timeout(1200)
            # El wizard escribió perfil/peso: pueden saltar logros («Autoconocimiento») que
            # tapan la página con el modal z-[130] antes de los clicks de abajo. El
            # resultado de la sonda única del helper se reusa en el assert: si la cola
            # quedó abierta, los clicks siguientes podrían quedar interceptados.
            if not dismiss_achievements(page):
                errors.append("El modal de logros quedó abierto en /ajustes (puede interceptar los clicks)")

            section = page.locator("section", has_text="Datos de uso pseudónimos")
            if section.count() == 0:
                errors.append("Sección «Datos de uso pseudónimos» no visible en /ajustes")
            else:
                switch = section.locator('button[role="switch"]')
                if switch.count() == 0:
                    errors.append("Falta el switch role=switch en la sección de telemetría")
                else:
                    checked = switch.get_attribute("aria-checked")
                    if checked != "false":
                        errors.append(f"El consentimiento de telemetría debería estar OFF por defecto (aria-checked={checked})")

                    # Encender → aria-checked=true
                    switch.click()
                    page.wait_for_timeout(400)
                    if switch.get_attribute("aria-checked") != "true":
                        errors.append("Al activar, el switch no pasó a aria-checked=true")

                    # Volver a apagar → aria-checked=false (persistencia de sesión)
                    switch.click()
                    page.wait_for_timeout(400)
                    if switch.get_attribute("aria-checked") != "false":
                        errors.append("Al desactivar, el switch no volvió a aria-checked=false")

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