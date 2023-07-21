import modelLib from 'shared/lib/store/model'
import storageLib from 'shared/lib/storage'

import lib from './lib'
import config from './config'
import type Type from './types'

const defaultPreferences: Type.IPreferences = { hosts: {} }

const settingsRecord = new storageLib.StorageRecord(
  config.STORAGE_KEY,
  defaultPreferences,
  new storageLib.ChromeStorageConnector()
)

const model = lib.createModel(settingsRecord)

export const { gate } = model
export const useGate = modelLib.createUseGate(model.gate)
export const { initialize, tabActivated } = model.events
export const data = {
  preferences: model.stores.preferences,
  activeTab: model.stores.activeTab,
}
