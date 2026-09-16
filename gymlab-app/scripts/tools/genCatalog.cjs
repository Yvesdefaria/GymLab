// Generador del catálogo de ejercicios: bundlea exercisesExtra/ y lo publica como JSON.
// Node puro sin dependencias; se ejecuta al cambiar el equipamiento, las zonas o las categorías.
const fs = require('fs')

// Lee cada archivo por grupo muscular y extrae su array con balance de corchetes.
const readArray = (file) => {
  const t = fs.readFileSync(file, 'utf8')
  const start = t.indexOf('export const seed')
  const open = t.indexOf('[', t.indexOf('=', start))
  let depth = 0
  for (let i = open; i < t.length; i++) {
    if (t[i] === '[') depth++
    else if (t[i] === ']') {
      depth--
      if (depth === 0) return new Function(`return ${t.slice(open, i + 1)}`)()
    }
  }
  throw new Error(`array no encontrado en ${file}`)
}

const dir = 'src/data/seed/exercisesExtra'
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts')
const parsed = files.flatMap((f) => readArray(`${dir}/${f}`))

if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('catalogo vacio')

fs.mkdirSync('public/catalog', { recursive: true })
fs.writeFileSync(`public/catalog/exercises-${process.env.CATALOG_VERSION || 'v2'}.json`, JSON.stringify(parsed))
console.log(`catalog regenerated: ${parsed.length} exercises`)
