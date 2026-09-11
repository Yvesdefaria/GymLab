// Tab de fuerza/benchmark: solo monta hooks de benchmark cuando está activo.
import { BenchmarkTests } from '@/components/benchmark/BenchmarkTests'
import { BenchmarkEvolutionChart } from '@/components/benchmark/BenchmarkEvolutionChart'
import { useBenchmarkResults } from '@/hooks/useBenchmarkResults'
import { benchmarkRepo } from '@/data/repositories'

export const FuerzaTab = () => {
  const { results: benchmarkResults } = useBenchmarkResults()

  return (
    <div className="space-y-4">
      <BenchmarkTests
        results={benchmarkResults}
        onAdd={(r) => benchmarkRepo.add(r)}
      />
      {benchmarkResults.length > 0 && (
        <BenchmarkEvolutionChart results={benchmarkResults} />
      )}
    </div>
  )
}
