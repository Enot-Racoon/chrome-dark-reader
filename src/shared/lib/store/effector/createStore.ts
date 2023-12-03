import type { Store as StoreEffector, Subscription, Unit } from 'effector'
import { createStore as createStoreEffector, createEvent, forward as forwardTo } from 'effector'

export interface Store<T> extends StoreEffector<T> {
  readonly setState: (value: T) => void
  readonly resetState: () => void
  readonly forward: (to: Unit<T>) => Subscription
}

export const createStore = <T>(init: T): Store<T> => {
  const from = createStoreEffector<T>(init)
  const setState = createEvent<T>()
  const resetState = createEvent<void>()
  const forward = (to: Unit<T>): Subscription => forwardTo({ from, to })
  from.on(setState, (_state, payload) => payload).reset(resetState)
  return Object.assign(from, { setState, resetState, forward })
}
