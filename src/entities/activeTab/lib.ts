import {
  createEffect,
  createEvent,
  createStore,
  forward,
  restore,
} from 'effector'
import * as ER from 'effector-react'

import {
  createUse,
  createUseEvents,
  createUseGate,
  createUseStores,
} from 'shared/lib/store/model/create-use'
import type { Tab } from 'shared/types/entities'

import * as TabApi from './api'

const createEvents = () => ({
  initialize: createEvent<void>(),
})

const createEffects = () => ({
  initialize: createEffect<void, Tab.ITab | null, Error>(),
})

const createStores = (
  events: ReturnType<typeof createEvents>,
  effects: ReturnType<typeof createEffects>
) => ({
  initialized: createStore<boolean>(false),
  initializeError: restore<Error>(effects.initialize.failData, null),
  activeTab: createStore<Tab.ITab | null>(null),
})

export const createModel = () => {
  const gate = ER.createGate<void>()
  const baseEvents = createEvents()
  const effects = createEffects()
  const stores = createStores(baseEvents, effects)
  const events = {
    ...baseEvents,
    initialized: effects.initialize.doneData,
    initializeError: effects.initialize.failData,
  }

  effects.initialize.use(TabApi.getCurrentTab)

  forward({ from: gate.open, to: events.initialize })
  forward({ from: events.initialize, to: effects.initialize })
  stores.initialized.on(effects.initialize.done, () => true)
  stores.activeTab.on(effects.initialize.doneData, (_, tab) => tab)

  return {
    gate,
    events,
    effects,
    stores,
    useGate: createUseGate(gate),
    useEvents: createUseEvents(events),
    useStores: createUseStores(stores),
    use: createUse(events, stores),
  }
}
