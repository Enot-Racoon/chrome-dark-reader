import {
  createGate,
  createEvent,
  createEffect,
  createStore,
  combine,
  sample,
} from 'shared/lib/store/effector'
import type Chrome from 'shared/types/chrome'
import type { IStorageRecord } from 'shared/lib/storage'

import type { IPreferences, IHostSettings } from './types'

export * as default from './lib'

export const getTabHost = ({ url }: Chrome.Tab) => (url ? new URL(url).host : '')

export const createDefaultHostSettings = (
  host: string,
  enabled = false,
  styles = ''
): IHostSettings => ({ host, enabled, styles })

export const createModel = (record: IStorageRecord<IPreferences>) => {
  const gate = createGate()

  // Events
  const initialize = createEvent<void>()
  const load = createEvent<void>()
  const update = createEvent<IPreferences>()
  const reset = createEvent<void>()

  const setEnabled = createEvent<[host: string, enabled: boolean | null]>()
  const enable = setEnabled.prepend((host: string) => [host, true])
  const disable = setEnabled.prepend((host: string) => [host, false])
  const toggle = setEnabled.prepend((host: string) => [host, null])

  const tabActivated = createEvent<Chrome.Tab>()
  const iconClicked = toggle.prepend<Chrome.Tab>(getTabHost)

  // Effects
  const loadFx = createEffect<void, IPreferences>(record.get)
  const updateFx = createEffect<IPreferences, IPreferences>(record.set)

  // Stores
  const activeTab = createStore<Chrome.Tab | null>(null)
  const preferences = createStore<IPreferences>(record.currentValue).reset(reset)

  const activeTabPreferences = combine(activeTab, preferences, (tab, { hosts }) => {
    const host = tab ? getTabHost(tab) : ''
    return hosts[host] ?? createDefaultHostSettings(host)
  })

  // Logic
  sample({
    clock: [gate.open, initialize],
    target: load,
  })

  sample({
    clock: load,
    target: loadFx,
  })

  sample({
    clock: update,
    target: updateFx,
  })

  sample({
    clock: [updateFx.doneData, loadFx.doneData],
    target: preferences,
  })

  activeTab.on(tabActivated, (_state, payload) => ({ ...payload, time: Date.now() }))

  preferences.on(setEnabled, (state, [host, enabled]) => {
    if (!host) return state

    const hostState = state.hosts[host] ?? createDefaultHostSettings(host)
    const nextEnabled = enabled === null ? !hostState.enabled : enabled

    return {
      ...state,
      hosts: {
        ...state.hosts,
        [host]: {
          ...hostState,
          enabled: nextEnabled,
        },
      },
    }
  })

  // Sync with store
  sample({
    clock: preferences.updates,
    target: updateFx,
  })

  record.addChangeListener(({ newValue }) => {
    if (newValue) update(newValue)
  })

  return {
    gate,
    events: {
      initialize,
      load,
      update,
      reset,
      setEnabled,
      enable,
      disable,
      toggle,
      tabActivated,
      iconClicked,
    },
    effects: {
      load: loadFx,
      update: updateFx,
    },
    stores: {
      preferences,
      activeTab,
      activeTabPreferences,
      loading: loadFx.pending,
      updating: updateFx.pending,
    },
  }
}
