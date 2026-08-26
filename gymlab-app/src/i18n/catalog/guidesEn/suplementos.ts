import type { GuideEn } from '../guidesEn'

export const seedGuidesEn_suplementos: Record<string, GuideEn> = {
  'suplementos-base': {
    title: 'Supplements with the most evidence',
    summary: 'Creatine and protein powder as a base; the rest is optional.',
    keyPoints: [
      'Creatine monohydrate: 3–5 g/day, every day.',
      'Whey or another protein: 20–30 g when the diet falls short.',
      'Real food and sleep matter more than any pill.',
      'Informational: not a substitute for medical or nutritional advice.',
    ],
    sections: [
      {
        title: 'Creatine: the best-evidenced supplement',
        content:
          'Creatine monohydrate has decades of research behind it: it increases strength and lean mass in strength training, especially in high-intensity sets. It is taken daily (3–5 g) with no need for a "loading phase".',
        bullets: [
          'It accumulates in muscle with daily use; the exact time does not matter.',
          'It is safe in healthy adults at recommended doses.',
          'What you mix it with does not matter: consistency beats the perfect moment.',
        ],
      },
      {
        title: 'Protein powder',
        content:
          'Whey is a convenient way to hit your daily protein, especially if you train and struggle to eat enough. It is not magic: it helps when real food falls short.',
        bullets: [
          'Typical dose: 20–30 g when a meal does not reach your protein target.',
          'Casein or plant proteins (soy, pea) also work.',
          'Real, varied food remains the foundation of the diet.',
        ],
      },
      {
        title: 'And the rest?',
        content:
          'Pre-workout caffeine improves performance at moderate doses (1.5–3 mg/kg, ~60–90 min before). Omega-3 and vitamin D only if there is a real deficiency. "Fat burners" or stimulant-loaded pre-workouts usually promise more than they deliver.',
        bullets: [
          'Caffeine: be careful not to take it late if it affects your sleep.',
          'Vitamins: a blood test beats supplementing blindly.',
          'Be wary of supplements with long lists of "miracle" effects.',
        ],
      },
      {
        title: 'Priority order',
        content:
          'First: eat enough and varied, sleep 7–9 h and train with progression. Then: creatine and, if needed, protein powder. Everything else is optional and with weaker evidence.',
        bullets: [
          'No supplement fixes a bad diet or bad sleep.',
          'Read the label: real dose, not marketing.',
          'Consult a health professional if you take medication.',
        ],
      },
    ],
  },
}
