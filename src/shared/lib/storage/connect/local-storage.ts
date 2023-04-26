import { StorageEventController } from "../controller";

import type { IStorageConnector, IStorageMappedListener } from "../types";

export class LocalStorageConnector<T> implements IStorageConnector<T> {
  private readonly storage = localStorage;
  private readonly eventController = new StorageEventController<T>();

  private map = (value?: string | null): T | null => {
    try {
      return value ? (JSON.parse(value) as T) : null;
    } catch (e) {
      console.error(e);
    }

    return null;
  };

  get(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.map(this.storage.getItem(key)));
      } catch (e) {
        reject(e);
      }
    });
  }

  set(key: string, value: T): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        this.storage.setItem(key, JSON.stringify(value));
        resolve(value);
      } catch (e) {
        reject(e);
      }
    });
  }

  addChangeListener(key: string, listener: IStorageMappedListener<T>): void {
    addEventListener(
      "storage",
      this.eventController.createListener(key, listener, (ev) => ({
        key,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        newValue: this.map(ev.newValue)!,
        oldValue: this.map(ev.newValue),
      }))
    );
  }

  removeChangeListener(key: string, listener: IStorageMappedListener<T>): void {
    const wrapperListener = this.eventController.deleteListener(listener);
    if (wrapperListener) {
      removeEventListener("storage", wrapperListener);
    }
  }
}
