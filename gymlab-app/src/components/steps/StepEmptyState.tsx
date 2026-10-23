// Estado vacío honesto de /pasos: línea punteada, título, explicación corta y
// una acción ghost opcional. No disfraza el vacío de gráfica ni de cero.
import type { ReactNode } from 'react'

type StepEmptyStateProps = {
  title: string
  text: string
  action?: ReactNode
}

export const StepEmptyState = ({ title, text, action }: StepEmptyStateProps) => (
  <div className="flex flex-col items-center py-5 text-center">
    <svg viewBox="0 0 340 44" className="mb-1.5 h-10 w-full" aria-hidden>
      <line
        x1="0"
        y1="26"
        x2="340"
        y2="26"
        stroke="var(--color-border)"
        strokeDasharray="4 5"
      />
      <circle cx="120" cy="26" r="3" fill="var(--color-gold)" opacity=".5" />
      <circle cx="230" cy="26" r="3" fill="var(--color-gold)" opacity=".28" />
    </svg>
    <p className="text-xs font-medium text-fg">{title}</p>
    <p className="mt-1 max-w-[270px] text-[10px] leading-relaxed text-muted">{text}</p>
    {action ? <div className="mt-2.5">{action}</div> : null}
  </div>
)
