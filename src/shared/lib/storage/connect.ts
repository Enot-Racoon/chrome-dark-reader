import * as Chrome from '@/shared/lib/chrome'
import type { IStorageConnector, IStorageMappedListener, IStorageMappedEvent } from './types'

export class ChromeStorageConnector<T> implements IStorageConnector<T> {
  private readonly storage = Chrome.storage.local
  private readonly listenerMap = new Map<
    IStorageMappedListener<T>,
    (changes: Record<string, Chrome.Type.StorageChange>, areaName: string) => void
  >()

  readonly get = async (key: string): Promise<T | null> => {
    const res = await this.storage.get(key)
    return (res[key] as T) ?? null
  }

  readonly set = async (key: string, value: T): Promise<T> => {
    await this.storage.set({ [key]: value })
    return value
  }

  readonly addChangeListener = (key: string, listener: IStorageMappedListener<T>): void => {
    const wrappedListener = (
      changes: Record<string, Chrome.Type.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'local') return
      const change = changes[key]
      if (change) {
        const event: IStorageMappedEvent<T> = {
          key,
          newValue: change.newValue as T,
          oldValue: change.oldValue as T,
        }
        listener(event)
      }
    }
    this.listenerMap.set(listener, wrappedListener)
    Chrome.storage.onChanged.addListener(wrappedListener)
  }

  readonly removeChangeListener = (key: string, listener: IStorageMappedListener<T>): void => {
    const wrappedListener = this.listenerMap.get(listener)
    if (wrappedListener) {
      Chrome.storage.onChanged.removeListener(wrappedListener)
      this.listenerMap.delete(listener)
    }
  }
}
