// Fila de chapas del perfil: medallones desbloqueados con contador ×N.
// La sección y el enlace «Ver todas» los pone el contenedor.
import { ACHIEVEMENTS } from '@/domain/achievements'
import { AchievementMedal } from '@/components/achievements/AchievementMedal'
import { useDragToScroll } from '@/hooks/useDragToScroll'

type ProfileChapasRowProps = {
  unlockedIds: string[]
  counts: Record<string, number>
  variants?: Record<string, string>
}

export const ProfileChapasRow = ({ unlockedIds, counts, variants }: ProfileChapasRowProps) => {
  const { ref, onPointerDown, onClickCapture } = useDragToScroll()
  const unlocked = ACHIEVEMENTS.filter((achievement) => unlockedIds.includes(achievement.id))
  if (unlocked.length === 0) return null

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onClickCapture={onClickCapture}
      className="flex gap-3 overflow-x-auto pb-1"
    >
      {unlocked.map((achievement) => (
        <AchievementMedal
          key={achievement.id}
          achievement={achievement}
          unlocked
          count={counts[achievement.id] ?? 0}
          size="sm"
          variant={variants?.[achievement.id]}
        />
      ))}
    </div>
  )
}
