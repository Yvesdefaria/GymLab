// F101: tour guiado y tips de primera vez — claves de meta y helpers puros.
export const TOUR_DONE_META_KEY = 'tourDone'
export const TOUR_PENDING_META_KEY = 'tourPending'
export const SECTION_TIPS_SEEN_META_KEY = 'sectionTipsSeen'

export const SECTION_IDS = ['inicio', 'rutinas', 'estadisticas', 'logros', 'mas', 'perfil'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export type SectionTipsSeen = Partial<Record<SectionId, true>>

// Secciones que el tour ya explica: al completarlo no repetimos sus tips.
export const TOUR_COVERED_SECTIONS: SectionId[] = ['inicio', 'rutinas', 'estadisticas', 'logros', 'mas']

// El tour automático corre una sola vez, después del setup (las tres condiciones juntas).
export const shouldAutoStartTour = ({
  onboardingDone,
  tourPending,
  tourDone,
}: {
  onboardingDone: boolean
  tourPending: boolean
  tourDone: boolean
}): boolean => onboardingDone && tourPending && !tourDone

// Ruta → sección de tips (por prefijo; `/` exacto es Inicio).
export const sectionForPath = (pathname: string): SectionId | null => {
  if (pathname === '/') return 'inicio'
  if (pathname.startsWith('/rutinas')) return 'rutinas'
  if (pathname.startsWith('/estadisticas')) return 'estadisticas'
  if (pathname.startsWith('/logros')) return 'logros'
  if (pathname.startsWith('/mas')) return 'mas'
  if (pathname.startsWith('/perfil')) return 'perfil'
  return null
}

export const markSectionsSeen = (seen: SectionTipsSeen, ids: SectionId[]): SectionTipsSeen => {
  const next: SectionTipsSeen = { ...seen }
  for (const id of ids) next[id] = true
  return next
}
