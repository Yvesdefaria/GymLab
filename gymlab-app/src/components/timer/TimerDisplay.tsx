// Valor numérico compartido por los temporizadores (F96, D1). El formato es
// presentacional; la Fase 3 lo conectará al ajuste `timerFormat`.
import { formatTime } from '@/domain/roundTimer'

export type TimerDisplayFormat = 'clock' | 'seconds'

interface TimerDisplayProps {
  seconds: number
  format?: TimerDisplayFormat
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
  const value = showZeroLabel ? zeroLabel : format === 'seconds' ? String(seconds) : formatTime(seconds)

  return (
    <>
      <p data-testid="timer-display" className={className}>
        {value}
      </p>
      {label && <p className="text-[0.65rem] text-muted">{label}</p>}
    </>
  )
}
