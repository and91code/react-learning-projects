import clsx, { type ClassValue } from 'clsx';
import type { IRecord, IRecordTable } from './types';

export const cn = (...classes: ClassValue[]): string => clsx(...classes);

// export const parseRecord = (data: IRecordStatic): IRecord => {
//   return {
//     day: data.day,
//     entry1: data.entry1,
//     exit1: data.exit1,
//     entry2: data.entry2,
//     exit2: data.exit2,
//     total: '',
//     extra: ''
//   }
// }

export const setMemory = (key: string, value: object) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}
export const getMemory = <T>(key: string) => {
  const localData = window.localStorage.getItem(key)

  return (localData ? JSON.parse(localData) : {}) as Partial<T>
}

export const renderDaysOfMonth = (inputYear: string, inputMonth: string): string[] => {
  const month = Number(inputMonth)
  const year = Number(inputYear)

  const _daysOfMonth: string[] = []

  const _monthCurrentValue = month - 1
  const _date: Date = new Date(year, _monthCurrentValue, 1);

  while (_date.getMonth() === _monthCurrentValue) {
    _daysOfMonth.push(_date.getDate().toString());
    _date.setDate(_date.getDate() + 1);
  }

  return _daysOfMonth
}

export const parseRecordToRecordTable = (data: Partial<IRecord>): IRecordTable => {
  const { year, month, day, entry1, exit1, entry2, exit2 } = data

  return {
    year: year ?? '',
    month: month ?? '',
    day: day ?? '',
    entry1: entry1 ?? '',
    exit1: exit1 ?? '',
    entry2: entry2 ?? '',
    exit2: exit2 ?? '',
    //
    total: '',
    extra: '',
    //
    _key: `${year}-${month}-${day}`,
    _isNew: !data?.year
  }
}