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
  'recuperacion-completa': {
    title: 'Complete muscle recovery guide',
    summary: 'Window-based protocol and a recovery diary.',
    keyPoints: [
      'Recovery = repairing what you break in the gym.',
      'Windows: pre-workout, 30 min post-workout, rest of day, night and next day.',
      'What ruins it: overtraining, poor sleep, bad nutrition and stress.',
      'A daily diary (1–10) warns you before overtraining hits.',
    ],
    sections: [
      {
        title: 'The recovery windows',
        content:
          'Muscle does not grow while you train, it grows while you recover. Each moment of the day has its role: before training, inside the post-workout window, through the rest of the day, at night and on waking.',
        bullets: [
          'Post-workout (30 min): fast protein + carbs to refill glycogen.',
          'Rest of day: complete meals with protein and slow carbs.',
          'Night: casein or slow protein before bed and real rest.',
          'Next day: active recovery of the trained muscle with light reps.',
        ],
      },
      {
        title: 'What sabotages recovery',
        content:
          'Several factors make a good workout useless: overly long sessions, poor sleep, cardio obsession, poor nutrition, fasting followed by bingeing, high stress, alcohol and monotony.',
        bullets: [
          'Sessions longer than 90 min backfire for most people.',
          'Bad sleep and stress raise cortisol and slow repair.',
          'Alcohol and junk food drain the reserves you need to recover.',
        ],
      },
      {
        title: 'The recovery diary',
        content:
          'Each morning score (1–10) sleep, soreness, fatigue, desire to train, motivation, morning heart rate and weight. If one variable jumps +2, or several +3, take an extra rest day; if +3 across three variables for a week, take a deload week.',
        bullets: [
          'Logging daily is easy and very informative.',
          'High morning heart rate is an early fatigue signal.',
          'The diary anticipates overtraining before it appears.',
        ],
      },
    ],
  },
  'tendinitis-rotuliana': {
    title: 'Patellar tendinitis (jumper\'s knee)',
    summary: 'What it is, symptoms and how to retrain the knee.',
    keyPoints: [
      'Inflammation of the tendon joining the kneecap to the tibia.',
      'Common in jumping, running and quadriceps overload.',
      'Diagnosis: palpation and pain in resisted extension.',
      'Retraining: isometrics first, eccentrics after (HSR protocol).',
    ],
    sections: [
      {
        title: 'What it is and why it appears',
        content:
          'It is the inflammation of the patellar tendon, the last part of the quadriceps. It appears from repeated microtrauma, altered support, weak quadriceps or tight hamstrings. It hurts when jumping, running, bending, and sometimes when sitting.',
        bullets: [
          'There is usually no visible swelling: pain appears with loading.',
          'A high or large patella and altered support increase risk.',
          'If you suspect a tear, ask for an ultrasound or MRI.',
        ],
      },
      {
        title: 'Acute phase (first 72 h)',
        content:
          'Stop the activity that caused it, fix technique and footwear, use anti-inflammatories and ice in the first 48–72 hours, plus a circular strap below the kneecap. Start with quadriceps isometrics; avoid loaded knee extension.',
        bullets: [
          'Ice 15–20 min in the first 72 h.',
          'NSAIDs as advised; do not extend their use.',
          'Quadriceps isometrics keep the tendon active without load.',
        ],
      },
      {
        title: 'Return and prevention',
        content:
          'Progress with slow-tempo knee eccentrics (heavy slow resistance or HSR: 70–85% of your 1RM, 3–4 s lowering, 3 sessions a week). On return: warm up well, use a strap if it helps, stretch the hamstrings and ice 20 min afterwards for about a month.',
        bullets: [
          'Slow eccentric exercise is the best-evidenced approach.',
          'Increase load gradually, not all at once.',
          'If pain returns, ease intensity a week before continuing.',
        ],
      },
    ],
  },
  'espalda-problemas': {
    title: 'Training with back problems',
    summary: 'Postural hygiene and guidance for hyperlordosis and hyperkyphosis.',
    keyPoints: [
      'The spine has natural curves; the problem is overdoing them.',
      'Scoliosis is common and controlled activity helps.',
      'Hyperlordosis: tuck your abdomen and avoid arching the lower back.',
      'Hyperkyphosis: pull shoulders back and train the back with support.',
    ],
    sections: [
      {
        title: 'Lumbar hyperlordosis',
        content:
          'The pelvis tilts forward and the lower back arches too much. Postural hygiene means tucking the abdomen and slightly bending the knees. To train: trunk crunches (not hip crunches), lat work with a back support, glutes and abductors, and seated hamstring curls.',
        bullets: [
          'Avoid hip crunches that worsen lordosis.',
          'Strengthen glutes and abs to stabilise the pelvis.',
          'Stretch the lower back daily.',
        ],
      },
      {
        title: 'Dorsal hyperkyphosis (hump)',
        content:
          'The upper back rounds. Work the mobility and toning of the whole trunk with back support, keeping shoulders back and looking forward.',
        bullets: [
          'Row and scapular work with the trunk supported.',
          'Shoulder mobility and chest opening.',
          'Mindful posture when standing and sitting.',
        ],
      },
      {
        title: 'Cervical',
        content:
          'Improve neck joint mobility and tone the lats and traps with support. For abs, use the hip crunch instead of pulling your neck with your hands.',
        bullets: [
          'Avoid exercises that push the head against resistance.',
          'Strengthen the muscles that support the neck.',
          'For acute or radiating pain, consult a professional.',
        ],
      },
    ],
  },
}
