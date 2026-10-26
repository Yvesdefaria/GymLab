// Disclaimer común de las calculadoras: informativo, no consejo médico.
import type { ReactNode } from 'react'

export const CalculatorDisclaimer = ({ children }: { children: ReactNode }) => (
  <p className="pt-2 text-[9.5px] leading-relaxed text-muted">{children}</p>
)
