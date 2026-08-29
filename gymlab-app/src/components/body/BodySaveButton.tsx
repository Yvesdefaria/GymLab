// Botón de guardado de los registros corporales (medidas/grasa): estilo gold compartido.
import { Plus, Save } from 'lucide-react'

interface BodySaveButtonProps {
  today: boolean
  labelGuardar: string
  labelActualizar: string
  icon?: 'plus' | 'save'
  onSave: () => void
}

export const BodySaveButton = ({
  today,
  labelGuardar,
  labelActualizar,
  icon = 'save',
  onSave,
}: BodySaveButtonProps) => {
  const Icon = icon === 'plus' ? Plus : Save
  return (
    <button
      onClick={onSave}
      className="gold-gradient mt-4 flex h-11 w-full items-center justify-center gap-1 rounded-xl font-medium text-on-gold transition-opacity hover:opacity-90"
    >
      <Icon className="size-4" aria-hidden />
      {today ? labelActualizar : labelGuardar}
    </button>
  )
}