// Sección «Chapas» del perfil (F93 #16): fila horizontal de miniaturas de las
// chapas-medalla desbloqueadas (con su contador ×N) y enlace a la galería /logros.
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { ACHIEVEMENTS } from '@/domain/achievements'
import { AchievementMedal } from '@/components/achievements/AchievementMedal'

interface ChapasSectionProps {
  unlockedIds: string[]
  counts: Record<string, number>
}

export const ChapasSection = ({ unlockedIds, counts }: ChapasSectionProps) => {
  const { t } = useTranslation()
  const unlocked = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id))

  if (unlocked.length === 0) return null

  return (
    <section className="panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="kicker">{t('perfil.chapas')}</p>
          <p className="text-xs text-muted">{t('perfil.chapasSubtitulo')}</p>
        </div>
        <Link
          to="/logros"
          className="flex shrink-0 items-center gap-1 rounded-xl text-sm font-medium text-accent transition-colors hover:text-accent-soft"
        >
          {t('perfil.chapasVerTodas')}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {unlocked.map((a) => (
          <AchievementMedal
            key={a.id}
            achievement={a}
            unlocked
            count={counts[a.id] ?? 0}
            size="sm"
          />
        ))}
      </div>
    </section>
  )
}