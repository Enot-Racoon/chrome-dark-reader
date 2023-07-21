import type {
  IStorageChangeController,
  IStorageChangeListener,
  IStorageMappedEvent,
  IStorageMappedListener,
} from './types'

export class StorageEventController<T> implements IStorageChangeController<T> {
  private readonly listeners: WeakMap<
    IStorageMappedListener<T>,
    IStorageChangeListener
  > = new WeakMap()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createListener = <L extends (...args: any) => void>(
    key: string,
    listener: IStorageMappedListener<T>,
    mapper: (...args: Parameters<L>) => IStorageMappedEvent<T>
  ): L => {
    const wrappedListener = (...args: Parameters<L>): void => {
      listener(mapper(...args))
    }
    this.listeners.set(listener, wrappedListener as IStorageChangeListener)
    return wrappedListener as L
  }

  deleteListener = (
    listener: IStorageMappedListener<T>
  ): IStorageChangeListener | null => {
    const wrappedListener = this.listeners.get(listener)
    if (wrappedListener) {
      this.listeners.delete(listener)
    }

    return wrappedListener ?? null
  }
}
