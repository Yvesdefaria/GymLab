# Firma de release — Android AAB

> Guía para crear el keystore de subida y generar un AAB firmado para Play Store.
> El keystore y las contraseñas son **tuyos**: no se commitean, no se comparten y no
> se pegan en el chat. Guardalos en un gestor de contraseñas y en un backup cifrado.

## Requisitos

- Android Studio instalado (JBR en `C:\Program Files\Android\Android Studio\jbr`).
- `keytool` y `jarsigner` salen de ese JBR.
- El proyecto ya tiene `android/keystore.properties.example` y la config de Gradle que
  lee `android/keystore.properties`.

## 1. Crear el keystore

Abrí **Windows Terminal / PowerShell** y ejecutá:

```powershell
cd "C:\Users\Yves De Faria\Desktop\ProyectoGymLab\gymlab-app"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v `
  -keystore android\gymlab-release.jks `
  -alias gymlab `
  -keyalg RSA -keysize 2048 -validity 10000 -storetype JKS
```

`keytool` va a pedir:

1. **Contraseña del keystore**: elegí una contraseña larga (20+ caracteres). No la
   pierdas. Evitá `#`, `=`, `:` y `\` para que no haya que escaparla en
   `keystore.properties`.
2. **Repetir la contraseña**.
3. **Contraseña de la clave**: podés usar la misma; presioná Enter.
4. **Datos del certificado** (no son secretos; identifican la clave):
   - Nombre y apellido: `GymLab` (o tu nombre)
   - Unidad organizativa: `Mobile`
   - Organización: `GymLab`
   - Ciudad/Localidad: `Buenos Aires` (o la tuya)
   - Provincia/Estado: `Buenos Aires`
   - Código de país: `AR`

Al final tiene que decir `Generating 2,048 bit RSA key pair and self-signed
certificate...` y crear `android\gymlab-release.jks`.

> Si ya publicaste la app en Play con otra clave, **no crees una nueva**: usá el
> keystore de subida existente. Crear otra clave te impide actualizar la app.

## 2. Crear `android/keystore.properties`

Copiá el ejemplo y completá con tus contraseñas reales:

```powershell
copy android\keystore.properties.example android\keystore.properties
notepad android\keystore.properties
```

Contenido final (sin comillas):

```properties
storeFile=../gymlab-release.jks
storePassword=TU_CONTRASENA
keyAlias=gymlab
keyPassword=TU_CONTRASENA
```

`storeFile` es relativo a `android/app`, así que `../gymlab-release.jks` apunta a
`android/gymlab-release.jks`.

**No commitees** `keystore.properties` ni el `.jks`. Ya están en `android/.gitignore`.
Verificá:

```powershell
git status --short
```

No deben aparecer.

## 3. Generar el AAB firmado

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\android\gradlew.bat -p .\android bundleRelease
```

Salida esperada:

```text
BUILD SUCCESSFUL
android\app\build\outputs\bundle\release\app-release.aab
```

## 4. Verificar la firma

```powershell
& "$env:JAVA_HOME\bin\jarsigner.exe" -verify -verbose -certs `
  android\app\build\outputs\bundle\release\app-release.aab |
  Select-String "jar verified"
```

Tiene que imprimir `jar verified.`. Si dice `jar is unsigned`, Gradle no encontró
`keystore.properties` o las contraseñas no coinciden.

## 5. Subir a Play Console

1. Play Console → tu app → **Testing → Internal testing** → **Create new release**.
2. Subí `app-release.aab`.
3. Aceptá **Play App Signing** (Google guarda la clave de firma de la app; tu keystore
   es la **upload key**).
4. Completá **Data Safety**, **Privacy policy** (`https://gymlab.dev/privacidad`) y
   **Health apps**.
5. Revisá `versionCode` / `versionName` en `android/app/build.gradle` antes de subir.
   Si ya existe un build en Play, subí el `versionCode`.

## 6. Backup y seguridad

- Guardá `android/gymlab-release.jks` + `android/keystore.properties` en un gestor de
  contraseñas y en un backup cifrado fuera del repo.
- Si perdés la upload key, podés pedir un reset de upload key en Play Console, pero es
  un trámite. Si perdés la clave de firma de la app (sin Play App Signing), no podés
  actualizarla.
- Nunca commitees el `.jks`, el `.properties` ni pegues las contraseñas en el chat.

## Troubleshooting

- **`keytool` no se reconoce**: falta `$env:JAVA_HOME` o la ruta del JBR.
- **`Keystore password was incorrect`**: revisá `storePassword`/`keyPassword`.
- **`storeFile` no encontrado**: el path es relativo a `android/app`; usá
  `../gymlab-release.jks` si el keystore está en `android/`.
- **AAB sin firmar**: `bundleRelease` no leyó `android/keystore.properties`; verificá
  que exista y que las claves tengan los nombres exactos.
- **El AAB pesa ~111 MB**: está dentro del límite de Play, pero revisá los assets antes
  de la primera subida.
