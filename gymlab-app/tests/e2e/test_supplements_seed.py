"""Regresión: /suplementos no debe tumbar la app al sembrar (bug de liveQuery).

Contexto del bug: `useSupplements` llamaba a `ensureSeeded()` (que ESCRIBE) DENTRO
del querier de `useLiveQuery`. Dexie 4 prohíbe escrituras en un querier de liveQuery
y lanza `ReadOnlyError: Readwrite transaction in liveQuery context`. La excepción no
se captura y no hay ErrorBoundary, así que React desmonta el árbol completo: la app
queda en PANTALLA NEGRA. Solo dispara con la tabla `supplements` VACÍA (instalación
limpia / primer arranque), que es exactamente el estado de un usuario nuevo.

IMPORTANTE — modo de ejecución: el fallo NO se reproduce con el dev server (Vite
sirve dexie como ESM sin empaquetar y el zone-tracking de Dexie no marca el contexto
readonly). Hay que correrlo contra el bundle de producción:

    npm run build
    python tests/e2e/scripts/with_server.py tests/e2e/test_supplements_seed.py --mode preview

Escenarios:
1) Con la tabla `supplements` vacía, /suplementos renderiza (el árbol de React NO se
   desmonta) y no hay errores de consola ni pageerror.
2) El seed efectivamente corre y deja filas en la tabla (la lista se puebla sin recargar:
   el liveQuery reacciona a la escritura).
3) El marcado diario de un suplemento no vuelve a tumbar la app (escritura legítima
   desde un handler, fuera del querier).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "4173")
BASE = f"http://localhost:{PORT}"

# Marca el onboarding como hecho para que la app no redirija a /onboarding.
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

# Deja la tabla de suplementos VACÍA: el escenario que dispara el bug.
EMPTY_SUPPLEMENTS_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const cleared = await new Promise((res, rej) => {
    const tx = db.transaction('supplements', 'readwrite');
    const req = tx.objectStore('supplements').clear();
    req.onsuccess = () => res(true);
    req.onerror = () => rej(req.error);
  });
  db.close();
  return cleared;
}"""

COUNT_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const n = await new Promise((res) => {
    const req = db.transaction('supplements', 'readonly').objectStore('supplements').count();
    req.onsuccess = () => res(req.result);
    req.onerror = () => res(-1);
  });
  db.close();
  return n;
}"""


def main():
    errors = []
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
            # Arranca la app una vez para que Dexie cree el schema completo.
            page.goto(BASE, wait_until="networkidle")
            assert page.evaluate(META_JS) is True, "no se pudo marcar el onboarding"
            assert page.evaluate(EMPTY_SUPPLEMENTS_JS) is True, "no se pudo vaciar supplements"

            # Recarga DIRECTA a /suplementos con la tabla vacía: aquí explotaba el seed.
            console_errors.clear()
            page.goto(f"{BASE}/suplementos", wait_until="networkidle")
            page.wait_for_timeout(3000)

            # 1) El árbol de React sigue montado (sin ErrorBoundary un fallo = pantalla negra).
            root_children = page.evaluate(
                "() => { const r = document.getElementById('root'); return r ? r.children.length : -1 }"
            )
            if root_children <= 0:
                errors.append(
                    f"la app quedó desmontada (root children={root_children}): pantalla negra"
                )
            else:
                print(f"OK: el árbol de React sigue montado (root children={root_children})")

            body = page.inner_text("body")
            if len(body.strip()) == 0:
                errors.append("el body quedó vacío (pantalla negra)")
            else:
                print(f"OK: /suplementos renderiza contenido ({len(body)} chars)")

            # 2) El seed corrió y la lista se pobló sin recargar.
            count = page.evaluate(COUNT_JS)
            if not isinstance(count, int) or count <= 0:
                errors.append(f"el seed no dejó filas en supplements (count={count})")
            else:
                print(f"OK: el seed dejó {count} filas en supplements")

            if "Creatina" not in body:
                errors.append("la lista no muestra los suplementos sembrados en pantalla")
            else:
                print("OK: los suplementos sembrados se ven en la lista")

            # 3) Escritura legítima desde un handler: marcar el check diario no debe romper.
            # El check es el unico `button[aria-pressed]` de la lista (independiente del idioma).
            checks = page.locator("button[aria-pressed]")
            if checks.count() == 0:
                errors.append("no se encontraron los checks diarios (button[aria-pressed])")
            else:
                before = checks.first.get_attribute("aria-pressed")
                checks.first.click(timeout=5000)
                page.wait_for_timeout(1200)
                after = checks.first.get_attribute("aria-pressed")
                if before != "false" or after != "true":
                    errors.append(
                        f"el check diario no persistio (before={before}, after={after})"
                    )
                else:
                    print(f"OK: el check diario persiste y la lista reacciona ({before} -> {after})")

                root_after = page.evaluate(
                    "() => { const r = document.getElementById('root'); return r ? r.children.length : -1 }"
                )
                if root_after <= 0:
                    errors.append("la app se desmonto al marcar el check diario")
                else:
                    print(f"OK: marcar el check diario no desmonta la app (root children={root_after})")

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
    print("ALL OK")


if __name__ == "__main__":
    main()
