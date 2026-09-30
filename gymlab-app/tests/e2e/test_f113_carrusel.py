"""F113: carrusel horizontal de la sesión activa.

Escenarios:
A) Superserie: 2 ejercicios del mismo grupo ocupan UN slide (aria-label «Superserie 1 de 2»)
   y completar el grupo dispara el auto-avance F34c al siguiente grupo incompleto.
B) Arranque en el primer grupo incompleto: con el grupo 1 completo, el carrusel abre en el 2
   (también con prefers-reduced-motion activo).
C) prefers-reduced-motion: cubierto en B (el arranque sigue posicionando en el incompleto).
D) Sesión sin ejercicios: EmptyState + botón «Añadir ejercicio» en flujo, sin barra fija
   ni carrusel.

El seed reutiliza el patrón de test_f63_suggestions.py (localStorage + IndexedDB).
"""
import sys, os, json, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

SEED_DB_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    // Pre-desbloquear el catálogo completo evita que un modal de logro tape la página al cargar.
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(['primer-paso', 'inaugural', 'primer-reto', 'racha-4', 'racha-8', 'primera-marca', 'volumen-semanal', 'sesiones-50', 'consistencia-4s', 'primera-cardio', 'ejercicios-100', 'racha-16', 'pr-10kg', 'guias-completas', 'sesiones-500', 'primer-ano']) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def exercise(exercise_id, name, superset, sets):
    data = {
        "exerciseId": exercise_id,
        "exerciseName": name,
        "sets": [
            {
                "id": set_id,
                "exerciseId": exercise_id,
                "exerciseName": name,
                "setNumber": index + 1,
                "weightKg": 60,
                "reps": 8,
                "completed": completed,
            }
            for index, (set_id, completed) in enumerate(sets)
        ],
    }
    if superset:
        data["supersetGroup"] = superset
    return data


def workout_storage(exercises):
    return json.dumps(
        {
            "state": {
                "workoutId": None,
                "startedAt": NOW,
                "routineId": None,
                "routineDayId": None,
                "exercises": exercises,
                "restSeconds": 90,
                "warmupSeen": True,  # evita el calentamiento guiado (no es el foco de F113)
            },
            "version": 0,
        }
    )


def superset_storage():
    return workout_storage([
        exercise(1, "Press de pecho con barra", "A", [("set-a1", False)]),
        exercise(3, "Remo con barra", "A", [("set-b1", False)]),
        exercise(2, "Sentadilla", None, [("set-c1", False)]),
    ])


def superset_complete_storage():
    return workout_storage([
        exercise(1, "Press de pecho con barra", "A", [("set-a1", True)]),
        exercise(3, "Remo con barra", "A", [("set-b1", True)]),
        exercise(2, "Sentadilla", None, [("set-c1", False)]),
    ])


def wait_for_no_overlay(page, timeout_ms=8000):
    """Espera a que desaparezcan los modales transitorios de hidratación."""
    deadline = timeout_ms
    while deadline > 0:
        if page.locator("div.fixed.inset-0").count() == 0:
            return True
        page.wait_for_timeout(250)
        deadline -= 250
    return page.locator("div.fixed.inset-0").count() == 0


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
            page.add_init_script(f"""
              if (!localStorage.getItem('gymLab-activeWorkout')) {{
                localStorage.setItem('gymLab-activeWorkout', {json.dumps(superset_storage())});
              }}
            """)
            page.goto(BASE, wait_until="networkidle")
            seed = page.evaluate(SEED_DB_JS)
            assert seed is True, f"seed fallo: {seed}"
            page.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")
            page.wait_for_timeout(1200)
            assert wait_for_no_overlay(page), "un modal persistente bloquea la pantalla"

            carousel = page.locator('[aria-label="Ejercicios de la sesión"]')
            slides = carousel.locator('[role="group"]')
            section = page.locator("section").filter(has=carousel)
            counter = section.locator("p[aria-live='polite']")

            # A1) La superserie es UN slide (2 ejercicios) + suelto = 2 slides.
            if slides.count() != 2:
                errors.append(f"A: se esperaban 2 slides (superserie + suelto), hay {slides.count()}")
            else:
                print("OK A1: 2 slides (superserie + suelto)")

            # A2) aria-label del slide de superserie.
            first_label = slides.first.get_attribute("aria-label") or ""
            if not first_label.startswith("Superserie 1 de 2:") or "Press de pecho con barra" not in first_label:
                errors.append(f"A: aria-label de superserie inesperado: '{first_label}'")
            else:
                print(f"OK A2: aria-label de superserie ('{first_label}')")

            # A3) Badge de superserie visible.
            if page.locator("span", has_text="Superserie A").count() == 0:
                errors.append("A: no se ve el badge 'Superserie A'")
            else:
                print("OK A3: badge 'Superserie A' visible")

            # A4) touch-action con AMBOS ejes (no el pan-x de HScroll). Chromium serializa
            # `pan-x pan-y pinch-zoom` como `manipulation` (mismo valor): se aceptan ambas
            # formas y se rechaza cualquier variante de un solo eje (p.ej. 'pan-x').
            touch = carousel.evaluate("el => getComputedStyle(el).touchAction")
            allows_both_axes = touch == "manipulation" or ("pan-x" in touch and "pan-y" in touch)
            if not allows_both_axes:
                errors.append(f"A: touch-action sin ambos ejes: {touch}")
            else:
                print(f"OK A4: touch-action '{touch}' permite pan horizontal y vertical")

            # A5) Contador inicial en el primer incompleto.
            if counter.inner_text() != "1 de 2":
                errors.append(f"A: contador inicial inesperado: '{counter.inner_text()}'")
            else:
                print("OK A5: contador inicial '1 de 2'")

            # A6) Completar UNA serie no avanza; completar el grupo entero SÍ (F34c).
            # Ventana negativa con la cota de A7 (scroll suave + debounce del contador): con
            # 400 ms el guard podía dar un falso verde. Señal inmediata añadida: scrollLeft,
            # que un avance prematuro (grupo incompleto) mueve al instante.
            complete_buttons = slides.first.locator('button[aria-label="Marcar completada"]')
            if complete_buttons.count() != 2:
                errors.append(f"A: se esperaban 2 series pendientes en la superserie, hay {complete_buttons.count()}")
            else:
                scroll_before = carousel.evaluate("el => el.scrollLeft")
                complete_buttons.first.click(timeout=5000)
                page.wait_for_timeout(1200)
                scroll_after = carousel.evaluate("el => el.scrollLeft")
                if counter.inner_text() == "2 de 2":
                    errors.append("A: el carrusel avanzó con el grupo AÚN incompleto")
                elif abs(scroll_after - scroll_before) > 5:
                    errors.append(
                        f"A: el carrusel se desplazó con el grupo AÚN incompleto ({scroll_before} -> {scroll_after})"
                    )
                else:
                    print("OK A6: sin auto-avance con el grupo incompleto")
                # Tras completar la primera serie queda UNA pendiente en el grupo: se vuelve a
                # apuntar al primer botón (el locator es dinámico y su count bajó a 1).
                complete_buttons.first.click(timeout=5000)
                page.wait_for_timeout(1200)  # scroll suave + debounce del contador
                if counter.inner_text() != "2 de 2":
                    errors.append(f"A: el auto-avance F34c no llevó el contador a '2 de 2' (={counter.inner_text()})")
                else:
                    print("OK A7: auto-avance al siguiente grupo incompleto ('2 de 2')")
                box = slides.nth(1).bounding_box()
                carcass = carousel.bounding_box()
                if (
                    not box
                    or not carcass
                    or box["x"] >= carcass["x"] + carcass["width"]
                    or box["x"] + box["width"] <= carcass["x"]
                ):
                    errors.append("A: el slide 2 no quedó visible tras el auto-avance")
                else:
                    print("OK A8: slide 2 visible tras el auto-avance")

            # B) Arranque en el primer grupo incompleto, con reduced-motion activo.
            page.evaluate("(state) => localStorage.setItem('gymLab-activeWorkout', state)", superset_complete_storage())
            page.emulate_media(reduced_motion="reduce")
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1200)
            if counter.inner_text() != "2 de 2":
                errors.append(f"B: con el grupo 1 completo no abrió en el grupo 2 ('{counter.inner_text()}')")
            else:
                print("OK B1: arranque en el primer grupo incompleto con reduced-motion ('2 de 2')")
            page.emulate_media(reduced_motion="no-preference")

            # D) Sesión sin ejercicios: EmptyState + botón en flujo, sin barra fija ni carrusel.
            page.evaluate("(state) => localStorage.setItem('gymLab-activeWorkout', state)", workout_storage([]))
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1200)
            if page.locator('button:has-text("Finalizar entreno")').count() != 0:
                errors.append("D: la barra fija aparece sin ejercicios")
            elif page.locator('[aria-label="Ejercicios de la sesión"]').count() != 0:
                errors.append("D: el carrusel aparece sin ejercicios")
            elif page.locator('button:has-text("Añadir ejercicio")').count() != 1:
                errors.append("D: falta el botón 'Añadir ejercicio' en flujo con la sesión vacía")
            else:
                print("OK D: sesión vacía con botón en flujo y sin barra fija")

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
        print("\nALL OK")


if __name__ == "__main__":
    main()
