import {
  createGate,
  createEvent,
  createEffect,
  createStore,
  combine,
  sample,
} from '@/shared/lib/store/effector'
import type * as Chrome from '@/shared/types/chrome'
import type { IStorageRecord } from '@/shared/lib/storage'
import { getHostFromUrl, matchHostSettings } from './host'

import type { IPreferences, IHostSettings } from './types'

export const getTabHost = ({ url }: Chrome.Tab): string => getHostFromUrl(url) ?? ''

export const createDefaultHostSettings = (
  host: string,
  enabled = false,
  styles = ''
): IHostSettings => ({ host, enabled, styles })

export const createModel = (record: IStorageRecord<IPreferences>) => {
  const gate = createGate()

  // A click during start-up must not reach storage: the store still holds defaults, and
  // sending them would replace the configuration the record is about to load.
  let hydrated = false
  void record.ready.then(() => {
    hydrated = true
  })

  // Events
  const initialize = createEvent<void>()
  const load = createEvent<void>()
  const update = createEvent<IPreferences>()
  const reset = createEvent<void>()

  const setEnabled = createEvent<[host: string, enabled: boolean | null]>()
  const enable = setEnabled.prepend((host: string) => [host, true])
  const disable = setEnabled.prepend((host: string) => [host, false])
  const toggle = setEnabled.prepend((host: string) => [host, null])

  const patchHost = createEvent<[host: string, settings: IHostSettings]>()
  const removeHost = createEvent<string>()

  const tabActivated = createEvent<Chrome.Tab>()

  // Effects
  const loadFx = createEffect<void, IPreferences>(record.get)
  const updateFx = createEffect<IPreferences, IPreferences>(record.set)

  // Stores
  const activeTab = createStore<Chrome.Tab | null>(null)
  const preferences = createStore<IPreferences>(record.currentValue).reset(reset)

  const activeTabPreferences = combine(activeTab, preferences, (tab, { hosts }) => {
    const host = tab ? getTabHost(tab) : ''
    return matchHostSettings(hosts, host) ?? createDefaultHostSettings(host)
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

  activeTab.on(tabActivated, (_state, payload) => payload)

  preferences.on(setEnabled, (state, [host, enabled]) => {
    if (!host) return state

    // A wildcard entry is inherited by the exact host that is being switched.
    const hostState = matchHostSettings(state.hosts, host) ?? createDefaultHostSettings(host)
    const nextEnabled = enabled === null ? !hostState.enabled : enabled

    return {
      ...state,
      hosts: {
        ...state.hosts,
        [host]: {
          ...hostState,
          host,
          enabled: nextEnabled,
        },
      },
    }
  })

  preferences.on(patchHost, (state, [host, settings]) => {
    if (!host) return state

    return {
      ...state,
      hosts: {
        ...state.hosts,
        [host]: { ...settings, host },
      },
    }
  })

  preferences.on(removeHost, (state, host) => {
    if (!(host in state.hosts)) return state

    const hosts = { ...state.hosts }
    delete hosts[host]

    return { ...state, hosts }
  })

  // Sync with storage. The record turns this into per-host writes only.
  sample({
    clock: preferences.updates,
    filter: () => hydrated,
    target: updateFx,
  })

  record.addChangeListener(({ newValue }) => update(newValue))

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
      patchHost,
      removeHost,
      tabActivated,
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
