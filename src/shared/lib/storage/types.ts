import type * as Chrome from '@/shared/types/chrome'

export type StorageAreaName = 'local' | 'session' | 'sync' | 'managed'

export type StorageChangeListener = (
  changes: Record<string, Chrome.StorageChange>,
  areaName: string
) => void

export type Unsubscribe = () => void

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
  readonly areaName: StorageAreaName

  readonly get: (key: string) => Promise<T | null>
  readonly getAll: () => Promise<Record<string, unknown>>
  readonly set: (key: string, value: T) => Promise<T>
  readonly setMany: (items: Record<string, unknown>) => Promise<void>
  readonly remove: (keys: string | string[]) => Promise<void>

  /** Fires for changes of this connector's area only. Returns an unsubscribe function. */
  readonly onChange: (listener: StorageChangeListener) => Unsubscribe

  /** Area quota constants as exposed by chrome.storage; absent values are undefined. */
  readonly quotas: () => Record<string, unknown>
}

export interface IStorageRecord<T> {
  readonly currentValue: T
  readonly ready: Promise<T>

  readonly get: () => Promise<T>
  readonly set: (value: T) => Promise<T>
  readonly addChangeListener: (listener: IStorageMappedListener<T>) => void
  readonly removeChangeListener: (listener: IStorageMappedListener<T>) => void
}
