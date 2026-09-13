// Chapa-medalla estilo BO2: medallón circular con anillo metálico estriado
// (metal según el tier del logro), centro oscuro con el icono embutido y
// contador ×N de veces conseguido. Sin imágenes: todo CSS/SVG + lucide.
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BookOpen,
  Calendar,
  CalendarCheck,
  Crown,
  Flame,
  Footprints,
  Heart,
  Medal,
  Repeat,
  Shuffle,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { ACHIEVEMENT_TIERS, type AchievementTier } from '@/domain/achievements'
import type { Achievement } from '@/domain/achievements'
import { useTranslation } from 'react-i18next'

// Mapa iconos de logro (mismo vocabulario que AchievementsPage/AchievementModal).
const ICON_MAP: Record<string, LucideIcon> = {
  Footprints,
  Trophy,
  Flame,
  Crown,
  Target,
  BarChart3,
  CalendarCheck,
  Repeat,
  Heart,
  Shuffle,
  TrendingUp,
  BookOpen,
  Medal,
  Calendar,
}

// Metales por tier (gradiente cónico tipo moneda + tono del icono embutido).
const METALS: Record<AchievementTier, { ring: string; coin: string; icon: string }> = {
  bronze: {
    ring: 'conic-gradient(from 0deg, #8a5a2b, #e8b06b 25%, #f6d8a8 50%, #e8b06b 75%, #8a5a2b)',
    coin: 'radial-gradient(circle at 35% 30%, #f6d8a8, #cd7f32 55%, #7a4a20)',
    icon: '#f2c98a',
  },
  silver: {
    ring: 'conic-gradient(from 0deg, #6b7280, #d1d5db 25%, #f3f4f6 50%, #d1d5db 75%, #6b7280)',
    coin: 'radial-gradient(circle at 35% 30%, #f3f4f6, #9ca3af 55%, #4b5563)',
    icon: '#e5e7eb',
  },
  gold: {
    ring: 'conic-gradient(from 0deg, #7a4f10, #e0a93e 25%, #ffd98a 50%, #e0a93e 75%, #7a4f10)',
    coin: 'radial-gradient(circle at 35% 30%, #ffd98a, #d9a441 55%, #8a5f16)',
    icon: '#ffe0a0',
  },
  platinum: {
    ring: 'conic-gradient(from 0deg, #3f4c5f, #b6c2d1 25%, #e8eef6 50%, #b6c2d1 75%, #3f4c5f)',
    coin: 'radial-gradient(circle at 35% 30%, #eef3fa, #aebccd 55%, #4d5c70)',
    icon: '#dbe6f2',
  },
}

const TIER_LABEL: Record<AchievementTier, string> = {
  bronze: 'bronce',
  silver: 'plata',
  gold: 'oro',
  platinum: 'platino',
}

// Variantes cosméticas de chapa (F95.1): re-tinte CSS-first del metal según
// la variante concedida por re-logro. Sin assets nuevos, sin emoji.
const VARIANT_TONES: Record<string, { ring: string; coin: string; icon: string }> = {
  polished: {
    ring: 'conic-gradient(from 0deg, #9aa0a6, #e8eaed 25%, #ffffff 50%, #e8eaed 75%, #9aa0a6)',
    coin: 'radial-gradient(circle at 35% 30%, #ffffff, #c3c8ce 55%, #6b7075)',
    icon: '#f5f7f8',
  },
  radiant: {
    ring: 'conic-gradient(from 0deg, #8a5a10, #ffc94d 25%, #ffe9ad 50%, #ffc94d 75%, #8a5a10)',
    coin: 'radial-gradient(circle at 35% 30%, #fff3c4, #ffb800 55%, #8a5a10)',
    icon: '#ffe9b0',
  },
  onyx: {
    ring: 'conic-gradient(from 0deg, #1c1c1f, #3d3d44 25%, #56565e 50%, #3d3d44 75%, #1c1c1f)',
    coin: 'radial-gradient(circle at 35% 30%, #4a4a52, #222226 55%, #0d0d0f)',
    icon: '#8f8f98',
  },
}

interface AchievementMedalProps {
  achievement: Achievement
  unlocked: boolean
  count: number
  size?: 'sm' | 'md'
  /** Variante de chapa concedida por re-logro; re-tinte del metal si existe. */
  variant?: string
}

export const AchievementMedal = ({ achievement, unlocked, count, size = 'md', variant }: AchievementMedalProps) => {
  const { t } = useTranslation()
  const Icon = ICON_MAP[achievement.icon] ?? Trophy
  const tier = ACHIEVEMENT_TIERS[achievement.id] ?? 'bronze'
  const metal = variant ? (VARIANT_TONES[variant] ?? METALS[tier]) : METALS[tier]
  const dims = size === 'sm' ? 'size-12' : 'size-16'
  const innerDims = size === 'sm' ? 'size-8' : 'size-11'
  const iconSize = size === 'sm' ? 'size-4' : 'size-6'

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        role="img"
        data-achievement={achievement.id}
        {...(variant ? { 'data-variant': variant } : {})}
        aria-label={`${t(achievement.titleKey as any)}, ${TIER_LABEL[tier]}, ${
          unlocked ? t('achievements.metal.chapaDesbloqueada') : t('achievements.metal.chapaBloqueada')
        }${variant ? `, ${t(`achievements.collectibles.${variant}` as any)}` : ''}`}
        className={`grid place-items-center rounded-full ${dims} ${
          unlocked ? '' : 'opacity-45 grayscale'
        }`}
        style={{ background: metal.ring, padding: size === 'sm' ? 3 : 4 }}
      >
        <span
          className={`grid place-items-center rounded-full ${innerDims}`}
          style={{ background: '#121214', boxShadow: 'inset 0 2px 6px rgba(0,0,0,.85), inset 0 -1px 2px rgba(255,255,255,.12)' }}
        >
          <Icon className={iconSize} style={{ color: metal.icon }} aria-hidden />
        </span>
      </span>
      {count > 0 && (
        <span
          aria-label={t('achievements.metal.vecesConseguido', { count })}
          className="rounded-full bg-bg-elevated px-1.5 py-0.5 text-[10px] font-bold text-fg"
        >
          ×{count}
        </span>
      )}
    </div>
  )
}