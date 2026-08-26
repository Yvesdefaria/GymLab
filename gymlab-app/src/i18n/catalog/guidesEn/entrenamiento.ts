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
}
