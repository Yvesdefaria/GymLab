"""Fase 66/67 (WP4): el planificador genera y guarda una rutina propia.

Verifica que:
- La ruta `/rutinas/planificador` existe (antes caía en el `*` del router y redirigía a `/`).
- El wizard de 3 pasos (nivel -> objetivo -> días + equipamiento) arma un plan
  y lo muestra con al menos un día y sus ejercicios.
- «Guardar como mi rutina» persiste la rutina como PROPIA (isCustom) y es alcanzable
  en `/rutinas` con su badge.
- 0 errores de consola / pageerror.

Nota: se marca el onboarding como hecho en IndexedDB (patrón de
test_rutas_multi_segmento.py) para que su overlay no tape la página.
"""
import sys, os, re
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# El store de equipamiento persiste en localStorage: se limpia para probar el plan
# con «sin filtro» (selección vacía = entra todo el equipamiento).
EQUIPMENT_KEY = "gymlab-equipment"

# Marca el onboarding como hecho (IndexedDB, store `meta`) para que no tape la página.
META_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: '["primera-marca"]' });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
  return true;
}"""

READ_CUSTOM_ROUTINES_JS = """
async () => {
  const r = indexedDB.open('GymLabDB');
  const db = await new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const all = await new Promise((res, rej) => {
    const q = db.transaction('routines', 'readonly').objectStore('routines').getAll();
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
  return all.filter((x) => x.isCustom).map((x) => ({ slug: x.slug, title: x.title }));
}
"""


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
            page.evaluate(META_JS)
            page.evaluate(f"localStorage.removeItem('{EQUIPMENT_KEY}')")

            # Carga DIRECTA de la ruta multi-segmento (el e2e web no ve la app nativa).
            page.goto(f"{BASE}/rutinas/planificador", wait_until="networkidle")
            page.wait_for_timeout(800)

            # El header confirma que NO caímos en el `*` del router (redirect a `/`).
            try:
                page.get_by_role("heading", name="Planificador").wait_for(timeout=5000)
            except Exception:
                errors.append("La ruta /rutinas/planificador no montó el planificador (¿cayó en el `*` del router?)")

            # Paso 1 — Nivel (avanza al elegir).
            page.get_by_role("button", name="Principiante", exact=True).click()
            # Paso 2 — Objetivo (avanza al elegir).
            page.get_by_role("button", name="Volumen", exact=True).click()
            # Paso 3 — Días + equipamiento: generar con la selección vacía (sin filtro).
            page.get_by_role("button", name="Generar rutina").click()

            # Resultado: al menos un día y sus ejercicios.
            try:
                page.get_by_text("Tu rutina semanal", exact=True).wait_for(timeout=10000)
            except Exception:
                errors.append("El planificador no mostró el resultado («Tu rutina semanal»)")

            day_count = page.get_by_text("Día 1", exact=True).count()
            if day_count == 0:
                errors.append("El resultado no muestra ningún día (falta «Día 1»)")
            exercise_links = page.locator("a[href^='/ejercicios/']").count()
            if exercise_links == 0:
                errors.append("El resultado no lista ningún ejercicio")

            # Guardar como rutina propia y navegar al detalle.
            page.get_by_role("button", name="Guardar como mi rutina").click()
            try:
                page.wait_for_function(
                    "() => location.pathname.startsWith('/rutinas/') && !location.pathname.endsWith('/planificador')",
                    timeout=10000,
                )
            except Exception:
                errors.append("«Guardar como mi rutina» no navegó al detalle de la rutina")

            custom = page.evaluate(READ_CUSTOM_ROUTINES_JS)
            if len(custom) != 1:
                errors.append(f"Debería existir exactamente una rutina propia guardada, hay {len(custom)}")
            else:
                # Alcanzable en /rutinas con su badge: «Propia» si se generó, «Basada en …»
                # si calzó una predefinida y se guardó como clon (mismo criterio que el onboarding).
                page.goto(f"{BASE}/rutinas", wait_until="networkidle")
                page.wait_for_timeout(800)
                if page.get_by_text(re.compile(r"^(Propia|Basada en)")).count() == 0:
                    errors.append("La rutina guardada no aparece en /rutinas con badge de rutina propia")
                if page.get_by_text(custom[0]["title"], exact=True).count() == 0:
                    errors.append(f"La rutina «{custom[0]['title']}» no aparece en el catálogo /rutinas")

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
