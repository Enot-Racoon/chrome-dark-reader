import type { Event as EventEffector, Subscription, Unit } from 'effector'
import {
  createEvent as createEventEffector,
  forward as forwardTo,
} from 'effector'

export interface Event<T> extends EventEffector<T> {
  readonly forward: (to: Unit<T>) => Subscription
}

export const createEvent = <T>(): Event<T> => {
  const from = createEventEffector<T>()
  const forward = (to: Unit<T>): Subscription => forwardTo({ from, to })
  return Object.assign(from, { forward })
}
