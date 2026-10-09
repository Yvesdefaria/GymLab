// Orquestación del import CSV (F81): espera el seed antes de leer el catálogo
// (sin él los nombres caen a placeholder y el reimport no deduplica), lee el
// archivo y resuelve los ejercicios contra el catálogo. La UI no toca los repos.
import { exerciseRepo } from '@/data/repositories'
import { autoDetectAndParse, type ParsedImport } from '@/domain/importParsers'
import { buildExerciseMatcher } from '@/domain/exerciseMatch'
import type { Exercise } from '@/domain/types'

// Dependencias inyectables: en producción lee el repo Dexie; los tests lo sustituyen.
export interface ImportCsvDeps {
  getAllExercises: () => Promise<Exercise[]>
}

const defaultDeps: ImportCsvDeps = {
  getAllExercises: () => exerciseRepo.getAll(),
}

// Orden obligatorio: seed listo → texto del archivo → catálogo → parseo con matcher.
export const prepareCsvImport = async (
  file: { text(): Promise<string> },
  prepareSeed: () => Promise<void>,
  deps: ImportCsvDeps = defaultDeps
): Promise<ParsedImport> => {
  await prepareSeed()
  const text = await file.text()
  const exercises = await deps.getAllExercises()
  return autoDetectAndParse(text, buildExerciseMatcher(exercises))
}
