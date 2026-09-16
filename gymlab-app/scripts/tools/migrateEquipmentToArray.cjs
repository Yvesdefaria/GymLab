// Migración one-off: equipment: 'barra' -> equipment: ['barra'] en los seeds de ejercicios.
// Idempotente: un tag ya migrado (array) no vuelve a matchear.
const fs = require('fs')

const dir = 'src/data/seed/exercisesExtra'
const files = [
  'src/data/seed/exercises.ts',
  ...fs.readdirSync(dir).filter((f) => f.endsWith('.ts')).map((f) => `${dir}/${f}`),
]

let total = 0
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  const out = src.replace(/equipment: '([^']+)'/g, (_m, eq) => {
    total++
    return `equipment: ['${eq}']`
  })
  if (out !== src) fs.writeFileSync(file, out)
}
console.log(`migrated ${total} equipment tags across ${files.length} files`)
