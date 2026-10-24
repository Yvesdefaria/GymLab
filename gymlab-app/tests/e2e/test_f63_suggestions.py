"""Fase 63/98.2 (actualizada en F122): sugerencias de sesión como chip por bloque.

Escenarios:
1) Chip de calentamiento dentro del bloque: con PR conocido (e1RM 100) y la primera
   serie de trabajo al 80 %, la sugerencia warmup aparece DENTRO del bloque y al pulsar
   su botón se inserta un set isWarmup (~45 % del peso) al inicio, renumerando el resto.
2) Chip de peso dentro del bloque: la señal de seguridad de BAJAR (RPE real alto) aparece
   en el bloque de Press y su acción fija el objetivo absoluto en las pendientes.
   F122: el chip de SUBIR se retiró — la propuesta del día (escalada) vive en su propio
   flujo (test_f122) y exige evidencia; este seed no la dispara.
3) Las series completadas conservan su peso al aplicar la bajada.
4) F122: sin evidencia no hay propuesta de peso (ni «Sugerido» de F118 ni «Escalada»).
5) El descarte del chip usa la clave i18n (es) y no el literal inglés "Dismiss".
6) El input de peso es de texto con `inputmode=decimal` (F97.5), no `type=number`.

Se verifica el estado persistido (zustand → localStorage) porque ese mismo estado es el
que se guarda al finalizar y alimenta la precarga de la próxima sesión.
"""
import sys, os, json, datetime
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

NOW = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
# Fechas RELATIVAS del fixture de historial (F118): fijas se caen de la ventana de 90 días.
_HIST_A = (datetime.date.today() - datetime.timedelta(days=7)).isoformat()
_HIST_B = (datetime.date.today() - datetime.timedelta(days=14)).isoformat()


def active_workout_storage():
    """Sesión activa sembrada: 2 ejercicios con chip (calentamiento + bajada) y 1 sin sugerencia."""
    state = {
        "state": {
            "workoutId": None,
            "startedAt": NOW,
            "routineId": None,
            "routineDayId": None,
            "exercises": [
                {
                    "exerciseId": 1,
                    "exerciseName": "Press de pecho con barra",
                    "sets": [
                        {"id": "set-a1", "exerciseId": 1, "exerciseName": "Press de pecho con barra",
                         "setNumber": 1, "weightKg": 60, "reps": 8, "completed": True, "rpe": 10, "rir": 0},
                        {"id": "set-a2", "exerciseId": 1, "exerciseName": "Press de pecho con barra",
                         "setNumber": 2, "weightKg": 60, "reps": 8, "completed": True, "rpe": 10, "rir": 0},
                        {"id": "set-a3", "exerciseId": 1, "exerciseName": "Press de pecho con barra",
                         "setNumber": 3, "weightKg": 60, "reps": 8, "completed": False},
                    ],
                },
                {
                    "exerciseId": 2,
                    "exerciseName": "Sentadilla",
                    "sets": [
                        {"id": "set-b1", "exerciseId": 2, "exerciseName": "Sentadilla",
                         "setNumber": 1, "weightKg": 80, "reps": 8, "completed": True, "rpe": 7, "rir": 2},
                        {"id": "set-b2", "exerciseId": 2, "exerciseName": "Sentadilla",
                         "setNumber": 2, "weightKg": 80, "reps": 8, "completed": False},
                    ],
                },
                {
                    # Ejercicio sin series completadas: sin propuesta de peso (F122).
                    "exerciseId": 3,
                    "exerciseName": "Remo con barra",
                    "sets": [
                        {"id": "set-c1", "exerciseId": 3, "exerciseName": "Remo con barra",
                         "setNumber": 1, "weightKg": 50, "reps": 8, "completed": False},
                        {"id": "set-c2", "exerciseId": 3, "exerciseName": "Remo con barra",
                         "setNumber": 2, "weightKg": 50, "reps": 8, "completed": False},
                    ],
                },
            ],
            "restSeconds": 90,
            "warmupSeen": True,  # evitar el calentamiento guiado (ya cubierto en t2).
        },
        "version": 0,
    }
    return json.dumps(state)


SEED_DB_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta', 'prs', 'workouts', 'workoutSets'], 'readwrite');
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    // F132.2: el test asserta copy español; el default del producto es inglés.
    tx.objectStore('meta').put({ key: 'settings', value: JSON.stringify({ language: 'es' }) });
    // Los PRs del seed anclan logros («Primera marca», «Primer reto» de F68…): si alguno
    // queda sin desbloquear, su modal de celebración tapa la página al cargar. Se
    // pre-desbloquea el catálogo completo, como test_f90.py (string JSON, como setJson).
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(['primer-paso', 'inaugural', 'primer-reto', 'racha-4', 'racha-8', 'primera-marca', 'volumen-semanal', 'sesiones-50', 'consistencia-4s', 'primera-cardio', 'ejercicios-100', 'racha-16', 'pr-10kg', 'guias-completas', 'sesiones-500', 'primer-ano']) });
    // PRs por ejercicio: e1RM 100 -> Press 60 es 60% (sin warmup) y Sentadilla 80 es 80% (warmup).
    tx.objectStore('prs').put({ exerciseId: 1, weightKg: 100, reps: 5, date: '2026-08-01', estimated1RM: 100 });
    tx.objectStore('prs').put({ exerciseId: 2, weightKg: 80, reps: 5, date: '2026-08-01', estimated1RM: 100 });
    // Remo: sin historial, el motor cae al PR (55) como último recurso y lo usa de techo.
    tx.objectStore('prs').put({ exerciseId: 3, weightKg: 55, reps: 5, date: '2026-08-01', estimated1RM: 60 });
    // F118/S3: el chip de peso exige historial real — dos sesiones del ejercicio 1 con
    // top set 60 (promedio reciente 60 → objetivo 62,5). Sin esto el chip ya no dispara.
    // Fechas relativas: fijas se caen de la ventana de 90 días.
    tx.objectStore('workouts').put({ id: 801, startedAt: '%HIST_A%T10:00:00.000Z', routineId: null, localDate: '%HIST_A%' });
    tx.objectStore('workouts').put({ id: 802, startedAt: '%HIST_B%T10:00:00.000Z', routineId: null, localDate: '%HIST_B%' });
    [801, 802].forEach((wid) => {
      tx.objectStore('workoutSets').put({ id: wid * 10 + 1, workoutId: wid, exerciseId: 1, setNumber: 1, weightKg: 60, reps: 8, completed: true, createdAt: '%HIST_A%T10:00:00.000Z' });
    });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}""".replace("%HIST_A%", _HIST_A).replace("%HIST_B%", _HIST_B)


def read_store(page):
    """Devuelve el estado persistido del store de sesión activa (parsed)."""
    raw = page.evaluate("() => localStorage.getItem('gymLab-activeWorkout')")
    return json.loads(raw)["state"] if raw else None


def wait_for_no_overlay(page, timeout_ms=8000):
    """Espera a que desaparezcan los modales transitorios de hidratación (p.ej. novedades/onboarding)."""
    deadline = timeout_ms
    while deadline > 0:
        overlays = page.locator("div.fixed.inset-0")
        if overlays.count() == 0:
            return True
        for k in range(min(overlays.count(), 2)):
            print(f"OVERLAY {k}:", overlays.nth(k).inner_text()[:200].replace("\n", " | "))
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
                localStorage.setItem('gymLab-activeWorkout', {json.dumps(active_workout_storage())});
              }}
            """)
            page.goto(BASE, wait_until="networkidle")
            seed_result = page.evaluate(SEED_DB_JS)
            assert seed_result is True, f"seed fallo: {seed_result}"
            page.goto(f"{BASE}/entrenamiento/active", wait_until="networkidle")
            page.wait_for_timeout(1500)
            assert wait_for_no_overlay(page), "un modal persistente bloquea la pantalla tras la carga"

            body = page.inner_text("body")

            # 1) Chip de calentamiento DENTRO del bloque de Sentadilla.
            sentadilla_block = page.locator('[data-testid="exercise-block"]', has_text="Sentadilla")
            warmup_chip = sentadilla_block.locator("button", has_text="Añadir set de calentamiento")
            if "Empiezas al 80% de tu máximo" not in body:
                errors.append("No aparece la sugerencia de calentamiento (Empiezas al 80%...)")
            elif warmup_chip.count() == 0:
                errors.append("El chip de calentamiento no está dentro del bloque de Sentadilla")
            else:
                print("OK: chip de calentamiento dentro del bloque (80% del e1RM)")
                assert wait_for_no_overlay(page)
                warmup_chip.first.click(timeout=5000)
                page.wait_for_timeout(800)

            # El set de calentamiento (~45% de 80 = 36) se inserta al inicio, isWarmup y renumerado.
            store = read_store(page)
            sets_b = store["exercises"][1]["sets"]
            if not (sets_b and sets_b[0].get("isWarmup") is True and sets_b[0]["weightKg"] == 36):
                errors.append(f"El set de calentamiento no se insertó bien: {sets_b}")
            elif sets_b[0]["setNumber"] != 1 or sets_b[1]["setNumber"] != 2:
                errors.append(f"Las series no se renumeraron tras el warmup: {sets_b}")
            else:
                print("OK: set de calentamiento 36 kg insertado al inicio y renumerado")

            # La sugerencia aplicada desaparece (estado applied del chip).
            page.wait_for_timeout(400)
            if sentadilla_block.locator("button", has_text="Añadir set de calentamiento").count() > 0:
                errors.append("El chip de warmup sigue visible tras aplicarlo")
            else:
                print("OK: el chip de warmup desaparece al aplicarlo")

            # 2) Chip de peso (bajada de seguridad, RPE real alto) DENTRO del bloque de Press.
            press_block = page.locator('[data-testid="exercise-block"]', has_text="Press de pecho con barra")
            apply_btn = press_block.locator("button", has_text="Aplicar −2,5 kg")
            if apply_btn.count() == 0:
                errors.append("El chip de bajada no está dentro del bloque de Press")
            else:
                # El importe del mensaje se localiza igual que el del botón: medio kilo
                # debe verse "2,5" con coma en es-ES, nunca "2.5".
                if "Baja 2,5 kg — RPE muy alto." not in press_block.inner_text():
                    errors.append(
                        f"El mensaje de bajada no está localizado: {press_block.inner_text()[:160]}"
                    )
                else:
                    print("OK: mensaje de bajada con decimal localizado (Baja 2,5 kg)")

                # 5) El descarte usa i18n es, no el literal inglés "Dismiss" (con el chip visible).
                dismiss_es = page.locator('button[aria-label="Descartar sugerencia"]')
                dismiss_en = page.locator('button[aria-label="Dismiss"]')
                if dismiss_en.count() > 0:
                    errors.append("El descarte del chip sigue usando el literal inglés 'Dismiss'")
                elif dismiss_es.count() == 0:
                    errors.append("No se encontró el descarte del chip con la clave i18n 'Descartar sugerencia'")
                else:
                    print("OK: el descarte del chip usa la clave i18n (Descartar sugerencia)")

                assert wait_for_no_overlay(page)
                apply_btn.first.click(timeout=5000)
                page.wait_for_timeout(800)
                store = read_store(page)
                sets_a = store["exercises"][0]["sets"]
                pending = [s for s in sets_a if not s["completed"]]
                if pending and pending[0]["weightKg"] != 57.5:
                    errors.append(f"El peso pendiente no bajó a 57.5: {pending}")
                else:
                    print("OK: serie pendiente fijada en 57.5 kg (objetivo absoluto)")
                page.wait_for_timeout(400)
                if press_block.locator("button", has_text="Aplicar −2,5 kg").count() > 0:
                    errors.append("El chip de bajada sigue visible tras aplicarlo")
                else:
                    print("OK: el chip de bajada desaparece al aplicarlo")

            # 3) Las completadas y el warmup no se tocaron al aplicar el peso.
            store = read_store(page)
            sets_a = store["exercises"][0]["sets"]
            if any(s["completed"] and s["weightKg"] != 60 for s in sets_a):
                errors.append("Se modificó una serie completada al aplicar peso")
            else:
                print("OK: las series completadas conservan su peso")

            # 4) F122: sin evidencia no hay propuesta de peso (ni «Sugerido» ni «Escalada»).
            body = page.inner_text("body")
            if "Sugerido:" in body:
                errors.append("'Sugerido' sigue existiendo (F122 lo reemplazó por la propuesta del día)")
            elif "Escalada" in body:
                errors.append("Aparece una propuesta de escalada sin evidencia en el seed")
            else:
                print("OK: sin «Sugerido» y sin escalada (F122: silencio sin evidencia)")

            # 6) El input de peso es de texto con inputmode=decimal (F97.5), no type=number.
            decimal_weights = page.locator('input[inputmode="decimal"][aria-label="Peso en kg"]')
            number_weights = page.locator('input[type="number"][aria-label="Peso en kg"]')
            if decimal_weights.count() == 0 or number_weights.count() != 0:
                errors.append(
                    f"Inputs de peso incorrectos: decimal={decimal_weights.count()} number={number_weights.count()}"
                )
            else:
                print(f"OK: {decimal_weights.count()} inputs de peso en text/inputmode=decimal")

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
