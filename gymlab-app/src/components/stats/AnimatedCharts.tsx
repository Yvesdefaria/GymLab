// Wrappers de gráficos Recharts con animación de entrada (drawOn/fadeIn/staggerFade) al montar.
// Pasan todas las props al componente subyacente y añaden un div ref que useChartEntry observa.
import { useRef, type ComponentProps } from 'react'
import { ResponsiveContainer, AreaChart, BarChart, PieChart } from 'recharts'
import { useChartEntry, type ChartType } from '@/hooks/useChartEntry'

//--- AnimatedAreaChart: AreaChart con drawOn en el path del área ---
type AreaChartProps = ComponentProps<typeof AreaChart>

export const AnimatedAreaChart = ({
  height = 240,
  label,
  children,
  ...rest
}: AreaChartProps & { height?: number; label?: string }) => {
  const ref = useRef<HTMLDivElement>(null)
  // Re-dispara animación cuando cambia el nº de puntos de datos.
  const replayKey = rest.data?.length
  useChartEntry(ref, 'area', replayKey)

  return (
    <div ref={ref} role={label ? 'img' : undefined} aria-label={label}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart {...rest}>{children}</AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

//--- AnimatedBarChart: BarChart con staggerFade en las barras ---
type BarChartProps = ComponentProps<typeof BarChart>

export const AnimatedBarChart = ({
  height = 240,
  label,
  children,
  ...rest
}: BarChartProps & { height?: number; label?: string }) => {
  const ref = useRef<HTMLDivElement>(null)
  const replayKey = rest.data?.length
  useChartEntry(ref, 'bar', replayKey)

  return (
    <div ref={ref} role={label ? 'img' : undefined} aria-label={label}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart {...rest}>{children}</BarChart>
      </ResponsiveContainer>
    </div>
  )
}

//--- AnimatedDonut: PieChart con fadeIn en los sectores ---
type PieChartProps = ComponentProps<typeof PieChart>

export const AnimatedDonut = ({
  height = 220,
  label,
  children,
  ...rest
}: PieChartProps & { height?: number; label?: string }) => {
  const ref = useRef<HTMLDivElement>(null)
  // Donut solo se anima una vez (los datos del donut no cambian con frecuencia).
  const replayKey = (rest.data as { length?: number } | undefined)?.length
  useChartEntry(ref, 'donut', replayKey)

  return (
    <div ref={ref} role={label ? 'img' : undefined} aria-label={label}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart {...rest}>{children}</PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Export del tipo para que los consumidores puedan referenciar ChartType.
export type { ChartType }
