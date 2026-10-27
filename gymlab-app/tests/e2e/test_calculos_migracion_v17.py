"""Migración Dexie v15 -> v17: PR como hecho por reps y volumen sin warmups.

Escenario:
  1. Un fixture HTML crea una base v15 con un workout, tres series de trabajo
     (80x5) y un warmup (40x20), y un PR viejo creado por el warmup.
  2. La app abre esa base y corre v16 (borra prs) + v17 (recrea, reconstruye y
     backfillea totalVolume).
  3. Se verifica la tabla prs, el índice compuesto y el volumen migrado.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

READ_DB_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const read = (store) => new Promise((res, rej) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
  const prs = await read('prs');
  const workouts = await read('workouts');
  const stores = [...db.objectStoreNames];
  const prsStore = db.transaction('prs', 'readonly').objectStore('prs');
  const indexNames = [...prsStore.indexNames];
  const idx = prsStore.index('[exerciseId+reps]');
  db.close();
  return { prs, workouts, stores, indexNames, unique: idx?.unique ?? null };
}"""


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 375, "height": 812})
        page.on("pageerror", lambda e: errors.append(str(e)))

        page.goto(f"{BASE}/tests/e2e/fixtures/migration-seed.html")
        page.wait_for_url("**/?migrationProbe=1", timeout=20000)
        page.wait_for_function(
            "() => document.querySelector('#root')?.children.length > 0",
            timeout=20000,
        )

        data = page.evaluate(READ_DB_JS)
        prs = data["prs"]
        workouts = data["workouts"]

        print("stores:", data["stores"])
        print("prs:", prs)
        print("workouts:", workouts)

        assert "exerciseAlias" in data["stores"], "falta la tabla exerciseAlias"
        assert "[exerciseId+reps]" in data["indexNames"], "falta el índice compuesto"
        assert data["unique"] is True, "el índice compuesto debe ser único"

        assert len(prs) == 1, f"se esperaba 1 PR, llegaron {len(prs)}"
        assert prs[0]["exerciseId"] == 7
        assert prs[0]["reps"] == 5, "el warmup de 20 reps no debe ser PR"
        assert prs[0]["weightKg"] == 80
        assert "estimated1RM" not in prs[0], "el e1RM no debe persistirse"

        assert len(workouts) == 1
        assert workouts[0]["totalVolume"] == 1200, (
            f"volumen migrado incorrecto: {workouts[0]['totalVolume']} (esperado 1200)"
        )
        assert not errors, f"pageerror: {errors}"

        browser.close()
        print("OK migración v17")


if __name__ == "__main__":
    main()
