// Identidad del perfil: avatar editable, nombre inline y resumen de actividad.
// La fila es hairline (sin tarjeta) y el avatar abre el picker como antes.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Pencil, User } from 'lucide-react'
import { useAvatar } from '@/hooks/useAvatar'
import { useProfileName } from '@/hooks/useProfileName'
import { AvatarPicker } from '@/components/profile/AvatarPicker'
import { parseLocalDate } from '@/domain/dates'
import { formatDate } from '@/lib/intl'
import { isSafeAvatarUri } from '@/lib/avatar'
import type { AppLanguage } from '@/domain/onboarding'

type ProfileUserCardProps = {
  workoutsCount: number
  /** Fecha local del primer entreno; null si todavía no hay sesiones. */
  sinceDate: string | null
}

export const ProfileUserCard = ({ workoutsCount, sinceDate }: ProfileUserCardProps) => {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as AppLanguage
  const { avatarUri, setAvatar } = useAvatar()
  const { name, setName } = useProfileName()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  // Guarda el alias (recortado) al confirmar y sale del modo edición.
  const commitName = () => {
    const value = nameDraft.trim()
    setEditingName(false)
    if (value !== name) void setName(value)
  }

  const sinceLabel = sinceDate
    ? formatDate(parseLocalDate(sinceDate), lang, { month: 'short', year: 'numeric' })
    : null
  const summary = sinceLabel
    ? `${t('perfil.entrenosRegistrados', { count: workoutsCount })} · ${t('perfil.desde', { fecha: sinceLabel })}`
    : t('perfil.entrenosRegistrados', { count: workoutsCount })

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border/40 py-4">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label={t('perfil.cambiarAvatar')}
          className="group relative shrink-0"
        >
          <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-bg text-accent">
            {isSafeAvatarUri(avatarUri) ? (
              <img src={avatarUri} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-8" />
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border border-border bg-bg-elevated text-muted transition-colors group-hover:border-cta group-hover:text-accent-soft">
            <Camera className="size-3.5" aria-hidden />
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {editingName ? (
              <input
                autoFocus
                type="text"
                value={nameDraft}
                maxLength={24}
                placeholder={t('perfil.tuNombre')}
                aria-label={t('perfil.tuNombre')}
                onBlur={commitName}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitName()
                  if (event.key === 'Escape') setEditingName(false)
                }}
                onChange={(event) => setNameDraft(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-cta bg-bg px-2 py-1 font-display text-[22px] text-fg outline-none"
              />
            ) : (
              <p className="truncate font-display text-[22px] leading-none text-fg">
                {name || t('perfil.atleta')}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setNameDraft(name)
                setEditingName(true)
              }}
              aria-label={t('perfil.editarNombre')}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:text-accent-soft"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          </div>
          <p className="mt-1 truncate text-[11px] text-muted">{summary}</p>
        </div>
      </div>

      {pickerOpen ? (
        <AvatarPicker
          currentUri={avatarUri}
          onSelect={(uri) => void setAvatar(uri)}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </>
  )
}
