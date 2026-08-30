// Tarjeta de usuario del perfil: avatar editable (la cámara abre el picker) y nombre inline
// (edición con Enter/Escape/blur). Autocontenida con useAvatar + useProfileName.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Pencil, User } from 'lucide-react'
import { useAvatar } from '@/hooks/useAvatar'
import { useProfileName } from '@/hooks/useProfileName'
import { AvatarPicker } from '@/components/profile/AvatarPicker'
import { isSafeAvatarUri } from '@/lib/avatar'

export const ProfileUserCard = ({ workoutsCount }: { workoutsCount: number }) => {
  const { t } = useTranslation()
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

  return (
    <>
      <div className="flex items-center gap-3 panel rounded-2xl p-4">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label={t('perfil.cambiarAvatar')}
          className="group relative shrink-0"
        >
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-bg text-accent">
            {isSafeAvatarUri(avatarUri) ? (
              <img src={avatarUri} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-7" />
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitName()
                  if (e.key === 'Escape') setEditingName(false)
                }}
                onChange={(e) => setNameDraft(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-cta bg-bg px-2 py-1 font-display text-lg font-semibold text-fg outline-none"
              />
            ) : (
              <p className="truncate font-display text-lg font-semibold text-fg">
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
          <p className="text-xs text-muted">{t('perfil.entrenosRegistrados', { count: workoutsCount })}</p>
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