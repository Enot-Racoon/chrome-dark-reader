import {
  createGate,
  createEvent,
  createEffect,
  createStore,
  combine,
  forward,
} from 'shared/lib/store/effector'
import Utils, { pipe } from 'shared/lib/common'
import type Chrome from 'shared/types/chrome'
import type { IStorageRecord } from 'shared/lib/storage'

import type { IPreferences, IHostSettings } from './types'

export * as default from './lib'

export const getTabHost = ({ url }: Chrome.Tab) => (url ? new URL(url).host : '')

const ToggleFlag: TabEnabledType = null
type TabEnabledType = boolean | null

const createEvents = () => {
  const setEnabled = createEvent<[host: string, enabled: TabEnabledType]>()
  const toggle = setEnabled.prepend((host: string) => [host, ToggleFlag])
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
  const activeTab = createStore<Chrome.Tab | null>(null)
  const preferences = createStore<IPreferences>(defaultValue).reset(events.reset)

  return {
    preferences,
    activeTab,
    /* memo( */
    activeTabPreferences: combine(activeTab, preferences, (tab, { hosts }) => {
      const host = tab ? getTabHost(tab) : ''
      return hosts[host] ?? createDefaultHostSettings(host)
    }),
    /* ), */
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

  stores.activeTab.on(events.tabActivated, (_state, payload) => {
    return { ...payload, time: Date.now() }
  })

  stores.preferences.on(events.setEnabled, (state, [host, enabled]) => {
    if (host) {
      if (!state.hosts[host]) {
        state.hosts[host] = createDefaultHostSettings(host)
      }
      const hostState = state.hosts[host]
      state = {
        ...state,
        hosts: {
          ...state.hosts,
          [host]: {
            host: hostState.host,
            enabled: !hostState.enabled,
            styles: hostState.styles,
          },
        },
      }
    }

    Utils.log('lib.ts')(
      'stores.preferences.on(events.setEnabled',
      { host, enabled },
      state.hosts[host]
    )
    return state
  })

  // Sync with store
  stores.preferences.updates.watch(record.set)
  record.addChangeListener(({ newValue }) => void (newValue && events.update(newValue)))

  return { gate, events, effects, stores }
}

const sum = (a: number) => (b: number) => a + b
const sub = (a: number) => (b: number) => a - b
const mul = (a: number) => (b: number) => a * b
const div = (a: number) => (b: number) => a / b

// example
export const x = pipe(sum(10)).to(sub(4)).to(div(2)).to(mul(3)).compute(1)
