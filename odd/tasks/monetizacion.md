# Monetización — estrategia, canales y secuencia

- Feature: monetizacion
- Estado: propuesta (decisión del owner pendiente)
- Fecha: 2026-10-22
- Depende de: Fase 124 (telemetría, hecha), Fase 126 (legal), Fase 100 (cuentas, solo para suscripción)

## 1. Restricciones que mandan

| Restricción | Consecuencia |
|---|---|
| App **local-first**: Dexie/IndexedDB, sin backend (AGENTS.md lo prohíbe en el MVP) | No hay validación de derechos en servidor. Todo derecho vive en el dispositivo |
| Sin cuentas de usuario (Fase 100 futura) | No hay sync, no hay restauración entre dispositivos fuera de lo que dé la tienda |
| Posicionamiento público: "tus datos no salen del teléfono" (banda de privacidad en la landing) | Cualquier SDK que mande identificadores a terceros contradice el argumento de venta |
| Distribución: Play (Android), web estática en Cloudflare, iOS solo scaffolding | El canal con volumen real hoy es Android + web |
| La política **ya publicada** pre-anuncia AdMob futuro e "compra integrada para desactivar la publicidad" (ES/EN, app y web) | Si el modelo elegido es otro, hay que corregir la política (Fase 126) para que no describa algo que no existe |

## 2. Estado verificado del código (2026-10-22)

- **Cero** dependencias de monetización: no hay `admob`, ni Play Billing, ni RevenueCat, ni `@capacitor-community/*billing`. El grep sobre `src`, `android` y `package.json` no devuelve implementación, solo textos legales.
- Lo único que existe son las secciones de la política que describen monetización **futura**.
- Telemetría ya activa (Fase 124): permite medir activación y retención antes de cobrar nada.

## 3. Principios

1. **No monetizar lo esencial.** Serie, rutinas, catálogo, calculadoras e historial son el producto. Lo que se vende son extras.
2. **Nada de anuncios antes de validar pago.** Si nadie paga por el Pro, los anuncios no van a salvar el negocio; solo queman la marca.
3. **Costo operativo mínimo.** Cada canal nuevo debe evitar backend propio: tiendas como merchant of record antes que facturar nosotros.
4. **La privacidad es el activo.** Ninguna opción puede contradecirla sin una decisión explícita y firmada.
5. **Una sola fuente de derecho por plataforma**: Play Billing en Android, merchant of record en la web. Nunca las dos para el mismo derecho dentro de la misma app.

## 4. Canales evaluados

### 4.1 Afiliados (web + guías/papers de la app)

- **Qué**: enlaces a suplementos, equipamiento y libros dentro de las guías y fichas de ejercicio, con etiquetado claro de enlace afiliado.
- **Requisitos**: alta en programas (Amazon Afiliados, Awin, tiendas de suplementos), divulgación visible ("enlace afiliado"), medición con parámetros de campaña.
- **Esfuerzo**: bajo. Sin código más allá de marcar enlaces.
- **Ingreso**: céntimos al principio; compone con tráfico. Un blog/SEO de ejercicios puede rendir más que la app.
- **Riesgo**: credibilidad. Si el contenido es "basado en evidencia", un enlace a creatina barata sin contexto lo destruye.
- **Cumplimiento**: divulgación de publicidad (UE), sin cambios en privacidad si no hay tracking propio.

### 4.2 Productos digitales con merchant of record

- **Qué**: programas de entrenamiento (12 semanas), guías de nutrición, packs de rutinas, entregados como PDF o como JSON importable en la app.
- **Requisitos**: cuenta en Lemon Squeezy / Paddle / Gumroad (merchant of record: ellos facturan y liquidan IVA de la UE), página de producto, entrega automática.
- **Esfuerzo**: medio. El costo real es crear el contenido.
- **Ingreso**: €9–€19 por pack; con 100 ventas son €900–€1.900 sin tocar la app.
- **Riesgo**: piratería trivial de un JSON. Aceptable a esta escala; se puede degradar con un código de licencia si crece.
- **Cumplimiento**: términos de venta, reembolsos, renuncia expresa al desistimiento de 14 días para contenido digital (UE).

### 4.3 Donaciones

- **Qué**: Ko-fi, Buy Me a Coffee, GitHub Sponsors, en la landing y en Ajustes.
- **Esfuerzo**: mínimo.
- **Ingreso**: decenas de euros; no escala, pero valida comunidad y no cuesta nada.
- **Riesgo**: ninguno relevante.

### 4.4 Pro de pago único con Play Billing (Android)

- **Qué**: compra no consumible que desbloquea extras. Candidatos: periodización, progresión adaptativa avanzada, comparador de fotos, programas premium, exportación avanzada. **No**: series, rutinas, catálogo, calculadoras.
- **Requisitos**: Play Billing Library, `queryPurchasesAsync` al arrancar para restaurar, estado local del derecho, UI de compra y restauración, manejo de reembolsos (si Play reembolsa, hay que revocar).
- **Esfuerzo**: medio-alto (billing + gating + pruebas en dispositivo con cuentas de prueba de Play).
- **Ingreso**: es el canal con más volumen. Precio de referencia €6,99–€9,99. Play retiene **15%** del primer millón de dólares anuales y 30% por encima (verificar vigencia al implementar).
- **Riesgo**: gating mal elegido → reseñas negativas. Un derecho local es hackeable; aceptable si el precio es bajo.
- **Cumplimiento**: Play exige su sistema de facturación para bienes digitales dentro de la app (con excepciones acotadas: apps lectoras, y ofertas externas en la UE bajo reglas post-DMA que hay que verificar antes de diseñar). Data safety suma la categoría de compras que corresponda.

### 4.5 Suscripción (requiere cuentas)

- **Qué**: plan mensual/anual. El único argumento honesto en una app local-first es **backup y sync en la nube**.
- **Requisitos**: Fase 100 (cuentas + backend, hoy inexistente), validación de derechos en servidor, gestión de bajas.
- **Ingreso**: la mejor LTV, pero solo cuando el producto tenga algo recurrente que entregar.
- **Riesgo**: cobrar por algo que hoy no existe. Churn alto si el valor es sync.
- **Cumplimiento**: Play Billing para suscripciones en Android, cancelación clara, política de reembolsos.

### 4.6 Anuncios AdMob (Android)

- **Qué**: banner/interstitial en el tier gratis, con compra para quitarlos (lo que la política ya describe).
- **Requisitos**: SDK AdMob, consentimiento UMP/IAB TCF en la UE, contador de impresiones, gestión de frecuencia.
- **Ingreso**: céntimos por usuario activo al mes en un nicho; recién es relevante con miles de DAU.
- **Riesgo**: **contradice el posicionamiento**. AdMob manda el ID de publicidad y datos de uso a redes de terceros; la landing vende lo contrario. Además Data safety suma `Device or other IDs (advertising ID)` **compartido**, y la declaración de Health apps queda bajo más escrutinio.
- **Veredicto**: no hacerlo antes de validar pago, y probablemente no hacerlo nunca.

### 4.7 Anuncios en la landing (web)

- **Veredicto**: no. Rompe el diseño "Piso de gimnasio", ensucia una página que es la carta de presentación y el ingreso sería marginal.

### 4.8 B2B / white-label para entrenadores

- **Qué**: licencia para que un entrenador publique rutinas con su marca.
- **Requisitos**: cuentas, multi-tenant, backend.
- **Veredicto**: idea de fase futura, no ahora.

### 4.9 App de pago

- **Veredicto**: no. Mata la adquisición y no permite un tier gratis que demuestre valor.

## 5. Secuencia recomendada

### M1 — Afiliados + apoyo (0 infraestructura)

- Entregables: divulgación de afiliados, 5–10 enlaces contextualizados en guías/papers, página de apoyo en la landing, eventos `affiliate_click` y `support_click` en PostHog.
- Criterio: medir clics; si el CTR es 0, el problema es el tráfico, no la monetización.
- Costo: una tarde. Sin cambios legales (solo divulgación).

### M2 — Pack digital (merchant of record)

- Entregables: un programa de 12 semanas, página de venta, Lemon Squeezy/Paddle, entrega automática, términos de venta y reembolso.
- Criterio: 10 ventas en 30 días con tráfico actual; si no, el contenido no es el que la gente quiere.
- Costo: una a dos semanas, casi todo contenido.

### M3 — Pro de pago único (Android)

- Entregables: Play Billing, restauración, gating de 3–5 extras, pantalla de compra, pruebas con licencia de prueba, evento `purchase_completed`.
- Criterio: 1–3% de conversión de instalación a compra (heurística; medir antes de extrapolar).
- Dependencia: fijar la lista de extras **antes** de escribir código.

### M4 — Suscripción (solo con Fase 100)

- Entregables: cuentas, backend, sync, derechos en servidor, portal de bajas.
- Criterio: la suscripción vende sync porque sync existe y funciona.

### M5 — Anuncios (condicional, probablemente nunca)

- Solo si M3 falla y hay volumen alto; y aun así revisar el costo de marca.

## 6. Precios de referencia (heurística de mercado, no verdad revelada)

| Producto | Rango | Nota |
|---|---|---|
| Pro de pago único | €6,99–€9,99 | Un pago, sin suscripción: encaja con local-first |
| Pack de programa | €9–€19 | El contenido manda el precio |
| Suscripción | €2,99–€4,99/mes o €19–€29/año | Solo con sync real |
| Donación | €3–€10 | Sin presión |

## 7. Fiscalidad y cobros

- **Merchant of record** (Lemon Squeezy, Paddle, Gumroad): factura y liquida el IVA de la UE. Evita registrarse en 27 países. Es la opción por defecto para vender desde España sin gestoría nueva.
- **Play**: Google factura al usuario y retiene su comisión. No emitimos factura al usuario final.
- **Stripe directo** sin MoR: obliga a gestionar IVA propio. Solo si hay volumen y asesoría.
- Cualquier decisión fiscal debe validarse con un gestor; este documento no es asesoría fiscal.

## 8. Legal a actualizar por opción

| Opción | Documentos | Qué cambia |
|---|---|---|
| Afiliados | landing + guías | divulgación de enlace afiliado |
| Productos digitales | términos (nuevo apartado de venta) + reembolsos | renuncia al desistimiento de 14 días, entrega, soporte |
| Pro Play | privacidad + términos | compras integradas, datos tratados por Google |
| Suscripción | privacidad + términos | cobro recurrente, cancelación, sync en nube |
| Anuncios | privacidad + Data safety | ID de publicidad, compartición con terceros, UMP |

Todas las opciones caen dentro de la **Fase 126** (legal y Data safety alineados con el código).

## 9. Qué no hacer

- Anuncios antes de validar pago.
- Stripe (o cualquier pasarela externa) para bienes digitales **dentro** del APK: viola la política de Play salvo excepciones acotadas.
- Paywall en la landing antes de tener cuentas.
- Vender sync antes de que la Fase 100 exista.
- Cobrar por el catálogo, las calculadoras o el registro de series.

## 10. Métricas para decidir

Ya medibles con la telemetría de la Fase 124: `onboarding_completed`, `workout_started`, `workout_completed`, `screen_view`, `calculator_opened`.

| Métrica | Para qué |
|---|---|
| Activación (onboarding → primer entreno) | si el embudo pierde gente, monetizar es prematuro |
| Retención semanal de `workout_completed` | sin retención no hay LTV |
| Clics de afiliado / impresiones | valor del tráfico |
| Conversión a Pro | decide si M5 tiene sentido |
| Ventas por pack | decide si se invierte en contenido |

## 11. Riesgos y preguntas abiertas

- **Piratería** de packs JSON y del derecho local del Pro: aceptable a corto plazo, revisar si las ventas crecen.
- **Política de Play sobre ofertas externas (DMA/UE)**: hay que verificarla antes de diseñar cualquier enlace de pago desde el APK.
- **Health apps declaration**: si algún día hay anuncios, revisar que la app no use datos de salud para personalizarlos.
- **iOS**: sin build real; cualquier plan de monetización iOS es teórico hasta que exista.
- **Decisión del owner**: qué opción se ejecuta primero. El documento recomienda M1 → M2 → M3.
