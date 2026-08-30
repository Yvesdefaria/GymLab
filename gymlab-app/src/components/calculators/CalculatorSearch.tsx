// Buscador del hub de calculadoras: input con icono de búsqueda y botón de limpiar.
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const CalculatorSearch = ({
  query,
  onChange,
}: {
  query: string
  onChange: (value: string) => void
}) => {
  const { t } = useTranslation()
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('calculadoras.hub.buscarPlaceholder')}
        aria-label={t('calculadoras.hub.buscarAria')}
        className="h-11 w-full rounded-xl border border-border bg-bg-elevated pl-9 pr-9 text-sm text-fg placeholder:text-muted focus:border-cta focus:outline-none"
      />
      {query && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('calculadoras.hub.limpiarAria')}
          className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-fg"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
}