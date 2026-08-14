// Traducciones EN de los 6 papers de la biblioteca (clave = slug ES).
// Los títulos/autor/año ya están en inglés en el seed; aquí solo summary y keyPoints.
export const PAPERS_EN: Record<string, { summary: string; keyPoints: string[] }> = {
  'volume-vs-intensity-hypertrophy': {
    summary: 'Meta-analysis on the relationship between training volume and muscle growth. Concludes that more volume produces more hypertrophy up to a point of diminishing returns.',
    keyPoints: [
      'Total volume is the main driver of hypertrophy.',
      '10+ sets per muscle group/week produces more gains than <10.',
      'The effect tapers off above ~20 sets/week.',
    ],
  },
  'protein-timing-muscle': {
    summary: 'Systematic review of 49 studies on protein and muscle gains. Consuming 1.6 g/kg/day is the optimal threshold; more does not significantly improve results.',
    keyPoints: [
      '1.6 g protein/kg/day = threshold for maximal hypertrophy.',
      'Post-workout timing helps marginally.',
      'Spreading protein across 4+ meals a day is optimal.',
    ],
  },
  'rest-periods-strength-hypertrophy': {
    summary: 'Comparison of short (30s) vs. long (3min) rest periods on strength and hypertrophy. Long rests allow more total volume and better strength; for hypertrophy both work if total volume is similar.',
    keyPoints: [
      '3min rests produce greater strength than 30s.',
      'For hypertrophy, total volume matters more than rest length.',
      'Recommendation: 2-3min for compound exercises.',
    ],
  },
  'frequency-training-muscle': {
    summary: 'Meta-analysis comparing training each muscle once vs. 2-3 times per week. Training more frequently produces slightly more hypertrophy due to greater volume distribution.',
    keyPoints: [
      '2-3 times/week per muscle > 1 time/week.',
      'The difference is small but statistically significant.',
      'Spreading volume across more sessions improves recovery.',
    ],
  },
  'sleep-recovery-performance': {
    summary: 'Review on the impact of sleep on athletic performance. Sleep deprivation reduces strength, power and muscle recovery.',
    keyPoints: [
      '7-9 hours of sleep are essential for recovery.',
      'Sleep deprivation reduces muscle protein synthesis.',
      'Quality sleep improves reaction time and power.',
    ],
  },
  'progressive-overload-principle': {
    summary: 'Reference article on the principle of progressive overload. Without a progressive increase in demand, there is no adaptation or improvement.',
    keyPoints: [
      'Progressive overload is the fundamental principle of training.',
      'It can be volume, intensity, frequency or density.',
      'Tracking data is key to ensuring progression.',
    ],
  },
}
