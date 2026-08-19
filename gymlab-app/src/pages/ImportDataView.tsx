// Importar datos: selector de app origen, resumen antes de importar, deduplicación.
import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, Check, AlertTriangle } from 'lucide-react'
import { parseImport, type ParsedImport } from '@/domain/importParsers'

type ImportSource = 'strong' | 'hevy' | 'jefit'

interface ImportDataViewProps {
  onImport: (data: ParsedImport) => void
}

const sources: { id: ImportSource; label: string }[] = [
  { id: 'strong', label: 'Strong' },
  { id: 'hevy', label: 'Hevy' },
  { id: 'jefit', label: 'JEFIT' },
]

export const ImportDataView = ({ onImport }: ImportDataViewProps) => {
  const { t } = useTranslation()
  const [source, setSource] = useState<ImportSource>('strong')
  const [parsed, setParsed] = useState<ParsedImport | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const result = parseImport(text, source)
      setParsed(result)
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (parsed) {
      onImport(parsed)
      setParsed(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-20 pt-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Upload className="size-5 text-accent" aria-hidden />
        <h1 className="text-lg font-bold text-fg">{t('import.title')}</h1>
      </div>

      {/* Selector de app */}
      <div className="rounded-xl border border-border/30 bg-bg-elevated/30 p-3">
        <p className="mb-2 text-[0.65rem] font-semibold text-fg">{t('import.selectApp')}</p>
        <div className="flex gap-2">
          {sources.map((s) => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={`flex-1 rounded-lg py-2 text-[0.6rem] font-medium transition-colors ${
                source === s.id
                  ? 'bg-accent text-accent-fg'
                  : 'bg-bg-elevated/50 text-muted'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload */}
      <div className="rounded-xl border border-border/30 bg-bg-elevated/30 p-3">
        <p className="mb-2 text-[0.65rem] font-semibold text-fg">{t('import.upload')}</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="w-full text-[0.6rem] text-muted"
        />
      </div>

      {/* Resumen */}
      {parsed && (
        <div className="rounded-xl border border-border/30 bg-bg-elevated/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="size-4 text-accent" />
            <p className="text-[0.65rem] font-semibold text-fg">{t('import.summary')}</p>
          </div>
          <div className="flex flex-col gap-1 text-[0.6rem] text-muted mb-3">
            <p>{parsed.workouts.length} {t('import.workouts')}</p>
            <p>{parsed.sets.length} {t('import.sets')}</p>
            {parsed.errors.length > 0 && (
              <div className="flex items-center gap-1 text-red-400">
                <AlertTriangle className="size-3" />
                <span>{parsed.errors.length} {t('import.errors')}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleImport}
            className="w-full rounded-lg bg-accent py-2 text-[0.65rem] font-medium text-accent-fg"
          >
            <Check className="mr-1 inline size-3" />
            {t('import.confirm')}
          </button>
        </div>
      )}
    </div>
  )
}
