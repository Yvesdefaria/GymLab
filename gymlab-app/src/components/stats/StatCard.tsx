import type { LucideIcon } from 'lucide-react'

type Props = {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'success' | 'accent' | 'cta'
}

const toneClass: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-muted',
  success: 'text-success',
  accent: 'text-accent',
  cta: 'text-cta',
}

export const StatCard = ({ icon: Icon, label, value, hint, tone = 'default' }: Props) => {
  return (
    <div className="panel rounded-2xl p-4">
      <Icon className={`mb-2 size-5 ${toneClass[tone]}`} aria-hidden />
      <p className="kicker">{label}</p>
      <p className="stat-value text-2xl">{value}</p>
      {hint && <p className="mt-1 text-[0.7rem] text-muted">{hint}</p>}
    </div>
  )
}
