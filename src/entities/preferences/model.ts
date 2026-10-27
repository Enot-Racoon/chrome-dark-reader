import * as ModelLib from '@/shared/lib/store/effector'
import { createEvent, createStore } from '@/shared/lib/store/effector'
import { ChromeStorageConnector } from '@/shared/lib/storage'

import { SyncedPreferencesRecord } from './sync-record'
import * as lib from './lib'

import type { ISyncStatus } from './sync-record'

const settingsRecord = new SyncedPreferencesRecord({
  sync: new ChromeStorageConnector<unknown>('sync'),
  local: new ChromeStorageConnector<unknown>('local'),
})

const model = lib.createModel(settingsRecord)

const statusChanged = createEvent<ISyncStatus>()
const syncStatus = createStore<ISyncStatus>(settingsRecord.status).on(
  statusChanged,
  (_state, payload) => payload
)

settingsRecord.onStatusChange(statusChanged)

/** Resolves once migration and the sync read finished; every read/write goes through it. */
export const ready = settingsRecord.ready

/** Starts chrome.storage.sync writes. */
export const flushSync = settingsRecord.flush

export const { createDefaultHostSettings, getTabHost } = lib
export const { gate, events, effects, stores } = model
export const { preferences, activeTab, activeTabPreferences } = stores
export const { initialize, tabActivated, update, setEnabled, toggle, patchHost, removeHost } =
  events

export const use = () =>
  ModelLib.use({
    preferences,
    loading: stores.loading,
    updating: stores.updating,
    syncStatus,
    initialize,
    update,
    setEnabled,
    patchHost,
    removeHost,
  })

export const useGate = (props?: Record<string, unknown>) => ModelLib.useGate(gate, props)

export const data = { ...stores, syncStatus }
