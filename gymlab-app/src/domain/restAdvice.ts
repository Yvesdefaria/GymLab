// Consejo de descanso en minutos (F97.1): el aviso inline y el temporizador Auto
// comparten la misma recomendación (`calcRestRecommendation`); aquí sólo se convierte
// la salida a minutos (decisión D6), con un mínimo de un minuto.
export const restAdviceMinutes = (recommendedSeconds: number): number =>
  Math.max(1, Math.round(recommendedSeconds / 60))
