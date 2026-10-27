import * as Chrome from '@/shared/lib/chrome'
import type {
  StorageAreaName,
  StorageChangeListener,
  Unsubscribe,
  IStorageConnector,
} from './types'

type StorageArea = chrome.storage.StorageArea

type StorageAreaQuotas = Partial<
  Pick<chrome.storage.SyncStorageArea, 'QUOTA_BYTES_PER_ITEM' | 'QUOTA_BYTES' | 'MAX_ITEMS'>
>

type AreaChangeListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  area: string
) => void

const getArea = (areaName: StorageAreaName): StorageArea => {
  const { storage } = Chrome

  if (areaName === 'sync') return storage.sync
  if (areaName === 'session') return storage.session
  if (areaName === 'managed') return storage.managed

  return storage.local
}

export class ChromeStorageConnector<T> implements IStorageConnector<T> {
  readonly areaName: StorageAreaName

  private readonly storage: StorageArea
  private readonly listeners = new Set<StorageChangeListener>()
  private areaListener: AreaChangeListener | null = null

  constructor(areaName: StorageAreaName = 'local') {
    this.areaName = areaName
    this.storage = getArea(areaName)
  }

  readonly get = async (key: string): Promise<T | null> => {
    const res = await this.storage.get(key)
    return (res[key] as T) ?? null
  }

  readonly getAll = async (): Promise<Record<string, unknown>> => await this.storage.get(null)

  readonly set = async (key: string, value: T): Promise<T> => {
    await this.storage.set({ [key]: value })
    return value
  }

  readonly setMany = async (items: Record<string, unknown>): Promise<void> => {
    await this.storage.set(items)
  }

  readonly remove = async (keys: string | string[]): Promise<void> => {
    await this.storage.remove(keys)
  }

  /**
   * One chrome.storage.onChanged listener per area, fanned out to the local set.
   * Re-subscribing the same function is cheap and never duplicates delivery.
   */
  readonly onChange = (listener: StorageChangeListener): Unsubscribe => {
    this.listeners.add(listener)

    if (!this.areaListener) {
      const areaListener: AreaChangeListener = (changes, area) => {
        if (area !== this.areaName) return
        for (const current of Array.from(this.listeners)) current(changes, area)
      }

      this.areaListener = areaListener
      Chrome.storage.onChanged.addListener(areaListener)
    }

    return () => {
      this.listeners.delete(listener)

      if (this.listeners.size === 0 && this.areaListener) {
        Chrome.storage.onChanged.removeListener(this.areaListener)
        this.areaListener = null
      }
    }
  }

  readonly quotas = (): StorageAreaQuotas => this.storage as StorageAreaQuotas
}
