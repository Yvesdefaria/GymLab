// Contrato puro del card con foto (F93 #15): recorte cover centrado y armado de
// la línea de stats. Sin React, sin canvas, sin i18n (las etiquetas se inyectan).
export interface CoverCrop {
  sx: number
  sy: number
  sw: number
  sh: number
}

// Recorte cuadrado centrado tipo object-fit: cover. El destino solo se valida:
// el canvas escala el recorte a 1080 (imágenes menores también, suavidad aceptada).
export const computeCoverCrop = (srcW: number, srcH: number, size: number): CoverCrop => {
  if (size <= 0 || srcW <= 0 || srcH <= 0) return { sx: 0, sy: 0, sw: 0, sh: 0 }
  const side = Math.min(srcW, srcH)
  return { sx: (srcW - side) / 2, sy: (srcH - side) / 2, sw: side, sh: side }
}

export interface StatsLineParts {
  volume: string
  prs: string | null
}

export interface StatsLineLabels {
  volume: string
  prOne: string
  prMany: string
}

// '{volumen} de volumen' + PRs solo con N > 0; singular con exactamente 1.
// Se devuelven las partes separadas para que el renderer pinte los PRs en dorado.
export const buildStatsLine = (
  volumeText: string,
  prCount: number,
  labels: StatsLineLabels,
): StatsLineParts => ({
  volume: `${volumeText} ${labels.volume}`,
  prs: prCount > 0 ? `${prCount} ${prCount === 1 ? labels.prOne : labels.prMany}` : null,
})
