import { create } from 'zustand';
import type { IStore, IStoreData } from '../types';

const initialState: IStoreData = {
  inputYear: '',
  inputMonth: '',
  timeRecords: [],
}

const useStoreBase = create<IStore>((set) => ({
  ...initialState,
  setData(values) {
    set((state => ({ ...state, ...values, })))
  }
}))

export default function useStore() {
  const store = useStoreBase()
  const state = useStoreBase((state) => state)

  return {
    state: {
      inputYear: state.inputYear,
      inputMonth: state.inputMonth,
      timeRecords: state.timeRecords,
    },
    actions: {
      setData: store.setData,
    }
  }
}
