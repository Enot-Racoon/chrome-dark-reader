import { StorageEventController } from '../controller'

import type { IStorageConnector, IStorageMappedListener } from '../types'

export class ChromeStorageConnector<T> implements IStorageConnector<T> {
  private readonly storage = chrome.storage.sync
  private readonly eventController = new StorageEventController<T>()

  readonly get = (key: string): Promise<T | null> => {
    return this.storage.get(key).then(res => (res[key] as T) ?? null)
  }

  readonly set = (key: string, value: T): Promise<T> => {
    return this.storage.set({ [key]: value }).then(() => value)
  }

  readonly addChangeListener = (
    key: string,
    listener: IStorageMappedListener<T>
  ): void => {
    this.storage.onChanged.addListener(
      this.eventController.createListener(key, listener, ev => ({
        key,
        newValue: ev[key]?.newValue as T,
        oldValue: ev[key]?.oldValue as T,
      }))
    )
  }

  readonly removeChangeListener = (
    key: string,
    listener: IStorageMappedListener<T>
  ): void => {
    const wrapperListener = this.eventController.deleteListener(listener)
    if (wrapperListener) {
      this.storage.onChanged.removeListener(wrapperListener)
    }
  }
}
