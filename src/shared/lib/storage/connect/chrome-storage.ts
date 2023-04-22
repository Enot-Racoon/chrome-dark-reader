import { IStorageConnector } from "../types";

export class ChromeStorageConnector<T> implements IStorageConnector<T> {
  private readonly storage = chrome.storage.sync;

  get(key: string): Promise<T | null> {
    return this.storage.get(key).then((res) => (res[key] as T) ?? null);
  }

  set(key: string, value: T): Promise<T> {
    return this.storage.set({ [key]: value }).then(() => value);
  }
}
