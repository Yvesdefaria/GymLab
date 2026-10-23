// Sección hairline del perfil: eyebrow + meta/acción opcionales, sin tarjeta.
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ProfileSectionProps = {
  title: string
  meta?: string
  action?: { label: string; to: string }
  children: ReactNode
}

export const ProfileSection = ({ title, meta, action, children }: ProfileSectionProps) => (
  <section className="border-t border-border/40 pb-3 pt-3">
    <div className="flex items-baseline justify-between gap-2 pb-1">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
        {title}
      </h2>
      <div className="flex shrink-0 items-baseline gap-2">
        {meta ? <span className="text-[10px] text-muted">{meta}</span> : null}
        {action ? (
          <Link to={action.to} className="text-[10px] font-medium text-gold-bright">
            {action.label}
          </Link>
        ) : null}
      </div>
    </div>
    {children}
  </section>
)
