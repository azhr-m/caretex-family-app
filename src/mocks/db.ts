/**
 * In-memory mutable copies of fixtures, so creating an inquiry, signing a document, etc.
 * persists until reload. Each phase registers its tables here.
 */
export const db: Record<string, unknown[]> = {}

export function table<T>(name: string, seed: () => T[]): T[] {
  db[name] ??= seed()
  return db[name] as T[]
}

export function resetDb() {
  for (const k of Object.keys(db)) delete db[k]
}
