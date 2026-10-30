"""Fase 123: paridad del selector de ejercicios con el catálogo (orden + rail A–Z).

El selector (ExercisePicker) debe ordenar alfabéticamente con encabezados de letra
y rail A–Z, igual que /ejercicios.

Escenarios (viewport 375x812):
  R1. Misma primera fila que el catálogo sin filtros (paridad de orden).
  R2. Rail A–Z presente en el selector; letras presentes habilitadas y ausentes deshabilitadas.
  R3. Saltar con el rail lleva a la sección: scroll > 0, encabezado de letra visible,
      primera fila visible de esa letra y letra activa marcada en el rail.
  R4. Con «Comunes» activo la lista sigue alfabética (primera fila = aperturas).
  R5. El rail incluye la eñe como letra propia (abecedario es).
  R6. Búsqueda sin resultados: sin filas ni rail; al limpiar, la lista se restaura.
  R7. Encogimiento por búsqueda: filas montadas y letras presentes se actualizan sin romper.
  R8. 0 errores de consola.
"""
import datetime
import json
import os
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

SEED_META = """async () => {
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
      value: JSON.stringify({ language: 'es', showSectionTips: false }),
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
}"""

SEARCH = 'input[aria-label="Buscar ejercicio"]'
RAIL = '[role="navigation"][aria-label="Índice alfabético"]'
ROW = 'button[aria-label^="Ver ficha de "]'
ADD = 'button:has-text("Añadir ejercicio")'

# Info del contenedor scrolleable del selector (top + scrollTop), desde la primera fila.
SCROLL_INFO_JS = """() => {
  const btn = document.querySelector('button[aria-label^="Ver ficha de "]');
  let el = btn;
  while (el && el !== document.body) {
    const s = getComputedStyle(el);
    if (s.overflowY === 'auto' || s.overflowY === 'scroll') break;
    el = el.parentElement;
  }
  if (!el || el === document.body) return { top: 0, scrollTop: -1 };
  return { top: el.getBoundingClientRect().top, scrollTop: el.scrollTop };
}"""

RESET_SCROLL_JS = """() => {
  const btn = document.querySelector('button[aria-label^="Ver ficha de "]');
  let el = btn;
  while (el && el !== document.body) {
    const s = getComputedStyle(el);
    if (s.overflowY === 'auto' || s.overflowY === 'scroll') break;
    el = el.parentElement;
  }
  if (el && el !== document.body) el.scrollTop = 0;
}"""


def session_storage():
    """Estado persistido de una sesión activa vacía (el selector vive en la sesión)."""
    return json.dumps({
        "state": {
            "workoutId": None,
            "startedAt": NOW,
            "routineId": None,
            "routineDayId": None,
            "exercises": [],
            "sessionNote": "",
            "restSeconds": 90,
            "restMode": "auto",
            "routineRestSec": None,
            "autoRestSeconds": 90,
            "warmupSeen": True,
            "restEndsAt": None,
        },
        "version": 0,
    })


def boot(page):
    # Primer load en frío: Vite transforma el grafo de seed (reseeder) y puede tardar;
    # después se siembra el idioma es (el default del producto es inglés) y se recarga.
    page.goto(BASE, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(1500)
    page.evaluate(SEED_META)
    page.reload(wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(1000)


def open_picker(page):
    page.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle", timeout=60000)
    page.wait_for_timeout(1200)
    page.locator(ADD).first.click()
    page.wait_for_selector(SEARCH, state="visible", timeout=5000)
    page.wait_for_timeout(500)


def row_name(btn):
    label = btn.get_attribute("aria-label") or ""
    return label.replace("Ver ficha de ", "").strip()


def first_visible_row(page, top):
    """Primera fila (menor Y) cuyo borde superior está a la altura del contenedor o debajo."""
    rows = page.locator(ROW)
    best = None
    for i in range(rows.count()):
        box = rows.nth(i).bounding_box()
        if box and box["y"] >= top - 2:
            if best is None or box["y"] < best[0]:
                best = (box["y"], row_name(rows.nth(i)))
    return best[1] if best else None


def initial(s):
    """Inicial normalizada igual que src/domain/exerciseIndex.ts (conserva la tilde de la ñ)."""
    out = []
    for ch in unicodedata.normalize("NFD", s.strip()):
        if unicodedata.combining(ch) and ch != "\u0303":
            continue
        out.append(ch)
    return unicodedata.normalize("NFC", "".join(out))[:1].upper()


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 375, "height": 812})
        ctx.add_init_script(
            f"localStorage.setItem('gymLab-activeWorkout', {json.dumps(session_storage())})"
        )
        page = ctx.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            boot(page)

            # ── R2a + R1: rail en el selector y paridad de la primera fila con el catálogo ──
            open_picker(page)
            if page.locator(RAIL).count() == 0:
                errors.append("R2a: el selector no muestra el rail A–Z")
            info = page.evaluate(SCROLL_INFO_JS)
            picker_first = first_visible_row(page, info["top"])
            if not picker_first:
                errors.append("R1: no se pudo leer la primera fila del selector")
            page.keyboard.press("Escape")
            page.wait_for_timeout(400)
            if page.locator(SEARCH).count() > 0:
                errors.append("R1: Escape no cerró el selector")

            page.goto(f"{BASE}/ejercicios", wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(1400)
            catalog_first = page.locator("a[href^='/ejercicios/'] span.font-medium").first.inner_text().strip()
            if picker_first and picker_first != catalog_first:
                errors.append(f"R1: primera fila distinta (selector='{picker_first}', catálogo='{catalog_first}')")
            elif picker_first:
                print(f"OK R1: primera fila idéntica en ambas superficies ('{picker_first}')")

            # ── R2b + R3: letras habilitadas/deshabilitadas y salto a la sección ──
            open_picker(page)
            if page.locator(RAIL).count() == 0:
                errors.append("R2b: el rail no está en el selector reabierto")
            s_btn = page.locator(f'{RAIL} button[aria-label="Ir a la letra S"]')
            x_btn = page.locator(f'{RAIL} button[aria-label="Ir a la letra X"]')
            if s_btn.count() == 0 or not s_btn.is_enabled():
                errors.append("R2b: la letra «S» (presente) debería estar habilitada en el rail del selector")
            if x_btn.count() == 0 or not x_btn.is_disabled():
                errors.append("R2b: la letra «X» (ausente) debería estar deshabilitada en el rail del selector")

            err_before_jump = len(errors)
            info0 = page.evaluate(SCROLL_INFO_JS)
            if info0["scrollTop"] > 0:
                errors.append(f"R3: el selector arrancó scrolleado (scrollTop={info0['scrollTop']})")
            if s_btn.count() > 0 and s_btn.is_enabled():
                s_btn.first.click()
                page.wait_for_timeout(600)
                info1 = page.evaluate(SCROLL_INFO_JS)
                if info1["scrollTop"] <= 0:
                    errors.append("R3: el salto del rail no produjo scroll en el selector")
                # Encabezado «S» visible dentro del viewport.
                header_s = page.evaluate(
                    """() => {
                        const hs = document.querySelectorAll('[role="heading"][aria-level="2"]');
                        for (const h of hs) {
                            const box = h.getBoundingClientRect();
                            if (h.textContent.trim().startsWith('S') && box.top >= 0 && box.top < window.innerHeight) {
                                return h.textContent.trim();
                            }
                        }
                        return null;
                    }"""
                )
                if not header_s:
                    errors.append("R3: tras el salto no hay encabezado «S» visible")
                first_s = first_visible_row(page, info1["top"])
                if not first_s or initial(first_s) != "S":
                    errors.append(f"R3: la primera fila tras el salto no es de la letra S ('{first_s}')")
                active = s_btn.first.get_attribute("aria-current")
                if active != "true":
                    errors.append(f"R3: la letra activa del rail no quedó marcada (aria-current={active})")
                if len(errors) == err_before_jump:
                    print("OK R3: salto del rail a «S» con encabezado, fila S y letra activa")

            # ── R4: «Comunes» sigue alfabético ──
            page.evaluate(RESET_SCROLL_JS)
            page.wait_for_timeout(300)
            comunes = page.locator('button:has-text("Comunes")')
            if comunes.count() == 0:
                errors.append("R4: no se encontró el chip «Comunes» en el selector")
            else:
                comunes.first.click()
                page.wait_for_timeout(600)
                info2 = page.evaluate(SCROLL_INFO_JS)
                first_common = first_visible_row(page, info2["top"])
                if not first_common or "Aperturas con mancuernas" not in first_common:
                    errors.append(f"R4: con «Comunes» la primera fila no es alfabéticamente la apertura ('{first_common}')")
                elif page.locator(RAIL).count() == 0:
                    errors.append("R4: el rail debería seguir visible con «Comunes» activo")
                else:
                    print("OK R4: con «Comunes» la lista sigue alfabética y conserva el rail")

            # ── R5–R7: bordes — eñe en el rail, búsqueda sin resultados y encogimiento de la lista ──
            open_picker(page)
            ñ_btn = page.locator(f'{RAIL} button[aria-label="Ir a la letra Ñ"]')
            if ñ_btn.count() != 1:
                errors.append(f"R5: el rail del selector no incluye la letra «Ñ» (es) (count={ñ_btn.count()})")
            else:
                print("OK R5: el rail incluye la eñe como letra propia")

            # R7a — con la lista completa, una letra sin coincidencias posteriores está habilitada.
            b_btn = page.locator(f'{RAIL} button[aria-label="Ir a la letra B"]')
            if b_btn.count() == 0 or not b_btn.is_enabled():
                errors.append("R7a: con la lista completa la letra B debería estar habilitada")

            # R6 — búsqueda sin resultados: sin filas ni rail, con el mensaje de vacío.
            page.fill(SEARCH, "zzzz")
            page.wait_for_timeout(500)
            no_rows = page.locator(ROW).count() == 0
            no_rail = page.locator(RAIL).count() == 0
            has_msg = "No hay ejercicios con estos filtros." in page.inner_text("body")
            if not no_rows:
                errors.append("R6: con una búsqueda sin resultados todavía hay filas")
            if not no_rail:
                errors.append("R6: el rail debería desmontarse sin resultados")
            if not has_msg:
                errors.append("R6: falta el mensaje de «sin resultados»")
            if no_rows and no_rail and has_msg:
                print("OK R6: sin resultados no hay filas ni rail")

            # R6b — limpiar la búsqueda restaura la lista completa.
            page.fill(SEARCH, "")
            page.wait_for_timeout(600)
            info3 = page.evaluate(SCROLL_INFO_JS)
            restored = first_visible_row(page, info3["top"])
            if page.locator(RAIL).count() == 0 or restored != catalog_first:
                errors.append(f"R6b: al limpiar la búsqueda no se restauró la lista (primera='{restored}', esperada='{catalog_first}')")
            else:
                print("OK R6b: limpiar la búsqueda restaura la lista y el rail")

            # R7 — encogimiento por búsqueda: filas y letras presentes se actualizan sin romper.
            # (Los nombres con «sentadilla» arrancan con A, C, E, P, S y Z; «B» no aparece.)
            page.fill(SEARCH, "sentadilla")
            page.wait_for_timeout(600)
            rows_loc = page.locator(ROW)
            names = [row_name(rows_loc.nth(i)) for i in range(rows_loc.count())]
            if not names or any("sentadilla" not in n.lower() for n in names):
                errors.append(f"R7: la búsqueda «sentadilla» no encogió la lista como se esperaba ({len(names)} filas montadas)")
            s_btn2 = page.locator(f'{RAIL} button[aria-label="Ir a la letra S"]')
            if s_btn2.count() == 0 or not s_btn2.is_enabled():
                errors.append("R7: con «sentadilla» la letra S debería estar habilitada")
            elif b_btn.count() == 0 or not b_btn.is_disabled():
                errors.append("R7: con «sentadilla» la letra B debería quedar deshabilitada")
            elif names:
                print(f"OK R7: el encogimiento actualiza filas y letras presentes ({len(names)} filas montadas)")
            page.fill(SEARCH, "")
            page.wait_for_timeout(500)

        except Exception as e:
            errors.append(f"Exception: {e}")
        finally:
            if console_errors:
                errors.extend(console_errors)
            ctx.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("ALL OK")


if __name__ == "__main__":
    main()
