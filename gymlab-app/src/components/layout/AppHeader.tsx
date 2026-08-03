type AppHeaderProps = {
  title: string
  subtitle?: string
}

export const AppHeader = ({ title, subtitle }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        GymLab
      </p>
      <h1 className="font-display text-2xl font-bold tracking-wide text-fg">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
      ) : null}
    </header>
  )
}
