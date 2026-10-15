/** RECORD */
export interface IRecord {
  year: string
  month: string
  day: string
  entry1: string
  exit1: string
  entry2: string
  exit2: string
  //
  _key: string
}
export interface IRecordTable {
  year: string
  month: string
  day: string
  entry1: string
  exit1: string
  entry2: string
  exit2: string
  //
  total: string
  extra: string
  //
  _key: string
  _isNew: boolean
}
// export type IRecord =  & {
//   // day: number
//   // entry1: string
//   // exit1: string
//   // entry2: string
//   // exit2: string

// }

/** STORE */
export type IStoreDataInputs = {
  inputYear: string
  inputMonth: string
}
export type IStoreDataRecords = {
  timeRecords: IRecord[]
}
export type IStoreData = IStoreDataInputs & IStoreDataRecords

export type IStoreActions = {
  setData: (values: Partial<IStoreData>) => void
}
export type IStore = IStoreData & IStoreActions
