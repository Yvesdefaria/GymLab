import type { GuideEn } from '../guidesEn'

export const seedGuidesEn_dietas: Record<string, GuideEn> = {
  'menu-volumen-orientativo': {
    title: 'Sample bulking meal plan',
    summary: 'Example meal structure for a moderate surplus.',
    keyPoints: [
      'Breakfast: oats + dairy + fruit + nuts.',
      'Lunch: rice or potato + lean protein + vegetables.',
      'Snack: whole-grain bread + tuna or eggs.',
      'Dinner: tuber + fish or turkey + salad.',
      '5–6 meals help spread protein.',
    ],
    sections: [
      {
        title: 'General idea of the day',
        content:
          'This menu is a template, not a law: try to have each meal combine a protein source, a carb source and vegetables. Splitting into 4–6 meals helps reach your calorie and protein totals without giant meals.',
        bullets: [
          'Adjust portions to your weight, not your training partner\u2019s.',
          'The daily total matters more than any single meal.',
          'Prep some food: the easiest plan is the one you already have made.',
        ],
      },
      {
        title: 'Full day example',
        content:
          'Breakfast: oats with milk, banana and walnuts. Lunch: rice, chicken breast and vegetables with olive oil. Snack: whole-grain bread with tuna or eggs. Dinner: potato or sweet potato, fish or turkey and salad. Add yogurt or cottage cheese before bed if you are short on protein.',
        bullets: [
          'Drink water throughout the day, not only at meals.',
          'Oats and rice provide steady energy for training.',
          'Vegetables add volume and micronutrients without many calories.',
        ],
      },
      {
        title: 'Adjusting for training',
        content:
          'On heavy session days, move or increase carbs to the previous meal; on rest days you can distribute them more freely. If you train in the morning, the previous dinner and that breakfast are your two "energy meals".',
        bullets: [
          'A meal 1–3 h before training with carbs and some protein.',
          'After training, a normal meal covers recovery.',
          'On a bulk you do not need to stuff yourself: a moderate surplus is enough.',
        ],
      },
    ],
  },
  'menu-definicion': {
    title: 'Sample cutting meal plan',
    summary: 'Meal structure for a moderate deficit without losing performance.',
    keyPoints: [
      'Breakfast: egg whites/eggs + whole-grain bread + fruit.',
      'Lunch: vegetables + lean protein + rice or potato in a moderate amount.',
      'Snack: Greek yogurt or cottage cheese + a few nuts.',
      'Dinner: big salad + grilled fish or chicken.',
      'Deficit of ~15–20% and high protein (≥1.8 g/kg) to keep muscle.',
    ],
    sections: [
      {
        title: 'The golden rule of the deficit',
        content:
          'To cut while keeping muscle: a moderate deficit (~15–20% less than you burn) and high protein (≥1.8 g/kg). A harsh deficit burns muscle as well as fat, and most people cannot sustain it beyond two weeks.',
        bullets: [
          'A gentle deficit = less hunger, more adherence, better performance.',
          'Protein raises satiety and protects lean mass.',
          'Healthy weight loss: ~0.5–1% of body weight per week.',
        ],
      },
      {
        title: 'Day structure',
        content:
          'Breakfast: egg whites or eggs with whole-grain bread and fruit. Lunch: vegetables + lean protein + rice or potato in a moderate amount. Snack: Greek yogurt or cottage cheese with a few nuts. Dinner: big salad with chicken or fish.',
        bullets: [
          'Vegetables fill you up without calories: your best ally against hunger.',
          'Fruit does not make you fat on its own: it fits the deficit with control.',
          'Cook with little fat and weigh your sauces (they hide calories).',
        ],
      },
      {
        title: 'Training in a deficit',
        content:
          'Strength can hold if you eat enough protein and sleep well. Prioritize compounds, respect rest times and do not stack extra volume: recovery is slower in a deficit.',
        bullets: [
          'If strength drops a lot, review the deficit: maybe it is too aggressive.',
          'Cardio helps the calorie burn, but you do not need it to start losing.',
          'Drink water: weight that "will not go down" is sometimes retention, not fat.',
        ],
      },
      {
        title: 'Mistakes that stall a cut',
        content:
          'Skipping meals, eliminating carbs completely, weighing yourself every hour or punishing yourself for one bad day. Cutting is patience: visible changes are measured in weeks and in the mirror, not in daily weight.',
        bullets: [
          'Do not eliminate carbs: they fuel your training and your mind.',
          'One overage day does not ruin the week: get back on plan and keep going.',
          'A long cut also needs deloads and free days.',
        ],
      },
    ],
  },
}
