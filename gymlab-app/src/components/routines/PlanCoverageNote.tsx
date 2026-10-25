// Aviso de cobertura del plan: grupos sin ejercicios disponibles y días que cayeron.
// Reutilizable entre el planificador y el resumen del onboarding; sin datos no pinta nada.
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PlanCoverageNoteProps {
  omittedGroups: string[]
  droppedDays: number[]
}

export const PlanCoverageNote = ({ omittedGroups, droppedDays }: PlanCoverageNoteProps) => {
  const { t } = useTranslation()
  if (omittedGroups.length === 0 && droppedDays.length === 0) return null
  return (
    <div role="status" className="flex items-start gap-2 border-t border-border/40 pt-3 text-[11px] text-warning">
      <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />
      <span>
        {omittedGroups.length > 0 ? t('planner.coverageOmitted', { groups: omittedGroups.join(', ') }) : null}
        {omittedGroups.length > 0 && droppedDays.length > 0 ? ' · ' : null}
        {droppedDays.length > 0 ? t('planner.coverageDropped', { days: droppedDays.join(', ') }) : null}
      </span>
    </div>
  )
}
