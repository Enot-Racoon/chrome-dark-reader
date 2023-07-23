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
const { preferences, activeTab, tabPreferences, activeTabPreferences } =
  model.stores

export const { gate } = model
export const use = modelLib.createUse(model.events, model.stores)
export const useGate = modelLib.createUseGate(model.gate)
export const { initialize, tabActivated, iconClicked } = model.events
export const data = {
  preferences,
  activeTab,
  tabPreferences,
  activeTabPreferences,
}
