"""F132.6 — Nutrición y Suplementos en Nocturno Minimal.

Cubre en 375 y 768:
- /nutricion con objetivo: héroe, macros, tabs, alta en sheet, filas y borrado.
- /nutricion sin objetivo: estado honesto con link a Perfil (sin 2.200 inventados).
- /suplementos: seed, adherencia, check, filtros, alta y borrado.
- /suplementos sin activos: estado vacío honesto.
Falla con cualquier pageerror o error de consola.
"""
import os
import re
import sys
import datetime

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import expect

from scripts.e2e_utils import run_views, base_url

TODAY = datetime.date.today().isoformat()


def seed_meta_js(with_goal: bool, meals: bool = False, supplements: bool = False):
    goal_meta = (
        f"meta.put({{ key: 'heightCm', value: JSON.stringify(180) }});"
        f"meta.put({{ key: 'birthDate', value: JSON.stringify('1994-05-15') }});"
        f"meta.put({{ key: 'bodySex', value: JSON.stringify('male') }});"
        f"meta.put({{ key: 'unlockedAchievements', value: JSON.stringify(['cuerpo-primer-peso']) }});"
        f"meta.put({{ key: 'achievementSnapshot', value: JSON.stringify(['cuerpo-primer-peso']) }});"
        f"meta.put({{ key: 'achievementCounts', value: JSON.stringify({{ 'cuerpo-primer-peso': 1 }}) }});"
        f"tx.objectStore('bodyWeight').put({{ id: 9901, localDate: '{TODAY}', weightKg: 78.4, createdAt: '{TODAY}T09:00:00.000Z' }});"
        if with_goal
        else "meta.delete('heightCm'); meta.delete('birthDate'); meta.delete('bodySex');"
    )
    meal_seed = (
        f"tx.objectStore('mealEntries').put({{ id: 9911, localDate: '{TODAY}', mealType: 'desayuno', items: [{{ foodId: 1, foodKey: 'chickenBreast', grams: 100, kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 }}], createdAt: '{TODAY}T08:00:00.000Z' }});"
        if meals
        else "tx.objectStore('mealEntries').clear();"
    )
    supplements_seed = (
        "tx.objectStore('supplements').clear();"
        if supplements
        else ""
    )
    return f"""async () => {{
  const openDb = () => new Promise((res, rej) => {{
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }});
  const db = await openDb();
  await new Promise((res, rej) => {{
    const tx = db.transaction(['meta', 'bodyWeight', 'mealEntries', 'supplements'], 'readwrite');
    const meta = tx.objectStore('meta');
    meta.put({{ key: 'onboardingDone', value: 'true' }});
    meta.put({{ key: 'settings', value: JSON.stringify({{ language: 'es', showSectionTips: false }}) }});
    {goal_meta}
    {meal_seed}
    {supplements_seed}
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  }});
  db.close();
  return true;
}}"""


def dismiss_achievements(page):
    # La cola de logros se monta en lazy y puede aparecer después de la acción.
    page.wait_for_timeout(900)
    for _ in range(8):
        modal = page.locator('[aria-labelledby="achievement-modal-title"]')
        if modal.count() == 0:
            page.wait_for_timeout(250)
            if modal.count() == 0:
                break
            continue
        modal.get_by_role("button").last.click()
        page.wait_for_timeout(500)


def load(page, path, *, with_goal=True, meals=False, supplements=False):
    page.goto(base_url(), wait_until="load")
    page.wait_for_timeout(500)
    assert page.evaluate(seed_meta_js(with_goal, meals, supplements)) is True, "fallo el seed"
    page.goto(f"{base_url()}{path}", wait_until="load")
    page.wait_for_timeout(1200)
    dismiss_achievements(page)


def assert_nutrition(page):
    # Héroe con objetivo real: el TDEE se calcula con peso, altura y edad.
    expect(page.locator('[role="progressbar"]').first).to_be_visible()
    body = page.inner_text("body").lower()
    assert "consumido hoy" in body, "falta el héroe de consumo"
    assert "objetivo ajustado" in body, "falta la nota del objetivo"
    assert "sin objetivo diario" not in body, "inventó el estado sin objetivo"
    assert "proteína" in body and "grasa" in body, "faltan los macros"

    # Tabs por comida con subtotal vacío honesto.
    for label in ("Desayuno", "Almuerzo", "Cena", "Snack"):
        assert page.get_by_role("button", name=f"{label} —").count() >= 1, f"tab {label} sin estado vacío"
    assert page.get_by_text("Sin comidas registradas").count() >= 1, "falta el vacío de la comida"

    # Alta en sheet: buscar, elegir y agregar sin cerrar.
    page.get_by_role("button", name="Agregar a Desayuno").click()
    dialog = page.locator('[role="dialog"]').first
    expect(dialog).to_be_visible()
    expect(dialog).to_contain_text("Agregar a Desayuno")

    search = dialog.locator("input").first
    search.fill("pollo")
    page.wait_for_timeout(400)
    dialog.get_by_role("button", name="Pechuga de pollo 165 kcal/100g").click()
    page.wait_for_timeout(300)
    expect(dialog).to_contain_text(re.compile("seleccionado", re.I))
    dialog.get_by_role("button", name="Agregar", exact=True).click()
    page.wait_for_timeout(400)
    expect(dialog).to_contain_text(re.compile("agregado: pechuga de pollo", re.I))
    assert search.input_value() == "", "la búsqueda no se limpió"
    page.keyboard.press("Escape")
    page.wait_for_timeout(400)
    dismiss_achievements(page)

    body = page.inner_text("body")
    assert "Pechuga de pollo" in body, "la comida no aparece en la lista"
    assert "165" in body, "no se ve la kcal de la comida"
    assert "Desayuno165 kcal" in body.replace(" ", "") or "165 kcal" in body, "el tab no muestra el subtotal"

    # Cambiar de comida y comprobar el vacío de Cena.
    page.get_by_role("button", name="Cena —").click()
    page.wait_for_timeout(300)
    assert page.get_by_text("Sin comidas registradas").count() >= 1, "Cena no muestra su vacío"

    # Borrar la comida de Desayuno y verificar que el subtotal vuelve a «—».
    page.get_by_role("button", name="Desayuno 165 kcal").click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Eliminar Pechuga de pollo").click()
    page.wait_for_timeout(400)
    assert page.get_by_text("Sin comidas registradas").count() >= 1, "no volvió el vacío tras borrar"
    assert page.get_by_role("button", name="Desayuno —").count() >= 1, "el tab no volvió a «—»"

    # Sin objetivo: estado honesto y link a Perfil.
    page.evaluate(seed_meta_js(False, False))
    page.reload(wait_until="load")
    page.wait_for_timeout(1200)
    body = page.inner_text("body")
    assert "Sin objetivo diario" in body, "no aparece el estado sin objetivo"
    assert page.get_by_role("link", name="Ir a Perfil").get_attribute("href") == "/perfil"
    assert page.locator('[role="progressbar"]').count() == 0, "el anillo de progreso sigue con objetivo inventado"

    sw = page.evaluate("() => document.documentElement.scrollWidth")
    cw = page.evaluate("() => document.documentElement.clientWidth")
    assert sw <= cw + 5, f"scroll horizontal {sw} > {cw}"


def assert_supplements(page):
    load(page, "/suplementos", supplements=True)
    page.wait_for_timeout(1500)
    body = page.inner_text("body")
    assert "/ 7 tomados" in body, "el héroe no muestra el total del seed"
    assert "pendientes" in body, "el héroe no muestra pendientes"
    assert page.locator("[data-supplement]").count() == 7, "el seed no renderiza 7 filas"

    # Check: pasa a verde y actualiza la adherencia.
    first = page.locator("[data-supplement]").first
    check = first.get_by_role("button", name="Tomado hoy")
    assert check.get_attribute("aria-pressed") == "false"
    check.click()
    page.wait_for_timeout(500)
    dismiss_achievements(page)
    assert check.get_attribute("aria-pressed") == "true", "el check no quedó tomado"
    assert "bg-success" in (check.get_attribute("class") or ""), "el check tomado no usa verde"
    assert "1" in page.inner_text("body") and "/ 7 tomados" in page.inner_text("body"), "la adherencia no subió"

    # Filtro Pre-entreno: solo las filas de esa frecuencia.
    page.get_by_role("button", name="Pre-entreno").click()
    page.wait_for_timeout(400)
    assert page.locator("[data-supplement]").count() == 2, "el filtro Pre-entreno no reduce a 2"
    assert page.inner_text("body").count("Cafeína") == 1, "Cafeína no está en el filtro"

    # Filtro sin filas: texto plano, sin inventar suplementos.
    page.get_by_role("button", name="Semanal").click()
    page.wait_for_timeout(300)
    assert "No hay suplementos en esta frecuencia" in page.inner_text("body"), "falta el vacío del filtro"

    # Alta en sheet.
    page.get_by_role("button", name="Todos").click()
    page.get_by_role("button", name="Agregar suplemento").first.click()
    dialog = page.locator('[role="dialog"]').first
    expect(dialog).to_be_visible()
    dialog.get_by_placeholder("Nombre del suplemento").fill("Zinc E2E")
    dialog.get_by_placeholder("Dosis (ej: 5 g, 200 mg)").fill("10 mg")
    dialog.get_by_role("button", name="Semanal").click()
    dialog.get_by_role("button", name="Guardar").click()
    page.wait_for_timeout(700)
    dismiss_achievements(page)
    assert "Zinc E2E" in page.inner_text("body"), "el suplemento nuevo no aparece"
    assert page.locator("[data-supplement]").count() == 8, "el alta no sumó una fila"

    # Borrar el suplemento propio.
    page.get_by_role("button", name="Eliminar Zinc E2E").click()
    page.wait_for_timeout(500)
    assert "Zinc E2E" not in page.inner_text("body"), "el suplemento no se borró"

    # Vacío honesto: una fila inactiva no se muestra como activa.
    page.evaluate(
        """async () => {
          const db = await new Promise((res, rej) => {
            const r = indexedDB.open('GymLabDB');
            r.onsuccess = () => res(r.result);
            r.onerror = () => rej(r.error);
          });
          await new Promise((res, rej) => {
            const tx = db.transaction('supplements', 'readwrite');
            tx.objectStore('supplements').clear();
            tx.objectStore('supplements').put({ id: 9999, name: 'Inactivo', dose: '1 g', frequency: 'diario', active: false, createdAt: new Date().toISOString() });
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
          });
          db.close();
          return true;
        }"""
    )
    page.reload(wait_until="load")
    page.wait_for_timeout(1200)
    assert "Sin suplementos" in page.inner_text("body"), "no aparece el vacío sin activos"
    assert page.locator("[data-supplement]").count() == 0, "una fila inactiva se renderizó"

    sw = page.evaluate("() => document.documentElement.scrollWidth")
    cw = page.evaluate("() => document.documentElement.clientWidth")
    assert sw <= cw + 5, f"scroll horizontal {sw} > {cw}"


def assert_iphone(page, view_name, shot):
    load(page, "/nutricion", meals=False)
    assert_nutrition(page)
    page.screenshot(path=shot, full_page=True)
    assert_supplements(page)
    page.screenshot(path=f"{os.path.splitext(shot)[0]}-suplementos.png", full_page=True)


def assert_ipad(page, view_name, shot):
    load(page, "/nutricion", meals=False)
    assert_nutrition(page)
    page.screenshot(path=shot, full_page=True)
    assert_supplements(page)
    page.screenshot(path=f"{os.path.splitext(shot)[0]}-suplementos.png", full_page=True)


if __name__ == "__main__":
    errors = run_views(
        {"iphone": assert_iphone, "ipad": assert_ipad},
        __file__,
        "f132_6",
    )
    if errors:
        print("FALLO:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)
    print("\nALL OK")

