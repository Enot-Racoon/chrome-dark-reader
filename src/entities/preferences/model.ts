import Config from 'shared/config'
import ModelLib from 'shared/lib/store'
import StorageLib from 'shared/lib/storage'

import lib from './lib'
import type Type from './types'
import defaultSettings from './defaultSettings.json'

const defaultPreferences: Type.IPreferences = defaultSettings

const settingsRecord = new StorageLib.StorageRecord(
  Config.STORAGE_KEY,
  defaultPreferences,
  new StorageLib.ChromeStorageConnector()
)

const model = lib.createModel(settingsRecord)
const { preferences, activeTab, tabPreferences, activeTabPreferences } = model.stores

export const use = ModelLib.createUse(model.events, model.stores)
export const useGate = ModelLib.createUseGate(model.gate)
export const { initialize, tabActivated, iconClicked } = model.events
export const data = {
  preferences,
  activeTab,
  tabPreferences,
  activeTabPreferences,
}
