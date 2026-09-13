// Valor numérico compartido por los temporizadores (F96, D1). Un solo
// formateador (`lib/duration.ts`) sirve a descanso, ronda y calentamiento;
// el modo sale del ajuste `timerFormat`.
import { formatDuration, type TimeFormat } from '@/lib/duration'

interface TimerDisplayProps {
  seconds: number
  format?: TimeFormat
  className?: string
  // Etiqueta opcional bajo el valor (fase, índice de ejercicio, etc.).
  label?: string
  // Texto a mostrar cuando el valor llega a cero; si no se pasa, muestra 00:00/0.
  zeroLabel?: string
}

export const TimerDisplay = ({
  seconds,
  format = 'clock',
  className = '',
  label,
  zeroLabel,
}: TimerDisplayProps) => {
  const showZeroLabel = zeroLabel !== undefined && seconds <= 0
  const value = showZeroLabel ? zeroLabel : formatDuration(seconds, format)

  return (
    <>
      <p data-testid="timer-display" className={className}>
        {value}
      </p>
      {label && <p className="text-[0.65rem] text-muted">{label}</p>}
    </>
  )
}
