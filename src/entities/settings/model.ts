import { error, log } from "shared/lib/common";
import { createStorageModel } from "shared/lib/model";
import { getStorageConnector, StorageRecord } from "shared/lib/storage";

import type { Settings } from "shared/types/entities";

import { STORAGE_KEY } from "./constants";

const defaultSettings: Settings.ISettings = {
  enabled: false,
  tabs: [],
};

const settingsStorageRecord = new StorageRecord(
  STORAGE_KEY,
  defaultSettings,
  getStorageConnector()
);

export const {
  gate,
  events,
  effects,
  stores,
  useGate,
  useEvents,
  useStores,
  use,
} = createStorageModel(settingsStorageRecord);

stores.initialized.updates.watch(log("Settings initialized was changed"));
stores.initializeError.updates.watch(error);

stores.value.updates.watch(log("stores.value was updated"));
