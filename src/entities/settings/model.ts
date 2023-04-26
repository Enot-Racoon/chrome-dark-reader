import { createStorageModel } from "shared/lib/model";
import { getStorageConnector, StorageRecord } from "shared/lib/storage";

import { STORAGE_KEY } from "./constants";

export interface ISettings {
  enabled: boolean;
}

const defaultSettings: ISettings = { enabled: false };

const settingsChromeStorage = new StorageRecord(
  STORAGE_KEY,
  defaultSettings,
  getStorageConnector()
);

export const { Gate, effects, events, stores, useGate, useEvents, useStores } =
  createStorageModel(settingsChromeStorage);
