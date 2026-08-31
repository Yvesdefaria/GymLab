import type { GuideEn } from '../guidesEn'

export const seedGuidesEn_entrenamiento: Record<string, GuideEn> = {
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
          'The simplest rule is "double progression": if you complete the last 2 sets of the range (for example 3×8) with good technique, add weight next session.',
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
        title: 'About "burning" calories',
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
  'estancamiento': {
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
          'Plateaus usually have clear causes. Check first: do you eat and sleep enough? Are weight and reps stuck for weeks? Are you training with real effort or just "going through the motions"? With the app log you can see it in a minute.',
        bullets: [
          'The log lies less than memory: use the history.',
          'Degrading technique also slows progress.',
          'A bad day is not a plateau: 3–4 weeks without progress is.',
        ],
      },
      {
        title: 'Most frequent causes',
        content:
          'The three usual culprits are: little real volume or intensity, insufficient recovery (sleep/food) and always-identical exercises or ranges. "Lack of motivation" is almost never the root problem.',
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
  'deload': {
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
          'A deload is a planned week of reduced load (weight and intensity) that lets the nervous system and muscle recover without stopping training. It is not losing progress: it is the "reset" that lets you keep advancing afterwards.',
        bullets: [
          'Cut the weight ~40–50% keeping sets and technique.',
          'Keep the frequency: still moving the pattern helps preserve gains.',
          'Intensity (RPE) drops; the rest of the stimulus is preserved.',
        ],
      },
      {
        title: 'When to do it',
        content:
          'Two valid options: by calendar (every 4–8 weeks of a block) or by signals (declining performance, high fatigue, bad sleep, heavy joints). The "by signals" criterion fits real life better.',
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
          'Training should feel "easy": that is the sign you are recovering.',
          'Keep perfect technique: it is a week to polish it.',
          'One week is enough; stretching longer can detrain you.',
        ],
      },
      {
        title: 'After the deload',
        content:
          'Return with previous loads: the first week may feel heavy, the second you should be back at your usual numbers and starting to beat them. If you are still flat by the third, review volume, diet and sleep before pushing.',
        bullets: [
          'Do not try to "make up for lost time" by jumping up all at once.',
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
          'In hinges (deadlift, Romanian deadlift, weighted rows) the spine must keep its natural curves: not rounded, not hyperextended. The "set-up" is built by bracing the abdomen and keeping the chest high, not by craning your head.',
        bullets: [
          'A rounded back under load is the recipe for lower back pain.',
          'Hyperextending on the way up is also wrong: hold the neutral position.',
          'Start the deadlift pushing with your legs, not pulling with your back.',
        ],
      },
      {
        title: 'Breathing and stiffness',
        content:
          'Before each heavy rep: inhale, brace the abdomen and hold the pressure during the movement. That "abdominal stiffness" protects the lower back better than any belt.',
        bullets: [
          'Hold the brace through the whole range, not just at the start.',
          'Do not squeeze your breath until dizzy: control it and exhale at the end.',
          'The belt helps on heavy loads, but technique rules.',
        ],
      },
      {
        title: 'Your core is your best insurance',
        content:
          'Core exercises (plank, bird dog, pallof press) teach you to stabilize the spine under load. A strong core is not just "visible abs": it is lower back protection in any compound exercise.',
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
          'Pain that worsens with loading is a red flag, not "grind and go on".',
          'For persistent back discomfort, review technique and volume before adding load.',
          'A professional (physiotherapist) can get you back to training more safely.',
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
      'Add weight with "double progression": if you close the range with good technique, increase.',
      'The weakest point is usually the press off the chest: train it with pauses or dumbbell presses.',
    ],
    sections: [
      {
        title: 'Base technique',
        content:
          'Lie with your feet firm, retract and set your shoulder blades (shoulders back and down). Grip the bar slightly wider than shoulders, lower it under control touching your chest without bouncing and press to lockout without letting the shoulder blades slide.',
        bullets: [
          'Wrists aligned: the bar over the base of the hand, not the fingers.',
          'Elbows at ~45° protect the shoulder (no "chicken wings").',
          '"High" chest: a slight arch and stable shoulders protect the rotator cuff.',
        ],
      },
      {
        title: 'How to add weight',
        content:
          'Use the "double progression" rule: if you complete the last two sets of the range (e.g. 4×6) with controlled technique, add 2.5 kg next session. Small increments add up: 2.5 kg per cycle is ~30 kg a year.',
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
  'principiante': {
    title: "Beginner's guide",
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
  'lesiones-comunes': {
    title: 'Common gym injuries',
    summary: 'Prevention and returning to train without relapsing.',
    keyPoints: [
      '90% of injuries: the load exceeds the tissue tolerance.',
      'Shoulder: control the bench press and add pulling work.',
      'Low back: bracing and hip hinge; the deadlift is not the enemy.',
      'Use relative rest and the pain traffic-light system to return.',
    ],
    sections: [
      {
        title: 'Why the injury appears',
        content:
          'In most cases the load exceeds the tissue\'s tolerance. Three typical paths: too much volume or intensity at once, consistently poor technique, and a lack of recovery.',
        bullets: [
          'Increase volume or intensity gradually, not all at once.',
          'Repeated bad technique eventually injures.',
          'Without enough recovery the tissue does not adapt: it breaks.',
        ],
      },
      {
        title: 'Shoulder',
        content:
          'Front or side pain usually comes from overusing the bench press with elbows at 90º and too little pulling work. Prevention: retract the shoulder blades and use an elbow angle of about 45º. If tendinopathy is already there, start with analgesic isometrics and then eccentrics.',
        bullets: [
          'Balance pushing and pulling across the week.',
          'Elbows at 45º protect the shoulder on the press.',
          'Tendinopathy is trained with isometrics and eccentrics, not total rest.',
        ],
      },
      {
        title: 'Low back',
        content:
          'The deadlift is not the enemy; losing spinal neutrality is. The key is bracing (diaphragmatic breathing) and the hip hinge: the load should be felt in the hamstrings and glutes, not the lower back.',
        bullets: [
          'Activate your core before moving the load.',
          'Push the hips back keeping the spine neutral.',
          'If you feel the lower back loading, fix technique before adding weight.',
        ],
      },
      {
        title: 'Knee and safe return',
        content:
          'Anterior knee pain usually comes from overusing knee-dominant exercises with heavy loads and uncontrolled descents. Control the eccentric and avoid valgus. On return, use relative rest: modify the exercises and keep a pain-free stimulus.',
        bullets: [
          'Increase one variable a week (weight or sets, not both).',
          'Pain traffic light: 0–3 back to 0 in 24 h = green light.',
          'If pain exceeds 4 or increases the next day, back off.',
        ],
      },
    ],
  },
  'ejercicios-peligrosos': {
    title: 'Risky exercises and safe alternatives',
    summary: 'Replace risky movements with safe options.',
    keyPoints: [
      'They are not "bad", but they put the joint at risk.',
      'Behind-the-neck press and pulldowns force shoulder rotation.',
      'The upright row can irritate the supraspinatus if you raise the elbows.',
      'Substituting lets you train for years without injuries.',
    ],
    sections: [
      {
        title: 'Behind-the-neck press',
        content:
          'It places the shoulder in an extreme abduction and rotation it is not built for. Use a military press, dumbbell press or a machine shoulder press instead.',
        bullets: [
          'Military press: the best overhead push option.',
          'Dumbbells allow a more natural path.',
          'Machine shoulder press is safe for beginners.',
        ],
      },
      {
        title: 'Behind-the-neck pulldowns',
        content:
          'Abduction beyond 80º with forced external rotation can cause instability and rotator cuff or suprascapular nerve problems. Use pull-ups or front pulldowns to the chest.',
        bullets: [
          'Front pulldown to chest: same pattern with a safe shoulder position.',
          'Pull-ups work the back without forcing the shoulder.',
          'Avoid pulling the bar behind the head.',
        ],
      },
      {
        title: 'Upright row',
        content:
          'If you raise the elbows above the shoulder, the supraspinatus gets pinched against the acromion. Use a wide grip, bar close to the body, and do not raise the elbows; alternatively use lateral raises.',
        bullets: [
          'A wide grip and short range protect the shoulder.',
          'Lateral raises work the same muscle without risk.',
          'Stop if you feel pressure or a pinch in the shoulder.',
        ],
      },
      {
        title: 'Stiff-leg deadlift and horizontal press',
        content:
          'The stiff-leg deadlift rounds the spine under load (hernia risk); prefer the Romanian deadlift. On the horizontal press, sitting raises disc pressure and the core stops protecting: use strict form without rounding the low back, or a squat.',
        bullets: [
          'Romanian deadlift: hip hinge keeping the spine neutral.',
          'On the press, do not sink your pelvis into the seat.',
          'A squat with strict technique is a safer alternative.',
        ],
      },
    ],
  },
  'gana-masa-muscular': {
    title: 'How to gain muscle mass',
    summary: 'Surplus, protein and compounds for hypertrophy.',
    keyPoints: [
      'You need a caloric surplus: maintenance + ~10%.',
      'Protein: 1.6–2 g per kg, spread across 5–6 meals.',
      'Prioritise compounds: squat, press, row, deadlift.',
      'Sleep 8+ hours and never abandon technique.',
    ],
    sections: [
      {
        title: 'Nutrition to grow',
        content:
          'To gain muscle you need a caloric surplus (maintenance + ~10%) and enough protein (1.6–2 g per kg) spread across several meals. Complex carbohydrates give you the energy to train hard.',
        bullets: [
          'E.g. 2.500 kcal maintenance → ~2.750 kcal to grow.',
          'Meals of 30–50 g of protein: the gut does not absorb much more well.',
          'Typical split: 50% carbs / 40% protein / 10% fat.',
        ],
      },
      {
        title: 'Train compounds first',
        content:
          'Compound exercises (squat, press, pull-ups, row, deadlift, bench press) recruit more muscle overall. Small groups do not make you grow; your back and legs do.',
        bullets: [
          'Start each session with the biggest exercises.',
          'Constant load progression: add weight or reps each week.',
          'Isolation complements; it does not replace compounds.',
        ],
      },
      {
        title: 'Recovery and supplements',
        content:
          'Give 3–5 days of rest per muscle group, sleep 8+ hours and drink water (kg × 0.036 litres a day). Moderate cardio 20–30 min, 2–4 times a week. Useful supplements: whey protein and creatine.',
        bullets: [
          'Creatine + post-workout whey work as an \'anabolic team\'.',
          'Rest between sessions of the same group is a must.',
          'Without sleep and food, the training stimulus does not become muscle.',
        ],
      },
    ],
  },
  'triseries': {
    title: 'Trisets: technique and routines',
    summary: 'A 3-exercise method with no rest for advanced lifters.',
    keyPoints: [
      'A trisets = 3 different exercises done back to back with no rest.',
      'Pre/post-exhaustion: isolation → compound → isolation.',
      'An intense method, not for beginners.',
      'Use it as a change-up to \'surprise\' the muscle.',
    ],
    sections: [
      {
        title: 'How it works',
        content:
          'A trisets chains 3 sets of 3 different exercises with no rest in between. Typical strategies: pre-exhaustion (isolation → compound → isolation) and holistic trisets (heavy basic → auxiliary → isolation).',
        bullets: [
          'E.g. chest pre-exhaustion: flyes → bench press → cable crossovers.',
          'E.g. holistic: basic 4–6 reps → auxiliary 8–12 → isolation 20–40.',
          'Extended sets: variations of the same exercise from hardest to easiest.',
        ],
      },
      {
        title: 'When and how to use it',
        content:
          'It is a very stressful method: keep it for cutting phases or breaking plateaus. In the reference cutting routine, maximum rest within the trisets is 10 s and 2 min between trisets, with absolute failure in weeks 2 and 4.',
        bullets: [
          'Very short rest inside the trisets (≈10 s).',
          'Longer rest between trisets (≈2 min).',
          'Do not keep it for more than a few weeks: alternate with normal training.',
        ],
      },
    ],
  },
  'alta-intensidad': {
    title: 'High-intensity training',
    summary: 'Advanced techniques to go beyond failure.',
    keyPoints: [
      'Real intensity = weight + reps + focus to failure.',
      'Methods: supersets, dropsets, negatives, forced reps, rest-pause.',
      'Tell the \'good pain\' (burn) from the bad (joints).',
      'Do not overdo it: max 4 weeks straight, then deload.',
    ],
    sections: [
      {
        title: 'What intensity means',
        content:
          'Intensity is not just the weight: it is the real effort until you cannot complete one more rep with correct technique (muscular failure). Advanced techniques push the stimulus beyond concentric failure.',
        bullets: [
          'Lactic acid burn = \'good pain\' and part of the work.',
          'A pinch in a tendon or joint = injury signal, stop.',
          'Intense techniques require a partner for maximum safety.',
        ],
      },
      {
        title: 'Methods to raise intensity',
        content:
          'Increase resistance (~5% when you complete 8–10 clean reps), shorten rests, do supersets, dropsets (–25–40% of weight at failure), negatives and forced reps, rest-pause and partials.',
        bullets: [
          'Dropsets: at failure, drop 25–40% and fail again.',
          'Pre-exhaustion: isolation before the compound.',
          'Negatives and forced reps always with a partner.',
        ],
      },
      {
        title: 'Do not overdo it',
        content:
          'More than 4 weeks of extreme techniques straight raises myostatin (the protein that limits muscle). Plan deload weeks and alternate with conventional training to keep progressing.',
        bullets: [
          'Alternate hard and light weeks.',
          'The deload lets the stimulus turn into muscle.',
          'Listen to the signals before \'pushing harder\'.',
        ],
      },
    ],
  },
  'distribucion-rutina': {
    title: 'Training routine split',
    summary: 'How to divide your week by days and goal.',
    keyPoints: [
      'Strength/hypertrophy: 1–2 days per group; endurance: 3 days.',
      'Options: full-body, torso-legs, push/pull, 4–5 day splits.',
      'Train big groups before small ones.',
      'Prioritise your weak points.',
    ],
    sections: [
      {
        title: 'Choose your frequency',
        content:
          'Set frequency by your goal: for strength or size 1–2 days per muscle group a week is usually enough; for muscular endurance up to 3 days. From there choose the split.',
        bullets: [
          'Full-body 3×/week minimises gym days.',
          '2-day routines: torso-legs or push/pull.',
          '3 days: push-pull-legs; 4–5 days: more isolation.',
        ],
      },
      {
        title: 'Pair groups smartly',
        content:
          'Golden rule: always train big groups before small ones. Never triceps before chest, nor biceps before back: the big muscle gets all the intensity.',
        bullets: [
          'Chest before triceps; back before biceps.',
          'Push (chest, shoulder, triceps) together if you combine them.',
          'Pull (back, biceps) together if you combine them.',
        ],
      },
      {
        title: 'Prioritise weak points',
        content:
          'Give lagging groups more volume or frequency and place them early in the session, when you are fresh. For example, weak shoulders: train them day one, not after chest.',
        bullets: [
          'The first exercises of the session perform best.',
          'Spread volume across the week so you do not neglect them.',
          'Watch your progress and reorder if something stops responding.',
        ],
      },
    ],
  },
  'cardio-ayunas': {
    title: 'Fasted cardio',
    summary: 'What is true and not about training fasted.',
    keyPoints: [
      'The \'empty glycogen\' on waking is a myth.',
      'At low intensity there are more free fatty acids available.',
      'At high intensity the effect reverses and becomes catabolic.',
      'If you want, do light fasted cardio with BCAAs before.',
    ],
    sections: [
      {
        title: 'Debunking the myth',
        content:
          'On waking you are not glycogen-empty: during sleep the body mainly uses fat and barely touches glycogen. The supposed basis of fasted cardio is therefore false.',
        bullets: [
          'Total daily expenditure matters more than the timing of cardio.',
          'Fasting does not automatically \'summon\' fat to burn.',
          'Consistency weighs more than the time of day.',
        ],
      },
      {
        title: 'The moderate edge',
        content:
          'There is a benefit: on waking there are more free fatty acids ready to be oxidised, so a low-intensity morning cardio (50–75% max HR) can mobilise more fat and improve insulin sensitivity.',
        bullets: [
          'Keep cardio in the low–moderate intensity zone.',
          'At high intensity (>75%) cortisol, already high fasted, can waste muscle.',
          'If you try it, take 5 g of BCAAs first to protect muscle.',
        ],
      },
      {
        title: 'Practical tips',
        content:
          'If you train weights and cardio in the same session, do the weights first and cardio after. On rest days, low-intensity cardio is fine; high-intensity is not (it gives the body no break).',
        bullets: [
          'The morning vs evening difference is small: pick what is sustainable.',
          'Intense cardio right after lifting taxes the nervous system.',
          'What matters is not when, but that you do it consistently.',
        ],
      },
    ],
  },
  'test-cooper': {
    title: 'Cooper test',
    summary: 'Measure your aerobic capacity in 12 minutes.',
    keyPoints: [
      'Measures the maximum distance run in 12 minutes.',
      'Simple, reliable and valid for beginners and advanced.',
      'It is a maximal effort: see a doctor if in doubt.',
      'Its goal is a baseline and tracking your progress.',
    ],
    sections: [
      {
        title: 'What it is',
        content:
          'The Cooper test measures the maximum distance covered in 12 minutes on a flat track, with a stopwatch. It evaluates aerobic capacity, compares performance over time and sets a baseline before a program.',
        bullets: [
          'You need a flat track and a stopwatch.',
          'Cover the most distance you can in 12 minutes.',
          'Only the \'Good\' and \'Excellent\' categories are considered fit in institutional settings.',
        ],
      },
      {
        title: 'Precautions',
        content:
          'It is a maximal effort: consult a doctor first if in doubt. Not recommended with obesity, smoking, diabetes, asthma, high blood pressure, cardiovascular or respiratory problems, after flu, above 2.000 m altitude or with physical discomfort.',
        bullets: [
          'Do not do it if you are sick or recovering.',
          'Very sedentary people should assess their state first.',
          'Stop immediately with pain, dizziness or shortness of breath.',
        ],
      },
      {
        title: 'How to use it',
        content:
          'Its real use is not passing or failing, but setting a baseline to measure progress. Repeat it every 6–8 weeks and watch the distance improve; that shows your aerobic base is rising.',
        bullets: [
          '80% of the population would not pass: do not get discouraged.',
          'Repeat under similar conditions (same track, same time).',
          'Distance improvement is the sign your aerobic base is going up.',
        ],
      },
    ],
  },
  'sesiones-cortas': {
    title: 'Practice: techniques for short sessions',
    summary: 'Giant sets, 15-minute workouts and how to target one area of a muscle.',
    keyPoints: [
      'Giant set: 4 exercises done back to back with no rest = 1 giant set; rest 3 min between giant sets.',
      '15-minute sessions: 3 exercises of 3 sets with 30 s rests to make the most of little time.',
      'Muscle-area priority: pick variations that load the head or zone you want to bring up.',
      'Occasional techniques (not daily): use them to break plateaus or when time is short.',
    ],
    sections: [
      {
        title: 'Giant set',
        content:
          'A giant set chains 4 different exercises for the same muscle, doing one set of each with no rest between them; once you finish all 4 you have completed one giant set and rest about 3 minutes before the next. The training library uses it for chest (incline press, flyes, decline press and machine flyes) and triceps (extensions, kickbacks and presses): 4 x 10, ending in failure on the last exercise.',
        bullets: [
          'Very physically demanding: only for intermediate-advanced lifters.',
          'Keep your technique even when cardio bites: form rules.',
          'The last exercise usually goes to failure (for example close-grip push-ups for triceps).',
        ],
      },
      {
        title: '15-minute workouts',
        content:
          'Short sessions follow a clear pattern: 3 exercises per muscle group, 3 sets each, with minimal 30-second rests between sets and about 2 minutes between exercises. It applies to chest, back, biceps, triceps, shoulders and legs; the goal is to keep the stimulus without eating your whole day.',
        bullets: [
          'Do not rest more than 30 s between sets to keep the density.',
          'Reduce the load if the short rest compromises technique.',
          'Perfect for busy days or as a finisher at the end of a session.',
        ],
      },
      {
        title: 'Muscle-area priority',
        content:
          'To emphasise one specific part, choose variations that overload that zone. For biceps, outer-head priority (the "peak"): close-grip curls, incline curls and hammer curls; for the short head, Scott bench curls and wide grip. For triceps, long head: overhead extensions and weighted dips. For shoulders, front deltoid: presses and front raises; middle deltoid and traps: lateral raises, high rows and shrugs. For the back, lower lats: reverse-grip rows and pulls with straight arms.',
        bullets: [
          'Start the session with the zone you want to bring up, while you are fresh.',
          'Use 8-15 rep ranges depending on the muscle head you are after.',
          'It is a form of occasional variation: it does not replace general load progression.',
        ],
      },
    ],
  },
}
