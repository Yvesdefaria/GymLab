"""Fase 66/67 (WP3): el onboarding entrega una rutina a medida del equipamiento.

Verifica que:
- El paso «Semana» siembra el equipamiento con el bucket «Solo peso corporal»
  (equipmentStore es la única fuente) y el resumen muestra el plan en cards por día
  (dirección A): encabezado con músculos y pill «≈ N min», una pill por card.
- Con días en el plan y términos aceptados, la CTA «Empezar D1» queda habilitada y
  fija el programa activo sobre la rutina PROPIA recién creada.
- LA aserción que importa: ninguno de los ejercicios de esa rutina exige equipamiento
  fuera de ['peso corporal']. El generador debe respetar el equipamiento declarado y
  no colar barra/máquina/polea/mancuernas/banco.
- 0 errores de consola.

Nota: el caso de plan vacío (guard R3-002) no es alcanzable de forma determinista por
UI; se cubre con `hasPlannedDays` en los tests unitarios. El panel de detalle de rutina
NO renderiza el equipamiento por fila (solo el nombre del ejercicio), así que el
equipamiento se verifica sobre la rutina persistida en IndexedDB, que es la fuente real
de lo que se guardó. Además se abre la rutina en la UI para probar que es alcanzable.
"""
import sys, os, re
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

STORAGE_KEY = "gymlab-equipment"
BUCKET = "Solo peso corporal"
# Etiquetas es-ES que no pueden aparecer en el equipamiento de la rutina creada.
FORBIDDEN = ("Barra", "Máquina", "Polea", "Mancuernas", "Kettlebell", "Bandas", "Banco")

# F101: el cierre del onboarding deja el tour pendiente y se auto-arranca en la
# home; su overlay navega solo y rompería las aserciones posteriores a «Empezar D1».
TOUR = 'div[role="dialog"][aria-label="Tour guiado de la app"]'
ACHIEVEMENT_MODAL = '[role="dialog"][aria-labelledby="achievement-modal-title"]'


def dismiss_tour(page, timeout_ms=8000):
    """Espera el auto-arranque del tour y lo salta; si no arrancó, no hace nada."""
    try:
        page.wait_for_selector(TOUR, state="visible", timeout=timeout_ms)
    except Exception:
        return
    page.get_by_role("button", name="Saltar tour").click()
    page.wait_for_selector(TOUR, state="detached", timeout=timeout_ms)


def dismiss_overlays(page):
    """El cierre del onboarding dispara overlays que no son parte del flujo:
    el tour F101 (auto-arranque) y el modal de logro por el peso del perfil
    («Autoconocimiento»). El tour va primero: su overlay tapa al modal."""
    dismiss_tour(page)
    deadline = 8000
    while deadline > 0:
        modal = page.locator(ACHIEVEMENT_MODAL)
        if modal.count() == 0:
            break
        modal.get_by_role("button").last.click()
        page.wait_for_timeout(300)
        deadline -= 300


READ_DB_JS = """
async (tables) => {
  const r = indexedDB.open('GymLabDB');
  const db = await new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const out = {};
  for (const t of tables) {
    out[t] = await new Promise((res, rej) => {
      const q = db.transaction(t, 'readonly').objectStore(t).getAll();
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    });
  }
  return out;
}
"""


def read_db(page, tables):
    return page.evaluate(READ_DB_JS, tables)


def run_onboarding(page):
    # Paso 1 — Idioma.
    page.get_by_role("button", name="Español").click()
    page.get_by_role("button", name="Continuar").click()
    # Paso 2 — Objetivo (nivel por defecto: principiante).
    page.get_by_role("button", name="Fuerza", exact=True).click()
    page.get_by_role("button", name="Continuar").click()
    # Paso 3 — Semana: 4 días y el bucket de peso corporal.
    page.get_by_role("button", name="4", exact=True).click()
    page.locator("button[aria-pressed]", has_text=BUCKET).first.click()
    page.wait_for_timeout(150)
    page.get_by_role("button", name="Continuar").click()
    # Paso 4 — Perfil.
    page.get_by_role("button", name="Hombre").click()
    page.get_by_label("Fecha de nacimiento").fill("1996-01-15")
    page.get_by_label("Altura en centímetros").fill("175")
    page.get_by_label("Peso en kg").fill("75")
    page.get_by_role("button", name="Continuar").click()


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
            page.goto(BASE, wait_until="load")
            # Arranque limpio: contexto nuevo (IndexedDB fresca) y sin preferencia previa.
            page.evaluate(f"localStorage.removeItem('{STORAGE_KEY}')")

            run_onboarding(page)

            # Paso 5 — Resumen: el plan se arma async (fan-out de días e ítems de las rutinas),
            # así que esperamos a que aparezcan las cards antes de comprobarlas.
            try:
                page.locator("section h3").first.wait_for(timeout=10000)
            except Exception:
                errors.append("El resumen no muestra las cards de día del plan")

            # Cards por día (dirección A): encabezado con músculos y pill «≈ N min» por card.
            day_count = page.locator("section h3").count()
            if day_count == 0:
                errors.append("El resumen no muestra ningún día del plan")
            if page.get_by_text("Día 1", exact=False).count() == 0:
                errors.append("El resumen no muestra «Día 1»")
            if page.locator("section h3 span").count() == 0:
                errors.append("Las cards de día no muestran músculos en el encabezado")
            minute_pills = page.get_by_text(re.compile(r"^≈ \d+ min$")).count()
            if minute_pills != day_count:
                errors.append(
                    f"Cada card de día debería mostrar su pill de minutos (cards={day_count}, pills={minute_pills})"
                )

            # Tocar «Empezar D1»: con días en el plan la CTA queda habilitada; cierra el
            # wizard y fija el programa activo.
            page.get_by_role("checkbox").check()
            start = page.get_by_role("button", name="Empezar D1")
            if not start.is_enabled():
                errors.append("La CTA «Empezar D1» quedó deshabilitada con un plan con días")
            start.click()
            page.wait_for_timeout(1000)

            # Descartar los overlays F101 ANTES de las aserciones: el tour es un
            # [role='dialog'] (fallaba el chequeo de cierre del onboarding), su
            # navegación por pasos pisaba la ruta de la rutina, y el modal de
            # logro del peso inicial también cuenta como diálogo.
            dismiss_overlays(page)

            if page.locator("[role='dialog']").count() > 0:
                errors.append("El onboarding sigue visible tras «Empezar D1»")

            # --- LA aserción que importa: la rutina creada solo usa peso corporal ---
            data = read_db(page, ["routines", "routineDays", "routineItems", "exercises", "activeProgram"])
            custom = [r for r in data["routines"] if r.get("isCustom")]
            if len(custom) != 1:
                errors.append(f"Debería existir exactamente una rutina propia creada, hay {len(custom)}")
            else:
                routine = custom[0]
                day_ids = {d["id"] for d in data["routineDays"] if d["routineId"] == routine["id"]}
                items = [i for i in data["routineItems"] if i["routineDayId"] in day_ids]
                ex_by_id = {e["id"]: e for e in data["exercises"]}
                if not items:
                    errors.append("La rutina creada quedó sin ejercicios")
                for it in items:
                    ex = ex_by_id.get(it["exerciseId"])
                    if ex is None:
                        errors.append(f"El ejercicio {it['exerciseId']} de la rutina no está en el catálogo")
                        continue
                    equipment = ex.get("equipment") or []
                    if not set(equipment).issubset({"peso corporal"}):
                        errors.append(f"«{ex.get('name')}» exige {equipment}, fuera de ['peso corporal']")

                programs = data["activeProgram"]
                if not programs or programs[0].get("routineId") != routine["id"]:
                    errors.append("El programa activo no apunta a la rutina propia creada")

                # Abrir la rutina en la UI: es alcanzable y muestra sus días/ejercicios.
                page.goto(f"{BASE}/rutinas/{routine['slug']}", wait_until="load")
                page.wait_for_timeout(1200)
                if page.get_by_role("tab", name="Día 1").count() == 0:
                    errors.append("La rutina creada no muestra la pestaña «Día 1»")
                if page.locator("a[href^='/ejercicios/']").count() == 0:
                    errors.append("La rutina creada no lista ningún ejercicio en la UI")

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
