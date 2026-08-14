// Traducciones EN de las 18 guías informativas (clave = slug ES del seed).
// Contenido divulgativo equivalente al español, mismo tono y estructura.
export interface GuideSectionEn {
  title: string
  content: string
  bullets: string[]
}

export interface GuideEn {
  title: string
  summary: string
  keyPoints: string[]
  sections: GuideSectionEn[]
}

export const GUIDES_EN: Record<string, GuideEn> = {
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
          'The app’s calorie calculator gives you a starting point.',
          'Change one thing at a time: weighing yourself and adjusting is more reliable than improvising.',
          'Consistency over months beats one perfect day.',
        ],
      },
    ],
  },
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
          'Adjust portions to your weight, not your training partner’s.',
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
          'On heavy session days, move or increase carbs to the previous meal; on rest days you can distribute them more freely. If you train in the morning, the previous dinner and that breakfast are your two “energy meals”.',
        bullets: [
          'A meal 1–3 h before training with carbs and some protein.',
          'After training, a normal meal covers recovery.',
          'On a bulk you do not need to stuff yourself: a moderate surplus is enough.',
        ],
      },
    ],
  },
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
          'Creatine monohydrate has decades of research behind it: it increases strength and lean mass in strength training, especially in high-intensity sets. It is taken daily (3–5 g) with no need for a “loading phase”.',
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
          'Pre-workout caffeine improves performance at moderate doses (1.5–3 mg/kg, ~60–90 min before). Omega-3 and vitamin D only if there is a real deficiency. “Fat burners” or stimulant-loaded pre-workouts usually promise more than they deliver.',
        bullets: [
          'Caffeine: be careful not to take it late if it affects your sleep.',
          'Vitamins: a blood test beats supplementing blindly.',
          'Be wary of supplements with long lists of “miracle” effects.',
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
  'progresion-sobrecarga': {
    title: 'Progression and overload',
    summary: 'How to increase loads or reps sustainably.',
    keyPoints: [
      'Add weight or reps every 1–2 weeks if you complete your sets with good form.',
      'Prioritize compounds: squat, deadlift, press, row.',
      '2–3 stimuli per muscle group per week usually work well.',
      'Deload every 4–8 weeks if performance drops.',
    ],
    sections: [
      {
        title: 'What is progressive overload?',
        content:
          'It is the principle by which muscle adapts: if you repeat the same stimulus, it stops changing. The key is adding a little more work each week: more weight, more reps or more sets with controlled technique.',
        bullets: [
          'Increase the load only if you completed previous sets with good form.',
          'Go up in small increments: 1.25–2.5 kg on compounds.',
          'If you cannot complete the rep range, keep the weight and gain one rep.',
        ],
      },
      {
        title: 'How to plan the increase',
        content:
          'The simplest rule is “double progression”: if you complete the last 2 sets of the range (for example 3×8) with good technique, add weight next session.',
        bullets: [
          'Log every session: without data you do not know if you are progressing.',
          'Prioritize compounds, but do not neglect accessory volume.',
          'Progress is measured in weeks, not single sessions.',
        ],
      },
      {
        title: 'When NOT to increase',
        content:
          'Accumulated fatigue, poor sleep, sharp pain or broken technique are signs to back off or hold, not to push.',
        bullets: [
          'Failing the same set 2–3 weeks in a row → run a deload.',
          'Sharp joint pain → stop and consult a professional.',
          'Pushing at all costs without recovering is not progress: it is overtraining.',
        ],
      },
    ],
  },
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
  'entrenamiento-mujer-base': {
    title: 'Strength training (basics)',
    summary: 'Same progression logic; prioritize legs/glutes and technique.',
    keyPoints: [
      'Full body 3 days or torso/legs 4 days work very well.',
      'Hip thrust, squat, Romanian deadlift and lunges as a base.',
      'No need to “tone with light weights”: progressive overload is key.',
      'Adjust volume if there is discomfort; listen to your recovery.',
    ],
    sections: [
      {
        title: 'Train strength, not “toning”',
        content:
          'The idea of “toning with light weights” is a myth: muscle develops with progressive overload, just like in any person. Training hard does not “masculinize” you; it gives you firm muscle and an active metabolism.',
        bullets: [
          'Progressive overload (adding weight or reps with good technique) is the base.',
          '6–12 rep sets with real effort work for hypertrophy.',
          'Extra muscle raises your resting calorie burn.',
        ],
      },
      {
        title: 'A structure that works',
        content:
          'A 3-day full body (Monday, Wednesday, Friday) or a 4-day torso/legs split are good starting points. Each session hits legs/glutes and upper body with 2–3 sets per exercise.',
        bullets: [
          'Full body: ideal for 3 days, less time per session.',
          'Torso/legs: more frequency per group if you train 4 days.',
          'Allow ≥48 h before repeating a fatigued group.',
        ],
      },
      {
        title: 'Priority exercises',
        content:
          'Hip thrust, squat, Romanian deadlift and lunges build legs and glutes; rows, presses and pull-ups assist the upper body. Do not neglect your back or core: balance prevents discomfort.',
        bullets: [
          'Hip thrust overloads the glutes without stressing the lower back as much.',
          'Full range and controlled technique count more than the weight on the bar.',
          'Overload applies the same way to every exercise.',
        ],
      },
      {
        title: 'Recovery and cycle',
        content:
          'Recovery is individual: sleep well, eat enough protein and adjust volume on high-fatigue days. Some women notice performance changes depending on their cycle phase: it is normal, not an excuse to skip everything.',
        bullets: [
          'If you perform worse one day, keep technique and drop the load if needed.',
          'Joint pain is not trained through: rest and get it checked.',
          'Progression is measured in weeks, not every session.',
        ],
      },
    ],
  },
  'gluteos-base': {
    title: 'Glutes basics',
    summary: 'Foundations, activation and progression to develop your glutes.',
    keyPoints: [
      'Bases: glute bridge, deep squat, hip thrust, Romanian deadlift and weighted lunges.',
      'Activate beforehand with bridges, clamshells or banded kickbacks.',
      '2–3 glute sessions a week with ≥48 h of recovery.',
      'Full range and progressive overload; common errors: too much weight and limited range.',
    ],
    sections: [
      {
        title: 'The exercises that build the glutes',
        content:
          'The foundation is hip and hinge work: glute bridge, hip thrust, Romanian deadlift and lunges. Complement with deep squats. Together they cover hip extension, vertical push and single-leg stability.',
        bullets: [
          'Hip thrust: maximum glute activation in hip extension.',
          'Romanian deadlift: glutes and hamstrings, posterior chain.',
          'Lunges and squats: legs and glutes in a functional pattern.',
        ],
      },
      {
        title: 'Activation before loading',
        content:
          'Many people have “sleepy” glutes from sitting for hours. Activating beforehand with light, isolated work (bridges, clamshells, banded kickbacks) improves mind-muscle connection and technique.',
        bullets: [
          '2–3 activation exercises, 10–15 reps each.',
          'With or without a band: technique beats resistance.',
          'Focus on squeezing the glute, not the lower back.',
        ],
      },
      {
        title: 'Progression and common errors',
        content:
          'Add weight gradually and keep full range: a half-range hip thrust trains less. Typical mistakes are loading too much (the lower back compensates for the glutes) and doing short ranges or bounces.',
        bullets: [
          'Full range with a pause at the top: that is where the stimulus is.',
          'Control the descent; do not let gravity drop the weight.',
          'Sharp lower back pain → drop the load and review technique.',
        ],
      },
      {
        title: 'Frequency and recovery',
        content:
          '2–3 glute sessions a week work well, with at least 48 h of recovery between hard sessions of the same group. The glutes are a large muscle and respond to distributed volume.',
        bullets: [
          'Better 2–3 spread sessions than one brutal one.',
          'Heavy hip thrust may need 2–3 min of rest between sets.',
          'Enough food and sleep sustain progression.',
        ],
      },
    ],
  },
  'hiit-vs-liss': {
    title: 'HIIT vs LISS',
    summary: 'Which cardio to choose for your goal and how to combine them.',
    keyPoints: [
      'HIIT: short bursts at high intensity (e.g. 30 s hard / 90 s easy). Saves time and burns a lot in a short while.',
      'LISS: 20–40 min at an easy pace (walking, bike, elliptical). Easy to recover from and compatible with any day.',
      'For hypertrophy, LISS does not interfere if you eat enough; too much HIIT can.',
      'Typical combination: 1–2 HIIT + 2–3 LISS a week depending on gym days.',
    ],
    sections: [
      {
        title: 'What each one is',
        content:
          'HIIT alternates near-maximal bursts (15–60 s) with short rests; you are done in 15–25 min. LISS is low-intensity cardio at a steady pace (20–40 min) where you can talk without gasping: brisk walking, easy bike, elliptical.',
        bullets: [
          'HIIT: short, demanding session, high recovery demand.',
          'LISS: gentle, sustainable daily, barely takes away from strength.',
          'Both improve cardiovascular health; they choose differently.',
        ],
      },
      {
        title: 'Which one is right for you?',
        content:
          'If you train strength and your goal is hypertrophy, LISS is your ally: it adds health and calorie burn without interfering with recovery. HIIT shines when time is short or you want conditioning fast, but it demands energy that may be missing on leg days.',
        bullets: [
          'Strength days + HIIT right after → worse performance in both.',
          'Too much HIIT raises fatigue and can slow muscle gain.',
          'LISS fits any time of day without preparation.',
        ],
      },
      {
        title: 'How to combine them',
        content:
          'A typical pattern: 1–2 HIIT sessions (15–20 min) on light days or as a weekend finisher, and 2–3 LISS sessions (20–40 min) on rest days or after strength. Start with one of each if you are not used to it.',
        bullets: [
          'HIIT: warm up 5 min first; 3–5 intervals are enough to start.',
          'LISS: conversational pace; add minutes gradually.',
          'Listen to fatigue: cardio should add to you, not empty your legs.',
        ],
      },
      {
        title: 'About “burning” calories',
        content:
          'HIIT burns more per minute and a bit after you finish (EPOC); LISS burns more in total due to duration. At the end of the week, total calories burned decide more than the intensity of the day.',
        bullets: [
          'Burning fat depends on accumulated deficit, not the type of cardio.',
          'Cardio does not replace a good diet.',
          'Choose the one you can sustain for weeks: adherence wins.',
        ],
      },
    ],
  },
  estancamiento: {
    title: 'Plateau: what to do',
    summary: 'Common causes of not progressing and how to break through.',
    keyPoints: [
      'Review your log: if you have been stuck at the same weight and reps for weeks, you need overload or changes.',
      'It is usually lack of volume, sleep or food, not motivation.',
      'Add sets, improve technique or change exercises for 4–6 weeks.',
      'If you fail the same set several weeks in a row, deload and then adjust loads.',
    ],
    sections: [
      {
        title: 'Diagnose before touching anything',
        content:
          'Plateaus usually have clear causes. Check first: do you eat and sleep enough? Are weight and reps stuck for weeks? Are you training with real effort or just “going through the motions”? With the app log you can see it in a minute.',
        bullets: [
          'The log lies less than memory: use the history.',
          'Degrading technique also slows progress.',
          'A bad day is not a plateau: 3–4 weeks without progress is.',
        ],
      },
      {
        title: 'Most frequent causes',
        content:
          'The three usual culprits are: little real volume or intensity, insufficient recovery (sleep/food) and always-identical exercises or ranges. “Lack of motivation” is almost never the root problem.',
        bullets: [
          'Lack of overload: add weight, reps or sets in a planned way.',
          'Lack of sleep: lowers performance and protein synthesis.',
          'Lack of food: without energy there is no sustained progress.',
        ],
      },
      {
        title: 'What to change first',
        content:
          'Before changing programs: ensure technique, raise the real effort of your sets and add 1 set or 1 rep per exercise each week. If it does not respond in 2–3 weeks, introduce variation: another similar exercise, more frequency or different ranges.',
        bullets: [
          'Progressive overload is the first button to press.',
          'Switching exercises for 4–6 weeks can re-stimulate growth.',
          'Do not change routines every week: change also needs time.',
        ],
      },
      {
        title: 'Deload as the solution',
        content:
          'If you fail the same set several weeks and your body feels heavy, cut the load ~40–50% for one week keeping the pattern. You recover without losing the stimulus, and you usually start progressing again in 1–2 weeks.',
        bullets: [
          'A deload is not a week off: it is light, deliberate training.',
          'If you are still stuck after the deload, review volume and diet.',
          'When in doubt, consult a professional: sometimes the block is technical or medical.',
        ],
      },
    ],
  },
  deload: {
    title: 'Deload week',
    summary: 'Lower intensity to recover and come back stronger.',
    keyPoints: [
      'Every 4–8 weeks or when performance drops, cut load ~40–50% with the same sets.',
      'Keep technique and frequency; lower weight and intensity, not gym attendance.',
      'One week is enough: returning to previous levels usually takes a few days.',
      'It is not losing progress: it is the stimulus that enables the following weeks of progress.',
    ],
    sections: [
      {
        title: 'What it is and what it is for',
        content:
          'A deload is a planned week of reduced load (weight and intensity) that lets the nervous system and muscle recover without stopping training. It is not losing progress: it is the “reset” that lets you keep advancing afterwards.',
        bullets: [
          'Cut the weight ~40–50% keeping sets and technique.',
          'Keep the frequency: still moving the pattern helps preserve gains.',
          'Intensity (RPE) drops; the rest of the stimulus is preserved.',
        ],
      },
      {
        title: 'When to do it',
        content:
          'Two valid options: by calendar (every 4–8 weeks of a block) or by signals (declining performance, high fatigue, bad sleep, heavy joints). The “by signals” criterion fits real life better.',
        bullets: [
          'By calendar: steady, easy to plan.',
          'By signals: more precise, avoids hitting exhaustion.',
          'Clear signal: loads you used to move easily now feel twice as hard.',
        ],
      },
      {
        title: 'How to design the week',
        content:
          'Same routine structure, but with ~40–50% less load and leaving 1–2 reps in reserve. You can also cut the number of sets in half if the week has been hard. Do not add extra cardio or invented sessions.',
        bullets: [
          'Training should feel “easy”: that is the sign you are recovering.',
          'Keep perfect technique: it is a week to polish it.',
          'One week is enough; stretching longer can detrain you.',
        ],
      },
      {
        title: 'After the deload',
        content:
          'Return with previous loads: the first week may feel heavy, the second you should be back at your usual numbers and starting to beat them. If you are still flat by the third, review volume, diet and sleep before pushing.',
        bullets: [
          'Do not try to “make up for lost time” by jumping up all at once.',
          'A deload is not an excuse to drop habits: sleep and eat just as well.',
          'The best progress usually comes the week after a deload.',
        ],
      },
    ],
  },
  'espalda-segura': {
    title: 'Safe back in the gym',
    summary: 'Basic technique to protect your lower back on lifts and rows.',
    keyPoints: [
      'In deadlift and row: neutral back, not rounded; push with your legs and brace your core.',
      'The belt does not replace technique: use it for heavy loads, not to lift badly.',
      'If you feel sharp or radiating lower back pain, stop and consult a professional.',
      'Build stiffness: inhale and brace your abdomen before each heavy rep.',
    ],
    sections: [
      {
        title: 'Neutral spine is everything',
        content:
          'In hinges (deadlift, Romanian deadlift, weighted rows) the spine must keep its natural curves: not rounded, not hyperextended. The “set-up” is built by bracing the abdomen and keeping the chest high, not by craning your head.',
        bullets: [
          'A rounded back under load is the recipe for lower back pain.',
          'Hyperextending on the way up is also wrong: hold the neutral position.',
          'Start the deadlift pushing with your legs, not pulling with your back.',
        ],
      },
      {
        title: 'Breathing and stiffness',
        content:
          'Before each heavy rep: inhale, brace the abdomen and hold the pressure during the movement. That “abdominal stiffness” protects the lower back better than any belt.',
        bullets: [
          'Hold the brace through the whole range, not just at the start.',
          'Do not squeeze your breath until dizzy: control it and exhale at the end.',
          'The belt helps on heavy loads, but technique rules.',
        ],
      },
      {
        title: 'Your core is your best insurance',
        content:
          'Core exercises (plank, bird dog, pallof press) teach you to stabilize the spine under load. A strong core is not just “visible abs”: it is lower back protection in any compound exercise.',
        bullets: [
          'Plank and bird dog: stability without overloading the lower back.',
          'Pallof press trains anti-rotation, very useful for asymmetric loads.',
          'Do them on rest days too: they barely fatigue you.',
        ],
      },
      {
        title: 'When to stop and ask for help',
        content:
          'Distinguish muscle soreness (normal after training) from joint or radiating pain (a signal to stop). If you feel sharp lower back pain, tingling or pain running down your leg, stop and consult a professional.',
        bullets: [
          'Pain that worsens with loading is a red flag, not “grind and go on”.',
          'For persistent back discomfort, review technique and volume before adding load.',
          'A professional (physiotherapist) can get you back to training more safely.',
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
          'Drink water: weight that “will not go down” is sometimes retention, not fat.',
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
  sobreentrenamiento: {
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
          'Overtraining: weeks without improving even if you “rest”.',
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
          'Reduce volume or intensity for 1–2 weeks (deload style), sleep 7–9 h every night and eat enough protein and carbs. Do not add cardio “to compensate”: that makes it worse.',
        bullets: [
          'A well-done deload is usually enough to feel relief within a week.',
          'Reintroduce volume gradually, not all at once.',
          'If you still feel bad after 2 weeks of real rest, consult a professional.',
        ],
      },
      {
        title: 'Prevention: think in weeks',
        content:
          'Progress is long-term: plan blocks with deloads, listen to signals before “pushing harder” and understand that muscle grows while you recover. One weak week does not ruin a year; an injury can.',
        bullets: [
          'Schedule deloads every 4–8 weeks before your body asks for them.',
          'Sleep and food are part of training, not extras.',
          'More is not better: better is more well done and better recovered.',
        ],
      },
    ],
  },
  'tecnica-sentadilla': {
    title: 'Squat technique',
    summary: 'Pattern, foot position and common errors in the barbell squat.',
    keyPoints: [
      'Feet at shoulder width, toes slightly turned out.',
      'Hips back and a controlled descent as deep as your technique holds.',
      'Knees tracking the toes; chest open, neutral spine.',
      'Drive with your whole foot to stand up, not your toes.',
    ],
    sections: [
      {
        title: 'Starting position',
        content:
          'Place the bar on your traps (high bar) or rear deltoids (low bar). Feet at shoulder width, toes turned out ~15–30°. Inhale and brace your abdomen before starting.',
        bullets: [
          'Bar well centered so your trunk does not twist.',
          'Feet firm on the floor: heels do not lift.',
          'A wide, active grip gives stiffness to the upper body.',
        ],
      },
      {
        title: 'Descent and ascent',
        content:
          'Start the movement with your hips back while bending your knees at the same time. Lower under control keeping a neutral spine; go as deep as your mobility allows without losing the lumbar arch.',
        bullets: [
          'Knees push in the same direction as your toes.',
          'Keep your chest open; do not let your gaze drop.',
          'Stand by pushing against the floor with the whole foot.',
        ],
      },
      {
        title: 'Common errors',
        content:
          'The most frequent are: heels lifting, knees caving in, a rounded back at the bottom and lowering too fast.',
        bullets: [
          'Heels lifting → ankle mobility or foot width.',
          'Knees caving in → lack of strength or not pressing the knees out on purpose.',
          'Persistent anterior knee pain → review technique and depth.',
        ],
      },
      {
        title: 'Useful variations',
        content:
          'If the bar on your back bothers you or you are learning, the goblet squat or front squat teach upright trunk position and depth better.',
        bullets: [
          'Goblet: ideal for beginners thanks to the front-loaded pattern.',
          'Front squat: forces you to keep the elbows high and chest up.',
          'Box squat: teaches depth and controlled braking.',
        ],
      },
    ],
  },
  'press-banca-progresion': {
    title: 'Bench press progression',
    summary: 'Technique, grip and how to add kilos sustainably.',
    keyPoints: [
      'Retracted, stable shoulder blades; feet firm on the floor.',
      'Bar in line with your wrists; elbows at ~45° to the torso.',
      'Add weight with “double progression”: if you close the range with good technique, increase.',
      'The weakest point is usually the press off the chest: train it with pauses or dumbbell presses.',
    ],
    sections: [
      {
        title: 'Base technique',
        content:
          'Lie with your feet firm, retract and set your shoulder blades (shoulders back and down). Grip the bar slightly wider than shoulders, lower it under control touching your chest without bouncing and press to lockout without letting the shoulder blades slide.',
        bullets: [
          'Wrists aligned: the bar over the base of the hand, not the fingers.',
          'Elbows at ~45° protect the shoulder (no “chicken wings”).',
          '“High” chest: a slight arch and stable shoulders protect the rotator cuff.',
        ],
      },
      {
        title: 'How to add weight',
        content:
          'Use the “double progression” rule: if you complete the last two sets of the range (e.g. 4×6) with controlled technique, add 2.5 kg next session. Small increments add up: 2.5 kg per cycle is ~30 kg a year.',
        bullets: [
          'Alternate strength sessions (few reps, heavy weight) and volume (more reps).',
          'Include incline press and dumbbell press to support progression.',
          'Log every session: real progress shows up in weeks.',
        ],
      },
      {
        title: 'Frequent weak points',
        content:
          'If you fail the press off the chest, build the pause press (1 s on the chest) and dumbbell press. If you fail at lockout, work close-grip bench press or dips.',
        bullets: [
          'Pause on the chest: removes the bounce and builds pressing strength.',
          'Unstable shoulder → drop the load and fix the elbow angle.',
          'If your chest grows but triceps do not, prioritize triceps work.',
        ],
      },
      {
        title: 'Bench press safety',
        content:
          'Never go to failure without a spotter or rack safety pins. The bar at your neck is unforgiving. If you train alone, use a bench with safety supports or a spotter.',
        bullets: [
          'Spotters: agree on signals before starting.',
          'Rack pins at chest height: emergency stop.',
          'No thumbless grip if you use a spotter (it prevents dropping the load).',
        ],
      },
    ],
  },
  principiante: {
    title: 'Beginner’s guide',
    summary: 'First weeks: technique, structure and what to expect.',
    keyPoints: [
      'Learn the pattern before the weight: squat, push, pull, hinge.',
      'Start with 3 full body days a week.',
      'Early progression is fast: use the log to increase safely.',
      'Intense muscle soreness in the first days is normal; it is not strength or injury.',
    ],
    sections: [
      {
        title: 'The first days',
        content:
          'Spend 2–3 weeks learning the basic patterns with light loads or bodyweight: squat, push (press), pull (row/assisted pull-up) and hip hinge. Technique learned early protects you for life.',
        bullets: [
          'Videoing yourself saves errors that are hard to fix later.',
          'If an exercise hurts a joint (not a muscle), stop.',
          'Next-day muscle soreness is normal; sharp pain is not.',
        ],
      },
      {
        title: 'Week structure',
        content:
          'A 3-day full body (Monday, Wednesday, Friday) is ideal to start: each session touches all groups with 1–2 exercises per pattern. Leave at least one rest day between sessions.',
        bullets: [
          'Typical session: squat or legs, press, row, core.',
          '2–3 sets of 8–12 reps per exercise in the first weeks.',
          'Rest 1–3 min between sets; write down weight and reps.',
        ],
      },
      {
        title: 'What to expect (and what not)',
        content:
          'Early progress can be fast thanks to neural adaptation, not muscle yet. Do not expect visible changes in the first week: the weekly log (weight on the bar) is the best indicator.',
        bullets: [
          'Strength rises fast at first: it is normal and motivating.',
          'Visible changes usually arrive from week 4–8.',
          'If you do not progress one week, check sleep and food before changing the plan.',
        ],
      },
      {
        title: 'Typical beginner mistakes',
        content:
          'Starting too heavy, skipping the warm-up, copying advanced programs or changing routines every week.',
        bullets: [
          'More weight does not teach you faster: it teaches you badly.',
          'Warm up 5–10 min: the warm-up is part of training.',
          'Consistency over months beats one week of perfect intensity.',
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
          'Ideal the day after a hard session of the same group, or on scheduled rest days when you feel stiff. It also works as “unloading” during deload weeks.',
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
          'Stretching does not make you “recover faster” on its own, but it relieves stiffness.',
          'Foam rolling and massage: pleasant, they do not replace rest.',
          'The best active recovery is the one you will actually do.',
        ],
      },
    ],
  },
  hidratacion: {
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
