export * as default from './lib'

import {
  createGate,
  createEvent,
  createEffect,
  createStore,
  combine,
  forward,
} from 'shared/lib/store/effector'
import type Chrome from 'shared/types/chrome'
import type { IStorageRecord } from 'shared/lib/storage'

import type { IPreferences, IHostSettings } from './types'

export const getTabHost = ({ url }: Chrome.Tab) => (url ? new URL(url).host : '')

const createEvents = () => {
  const setEnabled = createEvent<[host: string, enabled: boolean | null]>()
  const toggle = setEnabled.prepend((host: string) => [host, null])
  return {
    initialize: createEvent<void>(),
    load: createEvent<void>(),
    update: createEvent<IPreferences>(),
    reset: createEvent<void>(),
    setEnabled,
    enable: setEnabled.prepend((host: string) => [host, true]),
    disable: setEnabled.prepend((host: string) => [host, false]),
    toggle,
    tabActivated: createEvent<Chrome.Tab>(),
    iconClicked: toggle.prepend<Chrome.Tab>(getTabHost),
  }
}

const createEffects = () => ({
  load: createEffect<void, IPreferences>(),
  update: createEffect<IPreferences, IPreferences>(),
})

type Events = ReturnType<typeof createEvents>
type Effects = ReturnType<typeof createEffects>

export const createDefaultHostSettings = (
  host: string,
  enabled = false,
  styles = ''
): IHostSettings => ({ host, enabled, styles })

const createStores = (events: Events, effects: Effects, defaultValue: IPreferences) => {
  const preferences = createStore<IPreferences>(defaultValue).reset(events.reset)
  const activeTab = createStore<Chrome.Tab | null>(null)

  return {
    preferences,
    activeTab,
    activeTabPreferences: combine(activeTab, preferences, (tab, { hosts }) => {
      return tab ? hosts[getTabHost(tab)] ?? null : null
    }),
    loading: effects.load.pending,
    updating: effects.update.pending,
    ready: combine(
      effects.load.fulfilled,
      effects.update.pending,
      (loaded, saving) => loaded && !saving
    ),
  }
}

export const createModel = (record: IStorageRecord<IPreferences>) => {
  const gate = createGate()

  const events = createEvents()
  const effects = createEffects()
  const stores = createStores(events, effects, record.currentValue)

  effects.load.use(record.get)
  effects.update.use(record.set)

  forward(gate.open, events.load)
  forward(events.initialize, events.load)

  forward(events.load, effects.load)
  forward(events.update, effects.update)
  forward([events.update, effects.load.doneData], stores.preferences)

  forward(events.tabActivated, stores.activeTab)

  stores.preferences.on(events.setEnabled, (state, [host, enabled]) => {
    if (host) {
      if (!state.hosts[host]) {
        state.hosts[host] = createDefaultHostSettings(host)
      }
      // toggle enabled
      state.hosts[host].enabled = !!enabled
    }
    return state
  })

  // Sync with store
  stores.preferences.updates.watch(record.set)
  record.addChangeListener(({ newValue }) => void (newValue && events.update(newValue)))

  return { gate, events, effects, stores }
}
