# Requisitos del sistema — GymLab (ejecutar el proyecto)

Documento único con TODO lo necesario para ejecutar el proyecto en cualquier SO
(Linux/Pop!_OS y Windows), con versiones verificadas, configuración, variables de
entorno y comandos de verificación.

> Proyecto: React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 4 + Capacitor 8 (PWA)
> Complementa: `docs/MULTIPLATAFORMA.md` (flujo de trabajo entre dispositivos).

---

## 1. Resumen de requisitos

| Herramienta | Versión mínima | Versión usada (verificada) | ¿Obligatorio? |
|---|---|---|---|
| Node.js | 20.19+ / 22.12+ (Vite 8) | **v24.13.1** | ✅ app |
| npm | 10+ | **11.8.0** | ✅ app |
| Git | 2.40+ | **2.43.0** | ✅ repo |
| Python 3 | 3.10+ | **3.12.3** | ✅ e2e |
| Playwright (Python) | última | instalado | ✅ e2e |
| Java (JDK) | 17 | **17.0.18** | ⚠️ solo Capacitor/Android |
| Android SDK | platform 35+ | **NO instalado aquí** | ⚠️ solo build Android |
| GitHub CLI `gh` | 2.x | 1.63.0 (opcional) | ⬜ opcional |

Legend: ✅ imprescindible para desarrollo normal · ⚠️ solo para build nativa ·
⬜ opcional

---

## 2. Instalación paso a paso

### 2.1 Node.js + npm

Vite 8 exige **Node 20.19+ o 22.12+**. Recomendado: la misma versión en ambos SO.

**Linux (Pop!_OS / Ubuntu)**
```bash
# Opción A: apt (más antiguo; solo si cumple versión mínima)
sudo apt install nodejs npm

# Opción B (recomendada): NodeSource con versión fija 24.x
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Opción C: nvm (múltiples versiones, sin sudo)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 24
nvm use 24
```

**Windows**
```powershell
# Opción A: winget
winget install OpenJS.NodeJS.LTS
# Opción B: nvm-windows (múltiples versiones)
winget install CoreyButler.NVMforWindows
nvm install 24
nvm use 24
```

Verificar:
```bash
node --version   # v24.x
npm --version    # 11.x
```

### 2.2 Git

```bash
# Linux
sudo apt install git
# Windows
winget install Git.Git
```

Configuración por SO (evita conflictos de saltos de línea):

```bash
# Linux
git config --global core.autocrlf input
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# Windows
git config --global core.autocrlf true
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

> El repo ya incluye `.gitattributes` que normaliza a LF en ambos SO.

### 2.3 Python 3 + Playwright (tests e2e)

Los e2e usan `tests/e2e/scripts/with_server.py` (servidor local) + Playwright.

```bash
# Linux (Python 3 suele venir preinstalado)
sudo apt install python3 python3-pip
pip3 install playwright
python3 -m playwright install chromium

# Windows
winget install Python.Python.3.12
pip install playwright
python -m playwright install chromium
```

Verificar:
```bash
python3 -c "import playwright; print('playwright OK')"
```

### 2.4 Java JDK 17 (solo para Capacitor/Android)

```bash
# Linux
sudo apt install openjdk-17-jdk
# Windows
winget install EclipseAdoptium.Temurin.17.JDK
```

### 2.5 Android SDK (solo para build nativa con Capacitor)

**NO está instalado en la máquina actual** — necesario para `npm run android:sync`.
En Windows el requisito es idéntico (Android Studio + SDK).

```bash
# Ambos SO: instalar Android Studio https://developer.android.com/studio
# y desde SDK Manager instalar: Platform (API 35+), Build-Tools, Platform-Tools
```

Luego definir variables de entorno:

**Linux** (`~/.bashrc` o `~/.profile`):
```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"
```

**Windows** (PowerShell):
```powershell
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
setx PATH "$env:PATH;$env:LOCALAPPDATA\Android\Sdk\platform-tools"
```

### 2.6 GitHub CLI `gh` (opcional, para PRs)

```bash
# Linux
sudo apt install gh   # o snap install gh
# Windows
winget install GitHub.cli
gh auth login
```

---

## 3. Instalar y ejecutar el proyecto

```bash
git clone https://github.com/Yvesdefaria/GymLab.git
cd GymLab/gymlab-app
npm install          # instala dependencias (genera node_modules/)
```

### Scripts disponibles (iguales en ambos SO)

| Comando | Función |
|---|---|
| `npm run dev` | Vite dev server (puerto por defecto 5173) |
| `npm run build` | `tsc -b && vite build` → `dist/` |
| `npm test` | Vitest unit/integration (75 files / 827 tests) |
| `npm run lint` | oxlint |
| `npm run preview` | Sirve el build |
| `npm run android:sync` | `build` + `cap sync android` (requiere Android SDK) |
| `npm run android:open` | Abre el proyecto en Android Studio |

### Tests e2e

```bash
# Ejecutar un archivo e2e (levanta servidor + Playwright):
python3 tests/e2e/scripts/with_server.py tests/e2e/test_f99_home_layout.py

# Suite completa (lento):
python3 tests/e2e/scripts/with_server.py tests/e2e/test_full.py
```

Verificación completa de que TODO funciona:
```bash
cd gymlab-app
npm install
npm test          # expect: 827 tests pass
npm run build     # expect: build limpio, PWA v1.3.0
python3 tests/e2e/scripts/with_server.py tests/e2e/test_f99_home_layout.py
```

---

## 4. Variables de entorno importantes

| Variable | Valor | Necesaria para | SO |
|---|---|---|---|
| `ANDROID_HOME` | path al Android SDK | build Capacitor Android | Linux/Windows |
| `JAVA_HOME` | path del JDK 17 | build Capacitor Android | Linux/Windows |
| `CI` | `true` (opcional) | modo sin interacción en tests | ambos |

---

## 5. Comandos por SO con equivalente

| Acción | Linux | Windows |
|---|---|---|
| Matar proceso del puerto 5173 | `kill $(lsof -ti:5173)` | `netstat -ano \| findstr :5173` + `taskkill /PID <pid> /F` |
| Limpiar shots de e2e | `rm -rf tests/e2e/shots/*` | `del /q tests\e2e\shots\*` |
| Ver Java | `java -version` | `java -version` |
| Ver Node | `node --version` | `node --version` |

---

## 6. Solución de problemas

| Problema | Causa | Fix |
|---|---|---|
| `npm run build` falla con `tsc` | TS 6 estricto | `npm install` limpio (borrar node_modules y lock reiniciado) |
| Playwright: "Executable doesn't exist" | Chromium no descargado | `python3 -m playwright install chromium` |
| e2e no conecta al server | firewall/PORT | desactivar firewall local; matar procesos previos (sección 5) |
| `cap sync android` falla | falta Android SDK/JDK | instalar Android Studio + JDK 17 + `ANDROID_HOME` sección 2.5 |
| `fatal: LF will be replaced by CRLF` | normal en Windows | no es error; `git config core.autocrlf true` |
| `gh: command not found` | no instalado | sección 2.6 (opcional) |

---

## 7. Estado del entorno verificado (2026-09-14, Linux)

- Node **v24.13.1** / npm **11.8.0** ✅
- Python **3.12.3** + Playwright instalado ✅
- Git **2.43.0** ✅
- Java **17.0.18** ✅
- Android SDK ❌ pendiente (solo falta si se quiere build nativa)
- `gh` 1.63.0 presente ✅ (autenticación pendiente según uso)