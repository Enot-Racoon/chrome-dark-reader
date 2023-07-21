import type { Event, Unit } from 'effector'
import {
  createEvent,
  forward as forwardTo,
  restore as restoreEffector,
  Subscription,
} from 'effector'

import type { Store } from './createStore'

export const restore = <T>(unit: Event<T>, init: T | null): Store<T> => {
  const from = restoreEffector(unit, init as T)
  const setState = createEvent<T>()
  const resetState = createEvent<void>()
  const forward = (to: Unit<T>): Subscription => forwardTo({ from, to })
  from.on(setState, (_state, payload) => payload).reset(resetState)
  return Object.assign(from, { setState, resetState, forward })
}
