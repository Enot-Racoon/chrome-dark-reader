import { error } from 'shared/lib/common'
import { createStorageSyncModel } from 'shared/lib/store/model'
import { StorageRecord, ChromeStorageConnector } from 'shared/lib/storage'

import type { Settings } from 'shared/types/entities'

import { STORAGE_KEY } from './constants'

const defaultSettings: Settings.ISettings = {
  enabled: false,
  tabs: [],
}

const settingsStorageRecord = new StorageRecord(
  STORAGE_KEY,
  defaultSettings,
  new ChromeStorageConnector()
)

export const {
  gate,
  events,
  effects,
  stores,
  useGate,
  useEvents,
  useStores,
  use,
} = createStorageSyncModel(settingsStorageRecord)

// events.initialized.watch(log("Settings was initialized"));
stores.initializeError.updates.watch(error)
