"""F132.2/Q3: calendario Nocturno — lunes-primero, celdas circulares, estrella de meta,
navegación solo por meses con datos y resumen de la semana.

El seed genera fechas relativas al mes actual para no atarse a octubre de 2026.
"""
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import expect, sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

MESES = {
    1: "enero",
    2: "febrero",
    3: "marzo",
    4: "abril",
    5: "mayo",
    6: "junio",
    7: "julio",
    8: "agosto",
    9: "septiembre",
    10: "octubre",
    11: "noviembre",
    12: "diciembre",
}

TODAY = datetime.date.today()
FIRST = TODAY.replace(day=1)
PREV_LAST = FIRST - datetime.timedelta(days=1)
# Programa lunes/miércoles/viernes (getDay: domingo=0).
WEEKDAYS = [1, 3, 5]


def scheduled_dates():
    dates = []
    cursor = FIRST
    while cursor <= TODAY:
        if cursor.weekday() in (0, 2, 4):  # lunes, miércoles, viernes
            dates.append(cursor)
        cursor += datetime.timedelta(days=1)
    return dates


def workout(workout_id, date, volume):
    local = date.isoformat()
    return {
        "id": workout_id,
        "startedAt": f"{local}T10:00:00.000Z",
        "finishedAt": f"{local}T11:00:00.000Z",
        "routineId": 1,
        "routineDayId": None,
        "localDate": local,
        "notes": "",
        "totalVolume": volume,
    }


def seed_js():
    dates = scheduled_dates()
    workouts = [workout(9000, PREV_LAST, 500)]
    workouts += [workout(9100 + i, date, 1000) for i, date in enumerate(dates)]
    achievements = [
        "primer-paso",
        "inaugural",
        "primer-reto",
        "racha-4",
        "racha-8",
        "primera-marca",
        "volumen-semanal",
        "sesiones-50",
        "consistencia-4s",
        "primera-cardio",
        "ejercicios-100",
        "racha-16",
        "pr-10kg",
        "guias-completas",
        "sesiones-500",
        "primer-ano",
    ]
    routine = {
        "id": 1,
        "slug": "rutina-e2e-calendario",
        "title": "Rutina E2E",
        "objective": "general",
        "level": "principiante",
        "description": "",
        "daysCount": 3,
    }
    program = {
        "id": 1,
        "routineId": 1,
        "startDate": FIRST.isoformat(),
        "weekdays": WEEKDAYS,
        "createdAt": f"{FIRST.isoformat()}T09:00:00.000Z",
    }
    return f"""async () => {{
      const openDb = () => new Promise((res, rej) => {{
        const r = indexedDB.open('GymLabDB');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      }});
      const db = await openDb();
      await new Promise((res, rej) => {{
        const tx = db.transaction(['meta', 'workouts', 'routines', 'activeProgram'], 'readwrite');
        tx.objectStore('meta').put({{ key: 'onboardingDone', value: 'true' }});
        tx.objectStore('meta').put({{ key: 'settings', value: JSON.stringify({{ language: 'es', units: 'kg' }}) }});
        tx.objectStore('meta').put({{ key: 'unlockedAchievements', value: JSON.stringify({json.dumps(achievements)}) }});
        tx.objectStore('workouts').clear();
        tx.objectStore('activeProgram').clear();
        tx.objectStore('routines').put({json.dumps(routine)});
        tx.objectStore('activeProgram').put({json.dumps(program)});
        {json.dumps(workouts)}.forEach((w) => tx.objectStore('workouts').put(w));
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      }});
      return true;
    }}"""


def wait_for_no_overlay(page, timeout_ms=8000):
    deadline = timeout_ms
    while deadline > 0:
        if page.locator("div.fixed.inset-0").count() == 0:
            return True
        page.wait_for_timeout(250)
        deadline -= 250
    return page.locator("div.fixed.inset-0").count() == 0


def main():
    errors = []
    dates = scheduled_dates()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        try:
            page.goto(BASE, wait_until="networkidle")
            assert page.evaluate(seed_js()) is True, "seed fallo"
            page.goto(f"{BASE}/calendario", wait_until="networkidle")
            page.wait_for_timeout(1200)
            assert wait_for_no_overlay(page), "un modal persistente bloquea el calendario"

            title = page.get_by_test_id("cal-month-title").inner_text().lower()
            if MESES[TODAY.month] not in title or str(TODAY.year) not in title:
                errors.append(f"título de mes inesperado: {title!r}")

            labels = page.get_by_test_id("cal-week").locator("span").all_inner_texts()
            if labels[:7] != ["L", "M", "X", "J", "V", "S", "D"]:
                errors.append(f"la semana no empieza en lunes: {labels}")

            grid = page.get_by_test_id("cal-grid")
            cells = grid.locator('[role="gridcell"]')
            if cells.count() < 28:
                errors.append(f"faltan celdas en el mes: {cells.count()}")
            first_class = cells.first.get_attribute("class") or ""
            if "rounded-full" not in first_class:
                errors.append(f"la celda no es circular: {first_class[:80]}")

            stars = grid.locator('[role="gridcell"] svg')
            if stars.count() != len(dates):
                errors.append(
                    f"estrellas de meta: esperaba {len(dates)}, hay {stars.count()}"
                )

            stats = page.get_by_test_id("cal-stats").inner_text()
            if str(len(dates)) not in stats:
                errors.append(f"el stat de entrenos no coincide: {stats!r}")
            if "100%" not in stats:
                errors.append(f"el programa no está al 100%: {stats!r}")

            next_button = page.get_by_role("button", name="Mes siguiente")
            prev_button = page.get_by_role("button", name="Mes anterior")
            expect(next_button).to_be_disabled()
            expect(prev_button).to_be_enabled()

            week = page.get_by_test_id("cal-week-list")
            expect(week).to_contain_text("Esta semana")
            if "HOY" not in week.inner_text().upper():
                errors.append("la sección semanal no marca el día de hoy")

            prev_button.click(timeout=5000)
            page.wait_for_timeout(400)
            prev_title = page.get_by_test_id("cal-month-title").inner_text().lower()
            if MESES[PREV_LAST.month] not in prev_title:
                errors.append(f"no navegó al mes anterior: {prev_title!r}")
            expect(page.get_by_role("button", name="Mes siguiente")).to_be_enabled()
            page.get_by_role("button", name="Mes siguiente").click(timeout=5000)
            page.wait_for_timeout(400)
            back_title = page.get_by_test_id("cal-month-title").inner_text().lower()
            if MESES[TODAY.month] not in back_title:
                errors.append(f"no volvió al mes vigente: {back_title!r}")
            expect(page.get_by_role("button", name="Mes siguiente")).to_be_disabled()

            if not errors:
                print(
                    f"OK: calendario lunes-primero, {len(dates)} metas, "
                    "navegación por meses con datos y semana actual"
                )
        except Exception as e:  # noqa: BLE001
            errors.append(f"Exception: {e}")
        finally:
            errors.extend(console_errors)
            page.close()
            browser.close()

    if errors:
        print("ERRORS:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)
    print("ALL OK: F132.2 calendario Nocturno")


if __name__ == "__main__":
    main()
