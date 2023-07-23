import equal from 'fast-deep-equal'

import { delay } from 'shared/lib/common'

import type {
  IStorageConnector,
  IStorageMappedListener,
  IStorageRecord,
} from './types'

export class StorageRecord<T> implements IStorageRecord<T> {
  readonly key: string
  private readonly connector: IStorageConnector<T>

  constructor(key: string, initValue: T, connector: IStorageConnector<T>) {
    this.key = key
    this.connector = connector
    this._currentValue = this.clone(initValue)

    void this.init(initValue)
  }

  private _currentValue: T

  get currentValue(): T {
    return this.clone(this._currentValue)
  }

  set currentValue(value: T) {
    this._currentValue = this.clone(value)
  }

  readonly get = async (): Promise<T> => {
    const currentValue = <T>await this.connector.get(this.key)
    this.currentValue = currentValue

    return currentValue
  }

  readonly set = async (value: T): Promise<T> => {
    let currentValue = this.currentValue
    if (equal(currentValue, value)) {
      return currentValue
    }

    currentValue = await this.connector.set(this.key, value)
    this.currentValue = currentValue
    await delay(600)

    return currentValue
  }

  readonly addChangeListener = (listener: IStorageMappedListener<T>) => {
    this.connector.addChangeListener(this.key, listener)
  }

  readonly removeChangeListener = (listener: IStorageMappedListener<T>) => {
    this.connector.removeChangeListener(this.key, listener)
  }

  private readonly init = async (initValue: T): Promise<void> => {
    const value = await this.get()
    if (value === null || value === undefined) {
      await this.set(initValue)
    }
  }

  private clone = <Obj>(obj: Obj): Obj => <Obj>JSON.parse(JSON.stringify(obj))
}
