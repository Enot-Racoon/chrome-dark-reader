import type { Store } from './createStore'
import {
  combine as combineEffector,
  createEvent,
  Subscription,
  forward as forwardTo,
  Store as StoreEffector,
  Unit,
} from 'effector'

export const combine = <T extends object>(combination: T): Store<T> => {
  const from = combineEffector<T>(combination) as StoreEffector<T>
  const setState = createEvent<T>()
  const resetState = createEvent<void>()
  const forward = (to: Unit<T>): Subscription => forwardTo({ from, to })
  from.on(setState, (_state, payload) => payload).reset(resetState)
  return Object.assign(from, { setState, resetState, forward })
}
