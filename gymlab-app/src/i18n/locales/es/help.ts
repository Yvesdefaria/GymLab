// Catálogo central de ayudas contextuales (F90). Cada entrada se consume con
// <InfoTip id="..."/>; el registro tipado vive en src/i18n/help.ts.
export const help = {
  recovery: {
    label: 'Cómo se calcula el score de recuperación',
    body: 'El score combina tu último entreno (días de descanso), el sueño, las agujetas y tu racha. Cada señal puntúa de 0 a 100 y se pondera según los datos disponibles. Rangos: 0–{{restMax}}, mejor descansa; {{maybeMin}}–{{maybeMax}}, podrías entrenar; {{readyMin}}–100, listo para entrenar.',
  },
  deload: {
    label: 'Qué es la semana de deload',
    body: 'Semana con menos carga para recuperarte y volver más fuerte: reduce el peso ({{pct}}%) manteniendo series y frecuencia. La marca se apaga sola a los 7 días; no cambia pesos ni series de tus rutinas.',
  },
  insightAlza: {
    label: 'Qué significa el volumen al alza',
    body: 'El volumen es la carga total semanal (kg: serie × peso). Subir más de un 5% frente a la semana anterior es buena señal; mantén la técnica y el descanso para sostenerlo.',
  },
  insightDescenso: {
    label: 'Qué significa el volumen en descenso',
    body: 'El volumen es la carga total semanal (kg: serie × peso). Una caída de más del 10% frente a la semana anterior puede indicar fatiga o menos constancia; es orientativo, escucha a tu cuerpo.',
  },
  insightEstable: {
    label: 'Qué significa el volumen estable',
    body: 'El volumen es la carga total semanal (kg: serie × peso). Se considera estable cuando varía menos de un ±10% frente a la semana anterior. Es solo informativo, no cambia tu plan.',
  },
  grasa: {
    label: 'Cómo se calcula el % de grasa',
    body: 'El % se estima con el protocolo Jackson-Pollock (7 pliegues, o 3 si faltan datos) y la ecuación de Siri. Es orientativo: depende de la técnica de la pinza, la hidratación y el observador.',
  },
  medidasCorporales: {
    label: 'Para qué registrar medidas',
    body: 'Mide siempre en los mismos puntos y a horas similares para que la evolución sea fiable. La app guarda un registro por día y calcula ratios de salud (cintura/altura, cintura/cadera) y simetría izquierda-derecha.',
  },
  volumen: {
    label: 'Cómo se calcula el volumen',
    body: 'El volumen es la suma de peso × repeticiones de tus series completadas. La app lo agrupa por semana (de lunes a domingo) para que veas si sube o baja frente a las semanas anteriores.',
  },
  volumenMuscular: {
    label: 'Cómo se reparte el volumen por músculo',
    body: 'Cada serie suma su peso × repeticiones al grupo muscular principal del ejercicio. El gráfico muestra qué proporción del volumen se llevó cada grupo en el periodo elegido.',
  },
  carga: {
    label: 'Qué es la carga por sesión',
    body: 'Cada punto resume una sesión: la línea sigue el peso máximo levantado en el ejercicio graficado (sin contar calentamientos). El punto dorado marca tu PR (mejor marca) en ese ejercicio.',
  },
  e1rm: {
    label: 'Qué es el 1RM estimado',
    body: 'Es el peso máximo que podrías levantar una sola vez, estimado con la fórmula de Brzycki (peso × 36 ÷ (37 − repeticiones)) a partir de tu mejor serie de cada sesión. El punto dorado resalta tu último registro.',
  },
  frecuencia: {
    label: 'Cómo se calcula la frecuencia',
    body: 'Cuenta cuántas veces entrenaste cada grupo muscular y lo compara con su objetivo semanal. Si te desvías más de un {{pct}}% del objetivo, aparece como alerta.',
  },
  pushPull: {
    label: 'Cómo se calcula el balance',
    body: 'Reparte tu volumen entre empuje (pecho, tríceps, hombro), tirón (espalda, bíceps, trapecios, antebrazo) y pierna (pierna, glúteo, abdomen). Si la diferencia entre empuje y tirón supera {{pct}} puntos, la app te avisa para equilibrar.',
  },
  imc: {
    label: 'Qué es el IMC',
    body: 'Relaciona tu peso y tu altura (peso ÷ altura²). Referencias: por debajo de {{bajo}}, bajo peso; de {{bajo}} a {{normal}}, normal; de {{normal}} a {{sobrepeso}}, sobrepeso; de {{sobrepeso}} en adelante, obesidad. Es orientativo, no reemplaza una valoración médica.',
  },
  ratios: {
    label: 'Qué significan los ratios',
    body: 'Cintura/altura: hasta {{whtrOk}} se considera saludable y por encima de {{whtrMedio}} el riesgo es alto. Cintura/cadera: por debajo de {{whrHombre}} en hombres y de {{whrMujer}} en mujeres se considera bajo. Son orientativos.',
  },
  rpe: {
    label: 'Qué es el RPE',
    body: 'Esfuerzo percibido de la serie: 10 es el máximo (no podías hacer ni una repetición más). La app lo usa para ajustar el descanso sugerido.',
  },
  rir: {
    label: 'Qué es el RIR',
    body: 'Repeticiones en reserva: cuántas repeticiones más podías haber hecho al terminar la serie. 0 significa que fuiste al fallo. Con RIR 0–1, la app suaviza el salto de peso que sugiere para la próxima serie.',
  },
} as const
