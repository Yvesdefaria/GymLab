// Botones del sistema GymLab: una sola fuente de verdad para CTAs y acciones
// secundarias. Variantes (primary/outline/ghost) + tamaños con touch ≥ 44px.
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

export type ButtonVariant = 'primary' | 'outline' | 'accent' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

// Variantes: primary = CTA dorado (único foco), outline = secundario sobre
// borde, accent = secundario destacado con tinte del color principal, ghost = terciario silenciado,
// danger = acción destructiva con fondo rojo.
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'gold-gradient font-display font-semibold text-on-gold shadow-lg shadow-cta/20 transition-transform active:scale-[0.98]',
  outline:
    'border border-border bg-bg text-fg transition-colors hover:border-cta hover:text-accent-soft',
  accent:
    'border border-cta bg-cta/15 text-accent-soft transition-colors hover:bg-cta/25',
  ghost: 'text-muted transition-colors hover:text-accent-soft',
  danger:
    'bg-danger font-display font-semibold text-white shadow-lg shadow-danger/20 transition-transform active:scale-[0.98]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] gap-1.5 rounded-xl px-3.5 text-sm',
  md: 'min-h-[52px] gap-2 rounded-2xl px-5 text-base',
  lg: 'min-h-[56px] gap-2 rounded-2xl px-6 text-lg',
}

const baseClasses =
  'inline-flex select-none items-center justify-center font-medium transition-all disabled:pointer-events-none disabled:opacity-50'

const buttonClasses = (variant: ButtonVariant, size: ButtonSize) =>
  [baseClasses, variantClasses[variant], sizeClasses[size]].join(' ')

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) => (
  <button type={type} className={`${buttonClasses(variant, size)} ${className}`} {...rest} />
)

export const ButtonLink = ({
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: ButtonLinkProps) => (
  <Link className={`${buttonClasses(variant, size)} ${className}`} {...rest} />
)
