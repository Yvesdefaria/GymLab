"""Levanta un server de Vite (dev o preview del build), ejecuta un test_*.py y lo apaga.

Uso:
    python scripts/with_server.py test_f43.py
    python scripts/with_server.py test_f43.py --port 5173
    python scripts/with_server.py test_f43.py --mode preview   # sirve dist/ (build)

Reutiliza un servidor ya corriendo en el puerto; si no existe, lo arranca
y lo mata al terminar (tambien en Windows vía taskkill del arbol de procesos).
El puerto se expone al test como variable de entorno E2E_PORT.
El modo `preview` mide el bundle de producción (requiere `npm run build` previo);
el modo `dev` es el predeterminado para el resto de tests e2e.
"""
import argparse
import os
import socket
import subprocess
import sys
import time

DEFAULT_PORT = 5173
PREVIEW_PORT = 4173
MODES = ("dev", "preview")


def wait_for_server(port, timeout=60):
    # Vite escucha en "localhost" (a veces solo IPv6 ::1); probar ambos hosts.
    hosts = ("127.0.0.1", "::1")
    deadline = time.time() + timeout
    while time.time() < deadline:
        for host in hosts:
            try:
                with socket.create_connection((host, port), timeout=1):
                    return True
            except OSError:
                continue
        time.sleep(0.5)
    return False


def start_dev_server(port, mode="dev"):
    env = {**os.environ, "BROWSER": "none"}
    if mode == "preview":
        # Sirve dist/ (build de producción): medidas reales, estables frente al
        # pre-bundle/parse del graph ESM de dev que infla los tiempos en frío.
        npm_args = ["run", "preview", "--", "--port", str(port), "--strictPort"]
    else:
        npm_args = ["run", "dev", "--", "--port", str(port), "--strictPort"]
    if os.name == "nt":
        cmd = ["cmd", "/c", "npm", *npm_args]
    else:
        cmd = ["npm", *npm_args]
    return subprocess.Popen(cmd, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def stop_dev_server(proc):
    if proc is None:
        return
    if os.name == "nt":
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
    else:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("test", help="ruta al archivo test_*.py")
    ap.add_argument("--port", type=int, default=None)
    ap.add_argument("--mode", choices=MODES, default="dev")
    args = ap.parse_args()

    if not os.path.exists(args.test):
        print(f"FALLO: no existe el test {args.test}", file=sys.stderr)
        return 1

    port = args.port or (PREVIEW_PORT if args.mode == "preview" else DEFAULT_PORT)

    already_up = wait_for_server(port, timeout=3)
    proc = None
    if not already_up:
        print(f"Arrancando server {args.mode} en :{port}...")
        proc = start_dev_server(port, args.mode)
        if not wait_for_server(port, timeout=90):
            print(f"FALLO: el server {args.mode} no respondio a tiempo", file=sys.stderr)
            stop_dev_server(proc)
            return 1
    else:
        print(f"Reutilizando server {args.mode} ya activo en :{port}")

    env = {**os.environ, "E2E_PORT": str(port)}
    code = subprocess.call([sys.executable, args.test], env=env)

    stop_dev_server(proc)
    return code


if __name__ == "__main__":
    sys.exit(main())
