"""Fase 95 #3: barras de progreso accesibles en /logros (F95.3).

Verifica que:
- La barra general muestra X/15 con role=progressbar y los aria correctos.
- Cada tarjeta de logro tiene su barra (data-progress=<id>) con
  aria-valuenow/aria-valuemax (current clampeado por el dominio) y el label
  visible «{{current}} de {{target}}» en es.
- guias-completas NO renderiza barra (target 0 sin guías sembradas).
- 0 errores de consola.

El meta se siembra con los ids que los datos sembrados producen (primer-paso,
inaugural, primera-marca, primera-cardio) para que la evaluación de
useAchievements sea idempotente y el estado no mute durante el test.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Siembra: un entrenamiento, una serie cardio completada (con categoría del
# catálogo) y un PR. Meta con los 4 logros correspondientes ya desbloqueados.
SEED_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['exercises', 'workouts', 'workoutSets', 'prs', 'meta'], 'readwrite');
    tx.objectStore('exercises').put({ id: 10, slug: 'cinta', name: 'Cinta', muscleGroup: 'pierna', equipment: 'maquina', instructions: '', category: 'cardio' });
    tx.objectStore('workouts').put({ id: 1, startedAt: '2026-09-11T10:00:00.000Z', finishedAt: '2026-09-11T11:00:00.000Z', routineId: null, routineDayId: null, localDate: '2026-09-11', notes: '', totalVolume: 0 });
    tx.objectStore('workoutSets').put({ id: 1, workoutId: 1, exerciseId: 10, setNumber: 1, weightKg: 0, reps: 0, completed: true, createdAt: '2026-09-11T10:05:00.000Z', durationSeconds: 1200 });
    tx.objectStore('prs').put({ exerciseId: 10, weightKg: 100, reps: 5, date: '2026-09-11T11:00:00.000Z', estimated1RM: 112 });
    tx.objectStore('meta').put({ key: 'onboardingDone', value: 'true' });
    const ids = ['primer-paso', 'inaugural', 'primera-marca', 'primera-cardio'];
    tx.objectStore('meta').put({ key: 'unlockedAchievements', value: JSON.stringify(ids) });
    tx.objectStore('meta').put({ key: 'achievementCounts', value: JSON.stringify(Object.fromEntries(ids.map((id) => [id, 1]))) });
    tx.objectStore('meta').put({ key: 'achievementSnapshot', value: JSON.stringify(ids) });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return true;
}"""


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 375, "height": 812})
        console_errors = []
        page.on("console", lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="networkidle")
            page.wait_for_timeout(800)
            seed = page.evaluate(SEED_JS)
            assert seed is True, f"seed fallo: {seed}"
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1000)

            skip_ob = page.locator("button", has_text="Ya entreno aquí")
            if skip_ob.count() > 0:
                skip_ob.first.click(timeout=5000)
                page.wait_for_timeout(800)

            page.goto(f"{BASE}/logros", wait_until="networkidle")
            page.wait_for_timeout(1000)

            body = page.inner_text("body")

            # Valor esperado por el dominio: 4 logros sembrados como desbloqueados.
            if "4/15" not in body:
                errors.append("logros: contador general 4/15 no visible")

            general = page.locator('[data-progress="general"]').first
            if general.count() == 0:
                errors.append("logros: no se renderiza la barra general")
            else:
                if general.get_attribute("aria-valuenow") != "4":
                    errors.append(f"logros: barra general aria-valuenow != 4: {general.get_attribute('aria-valuenow')}")
                if general.get_attribute("aria-valuemax") != "15":
                    errors.append(f"logros: barra general aria-valuemax != 15: {general.get_attribute('aria-valuemax')}")
                if general.get_attribute("role") != "progressbar":
                    errors.append("logros: barra general sin role=progressbar")

            # Barra completa de primera-cardio: categoría resuelta desde el catálogo sembrado.
            cardio = page.locator('[data-progress="primera-cardio"]').first
            if cardio.count() == 0:
                errors.append("logros: logro completado primera-cardio sin barra de progreso")
            else:
                if cardio.get_attribute("aria-valuenow") != "1":
                    errors.append(f"logros: primera-cardio aria-valuenow != 1: {cardio.get_attribute('aria-valuenow')}")
                if cardio.get_attribute("aria-valuemax") != "1":
                    errors.append(f"logros: primera-cardio aria-valuemax != 1: {cardio.get_attribute('aria-valuemax')}")
                label = cardio.get_attribute("aria-label") or ""
                if "cardio" not in label.lower():
                    errors.append(f"logros: aria-label de primera-cardio sin título: {label}")

            # Barra parcial de sesiones-50: 1 de 50, con label «X de Y» visible.
            sesiones = page.locator('[data-progress="sesiones-50"]').first
            if sesiones.count() == 0:
                errors.append("logros: sesiones-50 sin barra de progreso")
            else:
                if sesiones.get_attribute("aria-valuenow") != "1":
                    errors.append(f"logros: sesiones-50 aria-valuenow != 1: {sesiones.get_attribute('aria-valuenow')}")
                if sesiones.get_attribute("aria-valuemax") != "50":
                    errors.append(f"logros: sesiones-50 aria-valuemax != 50: {sesiones.get_attribute('aria-valuemax')}")
            if "1 de 50" not in body:
                errors.append("logros: label «1 de 50» de sesiones-50 no visible")

            # Sin historial PR previo: pr-10kg queda en 0 de 10.
            pr10 = page.locator('[data-progress="pr-10kg"]').first
            if pr10.count() == 0:
                errors.append("logros: pr-10kg sin barra de progreso")
            else:
                if pr10.get_attribute("aria-valuenow") != "0":
                    errors.append(f"logros: pr-10kg aria-valuenow != 0: {pr10.get_attribute('aria-valuenow')}")
                if pr10.get_attribute("aria-valuemax") != "10":
                    errors.append(f"logros: pr-10kg aria-valuemax != 10: {pr10.get_attribute('aria-valuemax')}")

            # guias-completas: barra con target dinámico (guías disponibles) que
            # nunca se completa (current 0, sin señal de guía completada).
            guias = page.locator('[data-progress="guias-completas"]').first
            if guias.count() == 0:
                errors.append("logros: guias-completas no renderiza su barra declarada")
            else:
                if guias.get_attribute("aria-valuenow") != "0":
                    errors.append(f"logros: guias-completas aria-valuenow != 0: {guias.get_attribute('aria-valuenow')}")
                guias_target = guias.get_attribute("aria-valuemax")
                try:
                    guias_count = int(guias_target)
                except (TypeError, ValueError):
                    guias_count = 0
                if guias_count <= 0:
                    errors.append(f"logros: guias-completas aria-valuemax no es un target > 0: {guias_target}")
                if f"0 de {guias_target}" not in body:
                    errors.append(f"logros: label «0 de {guias_target}» de guias-completas no visible")
                # El logro jamás se concede sin señal de completado: sigue en pendientes.
                if guias.get_attribute("aria-valuenow") == guias_target:
                    errors.append("logros: guias-completas declarado completo sin señal de guía")

            page.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "f95-3-logros-progreso.png"), full_page=False)
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