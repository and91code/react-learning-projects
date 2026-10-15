import { useState } from "react";
import type { IStoreData, IStoreDataInputs, IStoreDataRecords } from "../types";
import { getMemory, setMemory } from "../utils";
import useStore from "./useStore";

export default function usePrepareStore() {
  const store = useStore();

  const [isLoading, setLoading] = useState(true);

  const exec = () => {
    const initialStore = getInitialStore()
    const localStore = getLocalStore()

    try {
      const hasLocalStoreFull = !localStore.inputMonth || !localStore.inputYear || !localStore.timeRecords

      if (hasLocalStoreFull) {
        throw new Error('No data found in localStorage');
      }

      initialStore.inputMonth = localStore.inputMonth ?? initialStore.inputMonth
      initialStore.inputYear = localStore.inputYear ?? initialStore.inputYear
      initialStore.timeRecords = localStore.timeRecords ?? initialStore.timeRecords

    } catch (error) {
      console.error("Error during initialization:", error);

      setLocalStore()
    } finally {
      store.actions.setData({
        inputMonth: initialStore.inputMonth,
        inputYear: initialStore.inputYear,
        timeRecords: initialStore.timeRecords,
      });

      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };


  return { isLoading, exec }
}

const setLocalStore = () => {
  const { inputMonth, inputYear, timeRecords } = getInitialStore()

  setMemory("myPoint-inputs", { inputMonth, inputYear })
  setMemory("myPoint-records", { timeRecords })

  // window.localStorage.setItem("myPoint-inputs", JSON.stringify({
  //   inputMonth,
  //   inputYear
  // }));

  // window.localStorage.setItem("myPoint-records", JSON.stringify({
  //   timeRecords
  // }));
}
const getLocalStore = (): Partial<IStoreData> => {
  const { inputMonth, inputYear } = getMemory<IStoreDataInputs>("myPoint-inputs");
  const { timeRecords } = getMemory<IStoreDataRecords>("myPoint-records");

  // const {
  //   inputMonth,
  //   inputYear
  // } = JSON.parse(inputs || '{}') as Partial<IStoreDataInputs>;

  // const {
  //   timeRecords
  // } = (JSON.parse(records || '{}')) as Partial<IStoreDataRecords>

  return {
    inputMonth,
    inputYear,
    timeRecords
  }
}
const getInitialStore = (): IStoreData => {
  const d = new Date()

  return {
    inputMonth: String(d.getMonth() + 1).padStart(2, '0'),
    inputYear: String(d.getFullYear()),
    timeRecords: []
  }
}