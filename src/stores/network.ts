import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sessionJSON } from './storage'

export type SimulatorMode = 'normal' | 'slow' | 'stall' | 'offline' | 'flaky' | 'expire' | 'forbidden'

type NetworkState = {
  deviceOnline: boolean
  simulator: SimulatorMode
  /** Last time any request succeeded; shown in the offline banner ("saved at HH:mm"). */
  lastSuccessAt: number | null
  setDeviceOnline: (online: boolean) => void
  setSimulator: (mode: SimulatorMode) => void
  markSuccess: () => void
}

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set) => ({
      deviceOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
      simulator: 'normal',
      lastSuccessAt: null,
      setDeviceOnline: (deviceOnline) => set({ deviceOnline }),
      setSimulator: (simulator) => set({ simulator }),
      markSuccess: () => set({ lastSuccessAt: Date.now() }),
    }),
    { name: 'caretex.network', storage: sessionJSON, partialize: ({ simulator }) => ({ simulator }) },
  ),
)

export const selectOnline = (s: NetworkState) => s.deviceOnline && s.simulator !== 'offline'

export function useOnline() {
  return useNetworkStore(selectOnline)
}

export function watchDeviceConnectivity() {
  const update = () => useNetworkStore.getState().setDeviceOnline(navigator.onLine)
  window.addEventListener('online', update)
  window.addEventListener('offline', update)
  return () => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  }
}
