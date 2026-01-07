import equal from 'fast-deep-equal'
import type { IStorageConnector, IStorageMappedListener, IStorageRecord } from './types'

export class StorageRecord<T> implements IStorageRecord<T> {
  private _currentValue: T

  constructor(
    readonly key: string,
    initValue: T,
    private readonly connector: IStorageConnector<T>
  ) {
    this._currentValue = initValue
    void this.connector.get(key).then(val => {
      if (val !== null && val !== undefined) {
        this._currentValue = val
      }
    })
  }

  get currentValue(): T {
    return this._currentValue
  }

  readonly get = async (): Promise<T> => {
    const val = await this.connector.get(this.key)
    if (val !== null && val !== undefined) {
      this._currentValue = val
    }
    return this._currentValue
  }

  readonly set = async (value: T): Promise<T> => {
    if (equal(this._currentValue, value)) {
      return this._currentValue
    }
    this._currentValue = await this.connector.set(this.key, value)
    return this._currentValue
  }

  readonly addChangeListener = (listener: IStorageMappedListener<T>) => {
    this.connector.addChangeListener(this.key, listener)
  }

  readonly removeChangeListener = (listener: IStorageMappedListener<T>) => {
    this.connector.removeChangeListener(this.key, listener)
  }
}
