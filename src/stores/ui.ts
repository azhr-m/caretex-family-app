import { create } from 'zustand'

type UiState = {
  residentSheetOpen: boolean
  setResidentSheetOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()((set) => ({
  residentSheetOpen: false,
  setResidentSheetOpen: (residentSheetOpen) => set({ residentSheetOpen }),
}))
