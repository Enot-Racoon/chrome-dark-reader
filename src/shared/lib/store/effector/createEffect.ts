export * as default from '.'

import {
  forward as forwardTo,
  createEffect as createEffectEffector,
  restore,
} from 'effector'
import type {
  Effect as EffectEffector,
  Subscription,
  Unit,
  Store,
} from 'effector'

export interface Effect<T, R, E = Error> extends EffectEffector<T, R, E> {
  readonly forward: (to: Unit<T>) => Subscription
  readonly fulfilled: Store<boolean>
  readonly error: Store<E | null>
}

export const createEffect = <T, R, E = Error>(): Effect<T, R, E> => {
  const from = createEffectEffector<T, R, E>()
  const forward = (to: Unit<T>): Subscription => forwardTo({ from, to })
  const fulfilled = restore(from.done.map(Boolean), false).reset(from)
  const error = restore<E>(from.failData, null)
  return Object.assign(from, { forward, fulfilled, error })
}
