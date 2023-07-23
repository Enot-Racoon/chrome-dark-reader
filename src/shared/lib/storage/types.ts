/**
 * Event from addListener('storage', (event: ILocalStorageEvent) => void)
 */
export type ILocalStorageEvent = Pick<
  StorageEvent,
  'key' | 'newValue' | 'oldValue'
>
/**
 * Event from chrome.storage.onChange.addListener((event: ILocalStorageEvent) => void)
 */
export type IChromeStorageEvent = {
  [key: string]: chrome.storage.StorageChange
}
/**
 * Union of events from addListener and storage.onChange.addListener
 */
export type IStorageChangeEvent = ILocalStorageEvent | IChromeStorageEvent
/**
 * Union of event listeners for addListener and storage.onChange.addListener
 */
export type IStorageChangeListener = <E extends IStorageChangeEvent>(
  event: E
) => void

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
  <E extends IStorageMappedEvent<T>>(event: E): void
}

/**
 * Storage event controller contains events and mapped events
 */
export interface IStorageChangeController<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly createListener: <L extends (...args: any) => void>(
    key: string,
    listener: IStorageMappedListener<T>,
    mapper: (...args: Parameters<L>) => IStorageMappedEvent<T>
  ) => L

  readonly deleteListener: (
    listener: IStorageMappedListener<T>
  ) => IStorageChangeListener | null
}

export interface IStorageConnector<T> {
  readonly get: (key: string) => Promise<T | null>
  readonly set: (key: string, value: T) => Promise<T>
  readonly addChangeListener: (
    key: string,
    listener: IStorageMappedListener<T>
  ) => void
  readonly removeChangeListener: (
    key: string,
    listener: IStorageMappedListener<T>
  ) => void
}

export interface IStorageRecord<T> {
  readonly key: string
  currentValue: T

  readonly get: () => Promise<T>
  readonly set: (value: T) => Promise<T>
  readonly addChangeListener: (listener: IStorageMappedListener<T>) => void
  readonly removeChangeListener: (listener: IStorageMappedListener<T>) => void
}
