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
import { delay } from 'shared/lib/common'

const createEvents = () => ({
  initialize: createEvent<void>(),
})
const createEffects = () => ({
  initialize: createEffect<void, void, Error>(),
})
const createStores = (
  events: ReturnType<typeof createEvents>,
  effects: ReturnType<typeof createEffects>
) => ({
  initialized: createStore<boolean>(false),
  initializeError: restore<Error>(effects.initialize.failData, null),
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

  effects.initialize.use(delay.bind(null, 10))

  forward({ from: gate.open, to: events.initialize })
  forward({ from: events.initialize, to: effects.initialize })
  stores.initialized.on(effects.initialize.done, () => true)

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
