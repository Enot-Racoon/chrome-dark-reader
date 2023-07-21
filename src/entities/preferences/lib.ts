export * as default from './lib'

import {
  createGate,
  createEvent,
  createEffect,
  createStore,
  combine,
  forward,
} from 'shared/lib/store/effector'
import type { IChromeTabActiveInfo } from 'shared/types/chrome'
import type { IStorageRecord } from 'shared/lib/storage'

import type { IPreferences, IHostSettings } from './types'

const createEvents = () => {
  const setEnabled = createEvent<[host: string, enabled: boolean | null]>()
  return {
    initialize: createEvent<void>(),
    load: createEvent<void>(),
    save: createEvent<IPreferences>(),
    reset: createEvent<void>(),
    setEnabled,
    enable: setEnabled.prepend((host: string) => [host, true]),
    disable: setEnabled.prepend((host: string) => [host, false]),
    toggle: setEnabled.prepend((host: string) => [host, null]),
    tabActivated: createEvent<IChromeTabActiveInfo>(),
  }
}

const createEffects = () => ({
  load: createEffect<void, IPreferences>(),
  save: createEffect<IPreferences, IPreferences>(),
})

type Events = ReturnType<typeof createEvents>
type Effects = ReturnType<typeof createEffects>

export const createDefaultHostSettings = (
  host: string, // = location.host, // todo: ???
  enabled = false,
  styles = ''
): IHostSettings => ({ host, enabled, styles })

const createStores = (
  events: Events,
  effects: Effects,
  defaultValue: IPreferences
) => ({
  preferences: createStore<IPreferences>(defaultValue).reset(events.reset),
  activeTab: createStore<IChromeTabActiveInfo | null>(null),
  ready: combine(
    effects.load.fulfilled,
    effects.save.pending,
    (loaded, saving) => loaded && !saving
  ),
})

export const createModel = (record: IStorageRecord<IPreferences>) => {
  const gate = createGate('test123')

  const events = createEvents()
  const effects = createEffects()
  const stores = createStores(events, effects, record.currentValue)

  effects.load.use(record.get.bind(record))
  effects.save.use(record.set.bind(record))

  forward(gate.open, events.load)
  forward(events.initialize, events.load)

  forward(events.load, effects.load)
  forward(events.save, effects.save)
  forward([events.save, effects.load.doneData], stores.preferences)

  forward(events.tabActivated, stores.activeTab)

  stores.preferences.on(events.setEnabled, (state, [host, enabled]) => {
    if (host) {
      const hostSettings: IHostSettings =
        state.hosts[host] ?? createDefaultHostSettings(host)
      return {
        ...state,
        hosts: {
          ...state.hosts,
          [host]: {
            ...hostSettings,
            // toggle settings.enabled if argument enabled is null
            enabled: enabled ?? !hostSettings.enabled,
          },
        },
      }
    }
    return state
  })

  return { gate, events, effects, stores }
}
