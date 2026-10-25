// Datos (Nocturno Minimal): backup e importación como filas que despliegan su
// panel debajo, sin caja propia. Los mensajes viven pegados a la acción.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Download, Upload, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import {
  exportBackup,
  downloadBackup,
  parseBackup,
  importBackup,
  type BackupFile,
} from '@/data/backup'
import { importParsedWorkouts } from '@/data/importWorkouts'
import { prepareCsvImport } from '@/data/importCsv'
import { useSeedingStatus } from '@/app/seeding'
import { SectionLabel, settingsGroupClass, settingsRowClass } from './SettingsUI'
import { track } from '@/lib/telemetry'

const disclosureRowClass = `${settingsRowClass} w-full text-left`

export const DataSection = () => {
  const { t } = useTranslation()
  const { prepare } = useSeedingStatus()
  const [showBackup, setShowBackup] = useState(false)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const [backupBusy, setBackupBusy] = useState(false)
  const [pendingImport, setPendingImport] = useState<BackupFile | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [importParsed, setImportParsed] = useState<import('@/domain/importParsers').ParsedImport | null>(null)
  const [importBusy, setImportBusy] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  const handleExport = async () => {
    setBackupBusy(true)
    try {
      const backup = await exportBackup()
      await downloadBackup(backup)
      track('data_exported', {})
      setBackupMessage(t('ajustes.backupExported'))
    } catch {
      setBackupMessage(t('ajustes.backupExportError'))
    } finally {
      setBackupBusy(false)
    }
  }

  const handleImportFile = (file: File) => {
    setBackupBusy(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const parsed = parseBackup(String(reader.result ?? ''))
        if (!parsed) {
          setBackupMessage(t('ajustes.backupInvalid'))
          return
        }
        setPendingImport(parsed)
      } catch {
        setBackupMessage(t('ajustes.backupReadError'))
      } finally {
        setBackupBusy(false)
      }
    }
    reader.onerror = () => {
      setBackupMessage(t('ajustes.backupReadError'))
      setBackupBusy(false)
    }
    reader.readAsText(file)
  }

  const applyImport = async () => {
    if (!pendingImport) return
    setBackupBusy(true)
    try {
      const count = await importBackup(pendingImport)
      track('data_imported', { kind: 'backup' })
      setPendingImport(null)
      setBackupMessage(t('ajustes.backupRestored', { count }))
      window.setTimeout(() => window.location.reload(), 1200)
    } catch {
      setPendingImport(null)
      setBackupMessage(t('ajustes.backupRestoreError'))
    } finally {
      setBackupBusy(false)
    }
  }

  const handleImportCSV = async (file: File) => {
    // Limpia el mensaje previo: un error viejo no debe quedar visible si el
    // parseo siguiente sale bien (81.R3-001).
    setImportMessage(null)
    try {
      // Espera al seed y resuelve el CSV contra el catálogo completo antes de
      // mostrar el resumen (R3-001); un fallo de lectura o del repo avisa.
      const parsed = await prepareCsvImport(file, prepare)
      setImportParsed(parsed)
    } catch {
      setImportMessage(t('import.readError'))
    }
  }

  const applyImportCSV = async () => {
    if (!importParsed) return
    setImportBusy(true)
    try {
      const { imported, duplicates } = await importParsedWorkouts(importParsed)
      track('data_imported', { kind: 'csv' })
      let message = t('import.doneImported', { count: imported })
      if (duplicates > 0) message += ` · ${t('import.doneDuplicates', { count: duplicates })}`
      if (importParsed.unmatched.length > 0) {
        message += ` · ${t('import.doneUnmatched', { count: importParsed.unmatched.length })}`
      }
      setImportMessage(message)
      setImportParsed(null)
    } catch {
      setImportMessage(t('ajustes.backupRestoreError'))
    } finally {
      setImportBusy(false)
    }
  }

  return (
    <section className={settingsGroupClass}>
      <SectionLabel>{t('ajustes.datos')}</SectionLabel>

      <button
        onClick={() => setShowBackup((v) => !v)}
        aria-expanded={showBackup}
        className={disclosureRowClass}
      >
        <span>{t('ajustes.backup')}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none ${
            showBackup ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {showBackup && (
        <div className="space-y-2 border-t border-border/30 pb-2 pt-2">
          <p className="text-xs leading-relaxed text-muted">{t('ajustes.backupDesc')}</p>
          <Button size="sm" className="w-full" variant="accent" onClick={() => void handleExport()} disabled={backupBusy}>
            <Download className="size-4" aria-hidden />
            {t('ajustes.exportarBackup')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full border-border/60 bg-transparent"
            onClick={() => {
              const input = document.getElementById('backup-file-input') as HTMLInputElement | null
              input?.click()
            }}
          >
            <Upload className="size-4" aria-hidden />
            {t('ajustes.restaurarArchivo')}
          </Button>
          <input
            id="backup-file-input"
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImportFile(f)
              e.target.value = ''
            }}
          />
          {backupMessage && <p className="text-xs text-accent-soft">{backupMessage}</p>}
        </div>
      )}

      <button
        onClick={() => setShowImport((v) => !v)}
        aria-expanded={showImport}
        className={`${disclosureRowClass} border-t border-border/30`}
      >
        <span>{t('ajustes.importData')}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none ${
            showImport ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {showImport && (
        <div className="space-y-2 border-t border-border/30 pb-2 pt-2">
          <p className="text-xs leading-relaxed text-muted">{t('import.selectApp')}</p>
          <Button
            size="sm"
            variant="outline"
            className="w-full border-border/60 bg-transparent"
            onClick={() => {
              const input = document.getElementById('import-csv-input') as HTMLInputElement | null
              input?.click()
            }}
          >
            <Upload className="size-4" aria-hidden />
            {t('import.upload')}
          </Button>
          <input
            id="import-csv-input"
            type="file"
            accept=".csv"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleImportCSV(f)
              e.target.value = ''
            }}
          />
          {importParsed && (
            <div className="space-y-2 border-t border-border/30 pt-2">
              <p className="text-xs font-semibold text-fg">{t('import.summary')}</p>
              <p className="text-xs text-muted">
                {importParsed.workouts.length} {t('import.workouts')} · {importParsed.sets.length} {t('import.sets')}
              </p>
              {importParsed.errors.length > 0 && (
                <p className="text-xs text-danger">
                  {importParsed.errors.length} {t('import.errors')}
                </p>
              )}
              <Button size="sm" className="w-full" variant="accent" onClick={() => void applyImportCSV()} disabled={importBusy}>
                <Check className="size-4" aria-hidden />
                {t('import.confirm')}
              </Button>
            </div>
          )}
          {importMessage && <p className="text-xs text-accent-soft">{importMessage}</p>}
        </div>
      )}

      {pendingImport && (
        <ConfirmSheet
          title={t('ajustes.restaurarBackupTitulo')}
          message={t('ajustes.restaurarBackupMsg')}
          confirmLabel={t('ajustes.restaurar')}
          cancelLabel={t('ajustes.cancelar')}
          busy={backupBusy}
          onConfirm={() => void applyImport()}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </section>
  )
}
