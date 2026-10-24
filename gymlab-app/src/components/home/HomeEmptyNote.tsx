// Nota única del estado sin datos: reemplaza los empty states de cada widget.
import { useTranslation } from 'react-i18next'

export const HomeEmptyNote = () => {
  const { t } = useTranslation()

  return (
    <div className="mt-5 border-t border-border/40 pt-4">
      <p className="text-xs font-semibold text-fg">{t('home.sinProgresoTitulo')}</p>
      <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
        {t('home.sinProgresoDetalle')}
      </p>
    </div>
  )
}
