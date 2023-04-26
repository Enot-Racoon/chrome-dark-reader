import type {
  IStorageConnector,
  IStorageMappedListener,
  IStorageRecord,
} from "./types";

export class StorageRecord<T> implements IStorageRecord<T> {
  currentValue: T;
  readonly key: string;
  private readonly connector: IStorageConnector<T>;

  constructor(key: string, initValue: T, connector: IStorageConnector<T>) {
    this.key = key;
    this.connector = connector;
    this.currentValue = initValue;

    this.bindMethods();
    void this.init(initValue);
  }

  async get(): Promise<T> {
    this.currentValue = (await this.connector.get(this.key)) as T;
    return this.currentValue;
  }

  async set(value: T): Promise<T> {
    this.currentValue = await this.connector.set(this.key, value);
    return this.currentValue;
  }

  addChangeListener(listener: IStorageMappedListener<T>) {
    this.connector.addChangeListener(this.key, listener);
  }

  removeChangeListener(listener: IStorageMappedListener<T>) {
    this.connector.removeChangeListener(this.key, listener);
  }

  private async init(initValue: T): Promise<void> {
    const value = await this.get();
    if (value === null || value === undefined) {
      await this.set(initValue);
    }
  }

  private bindMethods() {
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.addChangeListener = this.addChangeListener.bind(this);
    this.removeChangeListener = this.removeChangeListener.bind(this);
  }
}
