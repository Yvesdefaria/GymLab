import { useEffect } from 'react'

type AppHeaderProps = {
  title: string
  subtitle?: string
}

export const AppHeader = ({ title, subtitle }: AppHeaderProps) => {
  useEffect(() => {
    document.title = title ? `${title} · GymLab` : 'GymLab'
  }, [title])

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
      <div className="mb-2 flex items-center gap-3">
        <img
          src="/logo.svg"
          alt="GymLab"
          className="size-12 rounded-xl ring-1 ring-accent/40"
        />
        <span className="font-display text-base font-semibold uppercase tracking-[0.2em] gold-text">
          GymLab
        </span>
      </div>
      <div className="flex min-h-[3.5rem] items-center">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold tracking-wide text-fg">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  )
}
