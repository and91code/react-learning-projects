import { create } from 'zustand'
import type { ProfileInput } from '../../domain/training/schemas'

export type DatabaseState = 'loading' | 'ready' | 'error'

type SystemState = {
  databaseState: DatabaseState
  databaseError: string
  profile: ProfileInput | null
  activeModelId: number | null
  activeSessionId: number | null
  setDatabaseState: (state: DatabaseState, error?: string) => void
  setProfile: (profile: ProfileInput | null) => void
  setActiveModelId: (id: number | null) => void
  setActiveSessionId: (id: number | null) => void
}

export const useSystemStore = create<SystemState>((set) => ({
  databaseState: 'loading',
  databaseError: '',
  profile: null,
  activeModelId: null,
  activeSessionId: null,
  setDatabaseState: (databaseState, databaseError = '') => set({ databaseState, databaseError }),
  setProfile: (profile) => set({ profile }),
  setActiveModelId: (activeModelId) => set({ activeModelId }),
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
}))
