// Guías informativas sembradas (nutrición, entrenamiento, recuperación).
// Contenido divulgativo, no consejo médico; se muestran tal cual en la app.
// El contenido es seed de confianza: se renderiza como texto, sin HTML de usuario.
import type { Guide } from '@/domain/types'

export const seedGuides: Guide[] = [
  {
    id: 1,
    slug: 'macros-basicos',
    category: 'nutricion',
    title: 'Macros básicos para entrenar',
    summary: 'Proteína, carbohidratos y grasas orientativos según objetivo.',
    keyPoints: [
      'Proteína: 1,6–2,2 g/kg de peso corporal al día.',
      'Carbohidratos: 4–7 g/kg según volumen de entrenamiento.',
      'Grasas: 0,8–1 g/kg (aprox. 20–30% de calorías).',
      'Volumen: superávit ~10–15%. Definición: déficit ~15–20%.',
    ],
    sections: [
      {
        title: 'Proteína: el macronutriente clave',
        content:
          'La proteína aporta los aminoácidos que reparan el músculo tras entrenar. En torno a 1,6–2,2 g por kg de peso y día cubren la gran mayoría de los casos; repartirla en 3–5 tomas de 0,4 g/kg ayuda a aprovecharla mejor.',
        bullets: [
          'Fuentes: carnes, pescado, huevos, lácteos, legumbres, tofu, soja.',
          'Una toma post-entreno no es obligatoria si ya comes suficiente a lo largo del día.',
          'Superar 2,2 g/kg rara vez aporta más: lo importante es el total diario.',
        ],
      },
      {
        title: 'Carbohidratos: la gasolina del entreno',
        content:
          'Los hidratos son la fuente principal de energía para series pesadas. Necesitas más los días de pierna o sesiones largas y menos en descanso. El rango de 4–7 g/kg funciona bien para entrenamiento de fuerza con algo de cardio.',
        bullets: [
          'Prioriza arroz, patata, avena, pan, fruta y legumbres.',
          'Rodean el entreno: una comida de carbohidratos 1–3 h antes mejora el rendimiento.',
          'En definición se bajan, pero no hace falta eliminarlos.',
        ],
      },
      {
        title: 'Grasas y calorías totales',
        content:
          'Las grasas sostienen las hormonas y la absorción de vitaminas; mantenerlas cerca de 0,8–1 g/kg cubre lo necesario. Al final, lo que decide tu peso es el balance calórico: superávit moderado para ganar, déficit suave para perder.',
        bullets: [
          'Grasas de calidad: aceite de oliva, frutos secos, aguacate, pescado azul.',
          'Sin un superávit, los músculos crecen poco aunque entrenes bien.',
          'Sin un déficit, no pierdes grasa de forma sostenible.',
        ],
      },
      {
        title: 'Cómo empezar sin agobiarse',
        content:
          'No necesitas pesar cada gramo desde el día uno. Empieza por fijar un objetivo calórico aproximado, cumple la proteína y reparte el resto. Ajusta después de 2–3 semanas según lo que indique la báscula y el rendimiento.',
        bullets: [
          'La calculadora de calorías de la app te da un punto de partida.',
          'Cambia una cosa cada vez: pesarte y ajustar es más fiable que improvisar.',
          'La constancia a medio plazo gana a la perfección de un día.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 2,
    slug: 'menu-volumen-orientativo',
    category: 'dietas',
    title: 'Menú orientativo de volumen',
    summary: 'Ejemplo de estructura de comidas para superávit moderado.',
    keyPoints: [
      'Desayuno: avena + lácteo + fruta + frutos secos.',
      'Comida: arroz o patata + proteína magra + verduras.',
      'Merienda: pan integral + atún o huevos.',
      'Cena: tubérculo + pescado o pavo + ensalada.',
      '5–6 tomas ayudan a repartir proteína.',
    ],
    sections: [
      {
        title: 'Idea general del día',
        content:
          'Este menú es una plantilla, no una ley: intenta que cada comida combine una fuente de proteína, una de carbohidratos y vegetales. Repartir en 4–6 tomas ayuda a llegar al total calórico y de proteína sin comidas gigantes.',
        bullets: [
          'Ajusta las cantidades a tu peso, no al de tu compañero.',
          'El total del día importa más que cada comida concreta.',
          'Prepárate algo de comida: el plan más fácil es el que ya tienes hecho.',
        ],
      },
      {
        title: 'Ejemplo de día completo',
        content:
          'Desayuno: avena con leche, plátano y nueces. Comida: arroz, pechuga o pollo y verduras con aceite. Merienda: pan integral con atún o huevos. Cena: patata o boniato, pescado o pavo y ensalada. Añade un yogur o requesón antes de dormir si te falta proteína.',
        bullets: [
          'Bebe agua a lo largo del día, no solo en las comidas.',
          'La avena y el arroz dan energía estable para entrenar.',
          'Las verduras aportan volumen y micronutrientes sin muchas calorías.',
        ],
      },
      {
        title: 'Ajuste según entrenamiento',
        content:
          'El día de sesión pesada, adelanta o aumenta los carbohidratos en la comida previa; el día de descanso puedes repartirlos más libremente. Si entrenas por la mañana, la cena anterior y el desayuno previo son tus dos «comidas de energía».',
        bullets: [
          'Comida 1–3 h antes de entrenar con carbohidratos y algo de proteína.',
          'Tras entrenar, una comida normal cubre la recuperación.',
          'En volumen no hace falta atiborrarse: basta un superávit moderado.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 3,
    slug: 'suplementos-base',
    category: 'suplementos',
    title: 'Suplementos con más evidencia',
    summary: 'Creatina y proteína en polvo como base; el resto es opcional.',
    keyPoints: [
      'Creatina monohidrato: 3–5 g/día, todos los días.',
      'Whey u otra proteína: 20–30 g cuando falte en la dieta.',
      'La comida completa y el sueño importan más que cualquier pastilla.',
      'Informativo: no sustituye consejo médico ni nutricional.',
    ],
    sections: [
      {
        title: 'Creatina: el suplemento con más evidencia',
        content:
          'La creatina monohidrato tiene décadas de investigación: aumenta la fuerza y la masa magra en entrenamiento de fuerza, especialmente en series de alta intensidad. Se toma a diario (3–5 g) sin necesidad de «fase de carga».',
        bullets: [
          'Se acumula en el músculo con el uso diario, no importa la hora exacta.',
          'Es segura en adultos sanos en dosis recomendadas.',
          'Con qué mezclarla no importa: constancia > momento perfecto.',
        ],
      },
      {
        title: 'Proteína en polvo',
        content:
          'El whey (suero) es una forma cómoda de llegar a la proteína diaria, sobre todo si entrenas y te cuesta comer suficiente. No es mágica: sirve cuando la comida real se queda corta.',
        bullets: [
          'Dosis típica: 20–30 g cuando una comida no llegue a la proteína.',
          'La caseína o las vegetales (soja, guisante) también valen.',
          'La comida real y variada sigue siendo la base de la dieta.',
        ],
      },
      {
        title: 'Y el resto, ¿qué?',
        content:
          'La cafeína pre-entreno mejora el rendimiento en dosis moderadas (1,5–3 mg/kg, ~60–90 min antes). La omega-3 y la vitamina D solo si hay déficit real. Los «quemagrasas» o los pre-entrenos cargados de estimulantes suelen prometer más de lo que cumplen.',
        bullets: [
          'Cafeína: atentos a no consumirla tarde si afecta al sueño.',
          'Vitaminas: más vale un análisis que suplementarse a ciegas.',
          'Desconfía de suplementos con listas largas de efectos «milagro».',
        ],
      },
      {
        title: 'Orden de prioridades',
        content:
          'Primero: comer suficiente y variado, dormir 7–9 h y entrenar con progresión. Después: creatina y, si falta, proteína en polvo. Todo lo demás es opcional y con evidencia menor.',
        bullets: [
          'Ningún suplemento arregla una dieta o un sueño malos.',
          'Lee la etiqueta: dosis real, no marketing.',
          'Consulta a un profesional de la salud si tomas medicación.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 4,
    slug: 'progresion-sobrecarga',
    category: 'entrenamiento',
    title: 'Progresión y sobrecarga',
    summary: 'Cómo subir cargas o reps de forma sostenible.',
    keyPoints: [
      'Añade peso o reps cada 1–2 semanas si completas las series con buena forma.',
      'Prioriza compuestos: sentadilla, peso muerto, press, remo.',
      '2–3 estímulos por grupo muscular a la semana suelen funcionar bien.',
      'Deload cada 4–8 semanas si el rendimiento baja.',
    ],
    sections: [
      {
        title: '¿Qué es la sobrecarga progresiva?',
        content:
          'Es el principio por el que el músculo se adapta: si repites el mismo estímulo, deja de cambiar. La clave es añadir un poco más de trabajo cada semana: más peso, más repeticiones o más series con la técnica controlada.',
        bullets: [
          'Aumenta la carga solo si completaste las series previas con buena forma.',
          'Sube en incrementos pequeños: 1,25–2,5 kg en compuestos.',
          'Si no puedes completar el rango de reps, mantén el peso y gana una rep.',
        ],
      },
      {
        title: 'Cómo planificar la subida',
        content:
          'La regla más simple es la de «2 en 2»: si completas las 2 últimas series del rango (por ejemplo 3×8) con buena técnica, sube peso en la siguiente sesión.',
        bullets: [
          'Registra cada sesión: sin datos no sabes si progresas.',
          'Prioriza los compuestos, pero no descuides el volumen de los accesorios.',
          'El progreso se mide en semanas, no en sesiones sueltas.',
        ],
      },
      {
        title: 'Cuándo NO subir',
        content:
          'Fatiga acumulada, sueño malo, dolor agudo o técnica rota son señales de bajar o mantener, no de forzar.',
        bullets: [
          'Falla la misma serie 2–3 semanas seguidas → aplica un deload.',
          'Dolor articular agudo → para y consulta a un profesional.',
          'Subir a toda costa sin recuperar no es progresar: es sobreentrenar.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 5,
    slug: 'recuperacion-sueno',
    category: 'recuperacion',
    title: 'Recuperación y sueño',
    summary: 'El músculo crece fuera del gimnasio.',
    keyPoints: [
      'Objetivo: 7–9 horas de sueño.',
      'Respeta 48 h aprox. entre sesiones duras del mismo grupo.',
      'Cardio LISS 20–40 min no impide hipertrofia si comes suficiente.',
      'Dolor articular agudo: para y valora con un profesional.',
    ],
    sections: [
      {
        title: 'Por qué el sueño construye músculo',
        content:
          'El entrenamiento es el estímulo, pero la síntesis proteica (crecimiento muscular) ocurre sobre todo durante el descanso y el sueño profundo. Dormir menos de 6 h reduce notablemente la capacidad de recuperar y de rendir.',
        bullets: [
          '7–9 horas es el rango objetivo para adultos.',
          'La hormona de crecimiento se libera principalmente en sueño profundo.',
          'Con sueño corto, la percepción de esfuerzo sube y la técnica empeora.',
        ],
      },
      {
        title: 'Higiene de sueño práctica',
        content:
          'El horario constante importa más que las horas en sí. Acuéstate y levántate a la misma hora, incluso el fin de semana.',
        bullets: [
          'Reduce pantallas 30–60 min antes de dormir.',
          'Cena ligera y temprano: las comidas pesadas retrasan el sueño.',
          'Cafeína: nada de café o té estimulante después de media tarde.',
          'Habitación oscura, fresca y silenciosa.',
        ],
      },
      {
        title: 'Recuperación entre sesiones',
        content:
          'El mismo grupo muscular suele necesitar ~48 h entre sesiones duras. El descanso activo (paseo, movilidad, cardio suave) ayuda a recuperar mejor que la inactividad total.',
        bullets: [
          'Si el músculo sigue dolorido más de 72 h, reduce intensidad en esa zona.',
          'Diferencia dolor muscular de dolor articular: el segundo es señal de parar.',
          'La comida (proteína y energía suficiente) es parte de la recuperación.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 6,
    slug: 'entrenamiento-mujer-base',
    category: 'mujer',
    title: 'Entrenamiento de fuerza (base)',
    summary: 'Misma lógica de progresión; prioriza pierna/glúteo y técnica.',
    keyPoints: [
      'Full body 3 días o torso/pierna 4 días funcionan muy bien.',
      'Hip thrust, sentadilla, peso muerto rumano y zancadas como base.',
      'No hace falta “tonificar con poco peso”: la carga progresiva es clave.',
      'Ajusta volumen si hay molestias; escucha recuperación.',
    ],
    sections: [
      {
        title: 'Entrena fuerza, no «tonifiques»',
        content:
          'La idea de «tonificar con pesas ligeras» es un mito: el músculo se desarrolla con carga progresiva, igual que en cualquier persona. Entrenar fuerte no te «masculiniza»; te da músculo firme y un metabolismo activo.',
        bullets: [
          'La carga progresiva (subir peso o reps con buena técnica) es la base.',
          'Series de 6–12 reps con esfuerzo real funcionan para hipertrofia.',
          'El músculo extra sube el gasto calórico en reposo.',
        ],
      },
      {
        title: 'Estructura que funciona',
        content:
          'Un full body 3 días (lunes, miércoles, viernes) o un torso/pierna 4 días son buenos puntos de partida. Cada sesión toca pierna/glúteo y tren superior con 2–3 series por ejercicio.',
        bullets: [
          'Full body: ideal para 3 días, menos tiempo por sesión.',
          'Torso/pierna: más frecuencia por grupo si entrenas 4 días.',
          'Deja ≥48 h antes de repetir un grupo fatigado.',
        ],
      },
      {
        title: 'Ejercicios prioritarios',
        content:
          'Hip thrust, sentadilla, peso muerto rumano y zancadas construyen pierna y glúteo; remo, press y dominadas asisten al tren superior. No descuides la espalda ni el core: el equilibrio previene molestias.',
        bullets: [
          'El hip thrust sobrecarga el glúteo sin exigir tanto a la lumbar.',
          'Rango completo y técnica controlada cuentan más que el peso en la barra.',
          'La sobrecarga se aplica igual en todos los ejercicios.',
        ],
      },
      {
        title: 'Recuperación y ciclo',
        content:
          'La recuperación es individual: duerme bien, come proteína suficiente y ajusta el volumen en días de fatiga alta. Algunas mujeres notan cambios de rendimiento según la fase del ciclo: es normal, no una excusa para saltarse todo.',
        bullets: [
          'Si un día rindes menos, mantén la técnica y baja carga si hace falta.',
          'El dolor articular no se entrena: descansa y valora con un profesional.',
          'La progresión se mide en semanas, no en cada sesión.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 7,
    slug: 'gluteos-base',
    category: 'mujer',
    title: 'Glúteos base',
    summary: 'Bases, activación y progresión para desarrollar el glúteo.',
    keyPoints: [
      'Bases: puente de glúteos, sentadilla profunda, hip thrust, peso muerto rumano y zancadas con peso.',
      'Activa antes con puentes, clam shells o kickbacks con banda.',
      '2–3 sesiones de glúteos a la semana con ≥48 h de recuperación.',
      'Rango completo y sobrecarga progresiva; errores comunes: exceso de peso y rango limitado.',
    ],
    sections: [
      {
        title: 'Los ejercicios que sostienen el glúteo',
        content:
          'La base son los ejercicios de cadera y bisagra: puente de glúteos, hip thrust, peso muerto rumano y zancadas. Complementa con sentadilla profunda. Juntos cubren extensión de cadera, empuje vertical y estabilidad de una pierna.',
        bullets: [
          'Hip thrust: máxima activación del glúteo en extensión de cadera.',
          'Peso muerto rumano: glúteo e isquiosurales, cadena posterior.',
          'Zancadas y sentadilla: pierna y glúteo en patrón funcional.',
        ],
      },
      {
        title: 'Activación antes de cargar',
        content:
          'Muchas personas tienen el glúteo «dormido» por estar muchas horas sentadas. Activar antes con trabajo suave y aislado (puentes, clam shells, kickbacks con banda) mejora la conexión mente-músculo y la técnica.',
        bullets: [
          '2–3 ejercicios de activación, 10–15 reps cada uno.',
          'Con banda o sin ella: la técnica manda sobre la resistencia.',
          'Concéntrate en apretar el glúteo, no en la espalda baja.',
        ],
      },
      {
        title: 'Progresión y errores comunes',
        content:
          'Sube peso de forma gradual y mantén el rango completo: un hip thrust a media altura entrena menos. Los errores típicos son cargar de más (la lumbar suple al glúteo) y hacer rangos cortos o rebotes.',
        bullets: [
          'Rango completo con pausa arriba: ahí está el estímulo.',
          'Controla el descenso; no dejes caer el peso con la gravedad.',
          'Dolor lumbar agudo → baja carga y revisa técnica.',
        ],
      },
      {
        title: 'Frecuencia y recuperación',
        content:
          '2–3 sesiones de glúteos a la semana funcionan bien, con al menos 48 h de recuperación entre sesiones duras del mismo grupo. El glúteo es un músculo grande y responde a volumen distribuido.',
        bullets: [
          'Mejor 2–3 sesiones repartidas que una sola brutal.',
          'El hip thrust pesado puede pedir 2–3 min de descanso entre series.',
          'Comida y sueño suficientes sostienen la progresión.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 8,
    slug: 'hiit-vs-liss',
    category: 'entrenamiento',
    title: 'HIIT vs LISS',
    summary: 'Qué cardio elegir según tu objetivo y cómo combinarlos.',
    keyPoints: [
      'HIIT: ráfagas cortas a alta intensidad (por ej. 30 s duro / 90 s suave). Ahorra tiempo y quema mucho en poco rato.',
      'LISS: 20–40 min a ritmo suave (caminar, bici, elíptica). Fácil de recuperar y compatible con cualquier día.',
      'Para hipertrofia, el LISS no interfiere si comes suficiente; el HIIT en exceso puede sí.',
      'Combinación típica: 1–2 HIIT + 2–3 LISS a la semana según días de gimnasio.',
    ],
    sections: [
      {
        title: 'Qué es cada uno',
        content:
          'El HIIT alterna ráfagas casi máximas (15–60 s) con descansos cortos; en 15–25 min terminas. El LISS es cardio de intensidad baja a ritmo constante (20–40 min) en el que puedes hablar sin ahogarte: caminar rápido, bici suave, elíptica.',
        bullets: [
          'HIIT: sesión corta, exigente, alta demanda de recuperación.',
          'LISS: suave, sostenible a diario, casi no resta a la fuerza.',
          'Ambos mejoran salud cardiovascular; eligen distinto.',
        ],
      },
      {
        title: '¿Cuál te conviene?',
        content:
          'Si entrenas fuerza y tu objetivo es hipertrofia, el LISS es el aliado: aporta salud y gasto sin interferir con la recuperación. El HIIT brilla cuando el tiempo es corto o quieres condición física en poco rato, pero exige energía que puede faltar en días de pierna.',
        bullets: [
          'Días de fuerza + HIIT seguido → rendimiento inferior en ambos.',
          'HIIT en exceso sube fatiga y puede frenar la ganancia muscular.',
          'LISS encaja en cualquier momento del día sin preparar.',
        ],
      },
      {
        title: 'Cómo combinarlos',
        content:
          'Una pauta típica: 1–2 sesiones de HIIT (15–20 min) en días ligeros o como tope de semana, y 2–3 de LISS (20–40 min) en días de descanso o tras fuerza. Empieza con un día de cada uno si no estás acostumbrado.',
        bullets: [
          'HIIT: calienta 5 min antes; 3–5 intervalos son suficientes para empezar.',
          'LISS: ritmo conversacional; añade minutos poco a poco.',
          'Escucha fatiga: el cardio debe sumar, no vaciar tus piernas.',
        ],
      },
      {
        title: 'Sobre la «quema» de calorías',
        content:
          'El HIIT quema más por minuto y algo después de acabar (EPOC); el LISS quema más en total por la duración. A final de semana, el total de calorías gastadas decide más que la intensidad del día.',
        bullets: [
          'Quemar grasa depende del déficit acumulado, no del tipo de cardio.',
          'El cardio no sustituye una buena dieta.',
          'Elige el que puedas mantener semanas: la adherencia gana.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 9,
    slug: 'estancamiento',
    category: 'entrenamiento',
    title: 'Estancamiento: qué hacer',
    summary: 'Causas comunes de no progresar y cómo desatascarlo.',
    keyPoints: [
      'Revisa el registro: si llevas semanas con el mismo peso y reps, necesitas sobrecarga o cambios.',
      'Suele ser falta de volumen, sueño o comida, no de motivación.',
      'Sube series, mejora la técnica o cambia de ejercicio por 4–6 semanas.',
      'Si fallas la misma serie varias semanas seguidas, aplica un deload y luego ajusta cargas.',
    ],
    sections: [
      {
        title: 'Diagnostica antes de tocar nada',
        content:
          'El estancamiento suele tener causas claras. Revisa primero: ¿comes y duermes suficiente? ¿El peso y las reps llevan semanas clavados? ¿Entrenas con un esfuerzo real o solo «pasas»? Con el registro de la app puedes verlo en un minuto.',
        bullets: [
          'El registro miente menos que la memoria: usa el historial.',
          'Técnica que se degrada también frena el progreso.',
          'Un mal día no es estancamiento: lo es 3–4 semanas sin avance.',
        ],
      },
      {
        title: 'Causas más frecuentes',
        content:
          'Las tres culpables habituales son: poco volumen o intensidad real, recuperación insuficiente (sueño/comida) y ejercicios o rangos siempre idénticos. La «falta de motivación» casi nunca es el problema de fondo.',
        bullets: [
          'Falta de sobrecarga: sube peso, reps o series de forma planificada.',
          'Falta de sueño: baja rendimiento y síntesis proteica.',
          'Falta de comida: sin energía, no hay progreso sostenido.',
        ],
      },
      {
        title: 'Qué cambiar primero',
        content:
          'Antes de cambiar de programa: asegura la técnica, sube el esfuerzo real de las series y añade 1 serie o 1 rep por ejercicio cada semana. Si en 2–3 semanas no responde, introduce variación: otro ejercicio parecido, más frecuencia o rangos distintos.',
        bullets: [
          'La sobrecarga progresiva es el primer botón a pulsar.',
          'Cambiar de ejercicio 4–6 semanas puede reacomodar el estímulo.',
          'No cambies de rutina cada semana: el cambio también necesita tiempo.',
        ],
      },
      {
        title: 'El deload como solución',
        content:
          'Si fallas la misma serie varias semanas y el cuerpo se siente pesado, baja la carga ~40–50% una semana manteniendo el patrón. Recuperas sin perder estímulo, y sueles volver a progresar en 1–2 semanas.',
        bullets: [
          'Deload no es una semana libre: es entreno suave y deliberado.',
          'Si tras el deload sigues estancado, revisa volumen y dieta.',
          'Ante duda, consulta a un profesional: a veces el bloqueo es técnico o médico.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 10,
    slug: 'deload',
    category: 'entrenamiento',
    title: 'Semana de deload',
    summary: 'Bajar la intensidad para recuperar y volver más fuerte.',
    keyPoints: [
      'Cada 4–8 semanas o cuando el rendimiento cae, reduce carga ~40–50% con las mismas series.',
      'Mantén la técnica y la frecuencia; baja peso e intensidad, no la asistencia al gimnasio.',
      'Una semana basta: volver a los niveles previos suele ser cuestión de días.',
      'No es perder progreso: es el estímulo que permite las siguientes semanas de avance.',
    ],
    sections: [
      {
        title: 'Qué es y para qué sirve',
        content:
          'El deload es una semana planificada de carga reducida (peso e intensidad) que permite que el sistema nervioso y el músculo se recuperen sin dejar de entrenar. No es perder el progreso: es el «reset» que te permite seguir avanzando después.',
        bullets: [
          'Baja el peso ~40–50% manteniendo series y técnica.',
          'Mantén la frecuencia: seguir moviendo el patrón ayuda a conservar lo ganado.',
          'La intensidad (RPE) baja; el resto del estímulo se conserva.',
        ],
      },
      {
        title: 'Cuándo hacerlo',
        content:
          'Dos opciones válidas: por calendario (cada 4–8 semanas de bloque) o por señales (rendimiento en descenso, fatiga alta, mal sueño, articulaciones pesadas). El criterio «por señales» se ajusta mejor a la vida real.',
        bullets: [
          'Por calendario: estable, fácil de planificar.',
          'Por señales: más preciso, evita llegar al agotamiento.',
          'Señal clara: las cargas que hacías con soltura ahora cuestan el doble.',
        ],
      },
      {
        title: 'Cómo diseñar la semana',
        content:
          'Misma estructura de la rutina, pero con ~40–50% menos carga y dejando 1–2 repeticiones en reserva. Puedes reducir también el número de series a la mitad si la semana ha sido dura. No metas cardio extra ni sesiones inventadas.',
        bullets: [
          'El entreno debe sentirse «fácil»: esa es la señal de que estás recuperando.',
          'Mantén la técnica perfecta: es una semana para pulirla.',
          'Una semana es suficiente; alargar más puede desentrenar.',
        ],
      },
      {
        title: 'Después del deload',
        content:
          'Vuelve con las cargas previas: la primera semana puede sentirse pesada, la segunda deberías volver a los números de siempre y empezar a superarlos. Si a la tercera sigues flojo, revisa volumen, dieta y sueño antes de forzar.',
        bullets: [
          'No intentes «recuperar el tiempo perdido» subiendo de golpe.',
          'El deload no es excusa para abandonar hábitos: duerme y come igual de bien.',
          'Los mejores progresos suelen venir la semana tras el deload.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 11,
    slug: 'espalda-segura',
    category: 'entrenamiento',
    title: 'Espalda segura en el gimnasio',
    summary: 'Técnica básica para proteger la zona lumbar en cargas y remos.',
    keyPoints: [
      'En peso muerto y remo: espalda neutra, no redonda; empuja con las piernas y aprieta el core.',
      'El cinturón no sustituye la técnica: úsalo para cargas altas, no para levantar mal.',
      'Si notas dolor lumbar agudo o irradiado, para y consulta a un profesional.',
      'Gana rigidez: inspira y bloquea el abdomen antes de cada repetición pesada.',
    ],
    sections: [
      {
        title: 'La espalda neutra lo es todo',
        content:
          'En bisagras (peso muerto, peso muerto rumano, remos con peso) la columna debe mantener sus curvas naturales: no redondeada ni hiperextendida. La «colocación» se construye apretando el abdomen y manteniendo el pecho alto, no estirando la cabeza.',
        bullets: [
          'Espalda redonda con carga es la receta del dolor lumbar.',
          'Hiperextender al subir tampoco: mantén la posición neutra.',
          'Inicia el peso muerto empujando con las piernas, no tirando con la espalda.',
        ],
      },
      {
        title: 'La respiración y la rigidez',
        content:
          'Antes de cada repetición pesada: inspira, bloquea el abdomen (brazo/manual) y mantén la presión durante el movimiento. Esa «rigidez abdominal» protege la zona lumbar mejor que cualquier cinturón.',
        bullets: [
          'El bloqueo se sostiene en todo el recorrido, no solo al arrancar.',
          'No aprietes la respiración hasta marearte: controla y exhala al final.',
          'El cinturón ayuda en cargas altas, pero la técnica manda.',
        ],
      },
      {
        title: 'El core es tu mejor seguro',
        content:
          'Los ejercicios de core (plancha, bird dog, pallof press) enseñan a estabilizar la columna bajo carga. Un core fuerte no es solo «abdominales visibles»: es protección lumbar en cualquier ejercicio compuesto.',
        bullets: [
          'Plancha y bird dog: estabilidad sin sobrecargar la lumbar.',
          'El pallof press entrena contra-rotación, muy útil para cargas asimétricas.',
          'Hazlos también en días de descanso: no fatigan apenas.',
        ],
      },
      {
        title: 'Cuándo parar y pedir ayuda',
        content:
          'Diferencia el dolor muscular (normal tras entrenar) del dolor articular o irradiado (señal de parar). Si notas dolor lumbar agudo, hormigueo o dolor que baja por la pierna, detente y consulta a un profesional.',
        bullets: [
          'El dolor que empeora al cargar es bandera roja, no «rugir y seguir».',
          'Ante molestia lumbar persistente, revisa técnica y volumen antes que cargar más.',
          'Un profesional (fisioterapeuta) puede devolverte a entrenar más seguro.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 12,
    slug: 'menu-definicion',
    category: 'dietas',
    title: 'Menú orientativo de definición',
    summary: 'Estructura de comidas para déficit moderado sin perder rendimiento.',
    keyPoints: [
      'Desayuno: claras/huevos + pan integral + fruta.',
      'Comida: verdura + proteína magra + arroz o patata en cantidad moderada.',
      'Merienda: yogur griego o requesón + frutos secos (pocos).',
      'Cena: ensalada grande + pescado o pollo a la plancha.',
      'Déficit de ~15–20% y proteína alta (≥1,8 g/kg) para conservar músculo.',
    ],
    sections: [
      {
        title: 'La regla de oro del déficit',
        content:
          'Para definir conservando músculo: déficit moderado (~15–20% menos de lo que gastas) y proteína alta (≥1,8 g/kg). Un déficit brusco quema músculo además de grasa, y la mayoría no lo aguanta más de dos semanas.',
        bullets: [
          'Déficit suave = menos hambre, más adherencia, mejor rendimiento.',
          'La proteína sube saciedad y protege la masa magra.',
          'Pérdida de peso saludable: ~0,5–1% del peso corporal a la semana.',
        ],
      },
      {
        title: 'Estructura del día',
        content:
          'Desayuno: claras o huevos con pan integral y fruta. Comida: verdura + proteína magra + arroz o patata en cantidad moderada. Merienda: yogur griego o requesón con pocos frutos secos. Cena: ensalada grande con pollo o pescado.',
        bullets: [
          'Las verduras llenan sin calorías: tu mejor aliado contra el hambre.',
          'La fruta no engorda por sí sola: cabe en el déficit con control.',
          'Cocina con poca grasa y pesa las salsas (esconden calorías).',
        ],
      },
      {
        title: 'Entrenar en déficit',
        content:
          'La fuerza puede mantenerse si comes suficiente proteína y duermes bien. Prioriza los compuestos, respeta los descansos y no acumules volumen extra: la recuperación es más lenta en déficit.',
        bullets: [
          'Si la fuerza cae mucho, revisa el déficit: quizá es demasiado agresivo.',
          'El cardio ayuda al gasto, pero no lo necesitas para empezar a perder.',
          'Bebe agua: el peso «que no baja» a veces es retención, no grasa.',
        ],
      },
      {
        title: 'Errores que frenan la definición',
        content:
          'Saltarse comidas, eliminar carbohidratos por completo, pesarse cada hora o castigarse por un día malo. La definición es paciencia: los cambios visibles se miden en semanas y en el espejo, no en el peso del día.',
        bullets: [
          'No elimines los carbohidratos: alimentan el entreno y la mente.',
          'Un día de exceso no arruina la semana: vuelve al plan y sigue.',
          'El déficit prolongado también necesita deloads y días libres.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 13,
    slug: 'sobreentrenamiento',
    category: 'recuperacion',
    title: 'Sobrecarga y sobreentrenamiento',
    summary: 'Señales de que entrenas de más y cómo ajustar.',
    keyPoints: [
      'Señales: cansancio persistente, mal dormir, fuerza estancada o bajando, molestias nuevas.',
      'Más no siempre es mejor: el progreso ocurre durante la recuperación.',
      'Reduce volumen o intensidad una semana y vigila cómo responde el cuerpo.',
      'Distingue fatiga puntual de sobreentrenamiento real; ante duda, consulta a un profesional.',
    ],
    sections: [
      {
        title: 'Fatiga puntual vs. sobreentrenamiento',
        content:
          'Sentirse cansado tras una semana dura es fatiga normal y se resuelve con descanso. El sobreentrenamiento real es un estado prolongado (semanas) de rendimiento estancado o en caída que no mejora con días sueltos de descanso.',
        bullets: [
          'Fatiga puntual: 1–3 días y vuelves al 100%.',
          'Sobreentrenamiento: semanas sin mejorar aunque «descanses».',
          'La mayoría de la gente no sobreentrena: entrena y recupera mal.',
        ],
      },
      {
        title: 'Señales a vigilar',
        content:
          'Cansancio que no pasa, insomnio o sueño no reparador, fuerza que baja a pesar de esforzarte, molestias nuevas, irritabilidad o pérdida de motivación y de apetito. Varias juntas durante semanas apuntan a acumular demasiado.',
        bullets: [
          'El mal sueño es de las señales más claras y más ignoradas.',
          'La fuerza estancada varias semanas con buena técnica es otra.',
          'Las molestias articulares nuevas no se entrenan: se valoran.',
        ],
      },
      {
        title: 'Cómo salir del agujero',
        content:
          'Reduce volumen o intensidad durante 1–2 semanas (tipo deload), duerme 7–9 h cada noche y come suficiente proteína y carbohidratos. No añadas cardio «para compensar»: eso empeora el problema.',
        bullets: [
          'Un deload bien hecho suele bastar para notar alivio en una semana.',
          'Reintroduce el volumen poco a poco, no de golpe.',
          'Si tras 2 semanas de descanso real sigues mal, consulta a un profesional.',
        ],
      },
      {
        title: 'Prevención: piensa en semanas',
        content:
          'El progreso es a largo plazo: planifica bloques con deloads, escucha las señales antes de «apretar más» y entiende que el músculo crece mientras recuperas. Una semana floja no arruina un año; una lesión sí.',
        bullets: [
          'Programa deloads cada 4–8 semanas antes de que te lo pidan.',
          'El sueño y la comida son parte del entrenamiento, no extras.',
          'Más no es mejor: mejor es más bien hecho y mejor recuperado.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 14,
    slug: 'tecnica-sentadilla',
    category: 'entrenamiento',
    title: 'Técnica de sentadilla',
    summary: 'Patrón, posición de pies y errores comunes en la sentadilla con barra.',
    keyPoints: [
      'Pies a la anchura de los hombros, punteras ligeramente abiertas.',
      'Cadera atrás y bajada controlada hasta donde la técnica se mantenga.',
      'Rodillas en la misma dirección que los pies; pecho abierto, espalda neutra.',
      'Empuja con todo el pie para subir, no con la puntera.',
    ],
    sections: [
      {
        title: 'Posición inicial',
        content:
          'Coloca la barra apoyada sobre el trapecio (sentadilla alta) o sobre los deltoides posteriores (sentadilla baja). Pies a la anchura de los hombros, punteras abiertas ~15–30°. Inspira y bloquea el abdomen antes de iniciar.',
        bullets: [
          'Barra bien centrada para no torcer el tronco.',
          'Pies firmes en el suelo: no se levantan los talones.',
          'El agarre ancho y activo da rigidez a la parte superior.',
        ],
      },
      {
        title: 'El descenso y la subida',
        content:
          'Inicia el movimiento con cadera hacia atrás y al mismo tiempo flexiona las rodillas. Baja de forma controlada manteniendo la espalda neutra; la profundidad es la que tu movilidad permita sin perder el arco lumbar.',
        bullets: [
          'Las rodillas empujan en la dirección de las punteras.',
          'El pecho se mantiene abierto; no dejes caer la mirada.',
          'Sube empujando contra el suelo con toda la planta del pie.',
        ],
      },
      {
        title: 'Errores comunes',
        content:
          'Los más frecuentes son: talones que se despegan, rodillas que entran hacia dentro, espalda redondeada al fondo y bajada demasiado rápida.',
        bullets: [
          'Talones fuera → movilidad de tobillo o anchura de pies.',
          'Rodillas entrando → falta de fuerza o abrir las rodillas con intención.',
          'Dolor de rodilla anterior persistente → revisa técnica y profundidad.',
        ],
      },
      {
        title: 'Variantes útiles',
        content:
          'Si la barra sobre la espalda te incomoda o estás aprendiendo, la sentadilla goblet o la front squat enseñan mejor la posición vertical del tronco y la profundidad.',
        bullets: [
          'Goblet: ideal para principiantes por el patrón de carga frontal.',
          'Front squat: obliga a mantener el codo alto y el pecho erguido.',
          'Sentadilla a caja: enseña profundidad y frenado controlado.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 15,
    slug: 'press-banca-progresion',
    category: 'entrenamiento',
    title: 'Progresión en press de banca',
    summary: 'Técnica, agarre y cómo subir kilos de forma sostenible.',
    keyPoints: [
      'Escápulas retraídas y estables; pies firmes en el suelo.',
      'Barra en línea con las muñecas; codo ~45° respecto al tronco.',
      'Sube peso con «2 en 2»: si cierras el rango con buena técnica, incrementa.',
      'El punto más débil suele ser el arranque: entrénalo con pausas o press con mancuernas.',
    ],
    sections: [
      {
        title: 'Técnica de base',
        content:
          'Recuéstate con los pies firmes, retrae y fija las escápulas (hombros atrás y abajo). Agarra la barra algo más ancho que los hombros, bájala de forma controlada tocando el pecho sin rebote y empuja hasta el bloqueo sin separar las escápulas.',
        bullets: [
          'Muñecas alineadas: la barra sobre la base de la mano, no sobre los dedos.',
          'Los codos a ~45° protegen el hombro (nada de «alas de pollo»).',
          'Pecho «alto»: arco leve y hombros estables protegen el manguito.',
        ],
      },
      {
        title: 'Cómo añadir peso',
        content:
          'Usa la regla «2 en 2»: si completas las dos últimas series del rango (por ejemplo 4×6) con técnica controlada, añade 2,5 kg la siguiente sesión. Los incrementos pequeños se acumulan: 2,5 kg por ciclo son ~30 kg al año.',
        bullets: [
          'Alterna sesiones de fuerza (pocas reps, peso alto) y volumen (más reps).',
          'Incluye press inclinado y press con mancuernas para apoyar la progresión.',
          'Registra cada sesión: el progreso real se ve en semanas.',
        ],
      },
      {
        title: 'Puntos débiles frecuentes',
        content:
          'Si fallas el arranque desde el pecho, refuerza el press de pausa (1 s en el pecho) y el press con mancuernas. Si fallas el bloqueo, trabaja press de banca cerrado o fondos.',
        bullets: [
          'Pausa en el pecho: quita el rebote y construye fuerza de arranque.',
          'Hombro inestable → reduce carga y corrige el ángulo de codo.',
          'Si el pecho gana pero el tríceps no, prioriza trabajo de tríceps.',
        ],
      },
      {
        title: 'Seguridad en el press',
        content:
          'Nunca entres en fallo sin compañero o sin topes en el rack. La barra al cuello no se perdona. Si entrenas solo, usa la banca con soportes de seguridad o un spotter.',
        bullets: [
          'Compañero de spot: acuerda las señales antes de empezar.',
          'Topes del rack a la altura del pecho: parada de emergencia.',
          'Nada de pinza en la barra si usas spotter (impide soltar la carga).',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 16,
    slug: 'principiante',
    category: 'entrenamiento',
    title: 'Guía para principiantes',
    summary: 'Primeras semanas: técnica, estructura y qué esperar.',
    keyPoints: [
      'Aprende el patrón antes que el peso: sentadilla, empuje, tirón, bisagra.',
      'Empieza con 3 días de full body a la semana.',
      'La progresión inicial es rápida: usa el registro para subir de forma segura.',
      'El dolor muscular intenso de los primeros días es normal; no es fuerza ni daño.',
    ],
    sections: [
      {
        title: 'Los primeros días',
        content:
          'Dedica 2–3 semanas a aprender los patrones básicos con cargas ligeras o el propio peso: sentadilla, empuje (press), tirón (remo/dominada asistida) y bisagra de cadera. La técnica aprendida al inicio te protege el resto de la vida.',
        bullets: [
          'Videograbarte te ahorra errores que luego cuesta corregir.',
          'Si un ejercicio duele en una articulación (no en el músculo), para.',
          'Dolor muscular del día siguiente es normal; el agudo no.',
        ],
      },
      {
        title: 'Estructura de la semana',
        content:
          'Un full body 3 días (lunes, miércoles, viernes) es ideal para empezar: cada sesión toca todos los grupos con 1–2 ejercicios por patrón. Deja al menos un día de descanso entre sesiones.',
        bullets: [
          'Sesión típica: sentadilla o pierna, press, remo, core.',
          '2–3 series de 8–12 reps por ejercicio en las primeras semanas.',
          'Descansa 1–3 min entre series; apunta el peso y las reps.',
        ],
      },
      {
        title: 'Qué esperar (y qué no)',
        content:
          'El progreso inicial puede ser rápido gracias a la adaptación neural, no al músculo todavía. No esperes cambios visibles la primera semana: el registro semanal (peso en la barra) es el mejor indicador.',
        bullets: [
          'Fuerza sube rápido al principio: es normal y motivador.',
          'Cambios visibles suelen llegar a partir de las 4–8 semanas.',
          'Si una semana no progresas, revisa sueño y comida antes de cambiar el plan.',
        ],
      },
      {
        title: 'Errores típicos del principiante',
        content:
          'Empezar demasiado cargado, saltarse el calentamiento, copiar programas avanzados o cambiar de rutina cada semana.',
        bullets: [
          'Más peso no enseña antes: enseña mal.',
          'Calienta 5–10 min: el calentamiento es parte del entrenamiento.',
          'Constancia durante meses > intensidad perfecta una semana.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 17,
    slug: 'recuperacion-activa',
    category: 'recuperacion',
    title: 'Recuperación activa',
    summary: 'Qué es, cuándo hacerla y ejemplos de días suaves.',
    keyPoints: [
      'Movimiento ligero que favorece la circulación sin añadir fatiga.',
      'Paseo, bici suave, natación tranquila o movilidad: 20–40 min.',
      'Mejor que el reposo total para el dolor muscular de las 24–72 h.',
      'No cuenta como entrenamiento duro; no reemplaza el descanso.',
    ],
    sections: [
      {
        title: '¿Qué es la recuperación activa?',
        content:
          'Es actividad de intensidad baja–moderada que mantiene el cuerpo en movimiento los días de descanso. Favorece el riego sanguíneo y la movilidad, y ayuda a que el dolor muscular post-entreno (DOMS) baje antes que con reposo total.',
        bullets: [
          'Intensidad que permita hablar con naturalidad.',
          'Duración típica de 20–40 minutos.',
          'Mejor movimiento que sofá, pero sin exigir el músculo fatigado.',
        ],
      },
      {
        title: 'Cuándo usarla',
        content:
          'Ideal al día siguiente de una sesión dura del mismo grupo, o en tus días programados de descanso cuando notas rigidez. También sirve como «descarga» en semanas de deload.',
        bullets: [
          'Dolor muscular de esfuerzo → recuperación activa ligera.',
          'Fatiga general → paseo suave en vez de entrenar.',
          'Dolor articular agudo → no: descansa y valora con un profesional.',
        ],
      },
      {
        title: 'Ejemplos prácticos',
        content:
          'Un paseo de 30 min a paso ligero, bici suave, natación tranquila, estiramientos dinámicos o una sesión de movilidad (rodillas, cadera, hombros) sin peso.',
        bullets: [
          'Estirar no recupera «más rápido» por sí solo, pero alivia rigidez.',
          'Rodillo y masaje: agradables, no sustituyen el descanso.',
          'La mejor recuperación activa es la que realmente harás.',
        ],
      },
    ],
    sourceUrl: '',
  },
  {
    id: 18,
    slug: 'hidratacion',
    category: 'nutricion',
    title: 'Hidratación para entrenar',
    summary: 'Cuánta agua tomar y cómo reponer sales en el gimnasio.',
    keyPoints: [
      'Bebe en las horas previas: ~500 ml antes de entrenar.',
      'Pérdida de 1–2% de agua ya baja rendimiento y concentración.',
      'La orina clara es una buena señal de hidratación.',
      'En sesiones largas o con mucho sudor, añade electrolitos.',
    ],
    sections: [
      {
        title: 'Cuánta agua necesitas',
        content:
          'Como referencia base: ~30–35 ml por kg de peso corporal al día (una persona de 70 kg ≈ 2,1–2,5 l), y más si hace calor o entrenas con sudor abundante. La sed ya es un síntoma tardío: mejor beber a lo largo del día.',
        bullets: [
          'La orina clara o pajizo es señal de buena hidratación.',
          'Antes de entrenar: ~500 ml en las 2 h previas.',
          'Bebe a sorbos durante la sesión: ~150–250 ml cada 15–20 min.',
        ],
      },
      {
        title: 'Agua, electrolitos y rendimiento',
        content:
          'Perder 1–2% del peso en agua baja fuerza, velocidad y concentración, y sube la percepción de esfuerzo. En sesiones de más de ~60–90 min o con sudor muy abundante, el agua sola no basta: repone sodio y potasio.',
        bullets: [
          'Agua + algo de sal en la comida suele bastar para entrenos normales.',
          'Bebidas isotónicas: útiles en sesiones largas, no necesarias a diario.',
          'Cuidado con bebidas azucaradas en exceso: calorías que no aportan.',
        ],
      },
      {
        title: 'Señales de alarma',
        content:
          'Sed intensa, boca seca, orina muy oscura, mareos o calambres pueden indicar deshidratación. Si entrenas con calor y aparecen confusión o vómitos, para y busca atención sanitaria.',
        bullets: [
          'El color de la orina es el indicador más fiable y gratuito.',
          'Los calambres pueden deberse a deshidratación y falta de sales.',
          'Rehidrátate progresivamente, no de golpe.',
        ],
      },
    ],
    sourceUrl: '',
  },
]
