"""F103 smoke: recorre TODAS las rutas de src/app/router.tsx con la DB VACÍA.

Objetivo de la fase 103: detectar rutas que rompen la app (pantalla negra / árbol
desmontado) o que quedan colgadas, arrancando desde una instalación limpia. El
caso histórico conocido es `/suplementos` con la tabla `supplements` vacía
(ReadOnlyError de Dexie al sembrar dentro del liveQuery). Acá se cubre ese caso
y TODAS las demás rutas del router, incluidas:

- rutas dinámicas con slug/id INEXISTENTE (`/entrenamiento/:id`, `/rutinas/:slug`,
  `/rutinas/:slug/editar`, `/papers/:slug`, `/guias/:slug`, `/ejercicios/:slug`);
- redirects (`/calculadoras/macros` -> `/calculadoras/calorias`) y catch-all
  (`*` -> `/`), verificando la URL final;
- una ruta de control con datos estáticos reales por cada catálogo.

Antes de CADA ruta se vacían todos los object stores de `GymLabDB` menos `meta`
y se borra `meta.seedVersion` (dejando solo `onboardingDone` para que no aparezca
el wizard), de modo que cada ruta se visita como un PRIMER ARRANQUE real: la app
corre el reseeder completo y los catálogos quedan disponibles en ese boot.
Preservar `seedVersion` con los stores vacíos sería un estado inconsistente que no
existe en producción (la app saltearía el reseed y los detalles mostrarían "no
encontrado").

Por ruta se registra: URL final, pageerrors (mensajes), console.errors,
`document.getElementById('root').children.length`, si el body tiene texto
(con snippet) y el tiempo de carga. Sale con código 1 si alguna ruta queda en
pantalla negra o lanza un pageerror.

Uso (mismo harness que el resto de la suite):
    python tests/e2e/scripts/with_server.py tests/e2e/test_f103_smoke.py
    npm run build && python tests/e2e/scripts/with_server.py tests/e2e/test_f103_smoke.py --mode preview

Nota: en dev server el crash de Dexie puede no reproducirse (Vite sirve dexie como
ESM sin empaquetar y el zone-tracking no marca el contexto readonly); el modo
preview mide el bundle real.
"""
import os
import sys
import time
from urllib.parse import urlsplit

sys.path.insert(0, os.path.dirname(__file__))

from playwright.sync_api import sync_playwright

PORT = os.environ.get("E2E_PORT", "5173")
BASE = f"http://localhost:{PORT}"

# Marca el onboarding como hecho para que no se superponga el wizard (mismo
# approach que test_preload_recovery.py / test_supplements_seed.py).
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

# Deja la DB "como recién instalada": limpia todos los stores menos `meta` y
# borra `seedVersion` (deja solo `onboardingDone`) para que el próximo boot corra
# el reseeder completo, igual que una instalación limpia.
RESET_DB_JS = """async () => {
  const openDb = () => new Promise((res, rej) => {
    const r = indexedDB.open('GymLabDB');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const db = await openDb();
  const stores = Array.from(db.objectStoreNames).filter((s) => s !== 'meta');
  if (stores.length === 0) { db.close(); return 0; }
  await new Promise((res, rej) => {
    const tx = db.transaction(stores, 'readwrite');
    for (const s of stores) tx.objectStore(s).clear();
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta'], 'readwrite');
    tx.objectStore('meta').delete('seedVersion');
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  db.close();
  return stores.length;
}"""

COUNT_SUPPLEMENTS_JS = """async () => {
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

# (ruta, path final esperado o None, etiqueta). Cubre las 43 entradas del router:
# rutas fijas, dinámicas (con slug/id inexistente para forzar el estado vacío),
# redirect y catch-all.
ROUTES = [
    ("/", None, "home"),
    ("/entrenamiento/active", None, "sesión activa"),
    ("/entrenamiento/smoke-f103", None, "sesión por id inexistente"),
    ("/rutinas", None, "catálogo de rutinas"),
    ("/estadisticas", None, "estadísticas"),
    ("/rutinas/nueva", None, "crear rutina"),
    ("/rutinas/planificador", None, "planificador"),
    ("/rutinas/smoke-f103/editar", None, "editar rutina inexistente"),
    ("/rutinas/smoke-f103", None, "detalle de rutina inexistente"),
    ("/papers", None, "catálogo de papers"),
    ("/papers/volume-vs-intensity-hypertrophy", None, "detalle de paper real"),
    ("/mas", None, "hub Más"),
    ("/pasos", None, "pasos"),
    ("/ajustes", None, "ajustes"),
    ("/wearables", None, "wearables"),
    ("/perfil", None, "perfil"),
    ("/peso-corporal", None, "peso corporal"),
    ("/calendario", None, "calendario"),
    ("/cuerpo", None, "cuerpo y fatiga"),
    ("/guias", None, "catálogo de guías"),
    ("/guias/progresion-sobrecarga", None, "detalle de guía real"),
    ("/calculadoras", None, "hub calculadoras"),
    ("/calculadoras/imc", None, "calculadora IMC"),
    ("/calculadoras/calorias", None, "calculadora calorías"),
    ("/calculadoras/macros", "/calculadoras/calorias", "redirect macros"),
    ("/calculadoras/1rm", None, "calculadora 1RM"),
    ("/calculadoras/agua", None, "calculadora agua"),
    ("/calculadoras/conversor", None, "calculadora conversor"),
    ("/calculadoras/medidas", None, "medidas corporales"),
    ("/calculadoras/grasa", None, "grasa corporal"),
    ("/calculadoras/navy", None, "método Navy"),
    ("/ejercicios", None, "biblioteca de ejercicios"),
    ("/ejercicios/sentadilla-con-barra", None, "detalle de ejercicio real"),
    ("/timer", None, "timer"),
    ("/nutricion", None, "nutrición"),
    ("/suplementos", None, "suplementos (DB vacía)"),
    ("/progreso-fotos", None, "progreso fotos"),
    ("/progreso-fotos/comparar", None, "comparar fotos"),
    ("/logros", None, "logros"),
    ("/terminos", None, "términos"),
    ("/privacidad", None, "privacidad"),
    ("/objetivos", None, "objetivos"),
    ("/ruta-inexistente-f103", "/", "catch-all"),
]

SETTLE_MS = 1500  # margen tras aparecer texto para capturar errores async (Dexie/liveQuery)


def main():
    errors = []
    results = []
    browser = None

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()

        bucket = {"pageerrors": [], "console": []}
        page.on("pageerror", lambda e: bucket["pageerrors"].append(str(e)))
        page.on(
            "console",
            lambda m: bucket["console"].append(f"console.{m.type}: {m.text}") if m.type == "error" else None,
        )

        try:
            # Arranque con la DB vacía: la app crea el schema y se marca el onboarding.
            page.goto(BASE, wait_until="load", timeout=60000)
            assert page.evaluate(META_JS) is True, "no se pudo marcar el onboarding"
            print(f"OK: onboarding marcado como hecho (DB recién creada) en {BASE}")

            for idx, (route, expected_path, label) in enumerate(ROUTES, start=1):
                row = {"route": route, "label": label, "pageerrors": [], "console": [], "notes": []}
                url = ""
                root_children = -1
                body_len = -1
                snippet = ""
                spinner = None
                load_ms = 0

                try:
                    # Cada ruta se visita con la DB vacía (stores limpios, meta intacto).
                    cleared = page.evaluate(RESET_DB_JS)
                    if not isinstance(cleared, int):
                        row["notes"].append(f"reset DB inesperado: {cleared!r}")
                except Exception as e:
                    row["notes"].append(f"reset DB falló: {e}")

                bucket["pageerrors"].clear()
                bucket["console"].clear()

                t0 = time.perf_counter()
                row["shell_mounted"] = False
                try:
                    # Carga DIRECTA del documento: valida entry, código lazy y primer render.
                    page.goto(BASE + route, wait_until="load", timeout=30000)
                    try:
                        # #contenido lo monta AppShell cuando Providers terminó de
                        # sembrar. Es la señal de que la app renderizó la ruta (el
                        # cartel "Cargando" de Providers NO cuenta como render).
                        page.wait_for_function(
                            "() => !!document.querySelector('#contenido')",
                            timeout=30000,
                        )
                        row["shell_mounted"] = True
                    except Exception:
                        row["notes"].append("no montó #contenido (Providers/AppShell) en 30s")
                    try:
                        # Texto dentro del <main>: la página lazy terminó de renderizar.
                        page.wait_for_function(
                            "() => ((document.querySelector('#contenido')?.innerText || '').trim().length > 0)",
                            timeout=15000,
                        )
                    except Exception:
                        row["notes"].append("sin texto en #contenido (página colgada o vacía)")
                    page.wait_for_timeout(SETTLE_MS)
                    load_ms = (time.perf_counter() - t0) * 1000

                    url = urlsplit(page.url).path
                    root_children = page.evaluate(
                        "() => { const r = document.getElementById('root'); return r ? r.children.length : -1 }"
                    )
                    spinner = page.evaluate("() => !!document.querySelector('.animate-spin')")
                    body_text = page.inner_text("body")
                    body_len = len(body_text.strip())
                    snippet = " ".join(body_text.split())[:100]

                    if route == "/suplementos":
                        count = page.evaluate(COUNT_SUPPLEMENTS_JS)
                        row["notes"].append(f"supplements={count}")
                except Exception as e:
                    row["notes"].append(f"Exception: {e}")

                row["url"] = url
                row["root_children"] = root_children
                row["body_len"] = body_len
                row["snippet"] = snippet
                row["spinner"] = spinner
                row["load_ms"] = round(load_ms)
                row["pageerrors"] = list(bucket["pageerrors"])
                row["console"] = list(bucket["console"])
                results.append(row)

                # Veredicto por ruta: pantalla negra / body vacío / excepción no capturada.
                hard = []
                if not row["shell_mounted"]:
                    hard.append("AppShell no montó (#contenido ausente): pantalla de carga o colgada")
                if root_children <= 0:
                    hard.append(f"root children={root_children} (árbol de React desmontado)")
                if body_len == 0:
                    hard.append("body sin texto")
                if row["pageerrors"]:
                    hard.append(f"{len(row['pageerrors'])} pageerror(s)")
                if expected_path and url != expected_path:
                    hard.append(f"redirect esperado a {expected_path}, quedó en {url}")

                if hard:
                    status = "ROTA"
                    errors.append(f"{route}: " + "; ".join(hard))
                else:
                    status = "OK"

                flags = ""
                if row["console"]:
                    flags += f" console.errors={len(row['console'])}"
                if spinner and body_len == 0:
                    flags += " spinner-visible"
                if row["notes"]:
                    flags += " " + " ".join(row["notes"])

                print(
                    f"[{idx:2d}/{len(ROUTES)}] {status:4s} {route:<38s} -> {url:<28s} "
                    f"root={root_children} body={body_len}ch load={row['load_ms']}ms{flags} [{label}]"
                )
                for pe in row["pageerrors"]:
                    print(f"         pageerror: {pe}")
                for ce in row["console"]:
                    print(f"         {ce}")

        except Exception as e:
            errors.append(f"Exception fatal: {e}")
        finally:
            page.close()
            context.close()
            browser.close()

    total = len(results)
    rotas = []
    for r in results:
        if (
            not r.get("shell_mounted", False)
            or r["root_children"] <= 0
            or r["body_len"] == 0
            or r["pageerrors"]
        ):
            rotas.append(r)
    con_console = [r for r in results if r["console"]]

    print("\n=== RESUMEN F103 SMOKE ===")
    print(f"rutas visitadas: {total}  ROTAS: {len(rotas)}  con console.error: {len(con_console)}")
    for r in rotas:
        print(f"  ROTA {r['route']} :: root={r['root_children']} body={r['body_len']} :: {r['snippet']!r}")
        for pe in r["pageerrors"]:
            print(f"    pageerror: {pe}")
    for r in con_console:
        if r not in rotas:
            print(f"  console.errors en {r['route']}: {r['console']}")

    if errors:
        print("\nERRORS:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)
    print("ALL OK")


if __name__ == "__main__":
    main()
