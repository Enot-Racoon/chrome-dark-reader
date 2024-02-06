import type { Store } from 'effector'
import { deepEqual } from 'shared/lib/common'

export const memo = <T extends object>(store: Store<T>): Store<T> => {
  return store.map<T>((state, lastState) => {
    if (lastState && deepEqual(state, lastState)) {
      return lastState
    }
    return state
  })
}
