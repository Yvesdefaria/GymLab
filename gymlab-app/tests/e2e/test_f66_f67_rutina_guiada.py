"""Fase 66/67 (WP3): el onboarding entrega una rutina a medida del equipamiento.

Verifica que:
- El paso «Semana» siembra el equipamiento con el bucket «Solo peso corporal»
  (equipmentStore es la única fuente) y el resumen muestra los días del plan.
- «Empezar D1» fija el programa activo sobre la rutina PROPIA recién creada.
- LA aserción que importa: ninguno de los ejercicios de esa rutina exige equipamiento
  fuera de ['peso corporal']. El generador debe respetar el equipamiento declarado y
  no colar barra/máquina/polea/mancuernas/banco.
- 0 errores de consola.

Nota: el panel de detalle de rutina NO renderiza el equipamiento por fila (solo el
nombre del ejercicio), así que el equipamiento se verifica sobre la rutina persistida
en IndexedDB, que es la fuente real de lo que se guardó. Además se abre la rutina en la
UI para probar que es alcanzable.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

STORAGE_KEY = "gymlab-equipment"
BUCKET = "Solo peso corporal"
# Etiquetas es-ES que no pueden aparecer en el equipamiento de la rutina creada.
FORBIDDEN = ("Barra", "Máquina", "Polea", "Mancuernas", "Kettlebell", "Bandas", "Banco")

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
            # así que esperamos a que aparezca antes de comprobarlo.
            try:
                page.get_by_text("Día 1", exact=True).first.wait_for(timeout=10000)
            except Exception:
                errors.append("El resumen no muestra los días del plan (falta «Día 1»)")

            # Tocar «Empezar D1»: cierra el wizard y fija el programa activo.
            page.get_by_role("checkbox").check()
            page.get_by_role("button", name="Empezar D1").click()
            page.wait_for_timeout(1000)

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
