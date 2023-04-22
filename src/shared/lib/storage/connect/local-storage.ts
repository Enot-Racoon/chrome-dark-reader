import { IStorageConnector } from "../types";

export class LocalStorageConnector<T> implements IStorageConnector<T> {
  private readonly storage = localStorage;

  get(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      try {
        const value = this.storage.getItem(key);
        resolve(JSON.parse(`${value ?? "null"}`) as T | null);
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
}
