const fs = require('fs')

const t = fs.readFileSync('src/data/seed/exercisesCatalog.ts', 'utf8')
const start = t.indexOf('export const seedExercisesExtra')
if (start === -1) throw new Error('catalog not found')
const open = t.indexOf('[', t.indexOf('=', start))
let depth = 0
let end = -1
for (let i = open; i < t.length; i++) {
  if (t[i] === '[') depth++
  else if (t[i] === ']') {
    depth--
    if (depth === 0) {
      end = i
      break
    }
  }
}
const arrText = t.slice(open, end + 1)
const parsed = new Function(`return ${arrText}`)()
if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('empty catalog')

fs.mkdirSync('public/catalog', { recursive: true })
fs.writeFileSync('public/catalog/exercises-v1.json', JSON.stringify(parsed))
console.log(`catalog regenerated: ${parsed.length} exercises -> public/catalog/exercises-v1.json`)
