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

console.log("settingsChromeStorage", settingsChromeStorage);

export const { Gate, effects, events, stores, useGate, useEvents, useStores } =
  createStorageModel(settingsChromeStorage);

stores.value.watch(console.log.bind(console, "watch value"));
effects.getFx.watch(console.log.bind(console, "watch getFx"));
effects.setFx.watch(console.log.bind(console, "watch setFx"));
