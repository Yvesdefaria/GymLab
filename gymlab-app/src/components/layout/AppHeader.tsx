import { useSeo } from '@/hooks/useSeo'

type AppHeaderProps = {
  title: string
  subtitle?: string
}

export const AppHeader = ({ title, subtitle }: AppHeaderProps) => {
  useSeo(title)

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
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
