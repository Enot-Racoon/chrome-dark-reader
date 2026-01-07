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

export const { createDefaultHostSettings } = lib
export const { gate, events, effects, stores } = model
export const { preferences, activeTab, activeTabPreferences } = stores
export const { initialize, tabActivated, iconClicked, update } = events

export const use = () =>
  ModelLib.use({
    preferences,
    loading: stores.loading,
    updating: stores.updating,
    initialize,
    update,
  })

export const useGate = (props?: any) => ModelLib.useGate(gate, props)

export const data = stores
