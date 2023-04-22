export interface IStorageConnector<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<T>;
}

export interface IStorageRecord<T> {
  readonly key: string;
  currentValue: T;
  get(): Promise<T>;
  set(value: T): Promise<T>;
}
