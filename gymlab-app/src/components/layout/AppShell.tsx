import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'

export const AppShell = () => {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg md:max-w-3xl lg:max-w-5xl">
      <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
