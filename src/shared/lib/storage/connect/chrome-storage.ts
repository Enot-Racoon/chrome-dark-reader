import Chrome from 'shared/lib/chrome'

import { StorageEventController } from '../controller'

import type { IStorageConnector, IStorageMappedListener } from '../types'

export class ChromeStorageConnector<T> implements IStorageConnector<T> {
  private readonly storage = Chrome.storage.local
  private readonly syncStorage = Chrome.storage.sync
  private readonly eventController = new StorageEventController<T>()

  readonly get = async (key: string): Promise<T | null> => {
    let res = await this.storage.get(key)
    let value = res[key] as T

    // Migration logic: if local is empty, try to get from sync
    if (value === undefined || value === null) {
      const syncRes = await this.syncStorage.get(key)
      const syncValue = syncRes[key] as T

      if (syncValue !== undefined && syncValue !== null) {
        // Migrate to local
        await this.set(key, syncValue)
        value = syncValue
        console.log(`[Storage] Migrated key "${key}" from sync to local storage.`)
      }
    }

    return value ?? null
  }

  readonly set = async (key: string, value: T): Promise<T> => {
    await this.storage.set({ [key]: value })
    return value
  }

  readonly addChangeListener = (key: string, listener: IStorageMappedListener<T>): void => {
    this.storage.onChanged.addListener(
      this.eventController.createListener(key, listener, ev => ({
        key,
        newValue: ev[key]?.newValue as T,
        oldValue: ev[key]?.oldValue as T,
      }))
    )
  }

  readonly removeChangeListener = (key: string, listener: IStorageMappedListener<T>): void => {
    const wrapperListener = this.eventController.deleteListener(listener)
    if (wrapperListener) {
      this.storage.onChanged.removeListener(wrapperListener)
    }
  }
}
