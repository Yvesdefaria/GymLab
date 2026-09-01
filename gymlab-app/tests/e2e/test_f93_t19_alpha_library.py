"""Fase 93 #19: biblioteca alfabética con letra grande y rail A–Z.

Verifica que:
- `/ejercicios` muestra el rail vertical A–Z (índice alfabético).
- La lista está SIEMPRE en orden alfabético (incluido con «Comunes» activo).
- El índice sticky muestra la letra grande de la sección activa y cambia al hacer scroll.
- Saltar con el rail lleva a la sección y actualiza la letra grande.
- Las letras sin ejercicios están deshabilitadas; con ejercicios, habilitadas.
- 0 errores de consola.
"""
import re
import sys
import os
import unicodedata

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

COMMON_COUNT = 34
APP_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def strip_diacritics(s: str) -> str:
    # Misma lógica que src/domain/exerciseIndex.ts: conserva la tilde de la ñ (U+0303).
    out = []
    for ch in unicodedata.normalize("NFD", s):
        if unicodedata.combining(ch) and ch != "\u0303":
            continue
        out.append(ch)
    return unicodedata.normalize("NFC", "".join(out))


def load_names() -> list[str]:
    names = []
    paths = ["src/data/seed/exercises.ts", "src/data/seed/exercisesExtra/index.ts"]
    for rel in paths:
        full = os.path.join(APP_DIR, rel)
        with open(full, encoding="utf-8") as f:
            text = f.read()
        names += re.findall(r"name:\s*['\"]([^'\"]+)['\"]", text)
    return names


def section_letters(names: list[str]) -> set[str]:
    return {strip_diacritics(n.strip())[0].upper() for n in names}


def parse_count(body: str):
    m = re.search(r"(\d+)\s*de\s*(\d+)\s+ejercicios", body)
    return (int(m.group(1)), int(m.group(2))) if m else (None, None)


def main():
    names = load_names()
    present = section_letters(names)
    first_letter = strip_diacritics(sorted(names, key=lambda n: strip_diacritics(n).lower())[0].strip())[0].upper()
    last_present = max(present)

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

            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            # --- Biblioteca alfabética ---
            page.goto(f"{BASE}/ejercicios", wait_until="networkidle")
            page.wait_for_timeout(1200)

            # Rail A–Z presente (es un <div role="navigation">, no un <nav>).
            rail = page.locator('[role="navigation"][aria-label="Índice alfabético"]')
            if rail.count() == 0:
                errors.append("Rail A–Z no visible en /ejercicios")

            body = page.inner_text("body")
            count, total = parse_count(body)
            if not (total and count == total and total > 100):
                errors.append(f"Subtítulo inicial inesperado (count={count}, total={total})")

            # Letra grande del índice sticky = primera sección visible.
            sticky = page.locator("div.sticky span[aria-hidden]")
            if sticky.count() == 0 or sticky.first.inner_text().strip() != first_letter:
                errors.append(
                    f"Letra grande inicial inesperada (sticky={sticky.first.inner_text().strip() if sticky.count() else '?'}, esperada={first_letter})"
                )

            # Letras del rail: presentes habilitadas, ausentes deshabilitadas.
            if "S" in present:
                s_btn = page.locator('[role="navigation"][aria-label="Índice alfabético"] button[aria-label="Ir a la letra S"]')
                if s_btn.count() == 0 or not s_btn.is_enabled():
                    errors.append("Letra «S» (presente) debería estar habilitada en el rail")
            if "X" not in present:
                x_btn = page.locator('[role="navigation"][aria-label="Índice alfabético"] button[aria-label="Ir a la letra X"]')
                if x_btn.count() == 0 or not x_btn.is_disabled():
                    errors.append("Letra «X» (ausente) debería estar deshabilitada en el rail")

            # Saltar con el rail a una letra presente: scroll y letra grande actualizada.
            s_btn = page.locator('[role="navigation"][aria-label="Índice alfabético"] button[aria-label="Ir a la letra S"]')
            if s_btn.count() > 0:
                page.evaluate("window.scrollTo(0, 0)")
                page.wait_for_timeout(300)
                s_btn.first.click()
                page.wait_for_timeout(600)
                y = page.evaluate("window.scrollY")
                sticky_now = page.locator("div.sticky span[aria-hidden]").first.inner_text().strip()
                if y <= 0:
                    errors.append("El salto del rail no produjo scroll")
                if sticky_now != "S":
                    errors.append(f"Tras saltar a «S» la letra grande debería ser S, vi {sticky_now}")

            # Scroll al final: la letra grande es la última sección presente.
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(700)
            sticky_end = page.locator("div.sticky span[aria-hidden]").first.inner_text().strip()
            if sticky_end != last_present:
                errors.append(f"Al final la letra grande debería ser {last_present}, vi {sticky_end}")

            # Con «Comunes» activo sigue alfabético: primera fila = aperturas (A).
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(400)
            comunes = page.locator("button", has_text="Comunes")
            if comunes.count() > 0:
                comunes.first.click()
                page.wait_for_timeout(600)
                body = page.inner_text("body")
                c, t2 = parse_count(body)
                if c != COMMON_COUNT:
                    errors.append(f"«Comunes» debía mostrar {COMMON_COUNT}, vi {c}")

                primera = page.locator("a[href^='/ejercicios/']").first.get_attribute("href") or ""
                if "aperturas-con-mancuernas" not in primera:
                    errors.append(f"Con «Comunes» la primera fila no es alfabéticamente la apertura (href={primera})")

                if page.locator('[role="navigation"][aria-label="Índice alfabético"]').count() == 0:
                    errors.append("El rail debería seguir visible con «Comunes» activo")

                sticky_comunes = page.locator("div.sticky span[aria-hidden]").first.inner_text().strip()
                if sticky_comunes != "A":
                    errors.append(f"Con «Comunes» la letra grande debería ser A, vi {sticky_comunes}")

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
