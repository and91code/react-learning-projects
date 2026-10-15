import type { IRecordStatic } from "../types";

export class RecordDTO {
  public readonly day: number
  public readonly entry1: string
  public readonly exit1: string
  public readonly entry2: string
  public readonly exit2: string
  // public getTotal: () => string
  // public getExtra: () => string

  constructor(data: IRecordStatic) {
    this.day = data.day
    this.entry1 = data.entry1
    this.exit1 = data.exit1
    this.entry2 = data.entry2
    this.exit2 = data.exit2

    // this.total = data.total
    // this.extra = data.extra
  }

  getTotal() {
    return ''
  }
  getExtra() {
    return ''
  }
}