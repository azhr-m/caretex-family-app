// One chunk per language: only the active language loads at startup (src/lib/i18n.ts).
export default import.meta.glob<Record<string, unknown>>('./en/*.json', { eager: true, import: 'default' })
