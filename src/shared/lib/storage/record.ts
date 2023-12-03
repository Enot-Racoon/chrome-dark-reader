import equal from 'fast-deep-equal'

import type { IStorageConnector, IStorageMappedListener, IStorageRecord } from './types'

export class StorageRecord<T> implements IStorageRecord<T> {
  readonly key: string
  private readonly connector: IStorageConnector<T>
  private initialized: boolean

  constructor(key: string, initValue: T, connector: IStorageConnector<T>) {
    this.key = key
    this.connector = connector
    this.initialized = false
    this._currentValue = <T>structuredClone(initValue)

    void this.restore(initValue)
  }

  private _currentValue: T

  get currentValue(): T {
    return <T>structuredClone(this._currentValue)
  }

  readonly get = async (): Promise<T> => {
    this._currentValue = <T>await this.connector.get(this.key)
    return this.currentValue
  }

  readonly set = async (value: T): Promise<T> => {
    if (value && equal(this._currentValue, value)) {
      return this._currentValue
    }
    if (!this.initialized) {
      await this.restore(this._currentValue)
    }
    if (this.initialized) {
      this._currentValue = await this.connector.set(this.key, value)
    }
    return this.currentValue
  }

  readonly addChangeListener = (listener: IStorageMappedListener<T>) => {
    this.connector.addChangeListener(this.key, listener)
  }

  readonly removeChangeListener = (listener: IStorageMappedListener<T>) => {
    this.connector.removeChangeListener(this.key, listener)
  }

  private readonly restore = async (initValue: T): Promise<void> => {
    const value = await this.get()
    if (value !== null && value !== undefined) {
      this._currentValue = value
      this.initialized = true
    } else {
      this._currentValue = initValue
    }
  }
}
