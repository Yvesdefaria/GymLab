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
]
