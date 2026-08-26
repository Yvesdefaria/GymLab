import type { GuideEn } from '../guidesEn'

export const seedGuidesEn_recuperacion: Record<string, GuideEn> = {
  'recuperacion-sueno': {
    title: 'Recovery and sleep',
    summary: 'Muscle grows outside the gym.',
    keyPoints: [
      'Target: 7–9 hours of sleep.',
      'Allow ~48 h between hard sessions of the same muscle group.',
      'LISS cardio 20–40 min does not hinder hypertrophy if you eat enough.',
      'Sharp joint pain: stop and get it checked by a professional.',
    ],
    sections: [
      {
        title: 'Why sleep builds muscle',
        content:
          'Training is the stimulus, but protein synthesis (muscle growth) happens mostly during rest and deep sleep. Sleeping less than 6 h noticeably reduces your ability to recover and perform.',
        bullets: [
          '7–9 hours is the target range for adults.',
          'Growth hormone is released mainly in deep sleep.',
          'With short sleep, perceived effort rises and technique worsens.',
        ],
      },
      {
        title: 'Practical sleep hygiene',
        content:
          'A consistent schedule matters more than the hours themselves. Go to bed and wake up at the same time, even on weekends.',
        bullets: [
          'Reduce screens 30–60 min before sleeping.',
          'Eat a light, early dinner: heavy meals delay sleep.',
          'Caffeine: no coffee or stimulating tea after mid-afternoon.',
          'Dark, cool and quiet bedroom.',
        ],
      },
      {
        title: 'Recovery between sessions',
        content:
          'The same muscle group usually needs ~48 h between hard sessions. Active rest (walking, mobility, light cardio) helps recovery better than total inactivity.',
        bullets: [
          'If a muscle is still sore after more than 72 h, reduce intensity in that area.',
          'Distinguish muscle soreness from joint pain: the latter is a signal to stop.',
          'Food (enough protein and energy) is part of recovery.',
        ],
      },
    ],
  },
  'sobreentrenamiento': {
    title: 'Overtraining and overreaching',
    summary: 'Signs that you are training too much and how to adjust.',
    keyPoints: [
      'Signs: persistent tiredness, poor sleep, stalled or falling strength, new aches.',
      'More is not always better: progress happens during recovery.',
      'Reduce volume or intensity for a week and watch how your body responds.',
      'Distinguish short-term fatigue from real overtraining; when in doubt, consult a professional.',
    ],
    sections: [
      {
        title: 'Short-term fatigue vs. overtraining',
        content:
          'Feeling tired after a hard week is normal fatigue and resolves with rest. Real overtraining is a prolonged state (weeks) of stalled or falling performance that does not improve with a few days off.',
        bullets: [
          'Short-term fatigue: 1–3 days and you are back at 100%.',
          'Overtraining: weeks without improving even if you "rest".',
          'Most people do not overtrain: they train and recover badly.',
        ],
      },
      {
        title: 'Signals to watch',
        content:
          'Tiredness that does not go away, insomnia or non-restorative sleep, strength dropping despite effort, new aches, irritability or loss of motivation and appetite. Several together for weeks point to accumulating too much.',
        bullets: [
          'Poor sleep is one of the clearest and most ignored signals.',
          'Strength stalled for several weeks with good technique is another.',
          'New joint aches are not trained through: they are assessed.',
        ],
      },
      {
        title: 'How to get out of the hole',
        content:
          'Reduce volume or intensity for 1–2 weeks (deload style), sleep 7–9 h every night and eat enough protein and carbs. Do not add cardio "to compensate": that makes it worse.',
        bullets: [
          'A well-done deload is usually enough to feel relief within a week.',
          'Reintroduce volume gradually, not all at once.',
          'If you still feel bad after 2 weeks of real rest, consult a professional.',
        ],
      },
      {
        title: 'Prevention: think in weeks',
        content:
          'Progress is long-term: plan blocks with deloads, listen to signals before "pushing harder" and understand that muscle grows while you recover. One weak week does not ruin a year; an injury can.',
        bullets: [
          'Schedule deloads every 4–8 weeks before your body asks for them.',
          'Sleep and food are part of training, not extras.',
          'More is not better: better is more well done and better recovered.',
        ],
      },
    ],
  },
  'recuperacion-activa': {
    title: 'Active recovery',
    summary: 'What it is, when to do it and examples of light days.',
    keyPoints: [
      'Light movement that promotes circulation without adding fatigue.',
      'Walking, easy cycling, gentle swimming or mobility: 20–40 min.',
      'Better than total rest for muscle soreness in the 24–72 h window.',
      'It does not count as hard training; it does not replace rest.',
    ],
    sections: [
      {
        title: 'What is active recovery?',
        content:
          'It is low-to-moderate intensity activity that keeps the body moving on rest days. It promotes blood flow and mobility, and helps post-workout muscle soreness (DOMS) clear faster than total rest.',
        bullets: [
          'Intensity that lets you talk naturally.',
          'Typical duration of 20–40 minutes.',
          'Better movement than the couch, but without loading the fatigued muscle.',
        ],
      },
      {
        title: 'When to use it',
        content:
          'Ideal the day after a hard session of the same group, or on scheduled rest days when you feel stiff. It also works as "unloading" during deload weeks.',
        bullets: [
          'Soreness from effort → light active recovery.',
          'General fatigue → an easy walk instead of training.',
          'Sharp joint pain → no: rest and get it checked.',
        ],
      },
      {
        title: 'Practical examples',
        content:
          'A 30 min brisk walk, easy cycling, gentle swimming, dynamic stretches or a mobility session (knees, hips, shoulders) without weight.',
        bullets: [
          'Stretching does not make you "recover faster" on its own, but it relieves stiffness.',
          'Foam rolling and massage: pleasant, they do not replace rest.',
          'The best active recovery is the one you will actually do.',
        ],
      },
    ],
  },
}
