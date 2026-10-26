import { createJSONStorage } from 'zustand/middleware'

function safe(getStore: () => Storage) {
  return {
    getItem: (k: string) => {
      try {
        return getStore().getItem(k)
      } catch {
        return null
      }
    },
    setItem: (k: string, v: string) => {
      try {
        getStore().setItem(k, v)
      } catch {
        /* storage unavailable (private mode) — keep in memory only */
      }
    },
    removeItem: (k: string) => {
      try {
        getStore().removeItem(k)
      } catch {
        /* ignore */
      }
    },
  }
}

export const localJSON = createJSONStorage(() => safe(() => localStorage))
export const sessionJSON = createJSONStorage(() => safe(() => sessionStorage))
export const sessionRaw = safe(() => sessionStorage)
