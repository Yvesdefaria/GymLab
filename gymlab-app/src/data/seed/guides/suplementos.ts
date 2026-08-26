import type { Guide } from '@/domain/types'

export const seedGuides_suplementos: Guide[] = [
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
    sections: [
      {
        title: 'Creatina: el suplemento con más evidencia',
        content:
          'La creatina monohidrato tiene décadas de investigación: aumenta la fuerza y la masa magra en entrenamiento de fuerza, especialmente en series de alta intensidad. Se toma a diario (3–5 g) sin necesidad de «fase de carga».',
        bullets: [
          'Se acumula en el músculo con el uso diario, no importa la hora exacta.',
          'Es segura en adultos sanos en dosis recomendadas.',
          'Con qué mezclarla no importa: constancia > momento perfecto.',
        ],
      },
      {
        title: 'Proteína en polvo',
        content:
          'El whey (suero) es una forma cómoda de llegar a la proteína diaria, sobre todo si entrenas y te cuesta comer suficiente. No es mágica: sirve cuando la comida real se queda corta.',
        bullets: [
          'Dosis típica: 20–30 g cuando una comida no llegue a la proteína.',
          'La caseína o las vegetales (soja, guisante) también valen.',
          'La comida real y variada sigue siendo la base de la dieta.',
        ],
      },
      {
        title: 'Y el resto, ¿qué?',
        content:
          'La cafeína pre-entreno mejora el rendimiento en dosis moderadas (1,5–3 mg/kg, ~60–90 min antes). La omega-3 y la vitamina D solo si hay déficit real. Los «quemagrasas» o los pre-entrenos cargados de estimulantes suelen prometer más de lo que cumplen.',
        bullets: [
          'Cafeína: atentos a no consumirla tarde si afecta al sueño.',
          'Vitaminas: más vale un análisis que suplementarse a ciegas.',
          'Desconfía de suplementos con listas largas de efectos «milagro».',
        ],
      },
      {
        title: 'Orden de prioridades',
        content:
          'Primero: comer suficiente y variado, dormir 7–9 h y entrenar con progresión. Después: creatina y, si falta, proteína en polvo. Todo lo demás es opcional y con evidencia menor.',
        bullets: [
          'Ningún suplemento arregla una dieta o un sueño malos.',
          'Lee la etiqueta: dosis real, no marketing.',
          'Consulta a un profesional de la salud si tomas medicación.',
        ],
      },
    ],
    sourceUrl: '',
  },
]
