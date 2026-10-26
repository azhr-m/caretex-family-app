import { useDevStore, type Scenario } from '@/stores/dev'

export type { Scenario }

export const currentScenario = (): Scenario => useDevStore.getState().scenario
