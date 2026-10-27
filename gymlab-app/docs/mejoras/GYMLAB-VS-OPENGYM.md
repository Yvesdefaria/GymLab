# GymLab vs openGym — comparación técnica

> **Qué es este documento.** Comparación entre GymLab (`ProyectoGymLab/gymlab-app`) y
> openGym (`opengym/opengym-main`), con foco en **datos y cálculos**. La capa visual se
> trata aparte porque es subjetiva y cambia con el rediseño.
>
> **Fuentes.** Análisis previo de GymLab (`docs/ARQUITECTURA-Y-CALCULOS.md`) y
> `opengym/opengym-main/ANALISIS_OPENGYM.md`. Además se verificaron muestras del código
> de openGym y de GymLab por lectura directa, sin ejecutar ninguna de las dos apps.
>
> **Fecha.** 2026-10-26.
>
> **Advertencia de licencia.** openGym es **AGPL-3.0**. Las ideas y las fórmulas se
> pueden estudiar; **el código no se puede copiar a un producto propietario** sin
> cumplir la licencia. Todo lo que se propone reutilizar debe reimplementarse.

---

## Índice

1. [Veredicto rápido](#1-veredicto-rápido)
2. [Qué son](#2-qué-son)
3. [Arquitectura y datos](#3-arquitectura-y-datos)
4. [Cálculos: head-to-head](#4-cálculos-head-to-head)
5. [Contenido y assets](#5-contenido-y-assets)
6. [Calidad y verificación](#6-calidad-y-verificación)
7. [Diseño e i18n](#7-diseño-e-i18n)
8. [Seguridad, privacidad y licencia](#8-seguridad-privacidad-y-licencia)
9. [Deuda comparada](#9-deuda-comparada)
10. [Qué debería copiar cada uno](#10-qué-debería-copiar-cada-uno)
11. [Comparación de los dos documentos](#11-comparación-de-los-dos-documentos)
12. [Conclusión](#12-conclusión)
13. [Preguntas comparativas](#13-preguntas-comparativas)

---

## 1. Veredicto rápido

| Dimensión | GymLab | openGym | Ventaja |
|---|---|---|---|
| Tesis | Local-first, cero infra, app de consumo | Self-hosted, multi-dispositivo, datos del usuario | Empate: productos distintos |
| Backend | Ninguno | Node `http` + JSON atómico | openGym |
| Datos | IndexedDB, 28 tablas, 15 migraciones | Documento JSON por usuario, sin schema version | GymLab en evolución; openGym en sync |
| Sync multi-dispositivo | No | `_rev` + `_wid` + stamps + tombstones + merge | openGym |
| Auth | No | Passkeys, contraseña, device link | openGym |
| Motor de fuerza | 1 motor adaptativo | 6 políticas + deload optimizado | openGym |
| 1RM | Brzycki + Epley, con bugs | 7 fórmulas + ensemble + confianza | openGym |
| Fatiga/recuperación | Score de readiness | Modelo por músculo con RIR y vida media | openGym |
| Discos | Greedy simple | Greedy + DP + inventario | openGym |
| Balance estructural | No | Poliquin, Thibaudeau, ATG | openGym |
| Calculadoras de salud | IMC, TDEE, macros, agua, Navy, JP, ratios | No tiene | GymLab |
| Nutrición, pasos, logros, retos | Sí | No tiene | GymLab |
| Catálogo | 873 ejercicios, 1.746 fotos | 5.632 reales + 922 variantes, 212 MB | openGym |
| Idiomas | 2 (es/en) tipados | 17 packs, RTL | openGym en alcance; GymLab en tipado |
| Tests | 192 unit + 109 e2e | 446 frontend + API/MCP | openGym |
| CI | No hay | 8 workflows GH + GitLab + SBOM | openGym |
| IA/MCP | No | AI Coach + 9 tools MCP | openGym |
| Privacidad | Local-first, telemetría ON por defecto | Sin telemetría, self-hosted | openGym |
| Licencia | Propietaria | AGPL-3.0 | Depende del objetivo |

**Resumen:** openGym es el proyecto más maduro en **ciencia del entrenamiento y
sistemas**; GymLab es el más maduro en **superficie de producto y mantenibilidad**,
pero tiene bugs de cálculo que hay que corregir antes de presumir de datos.

---

## 2. Qué son

**GymLab** es una app de consumo local-first: entrenamiento + cuerpo + nutrición +
pasos + calculadoras + guías + logros, todo en IndexedDB, sin cuenta, con backup JSON.
Su objetivo es publicarse en Play Store/App Store vía Capacitor. Está en pleno rediseño
visual “Nocturno Minimal”.

**openGym** es un tracker self-hosted para usuarios técnicos: dos contenedores
(`api` + `web`), passkeys, sincronización multi-dispositivo, catálogo enorme con media,
AI Coach y servidor MCP. Su tesis es que los datos deben sobrevivir al proveedor; por eso
no hay telemetría ni cuenta en terceros.

No compiten por el mismo usuario. GymLab compite con Hevy/Strong; openGym compite con
“mi servidor en casa”.

---

## 3. Arquitectura y datos

| Aspecto | GymLab | openGym |
|---|---|---|
| Frontend | React 19 + TypeScript + Tailwind + Zustand | React 19 + JavaScript + CSS a mano + Zustand |
| Persistencia | Dexie/IndexedDB normalizada | JSON por usuario en disco |
| Capas | `domain` puro → repos → hooks → UI | `lib` puro → store → vistas |
| Migraciones | 15 versiones incrementales | Sin versión de schema |
| Backup | Export/import JSON de 28 tablas | Carpeta `./data` + `.bak` por guardado |
| Concurrencia | No aplica (un dispositivo) | Optimista con `_rev`/`_wid`, stamps lógicos y tombstones |
| Despliegue | PWA + Capacitor | Docker, Kubernetes, Helm, nginx |
| Auth | No | WebAuthn + password + device link |

**Lo importante:** openGym resolvió el problema difícil (sync con conflictos) y lo
documenta con honestidad; GymLab resolvió el problema opuesto (cero infra, cero cuenta) y
tiene un modelo relacional más limpio y tipado. Si GymLab algún día quiere
multi-dispositivo, el modelo de openGym es la referencia; pero su esquema normalizado
haría ese merge bastante más caro que el documento único de openGym.

**Integridad de datos:** GymLab gana en evolución de schema (15 migraciones tipadas);
openGym gana en concurrencia y recuperación (`.bak`, escritura atómica, no arranca si no
puede leer). Empate técnico con riesgos distintos.

---

## 4. Cálculos: head-to-head

### 4.1 1RM: openGym gana claramente

| | GymLab | openGym |
|---|---|---|
| Fórmulas | Brzycki (PRs) + Epley (calculadora) | 7: Epley, Brzycki, Lombardi, O’Conner, Mayhew, Wathan, Lander |
| Modo | Una fórmula por contexto | Fórmula única o **ensemble ponderado** con tabla RIR |
| Límite de reps | 0 recién a 37; a 36 devuelve `peso × 36` | **12 reps** (15 en ensemble) y devuelve `null` |
| Confianza | No tiene | `calculate1RMAccuracy` con decaimiento por reps, RIR y dispersión |
| Asistidas | No distingue | Devuelve `null` (no hay 1RM que estimar) |
| Por lado | No distingue | Lee cada lado completo |
| Mancuernas | Peso registrado tal cual | Normaliza “cada una” vs “total” |

El análisis de openGym trae un **oráculo numérico** (sección 12): con 100 kg × 10, las
siete fórmulas van de **125,0 a 134,7 kg**. Esa dispersión es exactamente lo que GymLab
no está midiendo hoy. Y el bug H2 de GymLab (36 reps → 720 kg de e1RM) es impensable en
openGym: rechaza el set.

**Para GymLab:** adoptar el cap de reps y el rechazo explícito es una corrección de
correctness, no una feature.

### 4.2 Progresión: openGym es un motor; GymLab es un recomendador

La diferencia conceptual es la más interesante de todo el análisis:

- **openGym es prescriptivo:** parte de la prescripción del plan y de una política
  (`linear`, `greyskull`, `double`, `triple`, `time`), cuenta stalls, y decide el próximo
  peso con una razón (`why[]`). Tiene bodyweight (+1 rep, +2 por lado), asistidas con
  dirección invertida, y un deload que **resuelve un optimizador**: calcula el 1RM
  objetivo con Epley, invierte la fórmula para cada rango de reps y elige el peso de la
  grilla que más se acerca.
- **GymLab es observacional:** parte del historial real, promedia el top set de las
  últimas 5 sesiones, detecta margen por doble progresión y propone un escalón. No hay
  política por ejercicio; hay un único motor con frenos (velocidad, frescura, PR techo).

**Quién gana:** openGym en expresividad y cobertura de casos (políticas, asistidas,
bodyweight, deload fino). GymLab en simplicidad y en estar bien acotado: menos superficie,
menos estados raros, y un único camino testeado. Para un producto de consumo, el motor de
GymLab es más predecible; para un tracker serio, el de openGym es más completo.

**Lo que GymLab debería copiar:** el campo `why[]`. Un chip que dice “subí 2,5 kg” sin
explicar por qué se percibe arbitrario; openGym siempre devuelve la razón.

### 4.3 Recuperación y fatiga: openGym juega en otra liga

| | GymLab | openGym |
|---|---|---|
| Unidad | Score 0–100 de readiness | Series efectivas: **8 = 1,0** |
| Factores | Días, sueño, dolor, racha, pasos | RIR de cada serie, volumen agudo/crónico, vida media por músculo |
| Vida media | No tiene | 24 h / 30 h / 48 h según músculo |
| Fuerza retenida | No tiene | Piso 0,5, 14 días a 1,0, luego decaimiento |
| Estados | `rest/maybe/ready` | `listo/recuperando/fatigado` |
| Desentrenamiento | No tiene | `detrained < 1` |

GymLab mide **cómo te sentís** (sueño, dolor, racha). openGym mide **cuánto estímulo
acumuló cada músculo**. Son cosas distintas y podrían convivir: GymLab ya tiene el journal
de sesión y el mapa muscular; le falta el puente entre volumen y fatiga.

El propio análisis de openGym señala el punto débil de su modelo: con vida media de 48 h,
a las 24 h la fatiga queda en **0,507**, apenas por encima del umbral de 0,5. Es un borde
frágil, y lo reconocen. Eso habla bien del documento.

### 4.4 Volumen y músculos: openGym es más fisiológico

- **openGym:** `peso × reps + drops`; excluye warmups; **multiplica ×2** las mancuernas
  registradas “cada una”; pondera músculo primario 1,0 y secundario 0,4; sin mapa
  muscular reparte 1,0.
- **GymLab:** `peso × reps`; incluye warmups en algunas métricas y no en otras (H4); peso
  corporal = 0; sin peso secundario.

El `×2` de openGym es un footgun si el usuario registra el par total, y su propio doc lo
pregunta. Pero la ponderación 1,0/0,4 es más cercana a la fisiología que el “todo o nada”
de GymLab.

### 4.5 Discos: openGym gana por diseño

- **GymLab:** greedy, platos estándar, barra de 20 kg, sin inventario, tope 1.000 kg.
- **openGym:** cuartos de unidad (0,25 kg), greedy → **programación dinámica** para la
  suma exacta → si es imposible, la más cercana **por debajo** con campo `missing`.
  Inventario por usuario, barras olímpica/EZ/Smith/trap, single stack.

Para un gimnasio estándar, GymLab alcanza. Para un usuario con inventario raro, openGym es
correcto y además explica lo que falta.

### 4.6 Balance estructural: openGym tiene una feature que GymLab no

openGym compara tu rendimiento contra anclas de **Poliquin**, **Thibaudeau** y **ATG**,
normalizando peso corporal, lastrado, asistido y ratios por reps. GymLab tiene
push/pull/legs y ratios corporales (WHtR/WHR), pero no ratios de fuerza entre
levantamientos. Es una feature de analítica avanzada que encaja muy bien en un producto
como GymLab, sobre todo porque ya tiene benchmarks y estándares de fuerza.

### 4.7 Calculadoras de salud: GymLab gana por amplitud

openGym no tiene IMC, TDEE, macros, agua, Navy, Jackson-Pollock ni composición corporal.
GymLab tiene todo eso, más hueso/músculo, simetría y ratios. Es el diferenciador más claro
de GymLab.

Pero cuidado: esa amplitud es también donde están H12–H16 (umbrales de grasa
contradictorios, masa ósea con fuente débil, altura inventada, TDEE con posible doble
conteo, agua por encima de su propia fuente). **Más calculadoras exige más auditoría, no
menos.**

### 4.8 Pasos, cardio, nutrición, periodización, logros: GymLab gana por producto

openGym no tiene nutrición, pasos, logros, retos, periodización ni proyección de
objetivos. GymLab sí, y con lógica propia. Son features de retención que openGym no
intenta resolver.

### 4.9 Procedencia de las constantes: openGym documenta; GymLab todavía no

openGym cita números de issue y justifica constantes con literatura o razonamiento
explícito: 8 series = 1,0, tope de 12, vida media 24/30/48 h, RIR de Tuchscherer/RTS, rep
caps 12/15. GymLab tiene una tabla de constantes donde muchas figuran como “sin fuente
citada” (18/48/72 h, 2 %, 15 %, 60 puntos de deload, 20 puntos de push/pull, 3 sesiones de
racha).

**Esto es la diferencia más importante para el objetivo de este proyecto.** openGym no es
perfecto, pero cada número discutible tiene una historia. GymLab tiene números que
funcionan pero no siempre sabe por qué.

---

## 5. Contenido y assets

| | GymLab | openGym |
|---|---|---|
| Ejercicios | 873 (52 curados + 821) | 5.632 reales + 922 variantes femeninas |
| Fotos/media | 1.746 JPG (~94 MB) | 6.554 stills WebP (33 MB) + 6.554 clips MP4 (157 MB) |
| Idiomas del catálogo | 2 (es/en) | 17 packs; instrucciones en 15 |
| Rutinas | 68 con 1.042 items | Plantillas del usuario + plan semanal |
| Guías/papers | 36 guías + 6 papers | No tiene |
| Alimentos | 171 | No tiene |
| Logros/retos | 36 / 14 | No tiene |
| Licencia del catálogo | free-exercise-db (Unlicense) | exercisedb (MIT) + pack Gym visual; control de 180 px en CI |

openGym tiene el catálogo y la media; GymLab tiene el **contenido editorial** (rutinas,
guías, papers, nutrición). Son estrategias distintas y ambas defendibles.

---

## 6. Calidad y verificación

| | GymLab | openGym |
|---|---|---|
| Archivos de test | 192 unit + 109 e2e | 446 frontend + API + MCP |
| Líneas de test | 20,7k unit + 16,4k e2e | 66k frontend |
| Frameworks | Vitest + Testing Library + Playwright Python | Vitest + API tests + MCP tests |
| CI | No hay | 8 workflows GH + GitLab (SBOM, multi-arch, iOS) |
| TypeScript | Sí, estricto | No |
| Linter/formatter | oxlint | No |
| Estilo de test | Valores explícitos | Valores explícitos, sin snapshots |
| i18n | Tipado (es define la forma) | 17 packs, `t()` con fallback |

openGym tiene casi el triple de superficie de test y CI real. GymLab compensa con
TypeScript, capas más limpias y un dominio más fácil de testear.

### Verificación de cifras

| Dato | Valor medido |
|---|---|
| openGym `frontend/src` productivo | 87.738 líneas (269 archivos) |
| openGym tests frontend | 446 archivos / 66.082 líneas; **213 en `lib/`** |
| openGym `Workout.jsx` | 2.161 líneas |
| openGym `server.js` | 2.890 líneas |
| openGym `index.css` | 2.093 líneas |
| openGym API paths | 66 |
| GymLab `src` | 60.978 líneas TS/TSX |
| GymLab tests unit | 192 archivos / 20.686 líneas |
| GymLab e2e | 109 archivos / 16.449 líneas |
| GymLab CI | No hay workflows |

**Corrección al documento de openGym:** dice “Frontend: 213 archivos de test”. El árbol
tiene **446**; 213 es solo `frontend/src/lib`. Es un buen ejemplo de por qué un conteo
“verificado” debe declarar su alcance.

---

## 7. Diseño e i18n

- **GymLab:** tokens Tailwind, 6 paletas × 2 temas, Oswald/Barlow, Nocturno Minimal.
  2 idiomas.
- **openGym:** CSS a mano, estética iOS, 8 acentos + custom, tipografía del sistema, RTL
  real, 17 idiomas.

En diseño visual no hay ganador objetivo. En **internacionalización**, openGym está años
luz: RTL, 17 packs, carga diferida, fallback visible. GymLab tiene 2 idiomas pero claves
tipadas, que es más seguro para mantener.

---

## 8. Seguridad, privacidad y licencia

| | GymLab | openGym |
|---|---|---|
| Superficie | Ninguna (sin backend) | Servidor propio, auth, push, media, coach |
| Privacidad | Datos en el dispositivo; telemetría ON por defecto | Sin telemetría; datos en tu servidor |
| Auth | No aplica | Passkeys, CSRF, throttle, audit, SSRF guard |
| Riesgo principal | Pérdida del dispositivo | Mal configurado, EXIF, passkeys sin throttle |
| Licencia | Propietaria | AGPL-3.0 |

**Advertencia de licencia:** openGym es **AGPL-3.0**. Podés estudiar las fórmulas y los
conceptos, pero **no podés copiar código AGPL a un producto propietario** sin cumplir la
licencia (liberar el tuyo bajo AGPL). Las ideas matemáticas no son copyrighteables; la
implementación sí. Si querés reutilizar el motor de recuperación o el ensemble de 1RM, hay
que reimplementarlo, no pegarlo.

En privacidad, openGym es más estricto por diseño: no hay telemetría. GymLab dice
“local-first” pero manda Sentry/PostHog si el usuario no lo apaga (default ON). No es una
contradicción, pero sí una decisión que conviene revisar antes de Play Store.

---

## 9. Deuda comparada

| GymLab | openGym |
|---|---|
| H1: warmups pueden crear PR | `catalogue/media` commiteado (190 MB) |
| H2: Brzycki a 36 reps | `Settings.jsx` 98 KB, `sheets.jsx` 3.487 L |
| H3: dos `estimate1RM` | `api/server.js` 2.890 L monolítico |
| H4: warmups inconsistentes | Sin TypeScript, linter ni formatter |
| H6: racha exige 3 sesiones | Umbral de fatiga 0,25 con vida media 48 h |
| H7: fatiga sin hora real | Progresión por slot de rutina (`rid`) |
| H8: proyección siempre positiva | El servidor no limpia EXIF |
| H10: restore no borra tablas vacías | `db.json` sin versión de schema |
| Sin CI | README desactualizado vs 1.4.2 |
| PWA documentada como liability | 5 MiB de body para todo el estado |

Ninguno de los dos es “el bueno y el malo”: son deudas de proyectos en etapas distintas.

---

## 10. Qué debería copiar cada uno

**GymLab ← openGym (reimplementando, no pegando):**

1. Cap de reps y rechazo explícito en 1RM.
2. Ensemble/confianza (aunque sea una versión simple: Epley + Brzycki + confianza).
3. Modelo de fatiga por músculo con RIR y vida media.
4. Deload con optimizador en vez de −10 % fijo.
5. Discos con DP e inventario del usuario.
6. Balance estructural (Poliquin/ATG) como feature de analítica.
7. `why[]`: explicar cada sugerencia.
8. Oráculo numérico en los tests.
9. CI con SBOM y build multi-arch (aunque sea solo para el APK).
10. Importadores FitNotes/Apple Health (hoy solo Strong/Hevy/JEFIT).

**openGym ← GymLab:**

1. TypeScript + i18n tipado.
2. Capas domain/repo/hooks.
3. Calculadoras de salud (IMC, TDEE, macros, Navy, JP, agua).
4. Nutrición, pasos, logros, retos como módulos independientes.
5. Migraciones de schema versionadas.
6. Empaquetado PWA/Capacitor más simple.
7. Telemetría con scrub, si algún día la quiere (hoy no la quiere, y es válido).

---

## 11. Comparación de los dos documentos

| | `ARQUITECTURA-Y-CALCULOS.md` (GymLab) | `ANALISIS_OPENGYM.md` |
|---|---|---|
| Líneas | 933 | 970 |
| Enfoque | Producto + cálculos + constantes | Sistemas + cálculos + backend |
| Evidencia | Nombres de función y archivo | `path:line` en muchas afirmaciones |
| Resumen ejecutivo | No | Sí |
| Números del repo | Dispersos | Tabla dedicada |
| Tabla de constantes | Sí, explícita | Implícita |
| Hallazgos | H1–H17 | Tabla de 12 riesgos |
| Preguntas | ~69 con P1/P2/P3 | 65 con `[código]/[test]/[producto]` |
| Oráculo numérico | No | Sí, sección 12 |
| Plan de auditoría | Sí, 3 fases | No |
| Backend | No aplica | Sección completa |
| Precisión | Alta en lo que afirma | Alta, con un conteo mal etiquetado (213 vs 446) |

**Lo que el documento de openGym hace mejor:** el **oráculo numérico**. Es la pieza que le
falta al de GymLab: valores calculados a mano como referencia independiente. Sin eso, un
test puede estar de acuerdo con el bug.

**Lo que el documento de GymLab hace mejor:** la **tabla de constantes** y el **plan de
auditoría**. openGym discute constantes dentro del texto, pero no las lista en un solo
lugar con “fuente / heurística / sin respaldo”.

**Lo que ambos hacen igual de bien:** separar lo visual de lo numérico y decir
explícitamente que lo primero es subjetivo.

**Lo que ambos hacen igual de mal:** quedarse en prosa. El siguiente paso no es otro
documento: es un test por hallazgo.

---

## 12. Conclusión

- Si la pregunta es **“¿qué motor de entrenamiento es más serio?”**: openGym, sin duda.
  1RM, progresión, fatiga, discos y balance estructural están un escalón above.
- Si la pregunta es **“¿qué producto está más cerca de un usuario común?”**: GymLab.
  Nutrición, pasos, logros, calculadoras, guías, PWA y Capacitor ya están; openGym no
  intenta eso.
- Si la pregunta es **“¿qué código es más mantenible?”**: GymLab. TypeScript, capas,
  dominio puro y 2 idiomas tipados. openGym paga su potencia con archivos de 3.500 líneas
  y JavaScript sin red.
- Si la pregunta es **“¿qué cálculos puedo creer hoy?”**: openGym en fuerza/fatiga/discos;
  GymLab en salud/nutrición, con las salvedades H12–H16.
- Si la pregunta es **“¿qué debería hacer GymLab ahora?”**: corregir H1–H4
  (PR/e1RM/warmups) antes de agregar cualquier feature nueva. Es la deuda que contamina
  todo lo demás: PRs, gráficos, proyecciones, logros y comparador.

---

## 13. Preguntas comparativas

1. **¿GymLab debe adoptar el cap de 12/15 reps de openGym o mantener Brzycki hasta 36?**
   ¿Qué hace hoy con un set de 20 reps al fallo: lo descarta o lo usa?
2. **¿El ensemble de 7 fórmulas reduce el error o solo da una falsa sensación de
   precisión?** ¿Hay evidencia fuera de openGym?
3. **¿La progresión por ejercicio de GymLab o por slot de rutina de openGym representa
   mejor al usuario?** ¿Qué pasa si el mismo ejercicio está en dos rutinas con reps
   distintas?
4. **¿El modelo de fatiga de openGym es trasladable a GymLab sin RIR masivo?** ¿Qué pasa
   con los usuarios que no registran RIR?
5. **¿La racha de GymLab debe adaptarse al plan (2/3/4 días) o quedarse en 3 fijos?**
6. **¿El volumen de peso corporal debe contar?** Si sí, ¿por reps, por tiempo o por peso
   del usuario?
7. **¿El deload de GymLab debe ser −10 % fijo o resolver el peso como openGym?** ¿Cuál es
   más predecible para el usuario?
8. **¿Vale la pena el DP de discos en GymLab o alcanza greedy + “faltan X kg”?**
9. **¿El balance estructural (Poliquin/ATG) es una feature que GymLab debería tener?** Ya
   tiene benchmarks y estándares de fuerza; es el siguiente paso natural.
10. **¿Cómo se compara la integridad de datos entre IndexedDB+15 migraciones y JSON+sync?**
    ¿Qué pasa si GymLab agrega multi-dispositivo?
11. **¿Qué constantes de GymLab tienen fuente y cuáles son heurísticas?** La tabla de la
    sección 8 del documento de GymLab ya marca 20+; falta decidir cuáles se documentan y
    cuáles se cambian.
12. **¿GymLab debe mantener la telemetría ON por defecto?** openGym demuestra que un
    producto de fitness puede vivir sin telemetría; GymLab dice ser local-first.
