import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Wrench, ChevronRight, Download, Upload, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import {
  exportBackup,
  downloadBackup,
  parseBackup,
  importBackup,
  type BackupFile,
} from '@/data/backup'
import { autoDetectAndParse } from '@/domain/importParsers'
import { workoutRepo, workoutSetRepo } from '@/data/repositories'
import { SectionLabel } from './SettingsUI'
import { track } from '@/lib/telemetry'

export const DataSection = () => {
  const { t } = useTranslation()
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
      downloadBackup(backup)
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

  const handleImportCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = autoDetectAndParse(String(reader.result ?? ''))
      setImportParsed(result)
    }
    reader.readAsText(file)
  }

  const applyImportCSV = async () => {
    if (!importParsed) return
    setImportBusy(true)
    try {
      for (const workout of importParsed.workouts) {
        await workoutRepo.create(workout)
      }
      for (const set of importParsed.sets) {
        await workoutSetRepo.create(set)
      }
      track('data_imported', { kind: 'csv' })
      setImportMessage(t('import.done'))
      setImportParsed(null)
    } catch {
      setImportMessage(t('ajustes.backupRestoreError'))
    } finally {
      setImportBusy(false)
    }
  }

  return (
    <section className="panel-light rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <Wrench className="size-4 text-accent" aria-hidden />
        <SectionLabel>{t('ajustes.datos')}</SectionLabel>
      </div>
      <button
        onClick={() => setShowBackup((v) => !v)}
        className="mt-2 flex min-h-[48px] w-full items-center justify-between rounded-xl border border-border bg-bg px-3 text-sm text-fg"
      >
        <span>{t('ajustes.backup')}</span>
        <ChevronRight className="size-4 text-muted" />
      </button>
      <button
        onClick={() => setShowImport((v) => !v)}
        className="mt-2 flex min-h-[48px] w-full items-center justify-between rounded-xl border border-border bg-bg px-3 text-sm text-fg"
      >
        <span>{t('ajustes.importData')}</span>
        <ChevronRight className="size-4 text-muted" />
      </button>
      {showImport && (
        <div className="mt-2 space-y-3 rounded-xl pt-3 border-t border-border/30">
          <p className="text-xs text-muted">{t('import.selectApp')}</p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
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
              if (f) handleImportCSV(f)
              e.target.value = ''
            }}
          />
          {importParsed && (
            <div className="space-y-2 rounded-xl border border-border/30 bg-bg-elevated/30 p-3">
              <p className="text-xs font-semibold text-fg">{t('import.summary')}</p>
              <p className="text-xs text-muted">
                {importParsed.workouts.length} {t('import.workouts')} · {importParsed.sets.length} {t('import.sets')}
              </p>
              {importParsed.errors.length > 0 && (
                <p className="text-xs text-red-400">
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
      {showBackup && (
        <div className="mt-2 space-y-2 rounded-xl pt-3 border-t border-border/30">
          <p className="text-xs text-muted">{t('ajustes.backupDesc')}</p>
          <Button size="sm" className="w-full" variant="accent" onClick={() => void handleExport()} disabled={backupBusy}>
            <Download className="size-4" aria-hidden />
            {t('ajustes.exportarBackup')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
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
