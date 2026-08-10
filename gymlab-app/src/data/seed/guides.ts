// Guías informativas sembradas (nutrición, entrenamiento, recuperación).
// Contenido divulgativo, no consejo médico; se muestran tal cual en la app.
// El contenido es seed de confianza: se renderiza como texto, sin HTML de usuario.
import type { Guide } from '@/domain/types'

export const seedGuides: Guide[] = [
  {
    id: 1,
    slug: 'macros-basicos',
    category: 'nutricion',
    title: 'Macros básicos para entrenar',
    summary: 'Proteína, carbohidratos y grasas orientativos según objetivo.',
    keyPoints: [
      'Proteína: 1,6–2,2 g/kg de peso corporal al día.',
      'Carbohidratos: 4–7 g/kg según volumen de entrenamiento.',
      'Grasas: 0,8–1 g/kg (aprox. 20–30% de calorías).',
      'Volumen: superávit ~10–15%. Definición: déficit ~15–20%.',
    ],
    sourceUrl: '',
  },
  {
    id: 2,
    slug: 'menu-volumen-orientativo',
    category: 'dietas',
    title: 'Menú orientativo de volumen',
    summary: 'Ejemplo de estructura de comidas para superávit moderado.',
    keyPoints: [
      'Desayuno: avena + lácteo + fruta + frutos secos.',
      'Comida: arroz o patata + proteína magra + verduras.',
      'Merienda: pan integral + atún o huevos.',
      'Cena: tubérculo + pescado o pavo + ensalada.',
      '5–6 tomas ayudan a repartir proteína.',
    ],
    sourceUrl: '',
  },
  {
    id: 3,
    slug: 'suplementos-base',
    category: 'suplementos',
    title: 'Suplementos con más evidencia',
    summary: 'Creatina y proteína en polvo como base; el resto es opcional.',
    keyPoints: [
      'Creatina monohidrato: 3–5 g/día, todos los días.',
      'Whey u otra proteína: 20–30 g cuando falte en la dieta.',
      'La comida completa y el sueño importan más que cualquier pastilla.',
      'Informativo: no sustituye consejo médico ni nutricional.',
    ],
    sourceUrl: '',
  },
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
    id: 5,
    slug: 'recuperacion-sueno',
    category: 'recuperacion',
    title: 'Recuperación y sueño',
    summary: 'El músculo crece fuera del gimnasio.',
    keyPoints: [
      'Objetivo: 7–9 horas de sueño.',
      'Respeta 48 h aprox. entre sesiones duras del mismo grupo.',
      'Cardio LISS 20–40 min no impide hipertrofia si comes suficiente.',
      'Dolor articular agudo: para y valora con un profesional.',
    ],
    sections: [
      {
        title: 'Por qué el sueño construye músculo',
        content:
          'El entrenamiento es el estímulo, pero la síntesis proteica (crecimiento muscular) ocurre sobre todo durante el descanso y el sueño profundo. Dormir menos de 6 h reduce notablemente la capacidad de recuperar y de rendir.',
        bullets: [
          '7–9 horas es el rango objetivo para adultos.',
          'La hormona de crecimiento se libera principalmente en sueño profundo.',
          'Con sueño corto, la percepción de esfuerzo sube y la técnica empeora.',
        ],
      },
      {
        title: 'Higiene de sueño práctica',
        content:
          'El horario constante importa más que las horas en sí. Acuéstate y levántate a la misma hora, incluso el fin de semana.',
        bullets: [
          'Reduce pantallas 30–60 min antes de dormir.',
          'Cena ligera y temprano: las comidas pesadas retrasan el sueño.',
          'Cafeína: nada de café o té estimulante después de media tarde.',
          'Habitación oscura, fresca y silenciosa.',
        ],
      },
      {
        title: 'Recuperación entre sesiones',
        content:
          'El mismo grupo muscular suele necesitar ~48 h entre sesiones duras. El descanso activo (paseo, movilidad, cardio suave) ayuda a recuperar mejor que la inactividad total.',
        bullets: [
          'Si el músculo sigue dolorido más de 72 h, reduce intensidad en esa zona.',
          'Diferencia dolor muscular de dolor articular: el segundo es señal de parar.',
          'La comida (proteína y energía suficiente) es parte de la recuperación.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 6,
    slug: 'entrenamiento-mujer-base',
    category: 'mujer',
    title: 'Entrenamiento de fuerza (base)',
    summary: 'Misma lógica de progresión; prioriza pierna/glúteo y técnica.',
    keyPoints: [
      'Full body 3 días o torso/pierna 4 días funcionan muy bien.',
      'Hip thrust, sentadilla, peso muerto rumano y zancadas como base.',
      'No hace falta “tonificar con poco peso”: la carga progresiva es clave.',
      'Ajusta volumen si hay molestias; escucha recuperación.',
    ],
    sourceUrl: '',
  },
  {
    id: 7,
    slug: 'gluteos-base',
    category: 'mujer',
    title: 'Glúteos base',
    summary: 'Bases, activación y progresión para desarrollar el glúteo.',
    keyPoints: [
      'Bases: puente de glúteos, sentadilla profunda, hip thrust, peso muerto rumano y zancadas con peso.',
      'Activa antes con puentes, clam shells o kickbacks con banda.',
      '2–3 sesiones de glúteos a la semana con ≥48 h de recuperación.',
      'Rango completo y sobrecarga progresiva; errores comunes: exceso de peso y rango limitado.',
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
    sourceUrl: '',
  },
  {
    id: 12,
    slug: 'menu-definicion',
    category: 'dietas',
    title: 'Menú orientativo de definición',
    summary: 'Estructura de comidas para déficit moderado sin perder rendimiento.',
    keyPoints: [
      'Desayuno: claras/huevos + pan integral + fruta.',
      'Comida: verdura + proteína magra + arroz o patata en cantidad moderada.',
      'Merienda: yogur griego o requesón + frutos secos (pocos).',
      'Cena: ensalada grande + pescado o pollo a la plancha.',
      'Déficit de ~15–20% y proteína alta (≥1,8 g/kg) para conservar músculo.',
    ],
    sourceUrl: '',
  },
  {
    id: 13,
    slug: 'sobreentrenamiento',
    category: 'recuperacion',
    title: 'Sobrecarga y sobreentrenamiento',
    summary: 'Señales de que entrenas de más y cómo ajustar.',
    keyPoints: [
      'Señales: cansancio persistente, mal dormir, fuerza estancada o bajando, molestias nuevas.',
      'Más no siempre es mejor: el progreso ocurre durante la recuperación.',
      'Reduce volumen o intensidad una semana y vigila cómo responde el cuerpo.',
      'Distingue fatiga puntual de sobreentrenamiento real; ante duda, consulta a un profesional.',
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
          'Nunca entres en fallo sin compañero o sin topes en el rack. La barra al cuello no se perdona. Si entrenas solo, usa la banca con soportes de seguridad o un spotter.',
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
    id: 17,
    slug: 'recuperacion-activa',
    category: 'recuperacion',
    title: 'Recuperación activa',
    summary: 'Qué es, cuándo hacerla y ejemplos de días suaves.',
    keyPoints: [
      'Movimiento ligero que favorece la circulación sin añadir fatiga.',
      'Paseo, bici suave, natación tranquila o movilidad: 20–40 min.',
      'Mejor que el reposo total para el dolor muscular de las 24–72 h.',
      'No cuenta como entrenamiento duro; no reemplaza el descanso.',
    ],
    sections: [
      {
        title: '¿Qué es la recuperación activa?',
        content:
          'Es actividad de intensidad baja–moderada que mantiene el cuerpo en movimiento los días de descanso. Favorece el riego sanguíneo y la movilidad, y ayuda a que el dolor muscular post-entreno (DOMS) baje antes que con reposo total.',
        bullets: [
          'Intensidad que permita hablar con naturalidad.',
          'Duración típica de 20–40 minutos.',
          'Mejor movimiento que sofá, pero sin exigir el músculo fatigado.',
        ],
      },
      {
        title: 'Cuándo usarla',
        content:
          'Ideal al día siguiente de una sesión dura del mismo grupo, o en tus días programados de descanso cuando notas rigidez. También sirve como «descarga» en semanas de deload.',
        bullets: [
          'Dolor muscular de esfuerzo → recuperación activa ligera.',
          'Fatiga general → paseo suave en vez de entrenar.',
          'Dolor articular agudo → no: descansa y valora con un profesional.',
        ],
      },
      {
        title: 'Ejemplos prácticos',
        content:
          'Un paseo de 30 min a paso ligero, bici suave, natación tranquila, estiramientos dinámicos o una sesión de movilidad (rodillas, cadera, hombros) sin peso.',
        bullets: [
          'Estirar no recupera «más rápido» por sí solo, pero alivia rigidez.',
          'Rodillo y masaje: agradables, no sustituyen el descanso.',
          'La mejor recuperación activa es la que realmente harás.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 18,
    slug: 'hidratacion',
    category: 'nutricion',
    title: 'Hidratación para entrenar',
    summary: 'Cuánta agua tomar y cómo reponer sales en el gimnasio.',
    keyPoints: [
      'Bebe en las horas previas: ~500 ml antes de entrenar.',
      'Pérdida de 1–2% de agua ya baja rendimiento y concentración.',
      'La orina clara es una buena señal de hidratación.',
      'En sesiones largas o con mucho sudor, añade electrolitos.',
    ],
    sections: [
      {
        title: 'Cuánta agua necesitas',
        content:
          'Como referencia base: ~30–35 ml por kg de peso corporal al día (una persona de 70 kg ≈ 2,1–2,5 l), y más si hace calor o entrenas con sudor abundante. La sed ya es un síntoma tardío: mejor beber a lo largo del día.',
        bullets: [
          'La orina clara o pajizo es señal de buena hidratación.',
          'Antes de entrenar: ~500 ml en las 2 h previas.',
          'Bebe a sorbos durante la sesión: ~150–250 ml cada 15–20 min.',
        ],
      },
      {
        title: 'Agua, electrolitos y rendimiento',
        content:
          'Perder 1–2% del peso en agua baja fuerza, velocidad y concentración, y sube la percepción de esfuerzo. En sesiones de más de ~60–90 min o con sudor muy abundante, el agua sola no basta: repone sodio y potasio.',
        bullets: [
          'Agua + algo de sal en la comida suele bastar para entrenos normales.',
          'Bebidas isotónicas: útiles en sesiones largas, no necesarias a diario.',
          'Cuidado con bebidas azucaradas en exceso: calorías que no aportan.',
        ],
      },
      {
        title: 'Señales de alarma',
        content:
          'Sed intensa, boca seca, orina muy oscura, mareos o calambres pueden indicar deshidratación. Si entrenas con calor y aparecen confusión o vómitos, para y busca atención sanitaria.',
        bullets: [
          'El color de la orina es el indicador más fiable y gratuito.',
          'Los calambres pueden deberse a deshidratación y falta de sales.',
          'Rehidrátate progresivamente, no de golpe.',
        ],
      },
    ],
    sourceUrl: '',
  },
]
