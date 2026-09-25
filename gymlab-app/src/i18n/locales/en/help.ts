// Catálogo central de ayudas contextuales (F90). Cada entrada se consume con
// <InfoTip id="..."/>; el registro tipado vive en src/i18n/help.ts.
export const help = {
  recovery: {
    label: 'How the recovery score is calculated',
    body: 'The score combines your last workout (rest days), sleep, soreness and your streak. Each signal scores 0 to 100 and weighs in according to the data available. Ranges: 0–{{restMax}}, better rest; {{maybeMin}}–{{maybeMax}}, could train; {{readyMin}}–100, ready to train.',
  },
  deload: {
    label: 'What is a deload week',
    body: 'A week with less load to recover and come back stronger: reduce the weight ({{pct}}%) keeping sets and frequency. The marker turns off by itself after 7 days; it does not change weights or sets of your routines.',
  },
  insightAlza: {
    label: 'What higher volume means',
    body: 'Volume is the total weekly load (kg: sets × weight). Going up more than 5% versus last week is a good sign; keep your technique and rest to sustain it.',
  },
  insightDescenso: {
    label: 'What lower volume means',
    body: 'Volume is the total weekly load (kg: sets × weight). A drop of more than 10% versus last week may point to fatigue or less consistency; it is a reference, listen to your body.',
  },
  insightEstable: {
    label: 'What steady volume means',
    body: 'Volume is the total weekly load (kg: sets × weight). It is considered steady when it varies less than ±10% versus last week. It is only informative, it does not change your plan.',
  },
  grasa: {
    label: 'How body fat % is calculated',
    body: 'The % is estimated with the Jackson-Pollock protocol (7 skinfolds, or 3 if data is missing) and the Siri equation. It is a reference: it depends on caliper technique, hydration and the observer.',
  },
  medidasCorporales: {
    label: 'Why record measurements',
    body: 'Always measure at the same points and at similar times so the trend stays reliable. The app keeps one record per day and computes health ratios (waist/height, waist/hip) and left-right symmetry.',
  },
  volumen: {
    label: 'How volume is calculated',
    body: 'Volume is the sum of weight × reps across your completed sets. The app groups it by week (Monday to Sunday) so you can see whether it goes up or down versus previous weeks.',
  },
  volumenMuscular: {
    label: 'How volume is split by muscle',
    body: 'Each set adds its weight × reps to the main muscle group of the exercise. The chart shows how much of the volume each group took in the selected period.',
  },
  carga: {
    label: 'What session load means',
    body: 'Each point summarizes a session: the line follows the highest weight lifted on the charted exercise (warm-up sets excluded). The golden dot marks your PR (best mark) on that exercise.',
  },
  e1rm: {
    label: 'What estimated 1RM means',
    body: 'The maximum weight you could lift once, estimated with the Brzycki formula (weight × 36 ÷ (37 − reps)) from your best set of each session. The golden dot highlights your latest record.',
  },
  frecuencia: {
    label: 'How frequency is calculated',
    body: 'It counts how often you trained each muscle group and compares it with its weekly target. If you deviate more than {{pct}}% from the target, it shows up as an alert.',
  },
  pushPull: {
    label: 'How the balance is calculated',
    body: 'It splits your volume into push (chest, triceps, shoulder), pull (back, biceps, traps, forearms) and legs (legs, glutes, abs). If the push–pull difference is over {{pct}} points, the app flags it so you can balance it.',
  },
  imc: {
    label: 'What BMI means',
    body: 'It relates your weight and height (weight ÷ height²). Reference ranges: below {{bajo}}, underweight; from {{bajo}} to {{normal}}, normal; from {{normal}} to {{sobrepeso}}, overweight; from {{sobrepeso}} up, obesity. It is a reference, not a medical assessment.',
  },
  ratios: {
    label: 'What the ratios mean',
    body: 'Waist/height: up to {{whtrOk}} is considered healthy, and above {{whtrMedio}} the risk is high. Waist/hip: under {{whrHombre}} for men and {{whrMujer}} for women is considered low. They are references.',
  },
  rpe: {
    label: 'What RPE means',
    body: 'Rate of perceived exertion of the set: 10 is the maximum (you could not do another rep). The app uses it to adjust the suggested rest.',
  },
  rir: {
    label: 'What RIR means',
    body: 'Reps in reserve: how many more reps you could have done when you finished the set. 0 means you went to failure. With RIR 0–1, the app softens the weight jump it suggests for the next set.',
  },
} as const
