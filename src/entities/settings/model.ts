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

export const { gate, effects, events, stores, useGate, useEvents, useStores } =
  createStorageModel(settingsStorageRecord);
