// Panel/tarjeta base de la UI: wrapper del patrón `panel-light rounded-2xl p-4` usado en toda la app.
import type { ReactNode } from 'react'

type PanelProps = {
  as?: 'div' | 'section'
  className?: string
  children: ReactNode
}

export const Panel = ({ as: Tag = 'div', className = '', children }: PanelProps) => (
  <Tag className={`panel-light rounded-2xl p-4${className ? ` ${className}` : ''}`}>
    {children}
  </Tag>
)