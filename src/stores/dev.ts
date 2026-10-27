import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { localJSON } from './storage'

export type Scenario =
  'normal' | 'firstLogin' | 'wrongPassword' | 'locked' | 'blocked' | 'singleResident' | 'emptyEverything'

export const SCENARIOS: Scenario[] = [
  'normal',
  'firstLogin',
  'wrongPassword',
  'locked',
  'blocked',
  'singleResident',
  'emptyEverything',
]

type DevState = {
  scenario: Scenario
  panelOpen: boolean
  /** Overrides VITE_IDLE_MINUTES in dev (e.g. 30 s) to test the session lock. */
  idleSeconds: number | null
  /** Doubles every translation as ⟦text text⟧ to stress layouts. */
  longStrings: boolean
  setScenario: (scenario: Scenario) => void
  setPanelOpen: (open: boolean) => void
  setIdleSeconds: (s: number | null) => void
  setLongStrings: (on: boolean) => void
}

export const useDevStore = create<DevState>()(
  persist(
    (set) => ({
      scenario: 'normal',
      panelOpen: false,
      idleSeconds: null,
      longStrings: false,
      setScenario: (scenario) => set({ scenario }),
      setPanelOpen: (panelOpen) => set({ panelOpen }),
      setIdleSeconds: (idleSeconds) => set({ idleSeconds }),
      setLongStrings: (longStrings) => set({ longStrings }),
    }),
    { name: 'caretex.dev', storage: localJSON },
  ),
)
