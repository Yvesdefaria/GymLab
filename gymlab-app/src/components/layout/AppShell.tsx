import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { Loader } from '@/components/ui/Loader'

export const AppShell = () => {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg md:max-w-3xl lg:max-w-5xl">
      <a
        href="#contenido"
        className="sr-only z-[100] rounded-lg bg-cta px-4 py-2 text-sm font-semibold text-on-gold focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
      >
        Saltar al contenido
      </a>
      <main id="contenido" className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
      <TabBar />
      <Onboarding />
    </div>
  )
}
