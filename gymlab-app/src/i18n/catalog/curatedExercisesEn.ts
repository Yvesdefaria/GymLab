// Traducciones EN de los 52 ejercicios curados (clave = slug ES del seed).
// El seed guarda nombres/instrucciones/pasos en español; este overlay se aplica
// en render cuando el idioma es EN. Manual (contenido curado de calidad).
export interface CuratedExerciseEn {
  name: string
  instructions: string
  detailedSteps?: { step: number; instruction: string; tip?: string; warning?: string }[]
}

export const CURATED_EXERCISES_EN: Record<string, CuratedExerciseEn> = {
  'press-de-pecho-con-barra': {
    name: 'Barbell Bench Press',
    instructions: 'Lie on the bench, grip wide, lower the bar to your chest and press up.',
    detailedSteps: [
      { step: 1, instruction: 'Lie on the bench with your eyes under the bar and feet firmly on the floor.', tip: 'Squeeze your shoulder blades together before unracking.' },
      { step: 2, instruction: 'Grip the bar slightly wider than shoulder-width and unrack it.', tip: 'Medium grip: thumbs wrapped around the bar.' },
      { step: 3, instruction: 'Lower the bar under control to your mid-chest with elbows at ~45°.', warning: 'Do not bounce the bar off your chest: you lose tension and risk injury.' },
      { step: 4, instruction: 'Press up until your elbows are extended without fully locking them out.' },
    ],
  },
  'press-inclinado-mancuernas': {
    name: 'Incline Dumbbell Press',
    instructions: 'Set the bench at 30-45°, lower the dumbbells under control and press up.',
  },
  'aperturas-con-mancuernas': {
    name: 'Dumbbell Flyes',
    instructions: 'On a flat bench, open your arms with elbows slightly bent until you feel a stretch.',
  },
  'aperturas-en-maquina': {
    name: 'Machine Fly (Pec-Deck)',
    instructions: 'Sit with a straight back and bring your arms together controlling the movement.',
  },
  'fondos-en-paralelas': {
    name: 'Parallel Bar Dips',
    instructions: 'Grip the bars, lower by bending your elbows to 90° and push back up.',
  },
  'cruces-en-polea': {
    name: 'Cable Fly (Crossover)',
    instructions: 'Stand between the pulleys and cross your arms in front of your chest with control.',
  },
  dominadas: {
    name: 'Pull-Ups',
    instructions: 'Overhand grip, pull up until your chin clears the bar, lower under control.',
    detailedSteps: [
      { step: 1, instruction: 'Hang from the bar with an overhand grip slightly wider than shoulder-width.' },
      { step: 2, instruction: 'Squeeze your shoulder blades and pull with your elbows down, not back.', tip: 'Imagine driving your elbows toward your pockets.' },
      { step: 3, instruction: 'Pull up until your chin clears the bar or the bar reaches your chest.' },
      { step: 4, instruction: 'Lower with control back to a full hang, extending your arms.', warning: 'Do not kip unless intentional.' },
    ],
  },
  'remo-con-barra': {
    name: 'Barbell Row',
    instructions: 'Hinge your torso 45°, pull the bar toward your abdomen, squeeze your shoulder blades.',
  },
  'remo-con-mancuerna': {
    name: 'One-Arm Dumbbell Row',
    instructions: 'Support one hand on a bench and pull the dumbbell toward your hip.',
  },
  'remo-en-maquina': {
    name: 'Seated Cable Row (Machine)',
    instructions: 'Sit with your chest on the support and pull the handles toward you.',
  },
  'jalon-al-pecho': {
    name: 'Lat Pulldown',
    instructions: 'Wide grip, pull the bar to your upper chest, squeeze your shoulder blades.',
  },
  'peso-muerto': {
    name: 'Conventional Deadlift',
    instructions: 'Standing with a medium or mixed grip, lift the bar from the floor keeping your back straight.',
    detailedSteps: [
      { step: 1, instruction: 'Place your feet under the bar at hip width, toes pointing forward.' },
      { step: 2, instruction: 'Hinge at your hips and grip the bar with straight arms.', tip: 'Neutral spine: chest up, no rounding.' },
      { step: 3, instruction: 'Push the floor away with your legs keeping the bar close to your body.' },
      { step: 4, instruction: 'Lock out your hips at the top and lower the bar under control, sliding it along your legs.', warning: 'Never arch your lower back to "grind" the weight up.' },
    ],
  },
  'curl-con-barra': {
    name: 'Barbell Curl',
    instructions: 'Standing, raise the bar by bending your elbows without moving your shoulders.',
    detailedSteps: [
      { step: 1, instruction: 'Stand holding the bar with an underhand grip at shoulder width.' },
      { step: 2, instruction: 'Bend your elbows without moving your shoulders, raising the bar to your chest.' },
      { step: 3, instruction: 'Squeeze your biceps at the top and lower over 2-3 seconds.', tip: 'Avoid swinging your torso: use a controllable weight.', warning: 'If your elbows hurt, reduce the bottom range.' },
    ],
  },
  'curl-con-mancuernas': {
    name: 'Dumbbell Hammer Curl',
    instructions: 'Standing with dumbbells in a neutral grip, curl up without swinging your torso.',
  },
  'curl-en-banco-inclinado': {
    name: 'Incline Dumbbell Curl',
    instructions: 'Set the bench at 45°, let your arms hang and curl the dumbbells up.',
  },
  'curl-en-polea': {
    name: 'Cable Curl (Low Pulley)',
    instructions: 'Stand facing the pulley, grip the straight bar and curl without moving your elbows.',
  },
  'curl-concentrado': {
    name: 'Concentration Curl',
    instructions: 'Seated, rest your elbow against your inner thigh and curl the dumbbell up.',
  },
  'press-frances': {
    name: 'Skull Crusher (French Press)',
    instructions: 'Lying down, lower the bar to your forehead bending your elbows, then extend your arms.',
  },
  'extension-triceps-polea': {
    name: 'Triceps Pushdown (Cable)',
    instructions: 'Standing, push the bar down without moving your elbows.',
  },
  'fondos-en-banco': {
    name: 'Bench Dips (Triceps)',
    instructions: 'Hands on the edge of the bench, lower by bending your elbows and push back up.',
  },
  'extension-mancuerna-detras-cabeza': {
    name: 'Overhead Triceps Extension',
    instructions: 'Standing or seated, hold the dumbbell overhead and lower it behind your head.',
  },
  'press-militar': {
    name: 'Overhead Press (Military Press)',
    instructions: 'Standing, press the bar from your shoulders to full extension.',
    detailedSteps: [
      { step: 1, instruction: 'Stand holding the bar at shoulder width at upper-chest height.' },
      { step: 2, instruction: 'Squeeze your glutes and brace your core to stabilize your trunk.' },
      { step: 3, instruction: 'Press the bar straight up until your elbows are extended, without arching your back.', warning: 'If you arch your lower back, lower the weight.' },
      { step: 4, instruction: 'Lower the bar under control back to your upper chest.' },
    ],
  },
  'press-mancuernas-hombro': {
    name: 'Dumbbell Shoulder Press',
    instructions: 'Seated or standing, press the dumbbells up from your shoulders.',
  },
  'elevaciones-laterales': {
    name: 'Lateral Raises',
    instructions: 'Standing, raise your arms to shoulder height with elbows slightly bent.',
  },
  'elevaciones-frontales': {
    name: 'Front Raises',
    instructions: 'Standing, raise your arms in front to shoulder height.',
  },
  'elevaciones-posteriores': {
    name: 'Face Pull / Reverse Flyes',
    instructions: 'With a high pulley, pull the rope toward your face separating your hands.',
  },
  'sentadilla-con-barra': {
    name: 'Barbell Back Squat',
    instructions: 'Bar on your traps, lower until your thighs are parallel to the floor.',
    detailedSteps: [
      { step: 1, instruction: 'Place the bar across your traps and unrack with feet at shoulder width.' },
      { step: 2, instruction: 'Inhale, brace your core and descend bending hips and knees together.' },
      { step: 3, instruction: 'Lower until your thighs are parallel to the floor, knees tracking over your toes.' },
      { step: 4, instruction: 'Push the floor away to return to standing and exhale at the top.', warning: 'Keep your heels planted on the floor throughout the movement.' },
    ],
  },
  'sentadilla-goblet': {
    name: 'Goblet Squat',
    instructions: 'Hold the dumbbell at your chest and squat bending hips and knees.',
  },
  'prensa-de-piernas': {
    name: 'Leg Press',
    instructions: 'Seated in the machine, lower the platform bending your knees and press up.',
  },
  'extension-de-piernas': {
    name: 'Leg Extension',
    instructions: 'Seated, extend your knees against the resistance.',
  },
  'curl-femoral': {
    name: 'Leg Curl',
    instructions: 'Lying or seated, flex your knees against the resistance.',
  },
  zancadas: {
    name: 'Dumbbell Lunges',
    instructions: 'Take a long step forward and lower your back knee.',
  },
  'peso-muerto-rumano': {
    name: 'Romanian Deadlift',
    instructions: 'Hinge at your hips, bar close to your legs, neutral spine.',
    detailedSteps: [
      { step: 1, instruction: 'Stand with the bar at thigh height, feet at hip width.' },
      { step: 2, instruction: 'Hinge your hips back with legs almost straight, bar sliding along your thighs.' },
      { step: 3, instruction: 'Lower until you feel a stretch in your hamstrings, keeping a neutral back.' },
      { step: 4, instruction: 'Drive your hips forward to return up squeezing your glutes.', tip: 'Think "send your butt toward the wall", not "squat down".' },
    ],
  },
  'hip-thrust': {
    name: 'Hip Thrust',
    instructions: 'Upper back on the bench, drive your hips up squeezing your glutes.',
    detailedSteps: [
      { step: 1, instruction: 'Rest your upper back on the bench with the bar or dumbbell over your hips.' },
      { step: 2, instruction: 'With feet planted, drive your hips up until your knees and shoulders align.' },
      { step: 3, instruction: 'Squeeze your glutes at the top for 1 second and lower under control.', warning: 'Do not push with your lower back: the movement comes from your hips.' },
    ],
  },
  'peso-muerto-sumo': {
    name: 'Sumo Deadlift',
    instructions: 'Feet wide, hands inside the legs, push the floor away keeping your torso tall.',
  },
  plancha: {
    name: 'Plank',
    instructions: 'Resting on your forearms and toes, keep your body in a straight line.',
    detailedSteps: [
      { step: 1, instruction: 'Place your forearms and toes on the floor.' },
      { step: 2, instruction: 'Align head, shoulders, hips and heels in a straight line.' },
      { step: 3, instruction: 'Keep your core braced and breathe continuously.', tip: 'Avoid letting your hips sag or pike up.', warning: 'Stop immediately if you feel sharp lower back pain.' },
    ],
  },
  'crunch-en-maquina': {
    name: 'Machine Crunch',
    instructions: 'Seated, flex your torso against the resistance.',
  },
  'hanging-leg-raise': {
    name: 'Hanging Leg Raise',
    instructions: 'Hanging from the bar, raise your knees or legs to your chest.',
  },
  'encogimientos-con-mancuernas': {
    name: 'Dumbbell Shrugs',
    instructions: 'Standing, shrug your shoulders toward your ears keeping your arms straight.',
  },
  'curl-de-muneca': {
    name: 'Wrist Curl',
    instructions: 'Seated, rest your forearms on your thighs and flex your wrists.',
  },
  'press-declinado': {
    name: 'Decline Bench Press',
    instructions: 'Decline bench, lower the bar to your lower chest and press up.',
  },
  flexiones: {
    name: 'Push-Ups',
    instructions: 'Body rigid, chest toward the floor, elbows at ~45°.',
    detailedSteps: [
      { step: 1, instruction: 'Place your hands slightly wider than shoulders and extend your body in a line.' },
      { step: 2, instruction: 'Lower your chest toward the floor with elbows at ~45° from your torso.' },
      { step: 3, instruction: 'Press up until your arms are extended keeping your trunk rigid.', tip: 'To progress, start on your knees or with your hands elevated.' },
    ],
  },
  pullover: {
    name: 'Dumbbell Pullover',
    instructions: 'Lying down, bring the dumbbell in an arc behind your head and back.',
  },
  'curl-scott': {
    name: 'Scott Curl / Preacher Curl',
    instructions: 'Arms over the preacher bench, curl up without lifting your elbows.',
  },
  'press-cerrado': {
    name: 'Close-Grip Bench Press',
    instructions: 'Narrow grip, elbows close to your body as you press.',
  },
  'press-arnold': {
    name: 'Arnold Press',
    instructions: 'Rotate from palms facing you to an overhead press.',
  },
  'sentadilla-bulgara': {
    name: 'Bulgarian Split Squat',
    instructions: 'Rear foot elevated, lower your front knee under control.',
    detailedSteps: [
      { step: 1, instruction: 'Place the top of your rear foot on a bench, a step away from your other foot.' },
      { step: 2, instruction: 'Lower your rear knee toward the floor controlling your front knee.' },
      { step: 3, instruction: 'Push through your front heel to return up.', warning: 'Your front knee must not cave inward.' },
    ],
  },
  'gemelo-de-pie': {
    name: 'Standing Calf Raise',
    instructions: 'Rise up onto the balls of your feet through a full range.',
  },
  'crunch-polea': {
    name: 'Cable Crunch',
    instructions: 'On your knees, flex your trunk bringing your elbows to your knees.',
  },
  'remo-al-menton': {
    name: 'Upright Row',
    instructions: 'Pull the bar to your chin with your elbows high.',
  },
  'patada-triceps': {
    name: 'Triceps Kickback',
    instructions: 'Torso leaning forward, extend your arm back without moving your elbow.',
  },
  'plancha-lateral': {
    name: 'Side Plank',
    instructions: 'Support on one forearm, hips lifted, body aligned.',
    detailedSteps: [
      { step: 1, instruction: 'Rest your forearm on the floor with your shoulder above your elbow.' },
      { step: 2, instruction: 'Lift your hips until you form a line from ankles to shoulders.' },
      { step: 3, instruction: 'Hold the position, then switch sides.', tip: 'Start with 15-20 s per side and add time gradually.' },
    ],
  },
}
