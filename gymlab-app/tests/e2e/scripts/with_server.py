"""Levanta el dev server de Vite, ejecuta un test_*.py y lo apaga.

Uso:
    python scripts/with_server.py test_f43.py
    python scripts/with_server.py test_f43.py --port 5173

Reutiliza un servidor ya corriendo en el puerto; si no existe, lo arranca
y lo mata al terminar (tambien en Windows vía taskkill del arbol de procesos).
El puerto se expone al test como variable de entorno E2E_PORT.
"""
import argparse
import os
import socket
import subprocess
import sys
import time

DEFAULT_PORT = 5173


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


def start_dev_server(port):
    env = {**os.environ, "BROWSER": "none"}
    if os.name == "nt":
        cmd = ["cmd", "/c", "npm", "run", "dev", "--", "--port", str(port), "--strictPort"]
    else:
        cmd = ["npm", "run", "dev", "--", "--port", str(port), "--strictPort"]
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
    ap.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = ap.parse_args()

    if not os.path.exists(args.test):
        print(f"FALLO: no existe el test {args.test}", file=sys.stderr)
        return 1

    already_up = wait_for_server(args.port, timeout=3)
    proc = None
    if not already_up:
        print(f"Arrancando dev server en :{args.port}...")
        proc = start_dev_server(args.port)
        if not wait_for_server(args.port, timeout=90):
            print("FALLO: el dev server no respondio a tiempo", file=sys.stderr)
            stop_dev_server(proc)
            return 1
    else:
        print(f"Reutilizando dev server ya activo en :{args.port}")

    env = {**os.environ, "E2E_PORT": str(args.port)}
    code = subprocess.call([sys.executable, args.test], env=env)

    stop_dev_server(proc)
    return code


if __name__ == "__main__":
    sys.exit(main())
