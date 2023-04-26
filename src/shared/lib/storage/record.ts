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
    console.log("StorageRecord constructor");

    this.bindMethods();
    void this.init(initValue);
  }

  async get(): Promise<T> {
    this.currentValue = (await this.connector.get(this.key)) as T;
    console.log("StorageRecord", "async get()", this.currentValue);
    return this.currentValue;
  }

  async set(value: T): Promise<T> {
    this.currentValue = await this.connector.set(this.key, value);
    console.log("StorageRecord", "async set()", this.currentValue);
    return this.currentValue;
  }

  addChangeListener(listener: IStorageMappedListener<T>) {
    this.connector.addChangeListener(this.key, listener);
  }

  removeChangeListener(listener: IStorageMappedListener<T>) {
    this.connector.removeChangeListener(this.key, listener);
  }

  private async init(initValue: T): Promise<void> {
    console.log("StorageRecord init");
    const value = await this.get();
    console.log("StorageRecord const value = await this.get();", value);
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
