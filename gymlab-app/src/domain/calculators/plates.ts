export const STANDARD_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]

export interface PlateResult {
  barKg: number
  perSide: number[]
  totalLoaded: number
  exact: boolean
}

const roundHalf = (v: number) => Math.round(v * 2) / 2

export const platesForWeight = (
  targetKg: number,
  barKg = 20,
  available: number[] = STANDARD_PLATES
): PlateResult => {
  const target = Math.max(0, targetKg)
  const remaining = Math.max(0, (target - barKg) / 2)
  const sorted = [...available].sort((a, b) => b - a)

  let rest = remaining
  const perSide: number[] = []
  while (rest >= 0.0001) {
    const plate = sorted.find((p) => p <= rest + 0.0001)
    if (!plate) break
    perSide.push(plate)
    rest -= plate
  }

  const perSideTotal = perSide.reduce((a, b) => a + b, 0)
  const totalLoaded = barKg + perSideTotal * 2
  const diff = Math.abs(target - totalLoaded)

  return {
    barKg,
    perSide,
    totalLoaded: roundHalf(totalLoaded),
    exact: diff < 0.01,
  }
}
