import type { Guide } from '@/domain/types'

export const seedGuides_entrenamiento: Guide[] = [
  {
    id: 4,
    slug: 'progresion-sobrecarga',
    category: 'entrenamiento',
    title: 'Progresión y sobrecarga',
    summary: 'Cómo subir cargas o reps de forma sostenible.',
    keyPoints: [
      'Añade peso o reps cada 1–2 semanas si completas las series con buena forma.',
      'Prioriza compuestos: sentadilla, peso muerto, press, remo.',
      '2–3 estímulos por grupo muscular a la semana suelen funcionar bien.',
      'Deload cada 4–8 semanas si el rendimiento baja.',
    ],
    sections: [
      {
        title: '¿Qué es la sobrecarga progresiva?',
        content:
          'Es el principio por el que el músculo se adapta: si repites el mismo estímulo, deja de cambiar. La clave es añadir un poco más de trabajo cada semana: más peso, más repeticiones o más series con la técnica controlada.',
        bullets: [
          'Aumenta la carga solo si completaste las series previas con buena forma.',
          'Sube en incrementos pequeños: 1,25–2,5 kg en compuestos.',
          'Si no puedes completar el rango de reps, mantén el peso y gana una rep.',
        ],
      },
      {
        title: 'Cómo planificar la subida',
        content:
          'La regla más simple es la de «2 en 2»: si completas las 2 últimas series del rango (por ejemplo 3×8) con buena técnica, sube peso en la siguiente sesión.',
        bullets: [
          'Registra cada sesión: sin datos no sabes si progresas.',
          'Prioriza los compuestos, pero no descuides el volumen de los accesorios.',
          'El progreso se mide en semanas, no en sesiones sueltas.',
        ],
      },
      {
        title: 'Cuándo NO subir',
        content:
          'Fatiga acumulada, sueño malo, dolor agudo o técnica rota son señales de bajar o mantener, no de forzar.',
        bullets: [
          'Falla la misma serie 2–3 semanas seguidas → aplica un deload.',
          'Dolor articular agudo → para y consulta a un profesional.',
          'Subir a toda costa sin recuperar no es progresar: es sobreentrenar.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 8,
    slug: 'hiit-vs-liss',
    category: 'entrenamiento',
    title: 'HIIT vs LISS',
    summary: 'Qué cardio elegir según tu objetivo y cómo combinarlos.',
    keyPoints: [
      'HIIT: ráfagas cortas a alta intensidad (por ej. 30 s duro / 90 s suave). Ahorra tiempo y quema mucho en poco rato.',
      'LISS: 20–40 min a ritmo suave (caminar, bici, elíptica). Fácil de recuperar y compatible con cualquier día.',
      'Para hipertrofia, el LISS no interfiere si comes suficiente; el HIIT en exceso puede sí.',
      'Combinación típica: 1–2 HIIT + 2–3 LISS a la semana según días de gimnasio.',
    ],
    sections: [
      {
        title: 'Qué es cada uno',
        content:
          'El HIIT alterna ráfagas casi máximas (15–60 s) con descansos cortos; en 15–25 min terminas. El LISS es cardio de intensidad baja a ritmo constante (20–40 min) en el que puedes hablar sin ahogarte: caminar rápido, bici suave, elíptica.',
        bullets: [
          'HIIT: sesión corta, exigente, alta demanda de recuperación.',
          'LISS: suave, sostenible a diario, casi no resta a la fuerza.',
          'Ambos mejoran salud cardiovascular; eligen distinto.',
        ],
      },
      {
        title: '¿Cuál te conviene?',
        content:
          'Si entrenas fuerza y tu objetivo es hipertrofia, el LISS es el aliado: aporta salud y gasto sin interferir con la recuperación. El HIIT brilla cuando el tiempo es corto o quieres condición física en poco rato, pero exige energía que puede faltar en días de pierna.',
        bullets: [
          'Días de fuerza + HIIT seguido → rendimiento inferior en ambos.',
          'HIIT en exceso sube fatiga y puede frenar la ganancia muscular.',
          'LISS encaja en cualquier momento del día sin preparar.',
        ],
      },
      {
        title: 'Cómo combinarlos',
        content:
          'Una pauta típica: 1–2 sesiones de HIIT (15–20 min) en días ligeros o como tope de semana, y 2–3 de LISS (20–40 min) en días de descanso o tras fuerza. Empieza con un día de cada uno si no estás acostumbrado.',
        bullets: [
          'HIIT: calienta 5 min antes; 3–5 intervalos son suficientes para empezar.',
          'LISS: ritmo conversacional; añade minutos poco a poco.',
          'Escucha fatiga: el cardio debe sumar, no vaciar tus piernas.',
        ],
      },
      {
        title: 'Sobre la «quema» de calorías',
        content:
          'El HIIT quema más por minuto y algo después de acabar (EPOC); el LISS quema más en total por la duración. A final de semana, el total de calorías gastadas decide más que la intensidad del día.',
        bullets: [
          'Quemar grasa depende del déficit acumulado, no del tipo de cardio.',
          'El cardio no sustituye una buena dieta.',
          'Elige el que puedas mantener semanas: la adherencia gana.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 9,
    slug: 'estancamiento',
    category: 'entrenamiento',
    title: 'Estancamiento: qué hacer',
    summary: 'Causas comunes de no progresar y cómo desatascarlo.',
    keyPoints: [
      'Revisa el registro: si llevas semanas con el mismo peso y reps, necesitas sobrecarga o cambios.',
      'Suele ser falta de volumen, sueño o comida, no de motivación.',
      'Sube series, mejora la técnica o cambia de ejercicio por 4–6 semanas.',
      'Si fallas la misma serie varias semanas seguidas, aplica un deload y luego ajusta cargas.',
    ],
    sections: [
      {
        title: 'Diagnostica antes de tocar nada',
        content:
          'El estancamiento suele tener causas claras. Revisa primero: ¿comes y duermes suficiente? ¿El peso y las reps llevan semanas clavados? ¿Entrenas con un esfuerzo real o solo «pasas»? Con el registro de la app puedes verlo en un minuto.',
        bullets: [
          'El registro miente menos que la memoria: usa el historial.',
          'Técnica que se degrada también frena el progreso.',
          'Un mal día no es estancamiento: lo es 3–4 semanas sin avance.',
        ],
      },
      {
        title: 'Causas más frecuentes',
        content:
          'Las tres culpables habituales son: poco volumen o intensidad real, recuperación insuficiente (sueño/comida) y ejercicios o rangos siempre idénticos. La «falta de motivación» casi nunca es el problema de fondo.',
        bullets: [
          'Falta de sobrecarga: sube peso, reps o series de forma planificada.',
          'Falta de sueño: baja rendimiento y síntesis proteica.',
          'Falta de comida: sin energía, no hay progreso sostenido.',
        ],
      },
      {
        title: 'Qué cambiar primero',
        content:
          'Antes de cambiar de programa: asegura la técnica, sube el esfuerzo real de las series y añade 1 serie o 1 rep por ejercicio cada semana. Si en 2–3 semanas no responde, introduce variación: otro ejercicio parecido, más frecuencia o rangos distintos.',
        bullets: [
          'La sobrecarga progresiva es el primer botón a pulsar.',
          'Cambiar de ejercicio 4–6 semanas puede reacomodar el estímulo.',
          'No cambies de rutina cada semana: el cambio también necesita tiempo.',
        ],
      },
      {
        title: 'El deload como solución',
        content:
          'Si fallas la misma serie varias semanas y el cuerpo se siente pesado, baja la carga ~40–50% una semana manteniendo el patrón. Recuperas sin perder estímulo, y sueles volver a progresar en 1–2 semanas.',
        bullets: [
          'Deload no es una semana libre: es entreno suave y deliberado.',
          'Si tras el deload sigues estancado, revisa volumen y dieta.',
          'Ante duda, consulta a un profesional: a veces el bloqueo es técnico o médico.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 10,
    slug: 'deload',
    category: 'entrenamiento',
    title: 'Semana de deload',
    summary: 'Bajar la intensidad para recuperar y volver más fuerte.',
    keyPoints: [
      'Cada 4–8 semanas o cuando el rendimiento cae, reduce carga ~40–50% con las mismas series.',
      'Mantén la técnica y la frecuencia; baja peso e intensidad, no la asistencia al gimnasio.',
      'Una semana basta: volver a los niveles previos suele ser cuestión de días.',
      'No es perder progreso: es el estímulo que permite las siguientes semanas de avance.',
    ],
    sections: [
      {
        title: 'Qué es y para qué sirve',
        content:
          'El deload es una semana planificada de carga reducida (peso e intensidad) que permite que el sistema nervioso y el músculo se recuperen sin dejar de entrenar. No es perder el progreso: es el «reset» que te permite seguir avanzando después.',
        bullets: [
          'Baja el peso ~40–50% manteniendo series y técnica.',
          'Mantén la frecuencia: seguir moviendo el patrón ayuda a conservar lo ganado.',
          'La intensidad (RPE) baja; el resto del estímulo se conserva.',
        ],
      },
      {
        title: 'Cuándo hacerlo',
        content:
          'Dos opciones válidas: por calendario (cada 4–8 semanas de bloque) o por señales (rendimiento en descenso, fatiga alta, mal sueño, articulaciones pesadas). El criterio «por señales» se ajusta mejor a la vida real.',
        bullets: [
          'Por calendario: estable, fácil de planificar.',
          'Por señales: más preciso, evita llegar al agotamiento.',
          'Señal clara: las cargas que hacías con soltura ahora cuestan el doble.',
        ],
      },
      {
        title: 'Cómo diseñar la semana',
        content:
          'Misma estructura de la rutina, pero con ~40–50% menos carga y dejando 1–2 repeticiones en reserva. Puedes reducir también el número de series a la mitad si la semana ha sido dura. No metas cardio extra ni sesiones inventadas.',
        bullets: [
          'El entreno debe sentirse «fácil»: esa es la señal de que estás recuperando.',
          'Mantén la técnica perfecta: es una semana para pulirla.',
          'Una semana es suficiente; alargar más puede desentrenar.',
        ],
      },
      {
        title: 'Después del deload',
        content:
          'Vuelve con las cargas previas: la primera semana puede sentirse pesada, la segunda deberías volver a los números de siempre y empezar a superarlos. Si a la tercera sigues flojo, revisa volumen, dieta y sueño antes de forzar.',
        bullets: [
          'No intentes «recuperar el tiempo perdido» subiendo de golpe.',
          'El deload no es excusa para abandonar hábitos: duerme y come igual de bien.',
          'Los mejores progresos suelen venir la semana tras el deload.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 11,
    slug: 'espalda-segura',
    category: 'entrenamiento',
    title: 'Espalda segura en el gimnasio',
    summary: 'Técnica básica para proteger la zona lumbar en cargas y remos.',
    keyPoints: [
      'En peso muerto y remo: espalda neutra, no redonda; empuja con las piernas y aprieta el core.',
      'El cinturón no sustituye la técnica: úsalo para cargas altas, no para levantar mal.',
      'Si notas dolor lumbar agudo o irradiado, para y consulta a un profesional.',
      'Gana rigidez: inspira y bloquea el abdomen antes de cada repetición pesada.',
    ],
    sections: [
      {
        title: 'La espalda neutra lo es todo',
        content:
          'En bisagras (peso muerto, peso muerto rumano, remos con peso) la columna debe mantener sus curvas naturales: no redondeada ni hiperextendida. La «colocación» se construye apretando el abdomen y manteniendo el pecho alto, no estirando la cabeza.',
        bullets: [
          'Espalda redonda con carga es la receta del dolor lumbar.',
          'Hiperextender al subir tampoco: mantén la posición neutra.',
          'Inicia el peso muerto empujando con las piernas, no tirando con la espalda.',
        ],
      },
      {
        title: 'La respiración y la rigidez',
        content:
          'Antes de cada repetición pesada: inspira, bloquea el abdomen (brazo/manual) y mantén la presión durante el movimiento. Esa «rigidez abdominal» protege la zona lumbar mejor que cualquier cinturón.',
        bullets: [
          'El bloqueo se sostiene en todo el recorrido, no solo al arrancar.',
          'No aprietes la respiración hasta marearte: controla y exhala al final.',
          'El cinturón ayuda en cargas altas, pero la técnica manda.',
        ],
      },
      {
        title: 'El core es tu mejor seguro',
        content:
          'Los ejercicios de core (plancha, bird dog, pallof press) enseñan a estabilizar la columna bajo carga. Un core fuerte no es solo «abdominales visibles»: es protección lumbar en cualquier ejercicio compuesto.',
        bullets: [
          'Plancha y bird dog: estabilidad sin sobrecargar la lumbar.',
          'El pallof press entrena contra-rotación, muy útil para cargas asimétricas.',
          'Hazlos también en días de descanso: no fatigan apenas.',
        ],
      },
      {
        title: 'Cuándo parar y pedir ayuda',
        content:
          'Diferencia el dolor muscular (normal tras entrenar) del dolor articular o irradiado (señal de parar). Si notas dolor lumbar agudo, hormigueo o dolor que baja por la pierna, detente y consulta a un profesional.',
        bullets: [
          'El dolor que empeora al cargar es bandera roja, no «rugir y seguir».',
          'Ante molestia lumbar persistente, revisa técnica y volumen antes que cargar más.',
          'Un profesional (fisioterapeuta) puede devolverte a entrenar más seguro.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 14,
    slug: 'tecnica-sentadilla',
    category: 'entrenamiento',
    title: 'Técnica de sentadilla',
    summary: 'Patrón, posición de pies y errores comunes en la sentadilla con barra.',
    keyPoints: [
      'Pies a la anchura de los hombros, punteras ligeramente abiertas.',
      'Cadera atrás y bajada controlada hasta donde la técnica se mantenga.',
      'Rodillas en la misma dirección que los pies; pecho abierto, espalda neutra.',
      'Empuja con todo el pie para subir, no con la puntera.',
    ],
    sections: [
      {
        title: 'Posición inicial',
        content:
          'Coloca la barra apoyada sobre el trapecio (sentadilla alta) o sobre los deltoides posteriores (sentadilla baja). Pies a la anchura de los hombros, punteras abiertas ~15–30°. Inspira y bloquea el abdomen antes de iniciar.',
        bullets: [
          'Barra bien centrada para no torcer el tronco.',
          'Pies firmes en el suelo: no se levantan los talones.',
          'El agarre ancho y activo da rigidez a la parte superior.',
        ],
      },
      {
        title: 'El descenso y la subida',
        content:
          'Inicia el movimiento con cadera hacia atrás y al mismo tiempo flexiona las rodillas. Baja de forma controlada manteniendo la espalda neutra; la profundidad es la que tu movilidad permita sin perder el arco lumbar.',
        bullets: [
          'Las rodillas empujan en la dirección de las punteras.',
          'El pecho se mantiene abierto; no dejes caer la mirada.',
          'Sube empujando contra el suelo con toda la planta del pie.',
        ],
      },
      {
        title: 'Errores comunes',
        content:
          'Los más frecuentes son: talones que se despegan, rodillas que entran hacia dentro, espalda redondeada al fondo y bajada demasiado rápida.',
        bullets: [
          'Talones fuera → movilidad de tobillo o anchura de pies.',
          'Rodillas entrando → falta de fuerza o abrir las rodillas con intención.',
          'Dolor de rodilla anterior persistente → revisa técnica y profundidad.',
        ],
      },
      {
        title: 'Variantes útiles',
        content:
          'Si la barra sobre la espalda te incomoda o estás aprendiendo, la sentadilla goblet o la front squat enseñan mejor la posición vertical del tronco y la profundidad.',
        bullets: [
          'Goblet: ideal para principiantes por el patrón de carga frontal.',
          'Front squat: obliga a mantener el codo alto y el pecho erguido.',
          'Sentadilla a caja: enseña profundidad y frenado controlado.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 15,
    slug: 'press-banca-progresion',
    category: 'entrenamiento',
    title: 'Progresión en press de banca',
    summary: 'Técnica, agarre y cómo subir kilos de forma sostenible.',
    keyPoints: [
      'Escápulas retraídas y estables; pies firmes en el suelo.',
      'Barra en línea con las muñecas; codo ~45° respecto al tronco.',
      'Sube peso con «2 en 2»: si cierras el rango con buena técnica, incrementa.',
      'El punto más débil suele ser el arranque: entrénalo con pausas o press con mancuernas.',
    ],
    sections: [
      {
        title: 'Técnica de base',
        content:
          'Recuéstate con los pies firmes, retrae y fija las escápulas (hombros atrás y abajo). Agarra la barra algo más ancho que los hombros, bájala de forma controlada tocando el pecho sin rebote y empuja hasta el bloqueo sin separar las escápulas.',
        bullets: [
          'Muñecas alineadas: la barra sobre la base de la mano, no sobre los dedos.',
          'Los codos a ~45° protegen el hombro (nada de «alas de pollo»).',
          'Pecho «alto»: arco leve y hombros estables protegen el manguito.',
        ],
      },
      {
        title: 'Cómo añadir peso',
        content:
          'Usa la regla «2 en 2»: si completas las dos últimas series del rango (por ejemplo 4×6) con técnica controlada, añade 2,5 kg la siguiente sesión. Los incrementos pequeños se acumulan: 2,5 kg por ciclo son ~30 kg al año.',
        bullets: [
          'Alterna sesiones de fuerza (pocas reps, peso alto) y volumen (más reps).',
          'Incluye press inclinado y press con mancuernas para apoyar la progresión.',
          'Registra cada sesión: el progreso real se ve en semanas.',
        ],
      },
      {
        title: 'Puntos débiles frecuentes',
        content:
          'Si fallas el arranque desde el pecho, refuerza el press de pausa (1 s en el pecho) y el press con mancuernas. Si fallas el bloqueo, trabaja press de banca cerrado o fondos.',
        bullets: [
          'Pausa en el pecho: quita el rebote y construye fuerza de arranque.',
          'Hombro inestable → reduce carga y corrige el ángulo de codo.',
          'Si el pecho gana pero el tríceps no, prioriza trabajo de tríceps.',
        ],
      },
      {
        title: 'Seguridad en el press',
        content:
          'Nunca entres en fallo sin compañero o sin topes en el rack. La barra al cuello no se perdono. Si entrenas solo, usa la banca con soportes de seguridad o un spotter.',
        bullets: [
          'Compañero de spot: acuerda las señales antes de empezar.',
          'Topes del rack a la altura del pecho: parada de emergencia.',
          'Nada de pinza en la barra si usas spotter (impide soltar la carga).',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 16,
    slug: 'principiante',
    category: 'entrenamiento',
    title: 'Guía para principiantes',
    summary: 'Primeras semanas: técnica, estructura y qué esperar.',
    keyPoints: [
      'Aprende el patrón antes que el peso: sentadilla, empuje, tirón, bisagra.',
      'Empieza con 3 días de full body a la semana.',
      'La progresión inicial es rápida: usa el registro para subir de forma segura.',
      'El dolor muscular intenso de los primeros días es normal; no es fuerza ni daño.',
    ],
    sections: [
      {
        title: 'Los primeros días',
        content:
          'Dedica 2–3 semanas a aprender los patrones básicos con cargas ligeras o el propio peso: sentadilla, empuje (press), tirón (remo/dominada asistida) y bisagra de cadera. La técnica aprendida al inicio te protege el resto de la vida.',
        bullets: [
          'Videograbarte te ahorra errores que luego cuesta corregir.',
          'Si un ejercicio duele en una articulación (no en el músculo), para.',
          'Dolor muscular del día siguiente es normal; el agudo no.',
        ],
      },
      {
        title: 'Estructura de la semana',
        content:
          'Un full body 3 días (lunes, miércoles, viernes) es ideal para empezar: cada sesión toca todos los grupos con 1–2 ejercicios por patrón. Deja al menos un día de descanso entre sesiones.',
        bullets: [
          'Sesión típica: sentadilla o pierna, press, remo, core.',
          '2–3 series de 8–12 reps por ejercicio en las primeras semanas.',
          'Descansa 1–3 min entre series; apunta el peso y las reps.',
        ],
      },
      {
        title: 'Qué esperar (y qué no)',
        content:
          'El progreso inicial puede ser rápido gracias a la adaptación neural, no al músculo todavía. No esperes cambios visibles la primera semana: el registro semanal (peso en la barra) es el mejor indicador.',
        bullets: [
          'Fuerza sube rápido al principio: es normal y motivador.',
          'Cambios visibles suelen llegar a partir de las 4–8 semanas.',
          'Si una semana no progresas, revisa sueño y comida antes de cambiar el plan.',
        ],
      },
      {
        title: 'Errores típicos del principiante',
        content:
          'Empezar demasiado cargado, saltarse el calentamiento, copiar programas avanzados o cambiar de rutina cada semana.',
        bullets: [
          'Más peso no enseña antes: enseña mal.',
          'Calienta 5–10 min: el calentamiento es parte del entrenamiento.',
          'Constancia durante meses > intensidad perfecta una semana.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 20,
    slug: 'lesiones-comunes',
    category: 'entrenamiento',
    title: 'Lesiones comunes en el gimnasio',
    summary: 'Prevención y vuelta a entrenar sin recaer.',
    keyPoints: [
      'El 90% de las lesiones: la carga supera la tolerancia del tejido.',
      'Hombro: controla el press de banca y suma trabajo de tracción.',
      'Lumbar: bracing y bisagra de cadera; el peso muerto no es el enemigo.',
      'Usa reposo relativo y el sistema semáforo del dolor para volver.',
    ],
    sections: [
      {
        title: 'Por qué aparece la lesión',
        content:
          'En la mayoría de los casos la carga supera la capacidad de tolerancia del tejido. Tres vías típicas: demasiado volumen o intensidad de golpe, técnica deficiente mantenida, y falta de recuperación.',
        bullets: [
          'Sube volumen o intensidad de forma gradual, no de golpe.',
          'La técnica mala que se repite acaba lesionando.',
          'Sin recuperación suficiente, el tejido no se adapta: se rompe.',
        ],
      },
      {
        title: 'Hombro',
        content:
          'El dolor frontal o lateral suele venir de abusar del press de banca con los codos a 90º y de poco trabajo de tracción. Prevención: retrae las escápulas y usa un ángulo de codos de unos 45º. Si ya hay tendinopatía, empieza con isométricos analgésicos y luego excéntricos.',
        bullets: [
          'Equilibra empuje y tracción en la semana.',
          'Codos a 45º protegen el hombro en el press.',
          'La tendinopatía se entrena con isométricos y excéntricos, no con reposo total.',
        ],
      },
      {
        title: 'Lumbar',
        content:
          'El peso muerto no es el enemigo; lo es perder la neutralidad de la columna. La clave es el bracing (respiración diafragmática) y la bisagra de cadera: el peso debe sentirse en isquios y glúteos, no en la zona lumbar.',
        bullets: [
          'Activa el core antes de mover la carga.',
          'Empuja la cadera atrás manteniendo la espalda neutra.',
          'Si sientes la lumbar cargando, corrige técnica antes de subir peso.',
        ],
      },
      {
        title: 'Rodilla y vuelta segura',
        content:
          'El dolor anterior de rodilla suele venir de abusar de dominantes de rodilla con cargas altas y descensos descontrolados. Controla la excéntrica y evita el valgo. Al volver, usa reposo relativo: modifica los ejercicios y mantén un estímulo indoloro.',
        bullets: [
          'Sube una sola variable a la semana (peso o series, no ambas).',
          'Semáforo del dolor: 0–3 que vuelve a 0 en 24 h = luz verde.',
          'Si el dolor supera 4 o aumenta al día siguiente, retrocede.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 21,
    slug: 'ejercicios-peligrosos',
    category: 'entrenamiento',
    title: 'Ejercicios peligrosos y alternativas seguras',
    summary: 'Sustituye los gestos de riesgo por opciones seguras.',
    keyPoints: [
      'No son «malos», pero ponen la articulación en riesgo.',
      'Press y jalones tras nuca fuerzan la rotación del hombro.',
      'El remo al mentón puede inflamar el supraespinoso si subes codos.',
      'Sustituir te deja entrenar muchos años sin lesiones.',
    ],
    sections: [
      {
        title: 'Press tras nuca',
        content:
          'Coloca el hombro en una abducción y rotación extrema para la que no está preparado. Usa en su lugar el press militar, el press con mancuernas o el press de hombro en máquina.',
        bullets: [
          'Press militar con barra: mejor opción de empuje por encima de la cabeza.',
          'Mancuernas permiten un recorrido más natural.',
          'El press de hombro en máquina es seguro para principiantes.',
        ],
      },
      {
        title: 'Jalones tras nuca',
        content:
          'La abducción por encima de 80º con rotación externa forzada puede causar inestabilidad y problemas del manguito y del nervio supraescapular. Usa dominadas o jalones frontales al pecho.',
        bullets: [
          'Jalón frontal al pecho: mismo patrón con el hombro en posición segura.',
          'Las dominadas trabajan la espalda sin forzar el hombro.',
          'Evita bajar la barra por detrás de la cabeza.',
        ],
      },
      {
        title: 'Remo al mentón',
        content:
          'Si subes los codos por encima del hombro, el supraespinoso queda atrapado contra el acromio. Usa un agarre ancho, barra pegada al cuerpo, y no subas los codos; alternativamente, elevaciones laterales.',
        bullets: [
          'Agarre ancho y recorrido corto protegen el hombro.',
          'Las elevaciones laterales trabajan el mismo músculo sin riesgo.',
          'Detente si notas presión o pinchazo en el hombro.',
        ],
      },
      {
        title: 'Peso muerto rígidas y prensa horizontal',
        content:
          'El peso muerto con piernas rígidas redondea la columna bajo carga (riesgo de hernia); prefiere el peso muerto rumano. En la prensa horizontal, al sentarte la presión discal sube y el core deja de proteger: ejecución estricta sin redondear la lumbar, o sentadilla.',
        bullets: [
          'Peso muerto rumano: bisagra de cadera manteniendo la espalda neutra.',
          'En la prensa, no hundas la pelvis en el asiento.',
          'La sentadilla con técnica estricta es una alternativa más segura.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 24,
    slug: 'gana-masa-muscular',
    category: 'entrenamiento',
    title: 'Cómo ganar masa muscular',
    summary: 'Superávit, proteína y compuestos para hipertrofiar.',
    keyPoints: [
      'Necesitas superávit calórico: mantenimiento + ~10%.',
      'Proteína: 1,6–2 g por kg, repartida en 5–6 tomas.',
      'Prioriza compuestos: sentadilla, presa, remo, peso muerto.',
      'Duerme 8+ horas y no abandones la técnica.',
    ],
    sections: [
      {
        title: 'Nutrición para crecer',
        content:
          'Para ganar músculo necesitas superávit calórico (mantenimiento + ~10%) y suficiente proteína (1,6–2 g por kg) repartida en varias comidas. Los carbohidratos complejos aportan la energía para entrenar fuerte.',
        bullets: [
          'Ej.: 2.500 kcal de mantenimiento → ~2.750 kcal para crecer.',
          'Tomas de 30–50 g de proteína: el intestino no absorbe bien mucho más.',
          'Reparto típico: 50% carbos / 40% proteínas / 10% grasas.',
        ],
      },
      {
        title: 'Entrena compuestos primero',
        content:
          'Los ejercicios compuestos (sentadilla, prensa, dominadas, remo, peso muerto, press de banca) reclutan más músculo y más encima. Los grupos pequeños no te hacen crecer; la espalda y las piernas sí.',
        bullets: [
          'Empieza cada sesión por los ejercicios más grandes.',
          'Progresión de carga constante: suma peso o repeticiones cada semana.',
          'Los aisladores complementan; no sustituyen a los compuestos.',
        ],
      },
      {
        title: 'Recuperación y suplementos',
        content:
          'Deja 3–5 días de descanso por grupo muscular, duerme 8+ horas y bebe agua (kg × 0,036 litros al día). Cardio moderado 20–30 min, 2–4 veces por semana. Suplementos útiles: proteína de suero y creatina.',
        bullets: [
          'La creatina + suero post-entreno funcionan como «equipo anabólico».',
          'El descanso entre sesiones del mismo grupo es obligatorio.',
          'Sin sueño y comida, el estímulo de entrenar no se traduce en músculo.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 25,
    slug: 'triseries',
    category: 'entrenamiento',
    title: 'Triseries: técnica y rutinas',
    summary: 'Método de 3 ejercicios sin descanso para avanzados.',
    keyPoints: [
      'Triserie = 3 ejercicios distintos seguidos sin descanso.',
      'Pre/post-fatiga: aislamiento → compuesto → aislamiento.',
      'Método intenso, no apto para principiantes.',
      'Úsalo como cambio puntual para «sorprender» al músculo.',
    ],
    sections: [
      {
        title: 'Cómo funciona',
        content:
          'La triserie encadena 3 series de 3 ejercicios distintos sin descanso entre ellos. Estrategias típicas: pre-fatiga (aislamiento → compuesto → aislamiento) y triseries holísticas (básico pesado → auxiliar → aislamiento).',
        bullets: [
          'Ej. pre-fatiga de pecho: aperturas → press de banca → cruce de cables.',
          'Ej. holística: básico 4–6 reps → auxiliar 8–12 → aislamiento 20–40.',
          'Series extendidas: variaciones del mismo ejercicio de más a menos difícil.',
        ],
      },
      {
        title: 'Cuándo y cómo usarla',
        content:
          'Es un método muy estresante: resérvalo para fases de definición o para romper estancamientos. En la rutina de definición de referencia, el descanso máximo entre ejercicios es de 10 s y de 2 min entre triseries, con fallo absoluto en las semanas 2 y 4.',
        bullets: [
          'Descanso muy corto dentro de la triserie (≈10 s).',
          'Descanso mayor entre triseries (≈2 min).',
          'No lo mantengas más de unas semanas: alterna con entrenamiento normal.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 26,
    slug: 'alta-intensidad',
    category: 'entrenamiento',
    title: 'Entrenamiento de alta intensidad',
    summary: 'Técnicas avanzadas para ir más allá del fallo.',
    keyPoints: [
      'Intensidad real = peso + repeticiones + concentración al fallo.',
      'Métodos: superseries, descendentes, negativas, forzadas, rest-pause.',
      'Distingue el «buen dolor» (quemazón) del malo (articulaciones).',
      'No abuses: máx. 4 semanas seguidas y luego descarga.',
    ],
    sections: [
      {
        title: 'Qué es la intensidad',
        content:
          'La intensidad no es solo el peso: es el esfuerzo real hasta no poder completar una repetición más con técnica correcta (fallo muscular). Las técnicas avanzadas llevan el estímulo más allá del fallo concéntrico.',
        bullets: [
          'Quemazón por ácido láctico = «buen dolor» y parte del trabajo.',
          'Punzada en tendón o articulación = señal de lesión, para.',
          'Las técnicas intensas requieren compañero para máxima seguridad.',
        ],
      },
      {
        title: 'Métodos para subir la intensidad',
        content:
          'Incrementa la resistencia (~5% cuando completes 8–10 reps correctas), acorta descansos, haz superseries, series descendentes (–25–40% de peso al fallo), negativas y forzadas, rest-pause y parciales.',
        bullets: [
          'Series descendentes: al fallo, baja 25–40% y vuelve a fallar.',
          'Prefatiga: aislamiento antes del compuesto.',
          'Negativas y forzadas siempre con compañero.',
        ],
      },
      {
        title: 'No abuses',
        content:
          'Más de 4 semanas seguidas de técnicas extremas eleva la miostatina (proteína que limita el músculo). Planifica semanas de descarga y alterna con entrenamiento convencional para seguir progresando.',
        bullets: [
          'Alterna semanas duras y ligeras.',
          'La descarga permite que el estímulo se convierta en músculo.',
          'Escucha las señales antes de «apretar más».',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 27,
    slug: 'distribucion-rutina',
    category: 'entrenamiento',
    title: 'Distribución de la rutina de entrenamiento',
    summary: 'Cómo dividir la semana según tus días y objetivo.',
    keyPoints: [
      'Fuerza/volumen: 1–2 días/semana por grupo; resistencia: 3 días.',
      'Opciones: full-body, torso-pierna, empuje/tracción, splits de 4–5 días.',
      'Entrena los grupos grandes antes que los pequeños.',
      'Da prioridad a tus puntos débiles.',
    ],
    sections: [
      {
        title: 'Elige tu frecuencia',
        content:
          'Define la frecuencia según tu objetivo: para fuerza o volumen suele bastar con 1–2 días por grupo muscular a la semana; para resistencia muscular se usa hasta 3 días. A partir de ahí eliges el reparto.',
        bullets: [
          'Full-body 3×/semana minimiza días de gimnasio.',
          'Rutinas de 2 días: torso-pierna o empuje/tracción.',
          '3 días: empuje-tracción-piernas; 4–5 días: más aisladores.',
        ],
      },
      {
        title: 'Acopla los grupos con cabeza',
        content:
          'Regla de oro: entrena siempre los grupos grandes antes que los pequeños. Nunca tríceps antes de pecho, ni bíceps antes de espalda: así el músculo grande recibe toda la intensidad.',
        bullets: [
          'Pecho antes que tríceps; espalda antes que bíceps.',
          'Empuje (pecho, hombro, tríceps) junto si los juntas.',
          'Tracción (espalda, bíceps) junto si los juntas.',
        ],
      },
      {
        title: 'Prioriza puntos débiles',
        content:
          'A los grupos que se te quedan atrás dales más volumen o frecuencia y colócalos al principio de la sesión, cuando estás fresco. Por ejemplo, hombros débiles: entrénalos el primer día y no tras el pecho.',
        bullets: [
          'Los primeros ejercicios de la sesión son los que mejor rinden.',
          'Reparte el volumen a lo largo de la semana para no descuidarlos.',
          'Observa tu progreso y reajusta el orden si algo no responde.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 28,
    slug: 'cardio-ayunas',
    category: 'entrenamiento',
    title: 'Cardio en ayunas',
    summary: 'Qué es cierto y qué no sobre entrenar en ayunas.',
    keyPoints: [
      'El «glucógeno vacío» al despertar es un mito.',
      'A baja intensidad hay más ácidos grasos disponibles.',
      'A alta intensidad el efecto se invierte y es catabólico.',
      'Si quieres, cardio suave en ayunas con BCAA antes.',
    ],
    sections: [
      {
        title: 'Desmontando el mito',
        content:
          'Al despertar no tienes el glucógeno vacío: durante el sueño el cuerpo usa sobre todo grasa y apenas toca el glucógeno. La supuesta base del cardio en ayunas es, por tanto, falsa.',
        bullets: [
          'El gasto total del día importa más que la hora del cardio.',
          'El ayuno no «convoca» automáticamente a la grasa a arder.',
          'La constancia pesa más que el momento del día.',
        ],
      },
      {
        title: 'La ventaja moderada',
        content:
          'Sí hay un beneficio: al levantarte hay más ácidos grasos libres disponibles y listos para oxidarse, así que un cardio matutino de baja intensidad (50–75% FC máx) puede movilizar más grasa y mejorar la sensibilidad a la insulina.',
        bullets: [
          'Mantén el cardio en zona de baja–moderada intensidad.',
          'A alta intensidad (>75%) el cortisol, ya alto en ayunas, puede desgastar músculo.',
          'Si lo pruebas, toma 5 g de BCAA antes para proteger el músculo.',
        ],
      },
      {
        title: 'Consejos prácticos',
        content:
          'Si entrenas pesas y cardio en la misma sesión, haz primero las pesas y el cardio después. Los días de descanso, un cardio de baja intensidad está bien; el de alta intensidad no (no das respiro al cuerpo).',
        bullets: [
          'La diferencia entre mañana y tarde es pequeña: elige lo sostenible.',
          'El cardio intenso seguido de entrenar pesas cansa el sistema nervioso.',
          'Lo importante no es cuándo, sino que lo hagas con regularidad.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 29,
    slug: 'test-cooper',
    category: 'entrenamiento',
    title: 'Test de Cooper',
    summary: 'Mide tu capacidad aeróbica en 12 minutos.',
    keyPoints: [
      'Mide la máxima distancia recorrida en 12 minutos.',
      'Simple, fiable y válido para principiantes y avanzados.',
      'Es un esfuerzo máximo: consulta a un médico si tienes dudas.',
      'Su objetivo es fijar una línea base y medir tu progreso.',
    ],
    sections: [
      {
        title: 'En qué consiste',
        content:
          'El Test de Cooper mide la máxima distancia recorrida en 12 minutos sobre una pista plana, con un cronómetro. Sirve para evaluar la capacidad aeróbica, comparar el rendimiento en el tiempo y establecer la condición física inicial antes de un programa.',
        bullets: [
          'Necesitas una pista plana y un cronómetro.',
          'Cubre la mayor distancia posible en los 12 minutos.',
          'Solo las categorías «Buena» y «Excelente» se consideran aptas en entornos institucionales.',
        ],
      },
      {
        title: 'Precauciones',
        content:
          'Es un esfuerzo máximo: consulta a un médico antes si tienes dudas. No está recomendado con obesidad, tabaquismo, diabetes, asma, hipertensión, problemas cardiovasculares o respiratorios, tras procesos gripales, por encima de 2.000 m de altitud o con malestar físico.',
        bullets: [
          'No lo hagas si estás resfriado o convaleciente.',
          'Los muy sedentarios deben valorar su estado antes.',
          'Detente de inmediato ante dolor, mareo o falta de aire.',
        ],
      },
      {
        title: 'Cómo usarlo',
        content:
          'Su verdadera utilidad no es aprobar o suspender, sino fijar una línea base para medir el progreso. Repítelo cada 6–8 semanas y observa cómo mejora la distancia; así ves si tu trabajo aeróbico funciona.',
        bullets: [
          'Un 80% de la población no aprobaría la prueba: no te desanimes.',
          'Repite siempre en condiciones parecidas (misma pista, misma hora).',
          'La mejora de distancia es la señal de que tu base aeróbica sube.',
        ],
      },
    ],
    sourceUrl: '',
  },
]
