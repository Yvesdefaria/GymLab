import type { Guide } from '@/domain/types'

export const seedGuides_nutricion: Guide[] = [
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
    sections: [
      {
        title: 'Proteína: el macronutriente clave',
        content:
          'La proteína aporta los aminoácidos que reparan el músculo tras entrenar. En torno a 1,6–2,2 g por kg de peso y día cubren la gran mayoría de los casos; repartirla en 3–5 tomas de 0,4 g/kg ayuda a aprovecharla mejor.',
        bullets: [
          'Fuentes: carnes, pescado, huevos, lácteos, legumbres, tofu, soja.',
          'Una toma post-entreno no es obligatoria si ya comes suficiente a lo largo del día.',
          'Superar 2,2 g/kg rara vez aporta más: lo importante es el total diario.',
        ],
      },
      {
        title: 'Carbohidratos: la gasolina del entreno',
        content:
          'Los hidratos son la fuente principal de energía para series pesadas. Necesitas más los días de pierna o sesiones largas y menos en descanso. El rango de 4–7 g/kg funciona bien para entrenamiento de fuerza con algo de cardio.',
        bullets: [
          'Prioriza arroz, patata, avena, pan, fruta y legumbres.',
          'Rodean el entreno: una comida de carbohidratos 1–3 h antes mejora el rendimiento.',
          'En definición se bajan, pero no hace falta eliminarlos.',
        ],
      },
      {
        title: 'Grasas y calorías totales',
        content:
          'Las grasas sostienen las hormonas y la absorción de vitaminas; mantenerlas cerca de 0,8–1 g/kg cubre lo necesario. Al final, lo que decide tu peso es el balance calórico: superávit moderado para ganar, déficit suave para perder.',
        bullets: [
          'Grasas de calidad: aceite de oliva, frutos secos, aguacate, pescado azul.',
          'Sin un superávit, los músculos crecen poco aunque entrenes bien.',
          'Sin un déficit, no pierdes grasa de forma sostenible.',
        ],
      },
      {
        title: 'Cómo empezar sin agobiarse',
        content:
          'No necesitas pesar cada gramo desde el día uno. Empieza por fijar un objetivo calórico aproximado, cumple la proteína y reparte el resto. Ajusta después de 2–3 semanas según lo que indique la báscula y el rendimiento.',
        bullets: [
          'La calculadora de calorías de la app te da un punto de partida.',
          'Cambia una cosa cada vez: pesarte y ajustar es más fiable que improvisar.',
          'La constancia a medio plazo gana a la perfección de un día.',
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
