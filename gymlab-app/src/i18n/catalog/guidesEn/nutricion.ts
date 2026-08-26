import type { GuideEn } from '../guidesEn'

export const seedGuidesEn_nutricion: Record<string, GuideEn> = {
  'macros-basicos': {
    title: 'Basic macros for training',
    summary: 'Orienting protein, carbs and fats depending on your goal.',
    keyPoints: [
      'Protein: 1.6–2.2 g/kg of body weight per day.',
      'Carbs: 4–7 g/kg depending on training volume.',
      'Fats: 0.8–1 g/kg (approx. 20–30% of calories).',
      'Bulk: surplus ~10–15%. Cut: deficit ~15–20%.',
    ],
    sections: [
      {
        title: 'Protein: the key macronutrient',
        content:
          'Protein provides the amino acids that repair muscle after training. Around 1.6–2.2 g per kg of body weight per day covers most cases; spreading it over 3–5 doses of 0.4 g/kg helps you make better use of it.',
        bullets: [
          'Sources: meats, fish, eggs, dairy, legumes, tofu, soy.',
          'A post-workout shake is not mandatory if you already eat enough protein during the day.',
          'Going above 2.2 g/kg rarely adds more: the daily total is what matters.',
        ],
      },
      {
        title: 'Carbs: your training fuel',
        content:
          'Carbs are the main energy source for heavy sets. You need more on leg days or long sessions and less on rest days. The 4–7 g/kg range works well for strength training with some cardio.',
        bullets: [
          'Prioritize rice, potato, oats, bread, fruit and legumes.',
          'Time them around training: a carb meal 1–3 h before improves performance.',
          'On a cut they go down, but you do not need to eliminate them.',
        ],
      },
      {
        title: 'Fats and total calories',
        content:
          'Fats support hormones and vitamin absorption; keeping them near 0.8–1 g/kg covers what you need. In the end, what decides your weight is calorie balance: a moderate surplus to gain, a gentle deficit to lose.',
        bullets: [
          'Quality fats: olive oil, nuts, avocado, fatty fish.',
          'Without a surplus, muscles grow little even if you train well.',
          'Without a deficit, you will not lose fat sustainably.',
        ],
      },
      {
        title: 'How to start without stress',
        content:
          'You do not need to weigh every gram from day one. Start by setting an approximate calorie goal, hit your protein and split the rest. Adjust after 2–3 weeks based on the scale and your performance.',
        bullets: [
          'The app\u2019s calorie calculator gives you a starting point.',
          'Change one thing at a time: weighing yourself and adjusting is more reliable than improvising.',
          'Consistency over months beats one perfect day.',
        ],
      },
    ],
  },
  'hidratacion': {
    title: 'Hydration for training',
    summary: 'How much water to drink and how to replenish salts at the gym.',
    keyPoints: [
      'Drink in the hours beforehand: ~500 ml before training.',
      'Losing 1–2% of water already hurts performance and focus.',
      'Clear urine is a good hydration sign.',
      'On long or very sweaty sessions, add electrolytes.',
    ],
    sections: [
      {
        title: 'How much water you need',
        content:
          'As a base reference: ~30–35 ml per kg of body weight per day (a 70 kg person ≈ 2.1–2.5 l), and more if it is hot or you train with heavy sweating. Thirst is already a late symptom: better to drink throughout the day.',
        bullets: [
          'Clear or straw-colored urine is a sign of good hydration.',
          'Before training: ~500 ml in the 2 h beforehand.',
          'Sip during the session: ~150–250 ml every 15–20 min.',
        ],
      },
      {
        title: 'Water, electrolytes and performance',
        content:
          'Losing 1–2% of body weight in water lowers strength, speed and focus, and raises perceived effort. On sessions over ~60–90 min or with very heavy sweating, water alone is not enough: replenish sodium and potassium.',
        bullets: [
          'Water + some salt in your food usually covers normal workouts.',
          'Sports drinks: useful on long sessions, not needed daily.',
          'Beware of excess sugary drinks: calories that add nothing.',
        ],
      },
      {
        title: 'Warning signs',
        content:
          'Intense thirst, dry mouth, very dark urine, dizziness or cramps can indicate dehydration. If you train in heat and confusion or vomiting appear, stop and seek medical attention.',
        bullets: [
          'Urine color is the most reliable, free indicator.',
          'Cramps can come from dehydration and lack of salts.',
          'Rehydrate progressively, not all at once.',
        ],
      },
    ],
  },
}
