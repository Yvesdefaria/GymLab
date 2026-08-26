import type { Guide } from '@/domain/types'

export const seedGuides_dietas: Guide[] = [
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
    sections: [
      {
        title: 'Idea general del día',
        content:
          'Este menú es una plantilla, no una ley: intenta que cada comida combine una fuente de proteína, una de carbohidratos y vegetales. Repartir en 4–6 tomas ayuda a llegar al total calórico y de proteína sin comidas gigantes.',
        bullets: [
          'Ajusta las cantidades a tu peso, no al de tu compañero.',
          'El total del día importa más que cada comida concreta.',
          'Prepárate algo de comida: el plan más fácil es el que ya tienes hecho.',
        ],
      },
      {
        title: 'Ejemplo de día completo',
        content:
          'Desayuno: avena con leche, plátano y nueces. Comida: arroz, pechuga o pollo y verduras con aceite. Merienda: pan integral con atún o huevos. Cena: patata o boniato, pescado o pavo y ensalada. Añade un yogur o requesón antes de dormir si te falta proteína.',
        bullets: [
          'Bebe agua a lo largo del día, no solo en las comidas.',
          'La avena y el arroz dan energía estable para entrenar.',
          'Las verduras aportan volumen y micronutrientes sin muchas calorías.',
        ],
      },
      {
        title: 'Ajuste según entrenamiento',
        content:
          'El día de sesión pesada, adelanta o aumenta los carbohidratos en la comida previa; el día de descanso puedes repartirlos más libremente. Si entrenas por la mañana, la cena anterior y el desayuno previo son tus dos «comidas de energía».',
        bullets: [
          'Comida 1–3 h antes de entrenar con carbohidratos y algo de proteína.',
          'Tras entrenar, una comida normal cubre la recuperación.',
          'En volumen no hace falta atiborrarse: basta un superávit moderado.',
        ],
      },
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
    sections: [
      {
        title: 'La regla de oro del déficit',
        content:
          'Para definir conservando músculo: déficit moderado (~15–20% menos de lo que gastas) y proteína alta (≥1,8 g/kg). Un déficit brusco quema músculo además de grasa, y la mayoría no lo aguanta más de dos semanas.',
        bullets: [
          'Déficit suave = menos hambre, más adherencia, mejor rendimiento.',
          'La proteína sube saciedad y protege la masa magra.',
          'Pérdida de peso saludable: ~0,5–1% del peso corporal a la semana.',
        ],
      },
      {
        title: 'Estructura del día',
        content:
          'Desayuno: claras o huevos con pan integral y fruta. Comida: verdura + proteína magra + arroz o patata en cantidad moderada. Merienda: yogur griego o requesón con pocos frutos secos. Cena: ensalada grande con pollo o pescado.',
        bullets: [
          'Las verduras llenan sin calorías: tu mejor aliado contra el hambre.',
          'La fruta no engorda por sí sola: cabe en el déficit con control.',
          'Cocina con poca grasa y pesa las salsas (esconden calorías).',
        ],
      },
      {
        title: 'Entrenar en déficit',
        content:
          'La fuerza puede mantenerse si comes suficiente proteína y duermes bien. Prioriza los compuestos, respeta los descansos y no acumules volumen extra: la recuperación es más lenta en déficit.',
        bullets: [
          'Si la fuerza cae mucho, revisa el déficit: quizá es demasiado agresivo.',
          'El cardio ayuda al gasto, pero no lo necesitas para empezar a perder.',
          'Bebe agua: el peso «que no baja» a veces es retención, no grasa.',
        ],
      },
      {
        title: 'Errores que frenan la definición',
        content:
          'Saltarse comidas, eliminar carbohidratos por completo, pesarse cada hora o castigarse por un día malo. La definición es paciencia: los cambios visibles se miden en semanas y en el espejo, no en el peso del día.',
        bullets: [
          'No elimines los carbohidratos: alimentan el entreno y la mente.',
          'Un día de exceso no arruina la semana: vuelve al plan y sigue.',
          'El déficit prolongado también necesita deloads y días libres.',
        ],
      },
    ],
    sourceUrl: '',
  },
]
