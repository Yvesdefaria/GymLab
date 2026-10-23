// Wrappers de gráficos Recharts con animación de entrada (drawOn/fadeIn/staggerFade) al montar.
// Pasan todas las props al componente subyacente y añaden un div ref que useChartEntry observa.
import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'
import { ResponsiveContainer, AreaChart, BarChart, PieChart, YAxis } from 'recharts'
import { useChartEntry, type ChartType } from '@/hooks/useChartEntry'
import { useChartHeight } from './ChartSizing'

// En Stats C1 el eje Y se oculta y su ancho reservado (36 px) se colapsa a 0
// para que las barras/áreas usen todo el ancho. Fuera de Stats no se toca.
const collapseYAxis = (
  children: ReactNode,
  keepYAxis: boolean,
  compact: boolean,
): ReactNode => {
  if (!compact || keepYAxis) return children
  return Children.map(children, (child) => {
    if (isValidElement(child) && child.type === YAxis) {
      return cloneElement(
        child as ReactElement<{
          width?: number
          tick?: boolean
          axisLine?: boolean
          tickLine?: boolean
        }>,
        { width: 0, tick: false, axisLine: false, tickLine: false },
      )
    }
    return child
  })
}

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
  const areaHeight = useChartHeight('area')
  const size = areaHeight ?? height

  return (
    <div ref={ref} role={label ? 'img' : undefined} aria-label={label}>
      <ResponsiveContainer width="100%" height={size}>
        <AreaChart {...rest}>
          {collapseYAxis(children, false, areaHeight != null)}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

//--- AnimatedBarChart: BarChart con staggerFade en las barras ---
type BarChartProps = ComponentProps<typeof BarChart>

export const AnimatedBarChart = ({
  height = 240,
  label,
  keepYAxis = false,
  children,
  ...rest
}: BarChartProps & { height?: number; label?: string; keepYAxis?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null)
  const replayKey = rest.data?.length
  useChartEntry(ref, 'bar', replayKey)
  const barHeight = useChartHeight('bar')
  const size = barHeight ?? height

  return (
    <div ref={ref} role={label ? 'img' : undefined} aria-label={label}>
      <ResponsiveContainer width="100%" height={size}>
        <BarChart {...rest}>
          {collapseYAxis(children, keepYAxis, barHeight != null)}
        </BarChart>
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
  const size = useChartHeight('donut') ?? height

  return (
    <div ref={ref} role={label ? 'img' : undefined} aria-label={label}>
      <ResponsiveContainer width="100%" height={size}>
        <PieChart {...rest}>{children}</PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Export del tipo para que los consumidores puedan referenciar ChartType.
export type { ChartType }
