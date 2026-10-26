import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { localJSON } from './storage'

export type Language = 'en' | 'he'
export type ThemePreference = 'light' | 'dark' | 'system'

type PrefsState = {
  language: Language | null
  theme: ThemePreference
  setLanguage: (language: Language) => void
  setTheme: (theme: ThemePreference) => void
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      language: null,
      theme: 'system',
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'caretex.prefs', storage: localJSON, partialize: ({ language, theme }) => ({ language, theme }) },
  ),
)
