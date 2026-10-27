import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../src/locales/', import.meta.url))
const LANGS = ['en', 'he']
const PLURAL = /_(zero|one|two|few|many|other)$/

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`.replace(PLURAL, '')],
  )
}

const files = new Set(LANGS.flatMap((l) => readdirSync(join(root, l))))
let problems = 0

for (const file of files) {
  const keys = {}
  for (const lang of LANGS) {
    try {
      keys[lang] = new Set(flatten(JSON.parse(readFileSync(join(root, lang, file), 'utf8'))))
    } catch (e) {
      console.error(`✗ ${lang}/${file}: ${e.code === 'ENOENT' ? 'missing file' : e.message}`)
      problems++
      keys[lang] = new Set()
    }
  }
  for (const a of LANGS) {
    for (const b of LANGS) {
      if (a === b) continue
      for (const k of keys[a]) {
        if (!keys[b].has(k)) {
          console.error(`✗ ${file}: "${k}" exists in ${a} but not in ${b}`)
          problems++
        }
      }
    }
  }
}

if (problems) {
  console.error(`\ni18n check failed: ${problems} problem(s).`)
  process.exit(1)
}
console.log(`✓ i18n keys match across ${LANGS.join(', ')} (${files.size} namespaces).`)
