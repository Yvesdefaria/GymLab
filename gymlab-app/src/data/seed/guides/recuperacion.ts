import type { Guide } from '@/domain/types'

export const seedGuides_recuperacion: Guide[] = [
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
    sections: [
      {
        title: 'Fatiga puntual vs. sobreentrenamiento',
        content:
          'Sentirse cansado tras una semana dura es fatiga normal y se resuelve con descanso. El sobreentrenamiento real es un estado prolongado (semanas) de rendimiento estancado o en caída que no mejora con días sueltos de descanso.',
        bullets: [
          'Fatiga puntual: 1–3 días y vuelves al 100%.',
          'Sobreentrenamiento: semanas sin mejorar aunque «descanses».',
          'La mayoría de la gente no sobreentrena: entrena y recupera mal.',
        ],
      },
      {
        title: 'Señales a vigilar',
        content:
          'Cansancio que no pasa, insomnio o sueño no reparador, fuerza que baja a pesar de esforzarte, molestias nuevas, irritabilidad o pérdida de motivación y de apetito. Varias juntas durante semanas apuntan a acumular demasiado.',
        bullets: [
          'El mal sueño es de las señales más claras y más ignoradas.',
          'La fuerza estancada varias semanas con buena técnica es otra.',
          'Las molestias articulares nuevas no se entrenan: se valoran.',
        ],
      },
      {
        title: 'Cómo salir del agujero',
        content:
          'Reduce volumen o intensidad durante 1–2 semanas (tipo deload), duerme 7–9 h cada noche y come suficiente proteína y carbohidratos. No añadas cardio «para compensar»: eso empeora el problema.',
        bullets: [
          'Un deload bien hecho suele bastar para notar alivio en una semana.',
          'Reintroduce el volumen poco a poco, no de golpe.',
          'Si tras 2 semanas de descanso real sigues mal, consulta a un profesional.',
        ],
      },
      {
        title: 'Prevención: piensa en semanas',
        content:
          'El progreso es a largo plazo: planifica bloques con deloads, escucha las señales antes de «apretar más» y entiende que el músculo crece mientras recuperas. Una semana floja no arruina un año; una lesión sí.',
        bullets: [
          'Programa deloads cada 4–8 semanas antes de que te lo pidan.',
          'El sueño y la comida son parte del entrenamiento, no extras.',
          'Más no es mejor: mejor es más bien hecho y mejor recuperado.',
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
    id: 19,
    slug: 'recuperacion-completa',
    category: 'recuperacion',
    title: 'Guía completa de recuperación muscular',
    summary: 'Protocolo por ventanas y diario de recuperación.',
    keyPoints: [
      'Recuperación = reparar lo que destruyes en el gimnasio.',
      'Ventanas: pre-entreno, post-entreno 30 min, resto del día, noche y día siguiente.',
      'Los factores que la arruinan: sobreentrenar, dormir mal, mala nutrición y estrés.',
      'Un diario diario (1–10) te avisa antes de llegar al sobreentrenamiento.',
    ],
    sections: [
      {
        title: 'Las ventanas de recuperación',
        content:
          'El músculo no crece mientras entrenas, sino al recuperar. Cada momento del día tiene su papel: antes de entrenar, dentro de la ventana post-entreno, durante el resto del día, por la noche y al despertar.',
        bullets: [
          'Post-entreno (30 min): proteína rápida + carbos para reponer glucógeno.',
          'Resto del día: comidas completas con proteína y carbos lentos.',
          'Noche: caseína o proteína lenta antes de dormir y descanso real.',
          'Día siguiente: recuperación activa del músculo entrenado con reps ligeras.',
        ],
      },
      {
        title: 'Qué sabotea la recuperación',
        content:
          'Varios factores convierten en inútil un buen entrenamiento: sesiones demasiado largas, dormir mal, obsesión con el cardio, nutrición deficiente, ayunos seguidos de atracón, estrés alto, alcohol y monotonía.',
        bullets: [
          'Sesiones de más de 90 min son contraproducentes para la mayoría.',
          'Dormir mal y el estrés elevan cortisol y frenan la reparación.',
          'Alcohol y mala comida vacían las reservas que necesitas para recuperar.',
        ],
      },
      {
        title: 'El diario de recuperación',
        content:
          'Cada mañana puntúa (1–10) sueño, agujetas, fatiga, deseo de entrenar, motivación, pulsaciones matutinas y peso. Si una variable sube +2 puntos, o varias +3, toma un día extra de descanso; si suben +3 durante una semana en tres variables, toma una semana de descarga.',
        bullets: [
          'Registrar a diario es fácil y muy informativo.',
          'Las pulsaciones matutinas altas son una señal temprana de fatiga.',
          'El diario anticipa el sobreentrenamiento antes de que aparezca.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 22,
    slug: 'tendinitis-rotuliana',
    category: 'recuperacion',
    title: 'Tendinitis rotuliana (rodilla del saltador)',
    summary: 'Qué es, síntomas y cómo reentrenar la rodilla.',
    keyPoints: [
      'Inflamación del tendón que une la rótula con la tibia.',
      'Frecuente en saltos, carrera y sobrecarga de cuádriceps.',
      'Diagnóstico: palpación y dolor en extensión contra resistencia.',
      'Reentrenamiento: isométricos primero, excéntricos después (protocolo HSR).',
    ],
    sections: [
      {
        title: 'Qué es y por qué aparece',
        content:
          'Es la inflamación del tendón rotuliano, la parte final del cuádriceps. Aparece por microtraumatismos de repetición, apoyo alterado, cuádriceps débiles o isquios poco flexibles. Duele al saltar, correr, flexionar, y a veces al estar sentado.',
        bullets: [
          'Suele no haber inflamación visible: el dolor aparece con la carga.',
          'Rótula alta o grande y alteraciones del apoyo aumentan el riesgo.',
          'Si sospechas rotura, pide ecografía o resonancia.',
        ],
      },
      {
        title: 'Fase aguda (primeras 72 h)',
        content:
          'Interrumpe la actividad que lo causa, corrige técnica y calzado, usa antiinflamatorios y hielo en las primeras 48–72 horas, y una cincha circular bajo la rótula. Comienza con isométricos de cuádriceps; evita el flexo-extensión cargado.',
        bullets: [
          'Hielo 15–20 min en las primeras 72 h.',
          'AINEs bajo indicación; no alargar su uso.',
          'Isométricos del cuádriceps para mantener el tendón activo sin carga.',
        ],
      },
      {
        title: 'Vuelta y prevención',
        content:
          'Progresa con excéntricos de rodilla con tempo lento (protocolo de resistencia pesada lenta o HSR: 70–85% de tu 1RM, 3–4 s de descenso, 3 sesiones semanales). Al volver: calienta bien, cincha si ayuda, estira los isquios y hiela 20 min al terminar durante ~1 mes.',
        bullets: [
          'El ejercicio excéntrico lento es la pauta con más evidencia.',
          'Sube la carga de forma gradual, no de golpe.',
          'Si el dolor vuelve, baja la intensidad una semana antes de continuar.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 23,
    slug: 'espalda-problemas',
    category: 'recuperacion',
    title: 'Entrenar con problemas de espalda',
    summary: 'Higiene postural y pautas para hiperlordosis e hipercifosis.',
    keyPoints: [
      'La columna tiene curvaturas naturales; el problema es exceder sus límites.',
      'La escoliosis es frecuente y la actividad controlada ayuda.',
      'Hiperlordosis: mete abdomen y evita arquear la lumbar.',
      'Hipercifosis: retrae hombros y trabaja la espalda con respaldo.',
    ],
    sections: [
      {
        title: 'Hiperlordosis lumbar',
        content:
          'La pelvis cae hacia delante y la lumbar se arquea demasiado. La higiene postural pasa por meter el abdomen y flexionar algo las rodillas. Para entrenar: encogimientos de tronco (no de cadera), dorsales con respaldo, glúteos y abductores, y femoral sentado.',
        bullets: [
          'Evita encogimientos de cadera que agravan la lordosis.',
          'Refuerza glúteos y abdomen para estabilizar la pelvis.',
          'Estira la zona lumbar a diario.',
        ],
      },
      {
        title: 'Hipercifosis dorsal (joroba)',
        content:
          'La espalda alta se redondea. Trabaja la movilidad y la tonificación de todo el tronco con apoyo en respaldos, manteniendo hombros atrás y mirando al frente.',
        bullets: [
          'Ejercicios de remo y escapulares con el tronco apoyado.',
          'Movilidad de hombro y apertura de pecho.',
          'Postura consciente al estar de pie y sentado.',
        ],
      },
      {
        title: 'Cervicales',
        content:
          'Mejora la movilidad articular del cuello y tonifica dorsales y trapecio con respaldo. Al hacer abdominales, usa el encogimiento de cadera en vez de tirar del cuello con las manos.',
        bullets: [
          'Evita ejercicios que empujen la cabeza contra resistencia.',
          'Fortalece la musculatura que sostiene el cuello.',
          'Ante dolor agudo o irradiado, consulta a un profesional.',
        ],
      },
    ],
    sourceUrl: '',
  },
]
