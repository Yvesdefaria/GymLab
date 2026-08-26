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
]
