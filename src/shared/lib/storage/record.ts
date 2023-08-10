import equal from 'fast-deep-equal'

import type {
  IStorageConnector,
  IStorageMappedListener,
  IStorageRecord,
} from './types'

export class StorageRecord<T> implements IStorageRecord<T> {
  readonly key: string
  private _currentValue: T
  private readonly connector: IStorageConnector<T>

  get currentValue(): T {
    return <T>structuredClone(this._currentValue)
  }

  constructor(key: string, initValue: T, connector: IStorageConnector<T>) {
    this.key = key
    this.connector = connector
    this._currentValue = <T>structuredClone(initValue)

    void this.restore(initValue)
  }

  private readonly restore = async (initValue: T): Promise<void> => {
    const value = await this.get()
    console.log('StorageRecord.restore', { initValue, value })
    if (value !== null && value !== undefined) {
      this._currentValue = value
    } else {
      await this.set(initValue)
    }
  }

  readonly get = async (): Promise<T> => {
    const currentValue = this._currentValue
    this._currentValue = <T>await this.connector.get(this.key)
    console.log('StorageRecord.get', {
      currentValue,
      value: this._currentValue,
    })
    return this.currentValue
  }

  readonly set = async (value: T): Promise<T> => {
    console.log('StorageRecord.set', {
      currentValue: this._currentValue,
      value,
    })
    if (value && equal(this._currentValue, value)) return this._currentValue
    this._currentValue = await this.connector.set(this.key, value)
    return this.currentValue
  }

  readonly addChangeListener = (listener: IStorageMappedListener<T>) => {
    this.connector.addChangeListener(this.key, listener)
  }

  readonly removeChangeListener = (listener: IStorageMappedListener<T>) => {
    this.connector.removeChangeListener(this.key, listener)
  }
}
