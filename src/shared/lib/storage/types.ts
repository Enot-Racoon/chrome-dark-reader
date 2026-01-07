/**
 * Storage mapped event
 */
export interface IStorageMappedEvent<T> {
  readonly key: string
  readonly newValue: T
  readonly oldValue?: T | null
}

/**
 * Storage mapped event listener
 */
export interface IStorageMappedListener<T> {
  (event: IStorageMappedEvent<T>): void
}

export interface IStorageConnector<T> {
  readonly get: (key: string) => Promise<T | null>
  readonly set: (key: string, value: T) => Promise<T>
  readonly addChangeListener: (key: string, listener: IStorageMappedListener<T>) => void
  readonly removeChangeListener: (key: string, listener: IStorageMappedListener<T>) => void
}

export interface IStorageRecord<T> {
  readonly key: string
  readonly currentValue: T

  readonly get: () => Promise<T>
  readonly set: (value: T) => Promise<T>
  readonly addChangeListener: (listener: IStorageMappedListener<T>) => void
  readonly removeChangeListener: (listener: IStorageMappedListener<T>) => void
}
