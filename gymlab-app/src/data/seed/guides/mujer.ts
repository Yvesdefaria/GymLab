import type { Guide } from '@/domain/types'

export const seedGuides_mujer: Guide[] = [
  {
    id: 6,
    slug: 'entrenamiento-mujer-base',
    category: 'mujer',
    title: 'Entrenamiento de fuerza (base)',
    summary: 'Misma lógica de progresión; prioriza pierna/glúteo y técnica.',
    keyPoints: [
      'Full body 3 días o torso/pierna 4 días funcionan muy bien.',
      'Hip thrust, sentadilla, peso muerto rumano y zancadas como base.',
      'No hace falta "tonificar con poco peso": la carga progresiva es clave.',
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
]
