import type { Subscription, Unit } from 'effector'
import { forward as forwardTo } from 'effector'

export const forward = <T>(
  from: Unit<T> | ReadonlyArray<Unit<T>>,
  to: Unit<T | void> | ReadonlyArray<Unit<T | void>>
): Subscription => {
  return forwardTo({ from: from as Unit<T>, to })
}
